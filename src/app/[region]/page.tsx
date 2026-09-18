import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { geoRegions, getRegionByCode } from '@/lib/geo-data';
import { siteConfig } from '@/lib/seo-config';
import { absoluteUrl, websiteId, getGeoLanguageAlternates, DEFAULT_OG_IMAGE_URL } from '@/lib/seo';
import { ToolsSection } from '@/components/home/tools-section';
import { StatsBanner } from '@/components/home/stats-banner';
import { AnswerEngineSection } from '@/components/home/answer-engine-section';
// Static import: FAQ is now a server component using native <details>, so its
// Q&A text is present in served HTML for answer engines (AEO).
import { FAQSection } from '@/components/home/faq-section';

import { HowItWorks } from '@/components/home/how-it-works';
import { TestimonialsSection } from '@/components/home/testimonials-section';
import { FeaturesSection } from '@/components/home/features-section';
import { CTASection } from '@/components/home/cta-section';

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
  // Root layout appends `| PdfPixels` via the title template.
  const title = region.headline;
  const description = region.intro.slice(0, 160);

  return {
    title,
    description,
    alternates: {
      canonical: url,
      // Full locale cluster so each geo hub reinforces the others + the
      // global homepage (x-default) via bidirectional hreflang.
      languages: getGeoLanguageAlternates(),
    },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}${url}`,
      locale: region.locale.replace('-', '_'),
      siteName: siteConfig.name,
      images: [
        {
          url: DEFAULT_OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: `${region.name} — ${region.headline}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_OG_IMAGE_URL],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
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
      name: region.headline,
      description: region.intro,
      inLanguage: region.locale,
      isPartOf: { '@id': websiteId() },
      about: {
        '@type': 'Place',
        name: region.name,
      },
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['#region-hero-title', '#region-hero-summary'],
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
      mainEntity: region.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
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

        {/* Unique regional editorial — not a homepage clone */}
        <section className="border-b border-border/50 bg-background">
          <div className="container mx-auto max-w-6xl px-4 py-12 lg:px-8 md:py-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              {region.name}
            </p>
            <h1
              id="region-hero-title"
              className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-foreground md:text-4xl"
            >
              {region.headline}
            </h1>
            <p
              id="region-hero-summary"
              className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg"
            >
              {region.intro}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {region.commonTasks.map((task) => (
                <Link
                  key={task.href}
                  href={task.href}
                  className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-soft transition-all hover:border-primary/30 hover:shadow-premium"
                >
                  <h2 className="text-base font-bold text-foreground">{task.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{task.detail}</p>
                  <span className="mt-4 inline-block text-sm font-semibold text-primary">
                    Open tool →
                  </span>
                </Link>
              ))}
            </div>

            <nav aria-label="Other regional hubs" className="mt-8 flex flex-wrap gap-2">
              {geoRegions
                .filter((item) => item.code !== region.code)
                .map((item) => (
                  <Link
                    key={item.code}
                    href={`/${item.code}`}
                    className="rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                  >
                    {item.name}
                  </Link>
                ))}
            </nav>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-6">
                <h2 className="text-lg font-bold text-foreground">Local tips for {region.name}</h2>
                <ul className="mt-4 space-y-3">
                  {region.localNotes.map((note) => (
                    <li key={note} className="text-sm leading-7 text-muted-foreground">
                      • {note}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-6">
                <h2 className="text-lg font-bold text-foreground">FAQ for {region.name}</h2>
                <div className="mt-4 space-y-4">
                  {region.faqs.map((faq) => (
                    <div key={faq.question}>
                      <h3 className="text-sm font-semibold text-foreground">{faq.question}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <ToolsSection region={region} />
        <StatsBanner />
        <HowItWorks />
        <AnswerEngineSection />
        <TestimonialsSection />
        <FeaturesSection />
        <FAQSection />
        <CTASection />
      </main>
    </div>
  );
}
