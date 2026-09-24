import { apiError, apiInternalError } from '@/lib/api-response';
import { PDFDocument } from 'pdf-lib';
import { NextRequest, NextResponse } from 'next/server';
import {
  openEditablePdf,
  sanitizeDownloadFileName,
} from '@/lib/pdf-api';

export const maxDuration = 60;
export const runtime = 'nodejs';

/** Sheet sizes in PostScript points (1/72 inch). */
const SHEETS: Record<string, { width: number; height: number; label: string }> = {
  a4: { width: 595.28, height: 841.89, label: 'A4' },
  a3: { width: 841.89, height: 1190.55, label: 'A3' },
  a5: { width: 419.53, height: 595.28, label: 'A5' },
  letter: { width: 612, height: 792, label: 'Letter' },
  legal: { width: 612, height: 1008, label: 'Legal' },
};

const MARGIN = 0; // full-bleed scale-and-center

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const sheet = String(formData.get('sheet') ?? 'a4').toLowerCase();
    const orientation = String(formData.get('orientation') ?? 'auto').toLowerCase(); // auto|portrait|landscape

    if (!SHEETS[sheet]) {
      return apiError('Unsupported sheet size. Choose A4, A3, A5, Letter, or Legal.', 400);
    }
    if (!['auto', 'portrait', 'landscape'].includes(orientation)) {
      return apiError('Unsupported orientation. Choose auto, portrait, or landscape.', 400);
    }

    const opened = await openEditablePdf(file);
    if (!opened.ok) return opened.response;
    const { pdf } = opened;

    const out = await PDFDocument.create();
    const base = SHEETS[sheet];

    for (const index of pdf.getPageIndices()) {
      const page = pdf.getPage(index);
      const { width, height } = page.getSize();

      const isLandscapeSource = width > height;
      const wantLandscape =
        orientation === 'landscape' ? true : orientation === 'portrait' ? false : isLandscapeSource;

      const sheetWidth = wantLandscape ? base.height : base.width;
      const sheetHeight = wantLandscape ? base.width : base.height;

      const newPage = out.addPage([sheetWidth, sheetHeight]);
      const embedded = await out.embedPage(page);

      const scale = Math.min(
        (sheetWidth - MARGIN * 2) / width,
        (sheetHeight - MARGIN * 2) / height,
      );
      const drawWidth = width * scale;
      const drawHeight = height * scale;
      const x = (sheetWidth - drawWidth) / 2;
      const y = (sheetHeight - drawHeight) / 2;

      newPage.drawPage(embedded, { x, y, xScale: scale, yScale: scale });
    }

    const bytes = await out.save();
    const baseName = (file?.name ?? 'resized.pdf').replace(/\.pdf$/i, '');
    return new NextResponse(bytes as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${sanitizeDownloadFileName(`${baseName}-${base.label.toLowerCase()}.pdf`)}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return apiInternalError(error, 'Failed to resize PDF', 'Resize PDF error');
  }
}
