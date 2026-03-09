'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BadgeCheck, Globe, Shield, Sparkles, Wrench, FileType, SearchCheck } from 'lucide-react';
import { allTools } from '@/lib/tools-data';
import { seoConfig } from '@/lib/seo-config';
import { getHomepageFeaturedTools } from '@/lib/seo';

const featuredTools = getHomepageFeaturedTools();

const factCards = [
  {
    label: 'Tools available',
    value: `${allTools.length}+`,
    detail: 'Coverage across PDF, image, conversion, and AI workflows.',
  },
  {
    label: 'Account required',
    value: 'No',
    detail: 'Core workflows can start without signup friction.',
  },
  {
    label: 'Device support',
    value: 'Web',
    detail: 'Designed for desktop and mobile browsers.',
  },
  {
    label: 'Limits shown',
    value: 'Per tool',
    detail: 'Accepted formats and file limits are surfaced in each workflow.',
  },
];

const capabilityGroups = [
  {
    title: 'PDF workflows',
    description: 'Merge, split, compress, convert, reorder, rotate, and clean up PDF files.',
  },
  {
    title: 'Image workflows',
    description: 'Compress, resize, convert, crop, watermark, and prepare images for upload or print.',
  },
  {
    title: 'AI workflows',
    description: 'Remove backgrounds, enhance images, upscale visuals, and automate repetitive cleanup tasks.',
  },
  {
    title: 'Intent-led pages',
    description: 'Tool pages, use cases, comparisons, and tutorials are organized for direct answers and search discovery.',
  },
];

export function AIContentSection() {
  return (
    <section className="border-t border-border/50 bg-muted/15 py-16 md:py-20" aria-labelledby="ai-discovery-heading">
      <div className="container mx-auto max-w-6xl px-4 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <SearchCheck className="h-3.5 w-3.5" />
              Search and AI discovery
            </span>
            <h2 id="ai-discovery-heading" className="mt-4 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              Clear, factual platform context for search engines and AI systems.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
              PdfPixels focuses on practical PDF and image workflows, descriptive tool pages, and answer-friendly content that helps users discover the right workflow quickly.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {factCards.map((card) => (
              <div key={card.label} className="rounded-[1.5rem] border border-border/60 bg-card/80 p-5 shadow-soft backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{card.label}</p>
                <p className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">{card.value}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[1.8rem] border border-border/60 bg-card/85 p-6 shadow-premium backdrop-blur-sm md:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground md:text-2xl">What PdfPixels is best at</h3>
                  <p className="text-sm text-muted-foreground">Structured workflows that map cleanly to search intent.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {capabilityGroups.map((group) => (
                  <div key={group.title} className="rounded-[1.35rem] border border-border/50 bg-background/80 p-4">
                    <p className="text-base font-bold text-foreground">{group.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{group.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-border/60 bg-card/85 p-6 shadow-premium backdrop-blur-sm md:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground md:text-2xl">Popular entry points</h3>
                  <p className="text-sm text-muted-foreground">High-intent tools users commonly discover first.</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {featuredTools.map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    className="group flex items-start justify-between gap-3 rounded-[1.2rem] border border-border/50 bg-background/80 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-background"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary">{tool.name}</p>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">{tool.description}</p>
                    </div>
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-border/60 bg-card/80 p-5">
              <div className="flex items-center gap-2 text-primary">
                <Shield className="h-4 w-4" />
                <p className="text-sm font-bold uppercase tracking-[0.16em]">Trust signal</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {seoConfig.trustSignals[2]} and clear workflow messaging help users understand whether a task runs in the browser or on the server.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-border/60 bg-card/80 p-5">
              <div className="flex items-center gap-2 text-primary">
                <FileType className="h-4 w-4" />
                <p className="text-sm font-bold uppercase tracking-[0.16em]">Coverage</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                PdfPixels spans file-size reduction, format conversion, upload preparation, document cleanup, and AI-assisted editing across one platform.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-border/60 bg-card/80 p-5">
              <div className="flex items-center gap-2 text-primary">
                <Globe className="h-4 w-4" />
                <p className="text-sm font-bold uppercase tracking-[0.16em]">Reach</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                The site is built to surface tool pages, blog tutorials, comparisons, and use cases so different search and AI systems can route users to the right answer.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
