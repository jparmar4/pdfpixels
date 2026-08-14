import { apiError } from '@/lib/api-response';
import { decodeHeicIfNeeded, isImageUpload } from '@/lib/heic';
import { NextRequest, NextResponse } from 'next/server';

const CACHE_HEADERS = {
    'Cache-Control': 'no-store, max-age=0',
};

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('image') as File;
        const language = (formData.get('language') as string) || 'eng';

        if (!file) {
            return apiError('No image provided', 400);
        }

        if (!isImageUpload(file)) {
            return apiError('File must be an image', 400);
        }

        // Validate file size (max 10MB for OCR)
        if (file.size > 10 * 1024 * 1024) {
            return apiError('Image too large. Maximum 10MB for OCR.', 400);
        }

        const arrayBuffer = await file.arrayBuffer();
        let buffer: Buffer = Buffer.from(arrayBuffer);
        let mimeType = file.type || 'image/jpeg';
        try {
            const decoded = await decodeHeicIfNeeded(buffer, file.name, file.type);
            buffer = decoded.buffer;
            if (decoded.converted) mimeType = 'image/jpeg';
        } catch (error) {
            return apiError(error instanceof Error ? error.message : 'Could not decode this HEIC photo', 400);
        }

        // Convert to base64 for client-side processing
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${mimeType};base64,${base64}`;

        // Return the processed image URL for client-side Tesseract.js
        return NextResponse.json({
            success: true,
            imageUrl: dataUrl,
            language,
            processingMode: 'client', // Signal to client to run Tesseract
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
        }, { headers: CACHE_HEADERS });

    } catch (error) {
        console.error('OCR error:', error);
        return apiError('Failed to process image for OCR', 500);
    }
}
