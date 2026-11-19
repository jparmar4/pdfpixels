import type { Metadata } from 'next';
import Link from 'next/link';
import { ReceiptText, FileText, ArrowRight, Download } from 'lucide-react';
import { SitePageShell } from '@/components/layout/site-page-shell';
import { absoluteUrl, getRobotsMetadata, DEFAULT_OG_IMAGE_URL } from '@/lib/seo';
import { siteConfig } from '@/lib/seo-config';
import { templates } from '@/lib/templates';
import { HeaderAd, InContentAd, NativeAd, FooterAd } from '@/components/ads/ad-banner';

export const metadata: Metadata = {
  title: 'Free Invoice & Resume Templates (PDF) - Download, No Signup',
  description:
    'Free professional PDF templates: blank and worked invoice templates, ATS-friendly resume templates. Download instantly — no signup, no watermark.',
  keywords: ['free invoice template pdf', 'free resume template pdf', 'printable templates', 'ats resume template download'],
  alternates: { canonical: '/templates' },
  robots: getRobotsMetadata(),
  openGraph: {
    title: 'Free Invoice & Resume Templates (PDF) | PdfPixels',
    description: 'Download professional invoice and resume PDF templates free — no signup, no watermark.',
    url: absoluteUrl('/templates'),
    type: 'website',
    siteName: siteConfig.name,
    images: [{ url: DEFAULT_OG_IMAGE_URL, width: 1200, height: 630, alt: 'Free PDF templates' }],
  },
};

export default function TemplatesHubPage() {
  const invoices = templates.filter((t) => t.category === 'invoice');
  const resumes = templates.filter((t) => t.category === 'resume');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'Free Invoice & Resume Templates (PDF)',
        description: 'Downloadable professional invoice and resume PDF templates, free without signup.',
        url: absoluteUrl('/templates'),
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: templates.map((t, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: t.name,
            url: absoluteUrl(`/templates/${t.slug}`),
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url },
          { '@type': 'ListItem', position: 2, name: 'Templates', item: absoluteUrl('/templates') },
        ],
      },
    ],
  };

  const Card = ({ slug, name, description, pdfPath, category }: { slug: string; name: string; description: string; pdfPath: string; category: string }) => (
    <div className="group rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden hover:border-primary/30 transition-all duration-300 flex flex-col">
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            {category}
          </span>
        </div>
        <Link href={`/templates/${slug}`} className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
          {name}
        </Link>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed flex-grow">{description}</p>
        <div className="mt-4 flex items-center gap-2">
          <Link
            href={`/templates/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            View template <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <a
            href={pdfPath}
            download
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> PDF
          </a>
        </div>
      </div>
    </div>
  );

  const Section = ({ id, title, icon: Icon, items, blurb }: { id: string; title: string; icon: typeof ReceiptText; items: typeof templates; blurb: string }) => (
    <section id={id} className="py-12">
      <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-2">
          <Icon className="w-5 h-5 text-primary" />
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">{title}</h2>
        </div>
        <p className="text-muted-foreground font-medium mb-8 max-w-2xl">{blurb}</p>
        <div className="grid md:grid-cols-2 gap-5">
          {items.map((t) => (
            <Card key={t.slug} slug={t.slug} name={t.name} description={t.description} pdfPath={t.pdfPath} category={t.category === 'invoice' ? 'Invoice' : 'Resume'} />
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <>
      <script id="templates-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main id="main-content" className="min-h-screen bg-background">
        <SitePageShell
          eyebrow="Free downloads"
          title="Invoice & Resume Templates"
          description="Professional PDF templates you can download instantly — no signup, no watermark. Each template ships with a guide for filling it in, and pairs with a free PdfPixels generator tool."
          iconName="file-text"
          stats={[
            { label: 'Templates', value: String(templates.length) },
            { label: 'Format', value: 'PDF' },
            { label: 'Price', value: '$0' },
          ]}
        >
        <HeaderAd className="my-6" />

        <Section
          id="invoice-templates"
          title="Invoice templates"
          icon={ReceiptText}
          items={invoices}
          blurb="Print-and-fill or adapt the worked examples — each invoice template includes the totals block and payment-terms notes your clients' finance teams expect."
        />
        <InContentAd variant="dual-rectangle" instanceId="templates-mid" className="my-6" />

        <Section
          id="resume-templates"
          title="Resume templates"
          icon={FileText}
          items={resumes}
          blurb="Single-column, ATS-friendly resume layouts — from filled examples to a blank skeleton. Real selectable text that job portals parse reliably."
        />
        </SitePageShell>

        <NativeAd className="my-10 max-w-5xl mx-auto px-4" />

        <section className="py-16 border-t border-border/50">
          <div className="container mx-auto px-4 lg:px-8 max-w-3xl text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-4">
              Want a <span className="gradient-text">calculated</span> version instead?
            </h2>
            <p className="text-muted-foreground font-medium mb-8">
              The Invoice Generator computes totals and tax automatically; the Resume Builder lays out your details live.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/tools/invoice-generator" className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl btn-premium font-bold shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5">
                Invoice Generator <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/tools/resume-builder" className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl btn-premium font-bold shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5">
                Resume Builder <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        <FooterAd />
      </main>
    </>
  );
}
