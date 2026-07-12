'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, MonitorSmartphone, Server, ShieldCheck, Sparkles, Wand2, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { type LucideIcon } from 'lucide-react';
import { normalizeDisplayText } from '@/lib/display-text';
import { getToolById } from '@/lib/tools-data';
import { useAppStore } from '@/store/app-store';

interface ToolPageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon | React.ReactNode;
  onReset: () => void;
  isAI?: boolean;
  emoji?: string;
  children?: React.ReactNode;
}

export function ToolPageHeader({
  title,
  description,
  icon,
  onReset,
  isAI = false,
  emoji,
  children,
}: ToolPageHeaderProps) {
  const activeToolId = useAppStore((state) => state.activeTool?.id);
  const isIconComponentType =
    typeof icon === 'function' ||
    (typeof icon === 'object' && icon !== null && '$$typeof' in (icon as { $$typeof?: unknown }));

  const safeTitle = normalizeDisplayText(title);
  const safeDescription = normalizeDisplayText(description);
  const tool = activeToolId ? getToolById(activeToolId) : undefined;
  const lowerText = `${tool?.id || ''} ${safeTitle} ${safeDescription}`.toLowerCase();
  const processingMeta = tool?.processing === 'client'
    ? { label: 'Browser-native', icon: MonitorSmartphone, tone: 'text-emerald-600 dark:text-emerald-300' }
    : tool?.processing === 'ai' || isAI
      ? { label: 'AI-enhanced', icon: Wand2, tone: 'text-violet-600 dark:text-violet-300' }
      : { label: 'Server-optimized', icon: Server, tone: 'text-sky-600 dark:text-sky-300' };
  const workflowMeta = [
    {
      label: 'Input',
      value: lowerText.includes('pdf') && !lowerText.includes('image to pdf')
        ? 'PDF files'
        : lowerText.includes('signature')
          ? 'Image or signature'
          : 'Image files',
    },
    {
      label: 'Engine',
      value: processingMeta.label,
    },
    {
      label: 'Output',
      value: lowerText.includes('ocr') || lowerText.includes('text')
        ? 'Extracted text'
        : lowerText.includes('pdf')
          ? 'Export-ready PDF'
          : 'Optimized image',
    },
  ];
  const ProcessingIcon = processingMeta.icon;

  return (
    <div className="relative mb-8 overflow-hidden rounded-[2rem] border border-border/50 bg-card/75 p-5 shadow-premium backdrop-blur-xl md:p-7">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,76,181,0.1),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,165,170,0.1),transparent_28%),radial-gradient(circle_at_top_right,rgba(184,134,39,0.08),transparent_26%)] pointer-events-none" />
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
      <div className="pointer-events-none absolute -right-16 top-10 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-5">
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <Link
              href="/"
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/75 px-3 py-1.5 transition-colors hover:border-primary/30 hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to tools
            </Link>
            <span className="hidden h-1 w-1 rounded-full bg-border md:block" />
            <span className="hidden md:block">Workspace</span>
            {tool?.badge ? (
              <>
                <span className="hidden h-1 w-1 rounded-full bg-border md:block" />
                <span className="hidden md:block">{tool.badge}</span>
              </>
            ) : null}
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] border border-primary/20 bg-gradient-to-br from-primary to-sky-500 shadow-lg shadow-primary/20">
              {emoji ? (
                <span className="text-2xl">{emoji}</span>
              ) : React.isValidElement(icon) ? (
                icon
              ) : isIconComponentType ? (
                (() => {
                  const IconComponent = icon as LucideIcon;
                  return <IconComponent className="h-8 w-8 text-white" />;
                })()
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                  {safeTitle}
                </h1>
                {isAI ? (
                  <Badge className="rounded-full border-0 bg-gradient-to-r from-violet-500 to-sky-500 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                    AI powered
                  </Badge>
                ) : null}
              </div>

              <p className="tool-hero-description max-w-3xl text-sm font-medium leading-6 text-muted-foreground md:text-base">
                {safeDescription}
              </p>

              <div className="flex flex-wrap gap-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/75 px-3 py-1.5">
                  <Zap className="h-3.5 w-3.5 text-sky-500" />
                  Fast workflow
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/75 px-3 py-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Private processing
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/75 px-3 py-1.5">
                  <ProcessingIcon className={`h-3.5 w-3.5 ${processingMeta.tone}`} />
                  {processingMeta.label}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {workflowMeta.map((item) => (
              <div key={item.label} className="rounded-[1.25rem] border border-border/60 bg-background/75 p-3 shadow-soft">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 w-full max-w-sm rounded-[1.5rem] border border-border/60 bg-background/75 p-4 shadow-soft xl:w-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Recommended flow</p>
          <div className="mt-3 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card/70 px-3 py-2">
              <span>1. Upload your file</span>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card/70 px-3 py-2">
              <span>2. Tune output settings</span>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card/70 px-3 py-2">
              <span>3. Download polished result</span>
              <Download className="h-4 w-4 text-sky-500" />
            </div>
          </div>

          {children ? <div className="mt-4 flex flex-wrap items-center gap-3">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}
