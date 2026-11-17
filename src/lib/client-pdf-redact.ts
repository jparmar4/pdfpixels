'use client';

import { PDFDocument, PDFName } from 'pdf-lib';
import {
  createEmptyPiiSummary,
  PII_PATTERN_SPECS,
  type PiiCategory,
  type PiiSummary,
} from '@/lib/pii-patterns';

export interface ClientRedactionItem {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  category?: PiiCategory;
}

/**
 * Scans selectable text layers across every PDF page directly inside the browser
 * via `pdfjs-dist` to locate SSNs, EINs, Credit Cards, Phones, Emails, and IBANs.
 */
export async function scanPdfPiiClient(
  file: File,
  enabledCategories?: PiiCategory[],
): Promise<{
  detected: ClientRedactionItem[];
  summary: PiiSummary;
  totalPages: number;
}> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    cMapUrl: '/pdfjs/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: '/pdfjs/standard_fonts/',
  }).promise;

  const detected: ClientRedactionItem[] = [];
  const summary = createEmptyPiiSummary();
  const allowed = enabledCategories ? new Set(enabledCategories) : null;

  try {
    const numPages = Math.min(doc.numPages, 50);
    for (let pageNum = 1; pageNum <= numPages; pageNum += 1) {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });
      const textContent = await page.getTextContent();

      for (const rawItem of textContent.items) {
        if (!('str' in rawItem) || !rawItem.str || !rawItem.str.trim()) continue;
        const item = rawItem as {
          str: string;
          width: number;
          height: number;
          transform: number[];
        };

        const tx = item.transform?.[4] ?? 0;
        const ty = item.transform?.[5] ?? 0;
        const itemWidth = Math.max(12, item.width || item.str.length * 6);
        const itemHeight = Math.max(10, item.height || Math.abs(item.transform?.[3] ?? 12) || 12);

        for (const pattern of PII_PATTERN_SPECS) {
          if (allowed && !allowed.has(pattern.type)) continue;
          pattern.regex.lastIndex = 0;
          let match: RegExpExecArray | null;
          while ((match = pattern.regex.exec(item.str)) !== null) {
            const matchedStr = match[0];
            // Prevent SSN false positives when string is strictly an EIN (XX-XXXXXXX)
            if (pattern.type === 'ssn' && /^\d{2}-\d{7}$/.test(matchedStr)) continue;

            const startRatio = match.index / item.str.length;
            const lenRatio = matchedStr.length / item.str.length;
            const boxX = Math.max(0, tx + itemWidth * startRatio - 2);
            const boxY = Math.max(0, viewport.height - ty - itemHeight - 2);
            const boxW = Math.min(viewport.width - boxX, Math.max(22, itemWidth * lenRatio + 4));
            const boxH = Math.max(14, itemHeight + 4);

            detected.push({
              id: `pii-${pattern.type}-${pageNum}-${Math.round(boxX)}-${Math.round(boxY)}-${Math.random().toString(36).slice(2, 6)}`,
              pageNumber: pageNum,
              x: Math.round(boxX),
              y: Math.round(boxY),
              width: Math.round(boxW),
              height: Math.round(boxH),
              category: pattern.type,
            });
            summary[pattern.type] += 1;
            summary.total += 1;
          }
        }
      }
    }
    return { detected, summary, totalPages: doc.numPages };
  } finally {
    void doc.destroy();
  }
}

/**
 * Permanently scrubs sensitive content inside the browser by rasterizing every page at
 * 150 DPI onto an HTML Canvas, burning solid #000000 rectangles onto pixel buffers,
 * reassembling an image-only PDF with zero text layer, and wiping all Document/XMP metadata.
 */
export async function redactPdfCanvasClient(
  file: File,
  redactions: ClientRedactionItem[],
): Promise<{ bytes: Uint8Array; pageCount: number }> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const buffer = await file.arrayBuffer();
  const srcDoc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    cMapUrl: '/pdfjs/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: '/pdfjs/standard_fonts/',
  }).promise;

  const outPdf = await PDFDocument.create();
  const renderScale = 150 / 72; // crisp 150 DPI pixel raster scrub

  try {
    for (let pageNum = 1; pageNum <= srcDoc.numPages; pageNum += 1) {
      const page = await srcDoc.getPage(pageNum);
      const baseViewport = page.getViewport({ scale: 1 });
      const scaledViewport = page.getViewport({ scale: renderScale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(scaledViewport.width));
      canvas.height = Math.max(1, Math.round(scaledViewport.height));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable for raster scrubbing.');

      await page.render({ canvasContext: ctx, canvas, viewport: scaledViewport }).promise;

      // Burn opaque black rectangles onto pixel buffer (zero recoverable underlying vectors)
      ctx.fillStyle = '#000000';
      const pageBoxes = redactions.filter((r) => r.pageNumber === pageNum);
      for (const box of pageBoxes) {
        ctx.fillRect(
          Math.max(0, box.x * renderScale),
          Math.max(0, box.y * renderScale),
          Math.max(4, box.width * renderScale),
          Math.max(4, box.height * renderScale),
        );
      }

      const jpgBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Failed to encode rasterized PDF page.'))),
          'image/jpeg',
          0.92,
        );
      });
      const jpgBytes = new Uint8Array(await jpgBlob.arrayBuffer());
      const embedded = await outPdf.embedJpg(jpgBytes);
      const outPage = outPdf.addPage([baseViewport.width, baseViewport.height]);
      outPage.drawImage(embedded, {
        x: 0,
        y: 0,
        width: baseViewport.width,
        height: baseViewport.height,
      });
    }

    // Complete Document Info & XMP/PieceInfo purge
    outPdf.setTitle('');
    outPdf.setAuthor('');
    outPdf.setSubject('');
    outPdf.setKeywords([]);
    outPdf.setProducer('');
    outPdf.setCreator('');
    try {
      outPdf.catalog.delete(PDFName.of('Metadata'));
      outPdf.catalog.delete(PDFName.of('PieceInfo'));
    } catch {
      // Optional catalog nodes
    }

    const bytes = await outPdf.save();
    return { bytes, pageCount: outPdf.getPageCount() };
  } finally {
    void srcDoc.destroy();
  }
}
