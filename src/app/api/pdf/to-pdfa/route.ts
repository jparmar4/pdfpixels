import { apiError, apiInternalError } from '@/lib/api-response';
import {
  runGhostscriptWithFallbackResult,
  sanitizeGhostscriptDiagnostics,
} from '@/lib/ghostscript';
import { openEditablePdf, pdfBinaryResponse, sanitizeDownloadFileName } from '@/lib/pdf-api';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export const maxDuration = 60;
export const runtime = 'nodejs';

/**
 * Standard Artifex Software sRGB ICC Profile (2,576 bytes).
 * Embedded directly to guarantee PDF/A OutputIntent compliance across any environment
 * (Docker, standalone build, cloud host) without runtime filesystem discovery or
 * Turbopack NFT root tracing side-effects.
 */
const BUILTIN_SRGB_ICC_BASE64 =
  'AAAKEAAAAAACEAAAbW50clJHQiBYWVogAAAAAAAAAAAAAAAAYWNzcEFQUEwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPbWAAEAAAAA' +
  '0y0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKZGVzYwAAAPwAAAB8Y3BydAAAAXgAAAAo' +
  'd3RwdAAAAaAAAAAUYmtwdAAAAbQAAAAUclhZWgAAAcgAAAAUZ1hZWgAAAdwAAAAUYlhZWgAAAfAAAAAUclRSQwAAAgQAAAgMZ1RSQwAA' +
  'AgQAAAgMYlRSQwAAAgQAAAgMZGVzYwAAAAAAAAAiQXJ0aWZleCBTb2Z0d2FyZSBzUkdCIElDQyBQcm9maWxlAAAAAAAAAAAAAAAiQXJ0' +
  'aWZleCBTb2Z0d2FyZSBzUkdCIElDQyBQcm9maWxlAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHRleHQAAAAAQ29weXJp' +
  'Z2h0IEFydGlmZXggU29mdHdhcmUgMjAxMQBYWVogAAAAAAAA81EAAQAAAAEWzFhZWiAAAAAAAAAAAAAAAAAAAAAAWFlaIAAAAAAAAG+i' +
  'AAA49QAAA5BYWVogAAAAAAAAYpkAALeFAAAY2lhZWiAAAAAAAAAkoAAAD4QAALbPY3VydgAAAAAAAAQAAAAABQAKAA8AFAAZAB4AIwAo' +
  'AC0AMgA3ADsAQABFAEoATwBUAFkAXgBjAGgAbQByAHcAfACBAIYAiwCQAJUAmgCfAKQAqQCuALIAtwC8AMEAxgDLANAA1QDbAOAA5QDr' +
  'APAA9gD7AQEBBwENARMBGQEfASUBKwEyATgBPgFFAUwBUgFZAWABZwFuAXUBfAGDAYsBkgGaAaEBqQGxAbkBwQHJAdEB2QHhAekB8gH6' +
  'AgMCDAIUAh0CJgIvAjgCQQJLAlQCXQJnAnECegKEAo4CmAKiAqwCtgLBAssC1QLgAusC9QMAAwsDFgMhAy0DOANDA08DWgNmA3IDfgOK' +
  'A5YDogOuA7oDxwPTA+AD7AP5BAYEEwQgBC0EOwRIBFUEYwRxBH4EjASaBKgEtgTEBNME4QTwBP4FDQUcBSsFOgVJBVgFZwV3BYYFlgWm' +
  'BbUFxQXVBeUF9gYGBhYGJwY3BkgGWQZqBnsGjAadBq8GwAbRBuMG9QcHBxkHKwc9B08HYQd0B4YHmQesB78H0gflB/gICwgfCDIIRgha' +
  'CG4IggiWCKoIvgjSCOcI+wkQCSUJOglPCWQJeQmPCaQJugnPCeUJ+woRCicKPQpUCmoKgQqYCq4KxQrcCvMLCwsiCzkLUQtpC4ALmAuw' +
  'C8gL4Qv5DBIMKgxDDFwMdQyODKcMwAzZDPMNDQ0mDUANWg10DY4NqQ3DDd4N+A4TDi4OSQ5kDn8Omw62DtIO7g8JDyUPQQ9eD3oPlg+z' +
  'D88P7BAJECYQQxBhEH4QmxC5ENcQ9RETETERTxFtEYwRqhHJEegSBxImEkUSZBKEEqMSwxLjEwMTIxNDE2MTgxOkE8UT5RQGFCcUSRRq' +
  'FIsUrRTOFPAVEhU0FVYVeBWbFb0V4BYDFiYWSRZsFo8WshbWFvoXHRdBF2UXiReuF9IX9xgbGEAYZRiKGK8Y1Rj6GSAZRRlrGZEZtxnd' +
  'GgQaKhpRGncanhrFGuwbFBs7G2MbihuyG9ocAhwqHFIcexyjHMwc9R0eHUcdcB2ZHcMd7B4WHkAeah6UHr4e6R8THz4faR+UH78f6iAV' +
  'IEEgbCCYIMQg8CEcIUghdSGhIc4h+yInIlUigiKvIt0jCiM4I2YjlCPCI/AkHyRNJHwkqyTaJQklOCVoJZclxyX3JicmVyaHJrcm6CcY' +
  'J0kneierJ9woDSg/KHEooijUKQYpOClrKZ0p0CoCKjUqaCqbKs8rAis2K2krnSvRLAUsOSxuLKIs1y0MLUEtdi2rLeEuFi5MLoIuty7u' +
  'LyQvWi+RL8cv/jA1MGwwpDDbMRIxSjGCMbox8jIqMmMymzLUMw0zRjN/M7gz8TQrNGU0njTYNRM1TTWHNcI1/TY3NnI2rjbpNyQ3YDec' +
  'N9c4FDhQOIw4yDkFOUI5fzm8Ofk6Njp0OrI67zstO2s7qjvoPCc8ZTykPOM9Ij1hPaE94D4gPmA+oD7gPyE/YT+iP+JAI0BkQKZA50Ep' +
  'QWpBrEHuQjBCckK1QvdDOkN9Q8BEA0RHRIpEzkUSRVVFmkXeRiJGZ0arRvBHNUd7R8BIBUhLSJFI10kdSWNJqUnwSjdKfUrESwxLU0ua' +
  'S+JMKkxyTLpNAk1KTZNN3E4lTm5Ot08AT0lPk0/dUCdQcVC7UQZRUFGbUeZSMVJ8UsdTE1NfU6pT9lRCVI9U21UoVXVVwlYPVlxWqVb3' +
  'V0RXklfgWC9YfVjLWRpZaVm4WgdaVlqmWvVbRVuVW+VcNVyGXNZdJ114XcleGl5sXr1fD19hX7NgBWBXYKpg/GFPYaJh9WJJYpxi8GND' +
  'Y5dj62RAZJRk6WU9ZZJl52Y9ZpJm6Gc9Z5Nn6Wg/aJZo7GlDaZpp8WpIap9q92tPa6dr/2xXbK9tCG1gbbluEm5rbsRvHm94b9FwK3CG' +
  'cOBxOnGVcfByS3KmcwFzXXO4dBR0cHTMdSh1hXXhdj52m3b4d1Z3s3gReG54zHkqeYl553pGeqV7BHtje8J8IXyBfOF9QX2hfgF+Yn7C' +
  'fyN/hH/lgEeAqIEKgWuBzYIwgpKC9INXg7qEHYSAhOOFR4Wrhg6GcobXhzuHn4gEiGmIzokziZmJ/opkisqLMIuWi/yMY4zKjTGNmI3/' +
  'jmaOzo82j56QBpBukNaRP5GokhGSepLjk02TtpQglIqU9JVflcmWNJaflwqXdZfgmEyYuJkkmZCZ/JpomtWbQpuvnByciZz3nWSd0p5A' +
  'nq6fHZ+Ln/qgaaDYoUehtqImopajBqN2o+akVqTHpTilqaYapoum/adup+CoUqjEqTepqaocqo+rAqt1q+msXKzQrUStuK4trqGvFq+L' +
  'sACwdbDqsWCx1rJLssKzOLOutCW0nLUTtYq2AbZ5tvC3aLfguFm40blKucK6O7q1uy67p7whvJu9Fb2Pvgq+hL7/v3q/9cBwwOzBZ8Hj' +
  'wl/C28NYw9TEUcTOxUvFyMZGxsPHQce/yD3IvMk6ybnKOMq3yzbLtsw1zLXNNc21zjbOts83z7jQOdC60TzRvtI/0sHTRNPG1EnUy9VO' +
  '1dHWVdbY11zX4Nhk2OjZbNnx2nba+9uA3AXcit0Q3ZbeHN6i3ynfr+A24L3hROHM4lPi2+Nj4+vkc+T85YTmDeaW5x/nqegy6LzpRunQ' +
  '6lvq5etw6/vshu0R7ZzuKO6070DvzPBY8OXxcvH/8ozzGfOn9DT0wvVQ9d72bfb794r4Gfio+Tj5x/pX+uf7d/wH/Jj9Kf26/kv+3P9t' +
  '//8=';

