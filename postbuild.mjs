import fs from 'fs';
import path from 'path';

console.log('Running standalone post-build static file mapping...');

const copyDir = (src, dest) => {
  if (!fs.existsSync(src)) {
    console.warn(`Source directory not found: ${src}`);
    return;
  }
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Next.js uses fs-extra internally but Node native fs.cpSync is available in >= 16.7
  try {
    fs.cpSync(src, dest, { recursive: true });
    console.log(`Successfully copied ${src} to ${dest}`);
  } catch (err) {
    console.error(`Failed to copy ${src} to ${dest}:`, err);
  }
};

const run = () => {
  const standaloneDir = path.join(process.cwd(), '.next', 'standalone');
  
  if (!fs.existsSync(standaloneDir)) {
    console.warn('Standalone directory not found. Did you set output: "standalone" in next.config.ts?');
    return;
  }

  // Copy public folder
  copyDir(
    path.join(process.cwd(), 'public'),
    path.join(standaloneDir, 'public')
  );

  // Copy static folder
  copyDir(
    path.join(process.cwd(), '.next', 'static'),
    path.join(standaloneDir, '.next', 'static')
  );

  // Note: For Hostinger/LiteSpeed, static assets requested at /_next/static/...
  // might be intercepted by LiteSpeed and looked up in the docroot (public_html/public).
  // So we mirror them into the public folder.
  copyDir(
    path.join(process.cwd(), '.next', 'static'),
    path.join(process.cwd(), 'public', '_next', 'static')
  );

  console.log('Post-build static file mapping completed successfully.');
};

run();
