import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { loadPdfWithTimeout, readAndValidatePdfFile, validatePdfUpload } from '@/lib/pdf-api';
import { runGhostscriptWithFallback, runGhostscriptWithFallbackResult } from '@/lib/ghostscript';

import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';


const CACHE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
};

export const runtime = 'nodejs';

/** Thrown when Ghostscript reports the supplied unlock password is wrong. */
class IncorrectPasswordError extends Error {
  constructor() {
    super('The provided PDF password is incorrect.');
    this.name = 'IncorrectPasswordError';
  }
}

/** Same engine-unavailable pattern linearize uses for qpdf (ENOENT / spawn miss / sentinel). */
function isQpdfUnavailableError(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException | null)?.code;
  const message = String((error as Error | null)?.message || '');
  return (
    code === 'ENOENT' ||
    message.includes('not recognized') ||
    message.includes('spawn') ||
    message.includes('qpdf is not available')
  );
}

function getQpdfCandidates() {
  const configured = process.env.QPDF_PATH?.trim();

  if (process.platform !== 'win32') {
    return [configured, 'qpdf'].filter(Boolean) as string[];
  }

  return [
    configured,
    'C:\\Program Files\\qpdf 12.2.0\\bin\\qpdf.exe',
    'C:\\Program Files\\qpdf 12.1.0\\bin\\qpdf.exe',
    'C:\\Program Files\\qpdf 11.9.1\\bin\\qpdf.exe',
    'qpdf',
  ].filter(Boolean) as string[];
}

function runCommand(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    const timeout = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('PDF security operation timed out.'));
    }, 45_000);

    proc.stderr.on('data', (chunk) => {
      if (stderr.length < 16 * 1024) {
        stderr += chunk.toString();
      }
    });

    proc.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr.trim() || `qpdf failed with exit code ${code}`));
    });
  });
}

async function runQpdf(args: string[]) {
  let lastError: Error | NodeJS.ErrnoException | null = null;

  for (const candidate of getQpdfCandidates()) {
    try {
      await runCommand(candidate, args);
      return;
    } catch (error) {
      lastError = error as Error | NodeJS.ErrnoException;
      const errno = lastError as NodeJS.ErrnoException;
      const message = `${lastError.message || ''}`;
      if (errno.code === 'ENOENT' || message.includes('not recognized') || message.includes('spawn')) {
        continue;
      }
      throw lastError;
    }
  }

  throw lastError ?? new Error('qpdf is not available in the current environment.');
}

/**
 * Ghostscript fallback for protect when qpdf is missing. Prefer AES-256 (R=6)
 * and downgrade to R=3/128-bit only when the installed gs refuses it (older
 * gs pdfwrite builds answer "Encryption revisions 2 and 3 are only supported").
 * R=3 output is still enforced by pdf.js and mainstream viewers, but qpdf's
 * AES-256 remains the preferred primary engine.
 */
async function runGhostscriptProtect(inputPath: string, outputPath: string, password: string) {
  const baseArgs = [
    '-sDEVICE=pdfwrite',
    '-dNOPAUSE',
    '-dBATCH',
    '-dQUIET',
    `-sOwnerPassword=${password}`,
    `-sUserPassword=${password}`,
    `-sOutputFile=${outputPath}`,
    inputPath,
  ];
  try {
    await runGhostscriptWithFallback([
      '-dCompatibilityLevel=1.7',
      ...baseArgs.slice(0, 3),
      ...baseArgs.slice(3, 6),
      '-dEncryptionR=6',
      '-dKeyLength=256',
      '-dPermissions=-1',
      ...baseArgs.slice(6),
    ], { timeoutMs: 45_000, timeoutMessage: 'PDF security operation timed out.' });
    return;
  } catch (aesError) {
    const aesMessage = String((aesError as Error | null)?.message || '');
    if (!/encryption revision/i.test(aesMessage)) throw aesError;
  }
  await runGhostscriptWithFallback([
    '-dCompatibilityLevel=1.4',
    ...baseArgs.slice(0, 3),
    ...baseArgs.slice(3, 6),
    '-dEncryptionR=3',
    '-dKeyLength=128',
    ...baseArgs.slice(6),
  ], { timeoutMs: 45_000, timeoutMessage: 'PDF security operation timed out.' });
}

/** Ghostscript fallback for unlock when qpdf is missing (re-emits decrypted). */
async function runGhostscriptUnlock(inputPath: string, outputPath: string, password: string) {
  // gs cannot decrypt without the password; callers guarantee password is set
  // for encrypted inputs (see the PASSWORD_REQUIRED pre-check below).
  const args = password ? [`-sPDFPassword=${password}`] : [];
  args.push(
    '-sDEVICE=pdfwrite',
    '-dEncryptionR=0',
    '-dNOPAUSE',
    '-dBATCH',
    '-dQUIET',
    `-sOutputFile=${outputPath}`,
    inputPath,
  );
  const { stderr, stdout } = await runGhostscriptWithFallbackResult(args, { timeoutMs: 45_000, timeoutMessage: 'PDF security operation timed out.' });
  // Ghostscript exits 0 even when the password is wrong — it just emits a
  // garbage undecryptable file. The only signal is stderr ("Password did not
  // work" / "Cannot decrypt PDF file"), so treat that as a wrong password
  // instead of returning a corrupted PDF with 200.
  if (/password did not work|cannot decrypt|invalid password|password.{0,20}required|need a password/i.test(`${stderr}\n${stdout}`)) {
    throw new IncorrectPasswordError();
  }
}


