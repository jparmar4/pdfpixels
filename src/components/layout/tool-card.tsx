'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Cpu, ShieldCheck, Sparkles } from 'lucide-react';
import type { Tool } from '@/lib/tools-data';
import { useAppStore } from '@/store/app-store';
import { SpotlightCard } from '../ui/spotlight-card';
import { normalizeDisplayText } from '@/lib/display-text';

type ToolCardProps = {
  tool: Tool;
  index?: number;
};

function getIconColorClass(toolId: string): string {
  const id = toolId.toLowerCase();
  if (id.includes('pdf-merge') || id.includes('pdf-split') || id.includes('pdf-compress') || id.includes('pdf-to') || id.includes('image-to-pdf')) {
    return 'icon-violet';
  }
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
      return 'bg-sky-500/12 text-sky-600 dark:text-sky-400 border-sky-500/18';
    default:
      return 'bg-primary/10 text-primary border-primary/15';
  }
}

function getProcessingMeta(tool: Tool) {
  if (tool.processing === 'ai') {
    return {
      label: 'AI powered',
      icon: Sparkles,
      className: 'text-violet-600 dark:text-violet-300',
    };
  }

  if (tool.processing === 'client') {
    return {
      label: 'Browser processing',
      icon: ShieldCheck,
      className: 'text-emerald-600 dark:text-emerald-300',
    };
  }

  return {
    label: 'Server optimized',
    icon: Cpu,
    className: 'text-sky-600 dark:text-sky-300',
  };
}

export function ToolCard({ tool, index = 0 }: ToolCardProps) {
  const setActiveTool = useAppStore((state) => state.setActiveTool);
  const Icon = tool.icon;
  const iconColorClass = getIconColorClass(tool.id);
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
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className="h-full"
    >
      <SpotlightCard className="h-full rounded-[1.65rem] border border-border/50 bg-background/70 backdrop-blur-xl card-shine">
        <Link
          href={`/tools/${tool.slug}`}
          onClick={handleClick}
          className="group relative flex h-full flex-col gap-5 rounded-[1.65rem] p-5 text-left transition-all duration-300"
        >
          <div className="flex items-start justify-between gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconColorClass} bg-secondary/80 shadow-sm glow-ring transition-all duration-300 group-hover:scale-105`}>
              <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-105" />
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              {tool.badge ? (
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${getBadgeClasses(tool.badge)}`}>
                  {tool.badge}
                </span>
              ) : null}
              {tool.popular ? (
                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
                  Top flow
                </span>
              ) : null}
            </div>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-lg font-bold tracking-tight text-foreground transition-colors duration-200 group-hover:text-primary">
              {normalizeDisplayText(tool.name)}
            </h3>
            <p className="line-clamp-2 text-sm font-medium leading-6 text-muted-foreground">
              {normalizeDisplayText(tool.description)}
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/40 pt-4">
            <div className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] ${processingMeta.className}`}>
              <ProcessingIcon className="h-3.5 w-3.5" />
              {processingMeta.label}
            </div>
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/70 text-muted-foreground transition-all duration-300 group-hover:border-primary/40 group-hover:bg-primary/5 group-hover:text-primary">
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </div>
          </div>
        </Link>
      </SpotlightCard>
    </motion.div>
  );
}
