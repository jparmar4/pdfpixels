import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
  Zap,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getToolBySlug, allTools, toolCategories } from '@/lib/tools-data';
import type { UseCasePage } from '@/lib/use-cases';
import { InContentAd, FooterAd } from '@/components/ads/ad-banner';

interface UseCaseDetailContentProps {
  entry: UseCasePage;
  targetToolSlug: string;
}

export function UseCaseDetailContent({
  entry,
  targetToolSlug,
}: UseCaseDetailContentProps) {
  const tool = getToolBySlug(targetToolSlug);
  const relatedTools = tool
    ? allTools.filter((t) => t.category === tool.category && t.slug !== tool.slug).slice(0, 6)
    : [];
  const category = tool
    ? toolCategories.find((c) => c.id === tool.category)
    : undefined;

  if (!tool) return null;

  const ToolIcon = tool.icon;
  const categoryName = category?.name || 'Tools';

  return (
    <div className="premium-page-bg min-h-screen bg-background text-foreground">
      <main id="main-content" className="flex-1">
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="hero-grid absolute inset-0 opacity-60" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,76,181,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,170,0.14),transparent_26%),radial-gradient(circle_at_bottom,rgba(184,134,39,0.12),transparent_32%)]" />

          <div className="container relative z-10 mx-auto px-4 py-16 md:py-20 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 flex flex-wrap items-center justify-center gap-1.5 text-sm text-muted-foreground">
                <Link href="/" className="transition-colors hover:text-primary">
                  Home
                </Link>
                <span className="opacity-40">/</span>
                <Link href="/use-cases" className="transition-colors hover:text-primary">
                  Use Cases
                </Link>
                <span className="opacity-40">/</span>
                <span className="font-medium text-foreground">{entry.title}</span>
              </div>

              <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
                <Badge className="badge-gradient rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                  Use Case Guide
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground"
                >
                  {categoryName}
                </Badge>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl lg:text-5xl">
                {entry.title}
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                {entry.description}
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="btn-premium rounded-2xl px-7">
                  <Link href={`/tools/${tool.slug}`} className="inline-flex items-center gap-2">
                    <ToolIcon className="h-4 w-4" />
                    Open {tool.name}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-2xl px-7">
                  <Link href="/use-cases">All use cases</Link>
                </Button>
              </div>

              <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                  <Zap className="h-3.5 w-3.5 text-emerald-500" />
                  Free tool
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Practical steps
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto max-w-5xl px-4 py-8 lg:px-8">
          {/* Unique overview — primary quality signal */}
          <section className="section-panel rounded-[2rem] p-6 md:p-8">
            <h2 className="text-2xl font-bold text-foreground">Why this workflow matters</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">{entry.overview}</p>
          </section>

          <section className="section-panel mt-6 rounded-[2rem] p-6 md:p-8">
            <h2 className="text-2xl font-bold text-foreground">Who this is for</h2>
            <ul className="mt-4 space-y-3">
              {entry.whoItsFor.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-7 text-muted-foreground">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <InContentAd />

          <section className="mt-6">
            <div className="section-panel rounded-[2rem] p-6 md:p-8">
              <h2 className="mb-8 text-2xl font-bold text-foreground">
                Step-by-step: {entry.intent}
              </h2>
              <div className="relative space-y-0">
                <div className="absolute bottom-0 left-6 top-0 hidden w-px bg-gradient-to-b from-primary/40 via-violet-500/30 to-emerald-500/20 md:block" />
                {entry.steps.map((step, index) => (
                  <div key={step.title} className="relative flex gap-5 pb-8 last:pb-0">
                    <div className="relative z-10 shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-sky-500 text-sm font-bold text-white shadow-md">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="text-base font-bold text-foreground">{step.title}</h3>
                      <p className="mt-1.5 text-sm leading-7 text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Button asChild className="btn-premium rounded-2xl">
                  <Link href={`/tools/${tool.slug}`} className="inline-flex items-center gap-2">
                    <ToolIcon className="h-4 w-4" />
                    Start with {tool.name}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          <section className="section-panel mt-6 rounded-[2rem] p-6 md:p-8">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Lightbulb className="h-6 w-6 text-amber-500" />
              Practical tips
            </h2>
            <ul className="mt-4 space-y-3">
              {entry.tips.map((tip) => (
                <li key={tip} className="flex items-start gap-3 text-sm leading-7 text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>

          {entry.pitfalls.length > 0 && (
            <section className="section-panel mt-6 rounded-[2rem] p-6 md:p-8">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
                Common problems
              </h2>
              <div className="mt-4 space-y-4">
                {entry.pitfalls.map((item) => (
                  <div
                    key={item.problem}
                    className="rounded-2xl border border-border/60 bg-background/70 p-4"
                  >
                    <p className="text-sm font-semibold text-foreground">{item.problem}</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.solution}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {entry.faqs.length > 0 && (
            <section className="section-panel mt-6 rounded-[2rem] p-6 md:p-8">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
                <HelpCircle className="h-6 w-6 text-sky-500" />
                FAQ
              </h2>
              <div className="mt-4 space-y-4">
                {entry.faqs.map((faq) => (
                  <div key={faq.question} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
                    <h3 className="text-sm font-bold text-foreground">{faq.question}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {relatedTools.length > 0 && (
            <section className="mt-6">
              <div className="section-panel rounded-[2rem] p-6 md:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                      Related tools
                    </p>
                    <h2 className="text-2xl font-bold text-foreground">More from {categoryName}</h2>
                  </div>
                  <Link
                    href="/tools"
                    className="hidden text-sm font-medium text-primary underline-offset-4 hover:underline sm:block"
                  >
                    View all tools
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedTools.map((rt) => {
                    const RtIcon = rt.icon;
                    return (
                      <Link
                        key={rt.slug}
                        href={`/tools/${rt.slug}`}
                        className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-background/75 p-4 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-premium"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
                          <RtIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                            {rt.name}
                            <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {rt.description}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          <section className="aurora-bg mt-6 overflow-hidden rounded-[2rem]">
            <div className="relative z-10 px-6 py-12 text-center md:px-10 md:py-14">
              <h2 className="text-2xl font-extrabold text-foreground md:text-3xl">
                Ready to {entry.intent}?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
                Open {tool.name} and follow the steps above. No account required for core use.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="btn-premium rounded-2xl px-8 py-6 text-base">
                  <Link href={`/tools/${tool.slug}`} className="inline-flex items-center gap-2">
                    <ToolIcon className="h-4 w-4" />
                    Open {tool.name}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-2xl border-white/20 bg-background/40 px-7 py-6 text-base backdrop-blur-xl"
                >
                  <Link href="/blog">Read guides</Link>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <FooterAd />
    </div>
  );
}
