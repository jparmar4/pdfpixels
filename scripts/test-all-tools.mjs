// Full API smoke suite: every server route, happy path + key error paths.
// Run: node scripts/test-all-tools.mjs  (Node >= 22.15)
// In-process route calls (same pattern as scripts/test-recent-tools.mjs).
import { registerHooks } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import ts from 'typescript';
import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts } from 'pdf-lib';
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

const results = [];
function check(name, fn) {
  return (async () => {
    try {
      const detail = (await fn()) ?? '';
      results.push({ name, ok: true, detail });
      console.log(`  ok   ${name}${detail ? ' — ' + detail : ''}`);
    } catch (error) {
      results.push({ name, ok: false, detail: String(error?.message || error).slice(0, 300) });
      console.log(`  FAIL ${name} :: ${String(error?.message || error).slice(0, 300)}`);
    }
  })();
}

// ---------- fixtures ----------
async function pdfFixture(linesPerPage, pages = 1) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let p = 0; p < pages; p++) {
    const page = doc.addPage([600, 800]);
    linesPerPage.forEach((line, j) => page.drawText(`${line} p${p + 1}`, { x: 40, y: 750 - j * 15, size: 10, font }));
  }
  return Buffer.from(await doc.save());
}
const pdfFile = (bytes, name = 'sample.pdf') => new File([bytes], name, { type: 'application/pdf' });
async function pngFixture(w = 200, h = 120, bg = '#ffffff', square = '#cc0000') {
  const base = sharp({ create: { width: w, height: h, channels: 3, background: bg } });
  if (square) {
    const side = Math.floor(Math.min(w, h) / 2);
    const tile = await sharp({ create: { width: side, height: side, channels: 3, background: square } }).png().toBuffer();
    return base.composite([{ input: tile, left: Math.floor((w - side) / 2), top: Math.floor((h - side) / 2) }]).png().toBuffer();
  }
  return base.png().toBuffer();
}
const txtFile = (name = 'notes.txt') => new File(['hello'], name, { type: 'text/plain' });

