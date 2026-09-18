import { apiError, apiInternalError } from '@/lib/api-response';
import { openEditablePdf, pdfBinaryResponse, toSafeWinAnsi } from '@/lib/pdf-api';
import { NextRequest } from 'next/server';
import { rgb, StandardFonts } from 'pdf-lib';

export const maxDuration = 60;
export const runtime = 'nodejs';

interface TextEntry {
  pageNumber: number; // 1-based
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  color?: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16) / 255, g: parseInt(result[2], 16) / 255, b: parseInt(result[3], 16) / 255 }
    : { r: 0, g: 0, b: 0 };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const formFieldsJson = formData.get('fields') as string | null;
    const textEntriesJson = formData.get('textEntries') as string | null;

    const opened = await openEditablePdf(file);
    if (!opened.ok) return opened.response;
    const { pdf } = opened;

    let filledCount = 0;

    // 1. Fill AcroForm fields if present
    if (formFieldsJson) {
      try {
        const fields = JSON.parse(formFieldsJson) as Record<string, string | boolean>;
        const form = pdf.getForm();
        if (form) {
          for (const [name, val] of Object.entries(fields)) {
            try {
              if (typeof val === 'boolean') {
                const checkBox = form.getCheckBox(name);
                if (checkBox) {
                  if (val) checkBox.check();
                  else checkBox.uncheck();
                  filledCount++;
                }
              } else if (typeof val === 'string') {
                const textField = form.getTextField(name);
                if (textField) {
                  textField.setText(val);
                  filledCount++;
                }
              }
            } catch {
              return apiError(`Could not fill field: ${name}. Check its name and field type.`, 400);
            }
          }
        }
      } catch (e) {
        console.warn('Error parsing AcroForm fields:', e instanceof Error ? e.message : e);
        return apiError('Invalid form fields or unsupported field values.', 400);
      }
    }

    // 2. Draw freeform text entries (for non-interactive PDFs / flat forms)
    if (textEntriesJson) {
      try {
        const textEntries = JSON.parse(textEntriesJson) as TextEntry[];
        const font = await pdf.embedFont(StandardFonts.Helvetica);
        const totalPages = pdf.getPageCount();

        for (const entry of textEntries) {
          const pageIdx = entry.pageNumber - 1;
          if (!Number.isInteger(entry.pageNumber) || pageIdx < 0 || pageIdx >= totalPages || !Number.isFinite(entry.x) || !Number.isFinite(entry.y) || entry.x < 0 || entry.y < 0 || typeof entry.text !== 'string') return apiError('Invalid text entry position or page.', 400);

          const page = pdf.getPage(pageIdx);
          const { height: pageHeight } = page.getSize();
          const size = entry.fontSize ?? 12;
          if (!Number.isFinite(size) || size < 6 || size > 96) return apiError('Font size must be between 6 and 96 points.', 400);
          const colorObj = entry.color ? hexToRgb(entry.color) : { r: 0, g: 0, b: 0 };

          const yPos = pageHeight - entry.y - size;
          if (yPos < 0 || entry.x >= page.getWidth()) return apiError('Text entries must fit inside the page.', 400);

          const safeText = toSafeWinAnsi(entry.text || '');
          page.drawText(safeText, {
            x: Math.max(0, entry.x),
            y: Math.max(0, yPos),
            size,
            font,
            color: rgb(colorObj.r, colorObj.g, colorObj.b),
          });
          filledCount++;
        }
      } catch (e) {
        console.warn('Error drawing freeform text entries:', e);
        return apiError('Could not render every text entry. Check the text and positions.', 422);
      }
    }

    if (!filledCount) return apiError('Provide at least one field or text entry to fill.', 400);
    const outBytes = await pdf.save();
    const fileName = file!.name ? file!.name.replace(/\.pdf$/i, '-filled.pdf') : `filled-${Date.now()}.pdf`;

    return pdfBinaryResponse(outBytes, fileName, {
      'x-filled-count': String(filledCount),
    });
  } catch (error) {
    return apiInternalError(error, 'Failed to fill PDF form', 'PDF form fill error');
  }
}
