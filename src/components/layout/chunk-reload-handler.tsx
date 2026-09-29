'use client';

import { useEffect } from 'react';
import { hardReloadOnceForChunk, isChunkLoadError } from '@/lib/chunk-recovery';

/**
 * Global safety net for stale-deploy chunk failures.
 *
 * When a new production build ships, browsers holding the previous HTML shell
 * may request webpack chunks that no longer exist (404). Next.js surfaces that
 * as "Loading chunk N failed", which would otherwise land in a route error
 * boundary ("Tool temporarily unavailable"). This listener hard-reloads once
 * with a cache-buster so the browser fetches fresh HTML + manifest instead.
 */
export function ChunkReloadHandler() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (isChunkLoadError(event.error ?? event.message)) {
        hardReloadOnceForChunk();
      }
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadError(event.reason)) {
        hardReloadOnceForChunk();
      }
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
