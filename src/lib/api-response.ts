import { NextResponse } from 'next/server';

const CACHE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
};

export function apiError(message: string, status: number = 400, code: string = 'BAD_REQUEST') {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
    },
    { status, headers: CACHE_HEADERS }
  );
}

function isTimeoutMessage(message: string): boolean {
  return /timed out|timed-out|timeout|aborted|abort/i.test(message);
}

function isTooLargeMessage(message: string): boolean {
  return /too large|too many|exceeds|limit/i.test(message);
}

/**
 * Terminal catch-all for API route handlers. Logs the raw error server-side
 * but NEVER echoes engine internals (Ghostscript stderr, temp paths, stack
 * fragments) to clients. Timeouts surface as 408 with a safe message;
 * everything else is a generic 500.
 */
export function apiInternalError(
  error: unknown,
  fallbackMessage: string,
  logLabel = 'API error',
  code = 'INTERNAL_ERROR',
) {
  console.error(logLabel, error);
  const message = error instanceof Error ? error.message : '';
  if (message && isTimeoutMessage(message)) {
    return apiError('The operation timed out. Please try a smaller file.', 408, 'TIMEOUT');
  }
  if (message && isTooLargeMessage(message)) {
    return apiError('The file is too large to process.', 413, 'TOO_LARGE');
  }
  return apiError(fallbackMessage, 500, code);
}
