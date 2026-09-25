import { apiInternalError } from '@/lib/api-response';
import { validatePdfUpload, readAndValidatePdfFile, pdfJsonError } from '@/lib/pdf-api';
import { NextRequest } from 'next/server';

export const maxDuration = 60;
export const runtime = 'nodejs';

const MAX_OCR_PAGES = 10;
const OCR_BUDGET_MS = 40_000;
const TEXT_LAYER_MIN_CHARS = 200;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    const validation = validatePdfUpload(file);
    if (!validation.ok) return validation.response;
    const read = await readAndValidatePdfFile(file!);
    if (!read.ok) return read.response;

    // A PDF with a real text layer needs no OCR — extraction is instant and
    // perfectly accurate, so return that instead (mirrors the workspace copy).
    const { extractPdfLines } = await import('@/lib/pdf-text');
    let existingText = '';
    try {
      existingText = (await extractPdfLines(read.buffer)).join('\n');
    } catch {
      // Extraction errors (corrupt structures, timeouts) just fall through to OCR.
    }
    if (existingText.length >= TEXT_LAYER_MIN_CHARS) {
      return Response.json({
        text: existingText,
        usedOcr: false,
        pagesProcessed: 0,
        totalPages: 0,
        truncated: false,
        charCount: existingText.length,
        wordCount: existingText.split(/\s+/).filter(Boolean).length,
      });
    }

    const { ocrPdfPages } = await import('@/lib/pdf-ocr');
    const result = await ocrPdfPages(read.buffer, { maxPages: MAX_OCR_PAGES, budgetMs: OCR_BUDGET_MS });

    if (result.unavailable || result.pages.length === 0) {
      if (result.unavailable) {
        return pdfJsonError('OCR is temporarily unavailable on this server. Please try again later.', 503);
      }
      return pdfJsonError(
        'No text could be recognized. The PDF may be empty, encrypted, or contain handwriting the OCR engine cannot read.',
        422,
      );
    }

    const text = result.pages.map((page) => page.text).join('\n\n');
    return Response.json({
      text,
      usedOcr: true,
      pagesProcessed: result.pages.length,
      totalPages: result.totalPages,
      truncated: result.truncated,
      charCount: text.length,
      wordCount: text.split(/\s+/).filter(Boolean).length,
    });
  } catch (error) {
    return apiInternalError(error, 'Failed to OCR PDF', 'PDF OCR error');
  }
}
