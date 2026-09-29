import { apiError, apiInternalError } from '@/lib/api-response';
import { openEditablePdf, parsePageSelection, sanitizeDownloadFileName } from '@/lib/pdf-api';
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export const maxDuration = 60;
export const runtime = 'nodejs';

const MAX_SPLIT_PAGES = 20;
const MAX_EXTRACT_PAGES = 50;
const MAX_SELECTION_CHARS = 2000;
const MAX_SIZE_PARTS = 100;
const MAX_SIZE_MODE_PAGES = 300;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    let mode = (formData.get('mode') as string) || 'all'; // 'all', 'range', 'single', 'size'
    const pageRange = (formData.get('pageRange') as string) || (formData.get('pages') as string) || '';
    const singlePage = (formData.get('singlePage') as string) || (formData.get('page') as string) || '';
    const maxSizeMb = Number(formData.get('maxSizeMb')) || 0;

    if (mode === 'extract') {
      mode = singlePage ? 'single' : (pageRange ? 'range' : 'all');
    }

    if (!['all', 'range', 'single', 'size'].includes(mode)) {
      return apiError('Invalid split mode. Use all, range, single, or size.', 400);
    }
    if (pageRange.length > MAX_SELECTION_CHARS || singlePage.length > 100) {
      return apiError('Page selection is too long. Keep it under 2000 characters.', 413);
    }

    const opened = await openEditablePdf(file);
    if (!opened.ok) return opened.response;
    const { pdf } = opened;
    const totalPages = pdf.getPageCount();

    let pagesToExtract: number[] = [];

    if (mode === 'size') {
      if (!Number.isFinite(maxSizeMb) || maxSizeMb < 0.1 || maxSizeMb > 25) {
        return apiError('Size limit must be between 0.1MB and 25MB.', 400);
      }
      if (totalPages > MAX_SIZE_MODE_PAGES) {
        return apiError(
          `Size splitting is capped at ${MAX_SIZE_MODE_PAGES} pages per run. Use range extraction first for bigger documents.`,
          413,
        );
      }

      const limitBytes = Math.floor(maxSizeMb * 1024 * 1024);
      const parts: Buffer[] = [];
      let current = await PDFDocument.create();
      let pagesInCurrent = 0;
      // Size measured at the last save that was within the limit. Pushed as the
      // finished part instead of a post-removePage re-save — removing a page
      // leaves orphaned copied objects in the pdf-lib context, which would
      // silently inflate the part back over the limit.
      let lastGood: Buffer = Buffer.alloc(0);

      for (let i = 0; i < totalPages; i++) {
        const [page] = await current.copyPages(pdf, [i]);
        current.addPage(page);
        pagesInCurrent += 1;

        const bytes = Buffer.from(await current.save());
        if (bytes.length > limitBytes && pagesInCurrent > 1) {
          parts.push(lastGood);
          current = await PDFDocument.create();
          const [retried] = await current.copyPages(pdf, [i]);
          current.addPage(retried);
          pagesInCurrent = 1;
          // A single page larger than the limit stays whole — it cannot be divided.
          lastGood = Buffer.from(await current.save());
          if (parts.length >= MAX_SIZE_PARTS) {
            return apiError(
              `This limit produces more than ${MAX_SIZE_PARTS} parts. Choose a larger size limit or compress the PDF first.`,
              413,
            );
          }
        } else {
          lastGood = bytes;
        }
      }
      if (pagesInCurrent > 0) parts.push(lastGood);

      const AdmZip = (await import('adm-zip')).default;
      const zip = new AdmZip();
      parts.forEach((part, index) => zip.addFile(`part-${index + 1}.pdf`, part));
      const zipBuffer = zip.toBuffer();

      return new NextResponse(zipBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="split-by-size-${Date.now()}.zip"`,
          'Cache-Control': 'no-store, max-age=0',
          'X-Mode': 'by-size',
          'X-Total-Pages': String(totalPages),
          'X-Parts': String(parts.length),
          'X-Size-Limit-Mb': String(maxSizeMb),
        },
      });
    }

    if (mode === 'single') {
      const pageNum = parseInt(singlePage, 10);
      if (!Number.isFinite(pageNum) || pageNum < 1 || pageNum > totalPages) {
        return apiError(`Single page must be a number between 1 and ${totalPages}.`, 400);
      }
      pagesToExtract = [pageNum - 1];
    } else if (mode === 'range') {
      if (!pageRange.trim()) {
        return apiError('Enter a page range such as 1-3,5,7-9.', 400);
      }
      pagesToExtract = parsePageSelection(pageRange, totalPages);
      if (pagesToExtract.length === 0) {
        return apiError('No valid pages in range. Use formats like 1-3,5,7-9.', 400);
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

    pagesToExtract = Array.from(new Set(pagesToExtract));

    if (pagesToExtract.length === 0) {
      return apiError('No valid pages selected.', 400);
    }

    if (pagesToExtract.length > MAX_EXTRACT_PAGES) {
      return apiError(
        `Too many pages selected (${pagesToExtract.length}). Maximum ${MAX_EXTRACT_PAGES} pages per extract — split into smaller ranges.`,
        413,
      );
    }

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdf, pagesToExtract);

    for (const page of copiedPages) {
      newPdf.addPage(page);
    }

    const newPdfBytes = await newPdf.save();
    const baseName = file?.name ? file.name.replace(/\.pdf$/i, '') : 'document';
    const fileName = `${baseName}-split.pdf`;

    return new NextResponse(Buffer.from(newPdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${sanitizeDownloadFileName(fileName)}"`,
        'Cache-Control': 'no-store, max-age=0',
        'X-Mode': 'extract',
        'X-Total-Pages': String(totalPages),
        'X-Extracted-Pages': pagesToExtract.map((p) => p + 1).join(','),
      },
    });
  } catch (error) {
    return apiInternalError(error, 'Failed to split PDF', 'PDF split error');
  }
}
