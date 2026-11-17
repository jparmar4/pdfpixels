import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import {
  API_AUTH_REASON_HEADER,
  API_READY_COOKIE,
  API_TOKEN_COOKIE,
  API_TOKEN_HEADER,
  API_TOKEN_REFRESH_THRESHOLD_MS,
  attachApiSessionCookies,
  getRequestHost,
  isHeavyProcessingApiPath,
  shouldIssueSessionCookieForPage,
  verifySameOriginRequest,
  verifySignedApiToken,
} from '@/lib/api-auth';

const PROCESSING_API_LIMIT = 20;
const PROCESSING_API_WINDOW_MS = 60_000;

const GLOBAL_API_LIMIT = 100;
const GLOBAL_API_WINDOW_MS = 60_000;

function prefersMarkdown(acceptHeader: string | null): boolean {
  if (!acceptHeader) return false;
  const lower = acceptHeader.toLowerCase();
  if (!lower.includes('text/markdown') && !lower.includes('text/x-markdown')) {
    return false;
  }

  const parts = lower.split(',').map((part, index) => {
    const segments = part.trim().split(';').map((s) => s.trim());
    const type = segments[0];
    let q = 1.0;
    for (let i = 1; i < segments.length; i++) {
      if (segments[i].startsWith('q=')) {
        const parsed = parseFloat(segments[i].slice(2));
        if (!Number.isNaN(parsed)) q = parsed;
      }
    }
    return { type, q, index };
  });

  const mdPart = parts.find(
    (p) => p.type === 'text/markdown' || p.type === 'text/x-markdown'
  );
  if (!mdPart || mdPart.q <= 0) return false;

  const htmlPart = parts.find(
    (p) => p.type === 'text/html' || p.type === 'application/xhtml+xml'
  );
  if (!htmlPart) return true;

  if (mdPart.q > htmlPart.q) return true;
  if (mdPart.q === htmlPart.q && mdPart.index < htmlPart.index) return true;

  return false;
}

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requestHost = getRequestHost(request);

  // Same-origin session bootstrap / refresh for web UI requests
  if (pathname === '/api/session' && (request.method === 'GET' || request.method === 'HEAD')) {
    if (!verifySameOriginRequest(request)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: same-origin web request required.', code: 'ORIGIN_MISMATCH' },
        { status: 403, headers: { 'Cache-Control': 'no-store, max-age=0', [API_AUTH_REASON_HEADER]: 'origin-mismatch' } }
      );
    }

    const response = NextResponse.json(
      { ok: true },
      { headers: { 'Cache-Control': 'no-store, private, max-age=0' } }
    );
    attachApiSessionCookies(response, request, requestHost);
    return response;
  }

  // Content negotiation: Serve Markdown when an agent requests Accept: text/markdown
  if (request.method === 'GET' || request.method === 'HEAD') {
    if (
      !pathname.startsWith('/api/') &&
      !pathname.startsWith('/_next/') &&
      !pathname.startsWith('/.well-known/') &&
      pathname !== '/markdown' &&
      !pathname.endsWith('/markdown') &&
      !/\.[a-z0-9]+$/i.test(pathname) &&
      prefersMarkdown(request.headers.get('accept'))
    ) {
      const url = request.nextUrl.clone();

      const toolMatch = pathname.match(/^\/tools\/([^/]+)$/);
      const blogMatch = pathname.match(/^\/blog\/([^/]+)$/);

      if (toolMatch && toolMatch[1] !== 'category') {
        url.pathname = `/tools/${toolMatch[1]}/markdown`;
      } else if (blogMatch) {
        url.pathname = `/blog/${blogMatch[1]}/markdown`;
      } else {
        url.pathname = '/markdown';
        url.searchParams.set('path', pathname);
      }

      const response = NextResponse.rewrite(url);
      response.headers.set('Vary', 'Accept');
      response.headers.set('Content-Signal', 'search=yes, ai-input=yes, ai-train=no');
      return response;
    }

    const response = NextResponse.next();
    if (shouldIssueSessionCookieForPage(pathname)) {
      const existingToken = request.cookies.get(API_TOKEN_COOKIE)?.value;
      const hasReadyHint = Boolean(request.cookies.get(API_READY_COOKIE)?.value);
      const tokenValid = verifySignedApiToken(
        existingToken,
        requestHost,
        API_TOKEN_REFRESH_THRESHOLD_MS
      );
      if (!tokenValid || !hasReadyHint) {
        attachApiSessionCookies(response, request, requestHost);
      }
    }
    return response;
  }

  if (request.method === 'OPTIONS') {
    return NextResponse.next();
  }

  // Only protect and rate limit /api routes for POST/PUT/DELETE
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const isHeavyProcessingRoute = isHeavyProcessingApiPath(pathname);
  if (isHeavyProcessingRoute) {
    if (!verifySameOriginRequest(request)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: cross-origin or direct API requests without web context are not allowed.',
          code: 'API_ORIGIN_FORBIDDEN',
        },
        {
          status: 403,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            [API_AUTH_REASON_HEADER]: 'origin-mismatch',
          },
        }
      );
    }

    const token =
      request.cookies.get(API_TOKEN_COOKIE)?.value ||
      request.headers.get(API_TOKEN_HEADER);
    if (!verifySignedApiToken(token, requestHost)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: valid same-origin web session token required.',
          code: 'API_SESSION_REQUIRED',
        },
        {
          status: 403,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            [API_AUTH_REASON_HEADER]: 'session-required',
          },
        }
      );
    }
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const routeKey = pathname.replace(/^\/api\//, '');
  const isProcessingRoute =
    routeKey.startsWith('pdf/') ||
    routeKey.startsWith('image/') ||
    routeKey.startsWith('ai');

  const limit = isProcessingRoute ? PROCESSING_API_LIMIT : GLOBAL_API_LIMIT;
  const windowMs = isProcessingRoute ? PROCESSING_API_WINDOW_MS : GLOBAL_API_WINDOW_MS;
  const bucketKey = isProcessingRoute ? `processing:${routeKey}:${ip}` : `global:${ip}`;

  const { allowed, remaining, resetIn } = rateLimit(bucketKey, limit, windowMs);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.', remaining, resetIn },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(resetIn / 1000)),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(limit));
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|json|webmanifest|woff2?)$).*)',
  ],
};
