const fs = require('fs');
const src = fs.readFileSync('src/config/blog.ts', 'utf8');
const re = /slug: "([^"]+)"[\s\S]*?content: `([\s\S]*?)`,\s*\n\s*faq:/g;
let m, rows = [];
while ((m = re.exec(src)) !== null) {
  const words = m[2]
    .replace(/[#>*`[\]()|_-]/g, ' ')
    .split(/\s+/)
    .filter((w) => /[a-zA-Z0-9]/.test(w)).length;
  rows.push([words, m[1]]);
}
rows.sort((a, b) => a[0] - b[0]);
rows.forEach(([w, s]) => console.log(String(w).padStart(5), s));
console.log('TOTAL POSTS:', rows.length);
