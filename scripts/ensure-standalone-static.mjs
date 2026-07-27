/**
 * Ensure Next.js standalone runtime has CSS/JS/media under:
 *   .next/standalone/.next/static
 *   .next/standalone/public/_next/static
 *
 * Hostinger/Nixpacks can miss these after a clean standalone export,
 * which produces a "text-only" site (HTML without Tailwind CSS).
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const srcStatic = path.join(root, '.next', 'static');
const standaloneDir = path.join(root, '.next', 'standalone');
const destStatic = path.join(standaloneDir, '.next', 'static');
const destPublicStatic = path.join(standaloneDir, 'public', '_next', 'static');
const destPublic = path.join(standaloneDir, 'public');
const srcPublic = path.join(root, 'public');

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function copyDir(src, dest) {
  if (!exists(src)) {
    console.warn(`[ensure-static] skip missing source: ${src}`);
    return false;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true, force: true });
  console.log(`[ensure-static] copied ${src} -> ${dest}`);
  return true;
}

function countCss(dir) {
  if (!exists(dir)) return 0;
  const chunks = path.join(dir, 'chunks');
  if (!exists(chunks)) return 0;
  return fs.readdirSync(chunks).filter((f) => f.endsWith('.css')).length;
}

function totalBytes(dir) {
  if (!exists(dir)) return 0;
  let total = 0;
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else total += fs.statSync(p).size;
    }
  };
  walk(dir);
  return total;
}

if (!exists(standaloneDir)) {
  console.error('[ensure-static] FATAL: .next/standalone missing. Run npm run build first.');
  process.exit(1);
}

// Prefer fresh build output; fall back to whatever is already in standalone.
if (exists(srcStatic)) {
  copyDir(srcStatic, destStatic);
  copyDir(srcStatic, destPublicStatic);
} else if (!exists(destStatic)) {
  console.error('[ensure-static] FATAL: no .next/static source and standalone static missing.');
  process.exit(1);
} else {
  console.warn('[ensure-static] root .next/static missing; using existing standalone static.');
  copyDir(destStatic, destPublicStatic);
}

if (exists(srcPublic)) {
  // Merge public assets without wiping _next we just wrote
  for (const entry of fs.readdirSync(srcPublic, { withFileTypes: true })) {
    if (entry.name === '_next') continue;
    const from = path.join(srcPublic, entry.name);
    const to = path.join(destPublic, entry.name);
    fs.cpSync(from, to, { recursive: true, force: true });
  }
  console.log('[ensure-static] merged public/ into standalone/public');
}

const cssCount = countCss(destStatic);
const bytes = totalBytes(destStatic);
console.log(`[ensure-static] standalone static: ${cssCount} css file(s), ${(bytes / 1024).toFixed(1)} KB total`);

if (cssCount < 1 || bytes < 50_000) {
  console.error(
    '[ensure-static] FATAL: static assets look incomplete (need main Tailwind CSS ~100KB+).',
  );
  process.exit(1);
}

console.log('[ensure-static] OK');
