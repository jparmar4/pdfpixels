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
        sameAs: organizationData.sameAs,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: organizationData.contactPoint.contactType,
          email: organizationData.contactPoint.email,
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

function FAQSchema() {
  // Single source of truth: faqData is also what FAQSection renders, so the
  // schema always matches visible HTML (rich-result eligibility requirement).
  const standardQuestions = faqData.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  }));

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: standardQuestions,
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />;
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
      '@id': websiteId(),
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
  // Full offer catalog generated from the tool registry so the homepage
  // entity graph stays in sync with every tool (previously hardcoded to 5).
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Online PDF and image processing',
    provider: {
      '@id': organizationId(),
    },
    areaServed: 'Worldwide',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'PdfPixels tools',
      itemListElement: toolCategories.map((category) => ({
        '@type': 'OfferCatalog',
        name: category.name,
        url: absoluteUrl(`/tools/category/${category.id}`),
        itemListElement: category.tools.map((tool) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: tool.name,
            description: tool.description,
            url: absoluteUrl(`/tools/${tool.slug}`),
          },
        })),
      })),
    },
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
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

// AEOAnswerSchema has been merged into FAQSchema

export function JsonLdSchemas() {
  return <KnowledgeGraphSchema />;
}

export function HomePageSchemas() {
  return (
    <>
      <HomepageCollectionSchema />
      <FAQSchema />
      <HowToSchemas />
      <ServiceSchema />
      <SpeakableSchema />
    </>
  );
}

