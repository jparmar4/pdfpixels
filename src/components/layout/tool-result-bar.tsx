'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdsterraNativeBanner, ResultScreenAd, SmartlinkButton } from '@/components/ads/ad-banner';
import { adsterraConfig, recordDownloadSuccess, triggerDownloadWithSmartlink, triggerSmartlinkOncePerSession } from '@/lib/ads-config';
import { OptimizationVerificationSummary } from './optimization-verification-summary';
import { WorkflowChainBar } from './workflow-chain-bar';
import { useActiveTool } from '@/hooks/use-active-tool';
import { getUiDictionary } from '@/lib/locale-ui';

export function ToolResultBar({
  error,
  downloadUrl,
  downloadName,
  summary,
  onDownload,
  originalSize,
  processedSize,
}: {
  error?: string | null;
  downloadUrl?: string | null;
  downloadName?: string;
  summary?: string | null;
  onDownload?: () => void;
  originalSize?: number;
  processedSize?: number;
}) {
  const { activeTool } = useActiveTool();
  const ui = getUiDictionary(activeTool?.locale);
  const [downloadedUrl, setDownloadedUrl] = useState<string | null>(null);
  const hasDownloaded = Boolean(downloadUrl && downloadedUrl === downloadUrl);

  if (!error && !downloadUrl && !summary) return null;

  const has300x250 = adsterraConfig.enabled && Boolean(adsterraConfig.slots.banner300x250.key);
  const hasNative = adsterraConfig.enabled && Boolean(adsterraConfig.slots.nativeBanner.scriptSrc);

  return (
    <div className="space-y-3" role="status" aria-live="polite">
      {error ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          {error}
        </p>
      ) : null}
      {summary ? <p className="text-sm font-medium text-foreground">{summary}</p> : null}
      {downloadUrl ? (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,1fr)] lg:items-start">
            <OptimizationVerificationSummary
              resultUrl={downloadUrl}
              fileName={downloadName}
              originalSize={originalSize}
              processedSize={processedSize}
            />
            {has300x250 ? (
              <div className="min-w-0">
                <ResultScreenAd suppressSummary suppressChainBar refreshKey={downloadUrl} className="border-t-0 pt-0 mt-0" />
              </div>
            ) : hasNative ? (
              <div className="min-w-0">
                <AdsterraNativeBanner eager compact className="my-0" />
              </div>
            ) : (
              <div className="min-w-0">
                <ResultScreenAd suppressSummary suppressChainBar refreshKey={downloadUrl} className="border-t-0 pt-0 mt-0" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild className="btn-premium h-11 rounded-xl">
              <a
                href={downloadUrl}
                download={downloadName || true}
                onClick={(event) => {
                  setDownloadedUrl(downloadUrl);
                  const payload = { url: downloadUrl, fileName: downloadName };
                  if (!onDownload) {
                    recordDownloadSuccess(payload);
                    triggerSmartlinkOncePerSession();
                    return;
                  }
                  event.preventDefault();
                  triggerDownloadWithSmartlink(onDownload, payload);
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                {ui.result.download}
              </a>
            </Button>
            <SmartlinkButton />
          </div>

          <WorkflowChainBar
            visible={hasDownloaded}
            outputOverride={{ url: downloadUrl, fileName: downloadName }}
          />
        </div>
      ) : null}
    </div>
  );
}
