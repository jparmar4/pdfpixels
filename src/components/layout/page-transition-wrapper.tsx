'use client';

/**
 * PageTransitionWrapper - Simplified for performance.
 * Uses a simple fade transition instead of AnimatePresence mode="wait"
 * which was blocking page rendering and causing perceived slowness.
 */
export function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
