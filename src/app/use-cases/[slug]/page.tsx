import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LayoutTemplate } from 'lucide-react';
import { SitePageShell } from '@/components/layout/site-page-shell';
import { getToolBySlug } from '@/lib/tools-data';
import { useCasePages } from '@/lib/use-cases';

export function generateStaticParams() {
  return useCasePages.map((useCase) => ({ slug: useCase.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = useCasePages.find((useCase) => useCase.slug === slug);
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
  const entry = useCasePages.find((useCase) => useCase.slug === slug);
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
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <SitePageShell
        eyebrow="Use case"
        title={entry.title}
        description={entry.description}
        iconName="layout"
        actions={[
          { label: `Open ${tool.name}`, href: `/tools/${tool.slug}` },
          { label: 'View more use cases', href: '/use-cases', variant: 'outline' },
        ]}
        contentClassName="max-w-5xl"
      >
        <div className="mb-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">Home</Link> / <Link href="/use-cases" className="hover:text-primary">Use cases</Link> / <span className="text-foreground">{entry.title}</span>
        </div>

        <section className="section-panel rounded-[2rem] p-6 md:p-8">
          <h2 className="text-2xl font-bold text-foreground">Quick answer</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Use <strong>{tool.name}</strong> to handle <strong>{entry.intent}</strong> in a fast browser workflow. Upload your file, tune the required settings, process, and download the optimized result.
          </p>
        </section>

        <section className="section-panel mt-6 rounded-[2rem] p-6 md:p-8">
          <h2 className="text-2xl font-bold text-foreground">How to do it</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-muted-foreground">
            <li>Open the recommended tool below.</li>
            <li>Upload the source file you want to process.</li>
            <li>Set target options according to the requirement.</li>
            <li>Process and download the final result.</li>
          </ol>
        </section>
      </SitePageShell>
    </>
  );
}
