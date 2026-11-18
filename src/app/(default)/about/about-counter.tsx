'use client';

/**
 * Client island for the About page stats. Renders the authoritative metric
 * directly so SSR, hydration, and scroll captures never display partial numbers.
 */
export function AnimatedCounter({ end, suffix = '' }: { end: number; suffix?: string; duration?: number }) {
  return <div>{end}{suffix}</div>;
}
