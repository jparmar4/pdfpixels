import { apiError, apiInternalError } from '@/lib/api-response';
import { pdfBinaryResponse, sanitizeDownloadFileName, toSafeWinAnsi } from '@/lib/pdf-api';
import { NextRequest } from 'next/server';
import { PDFDocument, StandardFonts, PDFFont, rgb } from 'pdf-lib';

export const maxDuration = 60;
export const runtime = 'nodejs';

const MAX_TEXT_CHARS = 400_000;
const MAX_OUTPUT_PAGES = 500;
const MARGIN = 56; // ~0.78in

const PAGE_SIZES: Record<string, { width: number; height: number }> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
  legal: { width: 612, height: 1008 },
};

type FontKey = 'helvetica' | 'times' | 'courier';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    let textRaw = formData.get('text');
    if (!textRaw || (typeof textRaw === 'string' && !textRaw.trim())) {
      const file = formData.get('file') as File | null;
      if (file && typeof file.text === 'function') {
        try {
          textRaw = await file.text();
        } catch {
          // ignore read failure
        }
      }
    }
    const pageSize = String(formData.get('pageSize') || 'a4').toLowerCase();
    const fontKey = (String(formData.get('font') || 'times').toLowerCase() as FontKey);
    const fontSize = Math.min(28, Math.max(8, Number(formData.get('fontSize')) || 11));

    if (typeof textRaw !== 'string' || !textRaw.trim()) {
      return apiError('Enter or paste some text first.');
    }
    if (textRaw.length > MAX_TEXT_CHARS) {
      return apiError(`Text is too long (${Math.round(textRaw.length / 1000)}K characters). Maximum ${MAX_TEXT_CHARS / 1000}K characters.`, 413);
    }
    if (!PAGE_SIZES[pageSize]) {
      return apiError('Invalid page size. Use a4, letter, or legal.');
    }
    if (!['helvetica', 'times', 'courier'].includes(fontKey)) {
      return apiError('Invalid font. Use helvetica, times, or courier.');
    }

    // Normalize newlines, strip control chars (except \n), map to WinAnsi-safe text.
    const text = toSafeWinAnsi(textRaw.replace(/\r\n?/g, '\n').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ''));

    const doc = await PDFDocument.create();
    const fonts: Record<FontKey, PDFFont> = {
      helvetica: await doc.embedFont(StandardFonts.Helvetica),
      times: await doc.embedFont(StandardFonts.TimesRoman),
      courier: await doc.embedFont(StandardFonts.Courier),
    };
    const font = fonts[fontKey];

    const { width, height } = PAGE_SIZES[pageSize];
    const contentWidth = width - MARGIN * 2;
    const lineHeight = fontSize * 1.45;
    const maxY = height - MARGIN;

    let page = doc.addPage([width, height]);
    let cursorY = maxY;

    const newPage = () => {
      page = doc.addPage([width, height]);
      cursorY = maxY;
    };

    for (const rawLine of text.split('\n')) {
      // Empty line: keep paragraph breaks without trailing wrap artifacts.
      if (rawLine === '') {
        cursorY -= lineHeight;
        if (cursorY < MARGIN) newPage();
        continue;
      }

      const words = rawLine.split(/(\s+)/).filter((w) => w !== '');
      let currentLine = '';

      const flushLine = () => {
        if (!currentLine) return;
        page.drawText(currentLine, {
          x: MARGIN,
          y: cursorY - fontSize,
          size: fontSize,
          font,
          color: rgb(0.12, 0.12, 0.14),
        });
        cursorY -= lineHeight;
        if (cursorY < MARGIN) newPage();
        currentLine = '';
      };

      for (const word of words) {
        const candidate = currentLine + word;
        const candidateWidth = font.widthOfTextAtSize(candidate, fontSize);
        if (candidateWidth <= contentWidth) {
          currentLine = candidate;
          continue;
        }
        // Single token longer than the line (URLs, hashes): hard-break it.
        if (font.widthOfTextAtSize(word, fontSize) > contentWidth) {
          flushLine();
          let chunk = '';
          for (const char of word) {
            if (font.widthOfTextAtSize(chunk + char, fontSize) > contentWidth) {
              page.drawText(chunk, { x: MARGIN, y: cursorY - fontSize, size: fontSize, font, color: rgb(0.12, 0.12, 0.14) });
              cursorY -= lineHeight;
              if (cursorY < MARGIN) newPage();
              chunk = char;
            } else {
              chunk += char;
            }
          }
          currentLine = chunk;
          continue;
        }
        flushLine();
        currentLine = word.trimStart();
      }
      flushLine();

      if (doc.getPageCount() > MAX_OUTPUT_PAGES) {
        return apiError(`This text produces more than ${MAX_OUTPUT_PAGES} pages. Split it into parts.`, 413);
      }
    }

    const bytes = await doc.save();
    const baseName = typeof formData.get('fileName') === 'string' ? String(formData.get('fileName')).replace(/\.pdf$/i, '') : '';
    const fileName = sanitizeDownloadFileName(baseName || `text-${Date.now()}.pdf`, 'text.pdf');
    return pdfBinaryResponse(bytes, fileName);
  } catch (error) {
    return apiInternalError(error, 'Failed to create PDF from text', 'Text-to-PDF error');
  }
}
