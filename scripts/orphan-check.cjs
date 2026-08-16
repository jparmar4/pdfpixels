// Audit internal link graph from built HTML: which routes have zero inbound internal links
const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '..', '.next', 'server', 'app');
const links = new Map(); // target -> Set of source pages

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const files = walk(appDir, []);
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const page = '/' + path.relative(appDir, f).replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\\/g, '/');
  const hrefs = [...src.matchAll(/href="(\/[^"#?]*)/g)].map((m) => m[1].replace(/\/$/, '') || '/');
  for (const href of hrefs) {
    if (href.startsWith('/api/') || href.startsWith('/_next/')) continue;
    if (href === page) continue;
    if (!links.has(href)) links.set(href, new Set());
    links.get(href).add(page);
  }
}

// List every found page route with zero inbound links
const routes = files.map((f) =>
  '/' + path.relative(appDir, f).replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\\/g, '/')
);
const orphans = routes.filter((r) => !links.has(r));
console.log(`pages: ${routes.length}, distinct link targets: ${links.size}`);
console.log('\n== pages with ZERO inbound internal links ==');
orphans.forEach((r) => console.log(' ', r));
