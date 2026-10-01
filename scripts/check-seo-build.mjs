// Validate rendered search signals after `next build`, without a running server.
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = path.join(root, '.next/server/app');
const sitemapPath = path.join(app, 'sitemap.xml.body');
assert.ok(existsSync(sitemapPath), 'Run a production build before checking SEO.');
const xml = readFileSync(sitemapPath, 'utf8');
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.ok(urls.length > 100, 'Sitemap is unexpectedly empty or incomplete.');
assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URLs');

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
}

function readSignals(file) {
  const html = readFileSync(file, 'utf8');
  const links = [...html.matchAll(/<link\b[^>]*>/g)].map((m) => attributes(m[0]));
  const metas = [...html.matchAll(/<meta\b[^>]*>/g)].map((m) => attributes(m[0]));
  return {
    canonical: links.find((link) => link.rel === 'canonical')?.href,
    noindex: metas.some((meta) => /^(robots|googlebot)$/i.test(meta.name ?? '') && /\bnoindex\b/i.test(meta.content ?? '')),
    languages: links.filter((link) => link.rel === 'alternate' && link.hreflang),
  };
}

const pages = new Map();
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name.endsWith('.html')) {
      const route = '/' + path.relative(app, file).replaceAll('\\', '/').replace(/\.html$/, '').replace(/^index$/, '');
      pages.set(route, readSignals(file));
    }
  }
}
walk(app);

for (const url of urls) {
  const route = new URL(url).pathname;
  const page = pages.get(route);
  assert.ok(page, `Sitemap URL has no rendered page: ${url}`);
  assert.ok(!page.noindex, `Noindexed URL in sitemap: ${url}`);
  assert.equal(page.canonical, url, `Sitemap URL must be self-canonical: ${url}`);
}

let alternates = 0;
for (const [route, page] of pages) {
  for (const link of page.languages) {
    const target = pages.get(new URL(link.href).pathname);
    assert.ok(target, `${route}: missing hreflang target ${link.href}`);
    assert.ok(!target.noindex, `${route}: noindexed hreflang target ${link.href}`);
    assert.equal(target.canonical, link.href, `${route}: noncanonical hreflang target`);
    assert.ok(target.languages.some((back) => back.href === page.canonical), `${route}: missing reciprocal hreflang from ${link.href}`);
    alternates++;
  }
}

// During the review freeze, translated pages still need their own metadata.
const english = pages.get('/tools/compress-pdf');
const german = pages.get('/de/tools/compress-pdf');
assert.ok(english && german, 'Expected English and translated compressor pages');
assert.equal(german.canonical, 'https://www.pdfpixels.com/de/tools/compress-pdf');
if (german.noindex) {
  assert.equal(english.languages.length, 0, 'Review mode must omit translated hreflang');
  assert.equal(german.languages.length, 0, 'Review mode must omit translated hreflang');
  assert.equal(pages.get('/')?.languages.length, 0, 'Review mode must omit geo hreflang');
}
console.log(`SEO passed: ${urls.length} sitemap URLs, ${pages.size} rendered pages, ${alternates} hreflang links.`);
