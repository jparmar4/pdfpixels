import { apiError } from '@/lib/api-response';
import { isPdfFile, loadPdfWithTimeout, validatePdfBuffer } from '@/lib/pdf-api';

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
    const skipped: Array<{ name: string; reason: string }> = [];
    const merged: string[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return apiError(`File "${file.name}" is too large (25MB max per file).`, 400);
      }

      if (!isPdfFile(file) && file.type) {
        skipped.push({ name: file.name || 'unnamed', reason: 'Not a PDF file' });
        continue;
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);
      const magic = validatePdfBuffer(pdfBytes);
      if (!magic.ok) {
        skipped.push({ name: file.name || 'unnamed', reason: magic.error });
        continue;
      }
      
      try {
        const pdf = await loadPdfWithTimeout(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        
        for (const page of copiedPages) {
          mergedPdf.addPage(page);
          addedPages += 1;
        }
        merged.push(file.name || 'unnamed');
      } catch (e) {
        console.error(`Error loading PDF ${file.name}:`, e);
        skipped.push({
          name: file.name || 'unnamed',
          reason: e instanceof Error ? e.message : 'Failed to load PDF',
        });
      }
    }

    if (addedPages === 0) {
      const detail = skipped.length
        ? ` Skipped: ${skipped.map((s) => `${s.name} (${s.reason})`).join('; ')}`
        : '';
      return apiError(`No valid PDF pages found to merge.${detail}`, 400);
    }

    // If some files were provided but skipped, fail closed so users don't get a silent partial merge
    if (skipped.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Could not merge all PDFs. ${skipped.length} file(s) failed.`,
          skipped,
          merged,
          code: 'PARTIAL_MERGE_REJECTED',
        },
        { status: 400, headers: { 'Cache-Control': 'no-store, max-age=0' } },
      );
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
        'X-Merged-Files': String(merged.length),
      },
    });
  } catch (error) {
    console.error('PDF merge error:', error);
    return apiError('Failed to merge PDFs', 500);
  }
}
