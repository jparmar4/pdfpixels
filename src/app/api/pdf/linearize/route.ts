import { loadPdfWithTimeout, pdfBinaryResponse } from '@/lib/pdf-api';

export const maxDuration = 60;
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
      reject(new Error('PDF linearize operation timed out.'));
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
    
    // Quick check to load up PDF properties (also ensures basic validity)
    const srcPdf = await loadPdfWithTimeout(inputBuffer);
    const pageCount = srcPdf.getPageCount();

    const tempDir = os.tmpdir();
    const id = crypto.randomUUID();
    inputPath = path.join(tempDir, `${id}.pdf`);
    outputPath = path.join(tempDir, `${id}-linearized.pdf`);
    fs.writeFileSync(inputPath, inputBuffer);

    // Run linearization
    await runQpdf([
      '--linearize',
      inputPath,
      outputPath,
    ]);

    const outputBuffer = fs.readFileSync(outputPath);
    return pdfBinaryResponse(outputBuffer, `fast-web-view-${Date.now()}.pdf`, {
        'X-Page-Count': String(pageCount),
    });
  } catch (error) {
    console.error('PDF linearize error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.toLowerCase().includes('qpdf is not available')) {
      return jsonError('Wait, PDF engine is not available in the current environment.', 503, message);
    }
    
    // Check for encrypted files failing formatting
    if (message.toLowerCase().includes('encrypted file') || message.toLowerCase().includes('password')) {
       return jsonError('Encrypted PDFs cannot be linearized. Please unlock the PDF first.', 400, message);
    }

    return jsonError('Failed to format PDF for Fast Web View', 500, message);
  } finally {
    if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
}
