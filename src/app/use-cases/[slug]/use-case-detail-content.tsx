'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight, Upload, Sliders, Download, Zap, CheckCircle2, ArrowUpRight
} from 'lucide-react';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { UseCasePage } from '@/lib/use-cases';
import type { Tool } from '@/lib/tools-data';

/* ─── Props ────────────────────────────────────────────────────────── */
interface UseCaseDetailContentProps {
  entry: UseCasePage;
  tool: Tool;
  relatedTools: Tool[];
  categoryName: string;
}

/* ─── Steps Data ───────────────────────────────────────────────────── */
const steps = [
  {
    number: 1,
    title: 'Open the Tool',
    description: 'Launch the recommended tool by clicking the button below or navigating to it from the tools page.',
    icon: Upload,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    number: 2,
    title: 'Upload Your File',
    description: 'Drag and drop or browse to upload the source file you want to process.',
    icon: Upload,
    color: 'from-violet-500 to-fuchsia-500',
  },
  {
    number: 3,
    title: 'Configure Settings',
    description: 'Adjust the target options according to your specific requirements.',
    icon: Sliders,
    color: 'from-amber-500 to-orange-500',
  },
  {
    number: 4,
    title: 'Download Result',
    description: 'Click process and download the optimized result instantly.',
    icon: Download,
    color: 'from-emerald-500 to-teal-600',
  },
];

/* ─── Component ─────────────────────────────────────────────────────── */
export function UseCaseDetailContent({
  entry,
  tool,
  relatedTools,
  categoryName,
}: UseCaseDetailContentProps) {
  return (
    <div className="premium-page-bg min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="flex-1">
        {/* ── Hero Header ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="hero-grid absolute inset-0 opacity-60" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,76,181,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,170,0.14),transparent_26%),radial-gradient(circle_at_bottom,rgba(184,134,39,0.12),transparent_32%)]" />

          <div className="container mx-auto px-4 py-16 lg:px-8 md:py-20 relative z-10">
            <div className="mx-auto max-w-4xl text-center">
              {/* Breadcrumb */}
              <div className="mb-6 text-sm text-muted-foreground flex items-center justify-center gap-1.5 flex-wrap">
                <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                <span className="opacity-40">/</span>
                <Link href="/use-cases" className="hover:text-primary transition-colors">Use Cases</Link>
                <span className="opacity-40">/</span>
                <span className="text-foreground font-medium">{entry.title}</span>
              </div>

              {/* Badge row */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                <Badge className="badge-gradient rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                  Use Case
                </Badge>
                {tool.badge && (
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em]">
                    {tool.badge}
                  </Badge>
                )}
                <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  {categoryName}
                </Badge>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground"
              >
                {entry.title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="mt-5 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto"
              >
                {entry.description}
              </motion.p>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 flex flex-wrap gap-3 justify-center"
              >
                <Button asChild size="lg" className="btn-premium rounded-2xl px-7">
                  <Link href={`/tools/${tool.slug}`} className="inline-flex items-center gap-2">
                    <tool.icon className="w-4 h-4" />
                    Open {tool.name}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-2xl px-7">
                  <Link href="/use-cases">View All Use Cases</Link>
                </Button>
              </motion.div>

              {/* Tool info bar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 inline-flex flex-wrap items-center justify-center gap-3"
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-background/80 text-xs font-semibold text-muted-foreground">
                  <Zap className="w-3.5 h-3.5 text-emerald-500" />
                  Free
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-background/80 text-xs font-semibold text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  No Signup
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-background/80 text-xs font-semibold text-muted-foreground">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  Instant
                </span>
              </motion.div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8 lg:px-8 max-w-5xl">
          {/* ── Quick Answer ───────────────────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="section-panel rounded-[2rem] p-6 md:p-8"
          >
            <h2 className="text-2xl font-bold text-foreground">Quick Answer</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Use <strong className="text-foreground">{tool.name}</strong> to handle{' '}
              <strong className="text-foreground">{entry.intent}</strong> in a fast browser workflow.
              Upload your file, tune the required settings, process, and download the optimized result.
            </p>
          </motion.section>

          {/* ── Step-by-step Guide ────────────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-6"
          >
            <div className="section-panel rounded-[2rem] p-6 md:p-8">
              <h2 className="text-2xl font-bold text-foreground mb-8">Step-by-Step Guide</h2>

              <div className="space-y-0 relative">
                {/* Vertical connecting line */}
                <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-violet-500/30 to-emerald-500/20 hidden md:block" />

                {steps.map((step, idx) => (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative flex gap-5 pb-8 last:pb-0"
                  >
                    {/* Numbered circle on the line */}
                    <div className="relative z-10 shrink-0">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-md`}>
                        <step.icon className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <h3 className="text-base font-bold text-foreground">{step.title}</h3>
                      <p className="mt-1.5 text-sm leading-7 text-muted-foreground">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* ── Related Tools Grid ────────────────────────────────── */}
          {relatedTools.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-6"
            >
              <div className="section-panel rounded-[2rem] p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-1">Related Tools</p>
                    <h2 className="text-2xl font-bold text-foreground">More from {categoryName}</h2>
                  </div>
                  <Link href="/tools" className="text-sm font-medium text-primary hover:underline underline-offset-4 hidden sm:block">
                    View all tools
                  </Link>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {relatedTools.map((rt, idx) => (
                    <motion.div
                      key={rt.slug}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.06 }}
                    >
                      <Link
                        href={`/tools/${rt.slug}`}
                        className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-background/75 p-4 shadow-soft hover:shadow-premium hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <rt.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                            {rt.name}
                            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{rt.description}</p>
                          {rt.badge && (
                            <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                              {rt.badge}
                            </span>
                          )}
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 text-center sm:hidden">
                  <Link href="/tools" className="text-sm font-medium text-primary hover:underline underline-offset-4">
                    View all tools
                  </Link>
                </div>
              </div>
            </motion.section>
          )}

          {/* ── CTA ──────────────────────────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-6 aurora-bg rounded-[2rem] overflow-hidden"
          >
            <div className="relative z-10 px-6 py-12 md:px-10 md:py-14 text-center">
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
                Try this workflow now
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto text-sm md:text-base leading-relaxed">
                Open {tool.name} and follow the steps above to {entry.intent} in seconds.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <Button asChild size="lg" className="btn-premium rounded-2xl px-8 py-6 text-base">
                  <Link href={`/tools/${tool.slug}`} className="inline-flex items-center gap-2">
                    <tool.icon className="w-4 h-4" />
                    Open {tool.name}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-2xl px-7 py-6 text-base border-white/20 bg-background/40 backdrop-blur-xl">
                  <Link href="/use-cases">Browse More Use Cases</Link>
                </Button>
              </div>
            </div>
          </motion.section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
