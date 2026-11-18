'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hardReloadOnceForChunk, isChunkLoadError } from '@/lib/chunk-recovery';

export default function PdfToolsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('PDF Tools page error:', error);
    if (isChunkLoadError(error)) hardReloadOnceForChunk();
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16 lg:px-8 max-w-4xl" role="alert" aria-live="assertive">
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-destructive/20 bg-destructive/5 space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-xl font-bold text-foreground">PDF suite unavailable</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            An unexpected error occurred while loading the PDF tools suite. Please try reloading or head back to the homepage.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => {
              if (isChunkLoadError(error)) window.location.reload();
              else reset();
            }}
            variant="default"
            className="gap-2 rounded-xl"
          >
            <RefreshCcw className="w-4 h-4" />
            Reload suite
          </Button>
          <Button asChild variant="outline" className="gap-2 rounded-xl">
            <Link href="/">
              <Home className="w-4 h-4" />
              Go home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
