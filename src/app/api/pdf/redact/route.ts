import { apiError, apiInternalError } from '@/lib/api-response';
import { openEditablePdf, pdfBinaryResponse, sanitizeDownloadFileName } from '@/lib/pdf-api';
import { NextRequest } from 'next/server';
import { rasterizePdf } from '@/lib/pdf-raster';
import { rgb, PDFName } from 'pdf-lib';

export const maxDuration = 60;
export const runtime = 'nodejs';

interface RedactionBox {
  pageNumber: number; // 1-based
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const redactionsJson = formData.get('redactions') as string | null;

    const opened = await openEditablePdf(file);
    if (!opened.ok) return opened.response;
    const { pdf } = opened;

    let redactions: RedactionBox[] = [];
    if (redactionsJson) {
      try {
        redactions = JSON.parse(redactionsJson);
      } catch {
        return apiError('Invalid redaction boxes.', 400);
      }
    }

    if (!Array.isArray(redactions)) return apiError('Redactions must be an array.', 400);
    if (redactionsJson && !redactions.length) return apiError('Add at least one redaction box.', 400);
    if (redactions.length === 0) {
      const pageNumber = parseInt(String(formData.get('pageNumber') || '1'), 10);
      const x = parseFloat(String(formData.get('x') || '50'));
      const y = parseFloat(String(formData.get('y') || '50'));
      const width = parseFloat(String(formData.get('width') || '200'));
      const height = parseFloat(String(formData.get('height') || '30'));
      redactions.push({ pageNumber, x, y, width, height });
    }

    const totalPages = pdf.getPageCount();

    if (pdf.getPages().some(page => { const box = page.getCropBox(); return box.width * box.height * (150 / 72) ** 2 > 25_000_000; })) return apiError('Page dimensions are too large to redact safely. Resize the PDF first.', 422);
    if (totalPages > 50) return apiError('Please split PDFs over 50 pages before redacting.', 422);
    for (const box of redactions) {
      if (!box || !Number.isInteger(box.pageNumber) || box.pageNumber < 1 || box.pageNumber > totalPages ||
          ![box.x, box.y, box.width, box.height].every(Number.isFinite) || box.x < 0 || box.y < 0 || box.width <= 0 || box.height <= 0) {
        return apiError('A redaction box has invalid coordinates or page number.', 400);
      }
      const page = pdf.getPage(box.pageNumber - 1);
      const crop = page.getCropBox();
      if (page.getRotation().angle !== 0 || crop.x !== 0 || crop.y !== 0) return apiError('Normalize rotated or offset pages before redacting to ensure accurate placement.', 422);
      if (box.x + box.width > crop.width || box.y + box.height > crop.height) return apiError('Redaction boxes must fit inside the page.', 400);
    }
    // Form appearances must be painted before covering the sensitive area.
    try { pdf.getForm().flatten(); } catch { return apiError('Could not safely flatten this form.', 422); }
    for (const page of pdf.getPages()) page.node.delete(PDFName.of('Annots'));
    for (const box of redactions) {
      const pageIdx = box.pageNumber - 1;
      if (pageIdx < 0 || pageIdx >= totalPages) continue;

      const page = pdf.getPage(pageIdx);
      const { height: pageHeight } = page.getCropBox();

      // Convert coordinates if provided from top-left
      const yPos = pageHeight - box.y - box.height;

      // Draw white rectangle to visually blank the area first
      page.drawRectangle({
        x: Math.max(0, box.x),
        y: Math.max(0, yPos),
        width: box.width,
        height: box.height,
        color: rgb(1, 1, 1),
        borderWidth: 0,
        opacity: 1.0,
      });
      // Draw black redaction box on top
      page.drawRectangle({
        x: Math.max(0, box.x),
        y: Math.max(0, yPos),
        width: box.width,
        height: box.height,
        color: rgb(0, 0, 0),
        borderColor: rgb(0, 0, 0),
        borderWidth: 0,
        opacity: 1.0,
      });
    }

    const outBytes = await rasterizePdf(await pdf.save(), totalPages);
    const baseName = file?.name ? file.name.replace(/\.pdf$/i, '') : 'document';
    const fileName = `${sanitizeDownloadFileName(baseName)}-redacted.pdf`;

    return pdfBinaryResponse(outBytes, fileName, {
      'x-redaction-type': 'rasterized',
      'x-redaction-count': String(redactions.length),
    });
  } catch (error) {
    return apiInternalError(error, 'Failed to redact PDF', 'PDF redact error');
  }
}
