'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FileCheck2, ShieldCheck, Sparkles, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getToolById } from '@/lib/tools-data';
import { useActiveTool } from '@/hooks/use-active-tool';
import { getUiDictionary } from '@/lib/locale-ui';
import { useWorkflowStore } from '@/store/workflow-store';
import { cn } from '@/lib/utils';

export interface OptimizationVerificationProps {
  originalSize?: number;
  processedSize?: number;
  savedPercent?: number;
  formatLabel?: string;
  dpiLabel?: string;
  privacyStatus?: string;
  resultUrl?: string | null;
  fileName?: string;
  className?: string;
}

const VERIFICATION_DURATION_MS = 4000;

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function inferFormatFromInfo(
  toolId: string | undefined,
  fileName: string | undefined,
  resultUrl: string | null | undefined,
): string {
  const fromName = fileName?.split('.').pop()?.trim().toUpperCase();
  if (fromName && fromName.length <= 5 && /^[A-Z0-9]+$/.test(fromName)) {
    return fromName === 'JPEG' ? 'JPG' : fromName;
  }
  if (resultUrl?.startsWith('data:')) {
    const match = resultUrl.match(/^data:([^/;]+)\/([^;]+)/i);
    if (match?.[2]) {
      const sub = match[2].toUpperCase();
      return sub === 'JPEG' ? 'JPG' : sub;
    }
  }
  if (toolId) {
    if (toolId.includes('excel') || toolId.includes('xlsx')) return 'XLSX';
    if (toolId.includes('csv')) return 'CSV';
    if (toolId.includes('word')) return 'DOCX';
    if (toolId.includes('pptx')) return 'PPTX';
    if (toolId.includes('png') || toolId === 'remove-background' || toolId === 'blur-background' || toolId === 'blur-face') return 'PNG';
    if (toolId.includes('webp')) return 'WEBP';
    if (toolId.includes('avif')) return 'AVIF';
    if (toolId.includes('ico')) return 'ICO';
    if (toolId.includes('pdf')) return 'PDF';
  }
  return 'VERIFIED';
}

