'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hardReloadOnceForChunk, isChunkLoadError } from '@/lib/chunk-recovery';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isStaleChunk = isChunkLoadError(error);

  useEffect(() => {
    console.error('Application error:', error);
    // Stale-deploy chunk 404s hit every route sharing a page chunk (blog,
    // compare, use-cases, geo hubs, localized tools). One hard reload pulls
    // fresh HTML + manifest instead of looping on the missing hashed file.
    if (isChunkLoadError(error)) {
      hardReloadOnceForChunk();
    }
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center" role="alert" aria-live="assertive">
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
        {isStaleChunk ? <Rocket className="w-8 h-8 text-destructive" /> : <AlertTriangle className="w-8 h-8 text-destructive" />}
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">
        {isStaleChunk ? 'A fresh update just shipped' : 'Something went wrong'}
      </h2>
      <p className="text-muted-foreground max-w-md mb-8">
        {isStaleChunk
          ? 'Your browser loaded an older version of this page. Reload once to get the latest version.'
          : 'An unexpected error occurred. Please try again or go back to the homepage.'}
        {error?.digest && !isStaleChunk && (
          <span className="block mt-2 text-xs opacity-50 font-mono">
            Error ID: {error.digest}
          </span>
        )}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={() => {
            if (isChunkLoadError(error)) window.location.reload();
            else reset();
          }}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </Button>
        <Button asChild className="gap-2">
          <Link href="/">
            <Home className="w-4 h-4" />
            Go home
          </Link>
        </Button>
      </div>
    </div>
  );
}
