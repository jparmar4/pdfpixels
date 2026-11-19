import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Download, ArrowRight, FileDown, CheckCircle2 } from 'lucide-react';
import { SitePageShell } from '@/components/layout/site-page-shell';
import { absoluteUrl, getRobotsMetadata, DEFAULT_OG_IMAGE_URL, SITE_CONTENT_UPDATED } from '@/lib/seo';
import { siteConfig } from '@/lib/seo-config';
import { templates, getTemplateBySlug } from '@/lib/templates';
import { getToolBySlug } from '@/lib/tools-data';
import { HeaderAd, InContentAd, NativeAd, FooterAd } from '@/components/ads/ad-banner';

interface TemplatePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return templates.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: TemplatePageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = getTemplateBySlug(slug);
  if (!template) return {};
  return {
    title: template.seoTitle,
    description: template.metaDescription,
    keywords: template.keywords,
    alternates: { canonical: `/templates/${template.slug}` },
    robots: getRobotsMetadata(),
    openGraph: {
      title: `${template.seoTitle} | PdfPixels`,
      description: template.metaDescription,
      url: absoluteUrl(`/templates/${template.slug}`),
      type: 'article',
      siteName: siteConfig.name,
      images: [{ url: DEFAULT_OG_IMAGE_URL, width: 1200, height: 630, alt: template.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: template.seoTitle,
      description: template.metaDescription,
      images: [DEFAULT_OG_IMAGE_URL],
    },
  };
}

export default async function TemplateDetailPage({ params }: TemplatePageProps) {
  const { slug } = await params;
  const template = getTemplateBySlug(slug);
  if (!template) notFound();

  const funnelTool = getToolBySlug(template.funnelTool);
  const related = templates.filter((t) => t.slug !== template.slug && t.category === template.category).slice(0, 2);
  const others = templates.filter((t) => t.slug !== template.slug && t.category !== template.category).slice(0, 2);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: `${template.name} — Free PDF Download`,
        description: template.metaDescription,
        author: { '@type': 'Person', name: 'Yuvi Parmar', url: absoluteUrl('/about#founder') },
        publisher: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url },
        datePublished: SITE_CONTENT_UPDATED.toISOString(),
        dateModified: SITE_CONTENT_UPDATED.toISOString(),
        mainEntityOfPage: absoluteUrl(`/templates/${template.slug}`),
        about: { '@type': 'Thing', name: template.name },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url },
          { '@type': 'ListItem', position: 2, name: 'Templates', item: absoluteUrl('/templates') },
          { '@type': 'ListItem', position: 3, name: template.name, item: absoluteUrl(`/templates/${template.slug}`) },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: template.faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      },
    ],
  };

  return (
    <>
      <script id="template-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main id="main-content" className="min-h-screen bg-background">
        <SitePageShell
          eyebrow={template.category === 'invoice' ? 'Invoice template' : 'Resume template'}
          title={template.name}
          description={template.description}
          iconName="layout"
          actions={[
            { label: `Download ${template.name} (PDF)`, href: template.pdfPath },
            ...(funnelTool ? [{ label: `Open the ${funnelTool.name} tool`, href: `/tools/${funnelTool.slug}`, variant: 'outline' as const }] : []),
          ]}
        >
        <HeaderAd className="my-6" />

        <div className="container mx-auto px-4 lg:px-8 max-w-6xl grid lg:grid-cols-[1fr_360px] gap-8 items-start py-8">
          {/* Main content */}
          <div className="space-y-8">
            <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden shadow-premium">
              <div className="p-4 border-b border-border/40 bg-gradient-to-r from-primary/10 to-transparent flex items-center justify-between">
                <h2 className="font-bold tracking-tight text-foreground text-sm">Live preview</h2>
                <span className="text-[11px] text-muted-foreground">the actual PDF file</span>
              </div>
              <iframe
                title={`${template.name} preview`}
                src={template.pdfPath}
                className="w-full h-[560px] bg-white"
              />
            </div>

            <section>
              <h2 className="text-2xl font-extrabold tracking-tight mb-4">What&apos;s inside</h2>
              <ul className="space-y-2.5">
                {template.whatInside.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/90">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-extrabold tracking-tight mb-4">How to use it</h2>
              <ol className="space-y-3">
                {template.howToUse.map((step, i) => (
                  <li key={step} className="flex items-start gap-3 text-sm text-foreground/90">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </section>

            <InContentAd variant="dual-rectangle" instanceId={`template-${template.slug}-mid`} className="my-6" />

            <section>
              <h2 className="text-2xl font-extrabold tracking-tight mb-4">Frequently asked questions</h2>
              <div className="space-y-4">
                {template.faqs.map((f) => (
                  <div key={f.question} className="rounded-xl border border-border/50 bg-card/40 p-4">
                    <h3 className="font-bold text-sm text-foreground mb-1.5">{f.question}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-5 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-5 space-y-3 shadow-premium">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <FileDown className="w-4 h-4 text-primary" /> Free download
              </div>
              <a
                href={template.pdfPath}
                download
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl btn-premium font-bold shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5"
              >
                <Download className="w-4 h-4" /> Download PDF
              </a>
              <p className="text-[11px] text-muted-foreground text-center">No signup · no watermark · works offline</p>
            </div>

            {funnelTool && (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-2 shadow-premium">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Next level</p>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  Need calculated totals, tax, and live layout? The free tool does it automatically:
                </p>
                <Link href={`/tools/${funnelTool.slug}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
                  {funnelTool.name} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {[...related, ...others].length > 0 && (
              <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-5 space-y-3 shadow-premium">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">More templates</p>
                {[...related, ...others].map((t) => (
                  <Link key={t.slug} href={`/templates/${t.slug}`} className="block text-sm font-semibold text-foreground hover:text-primary transition-colors">
                    {t.name}
                  </Link>
                ))}
                <Link href="/templates" className="block text-xs font-semibold text-primary hover:underline pt-1">
                  Browse all templates →
                </Link>
              </div>
            )}
          </div>
        </div>
        </SitePageShell>

        <NativeAd className="my-10 max-w-5xl mx-auto px-4" />
        <FooterAd />
      </main>
    </>
  );
}
