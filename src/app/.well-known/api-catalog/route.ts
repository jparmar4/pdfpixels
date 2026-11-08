import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  const linkset = {
    linkset: [
      {
        anchor: 'https://www.pdfpixels.com/api/mcp',
        'service-desc': [
          {
            href: 'https://www.pdfpixels.com/.well-known/mcp/server-card.json',
            type: 'application/json',
          },
          {
            href: 'https://www.pdfpixels.com/openapi.json',
            type: 'application/openapi+json',
          },
        ],
        'service-doc': [
          {
            href: 'https://www.pdfpixels.com/api-docs',
            type: 'text/html',
          },
          {
            href: 'https://www.pdfpixels.com/llms-full.txt',
            type: 'text/plain',
          },
        ],
        status: [
          {
            href: 'https://www.pdfpixels.com/api/health',
            type: 'application/json',
          },
        ],
      },
      {
        anchor: 'https://www.pdfpixels.com/api',
        'service-desc': [
          {
            href: 'https://www.pdfpixels.com/openapi.json',
            type: 'application/openapi+json',
          },
        ],
        'service-doc': [
          {
            href: 'https://www.pdfpixels.com/api-docs',
            type: 'text/html',
          },
        ],
        status: [
          {
            href: 'https://www.pdfpixels.com/api/health',
            type: 'application/json',
          },
        ],
      },
    ],
  };

  return new NextResponse(JSON.stringify(linkset, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/linkset+json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Content-Signal': 'search=yes, ai-input=yes, ai-train=no',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
