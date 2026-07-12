import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import { toolCategories } from '@/lib/tools-data';
import { normalizeDisplayText } from '@/lib/display-text';
import { absoluteUrl, DEFAULT_OG_IMAGE_URL } from '@/lib/seo';
import { siteConfig } from '@/lib/seo-config';
import { AnimatedMeshBg } from '@/components/ui/animated-mesh-bg';
import { HeaderAd, FooterAd } from '@/components/ads/ad-banner';
import { CategoryGridClient } from './category-grid-client';

export function generateStaticParams() {
  return toolCategories.map((category) => ({
    categorySlug: category.id,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string }> }): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = toolCategories.find((c) => c.id === categorySlug);

  if (!category) {
    return { title: 'Category Not Found | PdfPixels' };
  }

  const cleanName = normalizeDisplayText(category.name);
  const cleanDescription = normalizeDisplayText(category.description);
  const title = `${cleanName} - Free Online Tools`;
  const description = `${cleanDescription}. Browse our complete collection of ${cleanName.toLowerCase()} on PdfPixels. No signup or installation required.`;
  const canonicalUrl = absoluteUrl(`/tools/category/${category.id}`);

  return {
    title,
    description,
    alternates: {
      canonical: `/tools/category/${category.id}`,
    },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      type: 'website',
      locale: 'en_US',
      images: [
        {
          url: DEFAULT_OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: cleanName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [DEFAULT_OG_IMAGE_URL],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params;
  const category = toolCategories.find((c) => c.id === categorySlug);

  if (!category) {
    notFound();
  }

  const CategoryIcon = category.icon;
  const cleanName = normalizeDisplayText(category.name);
  const aiCount = category.tools.filter((tool) => tool.isAI).length;
  const clientCount = category.tools.filter((tool) => tool.processing === 'client').length;
  const url = absoluteUrl(`/tools/category/${category.id}`);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#webpage`,
    url,
    name: cleanName,
    description: normalizeDisplayText(category.description),
    isPartOf: {
      '@id': `${absoluteUrl('/')}#website`,
    },
    about: {
      '@type': 'Thing',
      name: cleanName,
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: category.tools.map((tool, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(`/tools/${tool.slug}`),
        name: normalizeDisplayText(tool.name),
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="premium-page-bg min-h-screen bg-background pb-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border/40 bg-card/40">
          <AnimatedMeshBg />
          <div className="absolute inset-0 dot-pattern opacity-30" />
          
          <div className="container relative z-10 mx-auto px-4 py-16 lg:px-8 md:py-20 text-center">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to all tools
            </Link>

            <div className="flex justify-center mb-6">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 to-sky-500/15 blur-lg opacity-70" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-sky-500/10 shadow-inner">
                  <CategoryIcon className="h-10 w-10 text-primary drop-shadow-sm" />
                </div>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              {cleanName}
            </h1>
            
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
              {normalizeDisplayText(category.description)}
            </p>

            <div className="flex flex-wrap justify-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-2 backdrop-blur-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                {clientCount > 0 ? `${clientCount} browser-native` : 'Secure processing'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-2 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-violet-500" />
                {aiCount > 0 ? `${aiCount} AI-enhanced` : 'High quality'}
              </span>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 lg:px-8 py-6">
          <HeaderAd />
        </div>

        {/* Tools Grid */}
        <section className="container mx-auto px-4 lg:px-8 py-8">
          <CategoryGridClient categorySlug={category.id} />
        </section>
        
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <FooterAd />
        </div>
      </div>
    </>
  );
}
