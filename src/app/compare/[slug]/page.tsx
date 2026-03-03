import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { comparisonPages } from '@/lib/comparisons';
import { getToolBySlug } from '@/lib/tools-data';

export function generateStaticParams() {
  return comparisonPages.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = comparisonPages.find((c) => c.slug === slug);
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
  const item = comparisonPages.find((c) => c.slug === slug);
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
    <main className="container mx-auto px-4 lg:px-8 py-12 max-w-4xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <nav className="text-sm text-muted-foreground mb-4">
        <Link href="/">Home</Link> / <Link href="/compare">Compare</Link> / <span className="text-foreground">{item.title}</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-extrabold mb-3">{item.title}</h1>
      <p className="text-muted-foreground mb-8">{item.description}</p>

      <section className="rounded-2xl border border-border/60 bg-card/70 p-6 mb-6">
        <h2 className="text-xl font-bold mb-2">Bottom line</h2>
        <p className="text-sm leading-7">
          For workflows focused on <strong>{tool.name}</strong>, PdfPixels is best when you want a fast, no-signup utility flow with direct output and minimal friction.
        </p>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card/70 p-6 mb-6">
        <h2 className="text-xl font-bold mb-3">Best for</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm leading-7">
          {item.bestFor.map((b) => <li key={b}>{b}</li>)}
        </ul>
      </section>

      <div className="flex items-center gap-3">
        <Link href={`/tools/${tool.slug}`} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
          Open {tool.name}
        </Link>
        <Link href="/compare" className="px-4 py-2 rounded-lg border border-border/60 font-medium hover:border-primary/50 transition-colors">
          View all comparisons
        </Link>
      </div>
    </main>
  );
}
