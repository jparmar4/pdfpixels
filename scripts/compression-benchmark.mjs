// Real compression benchmark: runs the actual sharp engine (the same image
// pipeline family used in production) over real images shipped with the site.
// Output: tmp/benchmark-results.json → rendered into /research/compression-benchmark-2026.
import sharp from 'sharp';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imgDir = path.join(root, 'public', 'images', 'blog');

const QUALITIES = [95, 90, 85, 80, 70, 60, 50];

async function run() {
  const files = readdirSync(imgDir).filter((f) => /\.(jpe?g|png)$/i.test(f)).slice(0, 40);
  console.log(`Benchmarking ${files.length} real images (${QUALITIES.length} JPEG qualities + WebP)...`);

  const perImage = [];
  const agg = {}; // quality -> {totalOriginal, totalCompressed, count}
  const webpAgg = {};
  for (const f of files) {
    const input = readFileSync(path.join(imgDir, f));
    const meta = await sharp(input).metadata();
    // Normalize every source to JPEG q95 as the "master" so savings are comparable
    const master = await sharp(input).jpeg({ quality: 95, mozjpeg: true }).toBuffer();
    const masterSize = master.length;
    const row = { file: f, width: meta.width, height: meta.height, master: masterSize, results: {} };
    for (const q of QUALITIES) {
      const out = await sharp(master).jpeg({ quality: q, mozjpeg: true }).toBuffer();
      const size = out.length;
      row.results[`jpeg${q}`] = size;
      agg[q] = agg[q] || { total: 0, count: 0 };
      agg[q].total += size;
      agg[q].count++;
    }
    for (const q of [85, 75, 65]) {
      const out = await sharp(master).webp({ quality: q }).toBuffer();
      const size = out.length;
      row.results[`webp${q}`] = size;
      webpAgg[q] = webpAgg[q] || { total: 0, count: 0 };
      webpAgg[q].total += size;
      webpAgg[q].count++;
    }
    row.savings = {};
    for (const q of QUALITIES) {
      row.savings[`jpeg${q}`] = Math.round((1 - row.results[`jpeg${q}`] / masterSize) * 100);
    }
    perImage.push(row);
  }

  // Quality proxy: measure visible degradation as average absolute pixel delta
  // between master and q70/q60/q50 for a representative image (real signal, disclosed method).
  const sample = perImage[0];
  const masterBuf = await sharp(readFileSync(path.join(imgDir, sample.file)))
    .resize(1280)
    .jpeg({ quality: 95, mozjpeg: true })
    .toBuffer();
  const deltas = {};
  for (const q of [90, 80, 70, 60, 50]) {
    const comp = await sharp(masterBuf).jpeg({ quality: q, mozjpeg: true }).toBuffer();
    const a = await sharp(masterBuf).raw().toBuffer();
    const b = await sharp(comp).raw().toBuffer();
    // both decoded at same dims (jpeg re-encode keeps dims)
    const n = Math.min(a.length, b.length);
    let sum = 0;
    const stride = Math.max(1, Math.floor(n / (4 * 400000))); // sample ~400k pixels
    let samples = 0;
    for (let i = 0; i < n; i += 4 * stride) {
      const dr = Math.abs(a[i] - b[i]);
      const dg = Math.abs(a[i + 1] - b[i + 1]);
      const db = Math.abs(a[i + 2] - b[i + 2]);
      sum += (dr + dg + db) / 3;
      samples++;
    }
    deltas[q] = Math.round((sum / samples) * 10) / 10;
  }

  const results = {
    imageCount: files.length,
    qualities: QUALITIES,
    aggregate: Object.fromEntries(QUALITIES.map((q) => [q, Math.round(agg[q].total / agg[q].count)])),
    webp: Object.fromEntries([85, 75, 65].map((q) => [q, Math.round(webpAgg[q].total / webpAgg[q].count)])),
    avgDelta: deltas,
    perImage: perImage.map((r) => ({ file: r.file, master: r.master, ...r.results })),
    generatedAt: new Date().toISOString(),
  };
  writeFileSync(path.join(root, 'tmp', 'benchmark-results.json'), JSON.stringify(results, null, 2));
  console.log('Aggregate avg bytes per quality:');
  for (const q of QUALITIES) console.log(`  jpeg ${q}: ${Math.round(agg[q].total / agg[q].count).toLocaleString()}`);
  for (const q of [85, 75, 65]) console.log(`  webp ${q}: ${Math.round(webpAgg[q].total / webpAgg[q].count).toLocaleString()}`);
  console.log('Avg pixel delta (quality proxy):', deltas);
}

run().catch((e) => { console.error(e); process.exit(1); });
