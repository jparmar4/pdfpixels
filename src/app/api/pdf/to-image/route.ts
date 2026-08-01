import { apiError } from '@/lib/api-response';
import {
  loadPdfWithTimeout,
  parsePageSelection,
  readAndValidatePdfFile,
  validatePdfUpload,
  PDF_MAX_FILE_SIZE,
} from '@/lib/pdf-api';
import { runGhostscriptWithFallback } from '@/lib/ghostscript';

export const maxDuration = 60;
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const CACHE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
};

const MAX_PAGES = 10;
const MAX_TOTAL_IMAGE_BYTES = 20 * 1024 * 1024;

export const runtime = 'nodejs';

async function renderPdfPageWithGhostscript(
  inputPath: string,
  outputPath: string,
  pageNumber: number,
  dpi: number,
  format: 'jpg' | 'png' | 'webp',
) {
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
    '-dSAFER',
    `-sOutputFile=${outputPath}`,
    inputPath,
  ];

  await runGhostscriptWithFallback(args, {
    timeoutMs: 30_000,
    timeoutMessage: 'Rasterization timed out.',
  });
}

export async function POST(request: NextRequest) {
  let inputPath = '';

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const format = (formData.get('format') as string) || 'jpg';
    const quality = parseInt(formData.get('quality') as string) || 90;
    const dpi = parseInt(formData.get('dpi') as string) || 150;
    const pagesParam = (formData.get('pages') as string) || 'all';

    const validation = validatePdfUpload(file, { maxBytes: PDF_MAX_FILE_SIZE });
    if (!validation.ok) return validation.response;

    const read = await readAndValidatePdfFile(file!);
    if (!read.ok) return read.response;

    const safeFormat = ['jpg', 'png', 'webp'].includes(format) ? (format as 'jpg' | 'png' | 'webp') : 'jpg';
    const safeQuality = Math.min(100, Math.max(30, quality));
    const safeDpi = Math.min(300, Math.max(72, dpi));

    const pdfBytes = new Uint8Array(read.buffer);
    const pdf = await loadPdfWithTimeout(pdfBytes);
    const totalPages = pdf.getPageCount();

    const selected = parsePageSelection(pagesParam, totalPages);
    const requestedPages = selected.length;
    const pageIndices = selected.slice(0, MAX_PAGES);

    if (pageIndices.length === 0) {
      return apiError('No valid PDF pages selected.', 400);
    }

    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip();
    let totalImageBytes = 0;
    let convertedPages = 0;

    const tempDir = os.tmpdir();
    const id = crypto.randomUUID();
    inputPath = path.join(tempDir, `${id}.pdf`);
    fs.writeFileSync(inputPath, read.buffer);

    try {
      for (const idx of pageIndices) {
        const outputPath = path.join(
          tempDir,
          `${id}-page-${idx + 1}.${safeFormat === 'webp' ? 'jpg' : safeFormat}`,
        );

        try {
          await renderPdfPageWithGhostscript(inputPath, outputPath, idx + 1, safeDpi, safeFormat);

          const rawBuffer = fs.readFileSync(outputPath);
          let finalBuffer = Buffer.from(rawBuffer);

          if (safeFormat === 'webp') {
            finalBuffer = Buffer.from(await sharp(finalBuffer).webp({ quality: safeQuality }).toBuffer());
          } else if (safeFormat === 'jpg') {
            finalBuffer = Buffer.from(
              await sharp(finalBuffer)
                .jpeg({ quality: safeQuality, mozjpeg: false, chromaSubsampling: '4:4:4' })
                .toBuffer(),
            );
          }

          totalImageBytes += finalBuffer.length;
          if (totalImageBytes > MAX_TOTAL_IMAGE_BYTES) {
            break;
          }

          zip.addFile(`page-${idx + 1}.${safeFormat}`, finalBuffer);
          convertedPages++;
        } finally {
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        }
      }
    } finally {
      if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      inputPath = '';
    }

    if (convertedPages === 0) {
      return apiError(
        'Could not convert any pages. The PDF may be too large, unsupported, or Ghostscript is unavailable.',
        422,
      );
    }

    const zipBuffer = zip.toBuffer();
    const fileName = `converted-images-${Date.now()}.zip`;
    const truncated = requestedPages > convertedPages || totalPages > MAX_PAGES;

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        ...CACHE_HEADERS,
        'X-Total-Pages': String(totalPages),
        'X-Requested-Pages': String(requestedPages),
        'X-Converted-Pages': String(convertedPages),
        'X-Format': safeFormat,
        'X-Dpi': String(safeDpi),
        'X-Truncated': String(truncated),
        'X-Max-Pages': String(MAX_PAGES),
      },
    });
  } catch (error) {
    console.error('PDF to image error:', error);
    if (inputPath && fs.existsSync(inputPath)) {
      try {
        fs.unlinkSync(inputPath);
      } catch {
        // ignore cleanup errors
      }
    }
    const details = error instanceof Error ? error.message : 'Unknown error';
    const status = details.includes('Ghostscript is not available') ? 503 : 500;
    return NextResponse.json(
      { error: 'Failed to convert PDF to images', details },
      { status, headers: CACHE_HEADERS },
    );
  }
}
