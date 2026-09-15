import { apiError } from '@/lib/api-response';
import { parseBankStatement, parseFailureMessage, type TransactionRow } from '@/lib/bank-statement';
import { openEditablePdf, pdfTextErrorMessage, pdfTextErrorStatus, sanitizeDownloadFileName } from '@/lib/pdf-api';
import { extractPdfTextItems, itemsToLines, itemsToTableRows } from '@/lib/pdf-text';

const MAX_CUSTOM_TRANSACTIONS = 10000;
const MAX_TRANSACTION_FIELD_CHARS = 500;

function sanitizeCustomTransactions(value: unknown): TransactionRow[] | null {
  if (!Array.isArray(value)) return null;
  if (value.length > MAX_CUSTOM_TRANSACTIONS) return null;
  return value.map((row) => {
    const record = (row ?? {}) as Record<string, unknown>;
    const pick = (key: string) => {
      const raw = record[key];
      if (raw === null || raw === undefined) return '';
      return String(raw).slice(0, MAX_TRANSACTION_FIELD_CHARS);
    };
    return {
      date: pick('date'),
      description: pick('description'),
      debit: pick('debit'),
      credit: pick('credit'),
      balance: pick('balance'),
    } as TransactionRow;
  });
}
import JSZip from 'jszip';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
export const runtime = 'nodejs';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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

function scoreParse(rows: TransactionRow[]): number {
  if (rows.length === 0) return -1;
  const directed = rows.filter(row => row.debit || row.credit).length;
  const withBalance = rows.filter(row => row.balance).length;
  return rows.length * 10 + directed * 2 + withBalance;
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
    <sheet name="Bank Statement" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`
  );

  zip.file(
    'xl/styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00"/></numFmts>
  <fonts count="3">
    <font><name val="Calibri"/><sz val="11"/></font>
    <font><b/><name val="Calibri"/><sz val="11"/><color rgb="FFFFFFFF"/></font>
    <font><b/><name val="Calibri"/><sz val="11"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1F4E79"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left/><right/><top style="thin"><color auto="1"/></top><bottom style="double"><color auto="1"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf/></cellStyleXfs>
  <cellXfs count="5">
    <xf fontId="0" fillId="0" borderId="0"/>
    <xf fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1"/>
    <xf fontId="0" fillId="0" borderId="0" numFmtId="164" applyNumberFormat="1"/>
    <xf fontId="2" fillId="0" borderId="1" applyFont="1" applyBorder="1"/>
    <xf fontId="2" fillId="0" borderId="1" numFmtId="164" applyFont="1" applyNumberFormat="1" applyBorder="1"/>
  </cellXfs>
</styleSheet>`
  );

  const headers = ['Date', 'Description', 'Withdrawals (Debit)', 'Deposits (Credit)', 'Ending Balance'];
  let sheetDataXml = '<row r="1" ht="26" customHeight="1">';
  for (let c = 0; c < headers.length; c++) {
    const cellRef = `${colIndexToLetters(c)}1`;
    sheetDataXml += `<c r="${cellRef}" s="1" t="inlineStr"><is><t>${escapeXml(headers[c])}</t></is></c>`;
  }
  sheetDataXml += '</row>';

  let sumDebits = 0;
  let sumCredits = 0;

  for (let r = 0; r < rows.length; r++) {
    const rowNum = r + 2;
    const item = rows[r];
    const vals = [item.date, item.description, item.debit, item.credit, item.balance];

    if (item.debit && Number.isFinite(Number(item.debit))) sumDebits += Number(item.debit);
    if (item.credit && Number.isFinite(Number(item.credit))) sumCredits += Number(item.credit);

    let rowXml = `<row r="${rowNum}">`;
    for (let c = 0; c < vals.length; c++) {
      const cellRef = `${colIndexToLetters(c)}${rowNum}`;
      const rawVal = vals[c] || '';
      const isNum = c >= 2 && Number.isFinite(Number(rawVal)) && rawVal.trim() !== '';

      if (isNum) {
        rowXml += `<c r="${cellRef}" s="2"><v>${rawVal.trim()}</v></c>`;
      } else {
        rowXml += `<c r="${cellRef}" t="inlineStr"><is><t>${escapeXml(rawVal)}</t></is></c>`;
      }
    }
    rowXml += '</row>';
    sheetDataXml += rowXml;
  }

  // Add summary total row if transactions exist
  if (rows.length > 0) {
    const totalRowNum = rows.length + 2;
    const lastDataRow = rows.length + 1;
    sheetDataXml += `<row r="${totalRowNum}" ht="20" customHeight="1">
      <c r="A${totalRowNum}" s="3" t="inlineStr"><is><t></t></is></c>
      <c r="B${totalRowNum}" s="3" t="inlineStr"><is><t>Total</t></is></c>
      <c r="C${totalRowNum}" s="4"><f>SUM(C2:C${lastDataRow})</f><v>${sumDebits.toFixed(2)}</v></c>
      <c r="D${totalRowNum}" s="4"><f>SUM(D2:D${lastDataRow})</f><v>${sumCredits.toFixed(2)}</v></c>
      <c r="E${totalRowNum}" s="3" t="inlineStr"><is><t></t></is></c>
    </row>`;
  }

  const lastRow = Math.max(2, rows.length + 1);
  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews>
    <sheetView tabSelected="1" workbookViewId="0">
      <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <cols>
    <col min="1" max="1" width="14" customWidth="1"/>
    <col min="2" max="2" width="46" customWidth="1"/>
    <col min="3" max="3" width="22" customWidth="1"/>
    <col min="4" max="4" width="22" customWidth="1"/>
    <col min="5" max="5" width="22" customWidth="1"/>
  </cols>
  <sheetData>
    ${sheetDataXml}
  </sheetData>
  <autoFilter ref="A1:E${lastRow}"/>
