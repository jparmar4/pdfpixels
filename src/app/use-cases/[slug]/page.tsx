import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useCasePages } from '@/lib/use-cases';
import { getToolBySlug } from '@/lib/tools-data';

export function generateStaticParams() {
  return useCasePages.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = useCasePages.find((u) => u.slug === slug);
  if (!entry) return { title: 'Use case not found | PdfPixels' };

  return {
    title: `${entry.title} | PdfPixels`,
    description: entry.description,
    alternates: { canonical: `/use-cases/${entry.slug}` },
    openGraph: {
      title: `${entry.title} | PdfPixels`,
      description: entry.description,
      url: `https://www.pdfpixels.com/use-cases/${entry.slug}`,
      type: 'article',
    },
  };
}

export default async function UseCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = useCasePages.find((u) => u.slug === slug);
  if (!entry) notFound();

  const tool = getToolBySlug(entry.targetToolSlug);
  if (!tool) notFound();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: entry.title,
    description: entry.description,
    mainEntityOfPage: `https://www.pdfpixels.com/use-cases/${entry.slug}`,
    about: entry.intent,
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
        <Link href="/">Home</Link> / <Link href="/use-cases">Use Cases</Link> / <span className="text-foreground">{entry.title}</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-extrabold mb-3">{entry.title}</h1>
      <p className="text-muted-foreground mb-8">{entry.description}</p>

      <section className="rounded-2xl border border-border/60 bg-card/70 p-6 mb-6">
        <h2 className="text-xl font-bold mb-2">Quick answer</h2>
        <p className="text-sm leading-7">
          Use <strong>{tool.name}</strong> to handle <strong>{entry.intent}</strong> in seconds. Upload your file, adjust settings, process, and download the optimized output.
        </p>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card/70 p-6 mb-6">
        <h2 className="text-xl font-bold mb-3">How to do it</h2>
        <ol className="list-decimal pl-5 space-y-2 text-sm leading-7">
          <li>Open the recommended tool below.</li>
          <li>Upload your source file.</li>
          <li>Set target options according to your requirement.</li>
          <li>Process and download the final result.</li>
        </ol>
      </section>

      <div className="flex items-center gap-3">
        <Link
          href={`/tools/${tool.slug}`}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
        >
          Open {tool.name}
        </Link>
        <Link href="/use-cases" className="px-4 py-2 rounded-lg border border-border/60 font-medium hover:border-primary/50 transition-colors">
          View more use cases
        </Link>
      </div>
    </main>
  );
}
