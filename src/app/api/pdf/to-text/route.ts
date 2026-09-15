import { apiError } from '@/lib/api-response';
import { openEditablePdf, pdfTextErrorMessage, pdfTextErrorStatus, sanitizeDownloadFileName } from '@/lib/pdf-api';
import { NextRequest, NextResponse } from 'next/server';
import { extractPdfLines } from '@/lib/pdf-text';

export const maxDuration = 60;
export const runtime = 'nodejs';

/**
 * Extracts plain text from a raw PDF buffer by parsing content streams,
 * including FlateDecode compressed streams. Handles Tj, TJ, and ' / " operators.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const format = (formData.get('format') as string) || 'json';

    const opened = await openEditablePdf(file);
    if (!opened.ok) return opened.response;
    const { pdf, buffer } = opened;

    const pageCount = pdf.getPageCount();
    const extractedText = (await extractPdfLines(buffer)).join('\n');

    if (!extractedText) return apiError('No selectable text found. Run OCR on scanned PDFs first.', 422);

    const baseName = sanitizeDownloadFileName(file?.name?.replace(/\.pdf$/i, '') || 'document');

    if (format === 'txt' || request.headers.get('accept')?.includes('text/plain')) {
      return new NextResponse(extractedText, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${baseName}.txt"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json({
      text: extractedText,
      pageCount,
      fileName: `${baseName}.txt`,
      charCount: extractedText.length,
      wordCount: extractedText.trim() ? extractedText.trim().split(/\s+/).length : 0,
    });
  } catch (error) {
    console.error('PDF to text error:', error);
    return apiError(
      pdfTextErrorMessage(error, 'Failed to extract text from PDF'),
      pdfTextErrorStatus(error),
    );
  }
}
