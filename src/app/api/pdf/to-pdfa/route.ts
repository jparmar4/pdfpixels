import { apiError } from '@/lib/api-response';
import { runGhostscriptWithFallback, getGhostscriptCandidates } from '@/lib/ghostscript';
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

    const candidates = [
      process.env.PDFA_ICC_PROFILE,
      ...getGhostscriptCandidates().filter(p => path.isAbsolute(p)).map(p => path.resolve(path.dirname(p), '..', 'iccprofiles', 'srgb.icc')),
      '/usr/share/color/icc/ghostscript/srgb.icc',
      '/usr/share/ghostscript/iccprofiles/srgb.icc',
    ];
    const profile = candidates.find(p => p && fs.existsSync(p));
    if (!profile) return apiError('PDF/A needs an sRGB ICC profile on this server. Configure PDFA_ICC_PROFILE.', 503);
    const profilePath = path.resolve(profile).replace(/\\/g, '/');
    const psPath = profilePath.replace(/([()\\])/g, '\\$1');
    definitionPath = path.join(os.tmpdir(), `pdfa-def-${randId}.ps`);
    await fs.promises.writeFile(definitionPath, `%!
[/_objdef {icc_PDFA} /type /stream /OBJ pdfmark
[{icc_PDFA} << /N 3 >> /PUT pdfmark
[{icc_PDFA} (${psPath}) (r) file /PUT pdfmark
[/_objdef {OutputIntent_PDFA} /type /dict /OBJ pdfmark
[{OutputIntent_PDFA} << /Type /OutputIntent /S /GTS_PDFA1 /DestOutputProfile {icc_PDFA} /OutputConditionIdentifier (sRGB) >> /PUT pdfmark
[{Catalog} << /OutputIntents [{OutputIntent_PDFA}] >> /PUT pdfmark
`);
    const gsArgs = ['--permit-file-read=' + profilePath,
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

    try {
      await runGhostscriptWithFallback(gsArgs, {
        timeoutMs: 45_000,
        timeoutMessage: 'PDF/A conversion timed out.',
      });

      if (fs.existsSync(tempOutputPath)) {
        processedBytes = await fs.promises.readFile(tempOutputPath);
      }
    } catch (gsError) {
      console.warn('Ghostscript PDF/A conversion failed:', gsError);
    }

    if (!processedBytes || processedBytes.length === 0) {
      return apiError(
        'PDF/A conversion requires Ghostscript which is not available on this server. Please try again later.',
        503
      );
    }

    const baseName = file?.name ? file.name.replace(/\.pdf$/i, '') : 'document';
    const fileName = `${baseName}-pdfa.pdf`;

    return pdfBinaryResponse(processedBytes, sanitizeDownloadFileName(fileName), {
      'x-pdfa-conformance': `PDF/A-${pdfaLevel}b`,
    });
  } catch (error) {
    console.error('PDF to PDF/A error:', error);
    return apiError(error instanceof Error ? error.message : 'Failed to convert PDF to PDF/A', 500);
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
