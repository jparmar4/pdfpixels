import path from 'node:path';
import { createRequire } from 'node:module';

/** Read real page text, including encoded fonts; never guess from raw PDF bytes. */
export async function extractPdfLines(buffer: Buffer): Promise<string[]> {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const require = createRequire(path.join(process.cwd(), 'package.json'));
  const root = path.dirname(require.resolve('pdfjs-dist/package.json'));
  const task = getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    useSystemFonts: false,
    standardFontDataUrl: path.join(root, 'standard_fonts').replace(/\\/g, '/') + '/',
    cMapUrl: path.join(root, 'cmaps').replace(/\\/g, '/') + '/',
    cMapPacked: true,
    verbosity: 0,
  });
  try {
    const pdf = await task.promise;
    if (pdf.numPages > 500) throw new Error('Please split PDFs over 500 pages before extracting text.');
    const lines: string[] = [];
    let characters = 0;
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      let line = '';
      let lastY: number | undefined;
      let lastEnd = 0;
      const flush = () => { if (line.trim()) lines.push(line.trim()); line = ''; };
      for (const item of content.items) {
        if (!('str' in item)) continue;
        const [,,, fontHeight, x, y] = item.transform;
        if (lastY !== undefined && Math.abs(y - lastY) > Math.max(2, Math.abs(fontHeight) * 0.4)) flush();
        const gap = x - lastEnd;
        if (line && gap > Math.max(8, Math.abs(fontHeight))) line += '\t';
        else if (line && gap > 1 && !/\s$/.test(line) && !/^\s/.test(item.str)) line += ' ';
        line += item.str.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
        characters += item.str.length;
        if (characters > 2_000_000) throw new Error('Too much text to process at once. Please split this PDF.');
        lastY = y;
        lastEnd = x + item.width;
        if (item.hasEOL) flush();
      }
      flush();
      page.cleanup();
    }
    return lines;
  } finally {
    await task.destroy();
  }
}
