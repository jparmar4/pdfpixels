import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Wrench, BookMarked, ChevronLeft } from 'lucide-react';
import { SitePageShell } from '@/components/layout/site-page-shell';
import { absoluteUrl, getRobotsMetadata, DEFAULT_OG_IMAGE_URL, SITE_CONTENT_UPDATED } from '@/lib/seo';
import { siteConfig } from '@/lib/seo-config';
import { glossaryTerms, getGlossaryTerm, getRelatedGlossaryTerms, getGlossaryCategories } from '@/lib/glossary';
import { getToolBySlug } from '@/lib/tools-data';
import { HeaderAd, InContentAd, FooterAd } from '@/components/ads/ad-banner';

interface GlossaryTermPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return glossaryTerms.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: GlossaryTermPageProps): Promise<Metadata> {
  const { slug } = await params;
  const term = getGlossaryTerm(slug);
  if (!term) return {};
  return {
    title: `What Is ${term.term}? ${term.term.split(' ').length > 2 ? 'Explained' : 'Definition'} (Plain English)`,
    description: term.shortDef,
    keywords: [`what is ${term.term.toLowerCase()}`, `${term.term.toLowerCase()} meaning`, 'pdf glossary'],
    alternates: { canonical: `/glossary/${term.slug}` },
    robots: getRobotsMetadata(),
    openGraph: {
      title: `What Is ${term.term}? — Plain-English Definition`,
      description: term.shortDef,
      url: absoluteUrl(`/glossary/${term.slug}`),
      type: 'article',
      siteName: siteConfig.name,
      images: [{ url: DEFAULT_OG_IMAGE_URL, width: 1200, height: 630, alt: term.term }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `What Is ${term.term}?`,
      description: term.shortDef,
      images: [DEFAULT_OG_IMAGE_URL],
    },
  };
}

export default async function GlossaryTermPage({ params }: GlossaryTermPageProps) {
  const { slug } = await params;
  const term = getGlossaryTerm(slug);
  if (!term) notFound();

  const related = getRelatedGlossaryTerms(term);
  const tools = term.relatedTools.map((toolSlug) => getToolBySlug(toolSlug)).filter(Boolean);
  const categoryLabel = getGlossaryCategories().find((c) => c.category === term.category)?.label ?? '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'DefinedTerm',
        name: term.term,
        description: term.shortDef,
        url: absoluteUrl(`/glossary/${term.slug}`),
        inDefinedTermSet: { '@type': 'DefinedTermSet', name: 'PdfPixels Glossary', url: absoluteUrl('/glossary') },
        dateModified: SITE_CONTENT_UPDATED.toISOString(),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url },
          { '@type': 'ListItem', position: 2, name: 'Glossary', item: absoluteUrl('/glossary') },
          { '@type': 'ListItem', position: 3, name: term.term, item: absoluteUrl(`/glossary/${term.slug}`) },
        ],
      },
    ],
  };

  return (
    <>
      <script id="glossary-term-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main id="main-content" className="min-h-screen bg-background">
        <SitePageShell
          eyebrow={categoryLabel}
          title={`What is ${term.term}?`}
          description={term.shortDef}
          iconName="file-text"
        >
        <HeaderAd className="my-6" />

        <div className="container mx-auto px-4 lg:px-8 max-w-4xl py-8">
          <nav aria-label="Breadcrumb" className="mb-6">
            <Link href="/glossary" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft className="w-4 h-4" /> All glossary terms
            </Link>
          </nav>

          {/* Body */}
          <article className="space-y-5">
            {term.body.map((paragraph, i) => (
              <p key={i} className="text-base leading-relaxed text-foreground/90">
                {paragraph}
              </p>
            ))}
          </article>

          {tools.length > 0 && (
            <InContentAd variant="rectangle" instanceId={`glossary-${term.slug}`} className="my-8" />
          )}

          {tools.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-extrabold tracking-tight mb-4 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary" /> Free tools that use this
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {tools.map((tool) => (
                  <Link
                    key={tool!.slug}
                    href={`/tools/${tool!.slug}`}
                    className="group rounded-xl border border-border/50 bg-card/50 p-4 hover:border-primary/30 transition-all"
                  >
                    <span className="flex items-center justify-between gap-2 text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {tool!.name} <ArrowRight className="w-4 h-4 flex-shrink-0" />
                    </span>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{tool!.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {related.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-extrabold tracking-tight mb-4 flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-primary" /> Related terms
              </h2>
              <div className="flex flex-wrap gap-2">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/glossary/${r.slug}`}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-muted/60 text-muted-foreground border border-border/60 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    {r.term}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
        </SitePageShell>

        <FooterAd />
      </main>
    </>
  );
}
