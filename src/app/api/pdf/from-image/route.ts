import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

const MAX_FILES = 30;
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MAX_TOTAL_SIZE = 120 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const pageSize = formData.get('pageSize') as string || 'a4'; // 'a4', 'letter', 'fit'
    const orientation = formData.get('orientation') as string || 'portrait'; // 'portrait', 'landscape', 'auto'
    const margin = parseInt(formData.get('margin') as string) || 20;
    const fitMode = formData.get('fitMode') as string || 'contain'; // 'contain', 'fill', 'stretch'
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Too many images. Maximum ${MAX_FILES} files allowed.` },
        { status: 400 }
      );
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { error: 'Total upload size too large (120MB max).' },
        { status: 400 }
      );
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
        return NextResponse.json(
          { error: `File "${file.name}" is too large (15MB max per image).` },
          { status: 400 }
        );
      }

      if (!file.type.startsWith('image/')) {
        continue;
      }

      const arrayBuffer = await file.arrayBuffer();
      const imageBytes = new Uint8Array(arrayBuffer);
      
      // Get image metadata
      const image = sharp(Buffer.from(imageBytes));
      const metadata = await image.metadata();
      
      let imageEmbed;
      if (file.type === 'image/png') {
        imageEmbed = await pdfDoc.embedPng(imageBytes);
      } else if (file.type === 'image/webp') {
        // Convert webp to png for embedding
        const pngBuffer = await sharp(Buffer.from(imageBytes)).png().toBuffer();
        imageEmbed = await pdfDoc.embedPng(pngBuffer);
      } else {
        // Default to JPEG
        imageEmbed = await pdfDoc.embedJpg(imageBytes);
      }
      
      // Determine page size
      let pageWidth: number, pageHeight: number;
      
      if (pageSize === 'fit') {
        // Fit page to image dimensions
        pageWidth = metadata.width || 595;
        pageHeight = metadata.height || 841;
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
      
      let drawWidth: number, drawHeight: number, x: number, y: number;
      
      const availableWidth = pageWidth - (margin * 2);
      const availableHeight = pageHeight - (margin * 2);
      
      if (fitMode === 'contain') {
        // Fit image within page while maintaining aspect ratio
        const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
        drawWidth = imgWidth * scale;
        drawHeight = imgHeight * scale;
        x = margin + (availableWidth - drawWidth) / 2;
        y = pageHeight - margin - drawHeight - (availableHeight - drawHeight) / 2;
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
        x = margin;
        y = margin;
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
      return NextResponse.json(
        { error: 'No valid images found to convert.' },
        { status: 400 }
      );
    }

    const pdfBytes = await pdfDoc.save();
    const fileName = `images-to-pdf-${Date.now()}.pdf`;

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
    return NextResponse.json(
      { error: 'Failed to convert images to PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
