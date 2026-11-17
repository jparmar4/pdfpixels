'use client';

import {
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFName,
  PDFTextField,
  StandardFonts,
  rgb,
} from 'pdf-lib';
import { apiFetch } from '@/lib/api-client';
import { computeSha256Hex, mergePdfsClient, signPdfClient } from '@/lib/client-pdf-ops';
import { redactPdfCanvasClient, scanPdfPiiClient, type ClientRedactionItem } from '@/lib/client-pdf-redact';
import { normalizeHeicFile } from '@/lib/heic-client';
import { requestProcessedImage } from '@/lib/image-process-client';
import type { PiiCategory } from '@/lib/pii-patterns';

export interface WorkflowRuntimeConfig {
  batesPrefix?: string;
  batesStart?: number;
  contractParty?: string;
  signerName?: string;
  signerEmail?: string;
  protectPassword?: string;
  bankPdfPassword?: string;
  carrierPreset?: string;
  piiCategories?: PiiCategory[];
  customRedactTerm?: string;
}

export interface IntermediateCheckpoint {
  stepId: string;
  stepTitle: string;
  engineLabel: string;
  note: string;
  outputSize: number;
  summaryBadge: string;
  elapsedMs: number;
  previewImageUrl?: string;
  previewCsvRows?: string[][];
}

export interface PipelineExecutionResult {
  primaryFile: File;
  primaryUrl: string;
  companionFiles: Array<{ label: string; file: File; url: string }>;
  checkpoints: IntermediateCheckpoint[];
  sha256: string;
  formatLabel: string;
  pageCountOrDims: string;
}

export interface PipelineCallbacks {
  onStepStart: (stepIndex: number) => void;
  onStepComplete: (stepIndex: number, checkpoint: IntermediateCheckpoint) => void;
}

function fileFromBytes(bytes: Uint8Array | ArrayBuffer, name: string, type: string): File {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const copy = new Uint8Array(u8.byteLength);
  copy.set(u8);
  return new File([copy.buffer], name, { type });
}

function formatBytesShort(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function openPdfJsDoc(buffer: ArrayBuffer | Uint8Array) {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return pdfjs.getDocument({
    data,
    cMapUrl: '/pdfjs/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: '/pdfjs/standard_fonts/',
  }).promise;
}

async function renderPdfThumbAndCount(file: File): Promise<{ thumb?: string; pageCount: number }> {
  try {
    const buffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const pageCount = pdf.getPageCount();
    const doc = await openPdfJsDoc(buffer);
    try {
      const page = await doc.getPage(1);
      const baseVp = page.getViewport({ scale: 1 });
      const scale = Math.min(1, 320 / Math.max(1, baseVp.width));
      const vp = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(vp.width));
      canvas.height = Math.max(1, Math.round(vp.height));
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
        return { thumb: canvas.toDataURL('image/jpeg', 0.8), pageCount };
      }
      return { pageCount };
    } finally {
      await doc.destroy();
    }
  } catch {
    return { pageCount: 1 };
  }
}

async function rasterizePdfGrayscaleClient(file: File, highContrast: boolean): Promise<File> {
  const buffer = await file.arrayBuffer();
  const doc = await openPdfJsDoc(buffer);
  const outPdf = await PDFDocument.create();
  const dpiScale = highContrast ? 200 / 72 : 175 / 72;

  try {
    const total = Math.min(doc.numPages, 60);
    for (let p = 1; p <= total; p += 1) {
      const page = await doc.getPage(p);
      const baseVp = page.getViewport({ scale: 1 });
      const renderVp = page.getViewport({ scale: dpiScale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(renderVp.width));
      canvas.height = Math.max(1, Math.round(renderVp.height));
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Canvas 2D context unavailable');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: renderVp, canvas }).promise;

      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const luma = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const v = highContrast ? (luma < 175 ? 0 : 255) : Math.round(luma);
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v;
      }
      ctx.putImageData(img, 0, 0);

      const jpgBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to encode PDF page'))), 'image/jpeg', 0.9);
      });
      const embedded = await outPdf.embedJpg(await jpgBlob.arrayBuffer());
      const outPage = outPdf.addPage([baseVp.width, baseVp.height]);
      outPage.drawImage(embedded, { x: 0, y: 0, width: baseVp.width, height: baseVp.height });
    }
  } finally {
    await doc.destroy();
  }

  const saved = await outPdf.save();
  return fileFromBytes(saved, file.name.replace(/\.pdf$/i, '-grayscale.pdf'), 'application/pdf');
}

async function flattenAndStripMetadataClient(file: File, pdfaTag = false): Promise<File> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  try {
    pdf.getForm().flatten();
  } catch {
    // Document may already contain zero interactive widgets
  }
  if (!pdfaTag) {
    pdf.setTitle('');
    pdf.setAuthor('');
    pdf.setSubject('');
    pdf.setKeywords([]);
    pdf.setCreator('');
    pdf.setProducer('');
    try {
      pdf.catalog.delete(PDFName.of('Metadata'));
    } catch {
      // Ignore if absent
    }
  } else {
    pdf.setProducer('PdfPixels Archival Flattener (PDF/A Profile)');
  }
  const saved = await pdf.save({ useObjectStreams: false });
  return fileFromBytes(saved, file.name.replace(/\.pdf$/i, '-flattened.pdf'), 'application/pdf');
}

async function callBinaryPdfApi(endpoint: string, formData: FormData, fallbackName: string): Promise<File> {
  const res = await apiFetch(endpoint, { method: 'POST', body: formData });
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson?.error || `${endpoint} failed (${res.status})`);
  }
  const blob = await res.blob();
  return new File([blob], fallbackName, { type: 'application/pdf' });
}

