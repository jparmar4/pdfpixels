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

  // Feature comparison data
  const features = [
    { feature: 'Free to use', pp: true, alt: false },
    { feature: 'No sign-up required', pp: true, alt: false },
    { feature: 'Full resolution output', pp: true, alt: null },
    { feature: 'No watermarks', pp: true, alt: null },
    { feature: 'Fast processing (< 5s)', pp: true, alt: null },
    { feature: 'Client-side processing', pp: true, alt: false },
    { feature: 'Batch processing', pp: null, alt: false },
    { feature: 'API access', pp: false, alt: null },
    { feature: 'Privacy-focused', pp: true, alt: null },
  ];

  const ppWins = features.filter((f) => f.pp === true && (f.alt === false || f.alt === null && f.pp === true)).length;
  const altWins = features.filter((f) => f.alt === true && (f.pp === false || f.pp === null && f.alt === true)).length;
  const winner = ppWins >= altWins ? 'PdfPixels' : altName;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      

      <main id="main-content" className="min-h-screen bg-background">
        {/* Comparison Header with Hero */}
        <section className="relative overflow-hidden border-b border-border/40">
          <AnimatedMeshBg />
          <div className="relative z-10 container mx-auto px-4 lg:px-8 py-20 md:py-28">
            {/* Breadcrumb */}
            <div className="mb-10 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <Link href="/compare" className="hover:text-primary transition-colors">Compare</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground font-medium">{item.title}</span>
            </div>

            {/* Tools Side by Side */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 mb-10">
              {/* PdfPixels */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground shadow-xl ring-2 ring-primary/20 mb-4">
                  <ToolIcon className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">PdfPixels</h2>
                <p className="text-sm text-muted-foreground mt-1">{tool.name}</p>
              </div>

              {/* VS Badge */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-muted border-2 border-border flex items-center justify-center shadow-lg">
                  <span className="text-lg font-black text-foreground tracking-wider">VS</span>
                </div>
              </div>

              {/* Competitor */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-muted border-2 border-border flex items-center justify-center text-muted-foreground shadow-xl mb-4">
                  <span className="text-sm font-bold text-center leading-tight px-2">{altName}</span>
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">{altName}</h2>
                <p className="text-sm text-muted-foreground mt-1">Alternative</p>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-6 tracking-tight text-center max-w-4xl mx-auto leading-tight">
              {item.title}
            </h1>
            <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed text-center">
              {item.description}
            </p>
          </div>
        </section>

        {/* Content */}
        <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <div className="max-w-5xl mx-auto space-y-8">

            {/* Feature Comparison Table */}
            <section className="rounded-[2rem] border border-border overflow-hidden bg-card shadow-sm">
              <div className="p-6 md:p-8 border-b border-border bg-muted/30">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <GitCompareArrows className="w-6 h-6 text-primary" />
                  Feature Comparison
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground sticky top-0 bg-muted/50">
                        Feature
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-foreground sticky top-0 bg-muted/50 w-32">
                        PdfPixels
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground sticky top-0 bg-muted/50 w-32">
                        {altName}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {features.map((row, index) => (
                      <tr
                        key={row.feature}
                        className={`transition-colors hover:bg-muted/30 ${
                          index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                        } ${row.pp === true && row.alt === false ? 'bg-primary/[0.03]' : ''}`}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-foreground">{row.feature}</td>
                        <td className="px-6 py-4 text-center">
                          {row.pp === true ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-500">
                              <Check className="w-4 h-4" />
                            </span>
                          ) : row.pp === false ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-500/10 text-red-500">
                              <X className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Partial</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {row.alt === true ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-500">
                              <Check className="w-4 h-4" />
                            </span>
                          ) : row.alt === false ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-500/10 text-red-500">
                              <X className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Partial</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Verdict Section */}
            <section
              className="rounded-[2rem] p-8 md:p-10 border border-border shadow-xl relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.05), rgba(139, 92, 246, 0.05))' }}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full -z-0 opacity-60" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/5 rounded-tr-full -z-0 opacity-60" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white shadow-lg">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Our Verdict</h2>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Recommended:</span>
                  <span
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white shadow-lg"
                    style={{ background: 'linear-gradient(135deg, var(--color-primary), #8b5cf6)' }}
                  >
                    <Sparkles className="w-4 h-4" />
                    {winner}
                  </span>
                </div>

                <p className="text-muted-foreground leading-relaxed mb-8 text-[1.05rem]">
                  For workflows focused on <strong className="text-foreground">{tool.name}</strong>, PdfPixels is strongest when users want a fast, no-signup utility flow with direct output, cleaner UX, and minimal friction. The completely free approach with no account required makes it ideal for quick tasks.
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-background/60 border border-border/50">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground mb-1">Speed & Convenience</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">PdfPixels processes directly in your browser — no uploads, no waiting.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-background/60 border border-border/50">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Shield className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground mb-1">Privacy First</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">Files stay on your device. Nothing is uploaded to remote servers.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Best For Section */}
            <section className="rounded-[2rem] p-6 md:p-8 border border-border bg-card shadow-sm">
              <h2 className="text-2xl font-bold text-foreground mb-6">Best For</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {item.bestFor.map((entry) => (
                  <div key={entry} className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border/50">
                    <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm font-medium text-foreground">{entry}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* CTA Buttons */}
            <section className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button asChild size="lg" className="rounded-2xl px-8 shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all btn-premium">
                <Link href={`/tools/${tool.slug}`} className="inline-flex items-center gap-2">
                  Try {tool.name}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-2xl px-8 hover:-translate-y-1 transition-all">
                <Link href="/compare" className="inline-flex items-center gap-2">
                  View All Comparisons
                </Link>
              </Button>
            </section>
          </div>
        </div>
      </main>

      
    </>
  );
}
