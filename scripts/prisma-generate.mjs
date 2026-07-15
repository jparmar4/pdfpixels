/**
 * Cross-platform Prisma client generation for install/build.
 * Ensures DATABASE_URL is present (SQLite default) so CI hosts
 * without env files still run `prisma generate` successfully.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./prisma/dev.db';
}

const result = spawnSync('npx', ['prisma', 'generate'], {
  cwd: root,
  env: process.env,
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status === null ? 1 : result.status);
