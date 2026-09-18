import { readFileSync } from 'fs';
import path from 'path';

/**
 * Server-only helper: reads intrinsic pixel dimensions from a local image file
 * (under /public) WITHOUT decoding the full image, so `next/image` and raw
 * `<img>` tags can render at the true aspect ratio instead of force-cropping.
 *
 * Falls back to `fallback` when the file is missing, remote, or in an
 * unsupported format. Results are memoized per-process.
 */

const dimCache = new Map<string, { width: number; height: number }>();

export const DEFAULT_IMAGE_DIMS = { width: 800, height: 450 };

function readUInt16BE(buf: Buffer, offset: number): number {
  return (buf[offset] << 8) | buf[offset + 1];
}

function readUInt16LE(buf: Buffer, offset: number): number {
  return buf[offset] | (buf[offset + 1] << 8);
}

function readUInt32BE(buf: Buffer, offset: number): number {
  return (
    (buf[offset] << 24) |
    (buf[offset + 1] << 16) |
    (buf[offset + 2] << 8) |
    buf[offset + 3]
  ) >>> 0;
}

function readUInt32LE(buf: Buffer, offset: number): number {
  return (
    buf[offset] |
    (buf[offset + 1] << 8) |
    (buf[offset + 2] << 16) |
    (buf[offset + 3] << 24)
  ) >>> 0;
}

function readUInt24LE(buf: Buffer, offset: number): number {
  return buf[offset] | (buf[offset + 1] << 8) | (buf[offset + 2] << 16);
}

/** Parse JPEG SOFn markers for dimensions. */
function jpegDimensions(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buf[offset + 1];
    // Start of scan / end of image: no frame header found.
    if (marker === 0xda || marker === 0xd9) return null;
    const length = readUInt16BE(buf, offset + 2);
    // SOFn markers carry width/height (excludes DHT C4, JPG C8, DAC CC).
    if (
      (marker >= 0xc0 && marker <= 0xcf) &&
      marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
    ) {
      const height = readUInt16BE(buf, offset + 5);
      const width = readUInt16BE(buf, offset + 7);
      if (width > 0 && height > 0) return { width, height };
      return null;
    }
    offset += 2 + length;
  }
  return null;
}

function pngDimensions(buf: Buffer): { width: number; height: number } | null {
  // PNG signature (8) + IHDR length (4) + 'IHDR' (4) => dims at 16 and 20.
  if (buf.length < 24) return null;
  if (
    buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47
  ) return null;
  const width = readUInt32BE(buf, 16);
  const height = readUInt32BE(buf, 20);
  if (width > 0 && height > 0) return { width, height };
  return null;
}

function gifDimensions(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 10) return null;
  if (buf[0] !== 0x47 || buf[1] !== 0x49 || buf[2] !== 0x46) return null;
  return { width: readUInt16LE(buf, 6), height: readUInt16LE(buf, 8) };
}

function webpDimensions(buf: Buffer): { width: number; height: number } | null {
  // RIFF(4) size(4) WEBP(4) => chunk FourCC at 12, payload from 20.
  if (buf.length < 30) return null;
  if (buf[0] !== 0x52 || buf[1] !== 0x49 || buf[2] !== 0x46 || buf[3] !== 0x46) return null;
  if (buf[8] !== 0x57 || buf[9] !== 0x45 || buf[10] !== 0x42 || buf[11] !== 0x50) return null;
  const fourcc = buf.slice(12, 16).toString('ascii');
  if (fourcc === 'VP8 ') {
    // Lossy: 14-bit LE width/height at 26/28.
    return { width: readUInt16LE(buf, 26) & 0x3fff, height: readUInt16LE(buf, 28) & 0x3fff };
  }
  if (fourcc === 'VP8L') {
    // Lossless: 14-bit (val-1) packed into 4 LE bytes at 21.
    const bits = readUInt32LE(buf, 21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (fourcc === 'VP8X') {
    // Extended: 24-bit (val-1) canvas size at 24/27.
    return { width: readUInt24LE(buf, 24) + 1, height: readUInt24LE(buf, 27) + 1 };
  }
  return null;
}

/**
 * Resolve intrinsic dimensions for a public asset path (e.g. `/images/blog/x.jpg`).
 * Returns `fallback` for remote URLs, missing files, or unknown formats.
 */
export function getPublicImageDimensions(
  src: string,
  fallback: { width: number; height: number } = DEFAULT_IMAGE_DIMS,
): { width: number; height: number } {
  if (!src || !src.startsWith('/')) return fallback;
  const cached = dimCache.get(src);
  if (cached) return cached;

  let dims = fallback;
  try {
    const filePath = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', src);
    const buf = readFileSync(filePath);
    // Each parser validates its own signature and returns null otherwise,
    // so the order is not significant.
    dims =
      jpegDimensions(buf) ??
      pngDimensions(buf) ??
      gifDimensions(buf) ??
      webpDimensions(buf) ??
      fallback;
  } catch {
    dims = fallback;
  }

  dimCache.set(src, dims);
  return dims;
}
