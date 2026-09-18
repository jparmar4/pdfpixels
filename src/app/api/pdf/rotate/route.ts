import { apiError, apiInternalError } from '@/lib/api-response';
import { openEditablePdf, parsePageSelection, pdfBinaryResponse, sanitizeDownloadFileName } from '@/lib/pdf-api';
import { NextRequest } from 'next/server';
import { degrees } from 'pdf-lib';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const angleInput = formData.get('angle');
    const angleRaw = angleInput === null || angleInput === '' ? 90 : parseInt(String(angleInput), 10);
    if (!Number.isFinite(angleRaw) || angleRaw % 90 !== 0) {
      return apiError('Rotation angle must be a multiple of 90 (e.g. 90, 180, 270).', 400);
    }
    const angle = ((angleRaw % 360) + 360) % 360;
    const pages = String(formData.get('pages') || 'all');
    if (pages.length > 2000) {
      return apiError('Page selection is too long. Keep it under 2000 characters.', 413);
    }

    const opened = await openEditablePdf(file);
    if (!opened.ok) return opened.response;
    const { pdf } = opened;
    const totalPages = pdf.getPageCount();

    const pageIndices = parsePageSelection(pages, totalPages);
    if (pageIndices.length === 0) {
      return apiError('No valid pages selected to rotate. Use formats like 1,3,5-7 or all.', 400);
    }

    for (const idx of pageIndices) {
      const page = pdf.getPage(idx);
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((((currentRotation + angle) % 360) + 360) % 360));
    }

    const savedPdfBytes = await pdf.save();
    const baseName = file?.name ? file.name.replace(/\.pdf$/i, '') : 'document';
    const fileName = `${baseName}-rotated.pdf`;
    return pdfBinaryResponse(savedPdfBytes, sanitizeDownloadFileName(fileName), {
      'X-Page-Count': String(totalPages),
      'X-Rotated-Pages': pageIndices.map((i) => i + 1).join(','),
      'X-Rotation-Angle': String(angle),
    });
  } catch (error) {
    return apiInternalError(error, 'Failed to rotate PDF', 'PDF rotate error');
  }
}
