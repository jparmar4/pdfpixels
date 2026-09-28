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
  // photo-file motif (reduce photo size)
  photo: `
    <g transform="translate(915,150)">
      <rect x="0" y="0" width="230" height="180" rx="20" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.85)" stroke-width="6"/>
      <circle cx="62" cy="52" r="20" fill="rgba(255,255,255,0.9)"/>
      <path d="M22 160 L88 84 L130 130 L158 104 L210 160 Z" fill="rgba(255,255,255,0.9)"/>
      <rect x="20" y="200" width="190" height="34" rx="10" fill="rgba(255,255,255,0.2)"/>
      <path d="M36 217 h158" stroke="rgba(255,255,255,0.9)" stroke-width="8" stroke-linecap="round" stroke-dasharray="70 40"/>
    </g>`,
  // broken-file repair motif
  repair: `
    <g transform="translate(915,150)">
      <path d="M0 30 Q0 8 22 8 H120 L180 68 V250 Q180 268 158 268 H22 Q0 268 0 250 Z" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.85)" stroke-width="6"/>
      <path d="M120 8 L180 68 H134 Q120 68 120 54 Z" fill="rgba(255,255,255,0.4)"/>
      <path d="M40 150 h100 M40 150 l-6 -8 M40 150 l-6 8 M140 150 l6 -8 M140 150 l6 8" stroke="rgba(255,255,255,0.9)" stroke-width="6" stroke-linecap="round"/>
      <path d="M52 168 L128 132" stroke="#f59e0b" stroke-width="14" stroke-linecap="round"/>
      <path d="M36 190 h108 M36 214 h74" stroke="rgba(255,255,255,0.6)" stroke-width="7" stroke-linecap="round"/>
    </g>`,
  // screenshot stack motif
  stack: `
    <g transform="translate(915,150)">
      <rect x="36" y="26" width="196" height="140" rx="16" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.6)" stroke-width="5" transform="rotate(6 134 96)"/>
      <rect x="18" y="14" width="196" height="140" rx="16" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.8)" stroke-width="5" transform="rotate(-3 116 84)"/>
      <rect x="0" y="0" width="200" height="144" rx="16" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.95)" stroke-width="6"/>
      <path d="M28 96 l34 -38 l26 26 l20 -18 l44 44" stroke="rgba(255,255,255,0.9)" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="58" cy="44" r="13" fill="rgba(255,255,255,0.9)"/>
      <path d="M236 120 v66 q0 16 -16 16 h-120" stroke="rgba(255,255,255,0.85)" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M112 190 l-14 14 l14 14" stroke="rgba(255,255,255,0.85)" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`,
  // exif / metadata strip motif
  exif: `
    <g transform="translate(905,150)">
      <rect x="0" y="10" width="190" height="250" rx="18" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.85)" stroke-width="6"/>
      <circle cx="95" cy="80" r="34" fill="rgba(255,255,255,0.5)"/>
      <path d="M34 232 Q66 150 95 190 Q124 230 156 158" stroke="rgba(255,255,255,0.85)" stroke-width="7" fill="none" stroke-linecap="round"/>
      <g transform="translate(196,36)">
        <rect x="0" y="0" width="168" height="44" rx="10" fill="rgba(15,23,42,0.55)"/>
        <path d="M24 22 a8 8 0 0 1 16 0 q0 10 -8 18 q-8 -8 -8 -18 z" fill="#f87171"/>
        <circle cx="32" cy="22" r="3" fill="#0f172a"/>
        <text x="52" y="28" font-family="Arial, sans-serif" font-size="19" font-weight="bold" fill="#fecaca">GPS 27.17, 78.02</text>
      </g>
      <g transform="translate(196,104)">
        <rect x="0" y="0" width="168" height="44" rx="10" fill="rgba(15,23,42,0.55)"/>
        <text x="18" y="29" font-family="Arial, sans-serif" font-size="19" font-weight="bold" fill="#93c5fd">PHONE MODEL</text>
      </g>
      <g transform="translate(196,172)">
        <rect x="0" y="0" width="168" height="44" rx="10" fill="rgba(15,23,42,0.55)"/>
        <text x="18" y="29" font-family="Arial, sans-serif" font-size="19" font-weight="bold" fill="#fcd34d">TIMESTAMP</text>
      </g>
      <path d="M190 58 h-24 M190 126 h-24 M190 194 h-24" stroke="rgba(255,255,255,0.7)" stroke-width="5" stroke-linecap="round"/>
      <rect x="0" y="296" width="364" height="12" rx="6" fill="rgba(255,255,255,0.4)"/>
      <path d="M330 302 l14 -14 M330 302 l14 14" stroke="rgba(255,255,255,0.9)" stroke-width="7" stroke-linecap="round"/>
    </g>`,
  // dpi / print-vs-web motif
  dpi: `
    <g transform="translate(905,150)">
      <rect x="0" y="0" width="180" height="240" rx="16" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.85)" stroke-width="6"/>
      <path d="M40 40 h100 M40 40 v-14 M90 40 v-22 M140 40 v-14" stroke="rgba(255,255,255,0.9)" stroke-width="6" stroke-linecap="round"/>
      <path d="M40 200 h100 M40 200 v14 M90 200 v22 M140 200 v14" stroke="rgba(255,255,255,0.9)" stroke-width="6" stroke-linecap="round"/>
      <circle cx="90" cy="120" r="30" fill="rgba(255,255,255,0.3)"/>
      <text x="90" y="128" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#ffffff">DPI</text>
      <g transform="translate(216,30)">
        <rect x="0" y="0" width="190" height="52" rx="10" fill="rgba(15,23,42,0.5)"/>
        <text x="16" y="34" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#93c5fd">WEB: pixels</text>
      </g>
      <g transform="translate(216,110)">
        <rect x="0" y="0" width="190" height="52" rx="10" fill="rgba(15,23,42,0.5)"/>
        <text x="16" y="34" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#fcd34d">PRINT: inches</text>
      </g>
      <g transform="translate(216,190)">
        <rect x="0" y="0" width="190" height="52" rx="10" fill="rgba(15,23,42,0.5)"/>
        <text x="16" y="34" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#86efac">SCAN: 150-300</text>
      </g>
      <path d="M400 260 v-210 M400 50 l-14 14 M400 50 l14 14 M400 260 l-14 -14 M400 260 l14 -14" stroke="rgba(255,255,255,0.75)" stroke-width="6" stroke-linecap="round"/>
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
  {
    file: 'reduce-photo-file-size-hero.jpg',
    headline: 'How to Reduce Any Photo File Size',
    kicker: 'JPG · PNG · iPHONE · ANDROID',
    icon: ICONS.photo,
  },
  {
    file: 'fix-pdf-not-opening-hero.jpg',
    headline: 'PDF Will Not Open? Fix It on Any Device',
    kicker: 'TROUBLESHOOTING GUIDE',
    icon: ICONS.repair,
  },
  {
    file: 'combine-screenshots-into-one-hero.jpg',
    headline: 'Combine Screenshots Into One Image or PDF',
    kicker: 'STEP-BY-STEP GUIDE',
    icon: ICONS.stack,
  },
  {
    file: 'sign-pdf-on-phone-hero.jpg',
    headline: 'Sign a PDF on Your Phone in a Minute',
    kicker: 'iPHONE · ANDROID · FREE',
    icon: ICONS.signature,
  },
  {
    file: 'make-a-photo-collage-hero.jpg',
    headline: 'Make a Photo Collage Without an App',
    kicker: 'GRID LAYOUT GUIDE',
    icon: ICONS.stack,
  },
  {
    file: 'remove-exif-gps-data-hero.jpg',
    headline: 'Strip EXIF & GPS Data From Photos',
    kicker: 'PRIVACY GUIDE',
    icon: ICONS.exif,
  },
  {
    file: 'image-dpi-print-vs-web-hero.jpg',
    headline: 'Image DPI: Print vs Web, Explained',
    kicker: 'PIXELS & PRINT GUIDE',
    icon: ICONS.dpi,
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

// ─────────────────────────────────────────────────────────────────────────
// Bespoke realistic-illustration images (WebP→JPG guide).
// Hero: light, photoreal-style browser composite with minimal text overlay
// (Google Discover guidance discourages heavy text on cover images).
// Pinterest: 1000x1500 (2:3) vertical pin with title overlay — the format
// Pinterest recommends. No watermarks on either image.
// ─────────────────────────────────────────────────────────────────────────

const esc2 = esc;
const dropShadow = (blur, dy, opacity) =>
  `<filter id="ds${blur}${dy}" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="${dy}" stdDeviation="${blur}" flood-color="#0f172a" flood-opacity="${opacity}"/></filter>`;

/** A believable landscape thumbnail used inside file chips. */
function photoThumb(x, y, w, h) {
  return `
  <g clip-path="url(${`thumbclip${x}${y}`})">
    <clipPath id="thumbclip${x}${y}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/></clipPath>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#dbeafe"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#sky)"/>
    <circle cx="${x + w * 0.72}" cy="${y + h * 0.3}" r="${w * 0.11}" fill="#fef3c7"/>
    <path d="M${x} ${y + h} L${x + w * 0.38} ${y + h * 0.42} L${x + w * 0.6} ${y + h * 0.78} L${x + w * 0.78} ${y + h * 0.55} L${x + w} ${y + h} Z" fill="#475569"/>
    <path d="M${x} ${y + h} L${x + w * 0.3} ${y + h * 0.6} L${x + w * 0.55} ${y + h} Z" fill="#334155"/>
  </g>`;
}

const SKY_DEFS = `
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#93c5fd"/><stop offset="100%" stop-color="#e0f2fe"/>
  </linearGradient>
  <linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#f8fafc"/><stop offset="100%" stop-color="#e2e8f0"/>
  </linearGradient>
  <linearGradient id="btn" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#4f46e5"/>
  </linearGradient>
  <linearGradient id="heroBg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#eef2ff"/><stop offset="55%" stop-color="#e0e7ff"/><stop offset="100%" stop-color="#dbeafe"/>
  </linearGradient>
  <radialGradient id="glow1" cx="0.2" cy="0.15" r="0.6">
    <stop offset="0%" stop-color="#fef9c3" stop-opacity="0.85"/><stop offset="100%" stop-color="#fef9c3" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="glow2" cx="0.85" cy="0.85" r="0.55">
    <stop offset="0%" stop-color="#bfdbfe" stop-opacity="0.9"/><stop offset="100%" stop-color="#bfdbfe" stop-opacity="0"/>
  </radialGradient>`;

/** File chip: thumbnail + name + size. */
function fileChip(x, y, label, size, ext, accent) {
  const w = 300, h = 150;
  return `
  <g filter="url(#ds10_8)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="#ffffff" stroke="#e2e8f0"/>
    ${photoThumb(x + 14, y + 14, w - 28, 88)}
    <rect x="${x + 14}" y="${y + 112}" width="118" height="24" rx="6" fill="${accent}"/>
    <text x="${x + 73}" y="${y + 128}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff">${esc2(ext)}</text>
    <text x="${x + 142}" y="${y + 129}" font-family="Arial, sans-serif" font-size="14" fill="#334155">${esc2(size)}</text>
  </g>
  <text x="${x + w / 2}" y="${y - 14}" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#334155">${esc2(label)}</text>`;
}

