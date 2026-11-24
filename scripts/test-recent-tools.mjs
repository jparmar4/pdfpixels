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

// ─── Wave-3 tools (2026-09-25): split-by-size, from-text, ico, extract-images, ocr ───
async function callAny(routePath, bytes, fileName, mime, fields = {}) {
  const form = new FormData();
  if (bytes) form.append('file', new Blob([bytes], { type: mime }), fileName);
  for (const [key, value] of Object.entries(fields)) form.append(key, String(value));
  const { POST } = await import(`../src/app/api/${routePath}/route.ts`);
  return POST(new NextRequest('http://localhost/api/' + routePath, { method: 'POST', body: form }));
}

// Split by size: multi-page fixture must split into parts each under the limit.
// Random base36 text keeps pages incompressible so 100KB parts actually overflow.
function randomLine(length) {
  let s = '';
  while (s.length < length) s += Math.random().toString(36).slice(2);
  return s.slice(0, length);
}
const sizeDoc = await PDFDocument.create();
const sizeFont = await sizeDoc.embedFont(StandardFonts.Courier);
for (let p = 0; p < 120; p++) {
  const page = sizeDoc.addPage([612, 792]);
  for (let l = 0; l < 8; l++) {
    page.drawText(randomLine(200), { x: 30, y: 750 - l * 14, size: 9, font: sizeFont });
  }
}
const manyPageSource = await sizeDoc.save();
const sizeZip = await callAny('pdf/split', manyPageSource, 'sample.pdf', 'application/pdf', { mode: 'size', maxSizeMb: '0.1' });
if (sizeZip.status !== 200) throw new Error('split size: ' + sizeZip.status + ' ' + await sizeZip.text());
const sizeParts = await JSZip.loadAsync(await sizeZip.arrayBuffer());
const partNames = Object.keys(sizeParts.files).filter((n) => n.endsWith('.pdf'));
assert.ok(partNames.length >= 2, `expected >=2 parts, got ${partNames.length}`);
for (const name of partNames) {
  const partBytes = await sizeParts.file(name).async('uint8array');
  assert.ok(partBytes.length <= 0.1 * 1024 * 1024, `${name} exceeds limit: ${partBytes.length}`);
  await PDFDocument.load(partBytes);
}
assert.equal((await callAny('pdf/split', manyPageSource, 'sample.pdf', 'application/pdf', { mode: 'size', maxSizeMb: '99' })).status, 400);

// Text to PDF: wrapped text survives round-trip extraction
const textPdfResponse = await callAny('pdf/from-text', null, null, null, { text: 'Hello from Text to PDF.\nSecond line with a longer sentence that should wrap across the page width without overflowing the margins.', pageSize: 'a4', font: 'courier', fontSize: '12' });
if (textPdfResponse.status !== 200) throw new Error('from-text: ' + textPdfResponse.status + ' ' + await textPdfResponse.text());
const textPdfBytes = new Uint8Array(await textPdfResponse.arrayBuffer());
assert.match((await extractPdfLines(Buffer.from(textPdfBytes))).join(' '), /Hello from Text to PDF/);
assert.equal((await callAny('pdf/from-text', null, null, null, { text: '' })).status, 400);

// PDF OCR: text-layer PDFs return extraction instead of OCR (fast path, no tesseract needed).
// Fixture carries >200 chars so the route's text-layer detector engages deterministically.
const ocrSource = await fixture([
  'Café résumé (encoded text) — this scanned-style contract begins with a long preamble paragraph.',
  '01/02/2026 Payment -1,234.56 9,876.54',
  'The parties agree that this agreement is governed by the laws of the issuing jurisdiction and that any dispute',
  'arising out of it shall be resolved by arbitration under the rules agreed in writing between both parties hereto.',
]);
const ocrResponse = await callAny('pdf/ocr', ocrSource, 'sample.pdf', 'application/pdf');
if (ocrResponse.status !== 200) throw new Error('ocr: ' + ocrResponse.status + ' ' + await ocrResponse.text());
const ocrJson = await ocrResponse.json();
assert.equal(ocrJson.usedOcr, false);
assert.match(ocrJson.text, /Café résumé/);

// Extract images: JPEG embedded via DCTDecode must come back verbatim in a ZIP
const jpeg1x1 = Uint8Array.from(await sharp({ create: { width: 8, height: 8, channels: 3, background: { r: 200, g: 30, b: 40 } } }).jpeg().toBuffer());
const imgPdfDoc = await PDFDocument.create();
const embeddedJpeg = await imgPdfDoc.embedJpg(jpeg1x1);
const imgPage = imgPdfDoc.addPage([100, 100]);
imgPage.drawImage(embeddedJpeg, { x: 10, y: 10, width: 80, height: 80 });
const imgPdfBytes = await imgPdfDoc.save();
const imagesZip = await callAny('pdf/extract-images', imgPdfBytes, 'sample.pdf', 'application/pdf');
if (imagesZip.status !== 200) throw new Error('extract-images: ' + imagesZip.status + ' ' + await imagesZip.text());
assert.equal(imagesZip.headers.get('x-images-extracted'), '1');
const archive = await JSZip.loadAsync(await imagesZip.arrayBuffer());
const entryNames = Object.keys(archive.files);
assert.equal(entryNames.length, 1);
assert.match(entryNames[0], /image-001\.jpg$/);

