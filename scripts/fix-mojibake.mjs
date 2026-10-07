import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const REPLACEMENTS = [
  ['â€”', '—'],
  ['â€“', '–'],
  ['â€¦', '…'],
  ['â†’', '→'],
  ['â†“', '↓'],
  ['â€¢', '•'],
  ['âˆ’', '−'],
  ['Ã—', '×'],
  ['Â·', '·'],
  ['Â°', '°'],
  ['âœ ï¸ ', '✓ '],
  ['âœ', '✓'],
  ['ðŸ—‘ï¸ ', '🗑️ '],
  ['ðŸ—‘', '🗑️'],
  ['ðŸ” ', '🔍 '],
  ['ðŸ”', '🔍'],
  ['â€œ', '"'],
  ['â€', '"'],
  ['Â©', '©'],
  ['Ac 2026', '© 2026'],
  ['left +" right', 'left ↔ right'],
  ['top +" bottom', 'top ↕ bottom'],
];

let totalReplacements = 0;
let filesModified = 0;

function processDir(dir) {
  for (const item of readdirSync(dir)) {
    const full = path.join(dir, item);
    if (statSync(full).isDirectory()) {
      if (item !== 'node_modules' && item !== '.next' && item !== '.git') processDir(full);
    } else if (full.endsWith('.ts') || full.endsWith('.tsx') || full.endsWith('.mjs') || full.endsWith('.cjs')) {
      let content = readFileSync(full, 'utf8');
      let changed = false;
      for (const [target, repl] of REPLACEMENTS) {
        if (content.includes(target)) {
          const count = content.split(target).length - 1;
          totalReplacements += count;
          content = content.replaceAll(target, repl);
          changed = true;
        }
      }
      if (changed) {
        writeFileSync(full, content, 'utf8');
        filesModified++;
        console.log('Cleaned mojibake in:', full);
      }
    }
  }
}

processDir('./src');
console.log(`Finished: ${totalReplacements} mojibake instances fixed across ${filesModified} files.`);
