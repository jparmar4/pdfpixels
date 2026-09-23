'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ToolResultBar({
  error,
  downloadUrl,
  downloadName,
  summary,
  onDownload,
}: {
  error?: string | null;
  downloadUrl?: string | null;
  downloadName?: string;
  summary?: string | null;
  onDownload?: () => void;
}) {
  if (!error && !downloadUrl && !summary) return null;

  return (
    <div className="space-y-3" role="status" aria-live="polite">
      {error ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          {error}
        </p>
      ) : null}
      {summary ? <p className="text-sm font-medium text-foreground">{summary}</p> : null}
      {downloadUrl ? (
        <Button asChild className="btn-premium h-11 rounded-xl">
          <a
            href={downloadUrl}
            download={downloadName || true}
            onClick={(event) => {
              if (!onDownload) return;
              event.preventDefault();
              onDownload();
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </a>
        </Button>
      ) : null}
    </div>
  );
}
