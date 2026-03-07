'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
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

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-border/50 bg-card/75 p-5 shadow-premium md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_28%)] pointer-events-none" />
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="relative z-10 mb-8 flex flex-col gap-5 border-b border-border/40 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-4 md:gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/12 to-sky-500/10 shadow-sm">
            <CategoryIcon className="h-6 w-6 text-primary" />
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

      <div className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {category.tools.map((tool, index) => (
          <ToolCard key={tool.id} tool={tool} index={index} />
        ))}
      </div>
    </section>
  );
}
