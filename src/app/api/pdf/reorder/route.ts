import { apiError } from '@/lib/api-response';
import { openEditablePdf, pdfBinaryResponse } from '@/lib/pdf-api';
import { NextRequest } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const orderJson = formData.get('order') as string | null;

    if (!orderJson) {
      return apiError('Page order not provided', 400);
    }

    let newOrder: number[];
    try {
      newOrder = JSON.parse(orderJson);
    } catch {
      return apiError('Invalid page order JSON', 400);
    }

    if (!Array.isArray(newOrder) || newOrder.some((p) => !Number.isInteger(p))) {
      return apiError('Page order must be an array of integers', 400);
    }

    const opened = await openEditablePdf(file);
    if (!opened.ok) return opened.response;
    const sourcePdf = opened.pdf;
    const totalPages = sourcePdf.getPageCount();

    if (newOrder.length !== totalPages) {
      return apiError(`Order must include all ${totalPages} page numbers`, 400);
    }

    const sorted = [...newOrder].sort((a, b) => a - b);
    const expected = Array.from({ length: totalPages }, (_, i) => i + 1);
    const isPermutation =
      sorted.length === expected.length && sorted.every((value, index) => value === expected[index]);

    if (!isPermutation) {
      return apiError(`Order must be a permutation of pages 1–${totalPages}`, 400);
    }

    const zeroIndexed = newOrder.map((p) => p - 1);
    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(sourcePdf, zeroIndexed);
    for (const page of copiedPages) {
      newPdf.addPage(page);
    }

    const savedPdfBytes = await newPdf.save();
    return pdfBinaryResponse(savedPdfBytes, `reordered-${Date.now()}.pdf`, {
      'X-Page-Count': String(totalPages),
      'X-NewOrder': newOrder.join(','),
    });
  } catch (error) {
    console.error('PDF reorder error:', error);
    return apiError('Failed to reorder PDF pages', 500);
  }
}
