import { apiError } from '@/lib/api-response';
import { runGhostscriptWithFallback } from '@/lib/ghostscript';
import { openEditablePdf, pdfBinaryResponse, sanitizeDownloadFileName } from '@/lib/pdf-api';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let tempInputPath = '';
  let tempOutputPath = '';

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    const opened = await openEditablePdf(file);
    if (!opened.ok) return opened.response;
    const { buffer } = opened;

    const randId = crypto.randomBytes(8).toString('hex');
    tempInputPath = path.join(os.tmpdir(), `cmyk-in-${randId}.pdf`);
    tempOutputPath = path.join(os.tmpdir(), `cmyk-out-${randId}.pdf`);

    await fs.promises.writeFile(tempInputPath, buffer);

    const gsArgs = [
      '-sDEVICE=pdfwrite',
      '-sColorConversionStrategy=CMYK',
      '-dProcessColorModel=/DeviceCMYK',
      '-dCompatibilityLevel=1.4',
      '-dNOPAUSE',
      '-dBATCH',
      '-dQUIET',
      '-dSAFER',
      `-sOutputFile=${tempOutputPath}`,
      tempInputPath,
    ];

    let processedBytes: Buffer | Uint8Array | null = null;

    try {
      await runGhostscriptWithFallback(gsArgs, {
        timeoutMs: 45_000,
        timeoutMessage: 'CMYK prepress conversion timed out.',
      });

      if (fs.existsSync(tempOutputPath)) {
        processedBytes = await fs.promises.readFile(tempOutputPath);
      }
    } catch (gsError) {
      console.warn('Ghostscript CMYK conversion failed:', gsError);
    }

    if (!processedBytes || processedBytes.length === 0) {
      return apiError(
        'CMYK prepress conversion requires Ghostscript which is temporarily unavailable on this server. Please try again shortly.',
        503
      );
    }

    const baseName = file?.name ? file.name.replace(/\.pdf$/i, '') : 'document';
    const fileName = `${sanitizeDownloadFileName(baseName)}-cmyk.pdf`;

    return pdfBinaryResponse(processedBytes, fileName, {
      'x-color-space': 'DeviceCMYK',
    });
  } catch (error) {
    console.error('CMYK PDF error:', error);
    return apiError(error instanceof Error ? error.message : 'Failed to convert PDF to CMYK', 500);
  } finally {
    if (tempInputPath && fs.existsSync(tempInputPath)) {
      try { await fs.promises.unlink(tempInputPath); } catch { /* Best-effort temporary file cleanup. */ }
    }
    if (tempOutputPath && fs.existsSync(tempOutputPath)) {
      try { await fs.promises.unlink(tempOutputPath); } catch { /* Best-effort temporary file cleanup. */ }
    }
  }
}
