import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: 'PdfPixels API',
    version: '1.0.0',
    description: 'Free Online PDF & Image Tools',
    endpoints: {
      image: {
        process: '/api/image/process',
        ocr: '/api/image/ocr',
      },
      pdf: {
        compress: '/api/pdf/compress',
        merge: '/api/pdf/merge',
        split: '/api/pdf/split',
        rotate: '/api/pdf/rotate',
        watermark: '/api/pdf/watermark',
        protect: '/api/pdf/protect',
        reorder: '/api/pdf/reorder',
        deletePages: '/api/pdf/delete-pages',
        fromImage: '/api/pdf/from-image',
        toImage: '/api/pdf/to-image',
      },
      ai: '/api/ai',
      newsletter: '/api/newsletter',
      contact: '/api/contact',
    },
    documentation: '/api-docs',
    status: 'operational',
  });
}
