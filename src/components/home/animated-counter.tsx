'use client';

/**
 * Displays the authoritative metric immediately without counting up from zero,
 * preventing transient partial numbers (e.g. "17+", "1+", "14%") during scroll or capture.
 */
export function AnimatedCounter({ end, suffix = '' }: { end: number; suffix?: string; duration?: number }) {
  return <div>{end}{suffix}</div>;
}