// Extract images: text-only PDF reports honestly with 422
const noImages = await callAny('pdf/extract-images', source, 'sample.pdf', 'application/pdf');
assert.equal(noImages.status, 422);

// PNG to ICO: multi-size container with a valid ICONDIR
const pngSource = await sharp({ create: { width: 256, height: 256, channels: 4, background: { r: 20, g: 80, b: 200, alpha: 1 } } }).png().toBuffer();
const icoResponse = await callAny('image/ico', pngSource, 'logo.png', 'image/png', { sizes: '16,32' });
if (icoResponse.status !== 200) throw new Error('ico: ' + icoResponse.status + ' ' + await icoResponse.text());
const icoBytes = Buffer.from(await icoResponse.arrayBuffer());
assert.equal(icoBytes.readUInt16LE(0), 0); // reserved
assert.equal(icoBytes.readUInt16LE(2), 1); // type icon
assert.equal(icoBytes.readUInt16LE(4), 2); // 2 sizes
assert.equal(icoBytes.readUInt8(6), 16); // first entry width
assert.equal(icoBytes.readUInt8(22), 32); // second entry width
writeFileSync(path.join(out, 'favicon.ico'), icoBytes);

// PDF to PNG: verify format='png' renders PNG images in ZIP archive
const pdfPngResponse = await callAny('pdf/to-image', source, 'sample.pdf', 'application/pdf', { format: 'png', dpi: '150', pages: '1' });
if (pdfPngResponse.status !== 200) throw new Error('pdf-to-png: ' + pdfPngResponse.status + ' ' + await pdfPngResponse.text());
const pngZip = await JSZip.loadAsync(await pdfPngResponse.arrayBuffer());
const pngZipFiles = Object.keys(pngZip.files).filter(f => f.endsWith('.png'));
assert.ok(pngZipFiles.length >= 1, 'Expected at least 1 PNG in output zip');
const pngFileBytes = Buffer.from(await pngZip.file(pngZipFiles[0]).async('uint8array'));
// Verify PNG magic bytes: 0x89, 0x50, 0x4E, 0x47
assert.equal(pngFileBytes[0], 0x89);
assert.equal(pngFileBytes[1], 0x50);
assert.equal(pngFileBytes[2], 0x4E);
assert.equal(pngFileBytes[3], 0x47);

// JPG to WebP & PNG to WebP: verify Sharp WebP conversion
const jpgBuffer = await sharp({ create: { width: 64, height: 64, channels: 3, background: { r: 255, g: 120, b: 0 } } }).jpeg().toBuffer();
const webpResponse = await callAny('image/process', jpgBuffer, 'test.jpg', 'image/jpeg', { format: 'webp', quality: '90' });
if (webpResponse.status !== 200) throw new Error('jpg-to-webp: ' + webpResponse.status + ' ' + await webpResponse.text());
const webpJson = await webpResponse.json();
assert.equal(webpJson.success, true);
assert.equal(webpJson.mimeType, 'image/webp');
assert.ok(webpJson.imageUrl.startsWith('data:image/webp;base64,'));

// Image Processing suite: verify resize, crop, rotate, flip, compress
const imgProcessResponse = await callAny('image/process', jpgBuffer, 'test.jpg', 'image/jpeg', {
  width: '32',
  height: '32',
  rotate: '90',
  flip: 'true',
  format: 'png',
  quality: '95',
});
assert.equal(imgProcessResponse.status, 200);
const imgProcessJson = await imgProcessResponse.json();
assert.equal(imgProcessJson.success, true);
assert.equal(imgProcessJson.format, 'png');

// AI Tools Suite: verify remove-background, blur-background, enhance, beautify, retouch, upscale
// Portrait test image with light background, skin face circle, and shirt
const aiPortraitBuffer = await sharp({
  create: { width: 120, height: 160, channels: 3, background: { r: 235, g: 238, b: 242 } }
})
  .composite([
    // Face region (centered at x=60, y=45)
    {
      input: await sharp({
        create: { width: 50, height: 50, channels: 3, background: { r: 212, g: 172, b: 140 } }
      }).png().toBuffer(),
      left: 35,
      top: 25,
    },
    // Shirt region
    {
      input: await sharp({
        create: { width: 90, height: 75, channels: 3, background: { r: 240, g: 195, b: 25 } }
      }).png().toBuffer(),
      left: 15,
      top: 80,
    },
  ])
  .jpeg()
  .toBuffer();

