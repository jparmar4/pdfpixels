'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Sparkles, Zap, Star, Cpu } from 'lucide-react';
import type { Tool, ToolCategory } from '@/lib/tools-data';
import { normalizeDisplayText } from '@/lib/display-text';

type CategorySectionProps = {
  category: ToolCategory;
};

export function CategorySection({ category }: CategorySectionProps) {
  const CategoryIcon = category.icon;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-soft md:p-7">
      {/* ── Category header ── */}
      <div className="relative z-10 mb-7 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl icon-violet`}>
            <CategoryIcon className="h-5.5 w-5.5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 id={`${category.id}-heading`} className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                {normalizeDisplayText(category.name)}
              </h2>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                {category.tools.length} tools
              </span>
            </div>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
              {normalizeDisplayText(category.description)}
            </p>
          </div>
        </div>

        <Link
          href={`/tools/category/${category.id}`}
          className="group inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-border px-3.5 py-2 text-[13px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary sm:self-auto"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* ── Tool cards grid ── */}
      <div className="relative z-10 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {category.tools.slice(0, 6).map((tool, index) => (
          <EnhancedToolCard key={tool.id} tool={tool} index={index} />
        ))}
      </div>
    </section>
  );
}

/* ── Tool card used across the homepage, category hub pages and search results ── */
export function EnhancedToolCard({ tool, index }: { tool: Tool; index: number }) {
  return (
    <motion.div
      initial={{ y: 14 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3), ease: [0.16, 1, 0.3, 1] }}
      className="h-full"
    >
      <div className="tool-card relative h-full rounded-2xl border border-border bg-card">
        <Link href={`/tools/${tool.slug}`} className="group flex h-full flex-col gap-3.5 p-5">
          {/* Top row: icon + badge */}
          <div className="flex items-start justify-between gap-3">
            <EnhancedToolIcon tool={tool} />
            {tool.badge ? (
              <ToolBadge badge={tool.badge} />
            ) : tool.popular ? (
              <ToolBadge badge="Popular" />
            ) : null}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-1.5">
            <h3 className="text-[15px] font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
              {normalizeDisplayText(tool.name)}
            </h3>
            <p className="line-clamp-2 text-[13px] leading-5 text-muted-foreground">
              {normalizeDisplayText(tool.description)}
            </p>
          </div>

          {/* Footer */}
          <div className="mt-auto flex items-center justify-between border-t border-border/70 pt-3">
            <ProcessingLabel processing={tool.processing} />
            <ArrowRight className="h-4 w-4 text-muted-foreground/60 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
          </div>
        </Link>
      </div>
    </motion.div>
  );
}

/* ── Icon chip with a soft semantic tint ── */
function EnhancedToolIcon({ tool }: { tool: Tool }) {
  const Icon = tool.icon;

  const chipClass = tool.isAI
    ? 'icon-violet'
    : tool.processing === 'client'
    ? 'icon-emerald'
    : tool.category.startsWith('pdf')
    ? 'icon-violet'
    : 'icon-blue';

  return (
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${chipClass}`}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

/* ── Badge component ── */
function ToolBadge({ badge }: { badge: string }) {
  const styles: Record<string, string> = {
    AI: 'badge-ai',
    Popular: 'badge-popular',
    Secure: 'badge-secure',
    New: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
    OCR: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20',
  };

  const classes = styles[badge] ?? 'bg-primary/8 text-primary border-primary/15';

  const icons: Record<string, typeof Sparkles> = {
    AI: Sparkles,
    Popular: Star,
    Secure: ShieldCheck,
    New: Zap,
  };
  const Icon = icons[badge];

  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${classes}`}>
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {badge}
    </span>
  );
}

/* ── Processing label — small, muted, sentence case ── */
function ProcessingLabel({ processing }: { processing: string }) {
  if (processing === 'ai') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-violet-500" />
        AI powered
      </span>
    );
  }
  if (processing === 'client') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
        Runs in your browser
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <Cpu className="h-3.5 w-3.5 text-sky-500" />
      Server optimized
    </span>
  );
}
