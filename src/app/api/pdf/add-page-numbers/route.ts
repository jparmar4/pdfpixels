import { apiError } from '@/lib/api-response';
import { openEditablePdf, pdfBinaryResponse } from '@/lib/pdf-api';
import { NextRequest } from 'next/server';
import { rgb, StandardFonts } from 'pdf-lib';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const position = (formData.get('position') as string) || 'bottom-center';
        const format = (formData.get('format') as string) || '{n}';
        const marginRaw = parseInt(String(formData.get('margin') ?? ''), 10);
        const margin = Number.isFinite(marginRaw) ? Math.max(0, Math.min(200, marginRaw)) : 30;
        const fontSizeRaw = parseInt(String(formData.get('fontSize') ?? ''), 10);
        const fontSize = Number.isFinite(fontSizeRaw) ? fontSizeRaw : 12;

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
                .replace(/[^\x20-\x7E]/g, '?');
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
        return pdfBinaryResponse(savedPdfBytes, `numbered-${Date.now()}.pdf`, {
            'X-Page-Count': String(totalPages),
        });
    } catch (error) {
        console.error('PDF add page numbers error:', error);
        return apiError('Failed to add page numbers', 500);
    }
}
