import { apiError } from '@/lib/api-response';
import { loadPdfWithTimeout, pdfBinaryResponse, validatePdfUpload } from '@/lib/pdf-api';
import { NextRequest } from 'next/server';
import { rgb, StandardFonts, degrees } from 'pdf-lib';

export const maxDuration = 60;
export const runtime = 'nodejs';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? { r: parseInt(result[1], 16) / 255, g: parseInt(result[2], 16) / 255, b: parseInt(result[3], 16) / 255 }
        : { r: 0.5, g: 0.5, b: 0.5 };
}

/** Keep WinAnsi-safe text for StandardFonts; strip unsupported chars. */
function sanitizeWatermarkText(text: string): string {
    return text.replace(/[^\x20-\x7E]/g, '?').trim() || 'CONFIDENTIAL';
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const text = sanitizeWatermarkText((formData.get('text') as string) || 'CONFIDENTIAL');
        const opacity = Math.min(1, Math.max(0.05, parseFloat(formData.get('opacity') as string) || 0.3));
        const fontSize = parseInt(formData.get('fontSize') as string) || 48;
        const colorHex = (formData.get('color') as string) || '#808080';
        const rotation = parseInt(formData.get('rotation') as string) || 45;
        const position = (formData.get('position') as string) || 'center';

        const validation = validatePdfUpload(file);
        if (!validation.ok) return validation.response;

        const arrayBuffer = await file!.arrayBuffer();
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

            const drawAt = (x: number, y: number) => {
                page.drawText(text, {
                    x,
                    y,
                    size: fontSize,
                    font,
                    color: rgb(color.r, color.g, color.b),
                    rotate: degrees(rotation),
                    opacity,
                });
            };

            if (position === 'diagonal') {
                // Tile watermark across the page for diagonal repeat
                const stepX = Math.max(textWidth + 40, width / 3);
                const stepY = Math.max(textHeight + 60, height / 4);
                for (let y = -height * 0.2; y < height * 1.2; y += stepY) {
                    for (let x = -width * 0.2; x < width * 1.2; x += stepX) {
                        drawAt(x, y);
                    }
                }
            } else {
                let x = (width - textWidth) / 2;
                let y = (height - textHeight) / 2;

                if (position === 'top-left') { x = 50; y = height - 100; }
                else if (position === 'top-right') { x = width - textWidth - 50; y = height - 100; }
                else if (position === 'bottom-left') { x = 50; y = 50; }
                else if (position === 'bottom-right') { x = width - textWidth - 50; y = 50; }

                drawAt(x, y);
            }
        }

        const outBytes = await pdf.save();
        const fileName = file!.name ? file!.name.replace(/\.pdf$/i, '-watermarked.pdf') : `watermarked-${Date.now()}.pdf`;

        return pdfBinaryResponse(outBytes, fileName);
    } catch (error) {
        console.error('PDF watermark error:', error);
        return apiError(error instanceof Error ? error.message : 'Failed to watermark PDF', 500);
    }
}
