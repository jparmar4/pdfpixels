import { apiError } from '@/lib/api-response';
import { loadPdfWithTimeout, pdfBinaryResponse } from '@/lib/pdf-api';

export const maxDuration = 60;
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

const CACHE_HEADERS = {
    'Cache-Control': 'no-store, max-age=0',
};

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const orderJson = formData.get('order') as string; // JSON array of 1-indexed page numbers e.g. [3,1,2]

        if (!file) {
            return apiError('No PDF file provided', 400);
        }

        if (!orderJson) {
            return apiError('Page order not provided', 400);
        }

        const newOrder: number[] = JSON.parse(orderJson); // 1-indexed

        const arrayBuffer = await file.arrayBuffer();
        const pdfBytes = new Uint8Array(arrayBuffer);
        const sourcePdf = await loadPdfWithTimeout(pdfBytes);

        const totalPages = sourcePdf.getPageCount();

        // Validate order
        if (newOrder.length !== totalPages) {
            return apiError(`Order must include all ${totalPages} page numbers`, 400);
        }

        // Convert 1-indexed to 0-indexed
        const zeroIndexed = newOrder.map(p => p - 1);

        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(sourcePdf, zeroIndexed);
        for (const page of copiedPages) {
            newPdf.addPage(page);
        }

        const savedPdfBytes = await newPdf.save();
        return pdfBinaryResponse(savedPdfBytes, `reordered-${Date.now()}.pdf`, {
            'X-Page-Count': String(totalPages),
            'X-NewOrder': String(newOrder),
        });
    } catch (error) {
        console.error('PDF reorder error:', error);
        return apiError('Failed to reorder PDF pages', 500);
    }
}
