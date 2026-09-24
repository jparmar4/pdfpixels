import { apiError, apiInternalError } from '@/lib/api-response';
import { PDFDocument } from 'pdf-lib';
import { NextRequest, NextResponse } from 'next/server';
import {
  openEditablePdf,
  sanitizeDownloadFileName,
} from '@/lib/pdf-api';

export const maxDuration = 120;
export const runtime = 'nodejs';

const LAYOUTS: Record<string, { cols: number; rows: number }> = {
  '2': { cols: 1, rows: 2 },
  '4': { cols: 2, rows: 2 },
  '6': { cols: 2, rows: 3 },
};

/** Sheet sizes in PostScript points. */
const SHEETS: Record<string, { width: number; height: number }> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
};

const GUTTER = 12;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const layout = String(formData.get('layout') ?? '4');
    const sheetKey = String(formData.get('sheet') ?? 'a4').toLowerCase();

    if (!LAYOUTS[layout]) {
      return apiError('Unsupported layout. Choose 2, 4, or 6 pages per sheet.', 400);
    }
    if (!SHEETS[sheetKey]) {
      return apiError('Unsupported sheet size. Choose A4 or Letter.', 400);
    }

    const opened = await openEditablePdf(file);
    if (!opened.ok) return opened.response;
    const { pdf } = opened;

    const { cols, rows } = LAYOUTS[layout];
    const base = SHEETS[sheetKey];
    const sheetWidth = base.width;
    const sheetHeight = base.height;

    const cellWidth = (sheetWidth - GUTTER * (cols + 1)) / cols;
    const cellHeight = (sheetHeight - GUTTER * (rows + 1)) / rows;

    const out = await PDFDocument.create();
    const pageCount = pdf.getPageCount();
    const indices = pdf.getPageIndices();

    for (let start = 0; start < pageCount; start += cols * rows) {
      const newPage = out.addPage([sheetWidth, sheetHeight]);
      const batch = indices.slice(start, start + cols * rows);

      for (let i = 0; i < batch.length; i++) {
        const page = pdf.getPage(batch[i]);
        const { width, height } = page.getSize();
        const embedded = await out.embedPage(page);

        const col = i % cols;
        const row = Math.floor(i / cols);

        const scale = Math.min(cellWidth / width, cellHeight / height);
        const drawWidth = width * scale;
        const drawHeight = height * scale;

        const x = GUTTER + col * (cellWidth + GUTTER) + (cellWidth - drawWidth) / 2;
        // Top-to-bottom row order on the sheet.
        const yTop = sheetHeight - GUTTER - row * (cellHeight + GUTTER) - cellHeight;
        const y = yTop + (cellHeight - drawHeight) / 2;

        newPage.drawPage(embedded, { x, y, xScale: scale, yScale: scale });
      }
    }

    const bytes = await out.save();
    const baseName = (file?.name ?? 'handout.pdf').replace(/\.pdf$/i, '');
    return new NextResponse(bytes as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${sanitizeDownloadFileName(`${baseName}-${layout}-up.pdf`)}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return apiInternalError(error, 'Failed to arrange PDF pages per sheet', 'PDF N-up error');
  }
}
