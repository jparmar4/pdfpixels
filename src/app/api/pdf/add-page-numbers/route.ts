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
            return NextResponse.json({ error: 'No PDF file provided' }, { status: 400, headers: CACHE_HEADERS });
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdfBytes = new Uint8Array(arrayBuffer);
        const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

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
        const base64 = Buffer.from(savedPdfBytes).toString('base64');
        const dataUrl = `data:application/pdf;base64,${base64}`;

        return NextResponse.json({
            success: true,
            pdfUrl: dataUrl,
            fileName: `numbered-${Date.now()}.pdf`,
            pageCount: totalPages,
        }, { headers: CACHE_HEADERS });
    } catch (error) {
        console.error('PDF add page numbers error:', error);
        return NextResponse.json(
            { error: 'Failed to add page numbers', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500, headers: CACHE_HEADERS }
        );
    }
}
