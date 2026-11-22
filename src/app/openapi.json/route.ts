import { NextResponse } from 'next/server';
import { buildOpenApiSpec } from '@/lib/openapi-spec';

export const dynamic = 'force-static';

export async function GET() {
  return new NextResponse(JSON.stringify(buildOpenApiSpec(), null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/openapi+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
