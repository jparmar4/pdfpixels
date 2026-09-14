// Run with Node >= 22.15: npm run test:tools
import { registerHooks } from 'node:module';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import ts from 'typescript';
import assert from 'node:assert/strict';
import { PDFDocument, PDFName, PDFString, StandardFonts, rgb } from 'pdf-lib';
import { NextRequest } from 'next/server.js';
import JSZip from 'jszip';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
registerHooks({
  resolve(specifier, context, next) {
    let target;
    if (specifier.startsWith('@/')) target = path.join(root, 'src', specifier.slice(2));
    else if (specifier.startsWith('.') && context.parentURL?.endsWith('.ts')) target = fileURLToPath(new URL(specifier, context.parentURL));
    if (target && existsSync(target + '.ts')) return { url: pathToFileURL(target + '.ts').href, shortCircuit: true };
    if (specifier === 'next/server') return next('next/server.js', context);
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith('.ts') && !url.includes('node_modules')) return {
      format: 'module', shortCircuit: true,
      source: ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText,
    };
    return next(url, context);
  },
});
const { extractPdfLines } = await import('../src/lib/pdf-text.ts');
const { parseBankStatement } = await import('../src/lib/bank-statement.ts');
const out = path.join(root, 'tmp', 'pdfs', 'recent-tools');
mkdirSync(out, { recursive: true });
async function fixture(lines, metadata = false) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < Math.max(1, lines.length); i += 45) {
    const page = doc.addPage([600, 800]);
    lines.slice(i, i + 45).forEach((line, j) => page.drawText(line, { x: 40, y: 750 - j * 15, size: 10, font, color: rgb(0.8, 0.1, 0.2) }));
  }
  if (metadata) {
    doc.setAuthor('PRIVATE_AUTHOR');
    const info = doc.context.lookup(doc.context.trailerInfo.Info);
    info.set(PDFName.of('PrivateKey'), PDFString.of('PRIVATE_CUSTOM'));
    const stream = doc.context.stream('<xmp>PRIVATE_XMP</xmp>', { Type: 'Metadata', Subtype: 'XML' });
    doc.catalog.set(PDFName.of('Metadata'), doc.context.register(stream));
  }
  return doc.save();
}
async function columnFixture(header, xs, rows) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([842, 595]);
  header.forEach((h, i) => page.drawText(h, { x: xs[i], y: 540, size: 11, font, color: rgb(0.1, 0.1, 0.1) }));
  page.drawLine({ start: { x: 40, y: 530 }, end: { x: 800, y: 530 }, thickness: 1, color: rgb(0.5, 0.5, 0.5) });
  rows.forEach((r, idx) => {
    const y = 505 - idx * 22;
    r.forEach((cell, i) => page.drawText(cell, { x: xs[i], y, size: 10, font }));
  });
  return doc.save();
}
async function call(tool, bytes, fields = {}) {
  const form = new FormData();
  if (bytes) form.append('file', new Blob([bytes], { type: 'application/pdf' }), 'sample.pdf');
  for (const [key, value] of Object.entries(fields)) form.append(key, value instanceof Uint8Array ? new File([value], key + '.pdf', { type: 'application/pdf' }) : String(value));
  const { POST } = await import(`../src/app/api/pdf/${tool}/route.ts`);
  return POST(new NextRequest('http://localhost/api/pdf/' + tool, { method: 'POST', body: form }));
}
async function okPdf(tool, bytes, fields = {}) {
  const response = await call(tool, bytes, fields);
  assert.equal(response.status, 200, `${tool}: ${response.status === 200 ? '' : await response.text()}`);
  const result = new Uint8Array(await response.arrayBuffer());
  await PDFDocument.load(result);
  writeFileSync(path.join(out, tool + '.pdf'), result);
  return result;
}
const source = await fixture(['Café résumé (encoded text)', '01/02/2026 Payment -1,234.56 9,876.54']);
assert.match((await extractPdfLines(Buffer.from(source))).join('\n'), /Café résumé/);
const text = await call('to-text', source);
assert.equal(text.status, 200); assert.match((await text.json()).text, /Café résumé/);
const bank = await call('bank-statement-to-excel', source, { format: 'json' });
assert.equal(bank.status, 200);
const bankJson = await bank.json();
const tx = bankJson.transactions[0];
assert.equal(tx.debit, '1234.56'); assert.equal(tx.balance, '9876.54');
assert.equal(bankJson.summary.totalDebits, 1234.56);

