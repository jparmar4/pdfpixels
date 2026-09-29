'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Cpu, ShieldCheck, Sparkles, Star } from 'lucide-react';
import type { Tool } from '@/lib/tools-data';
import { useAppStore } from '@/store/app-store';
import { normalizeDisplayText } from '@/lib/display-text';
import { TiltCard } from '@/components/ui/tilt-card';

type ToolCardProps = {
  tool: Tool;
  index?: number;
};

function getIconColorClass(tool: Tool): string {
  if (tool.isAI) return 'icon-violet';
  const id = tool.id.toLowerCase();
  if (id.includes('compress') || id.includes('reduce') || id.includes('kb')) {
    return 'icon-emerald';
  }
  if (id.includes('resize') || id.includes('pixel') || id.includes('cm') || id.includes('inch')) {
    return 'icon-blue';
  }
  if (id.includes('to-') || id.includes('convert') || id.includes('png') || id.includes('jpg') || id.includes('webp')) {
    return 'icon-cyan';
  }
  if (id.includes('filter') || id.includes('brightness') || id.includes('contrast') || id.includes('saturation')) {
    return 'icon-amber';
  }
  if (id.includes('blur') || id.includes('pixelate') || id.includes('grayscale') || id.includes('beautify')) {
    return 'icon-rose';
  }
  if (tool.category.startsWith('pdf')) {
    return 'icon-violet';
  }
  return 'icon-blue';
}

function getBadgeClasses(badge?: string) {
  switch (badge) {
    case 'AI':
      return 'badge-ai';
    case 'Popular':
      return 'badge-popular';
    case 'Secure':
      return 'badge-secure';
    case 'New':
      return 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20';
    default:
      return 'bg-primary/8 text-primary border-primary/15';
  }
}

function getProcessingMeta(tool: Tool) {
  if (tool.processing === 'ai') {
    return {
      label: 'AI powered',
      icon: Sparkles,
      className: 'text-violet-500',
    };
  }

  if (tool.processing === 'client') {
    return {
      label: 'Runs in your browser',
      icon: ShieldCheck,
      className: 'text-emerald-500',
    };
  }

  return {
    label: 'Server optimized',
    icon: Cpu,
    className: 'text-sky-500',
  };
}

export function ToolCard({ tool, index = 0 }: ToolCardProps) {
  const setActiveTool = useAppStore((state) => state.setActiveTool);
  const Icon = tool.icon;
  const iconColorClass = getIconColorClass(tool);
  const processingMeta = getProcessingMeta(tool);
  const ProcessingIcon = processingMeta.icon;

  const handleClick = () => {
    setActiveTool({
      id: tool.id,
      name: normalizeDisplayText(tool.name),
      description: normalizeDisplayText(tool.description),
    });
  };

  return (
    <motion.div
      initial={{ y: 14 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.3), ease: [0.16, 1, 0.3, 1] }}
      className="h-full"
    >
      <TiltCard wrapperClassName="h-full" max={6}>
        <div className="tool-card h-full rounded-2xl border border-border bg-card">
          <Link
            href={`/tools/${tool.slug}`}
            onClick={handleClick}
            className="group relative flex h-full flex-col gap-3.5 rounded-2xl p-5 text-left"
          >
            <div className="flex items-start justify-between gap-3">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3 ${iconColorClass} group-hover:shadow-[0_8px_18px_-8px_rgba(79,70,229,0.55)]`}>
                <Icon className="h-5 w-5" />
              </div>

              <div className="flex flex-wrap justify-end gap-1.5">
                {tool.badge ? (
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] transition-transform duration-300 group-hover:-translate-y-0.5 ${getBadgeClasses(tool.badge)}`}>
                    {tool.badge}
                  </span>
                ) : null}
                {tool.popular && tool.badge !== 'Popular' ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-700 dark:text-amber-300">
                    <Star className="h-3 w-3" />
                    Popular
                  </span>
                ) : null}
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-[15px] font-semibold tracking-tight text-foreground transition-colors duration-200 group-hover:text-primary">
                {normalizeDisplayText(tool.name)}
              </h3>
              <p className="line-clamp-2 text-[13px] leading-5 text-muted-foreground">
                {normalizeDisplayText(tool.description)}
              </p>
            </div>

            <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/70 pt-3">
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${processingMeta.className}`}>
                <ProcessingIcon className="h-3.5 w-3.5" />
                {processingMeta.label}
              </span>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/0 text-muted-foreground/60 transition-all duration-300 group-hover:bg-primary/10 group-hover:text-primary group-hover:translate-x-0.5">
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        </div>
      </TiltCard>
    </motion.div>
  );
}
