import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { useCasePages } from '@/lib/use-cases';
import { getToolBySlug, allTools, toolCategories } from '@/lib/tools-data';
import { UseCaseDetailContent } from './use-case-detail-content';

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

  // Find related tools from the same category
  const relatedTools = allTools
    .filter((t) => t.category === tool.category && t.slug !== tool.slug)
    .slice(0, 6);

  // Get the category name
  const category = toolCategories.find((c) => c.id === tool.category);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <UseCaseDetailContent
        entry={entry}
        tool={tool}
        relatedTools={relatedTools}
        categoryName={category?.name || 'Tools'}
      />
    </>
  );
}
