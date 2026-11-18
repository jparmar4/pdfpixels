import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Layers3, ShieldCheck, Sparkles, Workflow } from 'lucide-react';
import { FooterAd, HeaderAd, InContentAd, NativeAd } from '@/components/ads/ad-banner';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_OG_IMAGE_URL, SITE_CONTENT_UPDATED, absoluteUrl, getRobotsMetadata } from '@/lib/seo';
import { siteConfig } from '@/lib/seo-config';
import { WORKFLOW_RECIPES } from '@/lib/workflow-recipes';

export const metadata: Metadata = {
  title: 'Multi-Step PDF & Photo Workflow Recipes | Automated Pipelines',
  description:
    'Upload files once to execute multi-step legal, USCIS, bookkeeping, tax, e-commerce, and GDPR redaction pipelines in sequence inside your browser — free with zero signups.',
  alternates: {
    canonical: '/workflows',
  },
  openGraph: {
    title: 'Multi-Step PDF & Photo Workflow Recipes | PdfPixels',
    description:
      'Automated 3-step and 4-step document pipelines for PACER filings, freelance contracts, USCIS packets, QuickBooks CSVs, Amazon studios, and HIPAA/GDPR sanitization.',
    url: absoluteUrl('/workflows'),
    type: 'website',
    siteName: siteConfig.name,
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: 'PdfPixels Multi-Step Workflow Recipes Hub',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Multi-Step PDF & Photo Workflow Recipes | PdfPixels',
    description:
      'Execute chained PDF and image pipelines in a single upload with intermediate previews and instant final export.',
    images: [DEFAULT_OG_IMAGE_URL],
  },
  robots: getRobotsMetadata(true),
};

const hubFaqs = [
  {
    question: 'How do PdfPixels Workflow Recipes differ from standard PDF converters?',
    answer:
      'Instead of downloading and re-uploading your file across 3 or 4 separate pages, a Workflow Recipe queues the entire pipeline sequentially from a single upload with live step progress and intermediate visual checkpoints.',
  },
  {
    question: 'Do multi-step workflow recipes work privately in my browser?',
    answer:
      'Most core steps — including PDF merging, AcroForm filling, SHA-256 digital signing, Exhibit TOC assembly, canvas passport sheets, and 150 DPI PII redaction — execute locally in browser memory before specialized steps run ephemerally over TLS 1.3.',
  },
  {
    question: 'Are there any subscription fees or daily pipeline caps?',
    answer:
      'No. All 8 B2B workflow recipes run free without accounts, watermarks, or paywalls.',
  },
];

export default function WorkflowsHubPage() {
  const url = absoluteUrl('/workflows');
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'PdfPixels Multi-Step Workflow Recipes',
      url,
      dateModified: SITE_CONTENT_UPDATED.toISOString(),
      description: metadata.description,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: WORKFLOW_RECIPES.map((recipe, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: recipe.title,
        url: absoluteUrl(`/workflows/${recipe.slug}`),
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'Workflow Recipes', item: url },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: hubFaqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
  ];

  return (
    <>
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <main id="main-content" className="min-h-screen bg-background text-foreground">
        <section className="relative overflow-hidden border-b border-border/40 py-14 md:py-20">
          <div className="hero-grid absolute inset-0 opacity-50" />
          <div className="container relative mx-auto px-4 lg:px-8 max-w-6xl">
            <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link href="/" className="hover:text-primary">Home</Link>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              <span className="font-medium text-foreground">Workflows</span>
            </nav>

            <div className="max-w-3xl space-y-4">
              <Badge className="badge-gradient rounded-full px-4 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                <Workflow className="w-3.5 h-3.5 mr-1.5" />
                Client-First Sequential Pipelines
              </Badge>
              <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
                Upload once. Run complete multi-step document pipelines.
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                Pre-built 3-step and 4-step automation recipes for court filings, signed contracts, USCIS evidence packets, QuickBooks cleanup, product studios, and HIPAA/GDPR sanitization — zero re-uploads required.
              </p>
              <div className="flex flex-wrap gap-3 pt-2 text-xs font-semibold text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/80 px-3.5 py-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Zero-Retention Ephemeral Processing
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/80 px-3.5 py-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> 8 Ready-to-Run B2B Pipelines
                </span>
              </div>
            </div>
          </div>
        </section>

        <HeaderAd className="my-6" />

        <section className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl">
          <div className="grid gap-6 md:grid-cols-2">
            {WORKFLOW_RECIPES.map((recipe) => (
              <Link
                key={recipe.slug}
                href={`/workflows/${recipe.slug}`}
                className="group section-panel rounded-[1.75rem] border border-border/50 bg-card/85 p-6 shadow-sm transition-all hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-premium flex flex-col justify-between gap-5"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                      {recipe.category}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {recipe.steps.length} Steps · {recipe.badge}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {recipe.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {recipe.description}
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-border/40">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
                    {recipe.steps.map((step, idx) => (
                      <span key={step.id} className="inline-flex items-center gap-1.5">
                        {idx > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                        <span className="rounded-lg bg-muted/70 px-2 py-1 text-foreground">
                          {step.title}
                        </span>
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-primary">
                    <span className="inline-flex items-center gap-1.5">
                      <Layers3 className="w-3.5 h-3.5" />
                      Launch Pipeline Runner
                    </span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <NativeAd className="my-8 max-w-5xl mx-auto px-4" />

        <section className="container mx-auto px-4 lg:px-8 py-8 max-w-4xl space-y-8">
          <div className="section-panel rounded-[2rem] border border-border/50 bg-card/75 p-6 md:p-8 space-y-4">
            <h2 className="text-2xl font-bold text-foreground">How Multi-Step Workflow Recipes Save Time</h2>
            <p className="text-sm text-muted-foreground leading-7">
              Traditional PDF utilities require uploading a file to merge, downloading the output, opening a separate grayscale tool, downloading again, stamping Bates numbers, and finally flattening for e-filing. PdfPixels Workflow Recipes chain all intermediate Blob buffers cleanly in one tab while preserving per-stage previews before your final single download.
            </p>
          </div>

          <InContentAd variant="dual-rectangle" instanceId="workflows-hub-mid" className="my-8" />

          <div className="section-panel rounded-[2rem] border border-border/50 bg-card/75 p-6 md:p-8 space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {hubFaqs.map((faq) => (
                <details key={faq.question} className="rounded-xl border border-border/50 px-5 py-4 bg-background/60">
                  <summary className="cursor-pointer text-sm font-semibold text-foreground">{faq.question}</summary>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <FooterAd className="my-6" />
      </main>
    </>
  );
}
