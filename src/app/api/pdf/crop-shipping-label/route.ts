import { apiError, apiInternalError } from '@/lib/api-response';
import { openEditablePdf, pdfBinaryResponse, sanitizeDownloadFileName } from '@/lib/pdf-api';
import { NextRequest } from 'next/server';
import { PDFDocument, degrees } from 'pdf-lib';

export const maxDuration = 60;
export const runtime = 'nodejs';

// Thermal dimensions in PDF points (72 pt / inch)
const THERMAL_SIZES: Record<string, { width: number; height: number }> = {
  'rollo-4x6': { width: 288, height: 432 },
  'zebra-4x6': { width: 288, height: 432 },
  'munbyn-4x6': { width: 288, height: 432 },
  'dymo-4xl': { width: 288, height: 432 },
  'eu-100x150': { width: 283.46, height: 425.2 },
};

interface CropFraction {
  xFrac: number;
  yFrac: number;
  wFrac: number;
  hFrac: number;
  invoice?: { xFrac: number; yFrac: number; wFrac: number; hFrac: number };
}

// PDF coordinate origin is bottom-left. Most US 8.5x11" (or UK/EU A4) 2-up shipping sheets place
// the carrier barcode label on the top half (or left half in landscape) and packing slip below.
const CARRIER_PRESETS: Record<string, CropFraction> = {
  usps: { xFrac: 0.04, yFrac: 0.48, wFrac: 0.92, hFrac: 0.5, invoice: { xFrac: 0, yFrac: 0, wFrac: 1, hFrac: 0.48 } },
  ups: { xFrac: 0.04, yFrac: 0.47, wFrac: 0.92, hFrac: 0.51, invoice: { xFrac: 0, yFrac: 0, wFrac: 1, hFrac: 0.47 } },
  fedex: { xFrac: 0.04, yFrac: 0.48, wFrac: 0.92, hFrac: 0.5, invoice: { xFrac: 0, yFrac: 0, wFrac: 1, hFrac: 0.48 } },
  ebay: { xFrac: 0.03, yFrac: 0.48, wFrac: 0.94, hFrac: 0.5, invoice: { xFrac: 0, yFrac: 0, wFrac: 1, hFrac: 0.48 } },
  etsy: { xFrac: 0.03, yFrac: 0.49, wFrac: 0.94, hFrac: 0.49, invoice: { xFrac: 0, yFrac: 0, wFrac: 1, hFrac: 0.49 } },
  poshmark: { xFrac: 0.05, yFrac: 0.49, wFrac: 0.9, hFrac: 0.49, invoice: { xFrac: 0, yFrac: 0, wFrac: 1, hFrac: 0.49 } },
  mercari: { xFrac: 0.04, yFrac: 0.48, wFrac: 0.92, hFrac: 0.5, invoice: { xFrac: 0, yFrac: 0, wFrac: 1, hFrac: 0.48 } },
  shopify: { xFrac: 0.04, yFrac: 0.48, wFrac: 0.92, hFrac: 0.5, invoice: { xFrac: 0, yFrac: 0, wFrac: 1, hFrac: 0.48 } },
  'amazon-fba': { xFrac: 0.02, yFrac: 0.48, wFrac: 0.96, hFrac: 0.5, invoice: { xFrac: 0, yFrac: 0, wFrac: 1, hFrac: 0.48 } },
  'royal-mail': { xFrac: 0.04, yFrac: 0.49, wFrac: 0.92, hFrac: 0.49, invoice: { xFrac: 0, yFrac: 0, wFrac: 1, hFrac: 0.49 } },
  dhl: { xFrac: 0.03, yFrac: 0.48, wFrac: 0.94, hFrac: 0.5, invoice: { xFrac: 0, yFrac: 0, wFrac: 1, hFrac: 0.48 } },
  // India Marketplaces
  flipkart: { xFrac: 0, yFrac: 0.48, wFrac: 1, hFrac: 0.52, invoice: { xFrac: 0, yFrac: 0, wFrac: 1, hFrac: 0.48 } },
  meesho: { xFrac: 0, yFrac: 0.5, wFrac: 1, hFrac: 0.5, invoice: { xFrac: 0, yFrac: 0, wFrac: 1, hFrac: 0.5 } },
  amazon: { xFrac: 0, yFrac: 0.46, wFrac: 1, hFrac: 0.54, invoice: { xFrac: 0, yFrac: 0, wFrac: 1, hFrac: 0.46 } },
  indiapost: { xFrac: 0, yFrac: 0.5, wFrac: 1, hFrac: 0.5, invoice: { xFrac: 0, yFrac: 0, wFrac: 1, hFrac: 0.5 } },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const preset = String(formData.get('preset') || 'usps').toLowerCase();
    const printer = String(formData.get('printer') || 'rollo-4x6').toLowerCase();
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

    const thermalSpec = THERMAL_SIZES[printer] ?? THERMAL_SIZES['rollo-4x6'];
    const outputPdf = await PDFDocument.create();

    for (let i = 0; i < totalPages; i += 1) {
      const page = sourcePdf.getPage(i);
      const { width: origW, height: origH } = page.getCropBox();

      let labelCrop: { x: number; y: number; width: number; height: number };
      let invoiceCrop: { x: number; y: number; width: number; height: number } | null = null;

      if (preset === 'custom') {
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
      } else {
        const spec = CARRIER_PRESETS[preset] ?? CARRIER_PRESETS.usps;
        // Handle landscape 2-up carrier sheets (e.g. 11x8.5 USPS/UPS side-by-side layout)
        if (origW > origH * 1.1) {
          labelCrop = { x: 0, y: 0, width: origW * 0.5, height: origH };
          invoiceCrop = { x: origW * 0.5, y: 0, width: origW * 0.5, height: origH };
        } else {
          labelCrop = {
            x: origW * spec.xFrac,
            y: origH * spec.yFrac,
            width: origW * spec.wFrac,
            height: origH * spec.hFrac,
          };
          if (spec.invoice) {
            invoiceCrop = {
              x: origW * spec.invoice.xFrac,
              y: origH * spec.invoice.yFrac,
              width: origW * spec.invoice.wFrac,
              height: origH * spec.invoice.hFrac,
            };
          }
        }
      }

      const [embeddedLabel] = await outputPdf.embedPdf(sourcePdf, [i]);
      const labelPage = outputPdf.addPage([thermalSpec.width, thermalSpec.height]);

      const scale = Math.min(thermalSpec.width / labelCrop.width, thermalSpec.height / labelCrop.height);

      labelPage.drawPage(embeddedLabel, {
        x: -labelCrop.x * scale + (thermalSpec.width - labelCrop.width * scale) / 2,
        y: -labelCrop.y * scale + (thermalSpec.height - labelCrop.height * scale) / 2,
        xScale: scale,
        yScale: scale,
      });

      if (rotationDeg !== 0) {
        labelPage.setRotation(degrees(rotationDeg));
      }

      if (keepInvoice && invoiceCrop && invoiceCrop.height > 20 && invoiceCrop.width > 20) {
        const invoicePage = outputPdf.addPage([invoiceCrop.width, invoiceCrop.height]);
        invoicePage.drawPage(embeddedLabel, {
          x: -invoiceCrop.x,
          y: -invoiceCrop.y,
          xScale: 1,
          yScale: 1,
        });
      }
    }

    const outBytes = await outputPdf.save();
    const baseName = file?.name ? file.name.replace(/\.pdf$/i, '') : 'shipping-label';
    const fileName = `${sanitizeDownloadFileName(baseName)}-${preset}-4x6-thermal.pdf`;

    return pdfBinaryResponse(outBytes, fileName, {
      'x-preset': preset,
      'x-printer': printer,
      'x-labels-count': String(totalPages),
    });
  } catch (error) {
    return apiInternalError(error, 'Failed to crop shipping labels', 'Shipping label cropper error');
  }
}
