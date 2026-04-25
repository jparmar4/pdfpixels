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
  const publicNextDir = path.join(process.cwd(), 'public', '_next');
  
  if (!fs.existsSync(standaloneDir)) {
    console.warn('Standalone directory not found. Did you set output: "standalone" in next.config.ts?');
    return;
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
    path.join(standaloneDir, 'public')
  );

  // Copy static folder to standalone for production runtime
  const standaloneStaticDir = path.join(standaloneDir, '.next', 'static');
  if (!fs.existsSync(standaloneStaticDir)) fs.mkdirSync(standaloneStaticDir, { recursive: true });
  copyDir(path.join(process.cwd(), '.next', 'static'), standaloneStaticDir);

  // Mirror static files into standalone/public so external web servers can serve
  // them directly in standalone deployments without polluting source public/.
  const standalonePublicStaticDir = path.join(standaloneDir, 'public', '_next', 'static');
  if (!fs.existsSync(standalonePublicStaticDir)) fs.mkdirSync(standalonePublicStaticDir, { recursive: true });
  copyDir(path.join(process.cwd(), '.next', 'static'), standalonePublicStaticDir);

  console.log('Post-build static file mapping completed successfully.');
};

run();
