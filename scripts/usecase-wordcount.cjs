// Word-count audit for use-case and comparison page data
const fs = require('fs');

function countWords(obj) {
  const text = [];
  const collect = (v) => {
    if (typeof v === 'string') text.push(v);
    else if (Array.isArray(v)) v.forEach(collect);
    else if (v && typeof v === 'object') Object.values(v).forEach(collect);
  };
  collect(obj);
  return text
    .join(' ')
    .replace(/[#>*`[\]()|_-]/g, ' ')
    .split(/\s+/)
    .filter((w) => /[a-zA-Z0-9]/.test(w)).length;
}

function audit(file, exportName, label) {
  const src = fs.readFileSync(file, 'utf8');
  const arrMatch = src.match(new RegExp(`export const ${exportName}[^=]*=\\s*\\[`));
  if (!arrMatch) { console.log(`no array found in ${file}`); return; }
  const start = arrMatch.index + arrMatch[0].length;
  // crude object splitter: find top-level { ... }, blocks by brace depth
  const body = src.slice(start, src.indexOf('];', start));
  const items = [];
  let depth = 0, cur = '';
  for (const ch of body) {
    if (ch === '{') { depth++; if (depth === 1) { cur = ''; continue; } }
    if (ch === '}') { depth--; if (depth === 0) { items.push(cur); continue; } }
    if (depth >= 1) cur += ch;
  }
  const rows = items.map((item) => {
    const slug = /slug:\s*'([^']+)'/.exec(item)?.[1] ?? '???';
    return [evalOverviewOnly(item), slug];
  });
  rows.sort((a, b) => a[0] - b[0]);
  console.log(`\n== ${label} (${rows.length} pages) ==`);
  rows.forEach(([w, s]) => console.log(String(w).padStart(5), s));
}

// count only editorial-ish fields: overview + lists + faqs (skip slugs/intent)
function evalOverviewOnly(objSrc) {
  const keep = ['overview', 'whoItsFor', 'steps', 'tips', 'pitfalls', 'faqs', 'whenToChooseUs', 'whenToChooseAlt', 'keyDifferences', 'verdict', 'bestFor'];
  let total = 0;
  for (const k of keep) {
    const re = new RegExp(`${k}:\\s*(\\[[\\s\\S]*?\\]|'[\\s\\S]*?')`, 'g');
    let m;
    while ((m = re.exec(objSrc))) {
      total += countWords({ v: m[1] });
    }
  }
  return total;
}

audit('src/lib/use-cases.ts', 'useCasePages', 'USE-CASES');
audit('src/lib/comparisons.ts', 'comparisonPages', 'COMPARISONS');
