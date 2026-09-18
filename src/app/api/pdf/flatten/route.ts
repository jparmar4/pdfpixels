import { apiError, apiInternalError } from '@/lib/api-response';
import { openEditablePdf, pdfBinaryResponse, sanitizeDownloadFileName } from '@/lib/pdf-api';
import { NextRequest } from 'next/server';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    const opened = await openEditablePdf(file);
    if (!opened.ok) return opened.response;
    const { pdf } = opened;

    let fieldCount = 0;
    try {
      const form = pdf.getForm();
      if (form) {
        const fields = form.getFields();
        fieldCount = fields.length;
        form.flatten();
      }
    } catch (e) {
      console.warn('Form flatten failed:', e);
      return apiError('Could not flatten all fields in this PDF. No output was produced.', 422);
    }

    const outBytes = await pdf.save();
    const baseName = file?.name ? file.name.replace(/\.pdf$/i, '') : 'document';
    const fileName = `${sanitizeDownloadFileName(baseName)}-flattened.pdf`;

    return pdfBinaryResponse(outBytes, fileName, {
      'x-flattened-fields': String(fieldCount),
    });
  } catch (error) {
    return apiInternalError(error, 'Failed to flatten PDF', 'PDF flatten error');
  }
}