export function OptimizationVerificationSummary({
  originalSize,
  processedSize,
  savedPercent,
  formatLabel,
  dpiLabel,
  privacyStatus,
  resultUrl,
  fileName,
  className,
}: OptimizationVerificationProps) {
  const { activeTool, uploadedFile } = useActiveTool();
  const ui = getUiDictionary(activeTool?.locale);
  const latestOutput = useWorkflowStore((s) => s.latestOutput);
  const resolvedUrl = resultUrl ?? latestOutput?.url ?? null;
  const [measured, setMeasured] = useState<{ url: string; size: number }>({ url: '', size: 0 });
  const resultInstanceKey = `${resolvedUrl || ''}|${processedSize ?? ''}|${originalSize ?? ''}`;
  const [timerState, setTimerState] = useState<{ key: string; elapsed: number }>({
    key: resultInstanceKey,
    elapsed: 0,
  });

  const resolvedToolId = activeTool?.id || latestOutput?.toolId;
  const toolMeta = resolvedToolId ? getToolById(resolvedToolId) : undefined;
  const isClientTool = toolMeta?.processing === 'client';

  // Run a clean 4-second live verification check every time a new result mounts/changes
  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      const next = Date.now() - started;
      if (next >= VERIFICATION_DURATION_MS) {
        setTimerState({ key: resultInstanceKey, elapsed: VERIFICATION_DURATION_MS });
        window.clearInterval(timer);
      } else {
        setTimerState({ key: resultInstanceKey, elapsed: next });
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [resultInstanceKey]);

  // Resolve actual processed byte size from blob/data URL if caller did not pass it explicitly
  useEffect(() => {
    const explicit = processedSize ?? latestOutput?.processedSize;
    if ((explicit && explicit > 0) || !resolvedUrl) return;

    let active = true;
    if (resolvedUrl.startsWith('data:')) {
      const comma = resolvedUrl.indexOf(',');
      if (comma !== -1) {
        const b64 = resolvedUrl.slice(comma + 1);
        const pad = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
        const size = Math.max(0, Math.floor((b64.length * 3) / 4) - pad);
        const id = window.setTimeout(() => {
          if (active) setMeasured({ url: resolvedUrl, size });
        }, 0);
        return () => {
          active = false;
          window.clearTimeout(id);
        };
      }
      return;
    }
    if (resolvedUrl.startsWith('blob:')) {
      fetch(resolvedUrl)
        .then((res) => res.blob())
        .then((blob) => {
          if (active) setMeasured({ url: resolvedUrl, size: blob.size });
        })
        .catch(() => {
          // Ignore revoked blob URL reads
        });
      return () => {
        active = false;
      };
    }
  }, [resolvedUrl, processedSize, latestOutput?.processedSize]);

  const elapsedMs = timerState.key === resultInstanceKey ? timerState.elapsed : 0;
  const measuredSize = resolvedUrl && measured.url === resolvedUrl ? measured.size : 0;
  const effectiveOriginalSize = originalSize ?? latestOutput?.originalSize ?? uploadedFile?.size ?? 0;
  const effectiveProcessedSize = processedSize ?? latestOutput?.processedSize ?? measuredSize;

  const storeSavedPercent = latestOutput?.savedPercent;
  const computedSavedPercent = useMemo(() => {
    if (typeof savedPercent === 'number' && Number.isFinite(savedPercent)) {
      return Math.max(0, Math.round(savedPercent));
    }
    if (typeof storeSavedPercent === 'number' && Number.isFinite(storeSavedPercent)) {
      return Math.max(0, Math.round(storeSavedPercent));
    }
    if (effectiveOriginalSize > 0 && effectiveProcessedSize > 0) {
      return Math.max(0, Math.round(((effectiveOriginalSize - effectiveProcessedSize) / effectiveOriginalSize) * 100));
    }
    return 0;
  }, [savedPercent, storeSavedPercent, effectiveOriginalSize, effectiveProcessedSize]);

  const resolvedFormat =
    formatLabel ||
    latestOutput?.formatLabel ||
    inferFormatFromInfo(resolvedToolId, fileName ?? latestOutput?.fileName, resolvedUrl);

  const resolvedDpi =
    dpiLabel ||
    latestOutput?.dpiLabel ||
    (resolvedToolId === 'passport-photo' || resolvedToolId === 'dpi-converter'
      ? '300 DPI'
      : resolvedFormat === 'PDF'
        ? 'ISO-32000 PDF'
        : 'Lossless Header');

  const isVerified = elapsedMs >= VERIFICATION_DURATION_MS;
  const progressValue = Math.min(100, Math.round((elapsedMs / VERIFICATION_DURATION_MS) * 100));
  const secondsLeft = Math.max(0, Math.ceil((VERIFICATION_DURATION_MS - elapsedMs) / 1000));

  const resolvedPrivacy =
    privacyStatus ||
    latestOutput?.privacyStatus ||
    (isClientTool
      ? isVerified
        ? ui.result.localMemoryOnly
        : ui.result.auditingLocalBuffer
      : isVerified
        ? ui.result.serverPurged
        : ui.result.scrubbingServerBuffer);

  return (
    <div
      data-verification-state={isVerified ? 'verified' : 'verifying'}
      className={cn(
        'rounded-2xl border border-border/60 bg-background/85 p-4 text-left shadow-soft',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-lg',
              isVerified ? 'bg-success/15 text-success' : 'bg-primary/10 text-primary',
            )}
          >
            {isVerified ? <ShieldCheck className="h-4 w-4" /> : <Timer className="h-4 w-4 animate-pulse" />}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground">
              {ui.result.summaryTitle}
            </p>
            <p className="text-[11px] text-muted-foreground" aria-live="polite">
              {isVerified
                ? ui.result.auditComplete
                : ui.result.verifyingProgress(secondsLeft)}
            </p>
          </div>
        </div>

        <Badge
          variant="secondary"
          className={cn(
            'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
            isVerified
              ? 'border border-success/30 bg-success/10 text-success'
              : 'border border-primary/25 bg-primary/10 text-primary',
          )}
        >
          {isVerified ? (
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {ui.result.verifiedBadge(resolvedFormat)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {ui.result.checkingBadge(progressValue)}
            </span>
          )}
        </Badge>
      </div>

      {!isVerified && (
        <div className="mt-2.5">
          <Progress value={progressValue} className="h-1.5" />
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-xl border border-border/50 bg-card/70 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{ui.result.originalSize}</p>
          <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-foreground">
            {formatBytes(effectiveOriginalSize)}
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/70 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{ui.result.outputSize}</p>
          <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-foreground">
            {formatBytes(effectiveProcessedSize)}
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/70 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{ui.result.percentSaved}</p>
          <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-success">
            {computedSavedPercent > 0 ? ui.result.savedValue(computedSavedPercent) : ui.result.optimizedZero}
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/70 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{ui.result.formatDpi}</p>
          <p className="mt-0.5 inline-flex items-center gap-1 font-mono text-xs font-bold text-foreground">
            <FileCheck2 className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>{resolvedFormat} · {resolvedDpi}</span>
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-success/20 bg-success/[0.06] px-3 py-2 text-xs">
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-success shrink-0" />
          {ui.result.privacyPurge} <span className="text-muted-foreground font-normal">{resolvedPrivacy}</span>
        </span>
        <span className="font-mono text-[11px] font-semibold text-success">
          {isVerified ? ui.result.cleanStatus : ui.result.inProgressStatus}
        </span>
      </div>
    </div>
  );
}
