import { NextResponse } from 'next/server';

export const PDF_MAX_FILE_SIZE = 25 * 1024 * 1024;
export const PDF_CACHE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
} as const;

export function isPdfFile(file: File): boolean {
  const name = file.name?.toLowerCase() || '';
  if (name.endsWith('.pdf')) return true;
  if (!file.type) return false;
  return file.type === 'application/pdf' || file.type === 'application/x-pdf';
}

/**
 * Parse a human page selection like "1,3,5-7" into 0-based indices.
 * Invalid tokens are skipped. Out-of-range indices are filtered.
 */
export function parsePageSelection(
  input: string,
  totalPages: number,
): number[] {
  if (!input || !input.trim() || input.trim().toLowerCase() === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const indices = new Set<number>();
  const tokens = input.split(',').map((t) => t.trim()).filter(Boolean);

  for (const token of tokens) {
    const rangeMatch = token.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      let start = parseInt(rangeMatch[1], 10);
      let end = parseInt(rangeMatch[2], 10);
      if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
      if (start > end) [start, end] = [end, start];
      start = Math.max(1, start);
      end = Math.min(totalPages, end);
      if (start > end) continue;
      for (let page = start; page <= end; page += 1) {
        indices.add(page - 1);
      }
      continue;
    }

    const page = parseInt(token, 10);
    if (!Number.isFinite(page)) continue;
    const idx = page - 1;
    if (idx >= 0 && idx < totalPages) indices.add(idx);
  }

  return Array.from(indices).sort((a, b) => a - b);
}

export function validatePdfBuffer(buffer: Buffer | Uint8Array): { ok: true } | { ok: false; error: string } {
  if (!buffer || buffer.length < 5) {
    return { ok: false, error: 'File is empty or too small to be a PDF' };
  }
  // ISO 32000 allows leading whitespace; some exports add a BOM before %PDF-
  const probe = Buffer.from(buffer.slice(0, 1024)).toString('latin1');
  if (!/%PDF-/.test(probe)) {
    return { ok: false, error: 'Invalid file content: Not a valid PDF' };
  }
  return { ok: true };
}

export function validatePdfUpload(
  file: File | null | undefined,
  options: { maxBytes?: number; requireType?: boolean } = {},
): { ok: true } | { ok: false; response: NextResponse } {
  const maxBytes = options.maxBytes ?? PDF_MAX_FILE_SIZE;
  const requireType = options.requireType !== false;

  if (!file) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'No PDF file provided' },
        { status: 400, headers: PDF_CACHE_HEADERS },
      ),
    };
  }

  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    return {
      ok: false,
      response: NextResponse.json(
        { error: `File too large (${mb}MB max)` },
        { status: 400, headers: PDF_CACHE_HEADERS },
      ),
    };
  }

  // Allow empty MIME (some browsers omit it); isPdfFile accepts .pdf extension
  // and common PDF content types including application/octet-stream.
  if (requireType && file.type && !isPdfFile(file)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400, headers: PDF_CACHE_HEADERS },
      ),
    };
  }

  return { ok: true };
}

/**
 * Read upload bytes and ensure PDF magic header is present.
 * Call after validatePdfUpload when you need content-level validation.
 */
export async function readAndValidatePdfFile(
  file: File,
): Promise<{ ok: true; buffer: Buffer } | { ok: false; response: NextResponse }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const magic = validatePdfBuffer(buffer);
  if (!magic.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: magic.error },
        { status: 400, headers: PDF_CACHE_HEADERS },
      ),
    };
  }
  return { ok: true, buffer };
}

export async function loadPdfWithTimeout(
  bytes: Uint8Array | Buffer | ArrayBuffer,
  options: Parameters<typeof import('pdf-lib').PDFDocument.load>[1] = { ignoreEncryption: true },
  timeoutMs = 15000
): Promise<import('pdf-lib').PDFDocument> {
  const { PDFDocument } = await import('pdf-lib');
  let timer: ReturnType<typeof setTimeout> | undefined;
  const loadPromise = PDFDocument.load(bytes, options);
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`PDF loading timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    const pdf = await Promise.race([loadPromise, timeoutPromise]);
    if (pdf.isEncrypted && options?.ignoreEncryption) {
      // Encrypted streams stay ciphertext when ignoreEncryption is set.
      // Callers that need to mutate pages should reject and send the user to Unlock.
    }
    return pdf;
  } finally {
    if (timer) clearTimeout(timer);
    void loadPromise.catch(() => undefined);
  }
}

export function rejectEncryptedPdf(pdf: { isEncrypted: boolean }) {
  if (!pdf.isEncrypted) return null;
  return pdfJsonError('This PDF is password-protected. Unlock it first, then try again.', 400);
}

/** Validate, read, load, and reject encrypted PDFs for edit routes. */
export async function openEditablePdf(
  file: File | null | undefined,
): Promise<
  | { ok: true; pdf: import('pdf-lib').PDFDocument; buffer: Buffer }
  | { ok: false; response: NextResponse }
> {
  const validation = validatePdfUpload(file);
  if (!validation.ok) return validation;
  const read = await readAndValidatePdfFile(file!);
  if (!read.ok) return read;

  try {
    const pdf = await loadPdfWithTimeout(read.buffer);
    const encrypted = rejectEncryptedPdf(pdf);
    if (encrypted) return { ok: false, response: encrypted };
    return { ok: true, pdf, buffer: read.buffer };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not read this PDF.';
    const status = message.includes('timed out') ? 408 : 400;
    return {
      ok: false,
      response: pdfJsonError(
        message.includes('timed out') ? message : 'Could not read this PDF. The file may be damaged.',
        status,
      ),
    };
  }
}

export function pdfJsonError(message: string, status = 400, details?: string) {
  return NextResponse.json(
    details ? { error: message, details } : { error: message },
    { status, headers: PDF_CACHE_HEADERS },
  );
}

/** Build a browser-downloadable PDF data URL from raw bytes. */
export function pdfBytesToDataUrl(bytes: Uint8Array | Buffer): string {
  const base64 = Buffer.from(bytes).toString("base64");
  return ["data:", "application/pdf", ";base64,", base64].join("");
}

export function sanitizeDownloadFileName(fileName: string, fallback = 'download.pdf') {
  const cleaned = fileName.replace(/["\r\n\\]/g, '').replace(/[^\w.\- ()[\]]+/g, '_').trim();
  return cleaned || fallback;
}

export function pdfBinaryResponse(
  bytes: Uint8Array | Buffer,
  fileName: string,
  extraHeaders: Record<string, string> = {},
) {
  const safeName = sanitizeDownloadFileName(fileName);
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeName}"`,
      ...PDF_CACHE_HEADERS,
      ...extraHeaders,
    },
  });
}
