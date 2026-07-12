import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { useCasePages } from '@/lib/use-cases';
import { getToolBySlug } from '@/lib/tools-data';
import { absoluteUrl } from '@/lib/seo';
import { siteConfig } from '@/lib/seo-config';
import { UseCaseDetailContent } from './use-case-detail-content';

export function generateStaticParams() {
  return useCasePages.map((useCase) => ({ slug: useCase.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = useCasePages.find((useCase) => useCase.slug === slug);
  if (!entry) return { title: 'Use case not found | PdfPixels' };

  const url = absoluteUrl(`/use-cases/${entry.slug}`);

  return {
    title: `${entry.title} | PdfPixels`,
    description: entry.description,
    alternates: { canonical: `/use-cases/${entry.slug}` },
    openGraph: {
      title: `${entry.title} | PdfPixels`,
      description: entry.description,
      url,
      type: 'article',
    },
    other: {
      'article:tag': entry.intent,
    },
  };
}

export default async function UseCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = useCasePages.find((useCase) => useCase.slug === slug);
  if (!entry) notFound();

  const tool = getToolBySlug(entry.targetToolSlug);
  if (!tool) notFound();

  const url = absoluteUrl(`/use-cases/${entry.slug}`);

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Use Cases', item: absoluteUrl('/use-cases') },
      { '@type': 'ListItem', position: 3, name: entry.title, item: url },
    ],
  };

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: entry.title,
    description: entry.description,
    mainEntityOfPage: url,
    about: entry.intent,
    mentions: {
      '@type': 'SoftwareApplication',
      name: tool.name,
      url: absoluteUrl(`/tools/${tool.slug}`),
      isAccessibleForFree: true,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: absoluteUrl('/'),
    },
  };

  const speakableSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '.use-case-summary'],
    },
  };

  return (
    <>
      <Script id="breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Script id="article-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <Script id="speakable-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(speakableSchema) }} />
      <UseCaseDetailContent
        entry={entry}
        targetToolSlug={tool.slug}
      />
    </>
  );
}
