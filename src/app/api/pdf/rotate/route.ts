import { apiError } from '@/lib/api-response';
import { openEditablePdf, parsePageSelection, pdfBinaryResponse } from '@/lib/pdf-api';
import { NextRequest } from 'next/server';
import { degrees } from 'pdf-lib';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const angleRaw = parseInt(String(formData.get('angle') ?? '90'), 10);
    const angle = Number.isFinite(angleRaw) ? angleRaw : 90;
    const pages = String(formData.get('pages') || 'all');

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
    return pdfBinaryResponse(savedPdfBytes, `rotated-${Date.now()}.pdf`, {
      'X-Page-Count': String(totalPages),
      'X-Rotated-Pages': pageIndices.map((i) => i + 1).join(','),
      'X-Rotation-Angle': String(angle),
    });
  } catch (error) {
    console.error('PDF rotate error:', error);
    return apiError('Failed to rotate PDF', 500);
  }
}
