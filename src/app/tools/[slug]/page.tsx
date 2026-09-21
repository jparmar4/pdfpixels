import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ArrowRight, GitCompareArrows, Layers3, LayoutTemplate, type LucideIcon } from 'lucide-react';
import { ToolContentSection } from '@/components/layout/tool-content-section';
import { ToolPageClient } from '@/components/layout/tool-page-client';
import { ToolSidebarAd } from '@/components/ads/tool-sidebar-ad';
import { FooterAd } from '@/components/ads/ad-banner';
import { comparisonPages } from '@/lib/comparisons';
import { normalizeDisplayText } from '@/lib/display-text';
import { siteConfig } from '@/lib/seo-config';
import { absoluteUrl, dedupeKeywords, SITE_CONTENT_UPDATED } from '@/lib/seo';
import { toolContentMap } from '@/lib/tool-content-data';
import { allTools, getToolBySlug, type Tool } from '@/lib/tools-data';
import { useCasePages } from '@/lib/use-cases';

function WorkspaceLoading({ tool, containerClass = 'container mx-auto px-4 lg:px-8' }: { tool: Tool; containerClass?: string }) {
  const cleanName = normalizeDisplayText(tool.name);
  const cleanDescription = normalizeDisplayText(tool.description);
  const Icon = tool.icon;
  const processingMeta = tool.processing === 'client'
    ? { label: 'Browser-native', tone: 'text-emerald-600 dark:text-emerald-300' }
    : tool.processing === 'ai' || tool.isAI
      ? { label: 'AI-enhanced', tone: 'text-violet-600 dark:text-violet-300' }
      : { label: 'Server-optimized', tone: 'text-sky-600 dark:text-sky-300' };

  return (
    <div className={`${containerClass} py-8`}>
      <div className="relative mb-8 overflow-hidden rounded-[2rem] border border-border/50 bg-card/75 p-5 shadow-premium backdrop-blur-xl md:p-7">
        <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/75 px-3 py-1.5">
                Workspace
              </span>
              {tool.badge && (
                <>
                  <span className="hidden h-1 w-1 rounded-full bg-border md:block" />
                  <span className="hidden md:block">{tool.badge}</span>
                </>
              )}
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] border border-primary/20 bg-gradient-to-br from-primary to-sky-500 shadow-lg shadow-primary/20">
                <Icon className="h-8 w-8 text-white" />
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="tool-hero-title text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                    {cleanName}
                  </h1>
                  {tool.isAI && (
                    <span className="rounded-full border-0 bg-gradient-to-r from-violet-500 to-sky-500 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                      AI powered
                    </span>
                  )}
                </div>

                <p className="tool-hero-description max-w-3xl text-sm font-medium leading-6 text-muted-foreground md:text-base">
                  {cleanDescription}
                </p>

                <div className="flex flex-wrap gap-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/75 px-3 py-1.5">
                    Fast workflow
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/75 px-3 py-1.5">
                    Private processing
                  </span>
                  <span className={`inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/75 px-3 py-1.5 ${processingMeta.tone}`}>
                    {processingMeta.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border-2 border-dashed border-border/60 bg-card/40 p-12 text-center">
        <div className="mx-auto flex max-w-md flex-col items-center justify-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-8 w-8 animate-pulse" />
          </div>
          <p className="text-lg font-semibold text-foreground">Loading {cleanName} Workspace...</p>
          <p className="text-sm text-muted-foreground">Preparing fast, browser-accelerated processing engine</p>
        </div>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return allTools.map((tool) => ({ slug: tool.slug }));
}

// Matches the loading skeleton's width to the real workspace container so the
// skeleton→workspace swap doesn't shift layout on desktop (CLS). Keep in sync
// with the root `container …` class of each workspace component and the
// tool→workspace dispatch in `components/layout/tool-page-client.tsx`.
// Tools not listed here use full-width workspaces (the skeleton default).
const WORKSPACE_CONTAINER_CLASS: Record<string, string> = {
  // max-w-6xl workspaces
  'pdf-sign': 'container mx-auto px-4 lg:px-8 max-w-6xl',
  'pdf-redact': 'container mx-auto px-4 lg:px-8 max-w-6xl',
  'pdf-crop': 'container mx-auto px-4 lg:px-8 max-w-6xl',
  'pdf-extract': 'container mx-auto px-4 lg:px-8 max-w-6xl',
  'pdf-fill': 'container mx-auto px-4 lg:px-8 max-w-6xl',
  // max-w-5xl workspaces
  'pdf-compress': 'container mx-auto px-4 lg:px-8 max-w-5xl',
  'compress-pdf-to-100kb': 'container mx-auto px-4 lg:px-8 max-w-5xl',
  'compress-pdf-to-200kb': 'container mx-auto px-4 lg:px-8 max-w-5xl',
  'compress-pdf-to-300kb': 'container mx-auto px-4 lg:px-8 max-w-5xl',
  'compress-pdf-to-500kb': 'container mx-auto px-4 lg:px-8 max-w-5xl',
  'compress-pdf-under-1mb': 'container mx-auto px-4 lg:px-8 max-w-5xl',
  'pdf-flatten': 'container mx-auto px-4 lg:px-8 max-w-5xl',
  'pdf-grayscale': 'container mx-auto px-4 lg:px-8 max-w-5xl',
  'pdf-to-text': 'container mx-auto px-4 lg:px-8 max-w-5xl',
  'pdf-to-pdfa': 'container mx-auto px-4 lg:px-8 max-w-5xl',
  'word-to-pdf': 'container mx-auto px-4 lg:px-8 max-w-5xl',
  'pdf-to-word': 'container mx-auto px-4 lg:px-8 max-w-5xl',
  'pdf-to-excel': 'container mx-auto px-4 lg:px-8 max-w-5xl',
  'bank-statement-to-excel': 'container mx-auto px-4 lg:px-8 max-w-5xl',
  'bates-numbering-pdf': 'container mx-auto px-4 lg:px-8 max-w-5xl',
  'compare-pdf': 'container mx-auto px-4 lg:px-8 max-w-5xl',
  'compress': 'container mx-auto px-4 lg:px-8 max-w-5xl',
  // max-w-4xl workspaces
  'sanitize-pdf': 'container mx-auto px-4 lg:px-8 max-w-4xl',
  'cmyk-pdf-converter': 'container mx-auto px-4 lg:px-8 max-w-4xl',
  'heic-to-pdf': 'container mx-auto px-4 lg:px-8 max-w-4xl',
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return { title: 'Tool Not Found | PdfPixels' };
  }

  const cleanName = normalizeDisplayText(tool.name);
  const cleanDescription = normalizeDisplayText(tool.description);
  const isAI = tool.isAI;
  const title = `Free ${cleanName} Online - No Sign Up Required`;
  const description = `${cleanDescription} Use our fast, secure, and completely free online ${cleanName.toLowerCase()} tool. Works instantly on Windows, Mac, and Mobile with no signup or installation needed.`;
  const canonicalUrl = absoluteUrl(`/tools/${tool.slug}`);
  const keywords = dedupeKeywords([
    ...tool.keywords.map((keyword) => normalizeDisplayText(keyword)),
    cleanName,
    `${cleanName} online`,
    `${cleanName} free`,
    `${cleanName} tool`,
    'pdfpixels',
    ...(isAI ? ['AI tool', 'AI image tool'] : []),
  ]);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `/tools/${tool.slug}`,
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
          url: absoluteUrl(`/tools/${tool.slug}/opengraph-image`),
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
      images: [absoluteUrl(`/tools/${tool.slug}/opengraph-image`)],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
  };
}

