import type { Metadata } from 'next';
import Link from 'next/link';
import { BookMarked, ArrowRight } from 'lucide-react';
import { SitePageShell } from '@/components/layout/site-page-shell';
import { absoluteUrl, getRobotsMetadata, DEFAULT_OG_IMAGE_URL } from '@/lib/seo';
import { siteConfig } from '@/lib/seo-config';
import { glossaryTerms, getGlossaryCategories } from '@/lib/glossary';
import { HeaderAd, FooterAd } from '@/components/ads/ad-banner';

export const metadata: Metadata = {
  title: 'PDF & Image Glossary - Every Term Explained Simply',
  description:
    'Plain-English definitions for PDF and image terminology: PDF/A, OCR, AcroForm, flattening, Bates numbering, eIDAS, CMYK, redaction, and more — with links to the free tools that use them.',
  keywords: ['pdf glossary', 'what is pdf a', 'what is ocr', 'pdf terminology', 'pdf terms explained'],
  alternates: { canonical: '/glossary' },
  robots: getRobotsMetadata(),
  openGraph: {
    title: 'PDF & Image Glossary | PdfPixels',
    description: 'Plain-English definitions for every PDF and image term — with links to the free tools that use them.',
    url: absoluteUrl('/glossary'),
    type: 'website',
    siteName: siteConfig.name,
    images: [{ url: DEFAULT_OG_IMAGE_URL, width: 1200, height: 630, alt: 'PdfPixels glossary' }],
  },
};

export default function GlossaryHubPage() {
  const categories = getGlossaryCategories();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'PdfPixels PDF & Image Glossary',
    description: 'Plain-English definitions for PDF and image processing terminology.',
    url: absoluteUrl('/glossary'),
    hasDefinedTerm: glossaryTerms.map((t) => ({
      '@type': 'DefinedTerm',
      name: t.term,
      description: t.shortDef,
      url: absoluteUrl(`/glossary/${t.slug}`),
    })),
  };

  return (
    <>
      <script id="glossary-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="min-h-screen bg-background">
        <SitePageShell
          eyebrow="Knowledge hub"
          title="PDF & Image Glossary"
          description="Every PDF and image-processing term explained in plain English — what it means, why it matters, and the free tool that puts it into practice."
          iconName="file-text"
          stats={[{ label: 'Terms', value: String(glossaryTerms.length) }, { label: 'Topics', value: String(categories.length) }]}
        >
        <HeaderAd className="my-6" />

        <div className="container mx-auto px-4 lg:px-8 max-w-6xl space-y-12 py-8">
          {categories.map((cat) => (
            <section key={cat.category} id={cat.category}>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-6 flex items-center gap-3">
                <BookMarked className="w-5 h-5 text-primary" />
                {cat.label}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {cat.terms.map((term) => (
                  <Link
                    key={term.slug}
                    href={`/glossary/${term.slug}`}
                    className="group rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 hover:border-primary/30 transition-all duration-300"
                  >
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{term.term}</h3>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">{term.shortDef}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                      Read definition <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
        </SitePageShell>

        <FooterAd />
      </div>
    </>
  );
}
