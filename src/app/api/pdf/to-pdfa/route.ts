import { apiError } from '@/lib/api-response';
import {
  runGhostscriptWithFallbackResult,
  getGhostscriptCandidates,
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
 * Resolve sRGB ICC profile bytes for the PDF/A OutputIntent.
 * Prefers the profile bundled with the app (traced into the standalone build
 * via next.config.ts) so no filesystem search is needed in production; falls
 * back to host locations (Debian/Ubuntu ship gs profiles under versioned dirs)
 * only when the bundled asset is missing.
 */
let cachedProfileBytes: Buffer | null | undefined;
let cachedProfileHex: string | null | undefined;

function resolveProfileBytes(): Buffer | null {
  if (cachedProfileBytes !== undefined) return cachedProfileBytes;
  // NOTE: keep every candidate scoped inside process.cwd() — a '..' entry
  // makes Turbopack trace the whole project into the standalone output.
  // At runtime cwd is the standalone root, where ./iccprofiles is traced.
  const bundled = [
    path.join(process.cwd(), 'iccprofiles', 'srgb.icc'),
  ];
  for (const candidate of bundled) {
    try {
      if (fs.existsSync(candidate)) {
        cachedProfileBytes = fs.readFileSync(candidate);
        return cachedProfileBytes;
      }
    } catch { /* try the next candidate */ }
  }

  let versionedLinux: string[] = [];
  try {
    versionedLinux = fs.readdirSync('/usr/share/ghostscript', { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => `/usr/share/ghostscript/${d.name}/iccprofiles/srgb.icc`);
  } catch { /* not a Linux host with a versioned gs layout */ }

  const candidates = [
    process.env.PDFA_ICC_PROFILE,
    // Runtime-only host lookups — never part of the standalone trace.
    ...getGhostscriptCandidates()
      .filter((p) => path.isAbsolute(p))
      .map((p) => path.resolve(/*turbopackIgnore: true*/ path.dirname(p), '..', 'iccprofiles', 'srgb.icc')),
    '/usr/share/color/icc/ghostscript/srgb.icc',
    '/usr/share/ghostscript/iccprofiles/srgb.icc',
    ...versionedLinux,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        cachedProfileBytes = fs.readFileSync(candidate);
        return cachedProfileBytes;
      }
    } catch { /* try the next candidate */ }
  }
  cachedProfileBytes = null;
  return null;
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
