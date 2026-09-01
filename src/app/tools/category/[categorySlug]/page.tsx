import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Cpu,
  Layers,
  FileText,
  Zap,
} from 'lucide-react';
import { toolCategories } from '@/lib/tools-data';
import { normalizeDisplayText } from '@/lib/display-text';
import { absoluteUrl, DEFAULT_OG_IMAGE_URL } from '@/lib/seo';
import { siteConfig } from '@/lib/seo-config';
import { AnimatedMeshBg } from '@/components/ui/animated-mesh-bg';
import { HeaderAd, FooterAd } from '@/components/ads/ad-banner';
import { CategoryGridClient } from './category-grid-client';
import { categoryContentData } from '@/lib/category-content-data';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function generateStaticParams() {
  return toolCategories.map((category) => ({
    categorySlug: category.id,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string }> }): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = toolCategories.find((c) => c.id === categorySlug);

  if (!category) {
    return { title: 'Category Not Found | PdfPixels' };
  }

  const cleanName = normalizeDisplayText(category.name);
  const cleanDescription = normalizeDisplayText(category.description);
  const title = `${cleanName} - Free Online Tools`;
  const description = `${cleanDescription}. Browse our complete collection of ${cleanName.toLowerCase()} on PdfPixels. No signup or installation required.`;
  const canonicalUrl = absoluteUrl(`/tools/category/${category.id}`);

  return {
    title,
    description,
    alternates: {
      canonical: `/tools/category/${category.id}`,
    },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      type: 'website',
      locale: 'en_US',
      images: [
        {
          url: DEFAULT_OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: cleanName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [DEFAULT_OG_IMAGE_URL],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params;
  const category = toolCategories.find((c) => c.id === categorySlug);

  if (!category) {
    notFound();
  }

  const content = categoryContentData[category.id];
  const CategoryIcon = category.icon;
  const cleanName = normalizeDisplayText(category.name);
  const aiCount = category.tools.filter((tool) => tool.isAI).length;
  const clientCount = category.tools.filter((tool) => tool.processing === 'client').length;
  const url = absoluteUrl(`/tools/category/${category.id}`);

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${url}#webpage`,
      url,
      name: cleanName,
      description: normalizeDisplayText(category.description),
      isPartOf: {
        '@id': `${absoluteUrl('/')}#website`,
      },
      about: {
        '@type': 'Thing',
        name: cleanName,
      },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: category.tools.map((tool, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: absoluteUrl(`/tools/${tool.slug}`),
          name: normalizeDisplayText(tool.name),
        })),
      },
    },
    ...(content?.faqs?.length
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: content.faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          },
        ]
      : []),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="premium-page-bg min-h-screen bg-background pb-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border/40 bg-card/40">
          <AnimatedMeshBg />
          <div className="absolute inset-0 dot-pattern opacity-30" />

          <div className="container relative z-10 mx-auto px-4 py-16 text-center lg:px-8 md:py-20">
            <Link
              href="/tools"
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to all tools
            </Link>

            <div className="mb-6 flex justify-center">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 to-sky-500/15 blur-lg opacity-70" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-sky-500/10 shadow-inner">
                  <CategoryIcon className="h-10 w-10 text-primary drop-shadow-sm" />
                </div>
              </div>
            </div>

            <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl">
              {cleanName}
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
              {normalizeDisplayText(category.description)}
            </p>

            <div className="flex flex-wrap justify-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-2 backdrop-blur-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                {clientCount > 0 ? `${clientCount} browser-native` : 'Secure processing'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-2 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-violet-500" />
                {aiCount > 0 ? `${aiCount} AI-enhanced` : 'High quality'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-2 backdrop-blur-sm">
                <Zap className="h-4 w-4 text-amber-500" />
                {category.tools.length} Tools Available
              </span>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-6 lg:px-8">
          <HeaderAd />
        </div>

        {/* Tools Grid */}
        <section className="container mx-auto px-4 py-8 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Browse {cleanName}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Select any tool below to launch an instant, free workspace.
              </p>
            </div>
          </div>
          <CategoryGridClient categorySlug={category.id} />
        </section>

        {/* Rich Editorial & Guides Section */}
        {content && (
          <section className="container mx-auto px-4 py-12 lg:px-8">
            <div className="space-y-12">
              {/* Category Overview */}
              <div className="rounded-[2rem] border border-border/50 bg-card/75 p-6 shadow-premium backdrop-blur-xl md:p-10">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  <FileText className="h-3.5 w-3.5" />
                  Category Overview
                </span>
                <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
                  {content.headline}
                </h2>
                <p className="mt-4 text-base leading-8 text-muted-foreground md:text-lg">
                  {content.longDescription}
                </p>

                {/* Key Benefits Grid */}
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {content.benefits.map((benefit) => (
                    <div
                      key={benefit.title}
                      className="rounded-2xl border border-border/50 bg-background/60 p-5 shadow-soft"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <h3 className="mt-3 text-base font-bold text-foreground">{benefit.title}</h3>
                      <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                        {benefit.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Architecture & Specs */}
              <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[2rem] border border-border/50 bg-card/75 p-6 shadow-premium backdrop-blur-xl md:p-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        {content.technicalGuide.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">Technical Specifications</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    {content.technicalGuide.description}
                  </p>
                  <ul className="mt-5 space-y-3">
                    {content.technicalGuide.points.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs leading-6 text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Common Use Cases */}
                <div className="rounded-[2rem] border border-border/50 bg-card/75 p-6 shadow-premium backdrop-blur-xl md:p-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Popular Real-World Scenarios</h3>
                      <p className="text-xs text-muted-foreground">Practical Use Cases</p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-4">
                    {content.useCases.map((uc) => (
                      <div key={uc.title} className="rounded-xl border border-border/40 bg-background/50 p-4">
                        <h4 className="text-sm font-bold text-foreground">{uc.title}</h4>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{uc.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pro Tips Banner */}
              <div className="rounded-[2rem] border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-card/80 to-primary/5 p-6 md:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <Lightbulb className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Pro Tips & Best Practices</h3>
                    <p className="text-xs text-muted-foreground">Get optimal results every time</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {content.proTips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-border/50 bg-background/70 p-4 text-xs leading-6 text-muted-foreground"
                    >
                      <strong className="text-foreground">Tip #{idx + 1}:</strong> {tip}
                    </div>
                  ))}
                </div>
              </div>

              {/* Category FAQs */}
              <div className="rounded-[2rem] border border-border/50 bg-card/75 p-6 shadow-premium backdrop-blur-xl md:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Frequently Asked Questions</h3>
                    <p className="text-xs text-muted-foreground">Questions about {cleanName.toLowerCase()}</p>
                  </div>
                </div>
                <div className="mt-6">
                  <Accordion type="single" collapsible className="w-full">
                    {content.faqs.map((faq, i) => (
                      <AccordionItem key={i} value={`faq-${i}`} className="border-border/40">
                        <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:text-primary">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-xs leading-6 text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="container mx-auto px-4 py-6 lg:px-8">
          <FooterAd />
        </div>
      </div>
    </>
  );
}
