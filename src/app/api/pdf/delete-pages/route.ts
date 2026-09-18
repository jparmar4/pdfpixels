import { apiError, apiInternalError } from '@/lib/api-response';
import {
  openEditablePdf,
  parsePageSelection,
  pdfBinaryResponse,
  sanitizeDownloadFileName,
} from '@/lib/pdf-api';
import { NextRequest } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const pagesToDelete = String(formData.get('pages') || '');

    if (!pagesToDelete.trim()) {
      return apiError('No pages specified for deletion', 400);
    }

    const opened = await openEditablePdf(file);
    if (!opened.ok) return opened.response;
    const sourcePdf = opened.pdf;
    const totalPages = sourcePdf.getPageCount();

    const deleteIndices = parsePageSelection(pagesToDelete, totalPages);
    if (deleteIndices.length === 0) {
      return apiError('No valid pages found to delete. Use formats like 1,3,5-7.', 400);
    }

    if (deleteIndices.length >= totalPages) {
      return apiError('Cannot delete all pages from a PDF', 400);
    }

    const deleteSet = new Set(deleteIndices);
    const keepIndices = Array.from({ length: totalPages }, (_, i) => i).filter((i) => !deleteSet.has(i));

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(sourcePdf, keepIndices);
    for (const page of copiedPages) {
      newPdf.addPage(page);
    }

    const savedPdfBytes = await newPdf.save();
    const baseName = file?.name ? file.name.replace(/\.pdf$/i, '') : 'document';
    const fileName = `${baseName}-deleted-pages.pdf`;
    return pdfBinaryResponse(savedPdfBytes, sanitizeDownloadFileName(fileName), {
      'X-OriginalPageCount': String(totalPages),
      'X-DeletedPages': deleteIndices.map((i) => i + 1).join(','),
      'X-RemainingPageCount': String(keepIndices.length),
    });
  } catch (error) {
    return apiInternalError(error, 'Failed to delete pages', 'PDF delete pages error');
  }
}