function getToolJsonLd(tool: ReturnType<typeof getToolBySlug>) {
  if (!tool) return null;

  const cleanName = normalizeDisplayText(tool.name);
  const cleanDescription = normalizeDisplayText(tool.description);
  const url = absoluteUrl(`/tools/${tool.slug}`);
  const isAI = tool.isAI;
  // Freshness signal for crawlers + AI answer engines (all evergreen tool
  // pages share the last-reviewed timestamp; bump SITE_CONTENT_UPDATED when
  // tool content actually changes).
  const updatedIso = SITE_CONTENT_UPDATED.toISOString();
  const contentData = toolContentMap[tool.slug];
  const features = contentData?.features ?? [];
  const howToSteps = contentData?.steps?.length
    ? contentData.steps.map((step, index) => ({
        '@type': 'HowToStep' as const,
        position: index + 1,
        name: normalizeDisplayText(step.title),
        text: normalizeDisplayText(step.description),
      }))
    : [
        {
          '@type': 'HowToStep' as const,
          position: 1,
          name: 'Open the tool page',
          text: `Go to ${url} and review the accepted file types and workflow notes.`,
        },
        {
          '@type': 'HowToStep' as const,
          position: 2,
          name: 'Upload your file',
          text: 'Add the image or PDF file required for this workflow.',
        },
        {
          '@type': 'HowToStep' as const,
          position: 3,
          name: 'Adjust the settings',
          text: `Configure the ${cleanName.toLowerCase()} options based on your output requirements.`,
        },
        {
          '@type': 'HowToStep' as const,
          position: 4,
          name: 'Process and download',
          text: 'Run the workflow and download the finished file once processing completes.',
        },
      ];
  const faqEntities = contentData?.faqs?.length
    ? contentData.faqs.map((faq) => ({
        '@type': 'Question' as const,
        name: normalizeDisplayText(faq.question),
        acceptedAnswer: {
          '@type': 'Answer' as const,
          text: normalizeDisplayText(faq.answer),
        },
      }))
    : [
        {
          '@type': 'Question' as const,
          name: `Is ${cleanName} free to use?`,
          acceptedAnswer: {
            '@type': 'Answer' as const,
            text: `Yes. ${cleanName} on PdfPixels is available as a free online workflow with no signup required for core usage.`,
          },
        },
        {
          '@type': 'Question' as const,
          name: `How does ${cleanName} work?`,
          acceptedAnswer: {
            '@type': 'Answer' as const,
            text: `Open ${cleanName} on PdfPixels, upload the required file, adjust the settings, and download the processed result.`,
          },
        },
      ];

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: cleanName,
      description: cleanDescription,
      datePublished: updatedIso,
      dateModified: updatedIso,
      isPartOf: {
        '@id': `${absoluteUrl('/')}/#website`,
      },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: absoluteUrl(`/tools/${tool.slug}/opengraph-image`),
        width: 1200,
        height: 630,
      },
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['.tool-hero-title', '.tool-hero-description'],
      },
      mainEntity: {
        '@id': `${url}#software`,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      '@id': `${url}#software`,
      name: cleanName,
      description: cleanDescription,
      url,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      isAccessibleForFree: true,
      inLanguage: 'en-US',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
      provider: {
        '@id': `${absoluteUrl('/')}/#organization`,
      },
      featureList: features.length > 0 ? features : tool.keywords,
      ...(isAI ? { additionalType: 'https://schema.org/AIApplication' } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: `How to use ${cleanName}`,
      description: `Step-by-step guide for using the ${cleanName} workflow on PdfPixels.`,
      datePublished: updatedIso,
      dateModified: updatedIso,
      totalTime: isAI ? 'PT30S' : 'PT2M',
      step: howToSteps,
      tool: {
        '@type': 'HowToTool',
        name: 'PdfPixels',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqEntities,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'Tools', item: absoluteUrl('/tools') },
        { '@type': 'ListItem', position: 3, name: cleanName, item: url },
      ],
    },
  ];
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const cleanToolName = normalizeDisplayText(tool.name);
  const schemas = getToolJsonLd(tool);
  const hasRichContent = !!toolContentMap[tool.slug];
  const relatedTools = allTools.filter((candidate) => candidate.category === tool.category && candidate.slug !== tool.slug).slice(0, 6);
  const relatedUseCases = useCasePages.filter((useCase) => useCase.targetToolSlug === tool.slug).slice(0, 4);
  const relatedComparisons = comparisonPages.filter((comparison) => comparison.primaryToolSlug === tool.slug).slice(0, 3);

  return (
    <>
      <div className="min-[1400px]:pr-[332px]">
        {schemas?.map((schema, index) => (
          <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        ))}

        {/* Server-rendered breadcrumb. Mirrors the BreadcrumbList JSON-LD. */}
        <nav aria-label="Breadcrumb" className="container mx-auto px-4 pt-8 lg:px-8">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <li>
              <Link href="/" className="transition-colors hover:text-foreground">
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-border">
              /
            </li>
            <li>
              <Link href="/tools" className="transition-colors hover:text-foreground">
                Tools
              </Link>
            </li>
            <li aria-hidden="true" className="text-border">
              /
            </li>
            <li>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-foreground">{cleanToolName}</span>
            </li>
          </ol>
        </nav>

        <Suspense fallback={<WorkspaceLoading tool={tool} containerClass={WORKSPACE_CONTAINER_CLASS[tool.id]} />}>
          <ToolPageClient toolId={tool.id} toolName={cleanToolName} toolDescription={normalizeDisplayText(tool.description)} />
        </Suspense>

        {/* Sticky sidebar / mobile in-content — positioned AFTER the primary tool to comply with AdSense policies */}
        {hasRichContent && <ToolSidebarAd />}

        {/* Editorial content (indexable) sits before mid-page ads for better AdSense policy ratio */}
        <ToolContentSection toolSlug={tool.slug} toolName={cleanToolName} isAI={tool.isAI} processing={tool.processing} />

        {(relatedTools.length > 0 || relatedUseCases.length > 0 || relatedComparisons.length > 0) ? (
          <section className="container mx-auto px-4 pb-12 lg:px-8">
            <div className="overflow-hidden rounded-[2rem] border border-border/50 bg-card/75 p-6 shadow-premium backdrop-blur-xl md:p-8">
              <div className="mb-8 flex flex-col gap-3 border-b border-border/40 pb-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Keep the workflow moving</p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
                    Next steps after {cleanToolName}
                  </h2>
                </div>
                <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                  Pair this tool with adjacent workflows, practical use cases, and comparison guides so users can complete a full document journey without friction.
                </p>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <ResourcePanel
                  title="Related tools"
                  description="Adjacent workflows users commonly open next."
                  icon={Layers3}
                  items={relatedTools.map((relatedTool) => ({
                    label: normalizeDisplayText(relatedTool.name),
                    meta: normalizeDisplayText(relatedTool.description),
                    href: `/tools/${relatedTool.slug}`,
                  }))}
                />
                <ResourcePanel
                  title="Popular use cases"
                  description="Practical scenarios and intent-driven landing pages."
                  icon={LayoutTemplate}
                  items={relatedUseCases.map((useCase) => ({
                    label: normalizeDisplayText(useCase.title),
                    meta: normalizeDisplayText(useCase.description),
                    href: `/use-cases/${useCase.slug}`,
                  }))}
                />
                <ResourcePanel
                  title="Comparison guides"
                  description="Decision support for users evaluating alternatives."
                  icon={GitCompareArrows}
                  items={relatedComparisons.map((comparison) => ({
                    label: normalizeDisplayText(comparison.title),
                    meta: normalizeDisplayText(comparison.description),
                    href: `/compare/${comparison.slug}`,
                  }))}
                />
              </div>
            </div>
          </section>
        ) : null}

        {/* Single footer unit after full content — only shown when editorial content is sufficient */}
        {hasRichContent && <FooterAd />}
      </div>
    </>
  );
}

function ResourcePanel({
  title,
  description,
  icon: Icon,
  items,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  items: Array<{ label: string; meta: string; href: string }>;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[1.5rem] border border-border/50 bg-background/75 p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-start justify-between gap-3 rounded-2xl border border-border/50 bg-card/75 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-card"
          >
            <div>
              <p className="text-sm font-semibold text-foreground group-hover:text-primary">{item.label}</p>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{item.meta}</p>
            </div>
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </div>
  );
}
