import { NextResponse } from 'next/server';
import { SITE_CONTENT_UPDATED } from '@/lib/seo';
import { platformLimits } from '@/lib/limits';

export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json(
    {
      service: 'PdfPixels',
      verifiedDate: SITE_CONTENT_UPDATED.toISOString().slice(0, 10),
      limits: platformLimits,
      privacy: {
        clientSideTools:
          'Processed 100% locally in browser memory via WebAssembly (PDF-lib / PDF.js / Canvas); files never leave the user device.',
        serverSideTools:
          'Processed in isolated ephemeral memory and purged immediately after the response completes; zero permanent storage and never used for AI training.',
        signupRequired: false,
        watermarksAdded: false,
      },
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
