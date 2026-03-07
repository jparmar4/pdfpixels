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

    const id = crypto.randomUUID();
    inputPath = path.join(os.tmpdir(), `${id}.pdf`);
    outputPath = path.join(os.tmpdir(), `${id}-compressed.pdf`);

    fs.writeFileSync(inputPath, file.buffer);

    const args = [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      '-dPDFSETTINGS=/ebook',
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      `-sOutputFile=${outputPath}`,
      inputPath,
    ];

    await new Promise((resolve, reject) => {
      const gs = spawn('gs', args);
      const timeout = setTimeout(() => {
        gs.kill('SIGKILL');
        reject(new Error('Compression timed out'));
      }, 45_000);

      gs.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) resolve(true);
        else reject(new Error(`Ghostscript failed with code ${code}`));
      });

      gs.on('error', reject);
    });

    const out = fs.readFileSync(outputPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="compressed.pdf"');
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
