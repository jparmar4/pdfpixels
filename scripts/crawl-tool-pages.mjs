// Pre-push page check: crawl every /tools/[slug] (+ core pages) on a running
// production server and assert HTTP 200, exactly one <h1>, canonical link,
// and tool JSON-LD. Usage: BASE=http://localhost:3100 node scripts/crawl-tool-pages.mjs
const BASE = process.env.BASE || 'http://localhost:3100';

async function get(path) {
  const res = await fetch(BASE + path, { redirect: 'manual' });
  const text = res.status === 200 ? await res.text() : '';
  return { status: res.status, text, headers: res.headers };
}

const failures = [];
let checked = 0;
function record(path, problems) {
  checked += 1;
  if (problems.length) {
    failures.push({ path, problems });
    console.log(`  FAIL ${path}: ${problems.join('; ')}`);
  }
}

console.log('Fetching sitemap...');
const sitemap = await (await fetch(BASE + '/sitemap.xml')).text();
const toolPaths = [...sitemap.matchAll(/<loc>(https?:\/\/[^<]*?(\/tools\/[a-z0-9-]+))<\/loc>/g)].map((m) => m[2]);
console.log(`Found ${toolPaths.length} tool URLs in sitemap.`);

for (const path of toolPaths) {
  const { status, text } = await get(path);
  const problems = [];
  if (status !== 200) problems.push(`status=${status}`);
  else {
    const h1s = (text.match(/<h1[\s>]/g) || []).length;
    if (h1s !== 1) problems.push(`h1count=${h1s}`);
    if (!/<link rel="canonical"/.test(text)) problems.push('no-canonical');
    if (!/application\/ld\+json/.test(text)) problems.push('no-jsonld');
    if (!/tool-hero-title/.test(text)) problems.push('no-hero-title');
  }
  record(path, problems);
}

const corePages = ['/', '/tools', '/blog', '/compare', '/use-cases', '/pricing', '/api-docs', '/contact', '/about', '/privacy', '/terms', '/tools/category/pdf-tools', '/sitemap.xml', '/robots.txt', '/feed'];
for (const path of corePages) {
  const { status, text } = await get(path);
  const problems = [];
  if (status !== 200) problems.push(`status=${status}`);
  else if (path.endsWith('.xml') || path === '/robots.txt' || path === '/feed') {
    if (text.length < 100) problems.push('body-too-small');
  } else if (!/<h1[\s>]/.test(text)) problems.push('no-h1');
  if (path === '/tools' && status === 200) {
    const cardLinks = new Set([...text.matchAll(/href="(\/tools\/[a-z0-9-]+)"/g)].map((m) => m[1]));
    if (cardLinks.size < toolPaths.length) problems.push(`tool-cards=${cardLinks.size}/${toolPaths.length}`);
  }
  record(path, problems);
}

// One sample each of blog / compare / use-case detail pages.
for (const index of ['/blog', '/compare', '/use-cases']) {
  const { text } = await get(index);
  const m = text.match(new RegExp(`href="(${index}/[a-z0-9-]+)"`));
  if (!m) {
    record(index + ' (sample child)', ['no-child-link-found']);
    continue;
  }
  const { status, text: child } = await get(m[1]);
  const problems = [];
  if (status !== 200) problems.push(`status=${status}`);
  else if (!/<h1[\s>]/.test(child)) problems.push('no-h1');
  record(m[1], problems);
}

console.log(`\nPage crawl: ${checked - failures.length}/${checked} passed.`);
if (failures.length) process.exit(1);
