import type { Metadata } from 'next';
import Script from 'next/script';
import { collectionItemListJsonLd } from '@/app/jsonld-helpers';
import { SITE_URL, absoluteUrl, DEFAULT_OG_IMAGE_URL } from '@/lib/seo';
import { siteConfig } from '@/lib/seo-config';
import { useCasePages } from '@/lib/use-cases';
import { UseCasesClient } from './use-cases-client';

export const metadata: Metadata = {
  title: 'PDF & Image Use Cases & Step-by-Step Guides | PdfPixels',
  description: 'Find intent-driven guides and workflows for common PDF and image tasks: compress to target KB, passport photo maker, background removal, and format conversion.',
  alternates: {
    canonical: '/use-cases',
  },
  openGraph: {
    title: 'PDF & Image Use Cases & Step-by-Step Guides | PdfPixels',
    description: 'Find intent-driven guides and workflows for common PDF and image tasks.',
    url: absoluteUrl('/use-cases'),
    siteName: siteConfig.name,
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: 'PdfPixels Use Cases',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDF & Image Use Cases & Step-by-Step Guides | PdfPixels',
    description: 'Find intent-driven guides and workflows for common PDF and image tasks.',
    images: [DEFAULT_OG_IMAGE_URL],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function UseCasesIndexPage() {
  const items = useCasePages.map((useCase) => ({
    url: `${SITE_URL}/use-cases/${useCase.slug}`,
    name: useCase.title,
  }));

  const jsonLd = collectionItemListJsonLd({
    baseUrl: `${SITE_URL}/use-cases`,
    title: 'PdfPixels Use Cases & Guides',
    description: 'Intent-driven step-by-step guides for PDF compression, image resizing, document conversion, and AI editing.',
    items,
  });

  return (
    <div className="premium-page-bg min-h-screen bg-background text-foreground">
      <Script
        id="use-cases-collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main id="main-content" className="flex-1">
        <UseCasesClient />
      </main>
    </div>
  );
}
