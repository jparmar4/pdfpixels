import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';

export type BatchOperation = 'compress' | 'convert' | 'watermark' | 'bates';
export type BatchConvertTarget = 'webp' | 'jpg' | 'png' | 'pdf';

export interface BatchJobOptions {
  operation: BatchOperation;
  quality: number; // 0.35 - 0.95
  convertTarget: BatchConvertTarget;
  watermarkText: string;
  batesPrefix: string;
  batesStartIndex: number;
}

export interface BatchProcessInput {
  id: string;
  name: string;
  mimeType: string;
  bytes: ArrayBuffer;
  fileIndex: number;
  options: BatchJobOptions;
}

export interface BatchProcessOutput {
  id: string;
  ok: boolean;
  outName: string;
  mimeType: string;
  bytes?: ArrayBuffer;
  originalSize: number;
  processedSize?: number;
  note: string;
  error?: string;
}

function isPdfInput(name: string, mimeType: string): boolean {
  return mimeType === 'application/pdf' || name.toLowerCase().endsWith('.pdf');
}

function mimeToExt(mime: string): string {
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/png') return 'png';
  return 'jpg';
}

function sanitizeText(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, ' ').trim() || 'CONFIDENTIAL';
}

async function decodeImageBitmap(bytes: ArrayBuffer, mimeType: string): Promise<ImageBitmap> {
  if (typeof createImageBitmap !== 'function') {
    throw new Error('ImageBitmap decoding is unavailable in this browser.');
  }
  const blob = new Blob([bytes], { type: mimeType || 'image/png' });
  return createImageBitmap(blob);
}

async function encodeCanvas(
  canvas: OffscreenCanvas,
  targetMime: string,
  quality: number,
): Promise<ArrayBuffer> {
  const blob = await canvas.convertToBlob({ type: targetMime, quality });
  return blob.arrayBuffer();
}

