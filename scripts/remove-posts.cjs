// One-off helper: remove blog post objects by slug from src/config/blog.ts
const fs = require('fs');
const slugs = process.argv.slice(2);
if (!slugs.length) { console.error('usage: node remove-posts.cjs slug1 slug2 ...'); process.exit(1); }

let src = fs.readFileSync('src/config/blog.ts', 'utf8');
for (const slug of slugs) {
  const startRe = new RegExp(`    \\{\\r?\\n        slug: "${slug}",`);
  const m = startRe.exec(src);
  if (!m) { console.error(`NOT FOUND: ${slug}`); process.exit(1); }
  const start = m.index;
  const after = src.slice(start);
  const endMatch = /\r?\n    \},\r?\n/.exec(after);
  if (!endMatch) { console.error(`END NOT FOUND: ${slug}`); process.exit(1); }
  const blockLen = endMatch.index + endMatch[0].length;
  src = src.slice(0, start) + src.slice(start + blockLen);
  console.log(`removed: ${slug} (${blockLen} bytes)`);
}
fs.writeFileSync('src/config/blog.ts', src);