for (const tool of ['remove-background', 'blur-background', 'enhance-image', 'beautify', 'retouch', 'upscale']) {
  const aiResp = await callAny('ai', aiPortraitBuffer, 'portrait.jpg', 'image/jpeg', { tool, mode: 'high' });
  assert.equal(aiResp.status, 200, `${tool} status: ${aiResp.status}`);
  const aiJson = await aiResp.json();
  assert.equal(aiJson.success, true, `${tool} success`);
  assert.ok(aiJson.imageUrl?.startsWith('data:image/png;base64,'), `${tool} data url`);

  if (tool === 'remove-background') {
    // Decode result to verify face is preserved and background removed
    const base64Data = aiJson.imageUrl.split(',')[1];
    const decoded = Buffer.from(base64Data, 'base64');
    const { data: resultRaw, info: resInfo } = await sharp(decoded).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    // Top-left corner (background) must be transparent
    const bgAlpha = resultRaw[3];
    assert.ok(bgAlpha < 60, `remove-background corner alpha should be transparent, got ${bgAlpha}`);
    // Center face area (x=60, y=45) must be preserved
    const facePixelIdx = (45 * resInfo.width + 60) * 4;
    const faceAlpha = resultRaw[facePixelIdx + 3];
    assert.ok(faceAlpha > 200, `remove-background face alpha must be preserved, got ${faceAlpha}`);
  }
}

// Test remove-background in balanced mode as well
const bgBalancedResp = await callAny('ai', aiPortraitBuffer, 'portrait.jpg', 'image/jpeg', { tool: 'remove-background', mode: 'balanced' });
assert.equal(bgBalancedResp.status, 200);
const bgBalancedJson = await bgBalancedResp.json();
assert.equal(bgBalancedJson.success, true);
const bData = Buffer.from(bgBalancedJson.imageUrl.split(',')[1], 'base64');
const { data: bRaw, info: bInfo } = await sharp(bData).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
assert.ok(bRaw[3] < 60, `balanced mode corner alpha should be transparent, got ${bRaw[3]}`);
assert.ok(bRaw[(45 * bInfo.width + 60) * 4 + 3] > 200, `balanced mode face must be preserved`);

