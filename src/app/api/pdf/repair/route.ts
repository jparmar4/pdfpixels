import { apiError, apiInternalError } from '@/lib/api-response';
import { PDFDocument } from 'pdf-lib';
import { NextRequest, NextResponse } from 'next/server';
import {
  PDF_CACHE_HEADERS,
  readAndValidatePdfFile,
  sanitizeDownloadFileName,
  validatePdfUpload,
} from '@/lib/pdf-api';

export const maxDuration = 120;
export const runtime = 'nodejs';

/**
 * Attempts progressively more tolerant load strategies until one succeeds.
 */
async function loadWithRecovery(buffer: Buffer): Promise<{ pdf: PDFDocument; strategy: string }> {
  // 1. Standard load.
  try {
    const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true, updateMetadata: false });
    if (pdf.getPageCount() > 0) return { pdf, strategy: 'standard' };
  } catch {
    // fall through
  }
  // 2. Ignore encrypted + invalid objects (broken xref, bad streams).
  try {
    const pdf = await PDFDocument.load(buffer, {
      ignoreEncryption: true,
      updateMetadata: false,
      throwOnInvalidObject: false,
    } as never);
    if (pdf.getPageCount() > 0) return { pdf, strategy: 'lenient' };
  } catch {
    // fall through
  }
  // 3. Byte-window recovery: if the file is truncated mid-object, pdf-lib can
  //    sometimes parse the intact prefix. Trim trailing garbage progressively.
  for (const cut of [1024, 16 * 1024, 256 * 1024, 1024 * 1024]) {
    if (buffer.length <= cut) break;
    try {
      const pdf = await PDFDocument.load(buffer.subarray(0, buffer.length - cut), {
        ignoreEncryption: true,
        updateMetadata: false,
        throwOnInvalidObject: false,
      } as never);
      if (pdf.getPageCount() > 0) return { pdf, strategy: `trimmed-${cut}` };
    } catch {
      // try smaller cut
    }
  }
  throw new Error('unrecoverable');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    const validation = validatePdfUpload(file);
    if (!validation.ok) return validation.response;
    const read = await readAndValidatePdfFile(file!);
    if (!read.ok) return read.response;
    const { buffer } = read;

    if (buffer.length < 100) {
      return apiError('This file is too small to contain a recoverable PDF.', 400);
    }

    let result: { pdf: PDFDocument; strategy: string };
    try {
      result = await loadWithRecovery(buffer);
    } catch {
      return apiError(
        'This PDF could not be repaired. The damage destroyed the page data itself — try recovering an earlier copy.',
        422,
      );
    }

    const { pdf, strategy } = result;

    // Rebuild into a fresh document so broken structures are replaced.
    const out = await PDFDocument.create();
    const pages = await out.copyPages(pdf, pdf.getPageIndices());
    for (const page of pages) out.addPage(page);

    if (out.getPageCount() === 0) {
      return apiError('No readable pages could be recovered from this PDF.', 422);
    }

    const bytes = await out.save({ useObjectStreams: false });
    const baseName = (file?.name ?? 'repaired.pdf').replace(/\.pdf$/i, '');
    return new NextResponse(bytes as unknown as BodyInit, {
      status: 200,
      headers: {
        ...PDF_CACHE_HEADERS,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${sanitizeDownloadFileName(`${baseName}-repaired.pdf`)}"`,
        'x-repair-strategy': strategy,
      },
    });
  } catch (error) {
    return apiInternalError(error, 'Failed to repair PDF', 'Repair PDF error');
  }
}
