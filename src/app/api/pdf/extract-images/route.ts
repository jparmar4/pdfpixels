import { apiError, apiInternalError } from '@/lib/api-response';
import { openEditablePdf, sanitizeDownloadFileName } from '@/lib/pdf-api';
import { NextRequest, NextResponse } from 'next/server';
import { PDFName, PDFRawStream, PDFDict, PDFNumber, PDFArray, decodePDFRawStream } from 'pdf-lib';

export const maxDuration = 60;
export const runtime = 'nodejs';

const MAX_IMAGES = 200;
const MAX_ZIP_BYTES = 80 * 1024 * 1024;

type Extracted = { name: string; data: Buffer };

function colorSpaceChannels(cs: PDFName | unknown): number | null {
  if (!(cs instanceof PDFName)) return null;
  const name = cs.asString().replace('/', '');
  if (name === 'DeviceRGB' || name === 'RGB') return 3;
  if (name === 'DeviceGray' || name === 'G') return 1;
  // CMYK is skipped: sharp reads 4-channel raw as RGBA, which would silently
  // recolor print images. CMYK scans are usually DCTDecode JPEGs anyway.
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    const opened = await openEditablePdf(file);
    if (!opened.ok) return opened.response;
    const { pdf } = opened;

    const sharp = (await import('sharp')).default;
    const extracted: Extracted[] = [];
    let skippedUnsupported = 0;

    for (const [, obj] of pdf.context.enumerateIndirectObjects()) {
      if (extracted.length >= MAX_IMAGES) break;
      if (!(obj instanceof PDFRawStream)) continue;
      const dict: PDFDict = obj.dict;
      const subtype = dict.get(PDFName.of('Subtype'));
      if (!(subtype instanceof PDFName) || subtype.asString() !== '/Image') continue;

      const filter = dict.get(PDFName.of('Filter'));
      // Filter may be a single name or an array chain such as
      // [/ASCII85Decode /DCTDecode] — check every stage of the chain.
      const filterNames: string[] = [];
      if (filter instanceof PDFName) {
        filterNames.push(filter.asString());
      } else if (filter instanceof PDFArray) {
        for (let i = 0; i < filter.size(); i += 1) {
          const entry = filter.get(i);
          if (entry instanceof PDFName) filterNames.push(entry.asString());
        }
      }
      const isDct = filterNames.includes('/DCTDecode');
      const isFlate = !isDct && filterNames.includes('/FlateDecode');

      try {
        if (isDct) {
          // JPEG bytes are stored verbatim — hand them back untouched.
          const contents = Buffer.from(obj.getContents());
          // Validate JPEG magic so corrupt streams don't ship as broken .jpg files.
          if (contents.length > 2 && contents[0] === 0xff && contents[1] === 0xd8) {
            extracted.push({
              name: `image-${String(extracted.length + 1).padStart(3, '0')}.jpg`,
              data: contents,
            });
            continue;
          }
          skippedUnsupported += 1;
          continue;
        }

        if (isFlate) {
          // Reconstruct raw bitmaps the PDF stores as flate rows. Predictors,
          // non-8-bit depths, and indexed color would need real image math — skip.
          const bpc = dict.get(PDFName.of('BitsPerComponent'));
          const predictor = dict.get(PDFName.of('DecodeParms'));
          const width = dict.get(PDFName.of('Width'));
          const height = dict.get(PDFName.of('Height'));
          const channels = colorSpaceChannels(dict.get(PDFName.of('ColorSpace')));
          if (
            channels &&
            bpc instanceof PDFNumber && bpc.asNumber() === 8 &&
            width instanceof PDFNumber && height instanceof PDFNumber &&
            (predictor === undefined || predictor === null)
          ) {
            const w = width.asNumber();
            const h = height.asNumber();
            if (w > 0 && h > 0 && w * h * channels <= 100_000_000) {
              const decoded = decodePDFRawStream(obj).decode();
              if (decoded.length === w * h * channels) {
                const png = await sharp(Buffer.from(decoded), {
                  raw: { width: w, height: h, channels: channels as 1 | 2 | 3 | 4 },
                }).png().toBuffer();
                extracted.push({
                  name: `image-${String(extracted.length + 1).padStart(3, '0')}.png`,
                  data: png,
                });
                continue;
              }
            }
          }
          skippedUnsupported += 1;
          continue;
        }

        skippedUnsupported += 1;
      } catch {
        skippedUnsupported += 1;
      }
    }

    if (extracted.length === 0) {
      return apiError(
        skippedUnsupported > 0
          ? 'This PDF stores images in a format the extractor cannot decode (e.g. JPEG2000) or draws content as vectors. Try PDF to JPG to render the pages instead.'
          : 'No embedded images were found in this PDF. The pages may be pure text or vector graphics — try PDF to JPG to render the pages instead.',
        422,
        'NO_IMAGES',
      );
    }

    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip();
    let total = 0;
    let zippedCount = 0;
    for (const image of extracted) {
      if (total + image.data.length > MAX_ZIP_BYTES && zippedCount > 0) break;
      zip.addFile(image.name, image.data);
      total += image.data.length;
      zippedCount += 1;
      if (total > MAX_ZIP_BYTES) break;
    }
    const zipBuffer = zip.toBuffer();

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${sanitizeDownloadFileName(`images-${Date.now()}.zip`)}"`,
        'Cache-Control': 'no-store, max-age=0',
        'X-Images-Extracted': String(zippedCount),
        'X-Images-Skipped': String(skippedUnsupported + (extracted.length - zippedCount)),
      },
    });
  } catch (error) {
    return apiInternalError(error, 'Failed to extract images from PDF', 'PDF extract-images error');
  }
}
