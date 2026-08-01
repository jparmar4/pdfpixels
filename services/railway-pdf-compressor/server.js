import express from 'express';
import multer from 'multer';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const PORT = process.env.PORT || 8080;
const API_TOKEN = process.env.PDF_COMPRESSOR_TOKEN || '';

/** @typedef {'extreme' | 'recommended' | 'less'} CompressionLevel */

/** @type {Record<CompressionLevel, {
 *   pdfSettings: string;
 *   colorImageResolution: number;
 *   grayImageResolution: number;
 *   monoImageResolution: number;
 *   jpegQuality: number;
 *   colorDownsampleThreshold: number;
 *   grayDownsampleThreshold: number;
 * }>} */
const compressionProfiles = {
  extreme: {
    pdfSettings: '/screen',
    colorImageResolution: 110,
    grayImageResolution: 110,
    monoImageResolution: 300,
    jpegQuality: 58,
    colorDownsampleThreshold: 1.1,
    grayDownsampleThreshold: 1.1,
  },
  recommended: {
    pdfSettings: '/ebook',
    colorImageResolution: 150,
    grayImageResolution: 150,
    monoImageResolution: 300,
    jpegQuality: 76,
    colorDownsampleThreshold: 1.2,
    grayDownsampleThreshold: 1.2,
  },
  less: {
    pdfSettings: '/printer',
    colorImageResolution: 220,
    grayImageResolution: 220,
    monoImageResolution: 400,
    jpegQuality: 88,
    colorDownsampleThreshold: 1.5,
    grayDownsampleThreshold: 1.5,
  },
};

function getCompressionProfile(level) {
  if (level === 'extreme' || level === 'less' || level === 'recommended') {
    return compressionProfiles[level];
  }
  return compressionProfiles.recommended;
}

function isPdfBuffer(buffer) {
  return buffer && buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-';
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/compress', upload.single('file'), async (req, res) => {
  let inputPath = '';
  let outputPath = '';

  try {
    const auth = req.header('x-api-token') || '';
    if (!API_TOKEN || auth !== API_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    if (file.mimetype && file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are supported' });
    }
    if (!isPdfBuffer(file.buffer)) {
      return res.status(400).json({ error: 'Invalid PDF file content' });
    }

    const level = typeof req.body?.level === 'string' ? req.body.level : 'recommended';
    const profile = getCompressionProfile(level);

    const id = crypto.randomUUID();
    inputPath = path.join(os.tmpdir(), `${id}.pdf`);
    outputPath = path.join(os.tmpdir(), `${id}-compressed.pdf`);

    fs.writeFileSync(inputPath, file.buffer);

    const args = [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.5',
      `-dPDFSETTINGS=${profile.pdfSettings}`,
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      '-dSAFER',
      '-dDetectDuplicateImages=true',
      '-dCompressFonts=true',
      '-dSubsetFonts=true',
      '-dEmbedAllFonts=true',
      '-dAutoRotatePages=/None',
      '-dDownsampleColorImages=true',
      '-dColorImageDownsampleType=/Bicubic',
      `-dColorImageResolution=${profile.colorImageResolution}`,
      `-dColorImageDownsampleThreshold=${profile.colorDownsampleThreshold}`,
      '-dDownsampleGrayImages=true',
      '-dGrayImageDownsampleType=/Bicubic',
      `-dGrayImageResolution=${profile.grayImageResolution}`,
      `-dGrayImageDownsampleThreshold=${profile.grayDownsampleThreshold}`,
      '-dDownsampleMonoImages=true',
      '-dMonoImageDownsampleType=/Subsample',
      `-dMonoImageResolution=${profile.monoImageResolution}`,
      '-dMonoImageDownsampleThreshold=1.1',
      '-dAutoFilterColorImages=false',
      '-dColorImageFilter=/DCTEncode',
      '-dAutoFilterGrayImages=false',
      '-dGrayImageFilter=/DCTEncode',
      '-dEncodeColorImages=true',
      '-dEncodeGrayImages=true',
      '-dEncodeMonoImages=true',
      `-dJPEGQ=${profile.jpegQuality}`,
      '-dPassThroughJPEGImages=false',
      '-dFastWebView=true',
      '-dOptimize=true',
      `-sOutputFile=${outputPath}`,
      inputPath,
    ];

    await new Promise((resolve, reject) => {
      const gs = spawn('gs', args);
      const timeout = setTimeout(() => {
        gs.kill('SIGKILL');
        reject(new Error('Compression timed out'));
      }, 110_000);

      gs.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) resolve(true);
        else reject(new Error(`Ghostscript failed with code ${code}`));
      });

      gs.on('error', reject);
    });

    const out = fs.readFileSync(outputPath);
    const before = file.buffer.length;
    const after = out.length;
    const savedPercent = before > 0 ? Math.max(0, Math.round((1 - after / before) * 1000) / 10) : 0;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="compressed.pdf"');
    res.setHeader('x-compress-engine', 'railway-gs');
    res.setHeader('x-compress-level', level);
    res.setHeader('x-size-before', String(before));
    res.setHeader('x-size-after', String(after));
    res.setHeader('x-saved-percent', String(savedPercent));
    return res.status(200).send(out);
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Compression failed' });
  } finally {
    if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
});

app.listen(PORT, () => {
  console.log(`railway-pdf-compressor listening on :${PORT}`);
});
