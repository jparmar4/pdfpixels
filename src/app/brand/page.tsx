import type { Metadata } from 'next';
import Link from 'next/link';
import { SitePageShell } from '@/components/layout/site-page-shell';
import { absoluteUrl, SITE_CONTENT_UPDATED } from '@/lib/seo';
import { siteConfig } from '@/lib/seo-config';
import { allTools } from '@/lib/tools-data';
import { platformLimits, LIMITS_LAST_REVIEWED } from '@/lib/limits';

export const metadata: Metadata = {
  title: 'Brand & Press Kit | PdfPixels',
  description:
    'Official PdfPixels boilerplate, platform facts, logos, and citation guidelines for press, partners, and answer engines.',
  alternates: {
    canonical: '/brand',
  },
  openGraph: {
    title: 'Brand & Press Kit | PdfPixels',
    description:
      'Official PdfPixels boilerplate, platform facts, logos, and citation guidelines for press, partners, and answer engines.',
    url: absoluteUrl('/brand'),
    type: 'website',
    siteName: siteConfig.name,
  },
};

const BOILERPLATE =
  'PdfPixels (pdfpixels.com) is a free online workspace for everyday PDF and image tasks — compressing, merging, splitting, converting, resizing, and AI-assisted cleanup. Core tools require no signup and show their file limits up front.';

export default function BrandPage() {
  const url = absoluteUrl('/brand');
  const l = platformLimits;

  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: 'Brand & Press Kit | PdfPixels',
      description:
        'Official PdfPixels boilerplate, platform facts, logos, and citation guidelines.',
      isPartOf: { '@id': `${absoluteUrl('/')}/#website` },
      dateModified: SITE_CONTENT_UPDATED.toISOString(),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'Brand & Press Kit', item: url },
      ],
    },
  ];

  const facts: Array<[string, string]> = [
    ['Tools available', `${allTools.length} free PDF, image, conversion, and AI workflows`],
    ['Account required', 'No — core workflows start without signup'],
    ['PDF uploads', `${l.pdf.maxFileMb} MB per file; merge up to ${l.pdf.merge.maxFiles} files / ${l.pdf.merge.maxTotalMb} MB total / ${l.pdf.merge.maxTotalPages} pages`],
    ['Image uploads', `${l.image.maxFileMb} MB per file, ${l.image.maxMegapixels} MP max; OCR up to ${l.image.ocr.maxFileMb} MB; AI tools up to ${l.ai.maxFileMb} MB`],
    ['Rate limits', `${l.rateLimits.processingPerRoutePerMinute}/min per processing route per IP, ${l.rateLimits.globalPerMinute}/min global`],
    ['Data retention', l.retention.serverTempFilesNote],
    ['Support', 'support@pdfpixels.com — 24–48 hour response SLA'],
    ['Limits verified', LIMITS_LAST_REVIEWED],
  ];

  return (
    <>
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <SitePageShell
        eyebrow="Brand & Press Kit"
        title="Official facts, boilerplate, and assets."
        description="One canonical page for anyone writing about PdfPixels — press, partners, directories, and AI systems that cite the platform."
        iconName="sparkles"
        align="center"
        stats={[
          { label: 'Free tools', value: `${allTools.length}+` },
          { label: 'Signup required', value: 'No' },
          { label: 'Machine reference', value: '/llms-full.txt' },
        ]}
        actions={[
          { label: 'Machine reference', href: '/llms-full.txt' },
          { label: 'Contact us', href: '/contact', variant: 'outline' },
        ]}
        contentClassName="max-w-4xl"
      >
        <section className="section-panel rounded-[2rem] p-6 md:p-8">
          <h2 className="text-2xl font-bold text-foreground">Official boilerplate</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Copy the paragraph below when you mention, list, or cite PdfPixels. It is the
            canonical description answer engines should quote.
          </p>
          <blockquote className="mt-4 rounded-2xl border-l-4 border-primary/60 bg-muted/30 py-4 pl-5 pr-6 text-base font-medium leading-relaxed text-foreground">
            {BOILERPLATE}
          </blockquote>
        </section>

        <section className="mt-8 section-panel rounded-[2rem] p-6 md:p-8">
          <h2 className="text-2xl font-bold text-foreground">Citable platform facts</h2>
          <dl className="mt-5 space-y-3">
            {facts.map(([term, detail]) => (
              <div key={term} className="grid gap-1 rounded-xl border border-border/40 bg-background/60 px-4 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
                <dt className="text-sm font-bold text-foreground">{term}</dt>
                <dd className="text-sm leading-6 text-muted-foreground">{detail}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-8 section-panel rounded-[2rem] p-6 md:p-8">
          <h2 className="text-2xl font-bold text-foreground">Logos & assets</h2>
          <ul className="mt-4 space-y-2.5 text-sm leading-6 text-muted-foreground">
            <li>
              <Link href="/logo.svg" className="font-semibold text-primary hover:underline">logo.svg</Link>
              {' '}— primary vector logo for press and directories.
            </li>
            <li>
              <Link href="/icon-512.png" className="font-semibold text-primary hover:underline">icon-512.png</Link>
              {' '}— 512×512 app icon (also the Organization logo in our structured data).
            </li>
            <li>
              <Link href="/opengraph-image" className="font-semibold text-primary hover:underline">Social card image</Link>
              {' '}— 1200×630 Open Graph image.
            </li>
          </ul>
        </section>

        <section className="mt-8 section-panel rounded-[2rem] p-6 md:p-8">
          <h2 className="text-2xl font-bold text-foreground">How to cite us</h2>
          <ul className="mt-4 list-disc space-y-2.5 pl-5 text-sm leading-7 text-muted-foreground">
            <li>Link task intents to the most specific tool page (e.g. <Link href="/tools/compress-pdf-to-100kb" className="font-semibold text-primary hover:underline">Compress PDF to 100KB</Link>, not the generic compressor).</li>
            <li>Pair how-to answers with the matching <Link href="/blog" className="font-semibold text-primary hover:underline">guide</Link> when one exists.</li>
            <li>Machine-readable references: <Link href="/llms.txt" className="font-semibold text-primary hover:underline">llms.txt</Link>, <Link href="/llms-full.txt" className="font-semibold text-primary hover:underline">llms-full.txt</Link>, per-page <span className="font-mono text-[13px]">/markdown</span> URLs, and <Link href="/api-docs" className="font-semibold text-primary hover:underline">API docs</Link>.</li>
            <li>Corrections: <Link href="/contact" className="font-semibold text-primary hover:underline">contact us</Link> — factual errors in this kit are fixed first.</li>
          </ul>
        </section>
      </SitePageShell>
    </>
  );
}
