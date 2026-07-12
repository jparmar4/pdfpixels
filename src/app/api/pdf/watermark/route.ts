import { apiError } from '@/lib/api-response';
import { loadPdfWithTimeout, pdfBinaryResponse } from '@/lib/pdf-api';
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

export const maxDuration = 60;

const CACHE_HEADERS = {
    'Cache-Control': 'no-store, max-age=0',
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? { r: parseInt(result[1], 16) / 255, g: parseInt(result[2], 16) / 255, b: parseInt(result[3], 16) / 255 }
        : { r: 0.5, g: 0.5, b: 0.5 };
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const text = (formData.get('text') as string) || 'CONFIDENTIAL';
        const opacity = parseFloat(formData.get('opacity') as string) || 0.3;
        const fontSize = parseInt(formData.get('fontSize') as string) || 48;
        const colorHex = (formData.get('color') as string) || '#808080';
        const rotation = parseInt(formData.get('rotation') as string) || 45;
        const position = (formData.get('position') as string) || 'center'; // center, diagonal

        if (!file) {
            return apiError('No PDF file provided', 400);
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdfBytes = new Uint8Array(arrayBuffer);
        const pdf = await loadPdfWithTimeout(pdfBytes);

        const font = await pdf.embedFont(StandardFonts.HelveticaBold);
        const color = hexToRgb(colorHex);
        const totalPages = pdf.getPageCount();

        for (let i = 0; i < totalPages; i++) {
            const page = pdf.getPage(i);
            const { width, height } = page.getSize();
            const textWidth = font.widthOfTextAtSize(text, fontSize);
            const textHeight = font.heightAtSize(fontSize);

            let x = (width - textWidth) / 2;
            let y = (height - textHeight) / 2;

            if (position === 'top-left') { x = 50; y = height - 100; }
            else if (position === 'top-right') { x = width - textWidth - 50; y = height - 100; }
            else if (position === 'bottom-left') { x = 50; y = 50; }
            else if (position === 'bottom-right') { x = width - textWidth - 50; y = 50; }

            page.drawText(text, {
                x,
                y,
                size: fontSize,
                font,
                color: rgb(color.r, color.g, color.b),
                rotate: degrees(rotation),
                opacity,
            });
        }

        const outBytes = await pdf.save();
        const fileName = file.name ? file.name.replace('.pdf', '-watermarked.pdf') : `watermarked-${Date.now()}.pdf`;

        return pdfBinaryResponse(outBytes, fileName);
    } catch (error) {
        console.error('PDF watermark error:', error);
        return apiError(error instanceof Error ? error.message : 'Failed to watermark PDF', 500);
    }
}
