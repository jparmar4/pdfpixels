import { NextResponse } from 'next/server';
import { SITE_CONTENT_UPDATED } from '@/lib/seo';
import { allTools, toolCategories } from '@/lib/tools-data';

export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'PdfPixels',
      version: '1.1.0',
      url: 'https://www.pdfpixels.com',
      mcpEndpoint: 'https://www.pdfpixels.com/api/mcp',
      openapiEndpoint: 'https://www.pdfpixels.com/openapi.json',
      limitsEndpoint: 'https://www.pdfpixels.com/api/limits',
      toolsCount: allTools.length,
      categoriesCount: toolCategories.length,
      updatedAt: SITE_CONTENT_UPDATED.toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
