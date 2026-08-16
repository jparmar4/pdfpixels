// Pre-flight check: find broken internal links and image refs in built HTML
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const appDir = path.join(root, '.next', 'server', 'app');
const publicDir = path.join(root, 'public');

// Build the set of valid targets
function walk(dir, out, filter) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out, filter);
    else if (!filter || filter(e.name)) out.push(p);
  }
  return out;
}

const htmlFiles = walk(appDir, [], (n) => n.endsWith('.html'));
const pageRoutes = new Set(
  htmlFiles.map((f) =>
    '/' + path.relative(appDir, f).replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\\/g, '/')
  )
);

const routesManifest = require(path.join(root, '.next', 'routes-manifest.json'));
const redirectSources = new Set(routesManifest.redirects.map((r) => r.source));

const publicFiles = new Set(
  walk(publicDir, [], null).map((f) => '/' + path.relative(publicDir, f).replace(/\\/g, '/'))
);

const dynamicRoutes = [
  /^\/api\//,
  /^\/feed$/,
  /^\/tools\/[^/]+\/opengraph-image$/,
  /^\/opengraph-image/,
];

function existsInternal(href) {
  const clean = href.split('#')[0].split('?')[0].replace(/\/$/, '') || '/';
  if (pageRoutes.has(clean)) return true;
  if (redirectSources.has(clean)) return true;
  if (publicFiles.has(clean)) return true;
  if (publicFiles.has(clean.replace(/\/$/, ''))) return true;
  if (dynamicRoutes.some((re) => re.test(clean))) return true;
  // next/image optimizer
  if (clean.startsWith('/_next/image')) return true;
  return false;
}

const broken = new Map();
for (const f of htmlFiles) {
  const page = '/' + path.relative(appDir, f).replace(/\.html$/, '').replace(/\\/g, '/');
  const src = fs.readFileSync(f, 'utf8');
  const refs = [
    ...[...src.matchAll(/href="(\/[^"#?]*)/g)].map((m) => m[1]),
    ...[...src.matchAll(/src="(\/[^"?#]*)/g)].map((m) => m[1]),
  ];
  for (const ref of refs) {
    if (ref.startsWith('/_next/')) continue; // build assets live in .next/static, not public/
    if (!existsInternal(ref)) {
      if (!broken.has(ref)) broken.set(ref, new Set());
      broken.get(ref).add(page);
    }
  }
}

if (broken.size === 0) {
  console.log('✅ No broken internal links or asset refs found across', htmlFiles.length, 'pages');
} else {
  console.log(`❌ ${broken.size} broken internal refs:`);
  for (const [ref, pages] of [...broken.entries()].sort()) {
    console.log(`  ${ref}  (linked from ${pages.size} pages, e.g. ${[...pages][0]})`);
  }
}
