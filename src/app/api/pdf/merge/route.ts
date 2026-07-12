import { apiError } from '@/lib/api-response';
import { loadPdfWithTimeout } from '@/lib/pdf-api';

export const maxDuration = 60;
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

const MAX_FILES = 20;
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_TOTAL_SIZE = 100 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return apiError('No PDF files provided', 400);
    }

    if (files.length > MAX_FILES) {
      return apiError(`Too many files. Maximum ${MAX_FILES} PDFs allowed per request.`, 400);
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      return apiError('Total upload size too large (100MB max).', 400);
    }

    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();

    let addedPages = 0;

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return apiError(`File \"${file.name}\" is too large (25MB max per file).`, 400);
      }

      const looksLikePdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
      if (!looksLikePdf) {
        continue;
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);
      
      try {
        const pdf = await loadPdfWithTimeout(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        
        for (const page of copiedPages) {
          mergedPdf.addPage(page);
          addedPages += 1;
        }
      } catch (e) {
        console.error(`Error loading PDF ${file.name}:`, e);
        continue;
      }
    }

    if (addedPages === 0) {
      return apiError('No valid PDF pages found to merge.', 400);
    }

    const mergedPdfBytes = await mergedPdf.save();
    const fileName = `merged-${Date.now()}.pdf`;
    const pageCount = mergedPdf.getPageCount();

    return new NextResponse(Buffer.from(mergedPdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store, max-age=0',
        'X-Page-Count': String(pageCount),
      },
    });
  } catch (error) {
    console.error('PDF merge error:', error);
    return apiError('Failed to merge PDFs', 500);
  }
}
