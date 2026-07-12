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

export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    { status, headers: CACHE_HEADERS }
  );
}
