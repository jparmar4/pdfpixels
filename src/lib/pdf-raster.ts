import { mkdtemp, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { runGhostscriptWithFallback } from './ghostscript';

/** Rebuild from rendered pixels; no source streams, attachments or metadata survive. */
export async function rasterizePdf(bytes: Uint8Array, pageCount: number): Promise<Uint8Array> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'pdfpixels-redact-'));
  try {
    const input = path.join(dir, 'input.pdf');
    await writeFile(input, bytes);
    await runGhostscriptWithFallback([
      '-dSAFER', '-dBATCH', '-dNOPAUSE', '-dQUIET', '-sDEVICE=png16m',
      '-r150', '-dTextAlphaBits=4', '-dGraphicsAlphaBits=4', '-dUseCropBox',
      `-sOutputFile=${path.join(dir, 'page-%05d.png')}`, input,
    ], { timeoutMs: 45_000 });
    const files = (await readdir(dir)).filter(name => /^page-\d+\.png$/.test(name)).sort();
    if (files.length !== pageCount) throw new Error('Not every page could be securely redacted.');
    const output = await PDFDocument.create();
    for (const file of files) {
      const png = await readFile(path.join(dir, file));
      const metadata = await sharp(png).metadata();
      const image = await output.embedPng(png);
      const width = metadata.width! * 72 / 150;
      const height = metadata.height! * 72 / 150;
      output.addPage([width, height]).drawImage(image, { x: 0, y: 0, width, height });
    }
    return output.save();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
