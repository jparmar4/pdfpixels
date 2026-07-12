'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Files, Server, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { allTools } from '@/lib/tools-data';

const trustBullets = [
  {
    title: 'Private processing',
    description: 'Clear upload, processing, and download states keep sensitive document work predictable.',
    icon: ShieldCheck,
    tone: 'text-emerald-500',
    bg: 'from-emerald-500/15 to-teal-500/10',
  },
  {
    title: 'Reliable results',
    description: 'Professional defaults, clean export surfaces, and fewer dead ends across PDF and image flows.',
    icon: CheckCircle2,
    tone: 'text-sky-500',
    bg: 'from-sky-500/15 to-cyan-500/10',
  },
  {
    title: 'No signup friction',
    description: 'Users can move from upload to final file without account walls or unnecessary distractions.',
    icon: Sparkles,
    tone: 'text-violet-500',
    bg: 'from-violet-500/15 to-fuchsia-500/10',
  },
];

const valueCards = [
  {
    value: `${allTools.length}+`,
    label: 'Tools ready',
    description: 'Broad coverage for compression, conversion, editing, and PDF workflows.',
    icon: Files,
    tone: 'text-primary',
    gradient: 'from-primary/18 to-sky-500/10',
  },
  {
    value: 'PDF + Image',
    label: 'One platform',
    description: 'A single polished experience for the document and image jobs users actually need.',
    icon: Server,
    tone: 'text-cyan-500',
    gradient: 'from-cyan-500/18 to-blue-500/10',
  },
  {
    value: 'Fast',
    label: 'Professional output',
    description: 'High-quality exports, strong defaults, and a cleaner finish from upload to download.',
    icon: Zap,
    tone: 'text-amber-500',
    gradient: 'from-amber-500/18 to-orange-500/10',
  },
];

export function FeaturesSection() {
  return (
    <section className="relative overflow-hidden border-t border-border/40 bg-muted/10 py-18 md:py-22 lg:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,76,181,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(14,165,170,0.08),transparent_22%),radial-gradient(circle_at_center,rgba(168,85,247,0.06),transparent_32%)]" />
      <div className="pointer-events-none absolute left-1/2 top-8 h-56 w-56 -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />

      <div className="container mx-auto max-w-6xl px-4 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 text-center md:mb-12"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Trust and quality
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            Premium workflows built for
            <span className="block text-primary">documents that need to feel dependable.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-7 text-muted-foreground md:text-lg">
            PdfPixels is designed to look polished, stay clear under pressure, and deliver professional output without turning simple file work into a messy utility experience.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/80 p-7 shadow-premium backdrop-blur-xl md:p-9"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,76,181,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(14,165,170,0.1),transparent_24%)] pointer-events-none" />
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            <div className="relative z-10 flex h-full flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Built for trust
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  <Zap className="h-3.5 w-3.5 text-sky-500" />
                  Fast completion
                </span>
              </div>

              <div className="mt-6 max-w-2xl">
                <h3 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  Clean, premium tooling for image and PDF work that still needs to feel professional.
                </h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
                  The homepage should communicate confidence, not clutter. This section now reinforces the core product promise: reliable workflows, stronger output quality, and a premium experience without signup friction.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {trustBullets.map((bullet) => (
                  <div key={bullet.title} className="rounded-[1.4rem] border border-border/60 bg-background/75 p-4 shadow-soft">
                    <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${bullet.bg}`}>
                      <bullet.icon className={`h-5 w-5 ${bullet.tone}`} />
                    </div>
                    <h4 className="text-base font-bold text-foreground">{bullet.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{bullet.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
            {valueCards.map((card, idx) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.45, delay: idx * 0.06 }}
                className="group relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/80 p-5 shadow-premium backdrop-blur-xl"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-80 pointer-events-none`} />
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
                <div className="relative z-10 flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-background/85 ${card.tone} shadow-soft`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Value
                    </span>
                  </div>
                  <div className="mt-5">
                    <p className="text-2xl font-extrabold tracking-tight text-foreground">{card.value}</p>
                    <p className="mt-1 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">{card.label}</p>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{card.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
