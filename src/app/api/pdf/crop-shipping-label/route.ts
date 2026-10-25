import { apiError, apiInternalError } from '@/lib/api-response';
import { openEditablePdf, pdfBinaryResponse, sanitizeDownloadFileName } from '@/lib/pdf-api';
import { NextRequest } from 'next/server';
import { PDFDocument, degrees } from 'pdf-lib';

export const maxDuration = 60;
export const runtime = 'nodejs';

// 4 x 6 inches in PDF points (72 points per inch)
const THERMAL_4X6_WIDTH = 288;
const THERMAL_4X6_HEIGHT = 432;

type MarketplacePreset = 'flipkart' | 'meesho' | 'amazon' | 'indiapost' | 'custom';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const preset = (String(formData.get('preset') || 'flipkart').toLowerCase() as MarketplacePreset);
    const keepInvoice = formData.get('keepInvoice') === 'true';
    const rotationDeg = parseInt(String(formData.get('rotation') || '0'), 10) || 0;

    const opened = await openEditablePdf(file);
    if (!opened.ok) return opened.response;
    const { buffer } = opened;

    const sourcePdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const totalPages = sourcePdf.getPageCount();

    if (totalPages > 100) {
      return apiError('Please split batch PDFs over 100 pages before processing.', 422);
    }

    const outputPdf = await PDFDocument.create();

    for (let i = 0; i < totalPages; i++) {
      const page = sourcePdf.getPage(i);
      const { width: origW, height: origH, x: origX, y: origY } = page.getCropBox();

      // Determine bounding box for shipping label based on preset
      // (PDF coordinates measure Y from bottom to top)
      let labelCrop = { x: 0, y: origH * 0.48, width: origW, height: origH * 0.52 };
      let invoiceCrop = { x: 0, y: 0, width: origW, height: origH * 0.48 };

      if (preset === 'flipkart') {
        // Flipkart: Top half contains 4x6 thermal shipping barcode
        labelCrop = { x: 0, y: origH * 0.48, width: origW, height: origH * 0.52 };
        invoiceCrop = { x: 0, y: 0, width: origW, height: origH * 0.48 };
      } else if (preset === 'meesho') {
        // Meesho: Top portion contains shipping label
        labelCrop = { x: 0, y: origH * 0.50, width: origW, height: origH * 0.50 };
        invoiceCrop = { x: 0, y: 0, width: origW, height: origH * 0.50 };
      } else if (preset === 'amazon') {
        // Amazon Easy Ship: Top half label
        labelCrop = { x: 0, y: origH * 0.46, width: origW, height: origH * 0.54 };
        invoiceCrop = { x: 0, y: 0, width: origW, height: origH * 0.46 };
      } else if (preset === 'indiapost') {
        // India Post: Top-half barcode section
        labelCrop = { x: 0, y: origH * 0.50, width: origW, height: origH * 0.50 };
        invoiceCrop = { x: 0, y: 0, width: origW, height: origH * 0.50 };
      } else {
        // Custom or direct 4x6 crop
        const customTop = parseFloat(String(formData.get('topMargin') || '0'));
        const customHeight = parseFloat(String(formData.get('cropHeight') || String(origH * 0.5)));
        labelCrop = {
          x: 0,
          y: Math.max(0, origH - customTop - customHeight),
          width: origW,
          height: Math.min(origH, customHeight),
        };
        invoiceCrop = {
          x: 0,
          y: 0,
          width: origW,
          height: Math.max(0, origH - customHeight),
        };
      }

      // 1. Embed and scale shipping label onto 4x6 thermal page
      const [embeddedLabel] = await outputPdf.embedPdf(sourcePdf, [i]);
      const labelPage = outputPdf.addPage([THERMAL_4X6_WIDTH, THERMAL_4X6_HEIGHT]);

      const scale = Math.min(
        THERMAL_4X6_WIDTH / labelCrop.width,
        THERMAL_4X6_HEIGHT / labelCrop.height
      );

      labelPage.drawPage(embeddedLabel, {
        x: -labelCrop.x * scale + (THERMAL_4X6_WIDTH - labelCrop.width * scale) / 2,
        y: -labelCrop.y * scale + (THERMAL_4X6_HEIGHT - labelCrop.height * scale) / 2,
        xScale: scale,
        yScale: scale,
      });

      if (rotationDeg !== 0) {
        labelPage.setRotation(degrees(rotationDeg));
      }

      // 2. If keepInvoice is selected, add tax invoice on a separate sheet
      if (keepInvoice && invoiceCrop.height > 20) {
        const invoicePage = outputPdf.addPage([origW, invoiceCrop.height]);
        invoicePage.drawPage(embeddedLabel, {
          x: 0,
          y: -invoiceCrop.y,
          xScale: 1,
          yScale: 1,
        });
      }
    }

    const outBytes = await outputPdf.save();
    const baseName = file?.name ? file.name.replace(/\.pdf$/i, '') : 'shipping-label';
    const fileName = `${sanitizeDownloadFileName(baseName)}-4x6-thermal.pdf`;

    return pdfBinaryResponse(outBytes, fileName, {
      'x-preset': preset,
      'x-labels-count': String(totalPages),
    });
  } catch (error) {
    return apiInternalError(error, 'Failed to crop shipping labels', 'Shipping label cropper error');
  }
}
