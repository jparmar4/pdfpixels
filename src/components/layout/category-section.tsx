'use client';

import React from 'react';
import Link from 'next/link';
import type { Tool, ToolCategory } from '@/lib/tools-data';
import { normalizeDisplayText } from '@/lib/display-text';

type CategorySectionProps = {
  category: ToolCategory;
  maxItems?: number;
};

export function CategorySection({ category, maxItems = 3 }: CategorySectionProps) {
  const CategoryIcon = category.icon;
  const visibleTools = category.tools.slice(0, maxItems);

  return (
    <section
      id={category.id}
      aria-labelledby={`${category.id}-heading`}
      className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-soft transition-shadow duration-300 hover:shadow-elevated md:p-7"
    >
      {/* ── Category header ── */}
      <div className="relative z-10 mb-6 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl icon-violet">
            <CategoryIcon className="h-5 w-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 id={`${category.id}-heading`} className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                {normalizeDisplayText(category.name)}
              </h2>
              <span className="rounded-full border border-primary/15 bg-primary/[0.06] px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                {category.tools.length} tools
              </span>
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              {normalizeDisplayText(category.description)}
            </p>
          </div>
        </div>

        <Link
          href={`/tools/category/${category.id}`}
          className="group inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-border bg-background px-4 py-2 text-[13px] font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary sm:self-auto"
        >
          View all {category.tools.length}
          <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </Link>
      </div>

      {/* ── Tool cards grid ── */}
      <div className="relative z-10 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {visibleTools.map((tool, index) => (
          <EnhancedToolCard key={tool.id} tool={tool} index={index} />
        ))}
      </div>
    </section>
  );
}

/* ── Tool card used across the homepage, category hub pages and search results ── */
export function EnhancedToolCard({ tool }: { tool: Tool; index?: number }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="tool-card group relative flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-elevated"
    >
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
      <div className="flex-1 space-y-1">
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
        <span
          aria-hidden="true"
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs text-muted-foreground/70 transition-all duration-200 group-hover:translate-x-0.5 group-hover:bg-primary/10 group-hover:text-primary"
        >
          →
        </span>
      </div>
    </Link>
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
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${chipClass}`}>
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

  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${classes}`}>
      {badge}
    </span>
  );
}

/* ── Processing label — small, muted, sentence case ── */
function ProcessingLabel({ processing }: { processing: string }) {
  if (processing === 'ai') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-violet-500" aria-hidden="true" />
        AI powered
      </span>
    );
  }
  if (processing === 'client') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
        Runs in browser
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-sky-500" aria-hidden="true" />
      Cloud optimized
    </span>
  );
}
