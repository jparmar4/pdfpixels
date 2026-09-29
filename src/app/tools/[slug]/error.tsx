'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCcw, LayoutGrid, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hardReloadOnceForChunk, isChunkLoadError } from '@/lib/chunk-recovery';

export default function ToolSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isStaleChunk] = useState(() => isChunkLoadError(error));

  useEffect(() => {
    console.error('Tool workspace error:', error);
    // Stale-deploy chunk 404s (e.g. "Loading chunk 3602 failed") share one
    // page chunk across ALL /tools/[slug] pages, so they look like a total
    // outage. A single hard reload fetches fresh HTML + manifest and recovers.
    if (isChunkLoadError(error)) {
      hardReloadOnceForChunk();
    }
  }, [error]);

  const handleReload = () => {
    if (isStaleChunk) {
      // reset() would just re-request the same missing hashed chunk file.
      // A full reload gets the new deployment's HTML + chunk manifest.
      window.location.reload();
      return;
    }
    reset();
  };

  return (
    <div className="container mx-auto px-4 py-16 lg:px-8 max-w-4xl" role="alert" aria-live="assertive">
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-destructive/20 bg-destructive/5 space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
          {isStaleChunk ? <Rocket className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-xl font-bold text-foreground">
            {isStaleChunk ? 'A fresh update just shipped' : 'Tool temporarily unavailable'}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isStaleChunk
              ? 'This tool was just updated and your browser loaded an older version. Reload to get the latest workspace — your files never leave your device until you process them.'
              : 'An unexpected error occurred while loading this workspace. You can retry loading or explore our full suite of free tools.'}
          </p>
          {error?.message && !isStaleChunk && !error.message.includes('digest') && (
            <p className="text-xs font-mono bg-background/80 px-3 py-1.5 rounded-lg border border-border/60 text-muted-foreground break-all">
              {error.message}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button onClick={handleReload} variant="default" className="gap-2 rounded-xl">
            <RefreshCcw className="w-4 h-4" />
            Reload tool
          </Button>
          <Button asChild variant="outline" className="gap-2 rounded-xl">
            <Link href="/tools">
              <LayoutGrid className="w-4 h-4" />
              All tools
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