async function callPdf(tool, fields = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value instanceof File) form.append(key, value);
    else if (Array.isArray(value)) value.forEach((v) => form.append(key, v));
    else form.append(key, String(value));
  }
  const { POST } = await import(`../src/app/api/pdf/${tool}/route.ts`);
  return POST(new NextRequest(`http://localhost/api/pdf/${tool}`, { method: 'POST', body: form }));
}
async function expectPdfBytes(res, tool) {
  assert.equal(res.status, 200, `${tool}: expected 200 got ${res.status}: ${(await res.clone().text()).slice(0, 200)}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  assert.ok(bytes.length > 500, `${tool}: suspiciously small output`);
  await PDFDocument.load(bytes);
  return bytes;
}

const A = await pdfFixture(['Alpha line one', 'Alpha line two'], 2); // 2 pages
const B = await pdfFixture(['Beta line one'], 1); // 1 page
const C = await pdfFixture(['Gamma 01/02/2026', 'Gamma line'], 3); // 3 pages
const PNG = await pngFixture();
const JPG = await sharp({ create: { width: 160, height: 100, channels: 3, background: '#224488' } }).jpeg().toBuffer();

// ---------- pdf routes ----------
await check('merge happy (2+1 pages)', async () => {
  const res = await callPdf('merge', { files: [pdfFile(A, 'a.pdf'), pdfFile(B, 'b.pdf')] });
  assert.equal(res.headers.get('X-Page-Count'), '3');
  await expectPdfBytes(res, 'merge');
  return 'X-Page-Count=3';
});
await check('merge single file → passthrough 200', async () => {
  const res = await callPdf('merge', { files: [pdfFile(A)] });
  assert.equal(res.headers.get('X-Page-Count'), '2');
  await expectPdfBytes(res, 'merge-single');
});
await check('merge empty file → 400', async () => {
  const res = await callPdf('merge', { files: [new File([], 'e.pdf', { type: 'application/pdf' }), pdfFile(B)] });
  assert.equal(res.status, 400);
});
await check('merge non-pdf only → 400', async () => {
  const res = await callPdf('merge', { files: [txtFile('x.pdf')] });
  assert.equal(res.status, 400);
});
await check('merge >20 files → 400', async () => {
  const files = Array.from({ length: 21 }, (_, i) => pdfFile(B, `f${i}.pdf`));
  const res = await callPdf('merge', { files });
  assert.equal(res.status, 400);
});
await check('merge string entry → 400', async () => {
  const form = new FormData();
  form.append('files', 'not-a-file');
  form.append('files', pdfFile(B));
  const { POST } = await import('../src/app/api/pdf/merge/route.ts');
  const res = await POST(new NextRequest('http://localhost/api/pdf/merge', { method: 'POST', body: form }));
  assert.equal(res.status, 400);
});

await check('split single happy', async () => {
  const res = await callPdf('split', { file: pdfFile(A), mode: 'single', singlePage: '2' });
  const bytes = await expectPdfBytes(res, 'split-single');
  assert.equal((await PDFDocument.load(bytes)).getPageCount(), 1);
});
await check('split range happy', async () => {
  const res = await callPdf('split', { file: pdfFile(C), mode: 'range', pageRange: '1-2' });
  const bytes = await expectPdfBytes(res, 'split-range');
  assert.equal((await PDFDocument.load(bytes)).getPageCount(), 2);
});
await check('split all → zip', async () => {
  const res = await callPdf('split', { file: pdfFile(A), mode: 'all' });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('Content-Type') || '', /zip/);
  assert.equal(res.headers.get('X-Truncated'), 'false');
});
await check('split bad mode → 400', async () => {
  const res = await callPdf('split', { file: pdfFile(A), mode: 'evil' });
  assert.equal(res.status, 400);
});
await check('split page 999 → 400', async () => {
  const res = await callPdf('split', { file: pdfFile(A), mode: 'single', singlePage: '999' });
  assert.equal(res.status, 400);
});

await check('rotate 90 happy', async () => {
  const res = await callPdf('rotate', { file: pdfFile(A), angle: '90', pages: 'all' });
  assert.equal(res.headers.get('X-Rotation-Angle'), '90');
  await expectPdfBytes(res, 'rotate');
});
await check('rotate default angle → 90', async () => {
  const res = await callPdf('rotate', { file: pdfFile(A) });
  assert.equal(res.headers.get('X-Rotation-Angle'), '90');
  await expectPdfBytes(res, 'rotate-default');
});
await check('rotate 45 → 400', async () => {
  const res = await callPdf('rotate', { file: pdfFile(A), angle: '45' });
  assert.equal(res.status, 400);
});

await check('watermark happy + unicode kept', async () => {
  const res = await callPdf('watermark', { file: pdfFile(A), text: 'Café draft', fontSize: '48', position: 'center', rotation: '45', opacity: '0.3', color: '#808080' });
  const bytes = await expectPdfBytes(res, 'watermark');
  const { extractPdfLines } = await import('../src/lib/pdf-text.ts');
  assert.match((await extractPdfLines(bytes)).join(' '), /Café draft/);
});
await check('watermark fontSize 1000 → clamped 200', async () => {
  const res = await callPdf('watermark', { file: pdfFile(A), text: 'BIG', fontSize: '1000' });
  await expectPdfBytes(res, 'watermark-clamp');
});

await check('add-page-numbers happy', async () => {
  const res = await callPdf('add-page-numbers', { file: pdfFile(A), position: 'bottom-center', format: 'Page {n} of {total}', margin: '30', fontSize: '12' });
  const bytes = await expectPdfBytes(res, 'add-page-numbers');
  const { extractPdfLines } = await import('../src/lib/pdf-text.ts');
  assert.match((await extractPdfLines(bytes)).join(' '), /Page 1 of 2/);
});
await check('add-page-numbers 101-char format → 400', async () => {
  const res = await callPdf('add-page-numbers', { file: pdfFile(A), format: 'x'.repeat(101) });
  assert.equal(res.status, 400);
});
await check('add-page-numbers bad position → default', async () => {
  const res = await callPdf('add-page-numbers', { file: pdfFile(A), position: 'middle-earth' });
  await expectPdfBytes(res, 'add-page-numbers-pos');
});

await check('delete-pages happy (1 of 3)', async () => {
  const res = await callPdf('delete-pages', { file: pdfFile(C), pages: '2' });
  assert.equal(res.headers.get('X-RemainingPageCount'), '2');
  await expectPdfBytes(res, 'delete-pages');
});
await check('delete-pages all → 400', async () => {
  const res = await callPdf('delete-pages', { file: pdfFile(A), pages: '1-2' });
  assert.equal(res.status, 400);
});
await check('delete-pages empty → 400', async () => {
  const res = await callPdf('delete-pages', { file: pdfFile(A), pages: '' });
  assert.equal(res.status, 400);
});
await check('delete-pages overlong selection → 413', async () => {
  const res = await callPdf('delete-pages', { file: pdfFile(C), pages: '1,'.repeat(1500) });
  assert.equal(res.status, 413);
});
await check('sanitize bad action → 400', async () => {
  const res = await callPdf('sanitize', { file: pdfFile(A), action: 'explode' });
  assert.equal(res.status, 400);
});
await check('redact no boxes → 400 (not silent default)', async () => {
  const res = await callPdf('redact', { file: pdfFile(A) });
  assert.equal(res.status, 400);
});
await check('sign malformed dataURL → 400 (not 500)', async () => {
  const res = await callPdf('sign', { file: pdfFile(A), signature: 'data:image/png;base64', page: '1', x: '100', y: '100', width: '100', height: '50' });
  assert.equal(res.status, 400);
});
await check('extract x-total-pages reports source', async () => {
  const res = await callPdf('extract', { file: pdfFile(C), pages: '1-2' });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('x-total-pages'), '3');
  assert.equal(res.headers.get('x-page-count'), '2');
});

await check('reorder [2,1] happy', async () => {
  const res = await callPdf('reorder', { file: pdfFile(A), order: JSON.stringify([2, 1]) });
  assert.equal(res.headers.get('X-NewOrder'), '2,1');
  await expectPdfBytes(res, 'reorder');
});
await check('reorder bad JSON → 400', async () => {
  const res = await callPdf('reorder', { file: pdfFile(A), order: '{bad' });
  assert.equal(res.status, 400);
});
await check('reorder wrong length → 400', async () => {
  const res = await callPdf('reorder', { file: pdfFile(A), order: JSON.stringify([1]) });
  assert.equal(res.status, 400);
});
await check('reorder non-permutation → 400', async () => {
  const res = await callPdf('reorder', { file: pdfFile(A), order: JSON.stringify([1, 1]) });
  assert.equal(res.status, 400);
});

await check('linearize happy (GS fallback)', async () => {
  const res = await callPdf('linearize', { file: pdfFile(A) });
  await expectPdfBytes(res, 'linearize');
});
await check('linearize reports real engine', async () => {
  const res = await callPdf('linearize', { file: pdfFile(A) });
  assert.ok(['qpdf', 'ghostscript'].includes(res.headers.get('X-Linearize-Engine')));
});

await check('protect short password → 400', async () => {
  const res = await callPdf('protect', { file: pdfFile(A), action: 'protect', password: 'abc' });
  assert.equal(res.status, 400);
});
await check('protect dash password → 400', async () => {
  const res = await callPdf('protect', { file: pdfFile(A), action: 'protect', password: '-evil' });
  assert.equal(res.status, 400);
});
await check('protect bad action → 400', async () => {
  const res = await callPdf('protect', { file: pdfFile(A), action: 'explode', password: 'test1234' });
  assert.equal(res.status, 400);
});
let protectedBytes = null;
await check('protect happy → unlock roundtrip', async () => {
  const enc = await callPdf('protect', { file: pdfFile(A), action: 'protect', password: 'test1234' });
  assert.equal(enc.status, 200, `protect: got ${enc.status}: ${(await enc.clone().text()).slice(0, 200)}`);
  protectedBytes = Buffer.from(await enc.arrayBuffer());
  assert.ok(protectedBytes.length > 500, 'protect: suspiciously small output');
  const doc = await PDFDocument.load(protectedBytes, { ignoreEncryption: true });
  assert.equal(doc.isEncrypted, true);
  const dec = await callPdf('protect', { file: new File([protectedBytes], 'p.pdf', { type: 'application/pdf' }), action: 'unlock', password: 'test1234' });
  const out = await expectPdfBytes(dec, 'unlock');
  assert.equal((await PDFDocument.load(out)).getPageCount(), 2);
  return 'encrypt flag verified';
});
await check('unlock wrong password → 401', async () => {
  assert.ok(protectedBytes, 'needs protected fixture');
  const res = await callPdf('protect', { file: new File([protectedBytes], 'p.pdf', { type: 'application/pdf' }), action: 'unlock', password: 'wrong-pass-9' });
  assert.equal(res.status, 401, `expected 401 got ${res.status}: ${(await res.clone().text()).slice(0, 160)}`);
});

await check('to-image jpg happy → zip x2', async () => {
  const res = await callPdf('to-image', { file: pdfFile(A), format: 'jpg', dpi: '72', pages: 'all', quality: '70' });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('Content-Type') || '', /zip/);
  assert.equal(res.headers.get('X-Converted-Pages'), '2');
  const zip = await JSZip.loadAsync(await res.arrayBuffer());
  assert.equal(Object.values(zip.files).filter((f) => !f.dir).length, 2);
});
await check('to-image bad format → jpg default', async () => {
  const res = await callPdf('to-image', { file: pdfFile(B), format: 'bmp', dpi: '72' });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('X-Format'), 'jpg');
});

await check('from-image png happy', async () => {
  const form = new FormData();
  form.append('files', new File([PNG], 'a.png', { type: 'image/png' }));
  form.append('pageSize', 'a4');
  form.append('orientation', 'portrait');
  form.append('fitMode', 'contain');
  const { POST } = await import('../src/app/api/pdf/from-image/route.ts');
  const res = await POST(new NextRequest('http://localhost/api/pdf/from-image', { method: 'POST', body: form }));
  assert.equal(res.headers.get('X-Page-Count'), '1');
  await expectPdfBytes(res, 'from-image');
});
await check('from-image bad pageSize → 400', async () => {
  const form = new FormData();
  form.append('files', new File([PNG], 'a.png', { type: 'image/png' }));
  form.append('pageSize', 'pizza');
  const { POST } = await import('../src/app/api/pdf/from-image/route.ts');
  const res = await POST(new NextRequest('http://localhost/api/pdf/from-image', { method: 'POST', body: form }));
  assert.equal(res.status, 400);
});
await check('from-image corrupt png → 400 (not 500)', async () => {
  const form = new FormData();
  form.append('files', new File(['not-an-image-at-all'], 'a.png', { type: 'image/png' }));
  const { POST } = await import('../src/app/api/pdf/from-image/route.ts');
  const res = await POST(new NextRequest('http://localhost/api/pdf/from-image', { method: 'POST', body: form }));
  assert.equal(res.status, 400, `got ${res.status}`);
});

await check('from-heic jpg named png → 400', async () => {
  const res = await callPdf('from-heic', { file: new File([JPG], 'a.png', { type: 'image/png' }) });
  assert.equal(res.status, 400);
});
await check('from-heic empty file → 400', async () => {
  const res = await callPdf('from-heic', { file: new File([], 'a.heic', { type: 'image/heic' }) });
  assert.equal(res.status, 400);
});

// ---------- image routes ----------
async function callImage(tool, fields = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value instanceof File) form.append(key, value);
    else form.append(key, String(value));
  }
  const { POST } = await import(`../src/app/api/image/${tool}/route.ts`);
  return POST(new NextRequest(`http://localhost/api/image/${tool}`, { method: 'POST', body: form }));
}
await check('image/process png→jpg happy', async () => {
  const res = await callImage('process', { image: new File([PNG], 'a.png', { type: 'image/png' }), format: 'jpg', quality: '80' });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.match(json.imageUrl, /^data:image\/jpeg;base64,/);
  return `${json.processedSize}b`;
});
await check('image/process file-alias happy', async () => {
  const res = await callImage('process', { file: new File([PNG], 'a.png', { type: 'image/png' }), format: 'webp' });
  assert.equal(res.status, 200);
  assert.match((await res.json()).imageUrl, /^data:image\/webp;base64,/);
});
await check('image/process txt → 400', async () => {
  const res = await callImage('process', { image: txtFile() });
  assert.equal(res.status, 400);
});
await check('image/process empty → 400', async () => {
  const res = await callImage('process', { image: new File([], 'a.png', { type: 'image/png' }) });
  assert.equal(res.status, 400);
});
await check('image/heic jpg → 400 not-HEIC', async () => {
  const res = await callImage('heic', { file: new File([JPG], 'a.jpg', { type: 'image/jpeg' }) });
  assert.equal(res.status, 400);
});
await check('image/heic missing → 400', async () => {
  const res = await callImage('heic', {});
  assert.equal(res.status, 400);
});
await check('image/ocr png happy (client mode)', async () => {
  const res = await callImage('ocr', { image: new File([PNG], 'a.png', { type: 'image/png' }) });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.match(json.imageUrl, /^data:image\/png;base64,/);
});
await check('image/ocr txt → 400', async () => {
  const res = await callImage('ocr', { image: txtFile() });
  assert.equal(res.status, 400);
});

// ---------- ai route ----------
async function callAi(fields = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value instanceof File) form.append(key, value);
    else form.append(key, String(value));
  }
  const { POST } = await import('../src/app/api/ai/route.ts');
  return POST(new NextRequest('http://localhost/api/ai', { method: 'POST', body: form }));
}
await check('ai no file → 400', async () => {
  const res = await callAi({ tool: 'remove-background' });
  assert.equal(res.status, 400);
});
await check('ai txt → 400', async () => {
  const res = await callAi({ image: txtFile(), tool: 'remove-background' });
  assert.equal(res.status, 400);
});
await check('ai remove-background happy', async () => {
  const res = await callAi({ image: new File([PNG], 'a.png', { type: 'image/png' }), tool: 'remove-background' });
  assert.equal(res.status, 200, `got ${res.status}: ${(await res.clone().text()).slice(0, 200)}`);
  const json = await res.json();
  assert.match(json.imageUrl, /^data:image\/png;base64,/);
  return `engine=${json.engine}`;
});
for (const tool of ['enhance-image', 'beautify', 'retouch', 'upscale']) {
  await check(`ai ${tool} happy`, async () => {
    const res = await callAi({ image: new File([PNG], 'a.png', { type: 'image/png' }), tool });
    assert.equal(res.status, 200, `got ${res.status}: ${(await res.clone().text()).slice(0, 200)}`);
    assert.match((await res.json()).imageUrl, /^data:image\/png;base64,/);
  });
}
await check('ai blur-face synthetic (200|422)', async () => {
  const res = await callAi({ image: new File([PNG], 'a.png', { type: 'image/png' }), tool: 'blur-face' });
  assert.ok(res.status === 200 || res.status === 422, `unexpected ${res.status}`);
  return `status=${res.status}`;
});

