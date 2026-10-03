import { apiError, apiInternalError } from '@/lib/api-response';
import { NextRequest, NextResponse } from 'next/server';
import {
  openEditablePdf,
  sanitizeDownloadFileName,
} from '@/lib/pdf-api';

export const maxDuration = 60;
export const runtime = 'nodejs';

const MAX_LENGTH = 512;

function clean(value: unknown): string | undefined {
  const str = typeof value === 'string' ? value.trim() : '';
  if (!str) return undefined;
  return str.slice(0, MAX_LENGTH);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = clean(formData.get('title'));
    const author = clean(formData.get('author'));
    const subject = clean(formData.get('subject'));
    const keywords = clean(formData.get('keywords'));

    const opened = await openEditablePdf(file);
    if (!opened.ok) return opened.response;
    const { pdf } = opened;

    if (!title && !author && !subject && !keywords) {
      return apiError('Provide at least one property to edit (title, author, subject, or keywords).', 400);
    }

    if (title !== undefined) pdf.setTitle(title);
    if (author !== undefined) pdf.setAuthor(author);
    if (subject !== undefined) pdf.setSubject(subject);
    if (keywords !== undefined) {
      pdf.setKeywords(keywords.split(',').map((k) => k.trim()).filter(Boolean));
    }
    pdf.setModificationDate(new Date());

    const bytes = await pdf.save();
    const baseName = (file?.name ?? 'document.pdf').replace(/\.pdf$/i, '');
    return new NextResponse(bytes as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${sanitizeDownloadFileName(`${baseName}-updated.pdf`)}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return apiInternalError(error, 'Failed to edit PDF metadata', 'PDF metadata error');
  }
}