// Regression suite for fixed tools: EXIF orientation, PPTX aspect, XLSX columns, AcroForm fill, center watermark, GS repair, target-KB PNG
{
  // 1. EXIF Orientation 6 (raw 120x60 stored landscape -> upright portrait 60x120)
  const exifRaw = await sharp({
    create: { width: 120, height: 60, channels: 3, background: { r: 20, g: 120, b: 220 } },
  }).jpeg().withMetadata({ orientation: 6 }).toBuffer();

  const imgProcExif = await callAny('image/process', exifRaw, 'portrait-exif.jpg', 'image/jpeg', {
    cropLeft: '5', cropTop: '5', cropWidth: '50', cropHeight: '100', format: 'jpg',
  });
  assert.equal(imgProcExif.status, 200, 'image/process handles crop on EXIF-rotated upright portrait');
  const exifProcJson = await imgProcExif.json();
  assert.equal(exifProcJson.originalDimensions.width, 60, 'visual width accounts for EXIF rotation');
  assert.equal(exifProcJson.originalDimensions.height, 120, 'visual height accounts for EXIF rotation');

  // PNG target-size optimization actually compresses with palette inside bisection
  const noisyPng = await sharp({
    create: { width: 180, height: 180, channels: 4, noise: { type: 'gaussian', mean: 128, sigma: 40 } },
  }).png().toBuffer();
  const pngTargetResp = await callAny('image/process', noisyPng, 'noisy.png', 'image/png', {
    format: 'png', targetSize: '12',
  });
  assert.equal(pngTargetResp.status, 200);
  const pngTargetJson = await pngTargetResp.json();
  assert.ok(pngTargetJson.processedSize <= 12 * 1024, `PNG target-KB <= 12KB, got ${pngTargetJson.processedSize}`);

  // 2. EXIF portrait JPEG -> /api/pdf/from-image (fit / auto stays upright portrait)
  const fromImgForm = new FormData();
  fromImgForm.append('files', new File([exifRaw], 'exif.jpg', { type: 'image/jpeg' }));
  fromImgForm.append('pageSize', 'fit');
  fromImgForm.append('orientation', 'auto');
  const { POST: fromImagePost } = await import('../src/app/api/pdf/from-image/route.ts');
  const fromImgResp = await fromImagePost(new NextRequest('http://localhost/api/pdf/from-image', { method: 'POST', body: fromImgForm }));
  assert.equal(fromImgResp.status, 200, 'from-image handles EXIF-rotated portrait JPEG');
  const fromImgPdf = await PDFDocument.load(new Uint8Array(await fromImgResp.arrayBuffer()));
  const fromImgSize = fromImgPdf.getPage(0).getSize();
  assert.ok(fromImgSize.width < fromImgSize.height, `EXIF portrait stays portrait (${fromImgSize.width}x${fromImgSize.height})`);

  // 3. Portrait PDF -> /api/pdf/to-pptx preserves aspect ratio (not stretched to 13.333x7.5)
  const portraitPdfDoc = await PDFDocument.create();
  portraitPdfDoc.addPage([400, 800]);
  const portraitBytes = await portraitPdfDoc.save();
  const pptxResp = await call('to-pptx', portraitBytes);
  assert.equal(pptxResp.status, 200, 'to-pptx succeeds for portrait PDF');
  const pptxZip = await JSZip.loadAsync(await pptxResp.arrayBuffer());
  const slideXml = await pptxZip.file('ppt/slides/slide1.xml')?.async('string');
  assert.ok(slideXml && slideXml.includes('<a:ext '), 'pptx contains slide image transform');
  const extMatch = slideXml.match(/<p:pic>[\s\S]*?<a:xfrm>\s*<a:off x="(\d+)" y="(\d+)"\/>\s*<a:ext cx="(\d+)" cy="(\d+)"\/>/);
  assert.ok(extMatch, 'pptx picture image extent present');
  const cx = Number(extMatch[3]);
  const cy = Number(extMatch[4]);
  assert.ok(cx > 0 && cy > 0 && cx < cy, `portrait slide maintains portrait extent (cx=${cx}, cy=${cy})`);

  // 4. Multi-column PDF -> /api/pdf/to-excel aligns columns (not all in Col A)
  const multiColPdf = await columnFixture(
    ['Date', 'Merchant', 'Amount'],
    [50, 220, 520],
    [['01/05/2026', 'Cloud Hosting', '199.00'], ['02/05/2026', 'Domain Renewal', '14.99']],
  );
  const excelResp = await call('to-excel', multiColPdf, { format: 'xlsx' });
  assert.equal(excelResp.status, 200, 'to-excel handles multi-column PDF');
  const excelZip = await JSZip.loadAsync(await excelResp.arrayBuffer());
  const sheetXml = await excelZip.file('xl/worksheets/sheet1.xml')?.async('string');
  assert.ok(sheetXml && sheetXml.includes('r="B') && sheetXml.includes('r="C'), 'to-excel populates columns B and C');

  // 5. AcroForm CheckBox + Dropdown + RadioGroup + vector checkmark via /api/pdf/fill
  const acroDoc = await PDFDocument.create();
  const acroPage = acroDoc.addPage([500, 700]);
  const acroForm = acroDoc.getForm();
  const textF = acroForm.createTextField('applicant_name');
  textF.addToPage(acroPage, { x: 40, y: 600, width: 150, height: 20 });
  const checkF = acroForm.createCheckBox('agree_terms');
  checkF.addToPage(acroPage, { x: 40, y: 560, width: 16, height: 16 });
  const dropF = acroForm.createDropdown('country');
  dropF.addOptions(['US', 'IN', 'UK']);
  dropF.addToPage(acroPage, { x: 40, y: 510, width: 120, height: 24 });
  const radioF = acroForm.createRadioGroup('plan');
  radioF.addOptionToPage('pro', acroPage, { x: 40, y: 460, width: 16, height: 16 });
  radioF.addOptionToPage('free', acroPage, { x: 80, y: 460, width: 16, height: 16 });
  const acroBytes = await acroDoc.save();

  const fillResp = await call('fill', acroBytes, {
    fields: JSON.stringify({ applicant_name: 'Alice', agree_terms: true, country: 'IN', plan: 'pro' }),
    textEntries: JSON.stringify([{ pageNumber: 1, x: 100, y: 120, text: '✓', fontSize: 16 }]),
  });
  assert.equal(fillResp.status, 200, `fill AcroForm all field types + checkmark: ${fillResp.status}`);
  const filledDoc = await PDFDocument.load(new Uint8Array(await fillResp.arrayBuffer()));
  assert.equal(filledDoc.getForm().getTextField('applicant_name').getText(), 'Alice');
  assert.equal(filledDoc.getForm().getCheckBox('agree_terms').isChecked(), true);
  assert.deepEqual(filledDoc.getForm().getDropdown('country').getSelected(), ['IN']);
  assert.equal(filledDoc.getForm().getRadioGroup('plan').getSelected(), 'pro');

  // 6. Rotated center watermark
  await okPdf('watermark', source, { text: 'CONFIDENTIAL', position: 'center', rotation: '45' });

  // 7. Repair truncated/corrupt-xref PDF
  const truncatedSource = Buffer.from(source).subarray(0, source.length - 120);
  await okPdf('repair', truncatedSource);

  // 8. /api/image/process binary streaming mode + backward-compatible JSON
  const { POST: imageProcessPost } = await import('../src/app/api/image/process/route.ts');
  const binForm = new FormData();
  binForm.append('image', new File([noisyPng], 'noisy.png', { type: 'image/png' }));
  binForm.append('format', 'webp');
  binForm.append('quality', '75');
  binForm.append('responseType', 'binary');
  const binResp = await imageProcessPost(
    new NextRequest('http://localhost/api/image/process', { method: 'POST', body: binForm }),
  );
  assert.equal(binResp.status, 200, 'binary responseType returns 200');
  assert.equal(binResp.headers.get('content-type'), 'image/webp');
  assert.ok(Number(binResp.headers.get('x-original-size')) === noisyPng.length, 'X-Original-Size matches input');
  const binBuf = Buffer.from(await binResp.arrayBuffer());
  assert.ok(Number(binResp.headers.get('x-processed-size')) === binBuf.length, 'X-Processed-Size matches raw buffer');
  assert.ok(binResp.headers.get('x-saved-bytes') !== null, 'X-Saved-Bytes header present');
  assert.ok(binResp.headers.get('x-saved-percent') !== null, 'X-Saved-Percent header present');
  const binMeta = await sharp(binBuf).metadata();
  assert.equal(binMeta.format, 'webp', 'binary payload decodes directly as webp');

  const acceptForm = new FormData();
  acceptForm.append('image', new File([noisyPng], 'noisy.png', { type: 'image/png' }));
  acceptForm.append('format', 'jpg');
  const acceptResp = await imageProcessPost(
    new NextRequest('http://localhost/api/image/process', {
      method: 'POST',
      headers: { Accept: 'image/*' },
      body: acceptForm,
    }),
  );
  assert.equal(acceptResp.status, 200);
  assert.equal(acceptResp.headers.get('content-type'), 'image/jpeg', 'Accept: image/* returns raw binary jpeg');
  const acceptMeta = await sharp(Buffer.from(await acceptResp.arrayBuffer())).metadata();
  assert.equal(acceptMeta.format, 'jpeg');

  // 9. Proxy same-origin + signed token verification on heavy API routes
  const { default: proxy } = await import('../src/proxy.ts');
  const directBotRes = proxy(new NextRequest('http://localhost/api/image/process', { method: 'POST' }));
  assert.equal(directBotRes.status, 403, 'direct bot POST /api/image/process blocked with 403');
  const spoofedOriginRes = proxy(
    new NextRequest('http://localhost/api/pdf/compress', {
      method: 'POST',
      headers: { Origin: 'http://localhost', Referer: 'http://localhost/tools/compress-pdf' },
    }),
  );
  assert.equal(spoofedOriginRes.status, 403, 'forged Origin without signed cookie blocked with 403');

  const uiPageRes = proxy(new NextRequest('http://localhost/tools/compress-image', { method: 'GET' }));
  assert.equal(
    uiPageRes.cookies.get('pp_api_token')?.value,
    undefined,
    'Public cacheable UI HTML route does not leak Set-Cookie pp_api_token'
  );

  const sessionRes = proxy(
    new NextRequest('http://localhost/api/session', {
      method: 'GET',
      headers: {
        Origin: 'http://localhost',
        Referer: 'http://localhost/tools/compress-image',
        'Sec-Fetch-Site': 'same-origin',
      },
    }),
  );
  const tokenCookie = sessionRes.cookies.get('pp_api_token')?.value;
  assert.ok(tokenCookie, 'GET /api/session sets signed pp_api_token cookie');

  const crossSiteRes = proxy(
    new NextRequest('http://localhost/api/image/process', {
      method: 'POST',
      headers: {
        Origin: 'https://evil.example',
        'Sec-Fetch-Site': 'cross-site',
        Cookie: `pp_api_token=${tokenCookie}`,
      },
    }),
  );
  assert.equal(crossSiteRes.status, 403, 'cross-site POST blocked even with cookie');

  const validUiApiRes = proxy(
    new NextRequest('http://localhost/api/image/process', {
      method: 'POST',
      headers: {
        Origin: 'http://localhost',
        Referer: 'http://localhost/tools/compress-image',
        'Sec-Fetch-Site': 'same-origin',
        Cookie: `pp_api_token=${tokenCookie}`,
      },
    }),
  );
  assert.notEqual(validUiApiRes.status, 403, 'same-origin POST with signed cookie passes proxy auth');
}

