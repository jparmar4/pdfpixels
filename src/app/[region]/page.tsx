import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { geoRegions, getRegionByCode } from '@/lib/geo-data';
import { siteConfig } from '@/lib/seo-config';
import { absoluteUrl } from '@/lib/seo';
import { ToolsSection } from '@/components/home/tools-section';
import { StatsBanner } from '@/components/home/stats-banner';
import { AnswerEngineSection } from '@/components/home/answer-engine-section';

// Dynamic imports to match the homepage performance
const HowItWorks = dynamic(() => import('@/components/home/how-it-works').then(m => m.HowItWorks), {
  loading: () => <div className="h-72 animate-pulse bg-muted/20 rounded-2xl mx-4" />,
});

const TestimonialsSection = dynamic(() => import('@/components/home/testimonials-section').then(m => m.TestimonialsSection), {
  loading: () => <div className="h-96 animate-pulse bg-muted/20 rounded-2xl mx-4" />,
});

const FeaturesSection = dynamic(() => import('@/components/home/features-section').then(m => m.FeaturesSection), {
  loading: () => <div className="h-80 animate-pulse bg-muted/20 rounded-2xl mx-4" />,
});

const FAQSection = dynamic(() => import('@/components/home/faq-section').then(m => m.FAQSection), {
  loading: () => <div className="h-64 animate-pulse bg-muted/20 rounded-2xl mx-4" />,
});

const CTASection = dynamic(() => import('@/components/home/cta-section').then(m => m.CTASection));

const ScrollToTop = dynamic(() => import('@/components/home/scroll-to-top').then(m => m.ScrollToTop));

// Restrict this dynamic route to strictly the configured geo regions.
export const dynamicParams = false;

export function generateStaticParams() {
  return geoRegions.map((region) => ({
    region: region.code,
  }));
}

interface GeoPageProps {
  params: Promise<{ region: string }>;
}

export async function generateMetadata({ params }: GeoPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const region = getRegionByCode(resolvedParams.region);
  
  if (!region) {
    return {};
  }

  const url = `/${region.code}`;
  const title = `Free Online PDF & Image Tools in ${region.name} - ${siteConfig.name}`;
  const description = `The #1 set of fast, secure PDF and Image tools tailored for users in ${region.name}. Compress, resize, and convert for free.`;

  // Build hreflang object
  const languages: Record<string, string> = {
    'x-default': siteConfig.url,
  };
  geoRegions.forEach((r) => {
    languages[r.locale] = `${siteConfig.url}/${r.code}`;
  });

  return {
    title,
    description,
    alternates: {
      canonical: `${siteConfig.url}${url}`,
      languages,
    },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}${url}`,
    },
  };
}

export default async function GeoHubPage({ params }: GeoPageProps) {
  const resolvedParams = await params;
  const region = getRegionByCode(resolvedParams.region);

  if (!region) {
    notFound();
  }

  const regionUrl = absoluteUrl(`/${region.code}`);
  const regionSchemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${regionUrl}#webpage`,
      url: regionUrl,
      name: `Free Online PDF & Image Tools in ${region.name}`,
      description: `Fast, free PDF and image tools tailored for users in ${region.name}. Compress, merge, split, convert, and edit without signup.`,
      inLanguage: region.locale,
      isPartOf: { '@id': `${absoluteUrl('/')}/#website` },
      about: {
        '@type': 'Place',
        name: region.name,
      },
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['#home-hero-title', '#home-hero-summary'],
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: region.name, item: regionUrl },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `Are PdfPixels tools free to use in ${region.name}?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Yes. Core PDF and image tools on PdfPixels are free for users in ${region.name}, with no signup required for standard workflows.`,
          },
        },
        {
          '@type': 'Question',
          name: `Can I compress a PDF online in ${region.name}?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Yes. Open Compress PDF on PdfPixels, upload your file, choose a compression level, and download a smaller PDF suitable for email and form uploads in ${region.name}.`,
          },
        },
        {
          '@type': 'Question',
          name: `Does PdfPixels work on mobile devices in ${region.name}?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Yes. PdfPixels works in modern mobile and desktop browsers used across ${region.name}, including Chrome, Safari, Edge, and Firefox.`,
          },
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main id="main-content" className="flex-1">
        {regionSchemas.map((schema, index) => (
          <script
            key={`region-schema-${index}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
        <ToolsSection region={region} />
        <StatsBanner />
        <HowItWorks />
        <AnswerEngineSection />
        <TestimonialsSection />
        <FeaturesSection />
        <FAQSection />
        <CTASection />
      </main>
      <ScrollToTop />
    </div>
  );
}