/** Realistic browser window with the conversion flow inside. */
function browserWindow(scale = 1) {
  const w = 980, h = 560;
  return `
  <g transform="scale(${scale})">
    <rect x="0" y="0" width="${w}" height="${h}" rx="18" fill="#ffffff" stroke="#cbd5e1" filter="url(#ds18_14)"/>
    <path d="M0 18 Q0 0 18 0 H${w - 18} Q${w} 0 ${w} 18 V52 H0 Z" fill="url(#chrome)"/>
    <rect x="0" y="52" width="${w}" height="2" fill="#cbd5e1"/>
    <circle cx="28" cy="26" r="7" fill="#ff5f57"/><circle cx="52" cy="26" r="7" fill="#febc2e"/><circle cx="76" cy="26" r="7" fill="#28c840"/>
    <rect x="110" y="12" width="${w - 220}" height="30" rx="15" fill="#f1f5f9" stroke="#e2e8f0"/>
    <path d="M132 27 l5 -5 l5 5 v7 h-10 z M134.5 26 a2.5 2.5 0 0 1 5 0" fill="none" stroke="#94a3b8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="152" y="31" font-family="Arial, sans-serif" font-size="14" fill="#64748b">pdfpixels.com/tools/webp-to-jpg</text>
    <text x="${w - 96}" y="32" font-family="Arial, sans-serif" font-size="15" fill="#94a3b8">− ✕ ▢</text>

    <text x="${w / 2}" y="118" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="#0f172a">WebP to JPG Converter</text>
    <text x="${w / 2}" y="148" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" fill="#64748b">Free · No sign-up · Files deleted automatically</text>

    ${fileChip(70, 190, 'ORIGINAL', '842 KB', '.webp', '#f59e0b')}
    ${fileChip(w - 370, 190, 'CONVERTED', '118 KB', '.jpg', '#10b981')}

    <g filter="url(#ds6_6)">
      <rect x="${w / 2 - 58}" y="232" width="116" height="56" rx="28" fill="url(#btn)"/>
      <path d="M${w / 2 - 26} 260 h44 M${w / 2 + 8} 248 l12 12 l-12 12" stroke="#ffffff" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </g>

    <rect x="120" y="356" width="${w - 240}" height="10" rx="5" fill="#e2e8f0"/>
    <rect x="120" y="356" width="${(w - 240) * 0.86}" height="10" rx="5" fill="url(#btn)"/>
    <text x="${w / 2}" y="402" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#10b981">86% smaller — same visual quality</text>

    <rect x="120" y="432" width="${w - 240}" height="1.5" fill="#e2e8f0"/>
    <text x="${w / 2}" y="478" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#475569">Drag &amp; drop · JPG, PNG, WebP, HEIC, AVIF supported</text>
    <text x="${w / 2}" y="510" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#475569">Processed in seconds — no watermark on your files</text>
    <circle cx="60" cy="508" r="5" fill="#10b981"/><circle cx="920" cy="508" r="5" fill="#10b981"/>
  </g>`;
}

