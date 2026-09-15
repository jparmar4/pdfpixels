import { apiError } from '@/lib/api-response';
import { pdfBinaryResponse, sanitizeDownloadFileName } from '@/lib/pdf-api';
import { NextRequest } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import heicConvert from 'heic-convert';
import sharp from 'sharp';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('file') as File[];
    if (files.length === 0) {
      const single = formData.get('file') as File | null;
      if (single) files.push(single);
    }

    if (files.length === 0) {
      return apiError('Please upload at least one HEIC or HEIF photo to convert', 400);
    }

    const orientation = (formData.get('orientation') as string) || 'auto'; // 'auto', 'portrait', 'landscape'
    const margin = Number(formData.get('margin') ?? '20'); // in points

    if (!['auto', 'portrait', 'landscape'].includes(orientation) || !Number.isFinite(margin) || margin < 0 || margin > 100) return apiError('Choose a valid orientation and a margin from 0 to 100 points.', 400);
    if (files.length > 30) return apiError('Too many photos: upload up to 30 HEIC/HEIF files at a time.', 400);
    const badType = files.find((file) => typeof file.arrayBuffer !== 'function' || !/\.(heic|heif)$/i.test(file.name || ''));
    if (badType) return apiError(`"${badType.name || 'unnamed'}" is not a .heic/.heif file.`, 400);
    const emptyFile = files.find((file) => file.size === 0);
    if (emptyFile) return apiError(`"${emptyFile.name || 'unnamed'}" is empty (0 bytes).`, 400);
    const oversized = files.find((file) => file.size > 25 * 1024 * 1024);
    if (oversized) return apiError(`"${oversized.name || 'unnamed'}" exceeds 25MB per file.`, 400);
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (!Number.isFinite(totalSize) || totalSize > 100 * 1024 * 1024) return apiError('Total upload size too large (100MB max).', 400);
    const pdfDoc = await PDFDocument.create();

    for (const file of files) {
      const arrayBuf = await file.arrayBuffer();
      const inputBuf = Buffer.from(arrayBuf);

      let jpegBuf: Buffer;

      // Try heic-convert first, fallback to sharp if needed
      try {
        const converted = await heicConvert({
          buffer: inputBuf,
          format: 'JPEG',
          quality: 0.92,
        });
        jpegBuf = Buffer.from(converted);
      } catch (convErr) {
        console.warn('heic-convert failed, trying sharp fallback:', convErr);
        try {
          jpegBuf = await sharp(inputBuf).rotate().jpeg({ quality: 92 }).toBuffer();
        } catch (sharpErr) {
          console.error('Sharp HEIC conversion also failed:', sharpErr);
          throw new Error(`Failed to decode HEIC image "${file.name}". Ensure the file is a valid HEIC/HEIF photo.`);
        }
      }

      const embeddedJpg = await pdfDoc.embedJpg(jpegBuf);
      const imgWidth = embeddedJpg.width;
      const imgHeight = embeddedJpg.height;

      let pageWidth: number;
      let pageHeight: number;

      if (orientation === 'portrait') {
        pageWidth = 595.28; // A4 portrait
        pageHeight = 841.89;
      } else if (orientation === 'landscape') {
        pageWidth = 841.89; // A4 landscape
        pageHeight = 595.28;
      } else {
        // Auto: match image aspect ratio scaled to standard page boundary
        const maxDim = 842;
        if (imgWidth > imgHeight) {
          pageWidth = maxDim;
          pageHeight = (maxDim * imgHeight) / imgWidth;
        } else {
          pageHeight = maxDim;
          pageWidth = (maxDim * imgWidth) / imgHeight;
        }
      }

      if (orientation === 'auto') { pageWidth += margin * 2; pageHeight += margin * 2; }
      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      // Calculate fitted dimensions preserving aspect ratio with margin
      const availWidth = pageWidth - margin * 2;
      const availHeight = pageHeight - margin * 2;

      const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight);
      const drawWidth = imgWidth * scale;
      const drawHeight = imgHeight * scale;

      const drawX = margin + (availWidth - drawWidth) / 2;
      const drawY = margin + (availHeight - drawHeight) / 2;

      page.drawImage(embeddedJpg, {
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight,
      });
    }

    const outBytes = await pdfDoc.save();
    const firstName = files[0]?.name ? files[0].name.replace(/\.(heic|heif)$/i, '') : 'photos';
    const fileName = `${sanitizeDownloadFileName(firstName)}.pdf`;

    return pdfBinaryResponse(outBytes, fileName, {
      'x-image-count': String(files.length),
    });
  } catch (error) {
    console.error('HEIC to PDF error:', error);
    const message = error instanceof Error ? error.message : 'Failed to convert HEIC to PDF';
    if (/failed to decode|valid HEIC|corrupt|invalid|too large|empty|not a \.heic/i.test(message)) {
      return apiError(message, 400);
    }
    return apiError('Failed to convert HEIC to PDF', 500);
  }
}
