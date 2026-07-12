#!/usr/bin/env node
/**
 * Generate PNG icons from SVG logo for PWA and Apple devices
 * Requires: sharp (already in dependencies)
 */

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Icon sizes to generate
const icons = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'favicon-96.png', size: 96 },
];

// Read SVG
const svgPath = join(publicDir, 'logo.svg');
const svgBuffer = readFileSync(svgPath);

console.log('Generating PNG icons from logo.svg...\n');

for (const icon of icons) {
  const outputPath = join(publicDir, icon.name);
  
  await sharp(svgBuffer)
    .resize(icon.size, icon.size)
    .png()
    .toFile(outputPath);
  
  console.log(`✓ Generated ${icon.name} (${icon.size}x${icon.size})`);
}

// Note: For proper ICO generation, we'd need 'png-to-ico' package
// For now, we'll just ensure the PNG favicon exists
await sharp(svgBuffer)
  .resize(32, 32)
  .png()
  .toFile(join(publicDir, 'favicon-32.png'));

await sharp(svgBuffer)
  .resize(16, 16)
  .png()
  .toFile(join(publicDir, 'favicon-16.png'));

console.log('\n✓ All icons generated successfully!');
console.log('\nGenerated files:');
icons.forEach(icon => console.log(`  - /public/${icon.name}`));
console.log('  - /public/favicon-32.png');
console.log('  - /public/favicon-16.png');
