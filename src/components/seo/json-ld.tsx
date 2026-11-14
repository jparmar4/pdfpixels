import { faqData, organizationData, webAppData, howToData, seoConfig } from '@/lib/seo-config';
import { toolCategories } from '@/lib/tools-data';
import { absoluteUrl, DEFAULT_OG_IMAGE_URL, getHomepageFeaturedTools, getSiteSearchUrlTemplate, organizationId, websiteId, SITE_CONTENT_UPDATED } from '@/lib/seo';

const featuredTools = getHomepageFeaturedTools();

function KnowledgeGraphSchema() {
  // Stable dateModified so HTML + sitemap cache stays valid across requests.
  const today = SITE_CONTENT_UPDATED.toISOString();

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId(),
        name: organizationData.name,
        legalName: organizationData.legalName,
        alternateName: organizationData.alternateName,
        url: organizationData.url,
        logo: {
          '@type': 'ImageObject',
          url: organizationData.logo,
          width: 512,
          height: 512,
        },
        image: organizationData.logo,
        description: organizationData.description,
        foundingDate: organizationData.foundingDate,
        email: organizationData.email,
        telephone: organizationData.telephone,
        sameAs: organizationData.sameAs,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: organizationData.contactPoint.contactType,
          email: organizationData.contactPoint.email,
          telephone: organizationData.contactPoint.telephone,
          areaServed: organizationData.contactPoint.areaServed,
          url: organizationData.contactPoint.url,
          availableLanguage: organizationData.contactPoint.availableLanguage,
        },
        founder: organizationData.founder,
        address: organizationData.address,
        slogan: seoConfig.tagline,
        // Topical authority signal for answer engines deciding whether
        // PdfPixels is a citable source on a PDF/image topic.
        knowsAbout: [
          'PDF compression',
          'PDF merging',
          'PDF splitting',
          'PDF page extraction',
          'PDF to Word conversion',
          'PDF to Excel conversion',
          'PDF to JPG conversion',
          'OCR text recognition',
          'image compression',
          'image resizing',
          'background removal',
          'HEIC to JPG conversion',
          'passport photo preparation',
          'PDF signing',
          'PDF password protection',
          'file format conversion',
          'ISO 32000-2 (PDF 2.0)',
          'ISO 19005 (PDF/A long-term archiving)',
          'PAdES digital signatures',
          'eIDAS compliance',
          'AES-256 PDF encryption',
          'lossless image optimization',
          'Bates numbering legal workflow',
          'linearized Fast Web View PDF streaming',
          'PDF to PNG conversion',
          'Bank statement financial parsing',
          'PDF sanitization & redaction',
          'USCIS document preparation',
          'Mortgage bank statement merging',
          'Small business document management',
          'Zero-knowledge document workflows',
          'FTC Safeguards Rule 16 CFR Part 314',
          'NIST SP 800-88 sanitization',
          'eSignature compliance and audit logs',
          'PDF to CSV financial table extraction',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': websiteId(),
        url: absoluteUrl('/'),
        name: organizationData.name,
        description: webAppData.description,
        publisher: {
          '@id': organizationId(),
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
        operatingSystem: 'Windows, macOS, Linux, iOS, Android',
        browserRequirements: 'Requires JavaScript and HTML5 Canvas',
        isAccessibleForFree: true,
        offers: {
          '@type': 'Offer',
          price: webAppData.offers.price,
          priceCurrency: webAppData.offers.priceCurrency,
          availability: 'https://schema.org/InStock',
        },
        provider: {
          '@id': organizationId(),
        },
        featureList: webAppData.featureList,
        screenshot: DEFAULT_OG_IMAGE_URL,
        dateModified: today,
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

export function HomePageSchemas() {
  const standardQuestions = faqData.slice(0, 12).map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  }));

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${absoluteUrl('/')}/#homepage`,
        name: 'PdfPixels - Free Online PDF & Image Tools',
        url: absoluteUrl('/'),
        description: 'Homepage for PdfPixels, a free online platform for PDF and image tools.',
        isPartOf: {
          '@id': websiteId(),
        },
        about: {
          '@id': organizationId(),
        },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: DEFAULT_OG_IMAGE_URL,
          width: 1200,
          height: 630,
        },
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['#home-hero-title', '#home-hero-summary', '#faq-section h2'],
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
      },
      {
        '@type': 'FAQPage',
        '@id': `${absoluteUrl('/')}/#faq`,
        mainEntity: standardQuestions,
      },
      ...howToData.map((howTo) => ({
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
      })),
      {
        '@type': 'Service',
        '@id': `${absoluteUrl('/')}/#service`,
        serviceType: 'Online PDF and image processing',
        provider: {
          '@id': organizationId(),
        },
        areaServed: 'Worldwide',
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'PdfPixels Tool Categories',
          itemListElement: toolCategories.map((category) => ({
            '@type': 'OfferCatalog',
            name: category.name,
            description: category.description,
            numberOfItems: category.tools.length,
            url: absoluteUrl(`/tools/category/${category.id}`),
          })),
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
    />
  );
}

export function APISchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebAPI',
    name: 'PdfPixels API',
    description: 'Public API documentation for image and PDF processing workflows.',
    url: absoluteUrl('/api-docs'),
    documentation: absoluteUrl('/api-docs'),
    termsOfService: absoluteUrl('/terms'),
    provider: {
      '@id': organizationId(),
    },
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

export function JsonLdSchemas() {
  return <KnowledgeGraphSchema />;
}

