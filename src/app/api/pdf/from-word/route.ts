import { apiError, apiInternalError } from '@/lib/api-response';
import { pdfBinaryResponse, sanitizeDownloadFileName } from '@/lib/pdf-api';
import { NextRequest } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';

export const maxDuration = 60;
export const runtime = 'nodejs';

interface ParagraphItem {
  text: string;
  isHeading: boolean;
  headingLevel: number;
  isBold: boolean;
}

/**
 * Extracts structured paragraphs from word/document.xml in a DOCX zip.
 */
async function parseDocxContent(buffer: Buffer): Promise<ParagraphItem[]> {
  const zip = await JSZip.loadAsync(buffer);
  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) {
    throw new Error('Invalid DOCX file: word/document.xml missing');
  }

  const xmlText = await docXmlFile.async('text');
  const paragraphs: ParagraphItem[] = [];

  // Parse each <w:p> element
  const pRegex = /<w:p(?:\s+[^>]*)?>([\s\S]*?)<\/w:p>/g;
  let pMatch: RegExpExecArray | null;

  while ((pMatch = pRegex.exec(xmlText)) !== null) {
    const pContent = pMatch[1];

    // Check heading style
    let isHeading = false;
    let headingLevel = 1;
    const styleMatch = /<w:pStyle\s+[^>]*w:val="([^"]+)"/i.exec(pContent);
    if (styleMatch) {
      const style = styleMatch[1].toLowerCase();
      if (style.includes('heading1') || style.includes('title')) {
        isHeading = true;
        headingLevel = 1;
      } else if (style.includes('heading2')) {
        isHeading = true;
        headingLevel = 2;
      } else if (style.includes('heading3')) {
        isHeading = true;
        headingLevel = 3;
      }
    }

    // Check bold run
    const isBold = /<w:b\b/i.test(pContent);

    // Extract all <w:t> text nodes within the paragraph
    const tRegex = /<w:t(?:\s+[^>]*)?>([^<]*)<\/w:t>/g;
    let tMatch: RegExpExecArray | null;
    let pText = '';

    while ((tMatch = tRegex.exec(pContent)) !== null) {
      pText += tMatch[1];
    }

    // Clean XML entities
    pText = pText
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .trim();

    if (pText) {
      paragraphs.push({
        text: pText,
        isHeading,
        headingLevel,
        isBold,
      });
    }
  }

  return paragraphs;
}

/**
 * Word wraps text to fit within a given maxWidth at a given font & fontSize.
 */
function toWinAnsi(text: string): string {
  // StandardFonts use WinAnsiEncoding: printable ASCII plus the Latin-1
  // supplement (é, ü, ñ, …) all survive. Only characters outside U+00FF
  // (emoji, CJK, Arabic, …) cannot be encoded and become '?'.
  return text.replace(/[^\x20-\xFF]/g, '?');
}

/** Probe whether pdf-lib can encode this line; degrade leftovers if not. */
function encodeSafeLine(font: { encodeText: (text: string) => unknown }, line: string): string {
  const safe = toWinAnsi(line);
  try {
    font.encodeText(safe);
    return safe;
  } catch {
    // Rare undefined WinAnsi slots (e.g. U+0081) — degrade just those.
    return safe.replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');
  }
}

function splitLongWord(word: string, maxWidth: number, font: any, fontSize: number): string[] {
  const safe = toWinAnsi(word);
  if (font.widthOfTextAtSize(safe, fontSize) <= maxWidth) return [word];
  // Greedy character split so a single long token can't overflow the page.
  const parts: string[] = [];
  let current = '';
  for (const char of word) {
    const test = current + char;
    if (font.widthOfTextAtSize(toWinAnsi(test), fontSize) <= maxWidth || !current) {
      current = test;
    } else {
      parts.push(current);
      current = char;
    }
  }
  if (current) parts.push(current);
  return parts;
}