// Hero 1280x720 — clean scene, only a small corner brand mark (no watermark overlay)
{
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>${SKY_DEFS}${dropShadow(18, 14, 0.28)}${dropShadow(10, 8, 0.22)}${dropShadow(6, 6, 0.25)}</defs>
  <rect width="1280" height="720" fill="url(#heroBg)"/>
  <rect width="1280" height="720" fill="url(#glow1)"/>
  <rect width="1280" height="720" fill="url(#glow2)"/>
  <ellipse cx="240" cy="660" rx="420" ry="60" fill="#c7d2fe" opacity="0.5"/>
  <ellipse cx="1050" cy="690" rx="380" ry="55" fill="#bae6fd" opacity="0.55"/>
  ${browserWindow(1.06).replace('<g transform="scale(1.06)">', '<g transform="translate(75,92) scale(1.06)">')}
  <text x="1252" y="704" text-anchor="end" font-family="Arial, sans-serif" font-size="19" font-weight="bold" fill="#64748b">PdfPixels</text>
</svg>`);
  await sharp(svg).jpeg({ quality: 90, mozjpeg: true }).toFile(path.join(outDir, 'webp-to-jpg-converter-hero.jpg'));
  console.log('webp-to-jpg-converter-hero.jpg → 1280x720');
}

// Pinterest 1000x1500 (2:3) — vertical pin with title overlay
{
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1500" viewBox="0 0 1000 1500">
  <defs>${SKY_DEFS}${dropShadow(18, 14, 0.28)}${dropShadow(10, 8, 0.22)}${dropShadow(6, 6, 0.25)}</defs>
  <rect width="1000" height="1500" fill="url(#heroBg)"/>
  <rect width="1000" height="1500" fill="url(#glow1)"/>
  <rect width="1000" height="1500" fill="url(#glow2)"/>
  <rect x="36" y="36" width="928" height="1428" rx="28" fill="none" stroke="#c7d2fe" stroke-width="3"/>

  <text x="500" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="bold" letter-spacing="8" fill="#4f46e5">2026 GUIDE</text>
  <text x="500" y="266" text-anchor="middle" font-family="Arial, sans-serif" font-size="118" font-weight="800" fill="#0f172a">WebP to JPG</text>
  <text x="500" y="356" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#334155">Why &amp; How to Convert</text>
  <text x="500" y="412" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#64748b">smaller files · opens everywhere · free</text>

  ${browserWindow(0.72).replace('<g transform="scale(0.72)">', '<g transform="translate(139,470) scale(0.72)">')}

  <rect x="250" y="1210" width="500" height="86" rx="43" fill="url(#btn)" filter="url(#ds10_8)"/>
  <text x="500" y="1264" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="bold" fill="#ffffff">Convert free →</text>
  <text x="500" y="1368" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="#334155">PdfPixels</text>
  <text x="500" y="1404" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#64748b">pdfpixels.com/tools/webp-to-jpg</text>
</svg>`);
  await sharp(svg).jpeg({ quality: 90, mozjpeg: true }).toFile(path.join(outDir, 'webp-to-jpg-converter-pinterest.jpg'));
  console.log('webp-to-jpg-converter-pinterest.jpg → 1000x1500');
}
