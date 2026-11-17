'use client';

import JSZip from 'jszip';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import { appendAuditTrailCertificatePage } from '@/lib/audit-trail-pdf';

function sanitizeWinAnsiText(value: string): string {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ');
}

function parsePageIndices(spec: string, totalPages: number): number[] {
  if (!spec || !spec.trim() || spec.trim().toLowerCase() === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i);
  }
  const indices = new Set<number>();
  for (const rawToken of spec.split(',')) {
    const token = rawToken.trim();
    if (!token) continue;
    const rangeMatch = token.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      let start = Number.parseInt(rangeMatch[1], 10);
      let end = Number.parseInt(rangeMatch[2], 10);
      if (start > end) [start, end] = [end, start];
      start = Math.max(1, start);
      end = Math.min(totalPages, end);
      for (let p = start; p <= end; p += 1) {
        indices.add(p - 1);
      }
      continue;
    }
    const single = Number.parseInt(token, 10);
    if (Number.isFinite(single) && single >= 1 && single <= totalPages) {
      indices.add(single - 1);
    }
  }
  return Array.from(indices).sort((a, b) => a - b);
}

function parseHexRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    return {
      r: Number.parseInt(clean.slice(0, 2), 16) / 255,
      g: Number.parseInt(clean.slice(2, 4), 16) / 255,
      b: Number.parseInt(clean.slice(4, 6), 16) / 255,
    };
  }
  return { r: 0.5, g: 0.5, b: 0.5 };
}

export async function computeSha256Hex(buffer: ArrayBuffer | Uint8Array): Promise<string> {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', copy.buffer);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return 'sha256-unavailable';
}

export async function mergePdfsClient(files: File[]): Promise<{
  bytes: Uint8Array;
  pageCount: number;
  skipped: Array<{ name: string; reason: string }>;
}> {
  const merged = await PDFDocument.create();
  const skipped: Array<{ name: string; reason: string }> = [];

  for (const file of files) {
    try {
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      if (doc.isEncrypted) {
        skipped.push({ name: file.name, reason: 'Password-protected' });
        continue;
      }
      const indices = doc.getPageIndices();
      if (indices.length === 0) {
        skipped.push({ name: file.name, reason: 'No pages' });
        continue;
      }
      const copied = await merged.copyPages(doc, indices);
      for (const page of copied) {
        merged.addPage(page);
      }
    } catch {
      skipped.push({ name: file.name, reason: 'Unreadable PDF' });
    }
  }

  if (merged.getPageCount() === 0) {
    throw new Error('None of the selected PDFs could be merged cleanly.');
  }

  const bytes = await merged.save();
  return { bytes, pageCount: merged.getPageCount(), skipped };
}