</worksheet>`;

  zip.file('xl/worksheets/sheet1.xml', sheetXml);

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const format = (formData.get('format') as string) || 'xlsx';
    const customRowsJson = formData.get('transactions') as string | null;

    let transactions: TransactionRow[] = [];
    let summary: import('@/lib/bank-statement').StatementSummary | undefined;
    const baseName = file?.name ? file.name.replace(/\.pdf$/i, '') : 'bank-statement';

    // If client supplied edited transactions for download
    if (customRowsJson) {
      if (customRowsJson.length > 5_000_000) {
        return apiError('Edited transactions are too large (5MB max).', 413);
      }
      try {
        const parsed = JSON.parse(customRowsJson);
        const sanitized = sanitizeCustomTransactions(parsed);
        if (sanitized) {
          transactions = sanitized;
        }
        // Invalid JSON falls back to parsing the PDF below.
      } catch {
        // Fallback to parsing file if JSON parse fails
      }
      if (Array.isArray(transactions) && transactions.length > MAX_CUSTOM_TRANSACTIONS) {
        return apiError(`Too many transactions (${transactions.length}). Maximum ${MAX_CUSTOM_TRANSACTIONS} rows.`, 413);
      }
    }

    // Parse PDF if no custom transactions provided
    if (transactions.length === 0) {
      const opened = await openEditablePdf(file);
      if (!opened.ok) return opened.response;
      const { buffer } = opened;

      const items = await extractPdfTextItems(buffer);

      // Detect scanned (image-only) PDF
      if (items.length === 0 || items.every(item => !item.str.trim())) {
        return NextResponse.json(
          {
            error: 'No selectable text found. This document appears to be a scanned PDF. Please use our OCR tool to extract text, or upload a digital PDF statement.',
            failure: 'scanned_pdf',
            isScannedPdf: true,
          },
          { status: 422, headers: { 'Cache-Control': 'no-store' } }
        );
      }

      const tableLines = itemsToTableRows(items).map(row => row.join('\t'));
      const plainLines = itemsToLines(items);
      const tableParsed = parseBankStatement(tableLines);
      const lineParsed = parseBankStatement(plainLines);

      const parsed = scoreParse(tableParsed.transactions) >= scoreParse(lineParsed.transactions)
        ? tableParsed
        : lineParsed;

      transactions = parsed.transactions;
      summary = parsed.summary;

      if (transactions.length === 0) {
        const failureCode = parsed.failure || tableParsed.failure || lineParsed.failure;
        return NextResponse.json(
          {
            error: parseFailureMessage(failureCode),
            failure: failureCode,
            isScannedPdf: failureCode === 'empty' || failureCode === 'scanned_pdf',
          },
          { status: 422, headers: { 'Cache-Control': 'no-store' } }
        );
      }
    }

    if (format === 'json') {
      return NextResponse.json(
        {
          transactions,
          totalRows: transactions.length,
          summary,
          fileName: `${sanitizeDownloadFileName(baseName)}.xlsx`,
        },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    if (format === 'csv') {
      const csvHeader = 'Date,Description,Withdrawal (Debit),Deposit (Credit),Balance\n';
      const csvBody = transactions
        .map(
          t =>
            `"${(t.date || '').replace(/"/g, '""')}","${(t.description || '').replace(/"/g, '""')}","${t.debit || ''}","${t.credit || ''}","${t.balance || ''}"`
        )
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
    return apiError(
      pdfTextErrorMessage(error, 'Failed to convert bank statement to Excel'),
      pdfTextErrorStatus(error),
    );
  }
}

