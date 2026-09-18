import { apiError } from '@/lib/api-response';
import { openEditablePdf, pdfTextErrorMessage, pdfTextErrorStatus, sanitizeDownloadFileName } from '@/lib/pdf-api';
import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { extractPdfLines } from '@/lib/pdf-text';

function parseCellNumber(rawVal: string): string | null {
  const trimmed = rawVal.trim();
  if (!trimmed) return null;
  // Strip currency symbols, spaces and thousand separators; keep trailing % as /100.
  const isPercent = trimmed.endsWith('%');
  const cleaned = trimmed
    .replace(/[$€£¥₹\s,']/g, '')
    .replace(/%$/, '');
  if (!/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(cleaned)) return null;
  if (cleaned.replace(/[^0-9]/g, '').length > 15) return null;
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return null;
  return String(isPercent ? num / 100 : num);
}

export const maxDuration = 60;
export const runtime = 'nodejs';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Converts column index (0-based) to Excel letters (0 -> A, 25 -> Z, 26 -> AA). */
function colIndexToLetters(col: number): string {
  let temp = col;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

/**
 * Builds a valid ECMA-376 .xlsx package containing the extracted table rows.
 */
async function buildXlsxZip(rows: string[][]): Promise<Buffer> {
  const zip = new JSZip();

  // 1. [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`
  );

  // 2. _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  );

  // 3. xl/_rels/workbook.xml.rels
  zip.file(
    'xl/_rels/workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );

  // 4. xl/workbook.xml
  zip.file(
    'xl/workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Table Data" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`
  );

  // 5. xl/styles.xml
  zip.file(
    'xl/styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1">
    <font><name val="Calibri"/><sz val="11"/></font>
  </fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border/></borders>
  <cellStyleXfs count="1"><xf/></cellStyleXfs>
  <cellXfs count="1"><xf fontId="0" fillId="0" borderId="0"/></cellXfs>
</styleSheet>`
  );

  // 6. xl/worksheets/sheet1.xml
  let sheetDataXml = '';
  for (let r = 0; r < rows.length; r++) {
    const rowNumber = r + 1;
    const row = rows[r];
    let rowCellsXml = '';

    for (let c = 0; c < row.length; c++) {
      const cellRef = `${colIndexToLetters(c)}${rowNumber}`;
      const rawVal = row[c] ?? '';
      // inlineStr cells never evaluate as formulas, so =/+/-/@ prefixes stay inert strings.
      const numeric = parseCellNumber(rawVal);

      if (numeric !== null) {
        rowCellsXml += `<c r="${cellRef}"><v>${numeric}</v></c>`;
      } else {
        rowCellsXml += `<c r="${cellRef}" t="inlineStr"><is><t>${escapeXml(rawVal)}</t></is></c>`;
      }
    }

    sheetDataXml += `<row r="${rowNumber}">${rowCellsXml}</row>`;
  }

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${sheetDataXml}
  </sheetData>
</worksheet>`;

  zip.file('xl/worksheets/sheet1.xml', sheetXml);

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const format = (formData.get('format') as string) || 'xlsx';

    const opened = await openEditablePdf(file);
    if (!opened.ok) return opened.response;
    const { buffer } = opened;

    const rawLines = await extractPdfLines(buffer);

    // Parse lines into table rows & columns
    const tableRows: string[][] = [];
    for (const line of rawLines) {
      let cols: string[] = [];
      if (line.includes('\t')) {
        cols = line.split('\t').map(c => c.trim());
      } else if (line.includes('|')) {
        cols = line.split('|').map(c => c.trim());

      } else if (/\s{2,}/.test(line)) {
        cols = line.split(/\s{2,}/).map(c => c.trim());
      } else {
        cols = [line.trim()];
      }

      if (cols.length > 0) {
        tableRows.push(cols);
      }
    }

    if (tableRows.length === 0) {
      return apiError('No selectable text found. Run OCR on scanned PDFs first.', 422);
    }

    const baseName = file?.name ? file.name.replace(/\.pdf$/i, '') : 'financial-table';

    if (format === 'csv') {
      const csvContent = tableRows.map(row => row.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${sanitizeDownloadFileName(baseName)}.csv"`,
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }

    const xlsxBuffer = await buildXlsxZip(tableRows);
    const fileName = `${sanitizeDownloadFileName(baseName)}.xlsx`;

    return new NextResponse(new Uint8Array(xlsxBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('PDF to Excel error:', error);
    return apiError(
      pdfTextErrorMessage(error, 'Failed to convert PDF to Excel spreadsheet'),
      pdfTextErrorStatus(error),
    );
  }
}