// Test custom transactions override on export
const customExport = await call('bank-statement-to-excel', null, {
  format: 'xlsx',
  transactions: JSON.stringify([{ date: '01/01/2026', description: 'CUSTOM OVERRIDE ROW', debit: '250.00', credit: '', balance: '1000.00' }])
});
assert.equal(customExport.status, 200);
const customZip = await JSZip.loadAsync(await customExport.arrayBuffer());
const customXml = await customZip.file('xl/worksheets/sheet1.xml').async('string');
assert.match(customXml, /CUSTOM OVERRIDE ROW/);

// Test Indian lakhs statement
const indianSource = await fixture(['15-Jan-2026 UPI Payment 1,25,000.00 15,50,000.00']);
const indianBank = await call('bank-statement-to-excel', indianSource, { format: 'json' });
assert.equal(indianBank.status, 200);
const indTx = (await indianBank.json()).transactions[0];
assert.equal(indTx.debit, '125000.00');

// Tab-delimited input must reach splitCells with tabs intact (empty Debit/Credit columns preserved)
const tabRows = parseBankStatement([
  'Date\tDescription\tDebit\tCredit\tBalance',
  '01/05/2026\tCREDIT REVERSAL\t54.23\t\t1,000.00',
]).transactions;
assert.equal(tabRows.length, 1);
assert.equal(tabRows[0].debit, '54.23');
assert.equal(tabRows[0].credit, '');
assert.equal(tabRows[0].balance, '1000.00');
assert.equal(tabRows[0].description, 'CREDIT REVERSAL');

// EU decimal-comma single-line must not match date fragments as money
const euPlain = parseBankStatement(['02.01.2026 SUPERMARKT 45,50 1.954,50']).transactions;
assert.equal(euPlain.length, 1);
assert.equal(euPlain[0].debit, '45.50');
assert.equal(euPlain[0].credit, '');
assert.equal(euPlain[0].balance, '1954.50');
assert.equal(euPlain[0].description, 'SUPERMARKT');

// Undated Opening/Closing Balance rows are captured and feed the summary
const balanceRows = parseBankStatement([
  'Opening Balance 5,000.00',
  '01/05/2026\tCoffee Shop\t4.50\t\t4,995.50',
  '01/06/2026\tRefund\t\t10.00\t5,005.50',
  'Closing Balance 5,005.50',
]);
assert.equal(balanceRows.transactions.length, 4);
assert.equal(balanceRows.summary.openingBalance, 5000);
assert.equal(balanceRows.summary.closingBalance, 5005.5);
assert.ok(balanceRows.transactions.some(t => t.description === 'Opening Balance' && t.date === '' && t.balance === '5000.00'));
assert.ok(balanceRows.transactions.some(t => t.description === 'Closing Balance' && t.date === '' && t.balance === '5005.50'));

// A balance-only fragment must still fail (no-dates), not become a successful parse
const balanceOnly = await call('bank-statement-to-excel', await fixture(['Opening Balance 5,000.00', 'Closing Balance 5,005.50']), { format: 'json' });
assert.equal(balanceOnly.status, 422);
assert.equal((await balanceOnly.json()).failure, 'no-dates');

