import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

console.log('Running standalone post-build static file mapping...');

const copyDir = (src, dest) => {
  if (!fs.existsSync(src)) {
    console.warn(`Source directory not found: ${src}`);
    return false;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  try {
    fs.cpSync(src, dest, { recursive: true, force: true });
    console.log(`Successfully copied ${src} to ${dest}`);
    return true;
  } catch (err) {
    console.error(`Failed to copy ${src} to ${dest}:`, err);
    return false;
  }
};

const run = () => {
  const standaloneDir = path.join(process.cwd(), '.next', 'standalone');
  const publicNextDir = path.join(process.cwd(), 'public', '_next');
  const srcStatic = path.join(process.cwd(), '.next', 'static');

  if (!fs.existsSync(standaloneDir)) {
    console.warn('Standalone directory not found. Did you set output: "standalone" in next.config.ts?');
    process.exit(1);
  }

  if (!fs.existsSync(srcStatic)) {
    console.error('FATAL: .next/static missing after next build — CSS/JS will not load.');
    process.exit(1);
  }

  // Next.js 16 refuses to build when public/_next exists, so never leave
  // mirrored framework assets in the source public directory.
  if (fs.existsSync(publicNextDir)) {
    fs.rmSync(publicNextDir, { recursive: true, force: true });
    console.log(`Removed forbidden source public asset mirror: ${publicNextDir}`);
  }

  // Copy public folder
  copyDir(
    path.join(process.cwd(), 'public'),
    path.join(standaloneDir, 'public'),
  );

  // Copy static folder to standalone for production runtime
  const standaloneStaticDir = path.join(standaloneDir, '.next', 'static');
  if (!fs.existsSync(standaloneStaticDir)) fs.mkdirSync(standaloneStaticDir, { recursive: true });
  if (!copyDir(srcStatic, standaloneStaticDir)) {
    process.exit(1);
  }

  // Mirror static files into standalone/public so external web servers can serve
  // them directly in standalone deployments without polluting source public/.
  const standalonePublicStaticDir = path.join(standaloneDir, 'public', '_next', 'static');
  if (!fs.existsSync(standalonePublicStaticDir)) fs.mkdirSync(standalonePublicStaticDir, { recursive: true });
  if (!copyDir(srcStatic, standalonePublicStaticDir)) {
    process.exit(1);
  }

  // Fail the build if main CSS is missing (prevents "text-only" deploys)
  const ensure = spawnSync(process.execPath, [path.join('scripts', 'ensure-standalone-static.mjs')], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
  if (ensure.status !== 0) {
    console.error('Post-build static verification failed.');
    process.exit(ensure.status || 1);
  }

  console.log('Post-build static file mapping completed successfully.');
};

run();
