import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GitCompareArrows, ArrowRight, Check, X, Trophy, Sparkles, Zap, Shield } from 'lucide-react';
import { AnimatedMeshBg } from '@/components/ui/animated-mesh-bg';


import { Button } from '@/components/ui/button';
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
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function ComparisonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = comparisonPages.find((comparison) => comparison.slug === slug);
  if (!item) notFound();

  const tool = getToolBySlug(item.primaryToolSlug);
  if (!tool) notFound();

  const ToolIcon = tool.icon;
  const altName = item.alternatives[0] || 'Competitor';

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

      <main id="main-content" className="min-h-screen bg-background">
        <section className="relative overflow-hidden border-b border-border/40">
          <AnimatedMeshBg />
          <div className="container relative z-10 mx-auto px-4 py-20 lg:px-8 md:py-28">
            <div className="mb-10 text-sm text-muted-foreground">
              <Link href="/" className="transition-colors hover:text-primary">Home</Link>
              <span className="mx-2">/</span>
              <Link href="/compare" className="transition-colors hover:text-primary">Compare</Link>
              <span className="mx-2">/</span>
              <span className="font-medium text-foreground">{item.title}</span>
            </div>

            <div className="mb-10 flex flex-col items-center justify-center gap-6 md:flex-row md:gap-10">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-xl ring-2 ring-primary/20">
                  <ToolIcon className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">PdfPixels</h2>
                <p className="mt-1 text-sm text-muted-foreground">{tool.name}</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-muted shadow-lg">
                <span className="text-lg font-black tracking-wider text-foreground">VS</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-border bg-muted text-muted-foreground shadow-xl">
                  <span className="px-2 text-center text-sm font-bold leading-tight">{altName}</span>
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">{altName}</h2>
                <p className="mt-1 text-sm text-muted-foreground">Alternative</p>
              </div>
            </div>

            <h1 className="mx-auto mb-6 max-w-4xl text-center text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-4xl lg:text-5xl">
              {item.title}
            </h1>
            <p className="mx-auto max-w-2xl text-center text-lg font-medium leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-5xl space-y-8">
            <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm md:p-8">
              <h2 className="text-2xl font-bold text-foreground">Honest overview</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">{item.overview}</p>
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
              <div className="border-b border-border bg-muted/30 p-6 md:p-8">
                <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground">
                  <GitCompareArrows className="h-6 w-6 text-primary" />
                  Key differences
                </h2>
              </div>
              <div className="divide-y divide-border">
                {item.keyDifferences.map((row) => (
                  <div key={row.topic} className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Topic</p>
                      <p className="mt-2 font-semibold text-foreground">{row.topic}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">PdfPixels</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{row.pdfpixels}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{altName}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{row.alternative}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm md:p-8">
                <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                  <Check className="h-5 w-5 text-emerald-500" />
                  Choose PdfPixels when
                </h2>
                <ul className="mt-4 space-y-3">
                  {item.whenToChooseUs.map((line) => (
                    <li key={line} className="flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm md:p-8">
                <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                  <Sparkles className="h-5 w-5 text-violet-500" />
                  Choose {altName} when
                </h2>
                <ul className="mt-4 space-y-3">
                  {item.whenToChooseAlt.map((line) => (
                    <li key={line} className="flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                      <Zap className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="relative overflow-hidden rounded-[2rem] border border-border p-8 shadow-xl md:p-10">
              <div className="relative z-10">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-500 text-white shadow-lg">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Verdict</h2>
                </div>
                <p className="text-[1.05rem] leading-relaxed text-muted-foreground">{item.verdict}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {item.bestFor.map((entry) => (
                    <span
                      key={entry}
                      className="rounded-full border border-border/60 bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground"
                    >
                      {entry}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {item.faqs.length > 0 && (
              <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm md:p-8">
                <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
                  <Shield className="h-6 w-6 text-sky-500" />
                  FAQ
                </h2>
                <div className="mt-4 space-y-4">
                  {item.faqs.map((faq) => (
                    <div key={faq.question} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
                      <h3 className="text-sm font-bold text-foreground">{faq.question}</h3>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
              <Button asChild size="lg" className="btn-premium rounded-2xl px-8 shadow-xl shadow-primary/20 transition-all hover:-translate-y-1">
                <Link href={`/tools/${tool.slug}`} className="inline-flex items-center gap-2">
                  Try {tool.name}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-2xl px-8 transition-all hover:-translate-y-1">
                <Link href="/compare">View all comparisons</Link>
              </Button>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
