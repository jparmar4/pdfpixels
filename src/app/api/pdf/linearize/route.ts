import {
  loadPdfWithTimeout,
  pdfBinaryResponse,
  readAndValidatePdfFile,
  rejectEncryptedPdf,
  sanitizeDownloadFileName,
  validatePdfUpload,
} from '@/lib/pdf-api';

export const maxDuration = 60;
import { runGhostscriptWithFallback } from '@/lib/ghostscript';
import { runQpdf } from '@/lib/qpdf';
import { apiInternalError } from '@/lib/api-response';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
const CACHE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
};

export const runtime = 'nodejs';

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
      await runQpdf(
        [
          '--linearize',
          inputPath,
          outputPath,
        ],
        { timeoutMessage: 'PDF linearize operation timed out.' },
      );
      outputBuffer = fs.readFileSync(outputPath);
    } catch (qpdfErr) {
      const qMsg = qpdfErr instanceof Error ? qpdfErr.message : '';
      if (qMsg.toLowerCase().includes('qpdf is not available') || qMsg.includes('ENOENT') || qMsg.includes('spawn')) {
        // qpdf missing on this host? Ghostscript's pdfwrite can emit Fast Web View too.
        console.warn('qpdf unavailable, falling back to Ghostscript fast web view');
        try {
          await runGhostscriptWithFallback([
            '-sDEVICE=pdfwrite',
            '-dFastWebView=true',
            '-dNOPAUSE',
            '-dBATCH',
            '-dQUIET',
            `-sOutputFile=${outputPath}`,
            inputPath,
          ], { timeoutMs: 45_000, timeoutMessage: 'PDF linearize operation timed out.' });
          outputBuffer = fs.readFileSync(outputPath);
        } catch (gsErr) {
          console.warn('Ghostscript fast web view fallback failed:', gsErr);
          return jsonError(
            'Fast Web View needs the qpdf engine, which is not available on this server. Compress PDF can still reduce file size.',
            503,
            qMsg,
          );
        }
      } else {
        throw qpdfErr;
      }
    }

    const baseName = file?.name ? file.name.replace(/\.pdf$/i, '') : 'document';
    const fileName = `${sanitizeDownloadFileName(baseName)}-linearized.pdf`;

    return pdfBinaryResponse(outputBuffer, fileName, {
        'X-Page-Count': String(pageCount),
        'X-Linearize-Engine': 'qpdf',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';

    // Check for encrypted files failing formatting
    if (message.toLowerCase().includes('encrypted file') || message.toLowerCase().includes('password')) {
       return jsonError('Encrypted PDFs cannot be linearized. Please unlock the PDF first.', 400);
    }

    return apiInternalError(error, 'Failed to format PDF for Fast Web View', 'PDF linearize error');
  } finally {
    try {
      if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    } catch { /* ignore cleanup errors */ }
    try {
      if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch { /* ignore cleanup errors */ }
  }
}
