'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  wrapperClassName?: string;
  /** Maximum tilt in degrees. */
  max?: number;
  /** Hover scale factor (1 = no scale). */
  scale?: number;
};

/**
 * Lightweight 3D tilt wrapper.
 * - Writes transforms directly to the DOM node (no re-renders).
 * - Publishes --mx/--my so children (.tool-card, .tilt-glow) can track the pointer.
 * - Disabled on touch devices and prefers-reduced-motion.
 */
export function TiltCard({
  children,
  className,
  wrapperClassName,
  max = 7,
  scale = 1.015,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const enabledRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    enabledRef.current = fine && !reduced;
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const handleMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!enabledRef.current) return;
      const el = cardRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        const rotateY = (px - 0.5) * max * 2;
        const rotateX = (0.5 - py) * max * 2;
        el.style.setProperty('--mx', `${px * 100}%`);
        el.style.setProperty('--my', `${py * 100}%`);
        el.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(${scale})`;
        el.classList.add('is-tilting');
      });
    },
    [max, scale]
  );

  const handleLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    el.classList.remove('is-tilting');
    el.style.transform = '';
    el.style.setProperty('--mx', '50%');
    el.style.setProperty('--my', '0%');
  }, []);

  return (
    <div className={cn('tilt-wrap h-full', wrapperClassName)}>
      <div
        ref={cardRef}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        className={cn('tilt-card relative h-full', className)}
      >
        {children}
      </div>
    </div>
  );
}
