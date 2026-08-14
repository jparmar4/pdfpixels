import { apiError } from '@/lib/api-response';
import { decodeHeicToJpeg, isLikelyHeic } from '@/lib/heic';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const CACHE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
};

const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return apiError('No image provided', 400);
    }

    if (file.size > MAX_BYTES) {
      return apiError('File too large. Maximum size is 25 MB', 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!isLikelyHeic({ name: file.name, type: file.type }, buffer)) {
      return apiError('This file does not look like a HEIC/HEIF photo.', 400);
    }

    const jpeg = await decodeHeicToJpeg(buffer);
    return new NextResponse(new Uint8Array(jpeg), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': 'inline; filename="converted.jpg"',
        ...CACHE_HEADERS,
      },
    });
  } catch (error) {
    console.error('HEIC decode error:', error);
    const message = error instanceof Error ? error.message : 'Failed to convert HEIC';
    return apiError(message, 422);
  }
}
