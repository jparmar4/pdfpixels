import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ChevronRight, Layers3, ShieldCheck, Workflow } from 'lucide-react';
import { FooterAd, HeaderAd, InContentAd, NativeAd } from '@/components/ads/ad-banner';
import { ToolSidebarAd } from '@/components/ads/tool-sidebar-ad';
import { Badge } from '@/components/ui/badge';
import { WorkflowPipelineRunner } from '@/components/workflows/workflow-pipeline-runner';
import { DEFAULT_OG_IMAGE_URL, SITE_CONTENT_UPDATED, absoluteUrl, getRobotsMetadata } from '@/lib/seo';
import { siteConfig } from '@/lib/seo-config';
import { WORKFLOW_RECIPES, getWorkflowRecipe } from '@/lib/workflow-recipes';

export const dynamicParams = false;

export function generateStaticParams() {
  return WORKFLOW_RECIPES.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const recipe = getWorkflowRecipe(slug);
  if (!recipe) return {};

  const url = absoluteUrl(`/workflows/${recipe.slug}`);
  return {
    title: `${recipe.title} | Free Multi-Step Workflow`,
    description: recipe.description,
    alternates: {
      canonical: `/workflows/${recipe.slug}`,
    },
    openGraph: {
      title: `${recipe.title} | ${siteConfig.name}`,
      description: recipe.description,
      url,
      type: 'website',
      siteName: siteConfig.name,
      images: [
        {
          url: DEFAULT_OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: recipe.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${recipe.title} | ${siteConfig.name}`,
      description: recipe.description,
      images: [DEFAULT_OG_IMAGE_URL],
    },
    robots: getRobotsMetadata(true),
  };
}

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recipe = getWorkflowRecipe(slug);
  if (!recipe) {
    notFound();
  }

  const pageUrl = absoluteUrl(`/workflows/${recipe.slug}`);
  const related = recipe.relatedWorkflows
    .map((s) => getWorkflowRecipe(s))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: recipe.title,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: pageUrl,
      description: recipe.description,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: `How to run ${recipe.title}`,
      description: recipe.heroSummary,
      totalTime: 'PT1M',
      step: recipe.steps.map((step, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: step.title,
        text: step.subtitle,
        url: `${pageUrl}#step-${step.id}`,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'Workflows', item: absoluteUrl('/workflows') },
        { '@type': 'ListItem', position: 3, name: recipe.shortTitle, item: pageUrl },
      ],
    },
    ...(recipe.faqs.length > 0
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: recipe.faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: { '@type': 'Answer', text: faq.answer },
            })),
          },
        ]
      : []),
  ];

  return (
    <>
      {schemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          data-updated={SITE_CONTENT_UPDATED.toISOString()}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
        />
      ))}
      <main id="main-content" className="min-h-screen bg-background text-foreground pb-14 xl:pr-[196px]">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="container mx-auto px-4 lg:px-8 pt-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <li><Link href="/" className="hover:text-primary">Home</Link></li>
            <li aria-hidden="true"><ChevronRight className="w-3.5 h-3.5 opacity-60" /></li>
            <li><Link href="/workflows" className="hover:text-primary">Workflows</Link></li>
            <li aria-hidden="true"><ChevronRight className="w-3.5 h-3.5 opacity-60" /></li>
            <li><span className="font-medium text-foreground">{recipe.shortTitle}</span></li>
          </ol>
        </nav>

        {/* Header */}
        <section className="container mx-auto px-4 lg:px-8 pt-6 pb-4 max-w-5xl text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            <Workflow className="w-3.5 h-3.5" />
            {recipe.category} · {recipe.steps.length}-Step Recipe
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            {recipe.title}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {recipe.heroSummary}
          </p>
        </section>

        <HeaderAd className="my-4" />

        <section className="container mx-auto px-4 lg:px-8 py-4">
          <WorkflowPipelineRunner slug={recipe.slug} />
        </section>

        <InContentAd variant="dual-rectangle" eager instanceId="workflow-top" className="my-6" />

        <NativeAd className="my-8 max-w-5xl mx-auto px-4" />

        {/* Step-by-Step Architecture & Individual Tool Links */}
        <section className="container mx-auto px-4 lg:px-8 max-w-4xl py-6 space-y-10">
          <div className="section-panel rounded-[2rem] border border-border/50 bg-card/75 p-6 md:p-8 space-y-5">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Layers3 className="w-5 h-5 text-primary" />
              How to Use This {recipe.steps.length}-Step Pipeline
            </h2>
            <ol className="space-y-4">
              {recipe.steps.map((step, i) => (
                <li
                  key={step.id}
                  id={`step-${step.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/40 bg-background/65 px-4 py-3.5"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{step.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase">{step.execution}</Badge>
                    <Link
                      href={`/tools/${step.toolSlug}`}
                      className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Open single tool <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </li>
              ))}
            </ol>

            <div className="flex flex-wrap gap-2 pt-2">
              {recipe.highlights.map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <InContentAd variant="rectangle" instanceId="workflow-mid" className="my-4" />

          {recipe.faqs.length > 0 && (
            <div className="section-panel rounded-[2rem] border border-border/50 bg-card/75 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-bold text-foreground">Frequently Asked Questions</h2>
              <div className="space-y-3">
                {recipe.faqs.map((faq) => (
                  <details key={faq.question} className="rounded-xl border border-border/50 px-5 py-4 bg-background/60">
                    <summary className="cursor-pointer text-sm font-semibold text-foreground">{faq.question}</summary>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          )}

          {related.length > 0 && (
            <div className="section-panel rounded-[2rem] border border-border/50 bg-card/75 p-6 md:p-8 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-foreground">Related Workflow Recipes</h2>
                <Link href="/workflows" className="text-xs font-semibold text-primary hover:underline">
                  All 8 Workflows →
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {related.map((rel) => (
                  <Link
                    key={rel.slug}
                    href={`/workflows/${rel.slug}`}
                    className="rounded-2xl border border-border/50 bg-background/70 p-4 hover:border-primary/40 transition-colors"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{rel.category}</p>
                    <p className="text-sm font-bold text-foreground mt-1">{rel.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rel.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        <FooterAd className="my-6" />
      </main>
      <ToolSidebarAd />
    </>
  );
}
