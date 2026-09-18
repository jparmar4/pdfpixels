import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { loadPdfWithTimeout, readAndValidatePdfFile, sanitizeDownloadFileName, validatePdfUpload } from '@/lib/pdf-api';
import { runGhostscriptWithFallback, runGhostscriptWithFallbackResult } from '@/lib/ghostscript';
import { isQpdfUnavailableError, runQpdf } from '@/lib/qpdf';

import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';


const CACHE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
};

export const runtime = 'nodejs';
export const maxDuration = 60;

/** Thrown when Ghostscript reports the supplied unlock password is wrong. */
class IncorrectPasswordError extends Error {
  constructor() {
    super('The provided PDF password is incorrect.');
    this.name = 'IncorrectPasswordError';
  }
}

/**
 * qpdf rejects an `@path` word it cannot expand (ancient builds predate
 * response-file support). Only in that case is the legacy positional form
 * retried, which briefly exposes the password in the child argv.
 */
function isAtFileUnsupportedError(error: unknown): boolean {
  const message = String((error as Error | null)?.message || '').toLowerCase();
  return message.includes('@') && /unknown|unrecogn|invalid|no such|can't|cannot|not supported/.test(message);
}

/**
 * Encrypt with the passwords supplied via a response file (one password per
 * line) so they never appear in the child process argv, which is visible in
 * host process listings. Falls back to the legacy positional form only when
 * the qpdf build cannot expand `@file` words.
 */
async function runQpdfEncrypt(inputPath: string, outputPath: string, password: string, passwordPath: string) {
  try {
    await runQpdf(['--encrypt', `@${passwordPath}`, '256', '--', inputPath, outputPath], {
      timeoutMessage: 'PDF security operation timed out.',
    });
  } catch (error) {
    if (isAtFileUnsupportedError(error)) {
      await runQpdf(['--encrypt', password, password, '256', '--', inputPath, outputPath], {
        timeoutMessage: 'PDF security operation timed out.',
      });
      return;
    }
    throw error;
  }
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
      passwordPath = path.join(tempDir, `${id}.pwd`);
      // Two lines (user + owner password), NO trailing newline: qpdf expands
      // each line to exactly one argument, and a trailing newline would
      // become a spurious empty argument after the passwords.
      fs.writeFileSync(passwordPath, `${password}\n${password}`, { encoding: 'utf8', mode: 0o600 });
      try {
        await runQpdfEncrypt(inputPath, outputPath, password, passwordPath);
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
        await runQpdf(args, { timeoutMessage: 'PDF security operation timed out.' });
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
    const baseName = file?.name ? file.name.replace(/\.pdf$/i, '') : (action === 'protect' ? 'protected' : 'unlocked');
    const fileName = `${sanitizeDownloadFileName(baseName)}-${action === 'protect' ? 'protected' : 'unlocked'}.pdf`;

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