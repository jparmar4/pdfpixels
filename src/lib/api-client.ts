'use client';

let pendingSessionRefresh: Promise<boolean> | null = null;

function hasSessionReadyCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((entry) => entry.trim().startsWith('pp_api_ready='));
}

/**
 * Ensures the browser holds a fresh signed same-origin session cookie before
 * uploading files or submitting heavy processing requests.
 */
export async function ensureApiSession(forceRefresh = false): Promise<boolean> {
  if (!forceRefresh && hasSessionReadyCookie()) {
    return true;
  }
  if (!pendingSessionRefresh) {
    pendingSessionRefresh = fetch('/api/session', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        pendingSessionRefresh = null;
      });
  }
  return pendingSessionRefresh;
}

/**
 * Wrapper around `fetch` for same-origin API requests that automatically ensures
 * the signed session cookie and retries once if a cached page needed a refresh.
 */
export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  await ensureApiSession(false);

  const requestInit: RequestInit = {
    ...init,
    credentials: 'same-origin',
  };

  const response = await fetch(input, requestInit);
  if (
    response.status === 403 &&
    response.headers.get('X-PdfPixels-Auth') === 'session-required'
  ) {
    const refreshed = await ensureApiSession(true);
    if (refreshed) {
      return fetch(input, requestInit);
    }
  }
  return response;
}
