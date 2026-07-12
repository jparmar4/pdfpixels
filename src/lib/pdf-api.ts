import { NextResponse } from 'next/server';

export const PDF_MAX_FILE_SIZE = 25 * 1024 * 1024;
export const PDF_CACHE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
} as const;

export function isPdfFile(file: File): boolean {
  const name = file.name?.toLowerCase() || '';
  return file.type === 'application/pdf' || name.endsWith('.pdf') || !file.type;
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
