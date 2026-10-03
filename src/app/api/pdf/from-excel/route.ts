import { apiError, apiInternalError } from '@/lib/api-response';
import { pdfBinaryResponse, sanitizeDownloadFileName } from '@/lib/pdf-api';
import { NextRequest } from 'next/server';
import { PDFDocument, StandardFonts } from 'pdf-lib';

export const maxDuration = 60;
export const runtime = 'nodejs';

const OFFICE_BYTES = 25 * 1024 * 1024;

/**
 * Minimal CSV table parse: rows -> cells, tolerating quoted commas.
 */
function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

function toWinAnsi(text: string): string {
  return text.replace(/[^\x20-\xFF]/g, '?');
}

/**
 * Renders CSV rows as a simple table PDF when LibreOffice is unavailable.
 */
async function renderCsvPdf(rows: string[][]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 842; // A4 landscape
  const pageHeight = 595;
  const margin = 40;
  const fontSize = 9;
  const rowHeight = fontSize + 6;

  const maxCells = Math.min(10, Math.max(...rows.map((r) => r.length), 1));
  const colWidth = (pageWidth - margin * 2) / maxCells;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  for (let r = 0; r < rows.length && r < 2000; r++) {
    if (y - rowHeight < margin) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    const isHeader = r === 0;
    const cells = rows[r].slice(0, maxCells);
    for (let c = 0; c < maxCells; c++) {
      const value = toWinAnsi((cells[c] ?? '').trim());
      if (!value) continue;
      // Truncate to fit the column.
      let text = value;
      while (text.length > 1 && font.widthOfTextAtSize(text, fontSize) > colWidth - 8) {
        text = text.slice(0, -2) + '…';
      }
      page.drawText(text, {
        x: margin + c * colWidth + 4,
        y: y - fontSize,
        size: fontSize,
        font: isHeader ? boldFont : font,
      });
    }
    y -= rowHeight;
  }
  return doc.save();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || typeof file.arrayBuffer !== 'function') {
      return apiError('No spreadsheet file provided', 400);
    }
    if (file.size === 0) return apiError('This spreadsheet is empty. Please choose a valid file.', 400);
    if (file.size > OFFICE_BYTES) return apiError('Spreadsheet files must be 25MB or smaller.', 400);

    const name = (file.name || '').toLowerCase();
    const isCsv = name.endsWith('.csv');
    const isXlsx = name.endsWith('.xlsx');
    const isXls = name.endsWith('.xls');
    if (!isCsv && !isXlsx && !isXls) {
      return apiError('Only .xlsx, .xls, and .csv spreadsheets are supported', 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const baseName = file.name.replace(/\.(xlsx|xls|csv)$/i, '');

    try {
      const { convertWithLibreOffice } = await import('@/lib/libreoffice');
      const pdfBytes = await convertWithLibreOffice(buffer, isCsv ? 'csv' : isXlsx ? 'xlsx' : 'xls', 'pdf');
      return pdfBinaryResponse(new Uint8Array(pdfBytes), sanitizeDownloadFileName(`${baseName}.pdf`), {
        'x-convert-engine': 'libreoffice',
      });
    } catch (error) {
      const { isLibreOfficeMissingError } = await import('@/lib/libreoffice');
      if (isCsv) {
        console.error('LibreOffice Excel to PDF failed, using CSV fallback:', error);
      } else if (!isLibreOfficeMissingError(error)) {
        console.error('LibreOffice Excel to PDF failed:', error);
        return apiError('This spreadsheet could not be converted. It may be corrupt — try re-saving it from Excel.', 400);
      } else {
        return apiError(
          'The conversion engine is temporarily unavailable. Please try again in a few minutes.',
          503,
        );
      }
    }

    // CSV-only native fallback.
    const csvText = buffer.toString('utf8');
    const parsed = parseCsvRows(csvText);
    if (parsed.length === 0) {
      return apiError('The CSV file is empty or could not be parsed', 400);
    }
    if (parsed.length > 5000) {
      return apiError('This CSV file has too many rows (5000 row max). Split it into smaller files.', 413);
    }
    const outBytes = await renderCsvPdf(parsed);
    return pdfBinaryResponse(outBytes, sanitizeDownloadFileName(`${baseName}.pdf`), {
      'x-convert-engine': 'csv-native',
      'x-convert-note': 'LibreOffice was unavailable. Rendered as a plain table without Excel formatting.',
    });
  } catch (error) {
    return apiInternalError(error, 'Failed to convert spreadsheet to PDF', 'Excel to PDF error');
  }
}
