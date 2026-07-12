import { apiError } from '@/lib/api-response';
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

        if (!file.type.startsWith('image/')) {
            return apiError('File must be an image', 400);
        }

        // Validate file size (max 10MB for OCR)
        if (file.size > 10 * 1024 * 1024) {
            return apiError('Image too large. Maximum 10MB for OCR.', 400);
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Convert to base64 for client-side processing
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;

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
