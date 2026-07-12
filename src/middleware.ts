import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

const PROCESSING_API_LIMIT = 20;
const PROCESSING_API_WINDOW_MS = 60_000;

const GLOBAL_API_LIMIT = 100;
const GLOBAL_API_WINDOW_MS = 60_000;

export function middleware(request: NextRequest) {
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
    return NextResponse.next();
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
    
  const pathname = request.nextUrl.pathname;
  
  // Only rate limit /api routes for POST/PUT/DELETE
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  const routeKey = pathname.replace(/^\/api\//, '');
  const isProcessingRoute = routeKey.startsWith('pdf/') || routeKey.startsWith('image/') || routeKey.startsWith('ai');
  
  const limit = isProcessingRoute ? PROCESSING_API_LIMIT : GLOBAL_API_LIMIT;
  const windowMs = isProcessingRoute ? PROCESSING_API_WINDOW_MS : GLOBAL_API_WINDOW_MS;
  const bucketKey = isProcessingRoute ? `processing:${routeKey}:${ip}` : `global:${ip}`;
  
  const { allowed, remaining, resetIn } = rateLimit(
    bucketKey,
    limit,
    windowMs,
  );

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.', remaining, resetIn },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(resetIn / 1000)),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      },
    );
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(limit));
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
