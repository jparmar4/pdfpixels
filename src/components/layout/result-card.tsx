'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Download, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { normalizeDisplayText } from '@/lib/display-text';
import { InContentAd, ResultScreenAd, SmartlinkButton } from '@/components/ads/ad-banner';
import { triggerDownloadWithSmartlink } from '@/lib/ads-config';
import { OptimizationVerificationSummary } from './optimization-verification-summary';
import { WorkflowChainBar } from './workflow-chain-bar';
import { useWorkflowStore } from '@/store/workflow-store';

interface NextAction {
  label: string;
  href: string;
}

interface ResultCardProps {
  title: string;
  description: string;
  onDownload: () => void;
  downloadLabel?: string;
  primaryMeta?: string;
  nextActions?: NextAction[];
  originalSize?: number;
  processedSize?: number;
  savedPercent?: number;
  formatLabel?: string;
  dpiLabel?: string;
  privacyStatus?: string;
  resultUrl?: string | null;
  resultFileName?: string;
}

export function ResultCard({
  title,
  description,
  onDownload,
  downloadLabel = 'Download',
  primaryMeta,
  nextActions = [],
  originalSize,
  processedSize,
  savedPercent,
  formatLabel,
  dpiLabel,
  privacyStatus,
  resultUrl,
  resultFileName,
}: ResultCardProps) {
  const latestOutput = useWorkflowStore((s) => s.latestOutput);
  const effectiveUrl = resultUrl ?? latestOutput?.url ?? null;
  const runKey = `${effectiveUrl || ''}|${primaryMeta || ''}|${processedSize ?? ''}`;
  const [downloadedRunKey, setDownloadedRunKey] = useState<string | null>(null);
  const hasDownloaded = downloadedRunKey === runKey;

  const handleDownloadClick = () => {
    setDownloadedRunKey(runKey);
    triggerDownloadWithSmartlink(onDownload, {
      url: effectiveUrl,
      fileName: resultFileName,
      originalSize,
      processedSize,
      savedPercent,
      formatLabel,
      dpiLabel,
      privacyStatus,
    });
  };

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-success/25 bg-success/[0.06] p-6 shadow-premium dark:bg-success/[0.12]">
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-success/50 to-transparent" />

      <div className="relative z-10 space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-success/15 text-success shadow-sm">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-foreground">
                {normalizeDisplayText(title)}
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {normalizeDisplayText(description)}
              </p>
              {primaryMeta ? <p className="text-xs font-medium uppercase tabular-nums tracking-[0.14em] text-muted-foreground">{normalizeDisplayText(primaryMeta)}</p> : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-background/80 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-success" />
              Ready to download
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-info" />
              Securely processed
            </span>
          </div>
        </div>

        {/* Optimization & Verification Summary paired beside the high-CPM 300x250 (ID 31811019) unit */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,1fr)] lg:items-start">
          <OptimizationVerificationSummary
            originalSize={originalSize}
            processedSize={processedSize}
            savedPercent={savedPercent}
            formatLabel={formatLabel}
            dpiLabel={dpiLabel}
            privacyStatus={privacyStatus}
            resultUrl={effectiveUrl}
            fileName={resultFileName}
          />
          <div className="min-w-0">
            <ResultScreenAd suppressSummary suppressChainBar refreshKey={runKey} className="border-t-0 pt-0 mt-0" />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={handleDownloadClick}
            className="btn-premium h-12 flex-1 gap-2 rounded-2xl font-bold"
            size="lg"
          >
            <Download className="h-4 w-4" />
            {normalizeDisplayText(downloadLabel)}
          </Button>
          <SmartlinkButton className="min-h-12" />
          {nextActions.length > 0 ? (
            <div className="flex flex-1 flex-wrap gap-2">
              {nextActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-border/60 bg-background/80 px-4 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-premium active:translate-y-0"
                >
                  {normalizeDisplayText(action.label)}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <InContentAd variant="dual-rectangle" eager instanceId="result-card-dual" className="my-2" />

        <WorkflowChainBar
          visible={hasDownloaded}
          outputOverride={{
            url: effectiveUrl,
            fileName: resultFileName,
            originalSize,
            processedSize,
            savedPercent,
          }}
        />
      </div>
    </div>
  );
}
