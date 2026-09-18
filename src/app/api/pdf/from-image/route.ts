import { apiError } from '@/lib/api-response';
import { decodeHeicIfNeeded, isImageUpload } from '@/lib/heic';
import { sanitizeDownloadFileName } from '@/lib/pdf-api';
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

const MAX_FILES = 30;
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MAX_TOTAL_SIZE = 120 * 1024 * 1024;

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const pageSize = formData.get('pageSize') as string || 'a4'; // 'a4', 'letter', 'fit'
    const orientation = formData.get('orientation') as string || 'portrait'; // 'portrait', 'landscape', 'auto'
    const marginRaw = parseInt(String(formData.get('margin') ?? ''), 10);
    const margin = Number.isFinite(marginRaw) ? Math.max(0, Math.min(200, marginRaw)) : 20;
    const fitMode = formData.get('fitMode') as string || 'contain'; // 'contain', 'fill', 'stretch'
    
    if (!files || files.length === 0) {
      return apiError('No images provided', 400);
    }

    if (files.some((file) => typeof file.arrayBuffer !== 'function')) {
      return apiError('Invalid upload: expected image files only.', 400);
    }

    if (files.length > MAX_FILES) {
      return apiError(`Too many images. Maximum ${MAX_FILES} files allowed.`, 400);
    }

    if (files.some((file) => file.size === 0)) {
      return apiError('One of your images is empty (0 bytes). Please re-select your files.', 400);
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (!Number.isFinite(totalSize)) {
      return apiError('Invalid upload sizes. Please re-select your images.', 400);
    }
    if (totalSize > MAX_TOTAL_SIZE) {
      return apiError('Total upload size too large (120MB max).', 400);
    }

    const VALID_PAGE_SIZES = new Set(['a4', 'letter', 'legal', 'a3', 'a5', 'fit']);
    const VALID_ORIENTATIONS = new Set(['portrait', 'landscape', 'auto']);
    const VALID_FIT_MODES = new Set(['contain', 'fill', 'stretch']);
    if (!VALID_PAGE_SIZES.has(pageSize)) {
      return apiError('Invalid page size. Use a4, letter, legal, a3, a5, or fit.', 400);
    }
    if (!VALID_ORIENTATIONS.has(orientation)) {
      return apiError('Invalid orientation. Use portrait, landscape, or auto.', 400);
    }
    if (!VALID_FIT_MODES.has(fitMode)) {
      return apiError('Invalid fit mode. Use contain, fill, or stretch.', 400);
    }

    // Page sizes in points (1 inch = 72 points)
    const pageSizes: Record<string, { width: number; height: number }> = {
      'a4': { width: 595.28, height: 841.89 },
      'letter': { width: 612, height: 792 },
      'legal': { width: 612, height: 1008 },
      'a3': { width: 841.89, height: 1190.55 },
      'a5': { width: 420.94, height: 595.28 },
    };

    const pdfDoc = await PDFDocument.create();
    
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return apiError(`File "${file.name}" is too large (15MB max per image).`, 400);
      }

      if (!isImageUpload(file)) {
        return apiError(`"${file.name}" is not a supported image. Use JPG, PNG, WebP, HEIC, GIF, or BMP.`, 400);
      }

      const arrayBuffer = await file.arrayBuffer();
      let decoded: { buffer: Buffer };
      try {
        decoded = await decodeHeicIfNeeded(Buffer.from(arrayBuffer), file.name, file.type);
      } catch {
        return apiError(`Could not read "${file.name}". If it is HEIC, try converting it first.`, 400);
      }
      const imageBytes = new Uint8Array(decoded.buffer);

      // Get image metadata
      let metadata;
      try {
        const image = sharp(decoded.buffer, { failOn: 'none' });
        metadata = await image.metadata();
      } catch {
        return apiError(`Could not read "${file.name}". The image may be corrupt.`, 400);
      }
      if (!metadata.width || !metadata.height) {
        return apiError(`Could not read "${file.name}". The image may be corrupt.`, 400);
      }
      
      // Normalize all non-JPEG/PNG inputs through Sharp so GIF/HEIC/AVIF/BMP work
      const isPng = file.type === 'image/png' || (metadata.format === 'png');
      const isJpeg = file.type === 'image/jpeg' || file.type === 'image/jpg' || metadata.format === 'jpeg';
      let imageEmbed;
      if (isPng) {
        const pngBuffer = isPng && metadata.format === 'png'
          ? Buffer.from(imageBytes)
          : await sharp(Buffer.from(imageBytes)).png().toBuffer();
        imageEmbed = await pdfDoc.embedPng(pngBuffer);
      } else if (isJpeg) {
        try {
          imageEmbed = await pdfDoc.embedJpg(imageBytes);
        } catch {
          const jpegBuffer = await sharp(Buffer.from(imageBytes)).jpeg({ quality: 92 }).toBuffer();
          imageEmbed = await pdfDoc.embedJpg(jpegBuffer);
        }
      } else {
        const hasAlpha = Boolean(metadata.hasAlpha);
        if (hasAlpha) {
          const pngBuffer = await sharp(Buffer.from(imageBytes)).png().toBuffer();
          imageEmbed = await pdfDoc.embedPng(pngBuffer);
        } else {
          const jpegBuffer = await sharp(Buffer.from(imageBytes)).jpeg({ quality: 92 }).toBuffer();
          imageEmbed = await pdfDoc.embedJpg(jpegBuffer);
        }
      }
      
      // Determine page size
      let pageWidth: number, pageHeight: number;
      
      if (pageSize === 'fit') {
        // Convert pixel dimensions to PDF points at 72 DPI, with a sane max page size
        const dpi = metadata.density && metadata.density > 0 ? metadata.density : 72;
        const rawW = ((metadata.width || 595) * 72) / dpi;
        const rawH = ((metadata.height || 841) * 72) / dpi;
        const maxSide = 1440; // 20 inches at 72 DPI
        const scale = Math.min(1, maxSide / Math.max(rawW, rawH));
        pageWidth = Math.max(72, rawW * scale);
        pageHeight = Math.max(72, rawH * scale);
      } else {
        const size = pageSizes[pageSize] || pageSizes['a4'];
        
        // Determine orientation
        if (orientation === 'auto') {
          // Auto-detect based on image orientation
          const isLandscape = (metadata.width || 0) > (metadata.height || 0);
          pageWidth = isLandscape ? size.height : size.width;
          pageHeight = isLandscape ? size.width : size.height;
        } else if (orientation === 'landscape') {
          pageWidth = size.height;
          pageHeight = size.width;
        } else {
          pageWidth = size.width;
          pageHeight = size.height;
        }
      }
      
      // Add page
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      
      // Calculate image placement
      const imgWidth = imageEmbed.width;
      const imgHeight = imageEmbed.height;
      if (imgWidth <= 0 || imgHeight <= 0) {
        continue;
      }
      
      let drawWidth: number, drawHeight: number, x: number, y: number;
      
      const safeMargin = Math.min(margin, Math.max(0, Math.floor(Math.min(pageWidth, pageHeight) / 2) - 1));
      const availableWidth = Math.max(1, pageWidth - (safeMargin * 2));
      const availableHeight = Math.max(1, pageHeight - (safeMargin * 2));
      
      if (fitMode === 'contain') {
        // Fit image within page while maintaining aspect ratio
        const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
        drawWidth = imgWidth * scale;
        drawHeight = imgHeight * scale;
        x = safeMargin + (availableWidth - drawWidth) / 2;
        y = pageHeight - safeMargin - drawHeight - (availableHeight - drawHeight) / 2;
      } else if (fitMode === 'fill') {
        // Fill page while maintaining aspect ratio (may crop)
        const scale = Math.max(availableWidth / imgWidth, availableHeight / imgHeight);
        drawWidth = imgWidth * scale;
        drawHeight = imgHeight * scale;
        x = (pageWidth - drawWidth) / 2;
        y = (pageHeight - drawHeight) / 2;
      } else {
        // Stretch to fill
        drawWidth = availableWidth;
        drawHeight = availableHeight;
        x = safeMargin;
        y = safeMargin;
      }
      
      page.drawImage(imageEmbed, {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
      });
    }
    
    const pageCount = pdfDoc.getPageCount();
    if (pageCount === 0) {
      return apiError('No valid images found to convert.', 400);
    }

    const pdfBytes = await pdfDoc.save();
    const firstBase = files[0]?.name ? files[0].name.replace(/\.[^/.]+$/, '') : 'image';
    const safeBase = sanitizeDownloadFileName(firstBase);
    const fileName = files.length === 1 ? `${safeBase}.pdf` : `${safeBase}-and-${files.length - 1}-more.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store, max-age=0',
        'X-Page-Count': String(pageCount),
      },
    });
  } catch (error) {
    console.error('Image to PDF error:', error);
    const message = error instanceof Error ? error.message : 'Failed to convert images to PDF';
    // Sharp/metadata failures are client data problems, not server crashes.
    if (/corrupt|unsupported|invalid|too large/i.test(message)) {
      return apiError(message, 400);
    }
    return apiError('Failed to convert images to PDF', 500);
  }
}
