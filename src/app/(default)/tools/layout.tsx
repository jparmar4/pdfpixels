import type { Metadata } from 'next';

import { DEFAULT_OG_IMAGE_URL } from '@/lib/seo';
import { seoConfig, siteConfig } from '@/lib/seo-config';
import { allTools, aiTools, toolCategories } from '@/lib/tools-data';

export const metadata: Metadata = {
  title: `Free Online PDF & Image Tools - ${allTools.length}+ Tools`,
  description:
    'Browse PdfPixels free online PDF and image tools for compression, conversion, resizing, merging, splitting, background removal, OCR, metadata cleanup, and document preparation.',
  keywords: [
    ...seoConfig.primaryKeywords,
    ...seoConfig.secondaryKeywords,
    'all pdf tools',
    'online image tools list',
    'free file converter tools',
    'document preparation tools',
    'browser based pdf tools',
  ],
  alternates: {
    canonical: '/tools',
  },
  openGraph: {
    type: 'website',
    url: `${siteConfig.url}/tools`,
    siteName: siteConfig.name,
    title: `Free Online PDF & Image Tools - ${allTools.length}+ Tools | ${siteConfig.name}`,
    description:
      'Find free tools for PDFs, images, AI enhancement, OCR, compression, conversion, and everyday upload preparation.',
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: 'PdfPixels free online PDF and image tools directory',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Free Online PDF & Image Tools - ${allTools.length}+ Tools | ${siteConfig.name}`,
    description: 'Browse free PDF, image, AI, OCR, compression, and conversion tools on PdfPixels.',
    images: [DEFAULT_OG_IMAGE_URL],
  },
  other: {
    'tool-count': String(allTools.length),
    'tool-categories': String(toolCategories.length),
    'ai-tool-count': String(aiTools.length),
  },
};

export default function ToolsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
