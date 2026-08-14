'use client';

import { isHeicFileName, isHeicMime } from '@/lib/heic-detect';

export function isHeicUpload(file: File): boolean {
  return isHeicFileName(file.name) || isHeicMime(file.type);
}

/** Decode a HEIC/HEIF file to a JPEG File so canvas tools and previews work. */
export async function normalizeHeicFile(file: File): Promise<File> {
  if (!isHeicUpload(file)) return file;

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/image/heic', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let message = 'Could not read this HEIC photo';
    try {
      const payload = await response.json();
      message = payload?.error || message;
    } catch {
      // keep default
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const baseName = file.name.replace(/\.hei[cf]$/i, '') || 'photo';
  return new File([blob], `${baseName}.jpg`, {
    type: 'image/jpeg',
    lastModified: file.lastModified,
  });
}
