'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Sparkles, Eye, Zap, Star, TrendingUp } from 'lucide-react';
import type { ToolCategory } from '@/lib/tools-data';
import { ToolCard } from './tool-card';
import { normalizeDisplayText } from '@/lib/display-text';

type CategorySectionProps = {
  category: ToolCategory;
};

export function CategorySection({ category }: CategorySectionProps) {
  const CategoryIcon = category.icon;
  const aiCount = category.tools.filter((tool) => tool.isAI).length;
  const clientCount = category.tools.filter((tool) => tool.processing === 'client').length;
  const hasMoreTools = category.tools.length > 6;

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-border/50 bg-card/75 p-5 shadow-premium md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_28%)] pointer-events-none" />
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      {/* ── Category Header with icon background ── */}
      <div className="relative z-10 mb-8 flex flex-col gap-5 border-b border-border/40 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-4 md:gap-5">
          {/* Larger icon with gradient background glow */}
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-sky-500/15 blur-md opacity-60" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/12 to-sky-500/10 shadow-sm">
              <CategoryIcon className="h-6 w-6 text-primary" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 id={`${category.id}-heading`} className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
                {normalizeDisplayText(category.name)}
              </h2>
              <span className="rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                {category.tools.length} tools
              </span>
            </div>

            <p className="max-w-2xl text-sm font-medium leading-6 text-muted-foreground md:text-base">
              {normalizeDisplayText(category.description)}
            </p>

            <div className="flex flex-wrap gap-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                {clientCount > 0 ? `${clientCount} browser-native flows` : 'Optimized processing'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                {aiCount > 0 ? `${aiCount} AI-enhanced tools` : 'Production-ready UX'}
              </span>
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm font-medium text-muted-foreground">
          <span className="text-foreground">Best fit for:</span>
          <span>{normalizeDisplayText(category.description)}</span>
          <ArrowRight className="h-4 w-4 text-primary" />
        </div>
      </div>

      {/* ── Tool Cards Grid ── */}
      <div className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {category.tools.slice(0, 6).map((tool, index) => (
          <EnhancedToolCard key={tool.id} tool={tool} index={index} />
        ))}
      </div>

      {/* ── View All Link ── */}
      {hasMoreTools && (
        <div className="relative z-10 mt-6 flex justify-center">
          <Link
            href={`/#${category.id}`}
            className="group inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-background/70 px-5 py-3 text-sm font-semibold text-muted-foreground transition-all duration-200 hover:border-primary/30 hover:text-primary hover:shadow-sm hover:shadow-primary/5"
          >
            <Eye className="h-4 w-4" />
            View all {normalizeDisplayText(category.name).toLowerCase()} tools
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      )}
    </section>
  );
}

/* ── Enhanced Tool Card wrapper with hover animations ── */
function EnhancedToolCard({ tool, index }: { tool: import('@/lib/tools-data').Tool; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.25, ease: 'easeOut' } }}
      className="h-full"
    >
      <div className="relative h-full rounded-[1.65rem] border border-border/50 bg-background/70 backdrop-blur-xl transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30">
        <div className="flex h-full flex-col gap-4 rounded-[1.65rem] p-5">
          {/* Top row: icon + badges */}
          <div className="flex items-start justify-between gap-3">
            <EnhancedToolIcon tool={tool} />
            <div className="flex flex-wrap justify-end gap-2">
              {tool.badge ? <ToolBadge badge={tool.badge} /> : null}
              {tool.popular && !tool.badge ? <ToolBadge badge="Popular" /> : null}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2 flex-1">
            <h3 className="text-lg font-bold tracking-tight text-foreground">
              {normalizeDisplayText(tool.name)}
            </h3>
            <p className="line-clamp-2 text-sm font-medium leading-6 text-muted-foreground">
              {normalizeDisplayText(tool.description)}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-4 mt-auto">
            <ProcessingLabel processing={tool.processing} />
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/70 text-muted-foreground transition-all duration-300 group-hover:border-primary/40 group-hover:bg-primary/5 group-hover:text-primary">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Full card link overlay */}
        <Link href={`/tools/${tool.slug}`} className="absolute inset-0 rounded-[1.65rem]">
          <span className="sr-only">Open {normalizeDisplayText(tool.name)}</span>
        </Link>
      </div>
    </motion.div>
  );
}

/* ── Enhanced icon with gradient styling ── */
function EnhancedToolIcon({ tool }: { tool: import('@/lib/tools-data').Tool }) {
  const Icon = tool.icon;

  const gradientClass = tool.isAI
    ? 'from-violet-500/20 to-purple-500/15 border-violet-500/20 text-violet-600 dark:text-violet-300'
    : tool.processing === 'client'
    ? 'from-emerald-500/20 to-teal-500/15 border-emerald-500/20 text-emerald-600 dark:text-emerald-300'
    : 'from-sky-500/20 to-blue-500/15 border-sky-500/20 text-sky-600 dark:text-sky-300';

  return (
    <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-gradient-to-br ${gradientClass}`}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

/* ── Badge component ── */
function ToolBadge({ badge }: { badge: string }) {
  let classes = '';

  switch (badge) {
    case 'AI':
      classes = 'bg-violet-500/12 text-violet-600 dark:text-violet-300 border-violet-500/18';
      break;
    case 'Popular':
      classes = 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/18';
      break;
    case 'Secure':
      classes = 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/18';
      break;
    case 'New':
      classes = 'bg-sky-500/12 text-sky-600 dark:text-sky-400 border-sky-500/18';
      break;
    case 'OCR':
      classes = 'bg-teal-500/12 text-teal-700 dark:text-teal-300 border-teal-500/18';
      break;
    default:
      classes = 'bg-primary/10 text-primary border-primary/15';
  }

  const icon = badge === 'AI' ? Sparkles : badge === 'Popular' ? Star : badge === 'Secure' ? ShieldCheck : badge === 'New' ? Zap : null;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${classes}`}>
      {icon && <icon className="h-3 w-3" />}
      {badge}
    </span>
  );
}

/* ── Processing label ── */
function ProcessingLabel({ processing }: { processing: string }) {
  if (processing === 'ai') {
    return (
      <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300">
        <Sparkles className="h-3.5 w-3.5" />
        AI powered
      </div>
    );
  }
  if (processing === 'client') {
    return (
      <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-300">
        <ShieldCheck className="h-3.5 w-3.5" />
        Browser
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-sky-600 dark:text-sky-300">
      <Zap className="h-3.5 w-3.5" />
      Server
    </div>
  );
}
