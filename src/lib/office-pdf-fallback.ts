import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { toSafeWinAnsi } from '@/lib/pdf-api';

function decodeXmlEntities(raw: string): string {
  return raw
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = Number.parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    });
}

function colRefToIndex(cellRef: string): number {
  const letters = /^[A-Z]+/i.exec(cellRef)?.[0]?.toUpperCase() ?? '';
  let idx = 0;
  for (let i = 0; i < letters.length; i++) {
    idx = idx * 26 + (letters.charCodeAt(i) - 64);
  }
  return idx > 0 ? idx - 1 : -1;
}

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Pure-JS fallback parser for ECMA-376 .xlsx workbooks when LibreOffice is absent.
 * Extracts the first worksheet (resolving sharedStrings and sparse cell coordinates)
 * into RFC 4180 CSV so the existing table renderer can turn it into a PDF cleanly.
 */
export async function xlsxBufferToCsvText(buffer: Buffer | Uint8Array): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);

  const sharedStrings: string[] = [];
  const sharedFile = zip.file('xl/sharedStrings.xml');
  if (sharedFile) {
    const sharedXml = await sharedFile.async('string');
    const siMatches = sharedXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g);
    for (const match of siMatches) {
      const tMatches = match[1].matchAll(/<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/g);
      let combined = '';
      for (const tm of tMatches) {
        combined += decodeXmlEntities(tm[1]);
      }
      sharedStrings.push(combined);
    }
  }

  const sheetNames = Object.keys(zip.files)
    .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const na = Number.parseInt(/sheet(\d+)\.xml/i.exec(a)?.[1] ?? '0', 10);
      const nb = Number.parseInt(/sheet(\d+)\.xml/i.exec(b)?.[1] ?? '0', 10);
      return na - nb;
    });

  if (sheetNames.length === 0) {
    throw new Error('No worksheet XML found inside .xlsx archive.');
  }

  const sheetXml = await zip.file(sheetNames[0])!.async('string');
  const csvLines: string[] = [];
  const rowMatches = sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g);

  for (const rowMatch of rowMatches) {
    const cells: string[] = [];
    const cellMatches = rowMatch[1].matchAll(/<c\b([^>]*)(?:\/>|>([\s\S]*?)<\/c>)/g);

    for (const cellMatch of cellMatches) {
      const attrs = cellMatch[1] ?? '';
      const body = cellMatch[2] ?? '';
      const refAttr = /\br="([^"]+)"/.exec(attrs)?.[1] ?? '';
      const typeAttr = /\bt="([^"]+)"/.exec(attrs)?.[1] ?? '';

      let value = '';
      if (typeAttr === 'inlineStr') {
        const inlineParts = body.matchAll(/<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/g);
        for (const part of inlineParts) {
          value += decodeXmlEntities(part[1]);
        }
      } else {
        const vText = /<v[^>]*>([\s\S]*?)<\/v>/.exec(body)?.[1];
        if (vText !== undefined) {
          const decoded = decodeXmlEntities(vText);
          if (typeAttr === 's') {
            const sstIndex = Number.parseInt(decoded, 10);
            value = Number.isFinite(sstIndex) ? (sharedStrings[sstIndex] ?? '') : '';
          } else if (typeAttr === 'b') {
            value = decoded === '1' ? 'TRUE' : 'FALSE';
          } else {
            value = decoded;
          }
        }
      }

      const targetIndex = colRefToIndex(refAttr);
      if (targetIndex >= 0) {
        while (cells.length <= targetIndex) cells.push('');
        cells[targetIndex] = value.trim();
      } else {
        cells.push(value.trim());
      }
    }

    if (cells.some((cell) => cell.length > 0)) {
      csvLines.push(cells.map(escapeCsvCell).join(','));
    }
  }

  if (csvLines.length === 0) {
    throw new Error('The Excel worksheet contains no readable cells.');
  }

  return csvLines.join('\n');
}

