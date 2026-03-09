import { faqData, organizationData, webAppData, howToData } from '@/lib/seo-config';
import { absoluteUrl, DEFAULT_OG_IMAGE_URL, getHomepageFeaturedTools, getSiteSearchUrlTemplate } from '@/lib/seo';

const featuredTools = getHomepageFeaturedTools();

function KnowledgeGraphSchema() {
  const today = new Date().toISOString();

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${absoluteUrl('/')}/#organization`,
        name: organizationData.name,
        alternateName: organizationData.alternateName,
        url: organizationData.url,
        logo: {
          '@type': 'ImageObject',
          url: organizationData.logo,
          width: 512,
          height: 512,
        },
        description: organizationData.description,
        foundingDate: organizationData.foundingDate,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: organizationData.contactPoint.contactType,
          email: organizationData.contactPoint.email,
          availableLanguage: organizationData.contactPoint.availableLanguage,
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${absoluteUrl('/')}/#website`,
        url: absoluteUrl('/'),
        name: organizationData.name,
        description: webAppData.description,
        publisher: {
          '@id': `${absoluteUrl('/')}/#organization`,
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: getSiteSearchUrlTemplate(),
          },
          'query-input': 'required name=search_term_string',
        },
        inLanguage: 'en-US',
      },
      {
        '@type': 'WebApplication',
        '@id': `${absoluteUrl('/')}/#webapp`,
        name: webAppData.name,
        description: webAppData.description,
        url: webAppData.url,
        applicationCategory: webAppData.applicationCategory,
        operatingSystem: webAppData.operatingSystem,
        browserRequirements: webAppData.browserRequirements,
        isAccessibleForFree: true,
        offers: {
          '@type': 'Offer',
          price: webAppData.offers.price,
          priceCurrency: webAppData.offers.priceCurrency,
          availability: 'https://schema.org/InStock',
        },
        provider: {
          '@id': `${absoluteUrl('/')}/#organization`,
        },
        featureList: webAppData.featureList,
        screenshot: DEFAULT_OG_IMAGE_URL,
        dateModified: today,
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

function FAQSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqData.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

function HowToSchemas() {
  return (
    <>
      {howToData.map((howTo, index) => {
        const schema = {
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: howTo.name,
          description: howTo.description,
          totalTime: howTo.estimatedTime,
          tool: {
            '@type': 'HowToTool',
            name: 'PdfPixels',
          },
          step: howTo.steps.map((step) => ({
            '@type': 'HowToStep',
            position: step.position,
            name: step.name,
            text: step.text,
          })),
        };

        return <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
      })}
    </>
  );
}

function HomepageCollectionSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${absoluteUrl('/')}/#homepage`,
    name: 'PdfPixels home',
    url: absoluteUrl('/'),
    description: 'Homepage for PdfPixels, a free online platform for PDF and image tools.',
    isPartOf: {
      '@id': `${absoluteUrl('/')}/#website`,
    },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: DEFAULT_OG_IMAGE_URL,
      width: 1200,
      height: 630,
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: featuredTools.map((tool, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(`/tools/${tool.slug}`),
        name: tool.name,
        description: tool.description,
      })),
    },
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

function BreadcrumbSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: absoluteUrl('/'),
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

function SpeakableSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'PdfPixels - Free online PDF and image tools',
    url: absoluteUrl('/'),
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['#home-hero-title', '#home-hero-summary', '#faq-section h2'],
    },
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

function ServiceSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Online PDF and image processing',
    provider: {
      '@id': `${absoluteUrl('/')}/#organization`,
    },
    areaServed: 'Worldwide',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'PdfPixels tools',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Compress Image',
            description: 'Reduce image file size for uploads, email, and web performance.',
            url: absoluteUrl('/tools/compress-image'),
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Merge PDF',
            description: 'Combine multiple PDF files into one document online.',
            url: absoluteUrl('/tools/merge-pdf'),
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Split PDF',
            description: 'Extract selected pages or split a PDF into separate files.',
            url: absoluteUrl('/tools/split-pdf'),
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Remove Background',
            description: 'Use AI to remove image backgrounds and export transparent PNG files.',
            url: absoluteUrl('/tools/remove-image-background'),
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'HEIC to JPG',
            description: 'Convert iPhone HEIC photos to JPG online.',
            url: absoluteUrl('/tools/heic-to-jpg'),
          },
        },
      ],
    },
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

function APISchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebAPI',
    name: 'PdfPixels API',
    description: 'Public API documentation for image and PDF processing workflows.',
    url: absoluteUrl('/api'),
    documentation: absoluteUrl('/api-docs'),
    termsOfService: absoluteUrl('/terms'),
    provider: {
      '@id': `${absoluteUrl('/')}/#organization`,
    },
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

function AEOAnswerSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What can I do on PdfPixels?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'PdfPixels helps with PDF and image tasks such as compressing files, resizing photos, converting formats, merging PDFs, splitting PDFs, and removing image backgrounds.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need to create an account to use PdfPixels?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. PdfPixels is designed so users can start core PDF and image workflows without creating an account first.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does PdfPixels support mobile browsers?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. The platform is designed to work across desktop and mobile browsers for common PDF and image tasks.',
        },
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

export function JsonLdSchemas() {
  return (
    <>
      <KnowledgeGraphSchema />
      <HowToSchemas />
      <ServiceSchema />
      <APISchema />
    </>
  );
}

export function HomePageSchemas() {
  return (
    <>
      <HomepageCollectionSchema />
      <FAQSchema />
      <AEOAnswerSchema />
      <BreadcrumbSchema />
      <SpeakableSchema />
    </>
  );
}

export function ToolSchema({ tool }: { tool: { id: string; slug?: string; name: string; description: string; keywords: string[] } }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    url: absoluteUrl(`/tools/${tool.id}`),
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    keywords: tool.keywords.join(', '),
    isPartOf: {
      '@id': `${absoluteUrl('/')}/#webapp`,
    },
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

