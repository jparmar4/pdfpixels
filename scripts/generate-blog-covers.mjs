// Generate branded 1280x720 blog hero covers (Google Discover requires >=1200px wide).
// Run: node scripts/generate-blog-covers.mjs
// Add a spec to COVERS and rerun after each content wave — regeneration is idempotent.
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'images', 'blog');

const W = 1280, H = 720;

/** Escape XML entities in copy. */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Manually wrap headline lines (librsvg has no auto-wrap). */
function wrap(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length > maxChars && line) {
      lines.push(line.trim());
      line = word;
    } else {
      line = (line + ' ' + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

const ICONS = {
  // 600x600 portrait crop motif
  resize: `
    <g transform="translate(905,150)">
      <rect x="0" y="0" width="220" height="220" rx="24" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.85)" stroke-width="6"/>
      <rect x="30" y="30" width="160" height="160" rx="16" fill="rgba(255,255,255,0.22)"/>
      <circle cx="110" cy="86" r="26" fill="rgba(255,255,255,0.9)"/>
      <path d="M52 190 L96 128 L134 168 L158 142 L190 190 Z" fill="rgba(255,255,255,0.9)"/>
      <text x="110" y="278" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="rgba(255,255,255,0.95)">600 × 600</text>
    </g>`,
  // fillable form motif
  form: `
    <g transform="translate(915,160)">
      <rect x="0" y="0" width="190" height="250" rx="20" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.85)" stroke-width="6"/>
      <rect x="34" y="46" width="34" height="34" rx="8" fill="none" stroke="rgba(255,255,255,0.95)" stroke-width="6"/>
      <path d="M40 63 L52 76 L72 48" stroke="rgba(255,255,255,0.95)" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="34" y="112" width="122" height="10" rx="5" fill="rgba(255,255,255,0.6)"/>
      <rect x="34" y="150" width="34" height="34" rx="8" fill="rgba(255,255,255,0.25)"/>
      <rect x="34" y="212" width="122" height="10" rx="5" fill="rgba(255,255,255,0.6)"/>
      <path d="M228 210 L150 132 L172 110 L250 188 Z" fill="rgba(255,255,255,0.28)" stroke="rgba(255,255,255,0.9)" stroke-width="5"/>
      <path d="M140 122 L150 132 L128 154 Z" fill="#ffffff"/>
    </g>`,
  // phone scan motif
  scan: `
    <g transform="translate(915,150)">
      <rect x="0" y="0" width="150" height="260" rx="26" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.85)" stroke-width="6"/>
      <rect x="34" y="34" width="82" height="120" rx="8" fill="rgba(255,255,255,0.22)"/>
      <path d="M50 70 h50 M50 92 h50 M50 114 h34" stroke="rgba(255,255,255,0.85)" stroke-width="6" stroke-linecap="round"/>
      <rect x="12" y="18" width="126" height="152" rx="12" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="4" stroke-dasharray="14 10"/>
      <path d="M56 210 h38" stroke="rgba(255,255,255,0.85)" stroke-width="6" stroke-linecap="round"/>
      <rect x="196" y="90" width="120" height="150" rx="14" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.85)" stroke-width="5" transform="rotate(8 256 165)"/>
      <path d="M218 130 h76 M218 154 h76 M218 178 h52" stroke="rgba(255,255,255,0.8)" stroke-width="6" stroke-linecap="round" transform="rotate(8 256 165)"/>
    </g>`,
  // photo + signature motif
  signature: `
    <g transform="translate(905,160)">
      <rect x="0" y="0" width="150" height="190" rx="18" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.85)" stroke-width="6"/>
      <circle cx="75" cy="64" r="28" fill="rgba(255,255,255,0.55)"/>
      <path d="M31 160 Q53 118 75 148 Q97 178 119 132" stroke="rgba(255,255,255,0.9)" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M186 60 q22 -30 44 0 t44 0 t44 0 t44 0" stroke="rgba(255,255,255,0.9)" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M196 128 q40 22 160 10" stroke="rgba(255,255,255,0.55)" stroke-width="6" fill="none" stroke-linecap="round"/>
      <rect x="0" y="226" width="150" height="10" rx="5" fill="rgba(255,255,255,0.35)"/>
    </g>`,
};

const COVERS = [
  {
    file: 'resize-photo-600x600-dv-lottery-hero.jpg',
    headline: '600 × 600 Photo for DV Lottery & Visa Forms',
    kicker: 'STEP-BY-STEP GUIDE',
    icon: ICONS.resize,
  },
  {
    file: 'fill-pdf-form-online-free-hero.jpg',
    headline: 'Fill Out a PDF Form Without a Printer',
    kicker: 'FREE · NO ADOBE NEEDED',
    icon: ICONS.form,
  },
  {
    file: 'scan-documents-phone-pdf-hero.jpg',
    headline: 'Scan Documents With Your Phone Into One PDF',
    kicker: 'PHONE SCANNING GUIDE',
    icon: ICONS.scan,
  },
  {
    file: 'passport-photo-signature-combined-hero.jpg',
    headline: 'Passport Photo + Signature in One Image',
    kicker: 'EXAM FORM GUIDE',
    icon: ICONS.signature,
  },
];

function coverSvg({ headline, kicker, icon }) {
  const lines = wrap(headline, 21);
  const fontSize = lines.some((l) => l.length > 18) ? 74 : 84;
  const lineHeight = fontSize * 1.16;
  const startY = 300 - (lines.length - 1) * lineHeight;
  const textLines = lines
    .map(
      (line, i) =>
        `<text x="90" y="${startY + i * lineHeight}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="800" fill="#ffffff">${esc(line)}</text>`
    )
    .join('\n');

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="55%" stop-color="#4338ca"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <pattern id="dots" x="0" y="0" width="44" height="44" patternUnits="userSpaceOnUse">
      <circle cx="2.5" cy="2.5" r="2.5" fill="rgba(255,255,255,0.10)"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>
  <circle cx="1180" cy="-60" r="260" fill="rgba(255,255,255,0.07)"/>
  <circle cx="120" cy="760" r="200" fill="rgba(255,255,255,0.05)"/>
  ${icon}
  ${textLines}
  <text x="90" y="${startY - 66}" font-family="Arial, sans-serif" font-size="26" font-weight="bold" letter-spacing="6" fill="rgba(255,255,255,0.75)">${esc(kicker)}</text>
  <rect x="90" y="560" width="64" height="8" rx="4" fill="rgba(255,255,255,0.9)"/>
  <text x="90" y="640" font-family="Arial, sans-serif" font-size="34" font-weight="bold" fill="#ffffff">PdfPixels</text>
  <text x="90" y="676" font-family="Arial, sans-serif" font-size="20" fill="rgba(255,255,255,0.65)">pdfpixels.com — free online PDF &amp; image tools</text>
</svg>`);
}

for (const spec of COVERS) {
  const out = path.join(outDir, spec.file);
  await sharp(coverSvg(spec)).jpeg({ quality: 88, mozjpeg: true }).toFile(out);
  const meta = await sharp(out).metadata();
  console.log(`${spec.file} → ${meta.width}x${meta.height}`);
}
