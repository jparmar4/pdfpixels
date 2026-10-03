import { apiError, apiInternalError } from '@/lib/api-response';
import { openEditablePdf, parsePageSelection, pdfBinaryResponse, sanitizeDownloadFileName } from '@/lib/pdf-api';
import { NextRequest } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const pagesInput = (formData.get('pages') as string) || '';

    if (pagesInput.length > 2000) {
      return apiError('Page selection is too long. Keep it under 2000 characters.', 413);
    }

    const opened = await openEditablePdf(file);
    if (!opened.ok) return opened.response;
    const { pdf } = opened;

    const totalPages = pdf.getPageCount();
    const selectedIndices = parsePageSelection(pagesInput, totalPages);

    if (selectedIndices.length === 0) {
      return apiError('No valid pages selected for extraction', 400);
    }

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(pdf, selectedIndices);
    copiedPages.forEach((p) => newDoc.addPage(p));

    const outBytes = await newDoc.save();
    const baseName = file?.name ? file.name.replace(/\.pdf$/i, '') : 'document';
    const fileName = sanitizeDownloadFileName(`${baseName}-extracted.pdf`);

    return pdfBinaryResponse(outBytes, fileName, {
      'x-page-count': String(selectedIndices.length),
      'x-total-pages': String(totalPages),
    });
  } catch (error) {
    return apiInternalError(error, 'Failed to extract PDF pages', 'PDF extract error');
  }
}
