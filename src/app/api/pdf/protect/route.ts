import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { PDFDocument } from 'pdf-lib';

const CACHE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
};

export const runtime = 'nodejs';

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
    const proc = spawn(command, args);
    let stderr = '';
    const timeout = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('PDF security operation timed out.'));
    }, 45_000);

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
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

function jsonError(message: string, status = 400, details?: string) {
  return NextResponse.json(
    details ? { error: message, details } : { error: message },
    { status, headers: CACHE_HEADERS },
  );
}

export async function POST(request: NextRequest) {
  let inputPath = '';
  let outputPath = '';

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const action = (formData.get('action') as string) || 'protect';
    const password = (formData.get('password') as string) || '';

    if (!file) {
      return jsonError('No PDF file provided');
    }

    if (file.type && file.type !== 'application/pdf') {
      return jsonError('Only PDF files are supported');
    }

    if (file.size > 25 * 1024 * 1024) {
      return jsonError('File too large (25MB max)');
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const srcPdf = await PDFDocument.load(inputBuffer, { ignoreEncryption: true });
    const pageCount = srcPdf.getPageCount();

    if (action === 'protect' && password.length < 4) {
      return jsonError('Please enter a password with at least 4 characters');
    }

    const tempDir = os.tmpdir();
    const id = crypto.randomUUID();
    inputPath = path.join(tempDir, `${id}.pdf`);
    outputPath = path.join(tempDir, `${id}-${action}.pdf`);
    fs.writeFileSync(inputPath, inputBuffer);

    if (action === 'protect') {
      await runQpdf([
        '--encrypt',
        password,
        password,
        '256',
        '--',
        inputPath,
        outputPath,
      ]);
    } else if (action === 'unlock') {
      const args = password
        ? ['--password=' + password, '--decrypt', inputPath, outputPath]
        : ['--decrypt', inputPath, outputPath];
      await runQpdf(args);
    } else {
      return jsonError('Unsupported PDF security action');
    }

    const outputBuffer = fs.readFileSync(outputPath);
    const base64 = outputBuffer.toString('base64');
    const dataUrl = `data:application/pdf;base64,${base64}`;

    return NextResponse.json(
      {
        success: true,
        pdfUrl: dataUrl,
        fileName: `${action === 'protect' ? 'protected' : 'unlocked'}-${Date.now()}.pdf`,
        pageCount,
        action,
      },
      { headers: CACHE_HEADERS },
    );
  } catch (error) {
    console.error('PDF protect/unlock error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.toLowerCase().includes('invalid password')) {
      return jsonError('The provided PDF password is incorrect.', 401, message);
    }

    if (message.toLowerCase().includes('encrypted file')) {
      return jsonError('This PDF requires a valid password before it can be unlocked.', 401, message);
    }

    if (message.toLowerCase().includes('qpdf is not available')) {
      return jsonError('PDF security engine is not available in the current environment.', 503, message);
    }

    return jsonError('Failed to process PDF security settings', 500, message);
  } finally {
    if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
}