// ---------- office, text, legal, business & remaining PDF routes ----------
async function buildDocxFixture() {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Factura \u201C2026\u201D \u2014 €250 \u2192 Pagado</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Servicio Mensual</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>\u2022 €125.00</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>');
  return zip.generateAsync({ type: 'nodebuffer' });
}
async function buildXlsxFixture() {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  zip.file('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>');
  zip.file('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>');
  zip.file('xl/sharedStrings.xml', '<?xml version="1.0" encoding="UTF-8"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="2" uniqueCount="2"><si><t>Product</t></si><si><t>Revenue Q4 €500</t></si></sst>');
  zip.file('xl/worksheets/sheet1.xml', '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>PdfPixels Pro \u2014 Extended Suite</t></is></c><c r="B2"><v>500</v></c></row></sheetData></worksheet>');
  return zip.generateAsync({ type: 'nodebuffer' });
}
async function buildPptxFixture() {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/><Override PartName="/ppt/slides/slide2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/></Types>');
  zip.file('ppt/slides/slide1.xml', '<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>Overview Slide \u2014 2026</a:t></a:r></a:p><a:p><a:r><a:t>Key metric €1.2M ARR</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>');
  zip.file('ppt/slides/slide2.xml', '<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>Slide Two</a:t></a:r></a:p><a:p><a:r><a:t>Zero cloud lock-in</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>');
  return zip.generateAsync({ type: 'nodebuffer' });
}