let cachedProfileBytes: Buffer | null | undefined;
let cachedProfileHex: string | null | undefined;

function resolveProfileBytes(): Buffer | null {
  if (cachedProfileBytes !== undefined) return cachedProfileBytes;

  const customProfile = process.env.PDFA_ICC_PROFILE?.trim();
  if (customProfile) {
    try {
      if (fs.existsSync(customProfile)) {
        cachedProfileBytes = fs.readFileSync(customProfile);
        return cachedProfileBytes;
      }
    } catch {
      // Fall back to builtin profile
    }
  }

  cachedProfileBytes = Buffer.from(BUILTIN_SRGB_ICC_BASE64, 'base64');
  return cachedProfileBytes;
}

function resolveProfileHex(profileBytes: Buffer): string {
  if (cachedProfileHex === undefined || cachedProfileHex === null) {
    // ~300KB ICC → ~600KB hex; compute once per process instead of per request.
    cachedProfileHex = profileBytes.toString('hex').toUpperCase();
  }
  return cachedProfileHex;
}

export async function POST(request: NextRequest) {
  let tempInputPath = '';
  let tempOutputPath = '';
  let definitionPath = '';

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const conformance = (formData.get('conformance') as string) || '2b'; // 1b or 2b

    const opened = await openEditablePdf(file);
    if (!opened.ok) return opened.response;
    const { buffer } = opened;
    if (!['1b', '2b'].includes(conformance)) return apiError('Choose PDF/A-1b or PDF/A-2b.', 400);

    const randId = crypto.randomBytes(8).toString('hex');
    tempInputPath = path.join(os.tmpdir(), `pdfa-in-${randId}.pdf`);
    tempOutputPath = path.join(os.tmpdir(), `pdfa-out-${randId}.pdf`);

    await fs.promises.writeFile(tempInputPath, buffer);

    const pdfaLevel = conformance === '1b' ? '1' : '2';

    const profileBytes = resolveProfileBytes();
    if (!profileBytes) return apiError('PDF/A needs an sRGB ICC profile on this server. Configure PDFA_ICC_PROFILE.', 503);
    // Embed the profile bytes directly in the pdfmark as a hex string so gs
    // never reads the filesystem for it (no --permit-file-read needed, works
    // under -dSAFER and on hosts where the profile path differs).
    const profileHex = resolveProfileHex(profileBytes);
    definitionPath = path.join(os.tmpdir(), `pdfa-def-${randId}.ps`);
    await fs.promises.writeFile(definitionPath, `%!
[/_objdef {icc_PDFA} /type /stream /OBJ pdfmark
[{icc_PDFA} << /N 3 >> /PUT pdfmark
[{icc_PDFA} <${profileHex}> /PUT pdfmark
[/_objdef {OutputIntent_PDFA} /type /dict /OBJ pdfmark
[{OutputIntent_PDFA} << /Type /OutputIntent /S /GTS_PDFA1 /DestOutputProfile {icc_PDFA} /OutputConditionIdentifier (sRGB) >> /PUT pdfmark
[{Catalog} << /OutputIntents [{OutputIntent_PDFA}] >> /PUT pdfmark
`);
    const gsArgs = [
      '-sDEVICE=pdfwrite',
      `-dPDFA=${pdfaLevel}`,
      '-dPDFACompatibilityPolicy=2',
      '-sColorConversionStrategy=RGB',
      '-dProcessColorModel=/DeviceRGB',
      `-dCompatibilityLevel=${pdfaLevel === '1' ? '1.4' : '1.7'}`,
      '-dNOPAUSE',
      '-dBATCH',
      '-dQUIET',
      '-dSAFER',
      `-sOutputFile=${tempOutputPath}`,
      definitionPath,
      tempInputPath,
    ];

    let processedBytes: Buffer | Uint8Array | null = null;
    let gsOutput = '';

    try {
      const gsResult = await runGhostscriptWithFallbackResult(gsArgs, {
        timeoutMs: 45_000,
        timeoutMessage: 'PDF/A conversion timed out.',
      });
      gsOutput = [gsResult.stderr, gsResult.stdout].filter(Boolean).join('\n');

      if (fs.existsSync(tempOutputPath)) {
        processedBytes = await fs.promises.readFile(tempOutputPath);
      }
    } catch (gsError) {
      gsOutput = gsError instanceof Error ? gsError.message : String(gsError);
      console.warn('Ghostscript PDF/A conversion failed:', gsError);
    }

    if (!processedBytes || processedBytes.length === 0) {
      // Full diagnostics server-side, sanitized short slice to the client.
      console.error('Ghostscript PDF/A conversion produced no output.', gsOutput.slice(0, 4000));
      const detail = sanitizeGhostscriptDiagnostics(gsOutput);
      return apiError(
        `PDF/A conversion requires Ghostscript which is not available on this server. Please try again later.${detail ? ` (${detail})` : ''}`,
        503
      );
    }

    const baseName = file?.name ? file.name.replace(/\.pdf$/i, '') : 'document';
    const fileName = `${baseName}-pdfa.pdf`;

    return pdfBinaryResponse(processedBytes, sanitizeDownloadFileName(fileName), {
      'x-pdfa-conformance': `PDF/A-${pdfaLevel}b`,
    });
  } catch (error) {
    return apiInternalError(error, 'Failed to convert PDF to PDF/A', 'PDF to PDF/A error');
  } finally {
    if (definitionPath) { try { await fs.promises.unlink(definitionPath); } catch { /* Best-effort temporary file cleanup. */ } }
    if (tempInputPath && fs.existsSync(tempInputPath)) {
      try { await fs.promises.unlink(tempInputPath); } catch { /* Best-effort temporary file cleanup. */ }
    }
    if (tempOutputPath && fs.existsSync(tempOutputPath)) {
      try { await fs.promises.unlink(tempOutputPath); } catch { /* Best-effort temporary file cleanup. */ }
    }
  }
}
