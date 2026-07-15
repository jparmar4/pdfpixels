import { NextResponse } from 'next/server';

export const PDF_MAX_FILE_SIZE = 25 * 1024 * 1024;
export const PDF_CACHE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
} as const;

export function isPdfFile(file: File): boolean {
  const name = file.name?.toLowerCase() || '';
  return file.type === 'application/pdf' || name.endsWith('.pdf');
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
      for (let page = start; page <= end; page += 1) {
        const idx = page - 1;
        if (idx >= 0 && idx < totalPages) indices.add(idx);
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
  // Check for PDF magic bytes: %PDF-
  const header = Buffer.from(buffer.slice(0, 5)).toString('ascii');
  if (header !== '%PDF-') {
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

  if (requireType && file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
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

export async function loadPdfWithTimeout(
  bytes: Uint8Array | Buffer | ArrayBuffer,
  options: Parameters<typeof import('pdf-lib').PDFDocument.load>[1] = { ignoreEncryption: true },
  timeoutMs = 15000
): Promise<import('pdf-lib').PDFDocument> {
  const { PDFDocument } = await import('pdf-lib');
  return Promise.race([
    PDFDocument.load(bytes, options),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`PDF loading timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

export function pdfJsonError(message: string, status = 400, details?: string) {
  return NextResponse.json(
    details ? { error: message, details } : { error: message },
    { status, headers: PDF_CACHE_HEADERS },
  );
}

/** Build a browser-downloadable PDF data URL from raw bytes. */
export function pdfBytesToDataUrl(bytes: Uint8Array | Buffer): string {
  const base64 = Buffer.from(bytes).toString('base64');
  return 'data:application/pdf;base64,' + base64;
}

export function pdfBinaryResponse(
  bytes: Uint8Array | Buffer,
  fileName: string,
  extraHeaders: Record<string, string> = {},
) {
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      ...PDF_CACHE_HEADERS,
      ...extraHeaders,
    },
  });
}
