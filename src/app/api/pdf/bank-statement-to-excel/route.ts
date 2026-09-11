import { apiError } from '@/lib/api-response';
import { openEditablePdf, sanitizeDownloadFileName } from '@/lib/pdf-api';
import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { extractPdfLines } from '@/lib/pdf-text';

export const maxDuration = 60;
export const runtime = 'nodejs';

interface TransactionRow {
  date: string;
  description: string;
  debit: string;
  credit: string;
  balance: string;
}

/**
 * Decompresses and extracts lines from a PDF buffer.
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function parseFinancialTransactions(lines: string[]): TransactionRow[] {
  const transactions: TransactionRow[] = [];
  const datePattern = /^(?:\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(?:, \d{4})?|\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?: \d{4})?)/i;
  const moneyPattern = /(?:-?\$?\s*(?:\d{1,3}(?:,\d{3})*|\d+)\.\d{2})/g;

  let currentDate = '';
  let currentDescParts: string[] = [];
  let amounts: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if line starts with a date
    const dateMatch = trimmed.match(datePattern);
    if (dateMatch) {
      // Save previous transaction if pending
      if (currentDate && amounts.length > 0) {
        saveRow(transactions, currentDate, currentDescParts.join(' '), amounts);
      }
      currentDate = dateMatch[0];
      const rest = trimmed.slice(dateMatch[0].length).trim();
      currentDescParts = [];
      amounts = [];

      // Extract all monetary figures in the rest of line
      const matchedMoney = rest.match(moneyPattern);
      if (matchedMoney) {
        amounts.push(...matchedMoney.map(m => m.replace(/[$,\s]/g, '')));
        const descWithoutMoney = rest.replace(moneyPattern, '').trim();
        if (descWithoutMoney) currentDescParts.push(descWithoutMoney);
      } else if (rest) {
        currentDescParts.push(rest);
      }
    } else if (currentDate) {
      // Line continuation
      const matchedMoney = trimmed.match(moneyPattern);
      if (matchedMoney) {
        amounts.push(...matchedMoney.map(m => m.replace(/[$,\s]/g, '')));
        const descWithoutMoney = trimmed.replace(moneyPattern, '').trim();
        if (descWithoutMoney) currentDescParts.push(descWithoutMoney);
      } else {
        // Skip obvious header words
        if (!/^(Page \d|Statement Period|Account Number|Balance Summary)/i.test(trimmed)) {
          currentDescParts.push(trimmed);
        }
      }
    }
  }

  // Save the last row
  if (currentDate && amounts.length > 0) {
    saveRow(transactions, currentDate, currentDescParts.join(' '), amounts);
  }

  return transactions;
}

function saveRow(rows: TransactionRow[], date: string, desc: string, amounts: string[]) {
  let debit = '';
  let credit = '';
  let balance = '';

  if (amounts.length === 1) {
    const val = parseFloat(amounts[0]);
    if (val < 0) {
      debit = Math.abs(val).toFixed(2);
    } else {
      credit = val.toFixed(2);
    }
  } else if (amounts.length === 2) {
    const val1 = parseFloat(amounts[0]);
    if (val1 < 0) {
      debit = Math.abs(val1).toFixed(2);
    } else {
      credit = val1.toFixed(2);
    }
    balance = amounts[1];
  } else if (amounts.length >= 3) {
    debit = amounts[0];
    credit = amounts[1];
    balance = amounts[2];
  }

  rows.push({
    date: date.trim(),
    description: desc.trim() || 'Transaction Item',
    debit,
    credit,
    balance,
  });
}

function colIndexToLetters(col: number): string {
  let temp = col;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

async function buildFinancialXlsx(rows: TransactionRow[]): Promise<Buffer> {
  const zip = new JSZip();

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

  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  );

  zip.file(
    'xl/_rels/workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );

  zip.file(
    'xl/workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Statement Transactions" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`
  );

  zip.file(
    'xl/styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><name val="Calibri"/><sz val="11"/></font>
    <font><b/><name val="Calibri"/><sz val="11"/><color rgb="FF1F4E79"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1"><border/></borders>
  <cellStyleXfs count="1"><xf/></cellStyleXfs>
  <cellXfs count="2">
    <xf fontId="0" fillId="0" borderId="0"/>
    <xf fontId="1" fillId="0" borderId="0" applyFont="1"/>
  </cellXfs>
</styleSheet>`
  );

  const headers = ['Date', 'Description', 'Withdrawals (Debit)', 'Deposits (Credit)', 'Ending Balance'];
  let sheetDataXml = '<row r="1">';
  for (let c = 0; c < headers.length; c++) {
    const cellRef = `${colIndexToLetters(c)}1`;
    sheetDataXml += `<c r="${cellRef}" s="1" t="inlineStr"><is><t>${escapeXml(headers[c])}</t></is></c>`;
  }
  sheetDataXml += '</row>';

  for (let r = 0; r < rows.length; r++) {
    const rowNum = r + 2;
    const item = rows[r];
    const vals = [item.date, item.description, item.debit, item.credit, item.balance];

    let rowXml = `<row r="${rowNum}">`;
    for (let c = 0; c < vals.length; c++) {
      const cellRef = `${colIndexToLetters(c)}${rowNum}`;
      const rawVal = vals[c];
      const isNum = c >= 2 && Number.isFinite(Number(rawVal)) && rawVal.trim() !== '';

      if (isNum) {
        rowXml += `<c r="${cellRef}"><v>${rawVal.trim()}</v></c>`;
      } else {
        rowXml += `<c r="${cellRef}" t="inlineStr"><is><t>${escapeXml(rawVal)}</t></is></c>`;
      }
    }
    rowXml += '</row>';
    sheetDataXml += rowXml;
  }

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="1" width="14" customWidth="1"/>
    <col min="2" max="2" width="42" customWidth="1"/>
    <col min="3" max="3" width="20" customWidth="1"/>
    <col min="4" max="4" width="20" customWidth="1"/>
    <col min="5" max="5" width="20" customWidth="1"/>
  </cols>
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
    const transactions = parseFinancialTransactions(rawLines);

    if (transactions.length === 0) {
      return apiError('No reliable transaction rows found. Use a text-based statement with dates and decimal amounts, or run OCR first.', 422);
    }

    const baseName = file?.name ? file.name.replace(/\.pdf$/i, '') : 'bank-statement';

    if (format === 'json') {
      return NextResponse.json({
        transactions,
        totalRows: transactions.length,
        fileName: `${sanitizeDownloadFileName(baseName)}.xlsx`,
      }, { headers: { 'Cache-Control': 'no-store' } });
    }

    if (format === 'csv') {
      const csvHeader = 'Date,Description,Withdrawal (Debit),Deposit (Credit),Balance\n';
      const csvBody = transactions
        .map(t => `"${t.date.replace(/"/g, '""')}","${t.description.replace(/"/g, '""')}","${t.debit}","${t.credit}","${t.balance}"`)
        .join('\n');

      return new NextResponse(csvHeader + csvBody, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${sanitizeDownloadFileName(baseName)}.csv"`,
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }

    const xlsxBuffer = await buildFinancialXlsx(transactions);
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
    console.error('Bank statement to Excel error:', error);
    return apiError(error instanceof Error ? error.message : 'Failed to convert bank statement to Excel', 500);
  }
}
