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
