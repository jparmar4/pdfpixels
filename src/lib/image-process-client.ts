'use client';

import { fetchWithUploadProgress } from '@/lib/upload-with-progress';

export interface ProcessedImageResult {
  imageUrl: string;
  isBlobUrl: boolean;
  originalSize: number;
  processedSize: number;
  savedBytes: number;
  savedPercent: number;
  originalDimensions: { width: number; height: number };
  format: string;
  mimeType: string;
}

function parseHeaderInt(headers: Headers, name: string, fallback = 0): number {
  const raw = headers.get(name);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Sends an image processing FormData payload to `/api/image/process` in binary mode
 * to avoid 33% Base64 encoding overhead, transparently supporting JSON fallback.
 */
export async function requestProcessedImage(
  formData: FormData,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<ProcessedImageResult> {
  if (!formData.has('responseType')) {
    formData.append('responseType', 'binary');
  }

  const response = await fetchWithUploadProgress('/api/image/process', formData, onProgress, signal);

  if (!response.ok) {
    let message = 'Processing failed';
    try {
      const errorJson = await response.json();
      message = errorJson?.error || message;
    } catch {
      // Keep default message.
    }
    throw new Error(message);
  }

  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  if (contentType.includes('application/json')) {
    const data = await response.json();
    return {
      imageUrl: data.imageUrl,
      isBlobUrl: false,
      originalSize: Number(data.originalSize) || 0,
      processedSize: Number(data.processedSize) || 0,
      savedBytes: Number(data.savedBytes) || 0,
      savedPercent: Number(data.savedPercent) || 0,
      originalDimensions: {
        width: Number(data.originalDimensions?.width) || 0,
        height: Number(data.originalDimensions?.height) || 0,
      },
      format: String(data.format || 'jpg'),
      mimeType: String(data.mimeType || 'image/jpeg'),
    };
  }

  const blob = await response.blob();
  const processedSize = parseHeaderInt(response.headers, 'X-Processed-Size', blob.size);
  const originalSize = parseHeaderInt(response.headers, 'X-Original-Size', processedSize);
  const savedBytes = parseHeaderInt(
    response.headers,
    'X-Saved-Bytes',
    Math.max(0, originalSize - processedSize),
  );
  const savedPercent = parseHeaderInt(
    response.headers,
    'X-Saved-Percent',
    originalSize > 0 ? Math.max(0, Math.round(((originalSize - processedSize) / originalSize) * 100)) : 0,
  );
  const mimeType = blob.type || contentType || 'image/jpeg';
  const format =
    response.headers.get('X-Image-Format') ||
    mimeType.split('/')[1]?.replace('jpeg', 'jpg') ||
    'jpg';

  return {
    imageUrl: URL.createObjectURL(blob),
    isBlobUrl: true,
    originalSize,
    processedSize,
    savedBytes,
    savedPercent,
    originalDimensions: {
      width: parseHeaderInt(response.headers, 'X-Original-Width', 0),
      height: parseHeaderInt(response.headers, 'X-Original-Height', 0),
    },
    format,
    mimeType,
  };
}
