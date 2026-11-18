'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Layers, Sparkles } from 'lucide-react';
import { useActiveTool } from '@/hooks/use-active-tool';
import { getChainedNextTools } from '@/lib/workflow-chain';
import { getUiDictionary, normalizeUiLocale } from '@/lib/locale-ui';
import { isLocalizedToolSlug, getLocalizedTool } from '@/lib/localized-tools';
import { resolveFileForWorkflowChain, useWorkflowStore, type OutputTelemetry } from '@/store/workflow-store';
import { cn } from '@/lib/utils';

export interface WorkflowChainBarProps {
  visible: boolean;
  outputOverride?: Partial<OutputTelemetry> | null;
  className?: string;
}

/**
 * Post-download 1-click workflow chaining bar. Only revealed after Download completes,
 * queuing the processed File Blob in-memory & IndexedDB across Next.js routes so the next
 * tool loads with zero re-upload friction (and triggers a fresh pageview / Adsterra cycle).
 */
export function WorkflowChainBar({ visible, outputOverride, className }: WorkflowChainBarProps) {
  const router = useRouter();
  const { activeTool } = useActiveTool();
  const locale = normalizeUiLocale(activeTool?.locale);
  const ui = getUiDictionary(locale);
  const queueChainedFile = useWorkflowStore((s) => s.queueChainedFile);
  const [navigatingSlug, setNavigatingSlug] = useState<string | null>(null);

  if (!visible || !activeTool?.id) return null;

  const nextTools = getChainedNextTools(activeTool.id);
  if (nextTools.length === 0) return null;

  const buildNextHref = (nextSlug: string, chained: boolean) => {
    const base = locale !== 'en' && isLocalizedToolSlug(nextSlug)
      ? `/${locale}/tools/${nextSlug}`
      : `/tools/${nextSlug}`;
    return chained ? `${base}?chained=1` : base;
  };

  const handleChainClick = async (nextSlug: string) => {
    setNavigatingSlug(nextSlug);
    try {
      const file = await resolveFileForWorkflowChain(activeTool.id, outputOverride);
      if (file) {
        queueChainedFile(file, activeTool.id, activeTool.name);
      }
      router.push(buildNextHref(nextSlug, true));
    } catch {
      router.push(buildNextHref(nextSlug, false));
    }
  };

  return (
    <div
      data-testid="workflow-chain-bar"
      className={cn(
        'mt-4 rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/[0.08] via-violet-500/[0.05] to-sky-500/[0.06] p-4 shadow-soft',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              {ui.result.chainTitle}
            </p>
            <p className="text-xs text-muted-foreground">
              {ui.result.chainSubtitle}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-3 w-3" />
          {ui.result.downloadComplete}
        </span>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3">
        {nextTools.map((tool) => {
          const Icon = tool.icon;
          const isLoading = navigatingSlug === tool.slug;
          const displayName = locale !== 'en'
            ? (getLocalizedTool(locale, tool.slug)?.name ?? tool.name)
            : tool.name;
          return (
            <button
              key={tool.id}
              type="button"
              disabled={navigatingSlug !== null}
              onClick={() => void handleChainClick(tool.slug)}
              className="group flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/90 px-3.5 py-2.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-premium disabled:opacity-60"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-foreground group-hover:text-primary">
                    {displayName}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {isLoading ? ui.result.loadingFile : ui.result.clickCarryOver}
                  </p>
                </div>
              </div>
              {isLoading ? (
                <Sparkles className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