// Verify tool aliases, redirects, metrics, and intelligent search ranking
const { allTools, allPdfTools, pdfToolGroups, platformStats, getToolBySlug, getToolById, searchTools } = await import('../src/lib/tools-data.ts');
const { organizationData } = await import('../src/lib/seo-config.ts');
assert.equal(platformStats.freeToolsLabel, `${allTools.length}+`);
assert.equal(platformStats.fileFormatsLabel, '30+');
assert.equal(platformStats.freeWorkflowsLabel, '100%');
assert.equal(platformStats.accountWallsLabel, '0');
assert.equal('telephone' in organizationData, false, 'global organizationData omits Indian phone number');
assert.equal('telephone' in organizationData.contactPoint, false, 'global contactPoint omits Indian phone number');
assert.ok(allTools.length >= 155, `allTools count (${allTools.length}) matches >= 155`);
assert.ok(allPdfTools.length >= 95, `allPdfTools count (${allPdfTools.length}) matches >= 95`);
for (const slug of [
  'fill-sign-irs-w9-pdf',
  'amazon-fba-thermal-label-converter',
  'qbo-ofx-qfx-to-excel-csv',
  'uscis-pdf-packet-merger',
  'pdf-accessibility-checker',
  'capital-one-statement-to-excel',
  'amex-statement-to-excel',
  'sparkasse-statement-to-excel',
  'commbank-statement-to-excel',
  'rbc-bank-statement-to-excel',
  'local-folder-batch-processor',
  'ecommerce-product-photo-pack',
  'c2pa-ai-content-credentials-checker',
  'private-ai-pdf-contract-auditor',
]) {
  assert.ok(getToolBySlug(slug), `Tier-1 tool exists: ${slug}`);
}

