import { apiError, apiInternalError } from '@/lib/api-response';
import { pdfBinaryResponse, sanitizeDownloadFileName } from '@/lib/pdf-api';
import { NextRequest } from 'next/server';

export const maxDuration = 60;
export const runtime = 'nodejs';

const OFFICE_BYTES = 25 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || typeof file.arrayBuffer !== 'function') {
      return apiError('No PowerPoint file provided', 400);
    }
    if (file.size === 0) return apiError('This PowerPoint file is empty. Please choose a valid file.', 400);
    if (file.size > OFFICE_BYTES) return apiError('PowerPoint files must be 25MB or smaller.', 400);

    const name = file.name.toLowerCase();
    if (!name.endsWith('.pptx') && !name.endsWith('.ppt')) {
      return apiError('Only .pptx and .ppt presentations are supported', 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const baseName = file.name.replace(/\.pptx?$/i, '');

    try {
      const { convertWithLibreOffice } = await import('@/lib/libreoffice');
      const pdfBytes = await convertWithLibreOffice(buffer, name.endsWith('.pptx') ? 'pptx' : 'ppt', 'pdf');
      return pdfBinaryResponse(new Uint8Array(pdfBytes), sanitizeDownloadFileName(`${baseName}.pdf`), {
        'x-convert-engine': 'libreoffice',
      });
    } catch (error) {
      const { isLibreOfficeMissingError } = await import('@/lib/libreoffice');
      if (isLibreOfficeMissingError(error)) {
        return apiError(
          'The conversion engine is temporarily unavailable. Please try again in a few minutes.',
          503,
        );
      }
      console.error('LibreOffice PowerPoint to PDF failed:', error);
      return apiError('This presentation could not be converted. It may be corrupt — try re-saving it from PowerPoint.', 400);
    }
  } catch (error) {
    return apiInternalError(error, 'Failed to convert presentation to PDF', 'PowerPoint to PDF error');
  }
}
