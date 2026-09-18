import { apiError, apiInternalError } from '@/lib/api-response';
import { openEditablePdf, parsePageSelection, pdfBinaryResponse, sanitizeDownloadFileName } from '@/lib/pdf-api';
import { NextRequest } from 'next/server';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const pagesInput = (formData.get('pages') as string) || 'all';

    // Either margins: { top, right, bottom, left } (in points) or absolute box { x, y, width, height }
    const topMargin = parseFloat(String(formData.get('top') || '0'));
    const rightMargin = parseFloat(String(formData.get('right') || '0'));
    const bottomMargin = parseFloat(String(formData.get('bottom') || '0'));
    const leftMargin = parseFloat(String(formData.get('left') || '0'));

    const customX = formData.get('x') !== null ? parseFloat(String(formData.get('x'))) : null;
    const customY = formData.get('y') !== null ? parseFloat(String(formData.get('y'))) : null;
    const customW = formData.get('width') !== null ? parseFloat(String(formData.get('width'))) : null;
    const customH = formData.get('height') !== null ? parseFloat(String(formData.get('height'))) : null;

    const opened = await openEditablePdf(file);
    if (!opened.ok) return opened.response;
    const { pdf } = opened;

    const totalPages = pdf.getPageCount();
    let targetPages: number[] = [];

    if (pagesInput.toLowerCase() === 'all') {
      targetPages = Array.from({ length: totalPages }, (_, i) => i);
    } else if (pagesInput.toLowerCase() === 'odd') {
      targetPages = Array.from({ length: totalPages }, (_, i) => i).filter(i => (i + 1) % 2 !== 0);
    } else if (pagesInput.toLowerCase() === 'even') {
      targetPages = Array.from({ length: totalPages }, (_, i) => i).filter(i => (i + 1) % 2 === 0);
    } else {
      targetPages = parsePageSelection(pagesInput, totalPages);
    }

    if (targetPages.length === 0) {
      return apiError('No valid pages selected.', 400);
    }

    if (![topMargin, rightMargin, bottomMargin, leftMargin].every(v => Number.isFinite(v) && v >= 0) || [customX, customY, customW, customH].some(v => v !== null && !Number.isFinite(v))) return apiError('Crop dimensions must be finite, non-negative numbers.', 400);

    for (const pageIdx of targetPages) {
      const page = pdf.getPage(pageIdx);
      const { x: originX, y: originY, width, height } = page.getCropBox();

      let cropX = 0;
      let cropY = 0;
      let cropWidth = width;
      let cropHeight = height;

      if (customX !== null && customY !== null && customW !== null && customH !== null) {
        // Absolute box supplied
        cropX = Math.max(0, customX);
        cropY = Math.max(0, customY);
        cropWidth = Math.min(width - cropX, customW);
        cropHeight = Math.min(height - cropY, customH);
      } else {
        // Margins supplied
        cropX = Math.max(0, leftMargin);
        cropY = Math.max(0, bottomMargin);
        cropWidth = width - leftMargin - rightMargin;
        cropHeight = height - topMargin - bottomMargin;
      }

      if (cropWidth > 0 && cropHeight > 0) {
        page.setCropBox(originX + cropX, originY + cropY, cropWidth, cropHeight);
      } else {
        return apiError('Crop margins leave no visible page area.', 400);
      }
    }

    const outBytes = await pdf.save();
    const baseName = file?.name ? file.name.replace(/\.pdf$/i, '') : 'document';
    const fileName = `${sanitizeDownloadFileName(baseName)}-cropped.pdf`;

    return pdfBinaryResponse(outBytes, fileName);
  } catch (error) {
    return apiInternalError(error, 'Failed to crop PDF', 'PDF crop error');
  }
}
