'use client';

const RELOAD_KEY = 'pdfpixels-chunk-reload-ts';
const RELOAD_COOLDOWN_MS = 10_000;

/**
 * True when an error looks like a Next.js code-split chunk failure.
 * These happen when the browser holds stale HTML referencing chunks that no
 * longer exist after a new deployment, or on a flaky network / CDN hiccup.
 */
export function isChunkLoadError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : typeof error === 'string'
        ? error
        : '';
  if (!message) return false;
  return (
    message.includes('Loading chunk') ||
    message.includes('Loading CSS chunk') ||
    message.includes('ChunkLoadError') ||
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('error loading dynamically imported module')
  );
}

function lastReloadAt(): number {
  try {
    return Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
  } catch {
    return 0;
  }
}

function markReloaded() {
  try {
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // storage unavailable (private mode) — still allow the reload attempt
  }
}

/**
 * Hard-reload once to pick up the freshly deployed HTML + chunk manifest.
 * Guarded by a cooldown so a genuinely missing asset can't infinite-loop.
 * Returns true when a reload was triggered.
 */
export function hardReloadOnceForChunk(): boolean {
  if (typeof window === 'undefined') return false;
  if (Date.now() - lastReloadAt() < RELOAD_COOLDOWN_MS) return false;
  markReloaded();
  // Cache-bust so CDN / browser don't re-serve the same stale HTML shell.
  const url = new URL(window.location.href);
  url.searchParams.set('_r', String(Date.now()));
  window.location.replace(url.toString());
  return true;
}
