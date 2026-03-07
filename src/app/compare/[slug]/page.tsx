import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GitCompareArrows } from 'lucide-react';
import { SitePageShell } from '@/components/layout/site-page-shell';
import { comparisonPages } from '@/lib/comparisons';
import { getToolBySlug } from '@/lib/tools-data';

export function generateStaticParams() {
  return comparisonPages.map((comparison) => ({ slug: comparison.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = comparisonPages.find((comparison) => comparison.slug === slug);
  if (!item) return { title: 'Comparison not found | PdfPixels' };

  return {
    title: `${item.title} | PdfPixels`,
    description: item.description,
    alternates: { canonical: `/compare/${item.slug}` },
    openGraph: {
      title: `${item.title} | PdfPixels`,
      description: item.description,
      url: `https://www.pdfpixels.com/compare/${item.slug}`,
      type: 'article',
    },
  };
}

export default async function ComparisonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = comparisonPages.find((comparison) => comparison.slug === slug);
  if (!item) notFound();

  const tool = getToolBySlug(item.primaryToolSlug);
  if (!tool) notFound();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: item.title,
    description: item.description,
    mainEntityOfPage: `https://www.pdfpixels.com/compare/${item.slug}`,
    about: [tool.name, ...item.alternatives],
    mentions: {
      '@type': 'SoftwareApplication',
      name: tool.name,
      url: `https://www.pdfpixels.com/tools/${tool.slug}`,
      isAccessibleForFree: true,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <SitePageShell
        eyebrow="Comparison"
        title={item.title}
        description={item.description}
        iconName="compare"
        actions={[
          { label: `Open ${tool.name}`, href: `/tools/${tool.slug}` },
          { label: 'View all comparisons', href: '/compare', variant: 'outline' },
        ]}
        contentClassName="max-w-5xl"
      >
        <div className="mb-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">Home</Link> / <Link href="/compare" className="hover:text-primary">Compare</Link> / <span className="text-foreground">{item.title}</span>
        </div>

        <section className="section-panel rounded-[2rem] p-6 md:p-8">
          <h2 className="text-2xl font-bold text-foreground">Bottom line</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            For workflows focused on <strong>{tool.name}</strong>, PdfPixels is strongest when users want a fast, no-signup utility flow with direct output, cleaner UX, and minimal friction.
          </p>
        </section>

        <section className="section-panel mt-6 rounded-[2rem] p-6 md:p-8">
          <h2 className="text-2xl font-bold text-foreground">Best for</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-muted-foreground">
            {item.bestFor.map((entry) => <li key={entry}>{entry}</li>)}
          </ul>
        </section>
      </SitePageShell>
    </>
  );
}
