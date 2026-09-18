import { apiError, apiInternalError } from '@/lib/api-response';
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
    tempInputPath = path.join(os.tmpdir(), `gs-in-${randId}.pdf`);
    tempOutputPath = path.join(os.tmpdir(), `gs-out-${randId}.pdf`);

    await fs.promises.writeFile(tempInputPath, buffer);

    const gsArgs = [
      '-sDEVICE=pdfwrite',
      '-sColorConversionStrategy=Gray',
      '-dProcessColorModel=/DeviceGray',
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
        timeoutMs: 40_000,
        timeoutMessage: 'Grayscale conversion timed out.',
      });

      if (fs.existsSync(tempOutputPath)) {
        processedBytes = await fs.promises.readFile(tempOutputPath);
      }
    } catch (gsError) {
      console.warn('Ghostscript grayscale failed, using pdf-lib fallback:', gsError);
    }

    if (!processedBytes || processedBytes.length === 0) {
      return apiError(
        'Grayscale conversion requires Ghostscript which is not available on this server. Please try again later.',
        503
      );
    }

    const baseName = file?.name ? file.name.replace(/\.pdf$/i, '') : 'document';
    const fileName = `${baseName}-grayscale.pdf`;

    return pdfBinaryResponse(processedBytes, sanitizeDownloadFileName(fileName));
  } catch (error) {
    return apiInternalError(error, 'Failed to convert PDF to grayscale', 'Grayscale PDF error');
  } finally {
    if (tempInputPath && fs.existsSync(tempInputPath)) {
      try { await fs.promises.unlink(tempInputPath); } catch { /* ignore cleanup errors */ }
    }
    if (tempOutputPath && fs.existsSync(tempOutputPath)) {
      try { await fs.promises.unlink(tempOutputPath); } catch { /* ignore cleanup errors */ }
    }
  }
}
