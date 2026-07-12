import { apiError } from '@/lib/api-response';
import { loadPdfWithTimeout, pdfBinaryResponse } from '@/lib/pdf-api';

export const maxDuration = 60;
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, degrees } from 'pdf-lib';

const CACHE_HEADERS = {
    'Cache-Control': 'no-store, max-age=0',
};

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const angle = parseInt(formData.get('angle') as string) || 90; // 90, 180, 270, -90
        const pages = formData.get('pages') as string || 'all'; // 'all' or '1,2,3'

        if (!file) {
            return apiError('No PDF file provided', 400);
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdfBytes = new Uint8Array(arrayBuffer);
        const pdf = await loadPdfWithTimeout(pdfBytes);

        const totalPages = pdf.getPageCount();

        // Parse which pages to rotate
        let pageIndices: number[] = [];
        if (pages === 'all') {
            pageIndices = Array.from({ length: totalPages }, (_, i) => i);
        } else {
            pageIndices = pages.split(',').map(p => parseInt(p.trim()) - 1).filter(i => i >= 0 && i < totalPages);
        }

        // Apply rotation
        for (const idx of pageIndices) {
            const page = pdf.getPage(idx);
            const currentRotation = page.getRotation().angle;
            page.setRotation(degrees((currentRotation + angle + 360) % 360));
        }

        const savedPdfBytes = await pdf.save();
        return pdfBinaryResponse(savedPdfBytes, `rotated-${Date.now()}.pdf`, {
            'X-Page-Count': String(totalPages),
            'X-Rotated-Pages': pageIndices.map(i => i + 1).join(','),
            'X-Rotation-Angle': String(angle),
        });
    } catch (error) {
        console.error('PDF rotate error:', error);
        return apiError('Failed to rotate PDF', 500);
    }
}