export async function splitPdfClient(
  file: File,
  options: {
    mode: 'all' | 'range' | 'single' | 'size';
    pageRange?: string;
    singlePage?: string;
    maxSizeMb?: string;
  },
): Promise<{
  totalPages: number;
  singlePdfBytes?: Uint8Array;
  singleFileName?: string;
  extractedPages?: number[];
  zipBlob?: Blob;
  partsCount?: number;
  partFiles?: Array<{ fileName: string; blob: Blob; pageNumber: number }>;
}> {
  const bytes = await file.arrayBuffer();
  const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
  if (source.isEncrypted) {
    throw new Error('This PDF is password-protected — unlock it before splitting.');
  }
  const totalPages = source.getPageCount();
  const baseName = file.name.replace(/\.pdf$/i, '') || 'document';

  if (options.mode === 'range' || options.mode === 'single') {
    const spec = options.mode === 'single' ? (options.singlePage || '1') : (options.pageRange || '1');
    const indices = parsePageIndices(spec, totalPages);
    if (indices.length === 0) {
      throw new Error(`No valid pages matched "${spec}" (document has ${totalPages} pages).`);
    }
    const out = await PDFDocument.create();
    const copied = await out.copyPages(source, indices);
    copied.forEach((p) => out.addPage(p));
    const singlePdfBytes = await out.save();
    return {
      totalPages,
      singlePdfBytes,
      singleFileName: `${baseName}-pages-${indices.map((i) => i + 1).join('-')}.pdf`,
      extractedPages: indices.map((i) => i + 1),
    };
  }

  if (options.mode === 'size') {
    const maxBytes = Math.max(0.25, Number.parseFloat(options.maxSizeMb || '5') || 5) * 1024 * 1024;
    const partFiles: Array<{ fileName: string; blob: Blob; pageNumber: number }> = [];
    let currentIndices: number[] = [];
    let partIndex = 1;

    const flushPart = async (indices: number[]) => {
      const partDoc = await PDFDocument.create();
      const copied = await partDoc.copyPages(source, indices);
      copied.forEach((p) => partDoc.addPage(p));
      const saved = await partDoc.save();
      const partCopy = new Uint8Array(saved.byteLength);
      partCopy.set(saved);
      partFiles.push({
        pageNumber: partIndex++,
        fileName: `${baseName}-part-${partIndex - 1}.pdf`,
        blob: new Blob([partCopy.buffer], { type: 'application/pdf' }),
      });
    };

    for (let i = 0; i < totalPages; i += 1) {
      const candidate = [...currentIndices, i];
      const testDoc = await PDFDocument.create();
      const copied = await testDoc.copyPages(source, candidate);
      copied.forEach((p) => testDoc.addPage(p));
      const probeBytes = await testDoc.save();
      if (probeBytes.byteLength > maxBytes && currentIndices.length > 0) {
        await flushPart(currentIndices);
        currentIndices = [i];
      } else {
        currentIndices = candidate;
      }
    }
    if (currentIndices.length > 0) {
      await flushPart(currentIndices);
    }

    return { totalPages, partFiles, partsCount: partFiles.length };
  }

  // mode === 'all'
  const limit = Math.min(totalPages, 25);
  const partFiles: Array<{ fileName: string; blob: Blob; pageNumber: number }> = [];
  for (let i = 0; i < limit; i += 1) {
    const singleDoc = await PDFDocument.create();
    const [copied] = await singleDoc.copyPages(source, [i]);
    singleDoc.addPage(copied);
    const saved = await singleDoc.save();
    const copy = new Uint8Array(saved.byteLength);
    copy.set(saved);
    partFiles.push({
      pageNumber: i + 1,
      fileName: `${baseName}-page-${String(i + 1).padStart(2, '0')}.pdf`,
      blob: new Blob([copy.buffer], { type: 'application/pdf' }),
    });
  }

  return { totalPages, partFiles, partsCount: partFiles.length };
}

export async function rotatePdfClient(
  file: File,
  angle: number,
  pagesSpec: string,
): Promise<{ bytes: Uint8Array; pageCount: number }> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  if (pdf.isEncrypted) {
    throw new Error('This PDF is password-protected — unlock it before rotating.');
  }
  const totalPages = pdf.getPageCount();
  const targets = parsePageIndices(pagesSpec, totalPages);
  for (const idx of targets) {
    const page = pdf.getPage(idx);
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + angle + 360) % 360));
  }
  const out = await pdf.save();
  return { bytes: out, pageCount: totalPages };
}

export async function watermarkPdfClient(
  file: File,
  options: {
    text: string;
    opacity: number;
    color: string;
    fontSize: number;
    position: string;
    rotation: number;
  },
): Promise<{ bytes: Uint8Array; pageCount: number }> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  if (pdf.isEncrypted) {
    throw new Error('This PDF is password-protected — unlock it before adding a watermark.');
  }
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { r, g, b } = parseHexRgb(options.color);
  const safeText = sanitizeWinAnsiText(options.text);
  const pages = pdf.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(safeText, options.fontSize);
    let x = Math.max(24, (width - textWidth) / 2);
    let y = height / 2;

    if (options.position === 'top-left') {
      x = 36;
      y = height - options.fontSize - 36;
    } else if (options.position === 'top-right') {
      x = Math.max(24, width - textWidth - 36);
      y = height - options.fontSize - 36;
    } else if (options.position === 'bottom-left') {
      x = 36;
      y = 36;
    } else if (options.position === 'bottom-right') {
      x = Math.max(24, width - textWidth - 36);
      y = 36;
    }

    page.drawText(safeText, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(r, g, b),
      opacity: Math.min(1, Math.max(0.05, options.opacity)),
      rotate: degrees(options.rotation),
    });
  }

  const out = await pdf.save();
  return { bytes: out, pageCount: pages.length };
}

export interface SignClientOptions {
  signatureDataUrl: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  dateText?: string;
  includeAuditTrail?: boolean;
  signerName?: string;
  signerEmail?: string;
}

