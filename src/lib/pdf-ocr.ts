import { spawn } from 'child_process';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { runGhostscriptWithFallback } from './ghostscript';

function tesseractCandidates(): string[] {
  const configured = process.env.TESSERACT_PATH?.trim();
  const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
  return [configured, 'tesseract', path.join(programFiles, 'Tesseract-OCR', 'tesseract.exe')].filter(
    (value): value is string => Boolean(value),
  );
}

function runTesseract(command: string, imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, [imagePath, 'stdout', '-l', 'eng', '--psm', '6'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    const finish = (error?: Error, text?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(text ?? '');
    };
    const timer = setTimeout(() => {
      proc.kill();
      finish(new Error('OCR timed out.'));
    }, 20_000);
    proc.stdout?.on('data', (chunk) => {
      stdout += String(chunk);
      if (stdout.length > 500_000) stdout = stdout.slice(-500_000);
    });
    proc.stderr?.on('data', (chunk) => {
      stderr += String(chunk);
    });
    proc.on('error', (error) => finish(error));
    proc.on('close', (code) => {
      if (code === 0) finish(undefined, stdout);
      else finish(new Error(stderr.trim() || `tesseract exited with code ${code}`));
    });
  });
}

async function readImageText(imagePath: string): Promise<string | null> {
  let sawBinary = false;
  for (const candidate of tesseractCandidates()) {
    try {
      return await runTesseract(candidate, imagePath);
    } catch (error) {
      const code =
        typeof error === 'object' && error && 'code' in error
          ? String((error as { code?: string }).code)
          : '';
      if (code === 'ENOENT') continue;
      sawBinary = true;
      console.error('Tesseract page failed:', error);
      return '';
    }
  }

  // Fall back to pure JS/WASM tesseract.js if native binary is unavailable
  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');
    const ret = await worker.recognize(imagePath);
    await worker.terminate();
    return ret?.data?.text ?? '';
  } catch (error) {
    console.error('Tesseract.js fallback failed:', error);
  }

  return sawBinary ? '' : null;
}

export async function ocrPdfLines(pdf: Buffer, maxPages = 5): Promise<string[]> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'pdfpixels-ocr-'));
  try {
    const input = path.join(dir, 'input.pdf');
    await writeFile(input, pdf);
    try {
      await runGhostscriptWithFallback(
        [
          '-dSAFER',
          '-dBATCH',
          '-dNOPAUSE',
          '-dQUIET',
          '-sDEVICE=png16m',
          '-r200',
          '-dTextAlphaBits=4',
          '-dGraphicsAlphaBits=4',
          '-dUseCropBox',
          `-dLastPage=${maxPages}`,
          `-sOutputFile=${path.join(dir, 'page-%03d.png')}`,
          input,
        ],
        { timeoutMs: 40_000, timeoutMessage: 'OCR rasterization timed out.' },
      );
    } catch (error) {
      console.error('OCR rasterization failed:', error);
      return [];
    }

    const files = (await readdir(dir)).filter((name) => /^page-\d+\.png$/.test(name)).sort();
    const lines: string[] = [];
    for (const file of files) {
      const text = await readImageText(path.join(dir, file));
      if (text === null) return [];
      for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed) lines.push(trimmed);
        if (lines.length >= 5000) return lines;
      }
    }
    return lines;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

export type OcrPdfPageResult = {
  /** Text of each OCR'd page, in page order. Empty string = nothing recognized. */
  pages: { pageNumber: number; text: string }[];
  /** Total pages in the source PDF (may exceed pages.length when truncated). */
  totalPages: number;
  /** True when the run stopped before the document's last page. */
  truncated: boolean;
  /** True when tesseract was unavailable or every page failed. */
  unavailable: boolean;
};

/**
 * OCR a scanned PDF page-by-page under a wall-clock budget.
 * Unlike ocrPdfLines (a fixed small page probe used as a fallback inside
 * conversion routes), this keeps per-page text separate so the OCR PDF tool
 * can paginate output, and stops cleanly when the time budget runs out
 * instead of blowing the function deadline.
 */
export async function ocrPdfPages(
  pdf: Buffer,
  options: { maxPages?: number; budgetMs?: number } = {},
): Promise<OcrPdfPageResult> {
  const maxPages = Math.max(1, Math.min(options.maxPages ?? 10, 25));
  const budgetMs = options.budgetMs ?? 40_000;
  const startedAt = Date.now();

  const dir = await mkdtemp(path.join(os.tmpdir(), 'pdfpixels-ocr-pages-'));
  try {
    let totalPages = maxPages;
    try {
      const { PDFDocument } = await import('pdf-lib');
      totalPages = (await PDFDocument.load(pdf, { ignoreEncryption: true })).getPageCount();
    } catch {
      // Page count is only used for the truncation note; fall through to OCR.
    }

    const input = path.join(dir, 'input.pdf');
    await writeFile(input, pdf);
    try {
      await runGhostscriptWithFallback(
        [
          '-dSAFER', '-dBATCH', '-dNOPAUSE', '-dQUIET', '-sDEVICE=png16m',
          '-r200', '-dTextAlphaBits=4', '-dGraphicsAlphaBits=4', '-dUseCropBox',
          `-dLastPage=${maxPages}`,
          `-sOutputFile=${path.join(dir, 'page-%03d.png')}`,
          input,
        ],
        { timeoutMs: 40_000, timeoutMessage: 'OCR rasterization timed out.' },
      );
    } catch (error) {
      console.error('OCR rasterization failed:', error);
      return { pages: [], totalPages, truncated: totalPages > maxPages, unavailable: true };
    }

    const files = (await readdir(dir)).filter((name) => /^page-\d+\.png$/.test(name)).sort();
    const pages: { pageNumber: number; text: string }[] = [];
    let unavailable = false;

    for (let i = 0; i < files.length; i++) {
      if (Date.now() - startedAt > budgetMs) break;
      const text = await readImageText(path.join(dir, files[i]));
      if (text === null) {
        // Tesseract binary missing — no point trying further pages.
        unavailable = true;
        break;
      }
      pages.push({ pageNumber: i + 1, text: text.trim() });
    }

    const processed = pages.length;
    return {
      pages,
      totalPages,
      truncated: processed < Math.min(totalPages, maxPages) || (totalPages > maxPages && processed === maxPages),
      unavailable,
    };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}
