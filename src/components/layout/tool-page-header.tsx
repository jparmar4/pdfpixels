'use client';

import React from 'react';
import { Download, Keyboard, MonitorSmartphone, Server, ShieldCheck, Sparkles, Wand2, Wifi, WifiOff, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { type LucideIcon } from 'lucide-react';
import { useLiveOnlineStatus } from '@/hooks/use-pro-tool-shortcuts';
import { normalizeDisplayText } from '@/lib/display-text';
import { getToolById } from '@/lib/tools-data';
import { useActiveTool } from '@/hooks/use-active-tool';
import { getUiDictionary } from '@/lib/locale-ui';

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
  isAI = false,
  emoji,
  children,
}: ToolPageHeaderProps) {
  const activeTool = useActiveTool().activeTool;
  const activeToolId = activeTool?.id;
  const ui = getUiDictionary(activeTool?.locale);
  const isLocalized = Boolean(activeTool?.locale && activeTool.locale !== 'en');
  const isOnline = useLiveOnlineStatus();
  const isIconComponentType =
    typeof icon === 'function' ||
    (typeof icon === 'object' && icon !== null && '$$typeof' in (icon as { $$typeof?: unknown }));

  const safeTitle = normalizeDisplayText(isLocalized && activeTool?.name ? activeTool.name : title);
  const safeDescription = normalizeDisplayText(isLocalized && activeTool?.description ? activeTool.description : description);
  const tool = activeToolId ? getToolById(activeToolId) : undefined;
  const lowerText = `${tool?.id || ''} ${safeTitle} ${safeDescription} ${title}`.toLowerCase();
  const processingMeta = tool?.processing === 'client'
    ? { label: ui.header.browserNative, icon: MonitorSmartphone, tone: 'text-success' }
    : tool?.processing === 'ai' || isAI
      ? { label: ui.header.aiEnhanced, icon: Wand2, tone: 'text-violet-600 dark:text-violet-300' }
      : { label: ui.header.serverOptimized, icon: Server, tone: 'text-info' };
  const workflowMeta = [
    {
      label: ui.header.inputLabel,
      value: lowerText.includes('pdf') && !lowerText.includes('image to pdf')
        ? ui.header.pdfFiles
        : lowerText.includes('signature')
          ? ui.header.signatureOrImage
          : ui.header.imageFiles,
    },
    {
      label: ui.header.engineLabel,
      value: processingMeta.label,
    },
    {
      label: ui.header.outputLabel,
      value: lowerText.includes('ocr') || lowerText.includes('text')
        ? ui.header.extractedText
        : lowerText.includes('pdf')
          ? ui.header.exportReadyPdf
          : ui.header.optimizedImage,
    },
  ];
  const ProcessingIcon = processingMeta.icon;

  return (
    <div className="relative mb-8 overflow-hidden rounded-[2rem] border border-border/50 bg-card/85 p-5 shadow-premium backdrop-blur-sm md:p-7">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.1),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_26%)] pointer-events-none" />
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
      <div className="pointer-events-none absolute -right-16 top-10 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-5">
          {/* Breadcrumb lives server-side on the page (app/tools/[slug]/page.tsx). */}

          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] border border-primary/20 bg-gradient-to-br from-primary to-violet-600 shadow-lg shadow-primary/30 transition-transform duration-300 hover:scale-105 hover:-rotate-2">
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
                <h1 className="tool-hero-title text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                  {safeTitle}
                </h1>
                {isAI ? (
                  <Badge className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300">
                    {ui.header.aiPowered}
                  </Badge>
                ) : null}
                {tool?.badge ? (
                  <Badge className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
                    {tool.badge}
                  </Badge>
                ) : null}
              </div>

              <p className="tool-hero-description max-w-3xl text-sm font-medium leading-6 text-muted-foreground md:text-base">
                {safeDescription}
              </p>

              <div className="flex flex-wrap gap-2.5 text-xs font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/75 px-3 py-1.5">
                  <Zap className="h-3.5 w-3.5 text-info" />
                  {ui.header.fastWorkflow}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/75 px-3 py-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" />
                  {ui.header.privateProcessing}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/75 px-3 py-1.5">
                  <ProcessingIcon className={`h-3.5 w-3.5 ${processingMeta.tone}`} />
                  {processingMeta.label}
                </span>
                {tool?.processing === 'client' && (
                  <span
                    data-testid="header-offline-proof"
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${
                      isOnline
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                    {isOnline ? ui.header.offlineProofOnline : ui.header.offlineProofActive}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground pt-0.5">
                <span className="inline-flex items-center gap-1 font-semibold text-foreground/80">
                  <Keyboard className="h-3.5 w-3.5 text-primary" />
                  {ui.header.shortcuts}
                </span>
                <kbd className="rounded border border-border/70 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px]">Ctrl/⌘+O</kbd>
                <span>{ui.header.openLabel}</span>
                <span aria-hidden="true">·</span>
                <kbd className="rounded border border-border/70 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px]">Ctrl/⌘+S</kbd>
                <span>{ui.header.saveLabel}</span>
                <span aria-hidden="true">·</span>
                <kbd className="rounded border border-border/70 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px]">Space</kbd>
                <span>{ui.header.compareLabel}</span>
                <span aria-hidden="true">·</span>
                <kbd className="rounded border border-border/70 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd>
                <span>{ui.header.resetLabel}</span>
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
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">{ui.header.recommendedFlow}</p>
          <div className="mt-3 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card/70 px-3 py-2">
              <span>{ui.header.step1}</span>
              <ShieldCheck className="h-4 w-4 text-success" />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card/70 px-3 py-2">
              <span>{ui.header.step2}</span>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card/70 px-3 py-2">
              <span>{ui.header.step3}</span>
              <Download className="h-4 w-4 text-info" />
            </div>
          </div>

          {children ? <div className="mt-4 flex flex-wrap items-center gap-3">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}