await check('from-word docx happy (quotes/euro/table)', async () => {
  const docx = await buildDocxFixture();
  const res = await callPdf('from-word', {
    file: new File([docx], 'factura.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
  });
  const bytes = await expectPdfBytes(res, 'from-word');
  const { extractPdfLines } = await import('../src/lib/pdf-text.ts');
  const txt = (await extractPdfLines(bytes)).join(' ');
  assert.match(txt, /Factura/);
  assert.doesNotMatch(txt, /\?250/, 'WinAnsi corrupted Euro sign into ?');
  return `engine=${res.headers.get('x-convert-engine')}`;
});

await check('from-excel long CSV row (no WinAnsi ellipsis crash)', async () => {
  const csv = 'Item,Notes,Amount\nWidget,"A very long product description exceeding single column width for quarterly revenue reporting in EMEA €999",999.00\n';
  const res = await callPdf('from-excel', { file: new File([csv], 'report.csv', { type: 'text/csv' }) });
  await expectPdfBytes(res, 'from-excel csv');
});

await check('from-excel xlsx happy (LO or JS fallback)', async () => {
  const xlsx = await buildXlsxFixture();
  const res = await callPdf('from-excel', {
    file: new File([xlsx], 'budget.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
  });
  await expectPdfBytes(res, 'from-excel xlsx');
  return `engine=${res.headers.get('x-convert-engine')}`;
});

await check('from-powerpoint pptx happy (LO or JS fallback)', async () => {
  const pptx = await buildPptxFixture();
  const res = await callPdf('from-powerpoint', {
    file: new File([pptx], 'deck.pptx', { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }),
  });
  const bytes = await expectPdfBytes(res, 'from-powerpoint pptx');
  assert.ok((await PDFDocument.load(bytes)).getPageCount() >= 2);
  return `engine=${res.headers.get('x-convert-engine')}`;
});

await check('to-word pdf → docx happy', async () => {
  const res = await callPdf('to-word', { file: pdfFile(A) });
  assert.equal(res.status, 200, `to-word got ${res.status}`);
  const zip = await JSZip.loadAsync(await res.arrayBuffer());
  assert.ok(zip.file('word/document.xml'), 'missing word/document.xml');
});

await check('to-excel xlsx + csv happy', async () => {
  const rx = await callPdf('to-excel', { file: pdfFile(C), format: 'xlsx' });
  assert.equal(rx.status, 200, `to-excel xlsx got ${rx.status}`);
  const zip = await JSZip.loadAsync(await rx.arrayBuffer());
  assert.ok(zip.file('xl/worksheets/sheet1.xml'));
  const rc = await callPdf('to-excel', { file: pdfFile(C), format: 'csv' });
  assert.equal(rc.status, 200, `to-excel csv got ${rc.status}`);
  assert.match(await rc.text(), /Gamma/);
});

await check('from-text → to-text roundtrip', async () => {
  const res = await callPdf('from-text', { text: 'Contrato mercantil PdfPixels 2026\nSegunda linea clara.', pageSize: 'a4' });
  const bytes = await expectPdfBytes(res, 'from-text');
  const txtRes = await callPdf('to-text', { file: new File([bytes], 'out.pdf', { type: 'application/pdf' }), format: 'txt' });
  assert.equal(txtRes.status, 200);
  assert.match(await txtRes.text(), /Contrato mercantil/);
});

await check('bates-numbering happy', async () => {
  const res = await callPdf('bates-numbering', { file: pdfFile(A), prefix: 'ABC-', startNumber: '1', padding: '5' });
  const bytes = await expectPdfBytes(res, 'bates-numbering');
  const { extractPdfLines } = await import('../src/lib/pdf-text.ts');
  assert.match((await extractPdfLines(bytes)).join(' '), /ABC-00001/);
});

await check('crop-shipping-label usps happy', async () => {
  const res = await callPdf('crop-shipping-label', { file: pdfFile(A), preset: 'usps', printer: 'rollo-4x6' });
  await expectPdfBytes(res, 'crop-shipping-label');
});

await check('bank-statement-to-excel quickbooks csv + json', async () => {
  const stmt = await pdfFixture([
    '01/15/2026 AMAZON MARKETPLACE -45.00 955.00',
    '01/16/2026 PAYROLL DEPOSIT 2000.00 2955.00',
  ], 1);
  const res = await callPdf('bank-statement-to-excel', { file: pdfFile(stmt, 'statement.pdf'), format: 'quickbooks-3col' });
  assert.equal(res.status, 200, `bank-statement got ${res.status}: ${(await res.clone().text()).slice(0, 200)}`);
  assert.match(await res.text(), /Date,Description,Amount/);
});

await check('compare two pdfs happy', async () => {
  const res = await callPdf('compare', { fileA: pdfFile(A), fileB: pdfFile(C) });
  assert.equal(res.status, 200, `compare got ${res.status}`);
  const json = await res.json();
  assert.ok(Array.isArray(json.diff) && json.diff.length > 0);
});

await check('compress recommended happy', async () => {
  const res = await callPdf('compress', { file: pdfFile(A), level: 'recommended' });
  await expectPdfBytes(res, 'compress');
});

await check('fill textEntries happy', async () => {
  const res = await callPdf('fill', {
    file: pdfFile(A),
    textEntries: JSON.stringify([{ pageNumber: 1, x: 50, y: 500, text: 'Signed Online', fontSize: 12 }]),
  });
  await expectPdfBytes(res, 'fill');
});

await check('flatten + metadata + n-up + repair + resize + sanitize + crop happy', async () => {
  await expectPdfBytes(await callPdf('flatten', { file: pdfFile(A) }), 'flatten');
  const metaBytes = await expectPdfBytes(await callPdf('metadata', { file: pdfFile(A), title: 'Audit 2026', author: 'PdfPixels' }), 'metadata');
  assert.equal((await PDFDocument.load(metaBytes)).getTitle(), 'Audit 2026');
  const nupBytes = await expectPdfBytes(await callPdf('n-up', { file: pdfFile(C), layout: '2', sheet: 'a4' }), 'n-up');
  assert.equal((await PDFDocument.load(nupBytes)).getPageCount(), 2);
  await expectPdfBytes(await callPdf('repair', { file: pdfFile(A) }), 'repair');
  await expectPdfBytes(await callPdf('resize', { file: pdfFile(A), sheet: 'letter' }), 'resize');
  await expectPdfBytes(await callPdf('sanitize', { file: pdfFile(A), action: 'sanitize' }), 'sanitize');
  await expectPdfBytes(await callPdf('crop', { file: pdfFile(A), top: '10', bottom: '10', left: '10', right: '10' }), 'crop');
});

await check('extract-images happy on embedded PNG PDF', async () => {
  const doc = await PDFDocument.create();
  const pg = doc.addPage([400, 400]);
  const img = await doc.embedPng(PNG);
  pg.drawImage(img, { x: 50, y: 100, width: 200, height: 120 });
  const pdfWithImg = Buffer.from(await doc.save());
  const res = await callPdf('extract-images', { file: pdfFile(pdfWithImg, 'with-img.pdf') });
  assert.equal(res.status, 200, `extract-images got ${res.status}`);
  const zip = await JSZip.loadAsync(await res.arrayBuffer());
  assert.ok(Object.values(zip.files).filter((f) => !f.dir).length >= 1);
});

// ---------- contact / newsletter (validation only; happy path needs DB+SMTP env) ----------
async function callJson(api, body) {
  const { POST } = await import(`../src/app/api/${api}/route.ts`);
  return POST(new NextRequest(`http://localhost/api/${api}`, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }));
}
await check('contact empty body → 400', async () => {
  assert.equal((await callJson('contact', {})).status, 400);
});
await check('contact bad email → 400', async () => {
  const res = await callJson('contact', { name: 'Jo', email: 'nope', subject: 'Hi', message: '0123456789' });
  assert.equal(res.status, 400);
});
await check('contact short message → 400', async () => {
  const res = await callJson('contact', { name: 'Jo', email: 'a@b.co', subject: 'Hi', message: 'short' });
  assert.equal(res.status, 400);
});
await check('newsletter bad email → 400', async () => {
  assert.equal((await callJson('newsletter', { email: 'nope' })).status, 400);
});
await check('newsletter missing → 400', async () => {
  assert.equal((await callJson('newsletter', {})).status, 400);
});

const failed = results.filter((r) => !r.ok);
console.log(`\nAPI smoke suite: ${results.length - failed.length}/${results.length} passed.`);
if (failed.length) {
  console.log('Failures:');
  failed.forEach((f) => console.log(` - ${f.name}: ${f.detail}`));
  process.exit(1);
}