const { parseOfxQboQfx, formatOfxCsv, SAMPLE_QBO_STATEMENT } = await import('../src/lib/ofx-qbo-parser.ts');
const parsedQbo = parseOfxQboQfx(SAMPLE_QBO_STATEMENT);
assert.equal(parsedQbo.transactions.length, 4, 'Sample QBO parses 4 transactions');
assert.equal(parsedQbo.currency, 'USD');
assert.ok(formatOfxCsv(parsedQbo, 'xero').startsWith('*Date,*Amount,Payee'), 'Xero CSV header valid');
assert.ok(formatOfxCsv(parsedQbo, 'quickbooks-3col').startsWith('Date,Description,Amount'), 'QBO CSV header valid');

const { PII_PATTERN_SPECS } = await import('../src/lib/pii-patterns.ts');
assert.ok(PII_PATTERN_SPECS.some((p) => p.type === 'ein' && new RegExp(p.regex.source).test('12-3456789')), 'EIN pattern matches');
assert.ok(PII_PATTERN_SPECS.some((p) => p.type === 'iban' && new RegExp(p.regex.source).test('DE89 3704 0044 0532 0130 00')), 'IBAN pattern matches');
const groupedPdfIds = new Set(pdfToolGroups.flatMap((g) => g.tools.map((t) => t.id)));
assert.equal(groupedPdfIds.size, allPdfTools.length, 'pdfToolGroups includes all PDF tools');
assert.ok(getToolBySlug('image-to-pdf'), 'image-to-pdf tool exists');
assert.ok(getToolBySlug('pdf-to-csv'), 'pdf-to-csv tool exists');
assert.equal(getToolById('pdf-merge')?.slug, 'merge-pdf');
assert.equal(getToolById('pdf-split')?.slug, 'split-pdf');

const mergeSearch = searchTools('pdf merge');
assert.ok(mergeSearch.length > 0);
assert.equal(mergeSearch[0].slug, 'merge-pdf', 'pdf merge ranks merge-pdf first');

const jpgPdfSearch = searchTools('jpg to pdf');
assert.ok(jpgPdfSearch.length > 0);
assert.equal(jpgPdfSearch[0].slug, 'image-to-pdf', 'jpg to pdf ranks image-to-pdf first');

// Verify comparisons integrity
const { comparisonPages } = await import('../src/lib/comparisons.ts');
assert.ok(comparisonPages.length >= 26, 'at least 26 comparisons registered');
for (const cmp of comparisonPages) {
  assert.ok(cmp.slug && cmp.title && cmp.description, `comparison ${cmp.slug} has title/description`);
  const tool = getToolBySlug(cmp.primaryToolSlug);
  assert.ok(tool, `comparison ${cmp.slug} references valid tool: ${cmp.primaryToolSlug}`);
}
assert.ok(comparisonPages.some(c => c.slug === 'pdfpixels-vs-pdf24-merge-pdf'), 'pdf24 merge comparison exists');
assert.ok(comparisonPages.some(c => c.slug === 'pdfpixels-vs-ilovepdf-split-pdf'), 'ilovepdf split comparison exists');
assert.ok(comparisonPages.some(c => c.slug === 'pdfpixels-vs-ilovepdf-word-to-pdf'), 'ilovepdf word-to-pdf comparison exists');