// EU column-aligned statement end-to-end
const euPdf = await columnFixture(
  ['Datum', 'Omschrijving', 'Debet', 'Credit', 'Saldo'],
  [40, 140, 430, 550, 660],
  [
    ['02.01.2026', 'SUPERMARKT ALBERT HEIJN 2345', '45,50', '', '1.954,50'],
    ['03.01.2026', 'SALARIS JANUARI', '', '3.200,00', '5.154,50'],
    ['05.01.2026', 'TREIN NS UTRECHT', '28,40', '', '5.126,10'],
    ['07.01.2026', 'HUUR MAAND JANUARI', '950,00', '', '4.176,10'],
  ]
);
const euBank = await call('bank-statement-to-excel', euPdf, { format: 'json' });
assert.equal(euBank.status, 200);
const euJson = await euBank.json();
const euExpect = [
  { date: '02.01.2026', description: 'SUPERMARKT ALBERT HEIJN 2345', debit: '45.50', credit: '', balance: '1954.50' },
  { date: '03.01.2026', description: 'SALARIS JANUARI', debit: '', credit: '3200.00', balance: '5154.50' },
  { date: '05.01.2026', description: 'TREIN NS UTRECHT', debit: '28.40', credit: '', balance: '5126.10' },
  { date: '07.01.2026', description: 'HUUR MAAND JANUARI', debit: '950.00', credit: '', balance: '4176.10' },
];
assert.equal(euJson.transactions.length, euExpect.length);
euExpect.forEach((want, i) => {
  const got = euJson.transactions[i];
  assert.equal(got.date, want.date);
  assert.equal(got.description, want.description);
  assert.equal(got.debit, want.debit);
  assert.equal(got.credit, want.credit);
  assert.equal(got.balance, want.balance);
});

// US column-aligned statement end-to-end (unchanged behavior)
const usPdf = await columnFixture(
  ['Date', 'Description', 'Withdrawals', 'Deposits', 'Balance'],
  [40, 140, 400, 520, 640],
  [
    ['01/02/2026', 'POS PURCHASE - WHOLE FOODS MARKET', '86.42', '', '4,913.58'],
    ['01/03/2026', 'ONLINE TRANSFER FROM SAVINGS', '', '1,200.00', '6,113.58'],
    ['01/05/2026', 'ELECTRIC BILL AUTOPAY', '154.37', '', '5,959.21'],
    ['01/07/2026', 'PAYROLL DEPOSIT ACME CORP', '', '3,250.00', '9,209.21'],
    ['01/09/2026', 'ATM WITHDRAWAL #4471', '200.00', '', '9,009.21'],
    ['01/12/2026', 'COFFEE SHOP', '6.75', '', '9,002.46'],
  ]
);
const usBank = await call('bank-statement-to-excel', usPdf, { format: 'json' });
assert.equal(usBank.status, 200);
const usJson = await usBank.json();
const usExpect = [
  { debit: '86.42', credit: '', balance: '4913.58' },
  { debit: '', credit: '1200.00', balance: '6113.58' },
  { debit: '154.37', credit: '', balance: '5959.21' },
  { debit: '', credit: '3250.00', balance: '9209.21' },
  { debit: '200.00', credit: '', balance: '9009.21' },
  { debit: '6.75', credit: '', balance: '9002.46' },
];
assert.equal(usJson.transactions.length, usExpect.length);
usExpect.forEach((want, i) => {
  const got = usJson.transactions[i];
  assert.equal(got.debit, want.debit);
  assert.equal(got.credit, want.credit);
  assert.equal(got.balance, want.balance);
});