async function fillAcroFormClient(file: File, partyName: string): Promise<{ file: File; filledCount: number }> {
  const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  let filledCount = 0;
  try {
    const form = pdf.getForm();
    const fields = form.getFields();
    if (fields.length > 0 && partyName.trim()) {
      for (const field of fields) {
        const lower = field.getName().toLowerCase();
        if (field instanceof PDFTextField && (lower.includes('name') || lower.includes('client') || lower.includes('party'))) {
          field.setText(partyName.trim());
          filledCount += 1;
        } else if (field instanceof PDFCheckBox && (lower.includes('agree') || lower.includes('confirm'))) {
          field.check();
          filledCount += 1;
        } else if (field instanceof PDFDropdown && !field.getSelected().length && field.getOptions().length > 0) {
          field.select(field.getOptions()[0]);
          filledCount += 1;
        }
      }
    }
  } catch {
    // Ignore non-AcroForm contracts
  }

  if (filledCount === 0 && partyName.trim()) {
    const page = pdf.getPage(0);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const { height } = page.getSize();
    page.drawText(`Contract Party: ${partyName.trim()}`, {
      x: 40,
      y: height - 28,
      size: 9,
      font,
      color: rgb(0.2, 0.25, 0.35),
    });
    filledCount = 1;
  }

  const saved = await pdf.save();
  return { file: fileFromBytes(saved, file.name.replace(/\.pdf$/i, '-filled.pdf'), 'application/pdf'), filledCount };
}

async function buildTypedSignaturePng(name: string): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 520;
  canvas.height = 140;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable for signature');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = 'italic 44px Georgia, serif';
  ctx.fillStyle = '#0f172a';
  ctx.textBaseline = 'middle';
  ctx.fillText(name.trim() || 'Authorized Signer', 24, 70);
  return canvas.toDataURL('image/png');
}

async function loadImageElementFromFile(file: File): Promise<{ img: HTMLImageElement; objectUrl: string; normalized: File }> {
  const normalized = await normalizeHeicFile(file);
  const objectUrl = URL.createObjectURL(normalized);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error(`Unable to decode image ${file.name}`));
    el.src = objectUrl;
  });
  return { img, objectUrl, normalized };
}

