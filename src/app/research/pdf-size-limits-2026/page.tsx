import type { Metadata } from 'next';
import Link from 'next/link';
import { SitePageShell } from '@/components/layout/site-page-shell';
import { absoluteUrl, SITE_CONTENT_UPDATED } from '@/lib/seo';
import { siteConfig } from '@/lib/seo-config';
import { platformLimits } from '@/lib/limits';

export const metadata: Metadata = {
  title: 'Email & Portal File Size Limits 2026 (Gmail, Outlook, Forms)',
  description:
    'Citable reference: Gmail 25MB and Outlook 20MB attachment limits, typical portal caps from 10MB down to 100KB, and exactly how to shrink PDFs and photos to fit.',
  alternates: {
    canonical: '/research/pdf-size-limits-2026',
  },
  openGraph: {
    title: 'Email & Portal File Size Limits 2026 (Gmail, Outlook, Forms)',
    description:
      'Citable reference: Gmail 25MB and Outlook 20MB attachment limits, typical portal caps from 10MB down to 100KB, and exactly how to shrink PDFs and photos to fit.',
    url: absoluteUrl('/research/pdf-size-limits-2026'),
    type: 'article',
    siteName: siteConfig.name,
  },
};

const faqs = [
  {
    question: 'What is the Gmail attachment size limit?',
    answer:
      'Gmail allows up to 25 MB per message including attachments. Stay under ~20 MB in practice so encoding overhead does not push you over. Larger files must go through Google Drive links.',
  },
  {
    question: 'What is the Outlook attachment size limit?',
    answer:
      'Outlook.com allows roughly 20 MB per message. Corporate Microsoft 365 tenants are often stricter (commonly 10 MB) because admins lower the default. Check your organization’s bounce message for the exact cap.',
  },
  {
    question: 'Why do job and government portals reject my PDF even though it sent fine by email?',
    answer:
      'Email caps (20–25 MB) are far roomier than form upload caps, which commonly sit at 1–5 MB and sometimes at strict 100–500 KB tiers. A PDF that emails fine can still be 10× over a portal limit.',
  },
  {
    question: 'How small can a readable PDF get?',
    answer:
      'A 1–3 page text PDF can live under 300 KB comfortably. Single-page forms can reach 100 KB. Multi-page color scans realistically bottom out around 500 KB–1 MB before text suffers — split pages first, then compress.',
  },
];

