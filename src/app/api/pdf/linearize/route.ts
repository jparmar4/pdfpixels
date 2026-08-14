import {
  loadPdfWithTimeout,
  pdfBinaryResponse,
  readAndValidatePdfFile,
  rejectEncryptedPdf,
  validatePdfUpload,
} from '@/lib/pdf-api';

export const maxDuration = 60;
import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
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
    const proc = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    const timeout = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('PDF linearize operation timed out.'));
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

    const validation = validatePdfUpload(file);
    if (!validation.ok) return validation.response;

    const read = await readAndValidatePdfFile(file!);
    if (!read.ok) return read.response;
    const inputBuffer = read.buffer;

    // Quick check to load up PDF properties (also ensures basic validity)
    const srcPdf = await loadPdfWithTimeout(inputBuffer);
    const encrypted = rejectEncryptedPdf(srcPdf);
    if (encrypted) return encrypted;
    const pageCount = srcPdf.getPageCount();

    const tempDir = os.tmpdir();
    const id = crypto.randomUUID();
    inputPath = path.join(tempDir, `${id}.pdf`);
    outputPath = path.join(tempDir, `${id}-linearized.pdf`);
    fs.writeFileSync(inputPath, inputBuffer);

    // Fast Web View requires qpdf --linearize. Do not pretend pdf-lib object streams are linearized.
    let outputBuffer: Buffer;

    try {
      await runQpdf([
        '--linearize',
        inputPath,
        outputPath,
      ]);
      outputBuffer = fs.readFileSync(outputPath);
    } catch (qpdfErr) {
      const qMsg = qpdfErr instanceof Error ? qpdfErr.message : '';
      if (qMsg.toLowerCase().includes('qpdf is not available') || qMsg.includes('ENOENT') || qMsg.includes('spawn')) {
        return jsonError(
          'Fast Web View needs the qpdf engine, which is not available on this server. Compress PDF can still reduce file size.',
          503,
          qMsg,
        );
      }
      throw qpdfErr;
    }

    return pdfBinaryResponse(outputBuffer, `fast-web-view-${Date.now()}.pdf`, {
        'X-Page-Count': String(pageCount),
        'X-Linearize-Engine': 'qpdf',
    });
  } catch (error) {
    console.error('PDF linearize error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Check for encrypted files failing formatting
    if (message.toLowerCase().includes('encrypted file') || message.toLowerCase().includes('password')) {
       return jsonError('Encrypted PDFs cannot be linearized. Please unlock the PDF first.', 400, message);
    }

    return jsonError('Failed to format PDF for Fast Web View', 500, message);
  } finally {
    try {
      if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    } catch { /* ignore cleanup errors */ }
    try {
      if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch { /* ignore cleanup errors */ }
  }
}