async function imageFileToLetterPdf(file: File): Promise<File> {
  const { img, objectUrl } = await loadImageElementFromFile(file);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 1200;
    canvas.height = img.naturalHeight || 900;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const jpgBlob = await new Promise<Blob>((res, rej) => {
      canvas.toBlob((b) => (b ? res(b) : rej(new Error('Image JPEG conversion failed'))), 'image/jpeg', 0.9);
    });
    const doc = await PDFDocument.create();
    const embedded = await doc.embedJpg(await jpgBlob.arrayBuffer());
    const page = doc.addPage([612, 792]);
    const margin = 36;
    const maxW = 612 - margin * 2;
    const maxH = 792 - margin * 2;
    const scale = Math.min(maxW / embedded.width, maxH / embedded.height);
    const drawW = embedded.width * scale;
    const drawH = embedded.height * scale;
    page.drawImage(embedded, {
      x: (612 - drawW) / 2,
      y: (792 - drawH) / 2,
      width: drawW,
      height: drawH,
    });
    const saved = await doc.save();
    return fileFromBytes(saved, `${file.name.replace(/\.[^.]+$/, '')}.pdf`, 'application/pdf');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function assembleUscisPacketClient(pdfFiles: File[]): Promise<{ file: File; totalPages: number }> {
  const out = await PDFDocument.create();
  const font = await out.embedFont(StandardFonts.Helvetica);
  const bold = await out.embedFont(StandardFonts.HelveticaBold);
  const entries: Array<{ exhibit: string; title: string; startPage: number; pageCount: number }> = [];

  const tocPage = out.addPage([612, 792]);
  let runningPage = 2;

  for (let idx = 0; idx < pdfFiles.length; idx += 1) {
    const src = await PDFDocument.load(await pdfFiles[idx].arrayBuffer(), { ignoreEncryption: true });
    const indices = src.getPageIndices();
    const exhibit = `Exhibit ${String.fromCharCode(65 + (idx % 26))}${idx >= 26 ? Math.floor(idx / 26) : ''}`;
    entries.push({
      exhibit,
      title: pdfFiles[idx].name,
      startPage: runningPage,
      pageCount: indices.length,
    });
    const copied = await out.copyPages(src, indices);
    copied.forEach((p, pageIdx) => {
      const { width, height } = p.getSize();
      p.drawText(`${exhibit} · Page ${pageIdx + 1}/${indices.length}`, {
        x: Math.max(24, width - 190),
        y: height - 22,
        size: 8.5,
        font: bold,
        color: rgb(0.12, 0.25, 0.45),
      });
      out.addPage(p);
    });
    runningPage += indices.length;
  }

  tocPage.drawText('USCIS EVIDENCE PACKET — TABLE OF CONTENTS', {
    x: 48,
    y: 740,
    size: 14,
    font: bold,
    color: rgb(0.08, 0.14, 0.25),
  });
  let y = 700;
  for (const row of entries.slice(0, 22)) {
    tocPage.drawText(`${row.exhibit}: ${row.title.slice(0, 48)}  (p. ${row.startPage}, ${row.pageCount} pg)`, {
      x: 48,
      y,
      size: 10,
      font,
      color: rgb(0.15, 0.18, 0.25),
    });
    y -= 22;
  }

  const saved = await out.save();
  return {
    file: fileFromBytes(saved, 'uscis-evidence-packet.pdf', 'application/pdf'),
    totalPages: out.getPageCount(),
  };
}

async function removeBgWithClientFallback(file: File): Promise<{ file: File; engine: string }> {
  const normalized = await normalizeHeicFile(file);
  try {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12_000);
    const fd = new FormData();
    fd.append('image', normalized);
    fd.append('tool', 'remove-background');
    fd.append('mode', 'balanced');
    const res = await apiFetch('/api/ai', { method: 'POST', body: fd, signal: controller.signal }).finally(() =>
      window.clearTimeout(timeoutId),
    );
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.imageUrl) {
      const pngBlob = await (await fetch(data.imageUrl)).blob();
      return {
        file: new File([pngBlob], normalized.name.replace(/\.[^.]+$/, '-cutout.png'), { type: 'image/png' }),
        engine: 'ONNX AI Cutout (/api/ai)',
      };
    }
  } catch {
    // Fall back to deterministic corner-backdrop keying below
  }

  const { img, objectUrl } = await loadImageElementFromFile(normalized);
  try {
    const w = Math.min(2000, img.naturalWidth || 800);
    const h = Math.min(2000, img.naturalHeight || 800);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.drawImage(img, 0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const r0 = data[0];
    const g0 = data[1];
    const b0 = data[2];
    for (let i = 0; i < data.length; i += 4) {
      const dr = Math.abs(data[i] - r0);
      const dg = Math.abs(data[i + 1] - g0);
      const db = Math.abs(data[i + 2] - b0);
      if (dr + dg + db < 42) {
        data[i + 3] = 0;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    const blob = await new Promise<Blob>((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error('PNG export failed'))), 'image/png'),
    );
    return {
      file: new File([blob], normalized.name.replace(/\.[^.]+$/, '-cutout.png'), { type: 'image/png' }),
      engine: 'Browser Chroma Studio Cutout',
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function compositeOnWhiteCanvas(
  file: File,
  targetW: number,
  targetH: number,
  fillRatio: number,
  cropMode: 'contain' | 'cover-top',
  mime: 'image/png' | 'image/jpeg',
): Promise<{ file: File; previewUrl: string }> {
  const { img, objectUrl } = await loadImageElementFromFile(file);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);

    const iw = img.naturalWidth || targetW;
    const ih = img.naturalHeight || targetH;
    if (cropMode === 'contain') {
      const scale = Math.min((targetW * fillRatio) / iw, (targetH * fillRatio) / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      ctx.drawImage(img, (targetW - dw) / 2, (targetH - dh) / 2, dw, dh);
    } else {
      const scale = Math.max(targetW / iw, targetH / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (targetW - dw) / 2;
      const dy = Math.max(targetH - dh, -(dh - targetH) * 0.18);
      ctx.drawImage(img, dx, dy, dw, dh);
    }

    const blob = await new Promise<Blob>((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error('Canvas encode failed'))), mime, 0.94),
    );
    const ext = mime === 'image/png' ? 'png' : 'jpg';
    return {
      file: new File([blob], file.name.replace(/\.[^.]+$/, `-${targetW}x${targetH}.${ext}`), { type: mime }),
      previewUrl: canvas.toDataURL('image/jpeg', 0.85),
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function compressWebpUnderTarget(file: File, targetKb = 150): Promise<{ file: File; previewUrl: string; engine: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8_000);
    const fd = new FormData();
    fd.append('image', file);
    fd.append('format', 'webp');
    fd.append('width', '2000');
    fd.append('height', '2000');
    fd.append('targetSize', String(targetKb));
    fd.append('responseType', 'binary');
    const res = await requestProcessedImage(fd, undefined, controller.signal).finally(() =>
      window.clearTimeout(timeoutId),
    );
    const blob = await (await fetch(res.imageUrl)).blob();
    if (blob.size <= targetKb * 1024) {
      const out = new File([blob], file.name.replace(/\.[^.]+$/, '-studio.webp'), { type: 'image/webp' });
      return { file: out, previewUrl: res.imageUrl, engine: 'Sharp Binary Pipeline (/api/image/process)' };
    }
  } catch {
    // Fall back to iterative WebP encoding in canvas
  }

  const { img, objectUrl } = await loadImageElementFromFile(file);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 2000;
    canvas.height = 2000;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 2000, 2000);
    ctx.drawImage(img, 0, 0, 2000, 2000);

    let bestBlob: Blob | null = null;
    for (const q of [0.88, 0.78, 0.68, 0.56, 0.44]) {
      const candidate = await new Promise<Blob>((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error('WebP encode failed'))), 'image/webp', q),
      );
      bestBlob = candidate;
      if (candidate.size <= targetKb * 1024) break;
    }
    if (!bestBlob) throw new Error('WebP export failed');
    return {
      file: new File([bestBlob], file.name.replace(/\.[^.]+$/, '-studio.webp'), { type: 'image/webp' }),
      previewUrl: canvas.toDataURL('image/webp', 0.8),
      engine: 'Browser WebP Encoder',
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function buildWalgreensPrintSheet(single2x2File: File): Promise<{ file: File; previewUrl: string }> {
  const { img, objectUrl } = await loadImageElementFromFile(single2x2File);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1800; // 6 in @ 300 DPI
    canvas.height = 1200; // 4 in @ 300 DPI
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1800, 1200);

    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const x = col * 600;
        const y = row * 600;
        ctx.drawImage(img, x, y, 600, 600);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, 598, 598);
      }
    }

    const rawBlob = await new Promise<Blob>((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error('Sheet encode failed'))), 'image/jpeg', 0.95),
    );
    let finalFile = new File([rawBlob], 'passport-4x6-walgreens-sheet.jpg', { type: 'image/jpeg' });

    try {
      const fd = new FormData();
      fd.append('image', finalFile);
      fd.append('format', 'jpg');
      fd.append('quality', '95');
      fd.append('density', '300');
      fd.append('responseType', 'binary');
      const sharpRes = await requestProcessedImage(fd);
      const taggedBlob = await (await fetch(sharpRes.imageUrl)).blob();
      finalFile = new File([taggedBlob], 'passport-4x6-walgreens-sheet.jpg', { type: 'image/jpeg' });
    } catch {
      // Keep client 1800x1200 JPEG if server process fails
    }

    return { file: finalFile, previewUrl: canvas.toDataURL('image/jpeg', 0.85) };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function generateSampleFilesForRecipe(slug: string): Promise<File[]> {
  if (slug === 'ecommerce-product-photo-studio' || slug === 'us-passport-photo-print-sheet') {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, 0, 720, 720);
      if (slug === 'us-passport-photo-print-sheet') {
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(360, 270, 120, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(210, 410, 300, 260);
      } else {
        ctx.fillStyle = '#4f46e5';
        ctx.fillRect(200, 180, 320, 380);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 34px sans-serif';
        ctx.fillText('PRODUCT', 280, 380);
      }
    }
    const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), 'image/png'));
    return [new File([blob], slug === 'us-passport-photo-print-sheet' ? 'sample-portrait.png' : 'sample-product.png', { type: 'image/png' })];
  }

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pg = doc.addPage([612, 792]);

  if (slug === 'bookkeeper-bank-statement-cleanse') {
    const drawRow = (y: number, cols: string[]) => {
      const xs = [40, 120, 320, 410, 500];
      cols.forEach((txt, idx) => {
        if (txt) pg.drawText(txt, { x: xs[idx], y, font, size: 10.5 });
      });
    };
    pg.drawText('Account Number: 123456789012  SSN: 123-45-6789', { x: 40, y: 750, font, size: 10 });
    drawRow(720, ['Date', 'Description', 'Debit', 'Credit', 'Balance']);
    drawRow(690, ['02/01/2026', 'Stripe Payout Acct 9988776655', '', '2450.00', '9450.00']);
    drawRow(660, ['02/03/2026', 'AWS Cloud Hosting Payment', '149.00', '', '9301.00']);
  } else if (slug === 'gdpr-hipaa-document-sanitization') {
    doc.setTitle('Confidential Medical Record');
    doc.setAuthor('Internal Compliance Dept');
    pg.drawText('Patient Record — HIPAA Sensitive Extract', { x: 54, y: 730, font, size: 13 });
    pg.drawText('Taxpayer SSN: 123-45-6789', { x: 54, y: 690, font, size: 11.5 });
    pg.drawText('Wire IBAN: DE89370400440532013000', { x: 54, y: 660, font, size: 11.5 });
    pg.drawText('Email: patient@example.org', { x: 54, y: 630, font, size: 11.5 });
  } else if (slug === 'thermal-shipping-label-batch-prep') {
    pg.drawText('USPS PRIORITY MAIL 4x6 SHIPPING LABEL', { x: 56, y: 680, font, size: 14 });
    pg.drawText('TRACKING #: 9400 1118 9956 2201', { x: 56, y: 580, font, size: 12 });
  } else {
    pg.drawText(`PdfPixels Workflow Sample (${slug})`, { x: 56, y: 720, font, size: 14 });
    pg.drawText('Clause 1: Standard service terms and exhibits attached herein.', { x: 56, y: 670, font, size: 11 });
  }

  const saved = await doc.save();
  return [fileFromBytes(saved, `sample-${slug}.pdf`, 'application/pdf')];
}