export default function ResearchPage() {
  const url = absoluteUrl('/research/pdf-size-limits-2026');
  const l = platformLimits;

  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Email & Portal File Size Limits 2026',
      description:
        'Reference for Gmail, Outlook, and application-portal upload caps, with shrink-to-fit workflows.',
      url,
      mainEntityOfPage: url,
      datePublished: '2026-09-20',
      dateModified: SITE_CONTENT_UPDATED.toISOString(),
      author: { '@type': 'Organization', name: 'PdfPixels', url: absoluteUrl('/') },
      publisher: {
        '@type': 'Organization',
        name: 'PdfPixels',
        url: absoluteUrl('/'),
        logo: { '@type': 'ImageObject', url: absoluteUrl('/icon-512.png'), width: 512, height: 512 },
      },
      inLanguage: 'en',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'Research: File Size Limits 2026', item: url },
      ],
    },
  ];

  return (
    <>
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <SitePageShell
        eyebrow="Research · Updated 2026"
        title="Email & portal file size limits, in one table."
        description="The numbers portals print in bold — Gmail, Outlook, job forms, and government uploads — plus the exact PdfPixels workflow that makes a file fit."
        iconName="file-text"
        align="center"
        stats={[
          { label: 'Gmail per message', value: '25 MB' },
          { label: 'Outlook.com', value: '~20 MB' },
          { label: 'Strictest portals', value: '100 KB' },
        ]}
        actions={[
          { label: 'Compress a PDF', href: '/tools/compress-pdf' },
          { label: 'Compress an image', href: '/tools/compress-image', variant: 'outline' },
        ]}
        contentClassName="max-w-4xl"
      >
        <section className="section-panel rounded-[2rem] p-6 md:p-8">
          <h2 className="text-2xl font-bold text-foreground">The limits table</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Figures below are the commonly documented caps as of 2026. Providers and
            form owners change rules, so treat the portal’s own error message as final —
            and leave headroom (target ~80% of any stated cap).
          </p>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-border/40">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="bg-muted/40 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Typical cap</th>
                  <th className="px-4 py-3">What fits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-muted-foreground">
                <tr>
                  <td className="px-4 py-3 font-semibold text-foreground">Gmail (per message)</td>
                  <td className="px-4 py-3">25 MB total</td>
                  <td className="px-4 py-3">Most compressed PDFs; aim under ~20 MB</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-foreground">Outlook.com</td>
                  <td className="px-4 py-3">~20 MB</td>
                  <td className="px-4 py-3">Corporate tenants often lower (~10 MB)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-foreground">Job / admissions portals</td>
                  <td className="px-4 py-3">1–5 MB common</td>
                  <td className="px-4 py-3">Compressed PDFs, 100–500 KB photos</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-foreground">Government / visa forms</td>
                  <td className="px-4 py-3">100 KB–1 MB strict tiers</td>
                  <td className="px-4 py-3">Single-page PDFs, exact-KB photos</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 section-panel rounded-[2rem] p-6 md:p-8">
          <h2 className="text-2xl font-bold text-foreground">Shrink-to-fit workflows</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
            <li>
              <strong className="text-foreground">PDF too big to email?</strong> Run{' '}
              <Link href="/tools/compress-pdf" className="font-semibold text-primary hover:underline">Compress PDF</Link>{' '}
              (up to {l.pdf.maxFileMb} MB). Still over?{' '}
              <Link href="/tools/split-pdf" className="font-semibold text-primary hover:underline">Split PDF</Link> out
              unneeded pages first — fewer pages beats harsher compression.
            </li>
            <li>
              <strong className="text-foreground">Portal demands 100–500 KB?</strong> Use the exact-target tools:{' '}
              <Link href="/tools/compress-pdf-to-100kb" className="font-semibold text-primary hover:underline">100KB</Link>,{' '}
              <Link href="/tools/compress-pdf-to-200kb" className="font-semibold text-primary hover:underline">200KB</Link>,{' '}
              <Link href="/tools/compress-pdf-to-500kb" className="font-semibold text-primary hover:underline">500KB</Link>, or{' '}
              <Link href="/tools/compress-pdf-under-1mb" className="font-semibold text-primary hover:underline">under 1MB</Link>.
              Grayscale first via <Link href="/tools/grayscale-pdf" className="font-semibold text-primary hover:underline">Grayscale PDF</Link> for
              color scans that will not fit.
            </li>
            <li>
              <strong className="text-foreground">Photo rejected by a form?</strong>{' '}
              <Link href="/tools/compress-image" className="font-semibold text-primary hover:underline">Compress Image</Link> to
              the exact KB number, or <Link href="/tools/increase-image-size-in-kb" className="font-semibold text-primary hover:underline">Increase Image Size</Link> if
              the portal enforces a <em>minimum</em>. Match dimensions too with{' '}
              <Link href="/tools/resize-image" className="font-semibold text-primary hover:underline">Resize Image</Link>.
            </li>
            <li>
              <strong className="text-foreground">Many photos to send?</strong> Budget per message, not per photo:
              ten 2 MB photos fit Gmail; thirty do not. Compress to a few hundred KB each or share an album link.
            </li>
          </ul>
        </section>

        <section className="mt-8 section-panel rounded-[2rem] p-6 md:p-8">
          <h2 className="text-2xl font-bold text-foreground">Frequently asked questions</h2>
          <div className="mt-4 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="rounded-xl border border-border/40 px-5 py-4">
                <summary className="cursor-pointer text-sm font-semibold text-foreground">{faq.question}</summary>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-8 section-panel rounded-[2rem] p-6 md:p-8">
          <h2 className="text-2xl font-bold text-foreground">Deeper guides</h2>
          <ul className="mt-4 space-y-2.5 text-sm leading-6 text-muted-foreground">
            <li><Link href="/blog/reduce-pdf-size-gmail-25mb-fix" className="font-semibold text-primary hover:underline">Reduce PDF size for Gmail’s 25MB limit</Link></li>
            <li><Link href="/blog/how-to-send-large-pdf-files-through-email" className="font-semibold text-primary hover:underline">How to send large PDFs through email</Link></li>
            <li><Link href="/blog/compress-pdf-under-1mb" className="font-semibold text-primary hover:underline">Compress PDF under 1MB</Link></li>
            <li><Link href="/use-cases/compress-pdf-for-email" className="font-semibold text-primary hover:underline">Use case: compress PDF for email</Link></li>
          </ul>
        </section>
      </SitePageShell>
    </>
  );
}