function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const words = text.split(/\s+/).flatMap((word) => splitLongWord(word, maxWidth, font, fontSize));
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    // Strip non-latin1 characters for StandardFonts compatibility
    const safeTest = toWinAnsi(testLine);
    const width = font.widthOfTextAtSize(safeTest, fontSize);

    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || typeof file.arrayBuffer !== 'function') {
      return apiError('No Word (.docx) file provided', 400);
    }

    if (file.size === 0) return apiError('This Word file is empty. Please choose a valid .docx file.', 400);
    if (file.size > 25 * 1024 * 1024) return apiError('Word files must be 25MB or smaller.', 400);
    const name = file.name.toLowerCase();
    if (!name.endsWith('.docx')) {
      return apiError('Only .docx Word documents are supported', 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      const { convertWithLibreOffice } = await import('@/lib/libreoffice');
      const pdfBytes = await convertWithLibreOffice(buffer, 'docx', 'pdf');
      const convertedName = file.name.replace(/\.docx$/i, '');
      return pdfBinaryResponse(new Uint8Array(pdfBytes), sanitizeDownloadFileName(`${convertedName}.pdf`), {
        'x-convert-engine': 'libreoffice',
      });
    } catch (error) {
      const { isLibreOfficeMissingError } = await import('@/lib/libreoffice');
      if (!isLibreOfficeMissingError(error)) {
        console.error('LibreOffice Word to PDF failed, using text layout:', error);
      }
    }
    let paragraphs: ParagraphItem[];
    try {
      paragraphs = await parseDocxContent(buffer);
    } catch {
      return apiError('This .docx file could not be read. It may be corrupt — try re-saving it from Word.', 400);
    }
    if (paragraphs.length > 5000) {
      return apiError('This Word document is too long (5000 paragraph max). Split it into smaller files.', 413);
    }

    if (paragraphs.length === 0) {
      return apiError('The Word document is empty or text could not be parsed', 400);
    }

    // Create PDF document
    const pdf = await PDFDocument.create();
    const regularFont = await pdf.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

    // Standard A4: 595.28 x 841.89 points
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);

    let currentPage = pdf.addPage([pageWidth, pageHeight]);
    let currentY = pageHeight - margin;

    for (const p of paragraphs) {
      let font = regularFont;
      let fontSize = 11;
      let lineSpacing = 16;
      let spaceAfter = 8;
      let color = rgb(0.15, 0.15, 0.15);

      if (p.isHeading) {
        font = boldFont;
        if (p.headingLevel === 1) {
          fontSize = 18;
          lineSpacing = 24;
          spaceAfter = 14;
          color = rgb(0.05, 0.05, 0.05);
        } else if (p.headingLevel === 2) {
          fontSize = 14;
          lineSpacing = 20;
          spaceAfter = 10;
          color = rgb(0.1, 0.1, 0.1);
        } else {
          fontSize = 12;
          lineSpacing = 18;
          spaceAfter = 8;
        }
      } else if (p.isBold) {
        font = boldFont;
      }

      const safeParagraph = toWinAnsi(p.text);
      const lines = wrapText(safeParagraph, contentWidth, font, fontSize);

      for (const line of lines) {
        // If out of space on current page, create a new page
        if (currentY - lineSpacing < margin) {
          if (pdf.getPageCount() > 500) {
            return apiError('This Word document is too long (500 page max). Split it into smaller files.', 413);
          }
          currentPage = pdf.addPage([pageWidth, pageHeight]);
          currentY = pageHeight - margin;
        }

        const safeLine = encodeSafeLine(font, line);
        currentPage.drawText(safeLine, {
          x: margin,
          y: currentY - fontSize,
          size: fontSize,
          font,
          color,
        });

        currentY -= lineSpacing;
      }

      currentY -= spaceAfter;
    }

    const outBytes = await pdf.save();
    const baseName = file.name.replace(/\.docx$/i, '');
    const fileName = `${baseName}.pdf`;

    return pdfBinaryResponse(outBytes, sanitizeDownloadFileName(fileName), {
      'x-convert-engine': 'text-layout',
      'x-convert-note': 'LibreOffice was unavailable. Images, tables, and complex layouts were not preserved.',
    });
  } catch (error) {
    return apiInternalError(error, 'Failed to convert Word document to PDF', 'Word to PDF error');
  }
}