// Verify use cases integrity
const { useCasePages } = await import('../src/lib/use-cases.ts');
assert.ok(useCasePages.length >= 35, 'at least 35 use cases registered');
for (const uc of useCasePages) {
  assert.ok(uc.slug && uc.title && uc.description, `use case ${uc.slug} has title/description`);
  const tool = getToolBySlug(uc.targetToolSlug);
  assert.ok(tool, `use case ${uc.slug} references valid tool: ${uc.targetToolSlug}`);
}
assert.ok(useCasePages.some(u => u.slug === 'compress-pdf-for-uscis-upload'), 'uscis upload use case exists');
assert.ok(useCasePages.some(u => u.slug === 'bates-numbering-pdf-legal-filing'), 'bates numbering legal filing use case exists');
assert.ok(useCasePages.some(u => u.slug === 'combine-bank-statements-for-mortgage'), 'combine bank statements for mortgage use case exists');

// Verify Adsterra & Ads Configuration
const { adsterraConfig, adsenseConfig, adsConfig, hasConfiguredAdSlot } = await import('../src/lib/ads-config.ts');
assert.ok(adsterraConfig.enabled, 'Adsterra enabled as primary ad network');
assert.ok(adsConfig.enabled, 'Global ads enabled when Adsterra is active');
assert.ok(hasConfiguredAdSlot(), 'At least one active ad slot configured');
assert.ok(adsterraConfig.scriptHost.startsWith('https://'), 'Adsterra anti-adblock scriptHost configured');
assert.ok(adsterraConfig.smartlink.startsWith('https://'), 'Adsterra smartlink configured');
assert.ok(adsterraConfig.slots.banner728x90.key && adsterraConfig.slots.banner300x250.key, 'Adsterra banner keys configured');
assert.ok(adsterraConfig.slots.nativeBanner.scriptSrc && adsterraConfig.slots.socialBar.scriptSrc, 'Adsterra native and social bar configured');
assert.ok(
  adsterraConfig.slots.popunder.scriptSrc.includes('abscloud.org/1/893e27ddba5b4b20f76e839a457f8ca0') &&
    adsConfig.slots.popunder.includes('abscloud.org/1/893e27ddba5b4b20f76e839a457f8ca0'),
  'Adsterra popunder configured with abscloud.org script',
);
assert.ok(!adsenseConfig.clientId || adsenseConfig.clientId.startsWith('ca-pub-'), 'AdSense client ID format valid');

// Verify 100% toolContentMap coverage + Tier-1 Discover blog guides & cover dimensions
const { toolContentMap } = await import('../src/lib/tool-content-data.ts');
const { allTools: allToolsRegistry } = await import('../src/lib/tools-data.ts');
for (const tool of allToolsRegistry) {
  assert.ok(toolContentMap[tool.slug], `toolContentMap missing content for tool slug: ${tool.slug}`);
}
const { getBlogPostBySlug, getCoverDimensions, getPostsForTool } = await import('../src/config/blog.ts');
assert.ok(getPostsForTool('edit-pdf').length >= 2, 'edit-pdf maps to curated blog guides');
for (const discoverSlug of [
  'qbo-ofx-qfx-to-excel-csv-quickbooks-import-fix',
  'uscis-immigration-court-pdf-upload-rules-2026',
  'convert-8-5x11-pdf-shipping-labels-to-4x6-thermal-printer',
]) {
  const post = getBlogPostBySlug(discoverSlug);
  assert.ok(post, `Discover guide ${discoverSlug} exists`);
  const dims = getCoverDimensions(post.coverImage);
  assert.ok(dims.width >= 1200, `Discover guide ${discoverSlug} cover must be >= 1200px wide`);
}

// Verify Google A2UI v1.0 surface builders, validator, /api/a2ui, /api/mcp, and discovery cards
const {
  A2UI_A2A_EXTENSION_URI,
  A2UI_BASIC_CATALOG_ID,
  A2UI_MIME_TYPE,
  A2UI_PROTOCOL_VERSION,
  buildPlatformLimitsA2uiSurface,
  buildToolDetailsA2uiSurface,
  buildToolSearchA2uiSurface,
  buildWorkflowRecommendationA2uiSurface,
} = await import('../src/lib/a2ui-surfaces.ts');
const { validateA2uiV10Messages } = await import('../src/lib/a2ui-validator.ts');

for (const bundle of [
  buildToolSearchA2uiSurface({ query: 'compress pdf under 2mb uscis' }),
  buildToolDetailsA2uiSurface({ slug: 'compress-pdf' }),
  buildWorkflowRecommendationA2uiSurface({ task: 'pacer federal court bates numbering merge' }),
  buildPlatformLimitsA2uiSurface(),
]) {
  const report = validateA2uiV10Messages(bundle.messages);
  assert.equal(report.valid, true, `A2UI v1.0 strict validation failed for ${bundle.intent}: ${JSON.stringify(report.errors)}`);
  assert.equal(report.errors.length, 0);
  assert.ok(report.surfaceIds.includes(bundle.surfaceId), `surface ${bundle.surfaceId} created`);
}

