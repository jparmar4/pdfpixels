'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Animation delay in ms once visible. */
  delay?: number;
  /** Force immediate reveal (e.g. above-the-fold). */
  immediate?: boolean;
};

/**
 * Scroll reveal built on IntersectionObserver + the `.reveal` CSS animation.
 * Falls back to visible after 1.2s so content is never stuck invisible.
 */
export function Reveal({ children, className, delay = 0, immediate = false }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      immediate ||
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      el.classList.add('in-view');
      return;
    }

    const show = () => {
      el.style.animationDelay = `${delay}ms`;
      el.classList.add('in-view');
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          show();
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -32px 0px' }
    );

    observer.observe(el);
    const fallback = window.setTimeout(show, 1200);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, [delay, immediate]);

  return (
    <div ref={ref} className={cn('reveal', className)}>
      {children}
    </div>
  );
}
