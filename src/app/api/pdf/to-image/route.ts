import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const CACHE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
};

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_PAGES = 10;
const MAX_TOTAL_IMAGE_BYTES = 20 * 1024 * 1024;

export const runtime = 'nodejs';

function getGhostscriptCandidates() {
  const configured = process.env.GHOSTSCRIPT_PATH?.trim();

  if (os.platform() !== 'win32') {
    return [configured, 'gs'].filter(Boolean) as string[];
  }

  const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const gsRoot = path.join(programFiles, 'gs');
  const discovered: string[] = [];

  if (fs.existsSync(gsRoot)) {
    for (const dir of fs.readdirSync(gsRoot)) {
      const exePath = path.join(gsRoot, dir, 'bin', 'gswin64c.exe');
      if (fs.existsSync(exePath)) {
        discovered.push(exePath);
      }
    }
  }

  return [
    configured,
    ...discovered.sort().reverse(),
    'C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.04.0\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.03.1\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.02.1\\bin\\gswin64c.exe',
    'gswin64c',
    'gswin32c',
    'gs',
  ].filter(Boolean) as string[];
}

function runGhostscript(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn(command, args);
    let stderr = '';
    const timeout = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('Rasterization timed out.'));
    }, 30_000);

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr.trim() || `Ghostscript failed with exit code ${code}`));
    });
  });
}

async function renderPdfPageWithGhostscript(inputPath: string, outputPath: string, pageNumber: number, dpi: number, format: 'jpg' | 'png' | 'webp') {
  const device = format === 'png' ? 'png16m' : 'jpeg';
  const args = [
    `-sDEVICE=${device}`,
    `-r${dpi}`,
    '-dTextAlphaBits=4',
    '-dGraphicsAlphaBits=4',
    '-dDOINTERPOLATE',
    '-dUseCropBox',
    `-dFirstPage=${pageNumber}`,
    `-dLastPage=${pageNumber}`,
    '-dNOPAUSE',
    '-dQUIET',
    '-dBATCH',
    `-sOutputFile=${outputPath}`,
    inputPath,
  ];

  let lastError: Error | NodeJS.ErrnoException | null = null;

  for (const candidate of getGhostscriptCandidates()) {
    try {
      await runGhostscript(candidate, args);
      return;
    } catch (error) {
      lastError = error as Error | NodeJS.ErrnoException;
      const errno = lastError as NodeJS.ErrnoException;
      const message = String(lastError.message || '');
      if (errno.code === 'ENOENT' || message.includes('not recognized') || message.includes('spawn')) {
        continue;
      }
      throw lastError;
    }
  }

  throw lastError ?? new Error('Ghostscript is not available in the current environment.');
}

export async function POST(request: NextRequest) {
  let inputPath = '';

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const format = (formData.get('format') as string) || 'jpg';
    const quality = parseInt(formData.get('quality') as string) || 90;
    const dpi = parseInt(formData.get('dpi') as string) || 150;
    const pagesParam = (formData.get('pages') as string) || 'all';

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400, headers: CACHE_HEADERS });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (25MB max).' }, { status: 400, headers: CACHE_HEADERS });
    }

    if (file.type && file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported.' }, { status: 400, headers: CACHE_HEADERS });
    }

    const safeFormat = ['jpg', 'png', 'webp'].includes(format) ? (format as 'jpg' | 'png' | 'webp') : 'jpg';
    const safeQuality = Math.min(100, Math.max(30, quality));
    const safeDpi = Math.min(300, Math.max(72, dpi));

    const arrayBuffer = await file.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);
    const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const totalPages = pdf.getPageCount();

    let pageIndices: number[] = [];
    if (pagesParam === 'all') {
      pageIndices = Array.from({ length: totalPages }, (_, i) => i);
    } else {
      const parts = pagesParam.split(',');
      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;

        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map((n) => parseInt(n.trim(), 10));
          if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
          for (let i = start - 1; i < end && i < totalPages; i++) {
            if (i >= 0) pageIndices.push(i);
          }
        } else {
          const idx = parseInt(trimmed, 10) - 1;
          if (idx >= 0 && idx < totalPages) pageIndices.push(idx);
        }
      }
    }

    const requestedPages = pageIndices.length;
    pageIndices = [...new Set(pageIndices)].slice(0, MAX_PAGES);

    if (pageIndices.length === 0) {
      return NextResponse.json({ error: 'No valid PDF pages selected.' }, { status: 400, headers: CACHE_HEADERS });
    }

    const images: { pageNumber: number; imageUrl: string; width: number; height: number; size: number }[] = [];
    let totalImageBytes = 0;

    const tempDir = os.tmpdir();
    const id = crypto.randomUUID();
    inputPath = path.join(tempDir, `${id}.pdf`);
    fs.writeFileSync(inputPath, Buffer.from(pdfBytes));

    try {
      for (const idx of pageIndices) {
        const outputPath = path.join(tempDir, `${id}-page-${idx + 1}.${safeFormat === 'webp' ? 'jpg' : safeFormat}`);

        try {
          await renderPdfPageWithGhostscript(inputPath, outputPath, idx + 1, safeDpi, safeFormat);

          const rawBuffer = fs.readFileSync(outputPath);
          let finalBuffer = Buffer.from(rawBuffer);

          if (safeFormat === 'webp') {
            finalBuffer = Buffer.from(await sharp(finalBuffer).webp({ quality: safeQuality }).toBuffer());
          } else if (safeFormat === 'jpg') {
            finalBuffer = Buffer.from(await sharp(finalBuffer).jpeg({ quality: safeQuality, mozjpeg: false, chromaSubsampling: '4:4:4' }).toBuffer());
          }

          totalImageBytes += finalBuffer.length;
          if (totalImageBytes > MAX_TOTAL_IMAGE_BYTES) {
            fs.unlinkSync(outputPath);
            break;
          }

          const metadata = await sharp(finalBuffer).metadata();
          const mimeType = safeFormat === 'png' ? 'image/png' : safeFormat === 'webp' ? 'image/webp' : 'image/jpeg';

          images.push({
            pageNumber: idx + 1,
            imageUrl: `data:${mimeType};base64,${finalBuffer.toString('base64')}`,
            width: metadata.width || 0,
            height: metadata.height || 0,
            size: finalBuffer.length,
          });
        } finally {
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        }
      }
    } finally {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    }

    return NextResponse.json(
      {
        success: true,
        totalPages,
        requestedPages,
        convertedPages: images.length,
        format: safeFormat,
        dpi: safeDpi,
        truncated: requestedPages > images.length,
        images,
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error('PDF to image error:', error);
    const details = error instanceof Error ? error.message : 'Unknown error';
    const status = details.includes('Ghostscript is not available') ? 503 : 500;
    return NextResponse.json(
      { error: 'Failed to convert PDF to images', details },
      { status, headers: CACHE_HEADERS }
    );
  }
}