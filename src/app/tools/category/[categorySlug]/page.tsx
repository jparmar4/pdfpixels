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
  ChevronRight,
} from 'lucide-react';
import { toolCategories } from '@/lib/tools-data';
import { normalizeDisplayText } from '@/lib/display-text';
import { absoluteUrl, DEFAULT_OG_IMAGE_URL } from '@/lib/seo';
import { siteConfig } from '@/lib/seo-config';
import { HeaderAd, FooterAd } from '@/components/ads/ad-banner';
import { CategoryGridClient } from './category-grid-client';
import { categoryContentData } from '@/lib/category-content-data';

export function generateStaticParams() {
  return toolCategories.map((category) => ({
    categorySlug: category.id,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string }> }): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = toolCategories.find((c) => c.id === categorySlug);

  if (!category) {
    return { title: 'Category Not Found' };
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
  const otherCategories = toolCategories.filter((c) => c.id !== category.id && c.id !== 'most-used');

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
    {
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
          name: 'All Tools',
          item: absoluteUrl('/tools'),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: cleanName,
        },
      ],
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
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-accent/60 to-background">
          <div className="absolute inset-0 hero-grid opacity-70" aria-hidden="true" />
          <div className="absolute inset-0 hero-spot" aria-hidden="true" />

          <div className="container relative z-10 mx-auto px-4 py-12 text-center lg:px-8 md:py-16">
            <nav aria-label="Breadcrumb" className="mb-8 flex items-center justify-center gap-1.5 text-[13px] text-muted-foreground">
              <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
              <ChevronRight className="h-3.5 w-3.5 opacity-50" />
              <Link href="/tools" className="transition-colors hover:text-foreground">All tools</Link>
              <ChevronRight className="h-3.5 w-3.5 opacity-50" />
              <span className="font-medium text-foreground" aria-current="page">{cleanName}</span>
            </nav>

            <div className="mb-5 flex justify-center">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-primary/15 blur-lg opacity-60" aria-hidden="true" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/15 bg-card shadow-soft">
                  <CategoryIcon className="h-8 w-8 text-primary" />
                </div>
              </div>
            </div>

            <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-5xl">
              {cleanName}
            </h1>

            <p className="mx-auto mb-7 max-w-2xl text-base text-muted-foreground md:text-lg">
              {normalizeDisplayText(category.description)}
            </p>

            <div className="flex flex-wrap justify-center gap-2.5 text-[13px] font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 shadow-soft">
                <Zap className="h-4 w-4 text-amber-500" />
                {category.tools.length} free tools
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 shadow-soft">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                {clientCount > 0 ? `${clientCount} run in your browser` : 'Secure processing'}
              </span>
              {aiCount > 0 && (
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 shadow-soft">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  {aiCount} AI-enhanced
                </span>
              )}
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-6 lg:px-8">
          <HeaderAd />
        </div>

        {/* Tools Grid */}
        <section className="container mx-auto px-4 py-8 lg:px-8">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                All {cleanName.toLowerCase()} tools
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Select any tool below to open a free workspace — no signup needed.
              </p>
            </div>
            <Link href="/tools" className="hidden shrink-0 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:inline-flex">
              <ArrowLeft className="h-4 w-4" />
              All tool categories
            </Link>
          </div>
          <CategoryGridClient categorySlug={category.id} />
        </section>

        {/* Rich Editorial & Guides Section */}
        {content && (
          <section className="container mx-auto px-4 py-12 lg:px-8">
            <div className="space-y-10">
              {/* Category Overview */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft md:p-10">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3.5 py-1.5 text-xs font-semibold text-primary">
                  <FileText className="h-3.5 w-3.5" />
                  Guide
                </span>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  {content.headline}
                </h2>
                <p className="mt-4 text-base leading-8 text-muted-foreground">
                  {content.longDescription}
                </p>

                {/* Key Benefits Grid */}
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {content.benefits.map((benefit) => (
                    <div
                      key={benefit.title}
                      className="rounded-2xl border border-border bg-background p-5"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <h3 className="mt-3 text-[15px] font-semibold text-foreground">{benefit.title}</h3>
                      <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground">
                        {benefit.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Architecture & Specs */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {content.technicalGuide.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">Technical specifications</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    {content.technicalGuide.description}
                  </p>
                  <ul className="mt-5 space-y-3">
                    {content.technicalGuide.points.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[13px] leading-6 text-muted-foreground">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Common Use Cases */}
                <div className="rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Real-world scenarios</h3>
                      <p className="text-xs text-muted-foreground">How people use these tools</p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3.5">
                    {content.useCases.map((uc) => (
                      <div key={uc.title} className="rounded-xl border border-border bg-background p-4">
                        <h4 className="text-sm font-semibold text-foreground">{uc.title}</h4>
                        <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{uc.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pro Tips Banner */}
              <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.04] via-card to-card p-6 md:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/12 text-amber-600 dark:text-amber-400">
                    <Lightbulb className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Pro tips &amp; best practices</h3>
                    <p className="text-xs text-muted-foreground">Get optimal results every time</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {content.proTips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-border bg-background p-4 text-[13px] leading-6 text-muted-foreground"
                    >
                      <strong className="font-semibold text-foreground">Tip #{idx + 1}:</strong> {tip}
                    </div>
                  ))}
                </div>
              </div>

              {/* Category FAQs */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Frequently asked questions</h3>
                    <p className="text-xs text-muted-foreground">Questions about {cleanName.toLowerCase()}</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {content.faqs.map((faq, i) => (
                    <details
                      key={i}
                      className="group rounded-2xl border border-border bg-background overflow-hidden transition-all duration-300 open:border-primary/30"
                    >
                      <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-4 p-4 text-left text-sm font-medium text-foreground hover:bg-muted/60 transition-colors [&::-webkit-details-marker]:hidden">
                        {faq.question}
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted transition-all duration-300 group-open:rotate-180 group-open:bg-primary/10">
                          <svg className="h-3.5 w-3.5 text-muted-foreground group-open:text-primary" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                        </span>
                      </summary>
                      <div className="px-4 pb-4 text-[13px] leading-6 text-muted-foreground">
                        {faq.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Explore other categories — internal linking */}
        <section className="container mx-auto px-4 py-8 lg:px-8" aria-labelledby="other-categories-heading">
          <h2 id="other-categories-heading" className="text-lg font-semibold tracking-tight text-foreground">
            Explore other tool categories
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {otherCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.id}
                  href={`/tools/category/${cat.id}`}
                  className="group flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                      {normalizeDisplayText(cat.name)}
                    </span>
                    <span className="block text-xs text-muted-foreground">{cat.tools.length} tools</span>
                  </span>
                  <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              );
            })}
          </div>
        </section>

        <div className="container mx-auto px-4 py-6 lg:px-8">
          <FooterAd />
        </div>
      </div>
    </>
  );
}
