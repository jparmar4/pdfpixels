import Script from 'next/script';
import { allTools } from '@/lib/tools-data';
import { collectionItemListJsonLd } from '@/app/jsonld-helpers';
import { SITE_URL } from '@/lib/seo';
import { ToolsClient } from './tools-client';

export default function ToolsPage() {
  const items = allTools.map((tool) => ({
    url: `${SITE_URL}/tools/${tool.slug}`,
    name: tool.name,
  }));

  const jsonLd = collectionItemListJsonLd({
    baseUrl: `${SITE_URL}/tools`,
    title: `PdfPixels Tools`,
    description: `Browse PdfPixels free online PDF and image tools: compression, conversion, resizing, merging, splitting, background removal, OCR, and document preparation.`,
    items,
  });

  return (
    <div className="premium-page-bg min-h-screen bg-background text-foreground">
      <Script
        id="tools-collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main id="main-content" className="flex-1">
        <ToolsClient />
      </main>
    </div>
  );
}
