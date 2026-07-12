import { apiError } from '@/lib/api-response';
import { loadPdfWithTimeout } from '@/lib/pdf-api';

export const maxDuration = 60;
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_SPLIT_PAGES = 20;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mode = formData.get('mode') as string || 'all'; // 'all', 'range', 'single'
    const pageRange = formData.get('pageRange') as string; // e.g., '1-3,5,7-9'
    const singlePage = formData.get('singlePage') as string; // e.g., '1'

    if (!file) {
      return apiError('No PDF file provided', 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return apiError('File too large (25MB max).', 400);
    }

    if (file.type && file.type !== 'application/pdf') {
      return apiError('Only PDF files are supported.', 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);
    const pdf = await loadPdfWithTimeout(pdfBytes);

    const totalPages = pdf.getPageCount();
    let pagesToExtract: number[] = [];

    if (mode === 'single' && singlePage) {
      pagesToExtract = [parseInt(singlePage) - 1];
    } else if (mode === 'range' && pageRange) {
      // Parse page range like '1-3,5,7-9'
      const parts = pageRange.split(',');
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
          for (let i = start - 1; i < end; i++) {
            if (i >= 0 && i < totalPages) {
              pagesToExtract.push(i);
            }
          }
        } else {
          const pageNum = parseInt(trimmed) - 1;
          if (pageNum >= 0 && pageNum < totalPages) {
            pagesToExtract.push(pageNum);
          }
        }
      }
    } else {
      // Extract all pages individually (capped for payload safety)
      const AdmZip = (await import('adm-zip')).default;
      const zip = new AdmZip();
      
      const pagesToReturn = Math.min(totalPages, MAX_SPLIT_PAGES);
      for (let i = 0; i < pagesToReturn; i++) {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(pdf, [i]);
        newPdf.addPage(copiedPage);
        const newPdfBytes = await newPdf.save();
        zip.addFile(`page-${i + 1}.pdf`, Buffer.from(newPdfBytes));
      }

      const zipBuffer = zip.toBuffer();
      const fileName = `split-${Date.now()}.zip`;

      return new NextResponse(zipBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Cache-Control': 'no-store, max-age=0',
          'X-Mode': 'split-all',
          'X-Total-Pages': String(totalPages),
          'X-Pages-Returned': String(pagesToReturn),
          'X-Truncated': String(totalPages > pagesToReturn),
        },
      });
    }

    pagesToExtract = Array.from(new Set(pagesToExtract)).slice(0, MAX_SPLIT_PAGES);

    if (pagesToExtract.length === 0) {
      return apiError('No valid pages selected.', 400);
    }

    // Create PDF with selected pages
    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdf, pagesToExtract);

    for (const page of copiedPages) {
      newPdf.addPage(page);
    }

    const newPdfBytes = await newPdf.save();
    const fileName = `extracted-pages-${Date.now()}.pdf`;

    return new NextResponse(Buffer.from(newPdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store, max-age=0',
        'X-Mode': 'extract',
        'X-Total-Pages': String(totalPages),
        'X-Extracted-Pages': pagesToExtract.map(p => p + 1).join(','),
      },
    });
  } catch (error) {
    console.error('PDF split error:', error);
    return apiError('Failed to split PDF', 500);
  }
}