export async function signPdfClient(
  file: File,
  options: SignClientOptions,
): Promise<{ bytes: Uint8Array; certificateId?: string; sha256: string; pageCount: number }> {
  const inputBuffer = await file.arrayBuffer();
  const sha256 = await computeSha256Hex(inputBuffer);
  const pdf = await PDFDocument.load(inputBuffer, { ignoreEncryption: true });
  if (pdf.isEncrypted) {
    throw new Error('This PDF is password-protected — unlock it before signing.');
  }

  const pageIdx = Math.max(0, Math.min(pdf.getPageCount() - 1, options.pageNumber - 1));
  const page = pdf.getPage(pageIdx);
  const { width: pageWidth, height: pageHeight } = page.getSize();

  const commaIdx = options.signatureDataUrl.indexOf(',');
  if (commaIdx === -1) {
    throw new Error('Invalid signature image data.');
  }
  const b64 = options.signatureDataUrl.slice(commaIdx + 1);
  const rawBinary = atob(b64);
  const imgBytes = new Uint8Array(rawBinary.length);
  for (let i = 0; i < rawBinary.length; i += 1) {
    imgBytes[i] = rawBinary.charCodeAt(i);
  }

  const embeddedImage = options.signatureDataUrl.includes('image/jpeg')
    ? await pdf.embedJpg(imgBytes)
    : await pdf.embedPng(imgBytes);

  const clampedX = Math.max(0, Math.min(pageWidth - options.width, options.x));
  const yPos = Math.max(0, pageHeight - options.y - options.height);

  page.drawImage(embeddedImage, {
    x: clampedX,
    y: yPos,
    width: options.width,
    height: options.height,
  });

  if (options.dateText) {
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    page.drawText(sanitizeWinAnsiText(options.dateText), {
      x: clampedX,
      y: Math.max(6, yPos - 14),
      size: 10,
      font,
      color: rgb(0.15, 0.18, 0.25),
    });
  }

  let certificateId: string | undefined;
  if (options.includeAuditTrail) {
    certificateId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? `PP-CERT-${crypto.randomUUID().toUpperCase()}`
        : `PP-CERT-${Date.now().toString(36).toUpperCase()}`;

    await appendAuditTrailCertificatePage(pdf, {
      certificateId,
      fileName: file.name,
      originalSha256: sha256,
      signedAtUtc: new Date().toISOString(),
      signedPageNumber: pageIdx + 1,
      signerName: options.signerName,
      signerEmail: options.signerEmail,
      executionMode: '100% Client-Side Browser (Zero Upload)',
    });
  }

  const bytes = await pdf.save();
  return { bytes, certificateId, sha256, pageCount: pdf.getPageCount() };
}

function escapeXmlCell(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function colIndexToLetter(index: number): string {
  let n = index;
  let result = '';
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

/**
 * Generates a real styled Microsoft Excel (.xlsx) workbook in browser memory using JSZip.
 */
export async function buildClientXlsxBlob(
  sheetName: string,
  headers: string[],
  rows: Array<Array<string | number>>,
  numericCols: Set<number> = new Set(),
): Promise<Blob> {
  const zip = new JSZip();
  const safeSheetName = escapeXmlCell(sheetName.slice(0, 31) || 'Transactions');

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
  );

  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
  );

  zip.file(
    'xl/_rels/workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
  );

  zip.file(
    'xl/workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${safeSheetName}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`,
  );

  zip.file(
    'xl/styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00"/></numFmts>
  <fonts count="2">
    <font><name val="Calibri"/><sz val="11"/></font>
    <font><b/><name val="Calibri"/><sz val="11"/><color rgb="FFFFFFFF"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1F4E79"/></patternFill></fill>
  </fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
  </cellXfs>
</styleSheet>`,
  );

  const headerCells = headers
    .map((h, col) => `<c r="${colIndexToLetter(col)}1" t="inlineStr" s="1"><is><t>${escapeXmlCell(h)}</t></is></c>`)
    .join('');

  const dataRows = rows
    .map((row, rowIndex) => {
      const rNum = rowIndex + 2;
      const cells = row
        .map((cell, col) => {
          const ref = `${colIndexToLetter(col)}${rNum}`;
          if (numericCols.has(col) && typeof cell === 'number' && Number.isFinite(cell)) {
            return `<c r="${ref}" s="2"><v>${cell}</v></c>`;
          }
          return `<c r="${ref}" t="inlineStr"><is><t>${escapeXmlCell(String(cell ?? ''))}</t></is></c>`;
        })
        .join('');
      return `<row r="${rNum}">${cells}</row>`;
    })
    .join('');

  zip.file(
    'xl/worksheets/sheet1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData><row r="1">${headerCells}</row>${dataRows}</sheetData>
</worksheet>`,
  );

  const u8 = await zip.generateAsync({ type: 'uint8array' });
  const copy = new Uint8Array(u8.byteLength);
  copy.set(u8);
  return new Blob([copy.buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
