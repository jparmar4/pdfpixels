import fs from 'fs';

const files = [
  'src/app/api/pdf/watermark/route.ts',
  'src/app/api/pdf/rotate/route.ts',
  'src/app/api/pdf/delete-pages/route.ts',
  'src/app/api/pdf/add-page-numbers/route.ts',
  'src/app/api/pdf/linearize/route.ts',
  'src/app/api/pdf/reorder/route.ts',
  'src/app/api/pdf/protect/route.ts',
  'src/app/api/pdf/split/route.ts',
];

for (const f of files) {
  const before = fs.readFileSync(f, 'utf8');
  // Match any corrupted attachment placeholder prefix before ${base64}
  const after = before.replace(
    /`\[[^\]]*\]\$\{base64\}`/g,
    '`data:application/pdf;base64,${base64}`',
  );
  if (after !== before) {
    fs.writeFileSync(f, after);
    console.log('fixed', f, 'replacements:', (before.match(/`\[[^\]]*\]\$\{base64\}`/g) || []).length);
  } else {
    // debug bytes around attachment
    const idx = before.indexOf('PDF attachment');
    if (idx >= 0) {
      const slice = before.slice(idx - 5, idx + 60);
      console.log('NO MATCH', f, [...slice].map((ch) => ch.charCodeAt(0).toString(16)).join(' '));
    } else {
      console.log('NO MATCH and no attachment string', f);
    }
  }
}
