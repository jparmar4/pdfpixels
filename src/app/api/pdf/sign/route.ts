import { apiError } from '@/lib/api-response';
import { openEditablePdf, pdfBinaryResponse } from '@/lib/pdf-api';
import { NextRequest } from 'next/server';
import { rgb, StandardFonts } from 'pdf-lib';

export const maxDuration = 60;
export const runtime = 'nodejs';

interface SignatureItem {
  pageNumber: number; // 1-based
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl?: string;
  dateText?: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const signatureImage = formData.get('signatureImage') as string | File | null;
    const signaturesJson = formData.get('signatures') as string | null;

    const opened = await openEditablePdf(file);
    if (!opened.ok) return opened.response;
    const { pdf } = opened;

    let items: SignatureItem[] = [];
    if (signaturesJson) {
      try {
        items = JSON.parse(signaturesJson);
      } catch {
        return apiError('Invalid signatures data.', 400);
      }
    }

    if (!Array.isArray(items)) return apiError('Signatures must be an array.', 400);

    // Support single signature fallback if signatures array not provided
    if (items.length === 0) {
      const pageNumber = parseInt(String(formData.get('pageNumber') || '1'), 10);
      const x = parseFloat(String(formData.get('x') || '50'));
      const y = parseFloat(String(formData.get('y') || '50'));
      const width = parseFloat(String(formData.get('width') || '150'));
      const height = parseFloat(String(formData.get('height') || '50'));
      const dateText = (formData.get('dateText') as string) || undefined;
      items.push({ pageNumber, x, y, width, height, dateText });
    }

    let defaultImgBytes: Uint8Array | null = null;
    if (typeof signatureImage === 'string' && signatureImage.startsWith('data:image/')) {
      const base64Data = signatureImage.split(',')[1];
      defaultImgBytes = Buffer.from(base64Data, 'base64');
    } else if (signatureImage && typeof signatureImage === 'object' && 'arrayBuffer' in signatureImage) {
      defaultImgBytes = new Uint8Array(await signatureImage.arrayBuffer());
    }

    const totalPages = pdf.getPageCount();
    const font = await pdf.embedFont(StandardFonts.Helvetica);

    for (const item of items) {
      const pageIdx = item.pageNumber - 1;
      if (!Number.isInteger(item.pageNumber) || pageIdx < 0 || pageIdx >= totalPages || ![item.x, item.y, item.width, item.height].every(Number.isFinite) || item.x < 0 || item.y < 0 || item.width <= 0 || item.height <= 0) return apiError('Invalid signature position.', 400);

      const page = pdf.getPage(pageIdx);
      const { height: pageHeight } = page.getSize();

      let imgBytes = defaultImgBytes;
      if (item.dataUrl && item.dataUrl.startsWith('data:image/')) {
        imgBytes = Buffer.from(item.dataUrl.split(',')[1], 'base64');
      }

      if (!imgBytes?.length) return apiError('Please provide a valid signature image.', 400);
      if (imgBytes && imgBytes.length > 0) {
        try {
          // Attempt PNG embedding first, then JPG fallback
          let embeddedImage;
          try {
            embeddedImage = await pdf.embedPng(imgBytes);
          } catch {
            embeddedImage = await pdf.embedJpg(imgBytes);
          }

          // PDF coordinate system origin is bottom-left
          // If y was supplied from top-left (canvas viewport), invert it
          const yPos = pageHeight - item.y - item.height;
          if (yPos < 0 || item.x + item.width > page.getWidth()) return apiError('Signature must fit inside the page.', 400);

          page.drawImage(embeddedImage, {
            x: Math.max(0, item.x),
            y: Math.max(0, yPos),
            width: item.width,
            height: item.height,
          });

          if (item.dateText) {
            page.drawText(item.dateText, {
              x: Math.max(0, item.x),
              y: Math.max(0, yPos - 14),
              size: 10,
              font,
              color: rgb(0.2, 0.2, 0.2),
            });
          }
        } catch (embedError) {
          console.error('Failed to embed signature image:', embedError);
          return apiError('Could not apply the signature image. Use PNG or JPEG.', 422);
        }
      }
    }

    const outBytes = await pdf.save();
    const fileName = file!.name ? file!.name.replace(/\.pdf$/i, '-signed.pdf') : `signed-${Date.now()}.pdf`;

    return pdfBinaryResponse(outBytes, fileName);
  } catch (error) {
    console.error('PDF sign error:', error);
    return apiError(error instanceof Error ? error.message : 'Failed to sign PDF', 500);
  }
}
