import { apiError, apiInternalError } from '@/lib/api-response';
import { openEditablePdf, pdfBinaryResponse, sanitizeDownloadFileName } from '@/lib/pdf-api';
import { NextRequest } from 'next/server';
import { rgb, StandardFonts } from 'pdf-lib';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const rawPosition = ((formData.get('position') as string) || 'bottom-center').toLowerCase();
        const position = [
          'bottom-center',
          'bottom-left',
          'bottom-right',
          'top-center',
          'top-left',
          'top-right',
        ].includes(rawPosition)
          ? rawPosition
          : 'bottom-center';
        const rawFormat = String(formData.get('format') ?? '{n}');
        if (rawFormat.length > 100) {
          return apiError('Page number format is too long (100 characters max).', 400);
        }
        const format = rawFormat || '{n}';
        const marginRaw = parseInt(String(formData.get('margin') ?? ''), 10);
        const margin = Number.isFinite(marginRaw) ? Math.max(0, Math.min(200, marginRaw)) : 30;
        const fontSizeRaw = parseInt(String(formData.get('fontSize') ?? ''), 10);
        const fontSize = Number.isFinite(fontSizeRaw) ? Math.max(6, Math.min(72, fontSizeRaw)) : 12;

        const opened = await openEditablePdf(file);
        if (!opened.ok) return opened.response;
        const { pdf } = opened;

        const font = await pdf.embedFont(StandardFonts.Helvetica);
        const totalPages = pdf.getPageCount();

        for (let i = 0; i < totalPages; i++) {
            const page = pdf.getPage(i);
            const { width, height } = page.getSize();
            
            // Format text, e.g. replacing {n} with page number and {total} with total pages
            const text = format
                .replace(/\{n\}/g, (i + 1).toString())
                .replace(/\{total\}/g, totalPages.toString())
                .replace(/[^\x20-\xFF]/g, '?');
            const textWidth = font.widthOfTextAtSize(text, fontSize);
            const textHeight = font.heightAtSize(fontSize);

            let x = (width - textWidth) / 2;
            let y = margin; // bottom by default

            if (position === 'bottom-left') {
                x = margin;
                y = margin;
            } else if (position === 'bottom-right') {
                x = width - textWidth - margin;
                y = margin;
            } else if (position === 'top-center') {
                x = (width - textWidth) / 2;
                y = height - margin - textHeight;
            } else if (position === 'top-left') {
                x = margin;
                y = height - margin - textHeight;
            } else if (position === 'top-right') {
                x = width - textWidth - margin;
                y = height - margin - textHeight;
            }

            page.drawText(text, {
                x,
                y,
                size: fontSize,
                font,
                color: rgb(0, 0, 0),
            });
        }

        const savedPdfBytes = await pdf.save();
        const baseName = file.name ? file.name.replace(/\.pdf$/i, '') : 'document';
        const fileName = `${baseName}-numbered.pdf`;
        return pdfBinaryResponse(savedPdfBytes, sanitizeDownloadFileName(fileName), {
            'X-Page-Count': String(totalPages),
        });
    } catch (error) {
        return apiInternalError(error, 'Failed to add page numbers', 'PDF add page numbers error');
    }
}
