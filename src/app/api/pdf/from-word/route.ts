import { apiError } from '@/lib/api-response';
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
function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    // Strip non-latin1 characters for StandardFonts compatibility
    const safeTest = testLine.replace(/[^\x20-\x7E]/g, '?');
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

    if (file.size > 25 * 1024 * 1024) return apiError('Word files must be 25MB or smaller.', 400);
    const name = file.name.toLowerCase();
    if (!name.endsWith('.docx')) {
      return apiError('Only .docx Word documents are supported', 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const paragraphs = await parseDocxContent(buffer);

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

      try { font.encodeText(p.text); } catch { return apiError('This basic converter cannot render one or more document characters. Export this document to PDF from Word to preserve all languages.', 422); }
      const lines = wrapText(p.text, contentWidth, font, fontSize);

      for (const line of lines) {
        // If out of space on current page, create a new page
        if (currentY - lineSpacing < margin) {
          currentPage = pdf.addPage([pageWidth, pageHeight]);
          currentY = pageHeight - margin;
        }

        const safeLine = line;
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

    return pdfBinaryResponse(outBytes, sanitizeDownloadFileName(fileName));
  } catch (error) {
    console.error('Word to PDF error:', error);
    return apiError(error instanceof Error ? error.message : 'Failed to convert Word document to PDF', 500);
  }
}