function wrapTextToWidth(
  text: string,
  font: { widthOfTextAtSize: (t: string, size: number) => number },
  fontSize: number,
  maxWidth: number,
): string[] {
  const safe = toSafeWinAnsi(text).trim();
  if (!safe) return [];
  const words = safe.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      if (font.widthOfTextAtSize(word, fontSize) <= maxWidth) {
        current = word;
      } else {
        let slice = word;
        while (slice.length > 1 && font.widthOfTextAtSize(slice, fontSize) > maxWidth) {
          slice = slice.slice(0, -1);
        }
        lines.push(slice);
        current = '';
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Pure-JS fallback converter for ECMA-376 .pptx decks when LibreOffice is absent.
 * Renders each slide on a crisp 16:9 widescreen PDF page with title hierarchy,
 * wrapped bullet points, and slide pagination footer.
 */
export async function pptxBufferToPdf(
  buffer: Buffer | Uint8Array,
  deckTitle = 'Presentation',
): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(buffer);
  const slidePaths = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const na = Number.parseInt(/slide(\d+)\.xml/i.exec(a)?.[1] ?? '0', 10);
      const nb = Number.parseInt(/slide(\d+)\.xml/i.exec(b)?.[1] ?? '0', 10);
      return na - nb;
    });

  if (slidePaths.length === 0) {
    throw new Error('No slides found in .pptx archive.');
  }

  const slides: string[][] = [];
  for (const slidePath of slidePaths) {
    const xml = await zip.file(slidePath)!.async('string');
    const paragraphs: string[] = [];
    const pMatches = xml.matchAll(/<a:p\b[^>]*>([\s\S]*?)<\/a:p>/g);
    for (const pm of pMatches) {
      const tMatches = pm[1].matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g);
      let line = '';
      for (const tm of tMatches) {
        line += decodeXmlEntities(tm[1]);
      }
      const cleaned = line.replace(/\s+/g, ' ').trim();
      if (cleaned) {
        paragraphs.push(cleaned);
      }
    }
    slides.push(paragraphs);
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(toSafeWinAnsi(deckTitle));
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 960;
  const pageHeight = 540;
  const marginX = 56;
  const contentWidth = pageWidth - marginX * 2;
  const totalSlides = slides.length;

  for (let s = 0; s < totalSlides; s++) {
    const paragraphs = slides[s];
    const heading = paragraphs[0] ?? `Slide ${s + 1}`;
    const bodyParagraphs = paragraphs.slice(1);

    let page = pdfDoc.addPage([pageWidth, pageHeight]);

    const drawChrome = (targetPage: typeof page, continued: boolean) => {
      targetPage.drawRectangle({
        x: 0,
        y: pageHeight - 6,
        width: pageWidth,
        height: 6,
        color: rgb(0.31, 0.27, 0.9),
      });
      targetPage.drawText(
        toSafeWinAnsi(`${deckTitle}  -  Slide ${s + 1} of ${totalSlides}${continued ? ' (cont.)' : ''}`),
        {
          x: marginX,
          y: 22,
          size: 9,
          font: regular,
          color: rgb(0.45, 0.48, 0.55),
        },
      );
    };

    drawChrome(page, false);

    let cursorY = pageHeight - 64;
    const titleLines = wrapTextToWidth(heading, bold, 24, contentWidth);
    for (const line of titleLines) {
      page.drawText(line, {
        x: marginX,
        y: cursorY,
        size: 24,
        font: bold,
        color: rgb(0.08, 0.1, 0.16),
      });
      cursorY -= 30;
    }

    page.drawLine({
      start: { x: marginX, y: cursorY + 8 },
      end: { x: pageWidth - marginX, y: cursorY + 8 },
      thickness: 1.5,
      color: rgb(0.88, 0.9, 0.94),
    });
    cursorY -= 18;

    for (const para of bodyParagraphs) {
      const wrapped = wrapTextToWidth(para, regular, 14, contentWidth - 18);
      for (let i = 0; i < wrapped.length; i++) {
        if (cursorY < 54) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          drawChrome(page, true);
          cursorY = pageHeight - 56;
        }
        if (i === 0) {
          page.drawText('*', {
            x: marginX + 2,
            y: cursorY,
            size: 14,
            font: bold,
            color: rgb(0.31, 0.27, 0.9),
          });
        }
        page.drawText(wrapped[i], {
          x: marginX + 18,
          y: cursorY,
          size: 14,
          font: regular,
          color: rgb(0.18, 0.22, 0.29),
        });
        cursorY -= 21;
      }
      cursorY -= 6;
    }
  }

  return pdfDoc.save();
}