for (const tool of ['to-word', 'to-excel', 'bank-statement-to-excel']) {
  const response = await call(tool, source); assert.equal(response.status, 200);
  const zip = await JSZip.loadAsync(await response.arrayBuffer());
  const xml = await zip.file(tool === 'to-word' ? 'word/document.xml' : 'xl/worksheets/sheet1.xml').async('string');
  assert.match(xml, tool === 'bank-statement-to-excel' ? /1234.56/ : /Café résumé/);
}
const blank = await fixture([]);
for (const tool of ['to-text', 'to-word', 'to-excel', 'bank-statement-to-excel']) {
  const blankRes = await call(tool, blank);
  assert.equal(blankRes.status, 422, tool);
  if (tool === 'bank-statement-to-excel') {
    assert.equal((await blankRes.json()).isScannedPdf, true);
  }
}
const lines = Array.from({ length: 520 }, (_, i) => `Line ${i}`);
const revised = [...lines]; revised[515] = 'Changed after line 500';
const comparison = await call('compare', null, { fileA: await fixture(lines), fileB: await fixture(revised) });
assert.equal(comparison.status, 200);
assert.ok((await comparison.json()).diff.some(item => item.type === 'added' && item.text.includes('Changed after')));
assert.equal((await call('compare', null, { fileA: blank, fileB: blank })).status, 422);
const sanitized = await okPdf('sanitize', await fixture(['Retained text'], true));
const raw = Buffer.from(sanitized).toString('latin1');
assert.ok(!raw.includes('PRIVATE_'));
const inspection = await call('sanitize', sanitized, { action: 'inspect' });
assert.equal((await inspection.json()).hasAnyMetadata, false);
assert.equal((await call('crop', source, { pages: '999' })).status, 400);
assert.equal((await call('crop', source, { left: '1000' })).status, 400);
await okPdf('crop', source, { left: 20, right: 20 });
await okPdf('extract', source, { pages: '1' });
assert.equal((await call('extract', source, { pages: '1oops' })).status, 400);
assert.equal((await call('sign', source)).status, 400);
const signature = await sharp({ create: { width: 100, height: 30, channels: 3, background: '#112233' } }).png().toBuffer();
await okPdf('sign', source, { signatureImage: 'data:image/png;base64,' + signature.toString('base64'), y: 0, x: 40, width: 100, height: 30 });
const compressed = await okPdf('compress', source, { force: 1 });
assert.ok(compressed.length <= source.length);
assert.equal((await call('redact', source, { redactions: '[]' })).status, 400);
const redacted = await okPdf('redact', source, { redactions: JSON.stringify([{ pageNumber: 1, x: 35, y: 35, width: 300, height: 45 }]) });
assert.deepEqual(await extractPdfLines(Buffer.from(redacted)), []);
const bates = await okPdf('bates-numbering', source, { prefix: 'CASE-', startNumber: 0 });
assert.match((await extractPdfLines(Buffer.from(bates))).join(' '), /CASE-000000/);
await okPdf('grayscale', source);
await okPdf('to-cmyk', source);
await okPdf('flatten', source);
const archival = await okPdf('to-pdfa', source);
const archiveDoc = await PDFDocument.load(archival);
assert.ok(archiveDoc.catalog.has(PDFName.of('OutputIntents')));
assert.match(Buffer.from(archival).toString('latin1'), /pdfaid:part=['"]2['"]/);
const filled = await okPdf('fill', source, { textEntries: JSON.stringify([{ pageNumber: 1, x: 40, y: 100, text: 'Filled value' }]) });
assert.match((await extractPdfLines(Buffer.from(filled))).join(' '), /Filled value/);
assert.equal((await call('fill', source, { fields: '{bad' })).status, 400);
const formDoc = await PDFDocument.create();
const formPage = formDoc.addPage([600,800]);
const field = formDoc.getForm().createTextField('name'); field.setText('Original'); field.addToPage(formPage, { x: 40, y: 600, width: 200, height: 25 });
const formBytes = await formDoc.save();
const formFilled = await okPdf('fill', formBytes, { fields: JSON.stringify({ name: 'Updated' }) });
assert.equal((await PDFDocument.load(formFilled)).getForm().getTextField('name').getText(), 'Updated');
const flattened = await okPdf('flatten', formFilled);
assert.equal((await PDFDocument.load(flattened)).getForm().getFields().length, 0);
assert.match((await extractPdfLines(Buffer.from(flattened))).join(' '), /Updated/);
const docx = new JSZip(); docx.file('word/document.xml', '<w:document><w:body><w:p><w:r><w:t>Caf\u00e9 r\u00e9sum\u00e9</w:t></w:r></w:p></w:body></w:document>');
const wordForm = new FormData(); wordForm.append('file', new Blob([await docx.generateAsync({ type: 'uint8array' })]), 'source.docx');
const { POST: wordPost } = await import('../src/app/api/pdf/from-word/route.ts');
const wordResponse = await wordPost(new NextRequest('http://localhost', { method: 'POST', body: wordForm }));
assert.equal(wordResponse.status, 200);
assert.match((await extractPdfLines(Buffer.from(await wordResponse.arrayBuffer()))).join(' '), /Caf\u00e9 r\u00e9sum\u00e9/);
assert.equal((await call('from-heic', null, { file: 'invalid' })).status, 400);

console.log('Recent-tool regressions passed. PDF fixtures:', out);
