// Verify every tool id in tools-data resolves to a dedicated workspace
// (not the ToolWorkspace fallback) in tool-page-client.tsx.
// Run: node scripts/verify-tool-dispatch.mjs
import { registerHooks } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '..');
registerHooks({
  resolve(specifier, context, next) {
    let target;
    if (specifier.startsWith('@/')) target = path.join(root, 'src', specifier.slice(2));
    else if (specifier.startsWith('.') && context.parentURL?.endsWith('.ts')) target = fileURLToPath(new URL(specifier, context.parentURL));
    if (target && existsSync(target + '.ts')) return { url: pathToFileURL(target + '.ts').href, shortCircuit: true };
    if (specifier === 'next/server') return next('next/server.js', context);
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith('.ts') && !url.includes('node_modules')) return {
      format: 'module', shortCircuit: true,
      source: ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText,
    };
    return next(url, context);
  },
});

const { allTools } = await import('../src/lib/tools-data.ts');
const src = readFileSync(path.join(root, 'src/components/layout/tool-page-client.tsx'), 'utf8');

// Collect every literal id the dispatcher matches on.
const direct = new Set([...src.matchAll(/toolId === '([^']+)'/g)].map((m) => m[1]));
const arrays = [...src.matchAll(/\[(.*?)\]\.includes\(toolId\)/gs)].flatMap((m) =>
  [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]),
);
const effectTools = [...src.match(/const effectTools = \[(.*?)\]/s)?.[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
const editTools = [...src.match(/const editTools = \[(.*?)\]/s)?.[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
const covered = new Set([...direct, ...arrays, ...effectTools, ...editTools]);

const missing = allTools.filter((t) => !covered.has(t.id));
console.log(`Tools: ${allTools.length}, covered: ${allTools.length - missing.length}`);
if (missing.length) {
  console.log('Missing workspace mapping (would hit ToolWorkspace fallback):');
  missing.forEach((t) => console.log(` - id=${t.id} slug=${t.slug}`));
  process.exit(1);
}
console.log('All tool ids resolve to a dedicated workspace.');
