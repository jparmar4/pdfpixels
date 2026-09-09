import { apiError } from '@/lib/api-response';
import { openEditablePdf, pdfBinaryResponse, sanitizeDownloadFileName } from '@/lib/pdf-api';
import { NextRequest, NextResponse } from 'next/server';
import { PDFName } from 'pdf-lib';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const action = (formData.get('action') as string) || 'sanitize'; // 'inspect' or 'sanitize'
    const flatten = formData.get('flatten') === '1' || formData.get('flatten') === 'true';

    const opened = await openEditablePdf(file);
    if (!opened.ok) return opened.response;
    const { pdf } = opened;

    const title = pdf.getTitle() || '';
    const author = pdf.getAuthor() || '';
    const subject = pdf.getSubject() || '';
    const keywords = pdf.getKeywords() || '';
    const creator = pdf.getCreator() || '';
    const producer = pdf.getProducer() || '';
    const creationDate = pdf.getCreationDate() ? pdf.getCreationDate()!.toISOString() : '';
    const modificationDate = pdf.getModificationDate() ? pdf.getModificationDate()!.toISOString() : '';

    // Check for catalog-level XMP Metadata stream
    const catalog = pdf.catalog;
    const hasXmp = catalog.has(PDFName.of('Metadata'));

    if (action === 'inspect') {
      return NextResponse.json({
        metadata: {
          title,
          author,
          subject,
          keywords,
          creator,
          producer,
          creationDate,
          modificationDate,
          hasXmpMetadata: hasXmp,
        },
        hasAnyMetadata: Boolean(title || author || subject || keywords || creator || producer || creationDate || modificationDate || hasXmp),
      });
    }

    // ── Sanitize mode ──
    pdf.setTitle('');
    pdf.setAuthor('');
    pdf.setSubject('');
    pdf.setKeywords([]);
    pdf.setProducer('');
    pdf.setCreator('');
    pdf.setCreationDate(new Date(0));
    pdf.setModificationDate(new Date(0));

    // Remove catalog XMP Metadata stream
    if (hasXmp) {
      try {
        catalog.delete(PDFName.of('Metadata'));
      } catch (e) {
        console.warn('Could not delete XMP metadata stream:', e);
      }
    }

    // Optional form flattening
    if (flatten) {
      try {
        const form = pdf.getForm();
        if (form) form.flatten();
      } catch {}
    }

    const outBytes = await pdf.save({ useObjectStreams: false });
    const baseName = file?.name ? file.name.replace(/\.pdf$/i, '') : 'document';
    const fileName = `${sanitizeDownloadFileName(baseName)}-sanitized.pdf`;

    return pdfBinaryResponse(outBytes, fileName, {
      'x-sanitized': 'true',
      'x-xmp-stripped': String(hasXmp),
    });
  } catch (error) {
    console.error('Sanitize PDF error:', error);
    return apiError(error instanceof Error ? error.message : 'Failed to sanitize PDF', 500);
  }
}
