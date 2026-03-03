'use client';

import { motion } from 'framer-motion';
import type { ToolCategory } from '@/lib/tools-data';
import { ToolCard } from './tool-card';
import { ArrowRight } from 'lucide-react';

type CategorySectionProps = {
  category: ToolCategory;
};

export function CategorySection({ category }: CategorySectionProps) {
  const CategoryIcon = category.tools[0]?.icon;

  return (
    <section className="relative rounded-3xl bg-card/70 border border-border/50 p-5 md:p-8 overflow-hidden shadow-soft">
      {/* Decorative background gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/5 to-violet-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Gradient header band */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8 pb-6 border-b border-border/40">
        <div className="flex items-start sm:items-center gap-5">
          {/* Icon */}
          {CategoryIcon && (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-violet-500/10 flex items-center justify-center flex-shrink-0 shadow-sm border border-primary/20 backdrop-blur-sm">
              <CategoryIcon className="w-6 h-6 text-primary" />
            </div>
          )}

          {/* Title + count */}
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-1.5">
              <h2 id={`${category.id}-heading`} className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                {category.name}
              </h2>
              <span className="text-[11px] font-bold text-primary bg-gradient-to-r from-primary/15 to-violet-500/10 px-3 py-1 rounded-full border border-primary/20 shadow-sm">
                {category.tools.length} Tools
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl font-medium">
              {category.description}
            </p>
          </div>
        </div>

        {/* View all link */}
        <button
          onClick={() => {
            const el = document.getElementById(category.id);
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="hidden sm:flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors flex-shrink-0 group px-4 py-2 rounded-xl hover:bg-primary/5"
        >
          View all
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 relative z-10">
        {category.tools.map((tool, index) => (
          <ToolCard key={tool.id} tool={tool} index={index} />
        ))}
      </div>
    </section>
  );
}
