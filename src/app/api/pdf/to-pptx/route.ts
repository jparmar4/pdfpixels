import { apiError, apiInternalError } from '@/lib/api-response';
import {
  openEditablePdf,
  sanitizeDownloadFileName,
} from '@/lib/pdf-api';
import { runGhostscriptWithFallback } from '@/lib/ghostscript';
import { NextRequest, NextResponse } from 'next/server';
import { mkdtemp, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import PptxGenJS from 'pptxgenjs';

export const maxDuration = 120;
export const runtime = 'nodejs';

const MAX_SLIDES = 300;

export async function POST(request: NextRequest) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'pdfpixels-pptx-'));
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    const opened = await openEditablePdf(file);
    if (!opened.ok) return opened.response;
    const { buffer, pdf } = opened;
    const originalName = file?.name ?? 'presentation.pdf';
    const pageCount = pdf.getPageCount();
    if (pageCount > MAX_SLIDES) {
      return apiError(`PDF to PowerPoint supports up to ${MAX_SLIDES} pages. Split the document first.`, 413);
    }

    // Render every page to PNG via Ghostscript (same engine as secure rasterization).
    const input = path.join(dir, 'input.pdf');
    await writeFile(input, buffer);
    try {
      await runGhostscriptWithFallback([
        '-dSAFER', '-dBATCH', '-dNOPAUSE', '-dQUIET', '-sDEVICE=png16m',
        '-r150', '-dTextAlphaBits=4', '-dGraphicsAlphaBits=4', '-dUseCropBox',
        `-sOutputFile=${path.join(dir, 'page-%05d.png')}`, input,
      ], { timeoutMs: 90_000 });
    } catch (gsError) {
      const message = gsError instanceof Error ? gsError.message : '';
      if (/not available|ENOENT|spawn|not recognized/i.test(message)) {
        return apiError('The conversion engine is temporarily unavailable. Please try again in a few minutes.', 503);
      }
      if (/timed out|timed-out|timeout|aborted|abort/i.test(message)) {
        return apiError('Conversion timed out. Try a smaller PDF or fewer pages.', 408);
      }
      return apiError('Not every page could be rendered. The document may be damaged — try Repair PDF first.', 422);
    }
    const files = (await readdir(dir)).filter(n => /^page-\d+\.png$/.test(n)).sort();
    if (files.length !== pageCount) {
      // A render shortfall is an engine/input problem, not a bad request.
      return apiError('Not every page could be converted. The document may be damaged — try Repair PDF first.', 422);
    }

    const pptx = new PptxGenJS();
    pptx.defineLayout({ name: 'WIDE', width: 13.333, height: 7.5 });
    pptx.layout = 'WIDE';
    pptx.title = originalName.replace(/\.pdf$/i, '');

    for (const pageFile of files) {
      const png = await readFile(path.join(dir, pageFile));
      const slide = pptx.addSlide();
      slide.addImage({ data: `image/png;base64,${png.toString('base64')}`, x: 0, y: 0, w: 13.333, h: 7.5 });
    }

    const outBuffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
    const outName = sanitizeDownloadFileName(`${originalName.replace(/\.pdf$/i, '')}.pptx`);
    return new NextResponse(new Uint8Array(outBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${outName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return apiInternalError(error, 'Failed to convert PDF to PowerPoint', 'PDF to PowerPoint error');
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}
