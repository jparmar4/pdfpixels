// I'll just read the files as strings and do regex.
const fs = require('fs');

const toolsData = fs.readFileSync('src/lib/tools-data.ts', 'utf-8');
const toolContentData = fs.readFileSync('src/lib/tool-content-data.ts', 'utf-8');

const slugs = [...toolsData.matchAll(/slug: '([^']+)'/g)].map(m => m[1]);
const contentKeys = [...toolContentData.matchAll(/'([^']+)': {/g)].map(m => m[1]);
// Also check for double quotes
const contentKeys2 = [...toolContentData.matchAll(/"([^"]+)": {/g)].map(m => m[1]);

const allContentKeys = new Set([...contentKeys, ...contentKeys2]);

const missing = slugs.filter(s => !allContentKeys.has(s));
console.log('Total tools:', slugs.length);
console.log('With content:', allContentKeys.size);
console.log('Missing content:', missing.length);
console.log('Missing tools:', missing);
