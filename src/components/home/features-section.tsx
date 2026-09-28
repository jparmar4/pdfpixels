'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Files, Server, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { allTools } from '@/lib/tools-data';

const trustBullets = [
  {
    title: 'Private by design',
    description: 'Browser-based tools process files on your device whenever possible — nothing is stored after your session ends.',
    icon: ShieldCheck,
    tone: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    title: 'Reliable results',
    description: 'Professional defaults and clean exports across every PDF and image workflow, with no watermarks.',
    icon: CheckCircle2,
    tone: 'text-sky-500',
    bg: 'bg-sky-500/10',
  },
  {
    title: 'No signup friction',
    description: 'Move from upload to final file in seconds — no account walls, no queues, no distractions.',
    icon: Sparkles,
    tone: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
];

const valueCards = [
  {
    value: `${allTools.length}+`,
    label: 'Tools ready',
    description: 'Broad coverage for compression, conversion, editing, and document workflows.',
    icon: Files,
    tone: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    value: 'PDF + Image',
    label: 'One platform',
    description: 'A single polished experience for the document and image jobs you actually need.',
    icon: Server,
    tone: 'text-sky-500',
    bg: 'bg-sky-500/10',
  },
  {
    value: 'Seconds',
    label: 'Typical job time',
    description: 'High-quality exports and strong defaults, from upload to finished download.',
    icon: Zap,
    tone: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
];

export function FeaturesSection() {
  return (
    <section className="relative overflow-hidden border-t border-border/60 bg-muted/30 py-16 md:py-20">
      <div className="container mx-auto max-w-6xl px-4 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 text-center md:mb-12"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-4 py-1.5 text-xs font-semibold text-primary">
            Trust and quality
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Tooling you can depend on for{' '}
            <span className="text-primary">documents that matter</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            PdfPixels is built to stay fast and predictable under real work: contracts, applications, invoices, photos, and everything in between.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-soft md:p-9"
          >
            <div className="relative z-10 flex h-full flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Built for trust
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                  <Zap className="h-3.5 w-3.5 text-sky-500" />
                  Fast completion
                </span>
              </div>

              <div className="mt-6 max-w-2xl">
                <h3 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                  Clean, professional tooling for image and PDF work.
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
                  Every workflow follows the same promise: upload confidently, get a high-quality result, and download immediately. No clutter, no watermarks, no surprises.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {trustBullets.map((bullet) => (
                  <div key={bullet.title} className="rounded-2xl border border-border bg-background p-4">
                    <div className={`mb-3.5 flex h-10 w-10 items-center justify-center rounded-xl ${bullet.bg}`}>
                      <bullet.icon className={`h-5 w-5 ${bullet.tone}`} />
                    </div>
                    <h4 className="text-[15px] font-semibold text-foreground">{bullet.title}</h4>
                    <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground">{bullet.description}</p>
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
                className="group relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-soft"
              >
                <div className="relative z-10 flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bg} ${card.tone}`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-semibold tracking-tight text-foreground">{card.value}</p>
                    <p className="mt-1 text-[13px] font-medium text-muted-foreground">{card.label}</p>
                  </div>
                  <p className="mt-3 text-[13px] leading-5 text-muted-foreground">{card.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
