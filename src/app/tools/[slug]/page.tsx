import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { allTools, getToolBySlug } from '@/lib/tools-data';
import { siteConfig } from '@/lib/seo-config';
import { Suspense } from 'react';
import Link from 'next/link';
import { ToolPageClient } from '@/components/layout/tool-page-client';
import { ToolContentSection } from '@/components/layout/tool-content-section';
import { toolContentMap } from '@/lib/tool-content-data';
import { useCasePages } from '@/lib/use-cases';
import { comparisonPages } from '@/lib/comparisons';

function WorkspaceLoading() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
        <div className="space-y-2">
          <div className="w-40 h-5 rounded bg-muted animate-pulse" />
          <div className="w-56 h-3 rounded bg-muted animate-pulse" />
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="aspect-video rounded-xl bg-muted animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-56 rounded-xl bg-muted animate-pulse" />
          <div className="h-28 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// Generate static params for all tools
export function generateStaticParams() {
  return allTools.map((tool) => ({
    slug: tool.slug,
  }));
}

// Generate rich metadata for each tool — SEO, AEO, GEO optimized
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return { title: 'Tool Not Found | PdfPixels' };
  }

  const isAI = tool.isAI;
  const isTemporarilyUnavailable = tool.id === 'pdf-protect' || tool.id === 'pdf-unlock';
  const aiLabel = isAI ? 'AI-Powered ' : '';
  const title = isTemporarilyUnavailable
    ? `${tool.name} (Temporarily Unavailable) | PdfPixels`
    : `${aiLabel}${tool.name} — Free Online Tool | PdfPixels`;
  const description = isTemporarilyUnavailable
    ? `${tool.name} is temporarily unavailable while secure encryption/decryption support is being finalized.`
    : `${tool.description} Free online ${tool.name.toLowerCase()} tool. ${isAI ? 'Powered by OpenAI. ' : ''}No registration required. Fast, secure, and private. Works on JPG, PNG, WebP, HEIC.`;

  return {
    title,
    description,
    keywords: [
      ...tool.keywords,
      tool.name.toLowerCase(),
      `${tool.name.toLowerCase()} online`,
      `${tool.name.toLowerCase()} free`,
      `free ${tool.name.toLowerCase()}`,
      `${tool.name.toLowerCase()} tool`,
      'pdfpixels',
      'online tool',
      'free tool',
      'no signup',
      ...(isAI ? ['ai tool', 'ai image tool', 'openai'] : []),
    ],
    openGraph: {
      title,
      description,
      url: `https://www.pdfpixels.com/tools/${tool.slug}`,
      siteName: siteConfig.name,
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `/tools/${tool.slug}`,
    },
    robots: {
      index: !isTemporarilyUnavailable,
      follow: !isTemporarilyUnavailable,
      googleBot: {
        index: !isTemporarilyUnavailable,
        follow: !isTemporarilyUnavailable,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
  };
}

// Build JSON-LD structured data for each tool (SoftwareApplication + HowTo + FAQPage)
function getToolJsonLd(tool: ReturnType<typeof getToolBySlug>) {
  if (!tool) return null;
  const url = `https://www.pdfpixels.com/tools/${tool.slug}`;
  const isAI = tool.isAI;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schemas: Record<string, any>[] = [];

  // SoftwareApplication schema — helps Google show rich results
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    url,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    isAccessibleForFree: true,
    inLanguage: 'en-US',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    ...(isAI && {
      additionalType: 'https://schema.org/AIApplication',
    }),
  });

  // HowTo schema — helps AI search engines understand usage
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to ${tool.name}`,
    description: `Step-by-step guide to use the free online ${tool.name} tool on PdfPixels.`,
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Upload your file',
        text: `Go to ${url} and upload your image or PDF file. Drag and drop or click to browse.`,
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Adjust settings',
        text: `Configure the ${tool.name.toLowerCase()} settings to your preference. Adjust quality, size, or effects as needed.`,
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Process and download',
        text: `Click the process button and download your result. ${isAI ? 'AI processing takes 10-30 seconds.' : 'Processing is instant.'}`,
      },
    ],
    totalTime: isAI ? 'PT30S' : 'PT5S',
    tool: {
      '@type': 'HowToTool',
      name: 'PdfPixels',
    },
  });

  // FAQPage schema — AEO optimization (uses tool-specific FAQs when available)
  const contentData = toolContentMap[tool.slug];
  const faqEntities = contentData?.faqs?.length
    ? contentData.faqs.map(faq => ({
      '@type': 'Question' as const,
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer' as const, text: faq.answer },
    }))
    : [
      {
        '@type': 'Question' as const,
        name: `Is ${tool.name} free to use?`,
        acceptedAnswer: { '@type': 'Answer' as const, text: `Yes, ${tool.name} on PdfPixels is completely free to use with no registration required.` },
      },
      {
        '@type': 'Question' as const,
        name: `Is my data safe when using ${tool.name}?`,
        acceptedAnswer: { '@type': 'Answer' as const, text: `Absolutely. ${tool.processing === 'client' ? 'Your files are processed entirely in your browser and never leave your device.' : 'Your files are processed securely on our servers and automatically deleted.'}` },
      },
    ];

  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqEntities,
  });

  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.pdfpixels.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Tools',
        item: 'https://www.pdfpixels.com/tools',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: tool.name,
        item: url,
      },
    ],
  });

  return schemas;
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const schemas = getToolJsonLd(tool);
  const relatedTools = allTools.filter((t) => t.category === tool.category && t.slug !== tool.slug).slice(0, 6);
  const relatedUseCases = useCasePages.filter((u) => u.targetToolSlug === tool.slug).slice(0, 4);
  const relatedComparisons = comparisonPages.filter((c) => c.primaryToolSlug === tool.slug).slice(0, 3);

  return (
    <>
      {/* JSON-LD Structured Data for SEO/AEO/GEO */}
      {schemas && schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <Suspense fallback={<WorkspaceLoading />}>
        <ToolPageClient
          toolId={tool.id}
          toolName={tool.name}
          toolDescription={tool.description}
        />
      </Suspense>

      {/* Rich SEO/AEO/GEO Content Section */}
      <ToolContentSection
        toolSlug={tool.slug}
        toolName={tool.name}
        isAI={tool.isAI}
        processing={tool.processing}
      />

      {(relatedTools.length > 0 || relatedUseCases.length > 0 || relatedComparisons.length > 0) && (
        <section className="container mx-auto px-4 lg:px-8 pb-10">
          <div className="rounded-2xl border border-border/50 bg-card/70 p-6 space-y-6">
            {relatedTools.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-2">Related tools</h2>
                <p className="text-sm text-muted-foreground mb-4">Explore similar tools to complete your workflow faster.</p>
                <div className="flex flex-wrap gap-2">
                  {relatedTools.map((rt) => (
                    <Link
                      key={rt.slug}
                      href={`/tools/${rt.slug}`}
                      className="px-3 py-1.5 rounded-lg border border-border/60 bg-background/70 text-sm font-medium hover:border-primary/50 hover:text-primary transition-colors"
                    >
                      {rt.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {relatedUseCases.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-2">Popular use cases</h3>
                <div className="flex flex-wrap gap-2">
                  {relatedUseCases.map((u) => (
                    <Link
                      key={u.slug}
                      href={`/use-cases/${u.slug}`}
                      className="px-3 py-1.5 rounded-lg border border-border/60 bg-background/70 text-sm font-medium hover:border-primary/50 hover:text-primary transition-colors"
                    >
                      {u.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {relatedComparisons.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-2">Comparison guides</h3>
                <div className="flex flex-wrap gap-2">
                  {relatedComparisons.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/compare/${c.slug}`}
                      className="px-3 py-1.5 rounded-lg border border-border/60 bg-background/70 text-sm font-medium hover:border-primary/50 hover:text-primary transition-colors"
                    >
                      {c.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