const a2uiRoute = await import('../src/app/api/a2ui/route.ts');
const a2uiDescriptorRes = await a2uiRoute.GET(new NextRequest('http://localhost/api/a2ui'));
assert.equal(a2uiDescriptorRes.status, 200);
const a2uiDescriptor = await a2uiDescriptorRes.json();
assert.equal(a2uiDescriptor.protocolVersion, A2UI_PROTOCOL_VERSION);
assert.equal(a2uiDescriptor.extensionUri, A2UI_A2A_EXTENSION_URI);
assert.ok(a2uiDescriptor.supportedCatalogIds.includes(A2UI_BASIC_CATALOG_ID));

// Test A2UI v1.0 ActionMessage round-trip + Accept: application/a2ui+json
const a2uiActionRes = await a2uiRoute.POST(
  new NextRequest('http://localhost/api/a2ui', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: A2UI_MIME_TYPE },
    body: JSON.stringify({
      version: '1.0',
      action: {
        name: 'get_tool_details',
        surfaceId: 'pdfpixels-test-src',
        sourceComponentId: 'inspectToolBtn',
        timestamp: new Date().toISOString(),
        context: { slug: 'merge-pdf' },
      },
      metadata: {
        a2uiRendererCapabilities: {
          '1.0': { supportedCatalogIds: [A2UI_BASIC_CATALOG_ID] },
        },
      },
    }),
  }),
);
assert.equal(a2uiActionRes.status, 200);
assert.match(a2uiActionRes.headers.get('content-type') || '', /application\/a2ui\+json/);
const rawA2uiActionMsgs = await a2uiActionRes.json();
assert.ok(Array.isArray(rawA2uiActionMsgs), 'Accept: application/a2ui+json returns raw message array');
assert.equal(validateA2uiV10Messages(rawA2uiActionMsgs).valid, true, 'ActionMessage response passes STRICT_VALIDATION');

// Test capability negotiation rejection (406)
const a2uiRejectRes = await a2uiRoute.POST(
  new NextRequest('http://localhost/api/a2ui', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'search_tools',
      query: 'compress pdf',
      a2uiRendererCapabilities: { '1.0': { supportedCatalogIds: ['https://example.com/unknown.json'] } },
    }),
  }),
);
assert.equal(a2uiRejectRes.status, 406, 'Incompatible A2UI catalog returns 406');

// Test MCP render_a2ui_surface tool + a2ui:// resources
const mcpRoute = await import('../src/app/api/mcp/route.ts');
const mcpA2uiRes = await mcpRoute.POST(
  new NextRequest('http://localhost/api/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 42,
      method: 'tools/call',
      params: { name: 'render_a2ui_surface', arguments: { intent: 'recommend_workflow', task: 'sign contract pdf' } },
    }),
  }),
);
assert.equal(mcpA2uiRes.status, 200);
const mcpA2uiJson = await mcpA2uiRes.json();
const embeddedSurface = mcpA2uiJson.result.content.find((c) => c.type === 'resource' && c.resource?.mimeType === A2UI_MIME_TYPE);
assert.ok(embeddedSurface, 'MCP render_a2ui_surface embeds application/a2ui+json resource');
assert.equal(validateA2uiV10Messages(JSON.parse(embeddedSurface.resource.text)).valid, true, 'MCP embedded A2UI surface passes STRICT_VALIDATION');

for (const uri of ['a2ui://pdfpixels/tool-directory', 'a2ui://pdfpixels/platform-limits']) {
  const resRead = await mcpRoute.POST(
    new NextRequest('http://localhost/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 43, method: 'resources/read', params: { uri } }),
    }),
  );
  assert.equal(resRead.status, 200, `MCP resources/read ${uri}`);
  const payload = await resRead.json();
  assert.equal(payload.result.contents[0].mimeType, A2UI_MIME_TYPE);
  assert.equal(validateA2uiV10Messages(JSON.parse(payload.result.contents[0].text)).valid, true, `MCP resource ${uri} passes STRICT_VALIDATION`);
}

// Verify A2A Agent Card & MCP Server Card A2UI v1.0 declarations
const agentCard = JSON.parse(readFileSync(path.join(root, 'public', '.well-known', 'agent.json'), 'utf8'));
assert.ok(
  agentCard.capabilities.extensions.some((ext) => ext.uri === A2UI_A2A_EXTENSION_URI && ext.params.supportedCatalogIds.includes(A2UI_BASIC_CATALOG_ID)),
  'A2A agent card declares A2UI v1.0 extension and basic catalog',
);
const mcpCard = JSON.parse(readFileSync(path.join(root, 'public', '.well-known', 'mcp', 'server-card.json'), 'utf8'));
assert.equal(mcpCard.a2ui.protocolVersion, A2UI_PROTOCOL_VERSION);
assert.ok(mcpCard.tools.some((t) => t.name === 'render_a2ui_surface'), 'MCP server card lists render_a2ui_surface');

console.log('Recent-tool regressions passed (including Google A2UI v1.0 strict conformance). PDF fixtures:', out);
