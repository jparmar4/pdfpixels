export {
  IMAGE_FILE_EXTENSIONS,
  isHeicBuffer,
  isHeicFileName,
  isHeicMime,
  isImageFileName,
  isImageUpload,
  isLikelyHeic,
} from '@/lib/heic-detect';

import { isLikelyHeic } from '@/lib/heic-detect';

export async function decodeHeicToJpeg(buffer: Buffer, quality = 0.92): Promise<Buffer> {
  const convertModule = await import('heic-convert');
  const convert = (convertModule.default || convertModule) as (options: {
    buffer: Buffer;
    format: 'JPEG' | 'PNG';
    quality?: number;
  }) => Promise<ArrayBuffer>;

  const output = await convert({
    buffer,
    format: 'JPEG',
    quality,
  });

  return Buffer.from(new Uint8Array(output));
}

export async function decodeHeicIfNeeded(
  buffer: Buffer,
  fileName?: string,
  mimeType?: string,
): Promise<{ buffer: Buffer; converted: boolean }> {
  if (!isLikelyHeic({ name: fileName, type: mimeType }, buffer)) {
    return { buffer, converted: false };
  }

  try {
    const jpeg = await decodeHeicToJpeg(buffer);
    return { buffer: jpeg, converted: true };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown decode error';
    throw new Error(`Could not decode this HEIC/HEIF photo. ${detail}`);
  }
}
