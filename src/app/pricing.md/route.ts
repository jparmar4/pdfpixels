import { NextResponse } from 'next/server';
import { allTools, allPdfTools, allImageTools } from '@/lib/tools-data';
import { absoluteUrl } from '@/lib/seo';
import { platformLimits } from '@/lib/limits';

export const dynamic = 'force-static';

export async function GET() {
  const markdown = `# PdfPixels Pricing

> Every tool on PdfPixels (${allTools.length}+ total: ${allPdfTools.length} PDF tools and ${allImageTools.length} image tools) is **100% free ($0)** with no paid tiers, no credit card checkout, no watermarks, and no signup required.

## Plan Summary

| Plan | Price | Access | Watermarks | Registration |
| :--- | :--- | :--- | :--- | :--- |
| Free (Only Tier) | $0 / forever | All ${allTools.length}+ PDF & image tools | None | Not required |

## Verified Processing Limits

- **Single PDF Upload:** Up to ${platformLimits.pdf.maxFileMb} MB
- **Merge PDF Batch:** Up to ${platformLimits.pdf.merge.maxFiles} files (${platformLimits.pdf.merge.maxTotalMb} MB combined, ${platformLimits.pdf.merge.maxTotalPages} pages)
- **Single Image Upload:** Up to ${platformLimits.image.maxFileMb} MB (${platformLimits.image.maxMegapixels} MP max)
- **Privacy Model:** ~80% client-side WebAssembly (files never leave device); server-assisted tools purge temporary files immediately after download.
- **How PdfPixels is Funded:** Consent-gated display advertising; there is no paid Pro checkout or hidden subscription wall.

## Canonical References

- Pricing Page: ${absoluteUrl('/pricing')}
- Machine-Readable Limits JSON: ${absoluteUrl('/api/limits')}
- Privacy & Security Architecture: ${absoluteUrl('/privacy')}
- Full LLM Reference: ${absoluteUrl('/llms-full.txt')}
`;

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Signal': 'search=yes, ai-input=yes, ai-train=no',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Access-Control-Allow-Origin': '*',
      Link: `<${absoluteUrl('/pricing')}>; rel="canonical"`,
    },
  });
}
