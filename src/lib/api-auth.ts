import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';

export const API_TOKEN_COOKIE = 'pp_api_token';
export const API_READY_COOKIE = 'pp_api_ready';
export const API_TOKEN_HEADER = 'x-pdfpixels-token';
export const API_AUTH_REASON_HEADER = 'X-PdfPixels-Auth';

export const API_TOKEN_TTL_MS = 6 * 60 * 60 * 1000;
export const API_TOKEN_REFRESH_THRESHOLD_MS = 3 * 60 * 60 * 1000;

declare global {
  var __pdfpixelsApiSigningKey: Buffer | undefined;
  var __pdfpixelsApiSecretWarned: boolean | undefined;
}

function getSigningKey(): Buffer {
  const configured = process.env.API_SIGNING_SECRET?.trim();
  if (configured) {
    return createHash('sha256').update(configured).digest();
  }
  if (process.env.NODE_ENV === 'production' && !globalThis.__pdfpixelsApiSecretWarned) {
    globalThis.__pdfpixelsApiSecretWarned = true;
    console.warn('[api-auth] API_SIGNING_SECRET is not configured; falling back to ephemeral per-process key.');
  }
  if (!globalThis.__pdfpixelsApiSigningKey) {
    globalThis.__pdfpixelsApiSigningKey = randomBytes(32);
  }
  return globalThis.__pdfpixelsApiSigningKey;
}

function normalizeHost(rawHost: string): string {
  return rawHost.trim().toLowerCase().replace(/:(80|443)$/, '');
}

function parseUrlHost(rawUrl: string | null): string | null {
  if (!rawUrl || rawUrl === 'null') return null;
  try {
    return normalizeHost(new URL(rawUrl).host);
  } catch {
    return null;
  }
}

export function getRequestHost(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const raw = forwarded || request.headers.get('host') || request.nextUrl.host || '';
  return normalizeHost(raw);
}

export function isHttpsRequest(request: NextRequest): boolean {
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase();
  if (forwardedProto) return forwardedProto === 'https';
  return request.nextUrl.protocol === 'https:';
}

export function createSignedApiToken(host: string, now = Date.now()): string {
  const normalizedHost = normalizeHost(host);
  const exp = now + API_TOKEN_TTL_MS;
  const nonce = randomBytes(12).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ exp, host: normalizedHost, nonce }), 'utf8').toString('base64url');
  const sig = createHmac('sha256', getSigningKey()).update(`v1.${payload}`).digest('base64url');
  return `v1.${payload}.${sig}`;
}

export function verifySignedApiToken(
  token: string | undefined | null,
  expectedHost: string,
  minRemainingMs = 0,
  now = Date.now(),
): boolean {
  if (!token || !expectedHost) return false;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return false;

  const [, payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return false;

  const expectedSig = createHmac('sha256', getSigningKey()).update(`v1.${payloadB64}`).digest();
  let providedSig: Buffer;
  try {
    providedSig = Buffer.from(sigB64, 'base64url');
  } catch {
    return false;
  }

  if (providedSig.length !== expectedSig.length || !timingSafeEqual(providedSig, expectedSig)) {
    return false;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
      exp?: number;
      host?: string;
    };
    if (typeof parsed.exp !== 'number' || typeof parsed.host !== 'string') {
      return false;
    }
    if (parsed.host !== normalizeHost(expectedHost)) {
      return false;
    }
    return parsed.exp - now > minRemainingMs;
  } catch {
    return false;
  }
}

/**
 * Verifies browser same-origin signals (`Sec-Fetch-Site`, `Origin`, `Referer`)
 * against the active request host to stop cross-origin requests and headerless bots.
 */
export function verifySameOriginRequest(request: NextRequest): boolean {
  const expectedHost = getRequestHost(request);
  if (!expectedHost) return false;

  const fetchSite = request.headers.get('sec-fetch-site')?.trim().toLowerCase();
  if (fetchSite && fetchSite !== 'same-origin') {
    return false;
  }

  const originHeader = request.headers.get('origin');
  const refererHeader = request.headers.get('referer');

  if (!originHeader && !refererHeader) {
    return false;
  }

  if (originHeader) {
    const originHost = parseUrlHost(originHeader);
    if (!originHost || originHost !== expectedHost) {
      return false;
    }
  }

  if (refererHeader) {
    const refererHost = parseUrlHost(refererHeader);
    if (!refererHost || refererHost !== expectedHost) {
      return false;
    }
  }

  return true;
}

export function isHeavyProcessingApiPath(pathname: string): boolean {
  return (
    pathname.startsWith('/api/pdf/') ||
    pathname.startsWith('/api/image/') ||
    pathname === '/api/ai' ||
    pathname.startsWith('/api/ai/')
  );
}

export function shouldIssueSessionCookieForPage(pathname: string): boolean {
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/.well-known/') ||
    pathname === '/markdown' ||
    pathname.endsWith('/markdown') ||
    pathname === '/llms.txt' ||
    pathname === '/llms-full.txt' ||
    pathname === '/feed'
  ) {
    return false;
  }
  return !/\.[a-z0-9]+$/i.test(pathname);
}

export function attachApiSessionCookies(
  response: NextResponse,
  request: NextRequest,
  host: string,
): void {
  const token = createSignedApiToken(host);
  const secure = isHttpsRequest(request);
  const maxAge = Math.floor(API_TOKEN_TTL_MS / 1000);

  response.cookies.set(API_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge,
    secure,
  });

  // Non-sensitive companion hint so client helpers know whether CDN HTML stripped cookies.
  response.cookies.set(API_READY_COOKIE, '1', {
    httpOnly: false,
    sameSite: 'strict',
    path: '/',
    maxAge: Math.floor((API_TOKEN_TTL_MS - 30 * 60 * 1000) / 1000),
    secure,
  });
}