async function processImageWithOffscreenCanvas(input: BatchProcessInput): Promise<BatchProcessOutput> {
  const { name, mimeType, bytes, options } = input;
  const baseName = name.replace(/\.[^.]+$/, '') || 'image';
  const bitmap = await decodeImageBitmap(bytes, mimeType);

  try {
    const scale = options.operation === 'compress' && options.quality < 0.7 ? 0.88 : 1;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    if (typeof OffscreenCanvas === 'undefined') {
      throw new Error('OffscreenCanvas unavailable');
    }
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');

    if (options.operation === 'convert' && (options.convertTarget === 'jpg' || options.convertTarget === 'pdf')) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(bitmap, 0, 0, width, height);

    if (options.operation === 'watermark') {
      const label = sanitizeText(options.watermarkText || 'PdfPixels Batch');
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(-Math.PI / 6);
      const fontSize = Math.max(18, Math.round(Math.min(width, height) * 0.065));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = 'rgba(220, 38, 38, 0.34)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }

    if (options.operation === 'convert' && options.convertTarget === 'pdf') {
      const jpgBuffer = await encodeCanvas(canvas, 'image/jpeg', Math.max(0.5, options.quality));
      const pdf = await PDFDocument.create();
      const embedded = await pdf.embedJpg(jpgBuffer);
      const page = pdf.addPage([width, height]);
      page.drawImage(embedded, { x: 0, y: 0, width, height });
      const pdfBytes = await pdf.save({ useObjectStreams: true });
      const copy = new Uint8Array(pdfBytes.byteLength);
      copy.set(pdfBytes);
      return {
        id: input.id,
        ok: true,
        outName: `${baseName}.pdf`,
        mimeType: 'application/pdf',
        bytes: copy.buffer,
        originalSize: bytes.byteLength,
        processedSize: copy.byteLength,
        note: 'Converted to PDF in Worker',
      };
    }

    const outMime =
      options.operation === 'convert'
        ? options.convertTarget === 'png'
          ? 'image/png'
          : options.convertTarget === 'webp'
            ? 'image/webp'
            : 'image/jpeg'
        : options.operation === 'compress'
          ? mimeType === 'image/png'
            ? 'image/webp'
            : mimeType || 'image/jpeg'
          : mimeType || 'image/jpeg';

    const outBuffer = await encodeCanvas(canvas, outMime, options.quality);
    return {
      id: input.id,
      ok: true,
      outName: `${baseName}.${mimeToExt(outMime)}`,
      mimeType: outMime,
      bytes: outBuffer,
      originalSize: bytes.byteLength,
      processedSize: outBuffer.byteLength,
      note:
        options.operation === 'watermark'
          ? 'Watermarked in Worker'
          : options.operation === 'convert'
            ? `Converted to ${mimeToExt(outMime).toUpperCase()}`
            : 'Compressed in Worker',
    };
  } finally {
    bitmap.close();
  }
}

async function processPdfInBrowser(input: BatchProcessInput): Promise<BatchProcessOutput> {
  const { name, bytes, options, fileIndex } = input;
  const baseName = name.replace(/\.pdf$/i, '') || 'document';
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  if (pdf.isEncrypted) {
    throw new Error('Encrypted PDF skipped (unlock first)');
  }

  const totalPages = pdf.getPageCount();
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);

  if (options.operation === 'watermark') {
    const label = sanitizeText(options.watermarkText || 'CONFIDENTIAL');
    for (let i = 0; i < totalPages; i += 1) {
      const page = pdf.getPage(i);
      const { width, height } = page.getSize();
      page.drawText(label, {
        x: Math.max(24, width * 0.18),
        y: height * 0.45,
        size: Math.min(44, Math.max(18, width * 0.06)),
        font,
        color: rgb(0.75, 0.12, 0.12),
        opacity: 0.28,
        rotate: degrees(35),
      });
    }
  } else if (options.operation === 'bates') {
    const prefix = sanitizeText(options.batesPrefix || 'DOC-');
    const baseNum = Math.max(1, options.batesStartIndex || 1) + fileIndex * 100;
    for (let i = 0; i < totalPages; i += 1) {
      const page = pdf.getPage(i);
      const { width } = page.getSize();
      const stamp = `${prefix}${String(baseNum + i).padStart(6, '0')}`;
      page.drawText(stamp, {
        x: Math.max(24, width - 120),
        y: 20,
        size: 10,
        font,
        color: rgb(0.08, 0.12, 0.2),
      });
    }
  } else if (options.operation === 'compress') {
    pdf.setCreator('PdfPixels Local Folder Studio');
    pdf.setProducer('PdfPixels Browser Optimizer');
  }

  const saved = await pdf.save({ useObjectStreams: true });
  const copy = new Uint8Array(saved.byteLength);
  copy.set(saved);

  return {
    id: input.id,
    ok: true,
    outName: `${baseName}.pdf`,
    mimeType: 'application/pdf',
    bytes: copy.buffer,
    originalSize: bytes.byteLength,
    processedSize: copy.byteLength,
    note:
      options.operation === 'bates'
        ? `Bates stamped (${totalPages} pg)`
        : options.operation === 'watermark'
          ? `Watermarked (${totalPages} pg)`
          : `PDF stream optimized (${totalPages} pg)`,
  };
}

/**
 * Pure WebWorker-safe per-file processor for up to 500 local PDFs or images.
 */
export async function processBatchItemBuffer(input: BatchProcessInput): Promise<BatchProcessOutput> {
  try {
    if (isPdfInput(input.name, input.mimeType)) {
      return await processPdfInBrowser(input);
    }
    return await processImageWithOffscreenCanvas(input);
  } catch (err) {
    return {
      id: input.id,
      ok: false,
      outName: input.name,
      mimeType: input.mimeType,
      originalSize: input.bytes.byteLength,
      note: 'Skipped',
      error: err instanceof Error ? err.message : 'Failed to process local file',
    };
  }
}
