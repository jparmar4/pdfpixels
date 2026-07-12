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
        const pagesToDelete = formData.get('pages') as string; // e.g., '1,3,5' (1-indexed)

        if (!file) {
            return apiError('No PDF file provided', 400);
        }

        if (!pagesToDelete) {
            return apiError('No pages specified for deletion', 400);
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdfBytes = new Uint8Array(arrayBuffer);
        const sourcePdf = await loadPdfWithTimeout(pdfBytes);

        const totalPages = sourcePdf.getPageCount();

        // Parse pages to delete (1-indexed)
        const deleteSet = new Set(
            pagesToDelete.split(',')
                .map(p => parseInt(p.trim()) - 1) // convert to 0-indexed
                .filter(i => i >= 0 && i < totalPages)
        );

        if (deleteSet.size >= totalPages) {
            return apiError('Cannot delete all pages from a PDF', 400);
        }

        // Build list of pages to KEEP
        const keepIndices = Array.from({ length: totalPages }, (_, i) => i).filter(i => !deleteSet.has(i));

        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(sourcePdf, keepIndices);
        for (const page of copiedPages) {
            newPdf.addPage(page);
        }

        const savedPdfBytes = await newPdf.save();
        return pdfBinaryResponse(savedPdfBytes, `edited-${Date.now()}.pdf`, {
            'X-OriginalPageCount': String(totalPages),
            'X-DeletedPages': String(Array.from(deleteSet).map(i => i + 1)),
            'X-RemainingPageCount': String(keepIndices.length),
        });
    } catch (error) {
        console.error('PDF delete pages error:', error);
        return apiError('Failed to delete pages', 500);
    }
}
