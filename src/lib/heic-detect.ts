export const IMAGE_FILE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.bmp',
  '.tif',
  '.tiff',
  '.avif',
  '.heic',
  '.heif',
  '.svg',
] as const;

const HEIC_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'heim', 'heis']);

export function isHeicFileName(name?: string | null): boolean {
  return /\.hei[cf]$/i.test(name || '');
}

export function isHeicMime(type?: string | null): boolean {
  const mime = (type || '').toLowerCase();
  return (
    mime === 'image/heic' ||
    mime === 'image/heif' ||
    mime === 'image/heic-sequence' ||
    mime === 'image/heif-sequence'
  );
}

export function isHeicBuffer(buffer: Buffer | Uint8Array): boolean {
  if (!buffer || buffer.length < 12) return false;
  const ftyp = Buffer.from(buffer.subarray(4, 8)).toString('ascii');
  if (ftyp !== 'ftyp') return false;
  const brand = Buffer.from(buffer.subarray(8, 12)).toString('ascii');
  return HEIC_BRANDS.has(brand);
}

export function isImageFileName(name?: string | null): boolean {
  const lower = (name || '').toLowerCase();
  return IMAGE_FILE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function isImageUpload(file: { name?: string; type?: string }): boolean {
  if (file.type?.startsWith('image/')) return true;
  return isImageFileName(file.name);
}

export function isLikelyHeic(
  file: { name?: string; type?: string },
  buffer?: Buffer | Uint8Array,
): boolean {
  if (isHeicFileName(file.name) || isHeicMime(file.type)) return true;
  return buffer ? isHeicBuffer(buffer) : false;
}
