import { NextResponse } from 'next/server';
import { buildLlmsFullTxt } from '@/lib/llms-content';

export const dynamic = 'force-static';

export async function GET() {
  return new NextResponse(buildLlmsFullTxt(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Signal': 'search=yes, ai-input=yes, ai-train=no',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
