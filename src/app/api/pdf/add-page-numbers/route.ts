import { apiError } from '@/lib/api-response';
import { loadPdfWithTimeout, pdfBinaryResponse } from '@/lib/pdf-api';

export const maxDuration = 60;
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const CACHE_HEADERS = {
    'Cache-Control': 'no-store, max-age=0',
};

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const position = (formData.get('position') as string) || 'bottom-center';
        const format = (formData.get('format') as string) || '{n}';
        const margin = parseInt(formData.get('margin') as string) || 30;
        const fontSize = parseInt(formData.get('fontSize') as string) || 12;

        if (!file) {
            return apiError('No PDF file provided', 400);
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdfBytes = new Uint8Array(arrayBuffer);
        const pdf = await loadPdfWithTimeout(pdfBytes);

        const font = await pdf.embedFont(StandardFonts.Helvetica);
        const totalPages = pdf.getPageCount();

        for (let i = 0; i < totalPages; i++) {
            const page = pdf.getPage(i);
            const { width, height } = page.getSize();
            
            // Format text, e.g. replacing {n} with page number and {total} with total pages
            let text = format.replace('{n}', (i + 1).toString()).replace('{total}', totalPages.toString());
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
