import { apiError } from '@/lib/api-response';
import { openEditablePdf, pdfBinaryResponse, sanitizeDownloadFileName } from '@/lib/pdf-api';
import { NextRequest } from 'next/server';
import { rgb, StandardFonts } from 'pdf-lib';

export const maxDuration = 60;
export const runtime = 'nodejs';

type BatesPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    const prefix = String(formData.get('prefix') || '').trim();
    const suffix = String(formData.get('suffix') || '').trim();
    const startNumber = Number(formData.get('startNumber') ?? '1');
    const padding = Math.max(1, Math.min(10, parseInt(String(formData.get('padding') || '6'), 10) || 6));
    const position = (String(formData.get('position') || 'bottom-right').toLowerCase() as BatesPosition);
    const fontSize = Math.max(6, Math.min(24, parseFloat(String(formData.get('fontSize') || '10')) || 10));
    const banner = String(formData.get('banner') || '').trim();

    const opened = await openEditablePdf(file);
    if (!opened.ok) return opened.response;
    const { pdf } = opened;

    const font = await pdf.embedFont(StandardFonts.HelveticaBold);
    const totalPages = pdf.getPageCount();
    if (!Number.isSafeInteger(startNumber) || startNumber < 0 || !Number.isSafeInteger(startNumber + totalPages - 1)) return apiError('Start number must be a non-negative safe integer.', 400);
    const margin = 36; // 0.5 inch

    for (let i = 0; i < totalPages; i++) {
      const page = pdf.getPage(i);
      const { x: originX, y: originY, width, height } = page.getCropBox();
      const currentNum = startNumber + i;
      const paddedNum = String(currentNum).padStart(padding, '0');
      const batesLabel = `${prefix}${paddedNum}${suffix}`;
      const displayText = banner ? `${banner} | ${batesLabel}` : batesLabel;

      let textWidth: number;
      try { textWidth = font.widthOfTextAtSize(displayText, fontSize); } catch { return apiError('Use Latin characters in Bates labels and banners.', 400); }
      const fittedSize = Math.min(fontSize, fontSize * Math.max(1, width - margin * 2) / Math.max(1, textWidth));
      if (fittedSize < 6 || height < margin * 2 + fittedSize) return apiError('Bates label is too long or the page is too small. Shorten the label.', 400);
      textWidth = font.widthOfTextAtSize(displayText, fittedSize);
      const textHeight = font.heightAtSize(fittedSize);

      let x = margin;
      let y = margin;

      switch (position) {
        case 'top-left':
          x = margin;
          y = height - margin - textHeight;
          break;
        case 'top-center':
          x = (width - textWidth) / 2;
          y = height - margin - textHeight;
          break;
        case 'top-right':
          x = width - margin - textWidth;
          y = height - margin - textHeight;
          break;
        case 'bottom-left':
          x = margin;
          y = margin;
          break;
        case 'bottom-center':
          x = (width - textWidth) / 2;
          y = margin;
          break;
        case 'bottom-right':
        default:
          x = width - margin - textWidth;
          y = margin;
          break;
      }

      x += originX;
      y += originY;
      // Draw subtle white backing rectangle for legibility over colored exhibits
      page.drawRectangle({
        x: Math.max(0, x - 4),
        y: Math.max(0, y - 2),
        width: textWidth + 8,
        height: textHeight + 4,
        color: rgb(1, 1, 1),
        opacity: 0.9,
      });

      page.drawText(displayText, {
        x: Math.max(0, x),
        y: Math.max(0, y),
        size: fittedSize,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
    }

    const outBytes = await pdf.save();
    const baseName = file?.name ? file.name.replace(/\.pdf$/i, '') : 'document';
    const fileName = `${sanitizeDownloadFileName(baseName)}-bates-stamped.pdf`;

    return pdfBinaryResponse(outBytes, fileName, {
      'x-bates-start': String(startNumber),
      'x-bates-end': String(startNumber + totalPages - 1),
      'x-bates-pages': String(totalPages),
    });
  } catch (error) {
    console.error('Bates numbering error:', error);
    return apiError(error instanceof Error ? error.message : 'Failed to apply Bates numbering', 500);
  }
}
