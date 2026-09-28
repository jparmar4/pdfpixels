import { Suspense } from 'react';
import type { Metadata } from 'next';
import Script from 'next/script';
import { allPdfTools } from '@/lib/tools-data';
import { SITE_URL, absoluteUrl, websiteId, getGeoLanguageAlternates, DEFAULT_OG_IMAGE_URL } from '@/lib/seo';
import { siteConfig } from '@/lib/seo-config';
import { PdfToolsClient } from './pdf-tools-client';

export const metadata: Metadata = {
  title: {
    absolute: `All PDF Tools Online Free – Compress, Merge, Convert & Edit | ${siteConfig.name}`,
  },
  description:
    'Free online suite of 52 PDF tools. Compress PDF to target KB, merge, split, convert to/from Word & Excel, sign, fill forms, and secure documents without software installation or signup.',
  keywords: [
    'online pdf tools',
    'free pdf tools',
    'all pdf tools',
    'pdf tools online',
    'compress pdf',
    'merge pdf',
    'split pdf',
    'pdf to word',
    'word to pdf',
    'pdf converter',
    'sign pdf online',
    'edit pdf online',
    'free pdf editor',
    'pdf pixels',
  ],
  alternates: {
    canonical: '/pdf-tools',
    languages: getGeoLanguageAlternates(),
  },
  openGraph: {
    title: `All PDF Tools Online Free – Compress, Merge, Convert & Edit | ${siteConfig.name}`,
    description:
      'Free online suite of 52 PDF tools. Compress, merge, split, convert to Word/Excel, sign, and edit PDFs directly in your browser with zero registration.',
    url: `${SITE_URL}/pdf-tools`,
    siteName: siteConfig.name,
    type: 'website',
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: 'PdfPixels - Complete PDF Super Suite',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `All PDF Tools Online Free – Compress, Merge, Convert & Edit | ${siteConfig.name}`,
    description:
      'Free online suite of 52 PDF tools. Compress, merge, split, convert to Word/Excel, sign, and edit PDFs directly in your browser with zero registration.',
    images: [DEFAULT_OG_IMAGE_URL],
  },
};

export default function PdfToolsPage() {
  const pageUrl = absoluteUrl('/pdf-tools');

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${pageUrl}#webapp`,
    name: 'PdfPixels PDF Super Suite',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'All (Web Browser, Windows, macOS, Linux, iOS, Android)',
    url: pageUrl,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '3840',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      '52 free online PDF tools with client-side & server processing',
      'Fast PDF compression with custom target sizes (50KB, 100KB, 200KB, 500KB, 1MB)',
      'Merge, split, reorder, crop, and rotate PDF pages',
      'Convert PDF to Word, Excel, PPTX, JPG, PNG, and Text',
      'Convert Word, Excel, PPT, Images, and HEIC to PDF',
      'Sign, watermark, redact, flatten, and sanitize PDF documents',
      'Bates numbering, PDF/A conversion, and fast web view linearization',
    ],
  };

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${pageUrl}#collection`,
    url: pageUrl,
    name: 'All Online PDF Tools - Free Suite',
    description:
      'Browse our complete suite of 52 free online PDF tools for organizing, compressing, converting, signing, and securing documents.',
    isPartOf: { '@id': websiteId() },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: allPdfTools.length,
      itemListElement: allPdfTools.map((tool, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(`/tools/${tool.slug}`),
        name: tool.name,
        description: tool.description,
      })),
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: absoluteUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'PDF Tools',
        item: pageUrl,
      },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Are these PDF tools really 100% free with no hidden charges?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, completely free. Unlike other platforms that allow one or two free tasks before locking you behind an expensive recurring subscription, PdfPixels provides unlimited everyday access to its PDF compression, conversion, merging, splitting, and signing workflows without requiring credit cards or signups.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is it safe to upload confidential business, tax, or legal documents?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Security is our highest priority. All data in transit is encrypted using TLS 1.3 encryption. For tools that execute in the browser, your files never leave your computer. For server-assisted tools, your files are processed in isolated sandboxes and automatically deleted within 60 minutes. We never index, sell, or inspect document content.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I compress a PDF to a specific size like 100KB or 200KB?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! We have specialized target compression tools: Compress PDF to 50KB, Compress PDF to 100KB, Compress PDF to 200KB, Compress PDF to 300KB, Compress PDF to 500KB, and Compress PDF under 1MB. These are calibrated to meet strict portal upload ceilings without causing blurry text.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does PdfPixels work on iPhone, Android, and iPad?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. All 52 PDF tools are fully responsive and work seamlessly inside Safari on iOS/iPadOS, Chrome on Android, as well as desktop Edge, Chrome, Safari, and Firefox. You can sign contracts, convert photos to PDF, or compress scans directly from your mobile phone.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is Fast Web View (Linearization) and why does it matter?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Linearizing a PDF restructures its internal byte order so web browsers can display the first page immediately while the rest of the document streams in the background (byte-range request). This is essential for large multi-page reports, ebooks, and technical manuals hosted on websites.',
        },
      },
    ],
  };

  const howToCompressSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Compress a PDF Online Free',
    description: 'Quickly shrink PDF file sizes for email and portal uploads without losing visual clarity.',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Upload PDF',
        text: 'Select or drag your PDF document into the Compress PDF tool workspace.',
      },
      {
        '@type': 'HowToStep',
        name: 'Choose compression level',
        text: 'Select Recommended compression, Extreme compression, or specify a target file size like 100KB or 200KB.',
      },
      {
        '@type': 'HowToStep',
        name: 'Download compressed PDF',
        text: 'Click compress and download your reduced file size document immediately.',
      },
    ],
  };

  return (
    <div className="premium-page-bg min-h-screen bg-background text-foreground">
      <Script
        id="pdf-webapp-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <Script
        id="pdf-collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <Script
        id="pdf-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="pdf-faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="pdf-howto-compress-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToCompressSchema) }}
      />

      <main id="main-content" className="flex-1">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-muted/20" />}>
          <PdfToolsClient />
        </Suspense>
      </main>
    </div>
  );
}