export async function POST(request: NextRequest) {
  let inputPath = '';
  let outputPath = '';
  let passwordPath = '';

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const action = (formData.get('action') as string) || 'protect';
    const password = (formData.get('password') as string) || '';

    const validation = validatePdfUpload(file);
    if (!validation.ok) return validation.response;

    if (action !== 'protect' && action !== 'unlock') {
      return apiError('Unsupported PDF security action');
    }

    if (action === 'protect') {
      if (password.length < 4) {
        return apiError('Please enter a password with at least 4 characters');
      }
      if (password.length > 128) {
        return apiError('Password is too long (128 characters max)');
      }
      if (/[\r\n\0]/.test(password)) {
        return apiError('Password contains invalid characters');
      }
      if (password.startsWith('-')) {
        return apiError('Password cannot start with a dash (-).');
      }
    } else if (password && (/[\r\n\0]/.test(password) || password.length > 128)) {
      return apiError('Password is invalid');
    }

    const read = await readAndValidatePdfFile(file!);
    if (!read.ok) return read.response;
    const inputBuffer = read.buffer;

    const srcPdf = await loadPdfWithTimeout(inputBuffer, { ignoreEncryption: true });
    const pageCount = srcPdf.getPageCount();

    if (action === 'protect' && srcPdf.isEncrypted) {
      return apiError('This PDF is already password-protected. Unlock it first, then protect it again.', 400);
    }

    const tempDir = os.tmpdir();
    const id = crypto.randomUUID();
    inputPath = path.join(tempDir, `${id}.pdf`);
    outputPath = path.join(tempDir, `${id}-${action}.pdf`);
    fs.writeFileSync(inputPath, inputBuffer);

    if (action === 'protect') {
      // qpdf requires encrypt passwords as arguments; unlock uses a temp file instead.
      try {
        await runQpdf([
          '--encrypt',
          password,
          password,
          '256',
          '--',
          inputPath,
          outputPath,
        ]);
      } catch (qpdfError) {
        // qpdf missing on this host? Re-encrypt with Ghostscript (AES-256, R=6).
        if (!isQpdfUnavailableError(qpdfError)) throw qpdfError;
        console.warn('qpdf unavailable, falling back to Ghostscript encryption');
        await runGhostscriptProtect(inputPath, outputPath, password);
      }
    } else if (action === 'unlock') {
      const args = ['--decrypt', inputPath, outputPath];
      if (password) {
        passwordPath = path.join(tempDir, `${id}.pwd`);
        fs.writeFileSync(passwordPath, password, { encoding: 'utf8', mode: 0o600 });
        args.unshift(`--password-file=${passwordPath}`);
      }
      try {
        await runQpdf(args);
      } catch (qpdfError) {
        if (!isQpdfUnavailableError(qpdfError)) throw qpdfError;
        // gs can only re-emit a decrypted copy when it can OPEN the input, which
        // requires the password for encrypted files.
        if (srcPdf.isEncrypted && !password) {
          return apiError('This PDF requires a valid password before it can be unlocked.', 401, 'PASSWORD_REQUIRED');
        }
        console.warn('qpdf unavailable, falling back to Ghostscript decryption');
        try {
          await runGhostscriptUnlock(inputPath, outputPath, password);
        } catch (gsError) {
          const gsMessage = String((gsError as Error | null)?.message || '');
          if (gsMessage.toLowerCase().includes('password')) throw new IncorrectPasswordError();
          throw gsError;
        }
      }
    }

    const outputBuffer = fs.readFileSync(outputPath);
    const fileName = `${action === 'protect' ? 'protected' : 'unlocked'}-${Date.now()}.pdf`;

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        ...CACHE_HEADERS,
        'X-Page-Count': String(pageCount),
        'X-Action': action,
      },
    });
  } catch (error) {
    console.error('PDF protect/unlock error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.toLowerCase().includes('invalid password') || (error instanceof IncorrectPasswordError)) {
      return apiError('The provided PDF password is incorrect.', 401, 'INVALID_PASSWORD');
    }

    if (message.toLowerCase().includes('encrypted file')) {
      return apiError('This PDF requires a valid password before it can be unlocked.', 401, 'PASSWORD_REQUIRED');
    }

    if (
      message.toLowerCase().includes('qpdf is not available') ||
      message.includes('No PDF security engine is available') ||
      message.toLowerCase().includes('ghostscript is not available')
    ) {
      return apiError('PDF security engine is not available in the current environment.', 503, 'ENGINE_UNAVAILABLE');
    }

    return apiError('Failed to process PDF security settings', 500, 'SECURITY_FAILED');
  } finally {
    try {
      if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    } catch { /* ignore cleanup errors */ }
    try {
      if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch { /* ignore cleanup errors */ }
    try {
      if (passwordPath && fs.existsSync(passwordPath)) fs.unlinkSync(passwordPath);
    } catch { /* ignore cleanup errors */ }
  }
}