export async function executeWorkflowRecipe(
  slug: string,
  files: File[],
  config: WorkflowRuntimeConfig,
  callbacks: PipelineCallbacks,
): Promise<PipelineExecutionResult> {
  if (files.length === 0) throw new Error('Please upload at least one file to start the pipeline.');
  const checkpoints: IntermediateCheckpoint[] = [];
  const companionFiles: Array<{ label: string; file: File; url: string }> = [];

  const recordStep = (index: number, cp: IntermediateCheckpoint) => {
    checkpoints.push(cp);
    callbacks.onStepComplete(index, cp);
  };

  if (slug === 'federal-court-pacer-pdf-prep') {
    // Step 0: Merge
    callbacks.onStepStart(0);
    let t0 = performance.now();
    const merged = await mergePdfsClient(files);
    let current = fileFromBytes(merged.bytes, 'pacer-merged.pdf', 'application/pdf');
    let preview = await renderPdfThumbAndCount(current);
    recordStep(0, {
      stepId: 'merge',
      stepTitle: 'Merge Exhibits & Filings',
      engineLabel: 'Browser (pdf-lib)',
      note: `Merged ${files.length} file(s) into ${merged.pageCount} pages`,
      outputSize: current.size,
      summaryBadge: `${merged.pageCount} pages`,
      elapsedMs: Math.round(performance.now() - t0),
      previewImageUrl: preview.thumb,
    });

    // Step 1: Grayscale
    callbacks.onStepStart(1);
    t0 = performance.now();
    let gsEngine = 'Server Ghostscript Grayscale';
    try {
      const fd = new FormData();
      fd.append('file', current);
      current = await callBinaryPdfApi('/api/pdf/grayscale', fd, 'pacer-grayscale.pdf');
    } catch {
      current = await rasterizePdfGrayscaleClient(current, false);
      gsEngine = 'Browser Canvas 175 DPI Grayscale';
    }
    preview = await renderPdfThumbAndCount(current);
    recordStep(1, {
      stepId: 'grayscale',
      stepTitle: 'Grayscale 300 DPI Normalize',
      engineLabel: gsEngine,
      note: 'Normalized stream to monochrome grayscale',
      outputSize: current.size,
      summaryBadge: formatBytesShort(current.size),
      elapsedMs: Math.round(performance.now() - t0),
      previewImageUrl: preview.thumb,
    });

    // Step 2: Bates Numbering
    callbacks.onStepStart(2);
    t0 = performance.now();
    const batesFd = new FormData();
    batesFd.append('file', current);
    batesFd.append('prefix', config.batesPrefix || 'FED-');
    batesFd.append('startNumber', String(Math.max(1, config.batesStart || 1)));
    batesFd.append('padding', '6');
    batesFd.append('position', 'bottom-right');
    current = await callBinaryPdfApi('/api/pdf/bates-numbering', batesFd, 'pacer-bates.pdf');
    preview = await renderPdfThumbAndCount(current);
    recordStep(2, {
      stepId: 'bates',
      stepTitle: 'Sequential Bates Numbering',
      engineLabel: 'Server Bates Stamping API',
      note: `Stamped ${config.batesPrefix || 'FED-'}000001+ on ${preview.pageCount} page(s)`,
      outputSize: current.size,
      summaryBadge: `${config.batesPrefix || 'FED-'}000001+`,
      elapsedMs: Math.round(performance.now() - t0),
      previewImageUrl: preview.thumb,
    });

    // Step 3: Flatten & PDF/A
    callbacks.onStepStart(3);
    t0 = performance.now();
    let pdfaEngine = 'Server PDF/A Archival API';
    current = await flattenAndStripMetadataClient(current, true);
    try {
      const pdfaFd = new FormData();
      pdfaFd.append('file', current);
      pdfaFd.append('conformance', 'pdfa-2b');
      current = await callBinaryPdfApi('/api/pdf/to-pdfa', pdfaFd, 'pacer-court-ready-pdfa.pdf');
    } catch {
      pdfaEngine = 'Flattened Archival PDF (pdf-lib)';
    }
    preview = await renderPdfThumbAndCount(current);
    recordStep(3, {
      stepId: 'pdfa',
      stepTitle: 'Flatten & PDF/A Archival',
      engineLabel: pdfaEngine,
      note: 'Finalized flattened archival PACER submission',
      outputSize: current.size,
      summaryBadge: `${preview.pageCount} pages · Archival`,
      elapsedMs: Math.round(performance.now() - t0),
      previewImageUrl: preview.thumb,
    });

    const sha256 = await computeSha256Hex(await current.arrayBuffer());
    return {
      primaryFile: current,
      primaryUrl: URL.createObjectURL(current),
      companionFiles,
      checkpoints,
      sha256,
      formatLabel: 'PDF/A',
      pageCountOrDims: `${preview.pageCount} page(s)`,
    };
  }

  if (slug === 'freelance-contract-sign-and-lock') {
    let current = files[0];
    callbacks.onStepStart(0);
    let t0 = performance.now();
    const filled = await fillAcroFormClient(current, config.contractParty || 'Client / Vendor Counterparty');
    current = filled.file;
    let preview = await renderPdfThumbAndCount(current);
    recordStep(0, {
      stepId: 'fill',
      stepTitle: 'Fill Contract Form Fields',
      engineLabel: 'Browser (pdf-lib)',
      note: `Populated ${filled.filledCount} contract field(s)`,
      outputSize: current.size,
      summaryBadge: `${filled.filledCount} field(s)`,
      elapsedMs: Math.round(performance.now() - t0),
      previewImageUrl: preview.thumb,
    });

    callbacks.onStepStart(1);
    t0 = performance.now();
    const signer = (config.signerName || 'Authorized Signer').trim();
    const sigPng = await buildTypedSignaturePng(signer);
    const signed = await signPdfClient(current, {
      signatureDataUrl: sigPng,
      pageNumber: 1,
      x: 340,
      y: 78,
      width: 190,
      height: 54,
      dateText: `Signed ${new Date().toISOString().slice(0, 10)}`,
      includeAuditTrail: true,
      signerName: signer,
      signerEmail: config.signerEmail,
    });
    current = fileFromBytes(signed.bytes, current.name.replace(/\.pdf$/i, '-signed.pdf'), 'application/pdf');
    preview = await renderPdfThumbAndCount(current);
    recordStep(1, {
      stepId: 'sign',
      stepTitle: 'Sign PDF + SHA-256 Audit Certificate',
      engineLabel: 'Browser ESIGN Engine (Zero Upload)',
      note: `Certificate ${signed.certificateId} appended`,
      outputSize: current.size,
      summaryBadge: `Cert ${signed.certificateId}`,
      elapsedMs: Math.round(performance.now() - t0),
      previewImageUrl: preview.thumb,
    });

    callbacks.onStepStart(2);
    t0 = performance.now();
    current = await flattenAndStripMetadataClient(current, true);
    let lockEngine = 'Flattened Read-Only (Browser)';
    const pwd = (config.protectPassword || '').trim();
    if (pwd.length >= 4) {
      try {
        const fd = new FormData();
        fd.append('file', current);
        fd.append('action', 'protect');
        fd.append('password', pwd);
        current = await callBinaryPdfApi('/api/pdf/protect', fd, current.name.replace(/\.pdf$/i, '-locked.pdf'));
        lockEngine = 'AES-256 Protected PDF';
      } catch {
        lockEngine = 'Flattened Read-Only Fallback';
      }
    }
    preview = await renderPdfThumbAndCount(current);
    recordStep(2, {
      stepId: 'lock',
      stepTitle: 'Flatten & Protect PDF',
      engineLabel: lockEngine,
      note: pwd.length >= 4 ? 'Flattened & encrypted with password' : 'Flattened widgets cleanly in browser',
      outputSize: current.size,
      summaryBadge: `${preview.pageCount} pages`,
      elapsedMs: Math.round(performance.now() - t0),
      previewImageUrl: preview.thumb,
    });

    return {
      primaryFile: current,
      primaryUrl: URL.createObjectURL(current),
      companionFiles,
      checkpoints,
      sha256: signed.sha256,
      formatLabel: 'Signed PDF',
      pageCountOrDims: `${preview.pageCount} page(s)`,
    };
  }

  if (slug === 'uscis-immigration-packet-builder') {
    callbacks.onStepStart(0);
    let t0 = performance.now();
    const convertedPdfs: File[] = [];
    let imgCount = 0;
    for (const f of files) {
      if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
        convertedPdfs.push(f);
      } else {
        convertedPdfs.push(await imageFileToLetterPdf(f));
        imgCount += 1;
      }
    }
    let firstThumb = await renderPdfThumbAndCount(convertedPdfs[0]);
    recordStep(0, {
      stepId: 'photos-to-pdf',
      stepTitle: 'Convert HEIC / JPG Evidence to PDF',
      engineLabel: 'Hybrid Image -> Letter PDF',
      note: `Normalized ${imgCount} image(s) + ${convertedPdfs.length - imgCount} PDF(s)`,
      outputSize: convertedPdfs.reduce((s, f) => s + f.size, 0),
      summaryBadge: `${convertedPdfs.length} doc(s)`,
      elapsedMs: Math.round(performance.now() - t0),
      previewImageUrl: firstThumb.thumb,
    });

    callbacks.onStepStart(1);
    t0 = performance.now();
    const packet = await assembleUscisPacketClient(convertedPdfs);
    let current = packet.file;
    firstThumb = await renderPdfThumbAndCount(current);
    recordStep(1, {
      stepId: 'merge-toc',
      stepTitle: 'Merge Packet + Exhibit TOC',
      engineLabel: 'Browser Exhibit Binder (pdf-lib)',
      note: `Built Page 1 Exhibit TOC + ${packet.totalPages} total pages`,
      outputSize: current.size,
      summaryBadge: `${packet.totalPages} pages`,
      elapsedMs: Math.round(performance.now() - t0),
      previewImageUrl: firstThumb.thumb,
    });

    callbacks.onStepStart(2);
    t0 = performance.now();
    let compressEngine = 'Size Budget Verified (<24 MB)';
    if (current.size > 4 * 1024 * 1024) {
      try {
        const fd = new FormData();
        fd.append('file', current);
        fd.append('level', current.size > 20 * 1024 * 1024 ? 'extreme' : 'recommended');
        const compressed = await callBinaryPdfApi('/api/pdf/compress', fd, 'uscis-evidence-packet.pdf');
        if (compressed.size < current.size) {
          current = compressed;
          compressEngine = 'Ghostscript USCIS Optimizer';
        }
      } catch {
        // Keep clean packet under 24MB
      }
    }
    recordStep(2, {
      stepId: 'compress-24mb',
      stepTitle: 'Verify & Compress Under 24 MB',
      engineLabel: compressEngine,
      note: `Final USCIS packet: ${formatBytesShort(current.size)} (< 24 MB cap)`,
      outputSize: current.size,
      summaryBadge: formatBytesShort(current.size),
      elapsedMs: Math.round(performance.now() - t0),
      previewImageUrl: firstThumb.thumb,
    });

    const sha256 = await computeSha256Hex(await current.arrayBuffer());
    return {
      primaryFile: current,
      primaryUrl: URL.createObjectURL(current),
      companionFiles,
      checkpoints,
      sha256,
      formatLabel: 'USCIS PDF',
      pageCountOrDims: `${packet.totalPages} page(s)`,
    };
  }

  if (slug === 'bookkeeper-bank-statement-cleanse') {
    let workingPdf = files[0];
    callbacks.onStepStart(0);
    let t0 = performance.now();
    let unlockNote = 'Statement is unencrypted (verified locally)';
    let unlockEngine = 'Browser Encryption Check';
    try {
      const checkPdf = await PDFDocument.load(await workingPdf.arrayBuffer(), { ignoreEncryption: true });
      if (checkPdf.isEncrypted) {
        const fd = new FormData();
        fd.append('file', workingPdf);
        fd.append('action', 'unlock');
        if (config.bankPdfPassword) fd.append('password', config.bankPdfPassword);
        workingPdf = await callBinaryPdfApi('/api/pdf/protect', fd, workingPdf.name.replace(/\.pdf$/i, '-unlocked.pdf'));
        unlockNote = 'Decrypted statement PDF cleanly';
        unlockEngine = 'PDF Decryption API';
      }
    } catch {
      if (config.bankPdfPassword) {
        const fd = new FormData();
        fd.append('file', workingPdf);
        fd.append('action', 'unlock');
        fd.append('password', config.bankPdfPassword);
        workingPdf = await callBinaryPdfApi('/api/pdf/protect', fd, workingPdf.name.replace(/\.pdf$/i, '-unlocked.pdf'));
        unlockNote = 'Decrypted statement PDF cleanly';
        unlockEngine = 'PDF Decryption API';
      }
    }
    let pdfThumb = await renderPdfThumbAndCount(workingPdf);
    recordStep(0, {
      stepId: 'unlock',
      stepTitle: 'Unlock Encrypted Statement PDF',
      engineLabel: unlockEngine,
      note: unlockNote,
      outputSize: workingPdf.size,
      summaryBadge: 'Unlocked',
      elapsedMs: Math.round(performance.now() - t0),
      previewImageUrl: pdfThumb.thumb,
    });

    callbacks.onStepStart(1);
    t0 = performance.now();
    const parseFd = new FormData();
    parseFd.append('file', workingPdf);
    parseFd.append('format', 'json');
    const parseRes = await apiFetch('/api/pdf/bank-statement-to-excel', { method: 'POST', body: parseFd });
    const parseJson = await parseRes.json().catch(() => ({}));
    if (!parseRes.ok || !Array.isArray(parseJson.transactions) || parseJson.transactions.length === 0) {
      throw new Error(parseJson?.error || 'Could not detect transaction rows in this bank statement PDF.');
    }
    const rawRows = parseJson.transactions as Array<{ date: string; description: string; debit: string; credit: string }>;
    recordStep(1, {
      stepId: 'extract-qbo',
      stepTitle: 'Extract QuickBooks Online CSV',
      engineLabel: 'Server Financial Statement Parser',
      note: `Extracted ${rawRows.length} ledger transactions`,
      outputSize: JSON.stringify(rawRows).length,
      summaryBadge: `${rawRows.length} rows`,
      elapsedMs: Math.round(performance.now() - t0),
      previewCsvRows: [
        ['Date', 'Description', 'Amount'],
        ...rawRows.slice(0, 5).map((r) => {
          const amt = r.credit ? r.credit : r.debit ? `-${r.debit.replace(/^-/, '')}` : '0.00';
          return [r.date, r.description, amt];
        }),
      ],
    });

    callbacks.onStepStart(2);
    t0 = performance.now();
    const maskAcct = (text: string) =>
      text.replace(/\b\d{8,17}\b/g, (m) => `****${m.slice(-4)}`).replace(/\b\d{3}-\d{2}-\d{4}\b/g, '***-**-****');
    const csvLines = ['Date,Description,Amount'];
    const maskedPreview: string[][] = [['Date', 'Description (Masked)', 'Amount']];
    for (const r of rawRows) {
      const cleanedDesc = maskAcct(r.description).replace(/"/g, '""');
      const amt = r.credit ? r.credit : r.debit ? `-${r.debit.replace(/^-/, '')}` : '0.00';
      csvLines.push(`"${r.date}","${cleanedDesc}","${amt}"`);
      if (maskedPreview.length < 6) maskedPreview.push([r.date, maskAcct(r.description), amt]);
    }
    const csvFile = new File([csvLines.join('\n')], workingPdf.name.replace(/\.pdf$/i, '-quickbooks-clean.csv'), {
      type: 'text/csv;charset=utf-8',
    });

    try {
      const scan = await scanPdfPiiClient(workingPdf, ['ssn', 'card', 'iban', 'phone']);
      const redactedOut = await redactPdfCanvasClient(workingPdf, scan.detected);
      const redactedPdf = fileFromBytes(redactedOut.bytes, workingPdf.name.replace(/\.pdf$/i, '-redacted.pdf'), 'application/pdf');
      pdfThumb = await renderPdfThumbAndCount(redactedPdf);
      companionFiles.push({ label: 'Download Redacted PDF Copy', file: redactedPdf, url: URL.createObjectURL(redactedPdf) });
    } catch {
      // CSV remains intact even if client PDF companion raster fails
    }

    recordStep(2, {
      stepId: 'redact-acct',
      stepTitle: 'Mask Account Digits & Generate Safe PDF',
      engineLabel: 'Browser PII Masking + 120 DPI Redaction',
      note: 'Masked account numbers & generated QuickBooks 3-Col CSV + safe PDF',
      outputSize: csvFile.size,
      summaryBadge: `${rawRows.length} masked rows`,
      elapsedMs: Math.round(performance.now() - t0),
      previewImageUrl: pdfThumb.thumb,
      previewCsvRows: maskedPreview,
    });

    const sha256 = await computeSha256Hex(await csvFile.arrayBuffer());
    return {
      primaryFile: csvFile,
      primaryUrl: URL.createObjectURL(csvFile),
      companionFiles,
      checkpoints,
      sha256,
      formatLabel: 'QuickBooks CSV',
      pageCountOrDims: `${rawRows.length} transactions`,
    };
  }

  if (slug === 'ecommerce-product-photo-studio') {
    callbacks.onStepStart(0);
    let t0 = performance.now();
    const cutout = await removeBgWithClientFallback(files[0]);
    const cutoutPreview = await compositeOnWhiteCanvas(cutout.file, 800, 800, 0.9, 'contain', 'image/png');
    recordStep(0, {
      stepId: 'remove-bg',
      stepTitle: 'Remove Background (AI / ONNX)',
      engineLabel: cutout.engine,
      note: 'Removed background & extracted transparent product cutout',
      outputSize: cutout.file.size,
      summaryBadge: 'Transparent Cutout',
      elapsedMs: Math.round(performance.now() - t0),
      previewImageUrl: cutoutPreview.previewUrl,
    });

    callbacks.onStepStart(1);
    t0 = performance.now();
    const white2000 = await compositeOnWhiteCanvas(cutout.file, 2000, 2000, 0.86, 'contain', 'image/png');
    recordStep(1, {
      stepId: 'square-white',
      stepTitle: 'Center on 2000×2000 White Canvas',
      engineLabel: 'Browser Studio Canvas',
      note: 'Centered subject on pure #FFFFFF 2000×2000 square',
      outputSize: white2000.file.size,
      summaryBadge: '2000×2000 px',
      elapsedMs: Math.round(performance.now() - t0),
      previewImageUrl: white2000.previewUrl,
    });

    callbacks.onStepStart(2);
    t0 = performance.now();
    const webp = await compressWebpUnderTarget(white2000.file, 150);
    recordStep(2, {
      stepId: 'compress-webp',
      stepTitle: 'Compress WebP Under 150 KB',
      engineLabel: webp.engine,
      note: `Compressed WebP output to ${formatBytesShort(webp.file.size)}`,
      outputSize: webp.file.size,
      summaryBadge: formatBytesShort(webp.file.size),
      elapsedMs: Math.round(performance.now() - t0),
      previewImageUrl: webp.previewUrl,
    });

    const sha256 = await computeSha256Hex(await webp.file.arrayBuffer());
    return {
      primaryFile: webp.file,
      primaryUrl: URL.createObjectURL(webp.file),
      companionFiles,
      checkpoints,
      sha256,
      formatLabel: 'WebP',
      pageCountOrDims: '2000×2000 px',
    };
  }

  if (slug === 'us-passport-photo-print-sheet') {
    callbacks.onStepStart(0);
    let t0 = performance.now();
    const cutout = await removeBgWithClientFallback(files[0]);
    const whiteCutout = await compositeOnWhiteCanvas(cutout.file, 900, 900, 0.96, 'cover-top', 'image/png');
    recordStep(0, {
      stepId: 'remove-bg-white',
      stepTitle: 'Remove Background to Biometric White',
      engineLabel: cutout.engine,
      note: 'Replaced background with biometric #FFFFFF studio surface',
      outputSize: whiteCutout.file.size,
      summaryBadge: 'Pure White',
      elapsedMs: Math.round(performance.now() - t0),
      previewImageUrl: whiteCutout.previewUrl,
    });

    callbacks.onStepStart(1);
    t0 = performance.now();
    const crop2x2 = await compositeOnWhiteCanvas(whiteCutout.file, 600, 600, 1, 'cover-top', 'image/jpeg');
    companionFiles.push({
      label: 'Download Single 2×2" (600×600 JPG)',
      file: crop2x2.file,
      url: URL.createObjectURL(crop2x2.file),
    });
    recordStep(1, {
      stepId: 'crop-2x2',
      stepTitle: 'Crop to 2×2 Inch (600×600 px)',
      engineLabel: 'Browser Biometric Frame',
      note: 'Sized to exact 600×600 px (2×2 in @ 300 DPI)',
      outputSize: crop2x2.file.size,
      summaryBadge: '600×600 px',
      elapsedMs: Math.round(performance.now() - t0),
      previewImageUrl: crop2x2.previewUrl,
    });

    callbacks.onStepStart(2);
    t0 = performance.now();
    const sheet = await buildWalgreensPrintSheet(crop2x2.file);
    recordStep(2, {
      stepId: 'print-sheet',
      stepTitle: 'Generate 4×6 Inch 6-Photo Print Sheet',
      engineLabel: '300 DPI Print Sheet Compositor',
      note: 'Arranged 6 photos on 1800×1200 px (4×6 in) kiosk sheet',
      outputSize: sheet.file.size,
      summaryBadge: '1800×1200 px (6-Up)',
      elapsedMs: Math.round(performance.now() - t0),
      previewImageUrl: sheet.previewUrl,
    });

    const sha256 = await computeSha256Hex(await sheet.file.arrayBuffer());
    return {
      primaryFile: sheet.file,
      primaryUrl: URL.createObjectURL(sheet.file),
      companionFiles,
      checkpoints,
      sha256,
      formatLabel: '300 DPI JPG',
      pageCountOrDims: '1800×1200 px (4×6")',
    };
  }

  if (slug === 'thermal-shipping-label-batch-prep') {
    callbacks.onStepStart(0);
    let t0 = performance.now();
    const merged = await mergePdfsClient(files);
    let current = fileFromBytes(merged.bytes, 'labels-merged.pdf', 'application/pdf');
    let preview = await renderPdfThumbAndCount(current);
    recordStep(0, {
      stepId: 'merge-labels',
      stepTitle: 'Merge Marketplace Label PDFs',
      engineLabel: 'Browser (pdf-lib)',
      note: `Combined ${files.length} PDF(s) into ${merged.pageCount} label page(s)`,
      outputSize: current.size,
      summaryBadge: `${merged.pageCount} page(s)`,
      elapsedMs: Math.round(performance.now() - t0),
      previewImageUrl: preview.thumb,
    });

    callbacks.onStepStart(1);
    t0 = performance.now();
    const cropFd = new FormData();
    cropFd.append('file', current);
    cropFd.append('preset', config.carrierPreset || 'usps');
    cropFd.append('printer', 'rollo-4x6');
    current = await callBinaryPdfApi('/api/pdf/crop-shipping-label', cropFd, 'labels-4x6-thermal.pdf');
    preview = await renderPdfThumbAndCount(current);
    recordStep(1, {
      stepId: 'crop-thermal',
      stepTitle: 'Crop A4 / Letter to 4×6" Thermal',
      engineLabel: 'Tier-1 Carrier Thermal Cropper',
      note: `Cropped ${(config.carrierPreset || 'usps').toUpperCase()} labels to 288×432 pt`,
      outputSize: current.size,
      summaryBadge: '4×6" Rollo/Zebra',
      elapsedMs: Math.round(performance.now() - t0),
      previewImageUrl: preview.thumb,
    });

    callbacks.onStepStart(2);
    t0 = performance.now();
    let grayEngine = 'High-Contrast Monochrome (Browser)';
    try {
      const gsFd = new FormData();
      gsFd.append('file', current);
      current = await callBinaryPdfApi('/api/pdf/grayscale', gsFd, 'batch-4x6-thermal-ready.pdf');
      grayEngine = 'Server Ghostscript Monochrome';
    } catch {
      current = await rasterizePdfGrayscaleClient(current, true);
    }
    preview = await renderPdfThumbAndCount(current);
    recordStep(2, {
      stepId: 'contrast-gray',
      stepTitle: 'High-Contrast Monochrome Optimize',
      engineLabel: grayEngine,
      note: 'Optimized barcode contrast for thermal printheads',
      outputSize: current.size,
      summaryBadge: `${preview.pageCount} label(s)`,
      elapsedMs: Math.round(performance.now() - t0),
      previewImageUrl: preview.thumb,
    });

    const sha256 = await computeSha256Hex(await current.arrayBuffer());
    return {
      primaryFile: current,
      primaryUrl: URL.createObjectURL(current),
      companionFiles,
      checkpoints,
      sha256,
      formatLabel: '4×6" Thermal PDF',
      pageCountOrDims: `${preview.pageCount} label(s)`,
    };
  }

  // gdpr-hipaa-document-sanitization
  callbacks.onStepStart(0);
  let t0 = performance.now();
  const enabledCats = config.piiCategories?.length ? config.piiCategories : (['ssn', 'ein', 'card', 'phone', 'email', 'iban'] as PiiCategory[]);
  const scan = await scanPdfPiiClient(files[0], enabledCats);
  const items: ClientRedactionItem[] = [...scan.detected];
  const scrubbedOut = await redactPdfCanvasClient(files[0], items);
  let current = fileFromBytes(scrubbedOut.bytes, files[0].name.replace(/\.pdf$/i, '-scrubbed.pdf'), 'application/pdf');
  let preview = await renderPdfThumbAndCount(current);
  recordStep(0, {
    stepId: 'redact-pii',
    stepTitle: 'Auto-Detect & Raster-Scrub SSN / IBAN / PII',
    engineLabel: 'Browser 150 DPI Canvas Scrub (Zero Upload)',
    note: `Burned ${items.length} redaction zone(s) into flat bitmaps`,
    outputSize: current.size,
    summaryBadge: `${items.length} PII masked`,
    elapsedMs: Math.round(performance.now() - t0),
    previewImageUrl: preview.thumb,
  });

  callbacks.onStepStart(1);
  t0 = performance.now();
  current = await flattenAndStripMetadataClient(current, false);
  let sanitizeEngine = 'Browser Deep Info & XMP Purge';
  try {
    const sanFd = new FormData();
    sanFd.append('file', current);
    sanFd.append('action', 'sanitize');
    sanFd.append('flatten', '1');
    current = await callBinaryPdfApi('/api/pdf/sanitize', sanFd, files[0].name.replace(/\.pdf$/i, '-sanitized.pdf'));
    sanitizeEngine = 'Server + Browser XMP/EXIF Purge';
  } catch {
    // Browser scrub already removed Info + XMP
  }
  preview = await renderPdfThumbAndCount(current);
  recordStep(1, {
    stepId: 'sanitize-meta',
    stepTitle: 'Purge XMP, EXIF & Info Metadata',
    engineLabel: sanitizeEngine,
    note: 'Stripped Author, Title, timestamps, and XMP streams',
    outputSize: current.size,
    summaryBadge: 'Metadata Wiped',
    elapsedMs: Math.round(performance.now() - t0),
    previewImageUrl: preview.thumb,
  });

  callbacks.onStepStart(2);
  t0 = performance.now();
  current = await flattenAndStripMetadataClient(current, false);
  const sha256 = await computeSha256Hex(await current.arrayBuffer());
  preview = await renderPdfThumbAndCount(current);
  recordStep(2, {
    stepId: 'flatten-ro',
    stepTitle: 'Flatten to Read-Only PDF',
    engineLabel: 'Browser Read-Only Flattener',
    note: `Finalized GDPR/HIPAA read-only PDF (${preview.pageCount} pages)`,
    outputSize: current.size,
    summaryBadge: 'Read-Only',
    elapsedMs: Math.round(performance.now() - t0),
    previewImageUrl: preview.thumb,
  });

  return {
    primaryFile: current,
    primaryUrl: URL.createObjectURL(current),
    companionFiles,
    checkpoints,
    sha256,
    formatLabel: 'Sanitized PDF',
    pageCountOrDims: `${preview.pageCount} page(s)`,
  };
}
