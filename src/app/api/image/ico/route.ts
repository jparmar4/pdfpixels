import { apiError, apiInternalError } from '@/lib/api-response';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
export const runtime = 'nodejs';

const MAX_FILE_MB = 25;
const VALID_SIZES = new Set([16, 32, 48, 64, 128, 256]);

interface IcoEntry {
  size: number;
  data: Buffer;
}

/**
 * Pack PNG images into an ICO container. Entries are Vista-style
 * PNG-compressed icons (valid for all sizes; every modern Windows and all
 * browsers read them), which keeps the container tiny and the code honest.
 */
function packIco(entries: IcoEntry[]): Buffer {
  const headerSize = 6 + entries.length * 16;
  const totalSize = headerSize + entries.reduce((sum, e) => sum + e.data.length, 0);
  const buffer = Buffer.alloc(totalSize);

  buffer.writeUInt16LE(0, 0); // reserved
  buffer.writeUInt16LE(1, 2); // type: icon
  buffer.writeUInt16LE(entries.length, 4); // image count

  let offset = headerSize;
  entries.forEach((entry, index) => {
    const dirOffset = 6 + index * 16;
    // 256 is stored as 0 in the 1-byte dimension fields.
    buffer.writeUInt8(entry.size >= 256 ? 0 : entry.size, dirOffset);
    buffer.writeUInt8(entry.size >= 256 ? 0 : entry.size, dirOffset + 1);
    buffer.writeUInt8(0, dirOffset + 2); // palette count
    buffer.writeUInt8(0, dirOffset + 3); // reserved
    buffer.writeUInt16LE(1, dirOffset + 4); // color planes
    buffer.writeUInt16LE(32, dirOffset + 6); // bits per pixel
    buffer.writeUInt32LE(entry.data.length, dirOffset + 8);
    buffer.writeUInt32LE(offset, dirOffset + 12);
    entry.data.copy(buffer, offset);
    offset += entry.data.length;
  });

  return buffer;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const sizesRaw = formData.get('sizes');

    if (!file || typeof file.arrayBuffer !== 'function' || file.size === 0) {
      return apiError('Choose an image to convert first.');
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      return apiError(`File too large (${MAX_FILE_MB}MB max).`, 413);
    }

    let sizes = [16, 32, 48, 64];
    if (typeof sizesRaw === 'string' && sizesRaw.trim()) {
      const parsed = sizesRaw
        .split(',')
        .map((value) => parseInt(value.trim(), 10))
        .filter((value) => VALID_SIZES.has(value));
      if (parsed.length > 0) sizes = Array.from(new Set(parsed)).sort((a, b) => a - b);
    }

    const sharp = (await import('sharp')).default;
    const input = Buffer.from(await file.arrayBuffer());

    let metadata: import('sharp').Metadata;
    try {
      metadata = await sharp(input, { failOn: 'none' }).metadata();
      if (!metadata.width || !metadata.height || metadata.width * metadata.height > 50_000_000) {
        return apiError('This image is too large or cannot be read.');
      }
    } catch {
      return apiError('Could not read this image. Use PNG, JPG, or WebP.', 422);
    }

    // Pad non-square sources onto a transparent square so icons stay undistorted.
    const side = Math.max(metadata.width, metadata.height);
    const square = await sharp(input, { failOn: 'none' })
      .resize(side, side, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const entries: IcoEntry[] = [];
    for (const size of sizes) {
      const png = await sharp(square).resize(size, size, { fit: 'cover', kernel: 'lanczos3' }).png().toBuffer();
      entries.push({ size, data: png });
    }

    const ico = packIco(entries);
    return new NextResponse(new Uint8Array(ico), {
      status: 200,
      headers: {
        'Content-Type': 'image/x-icon',
        'Content-Disposition': `attachment; filename="favicon-${Date.now()}.ico"`,
        'Cache-Control': 'no-store, max-age=0',
        'X-Ico-Sizes': entries.map((e) => e.size).join(','),
      },
    });
  } catch (error) {
    return apiInternalError(error, 'Failed to convert image to ICO', 'ICO conversion error');
  }
}
