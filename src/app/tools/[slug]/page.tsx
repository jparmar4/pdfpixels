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
import { absoluteUrl, dedupeKeywords, DEFAULT_OG_IMAGE_URL } from '@/lib/seo';
import { toolContentMap } from '@/lib/tool-content-data';
import { allTools, getToolBySlug } from '@/lib/tools-data';
import { useCasePages } from '@/lib/use-cases';

function WorkspaceLoading() {
  return (
    <div className="container mx-auto px-4 py-8 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
        <div className="space-y-2">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="h-3 w-56 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="aspect-video animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="space-y-4">
          <div className="h-56 animate-pulse rounded-xl bg-muted" />
          <div className="h-28 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return allTools.map((tool) => ({ slug: tool.slug }));
}

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
  const contentData = toolContentMap[tool.slug];
  const features = contentData?.features ?? [];
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
      isPartOf: {
        '@id': `${absoluteUrl('/')}/#website`,
      },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
      },
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['h1', '.tool-hero-description'],
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
      totalTime: isAI ? 'PT30S' : 'PT2M',
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: 'Open the tool page',
          text: `Go to ${url} and review the accepted file types and workflow notes.`,
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'Upload your file',
          text: 'Add the image or PDF file required for this workflow.',
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Adjust the settings',
          text: `Configure the ${cleanName.toLowerCase()} options based on your output requirements.`,
        },
        {
          '@type': 'HowToStep',
          position: 4,
          name: 'Process and download',
          text: 'Run the workflow and download the finished file once processing completes.',
        },
      ],
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
  const relatedTools = allTools.filter((candidate) => candidate.category === tool.category && candidate.slug !== tool.slug).slice(0, 6);
  const relatedUseCases = useCasePages.filter((useCase) => useCase.targetToolSlug === tool.slug).slice(0, 4);
  const relatedComparisons = comparisonPages.filter((comparison) => comparison.primaryToolSlug === tool.slug).slice(0, 3);

  return (
    <>
      <div className="min-[1400px]:pr-[332px]">
        {schemas?.map((schema, index) => (
          <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        ))}

        {/* Sticky sidebar / mobile in-content — no extra header ad (reduces density + better UX) */}
        <ToolSidebarAd />

        <Suspense fallback={<WorkspaceLoading />}>
          <ToolPageClient toolId={tool.id} toolName={cleanToolName} toolDescription={normalizeDisplayText(tool.description)} />
        </Suspense>

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

        {/* Single footer unit after full content — clearer separation for AdSense */}
        <FooterAd />
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
