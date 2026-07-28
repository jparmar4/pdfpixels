import Link from 'next/link';
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
  const title = `${region.headline} | ${siteConfig.name}`;
  const description = region.intro.slice(0, 160);

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
      name: region.headline,
      description: region.intro,
      inLanguage: region.locale,
      isPartOf: { '@id': `${absoluteUrl('/')}/#website` },
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
