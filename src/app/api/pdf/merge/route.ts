import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

const MAX_FILES = 20;
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_TOTAL_SIZE = 100 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No PDF files provided' },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Too many files. Maximum ${MAX_FILES} PDFs allowed per request.` },
        { status: 400 }
      );
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { error: 'Total upload size too large (100MB max).' },
        { status: 400 }
      );
    }

    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();

    let addedPages = 0;

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File \"${file.name}\" is too large (25MB max per file).` },
          { status: 400 }
        );
      }

      const looksLikePdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
      if (!looksLikePdf) {
        continue;
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);
      
      try {
        const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        
        for (const page of copiedPages) {
          mergedPdf.addPage(page);
          addedPages += 1;
        }
      } catch (e) {
        console.error(`Error loading PDF ${file.name}:`, e);
        continue;
      }
    }

    if (addedPages === 0) {
      return NextResponse.json(
        { error: 'No valid PDF pages found to merge.' },
        { status: 400 }
      );
    }

    const mergedPdfBytes = await mergedPdf.save();
    const fileName = `merged-${Date.now()}.pdf`;
    const pageCount = mergedPdf.getPageCount();

    return new NextResponse(Buffer.from(mergedPdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store, max-age=0',
        'X-Page-Count': String(pageCount),
      },
    });
  } catch (error) {
    console.error('PDF merge error:', error);
    return NextResponse.json(
      { error: 'Failed to merge PDFs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
