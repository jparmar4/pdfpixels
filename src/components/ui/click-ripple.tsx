'use client';

import { useEffect } from 'react';

const SELECTOR =
  'button, a, [role="button"], label, .btn-premium, .tool-card, .press, .icon-btn-premium';

const MAX_RIPPLES = 6;

/**
 * Global click "bloom": appends a soft radial ripple inside the clicked
 * interactive element, clipped by its bounds (cards/buttons with overflow
 * hidden get a classic material-style ripple).
 * Skipped on touch devices and prefers-reduced-motion.
 */
export function ClickRipple() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;

      const target = (event.target as Element | null)?.closest?.(SELECTOR);
      if (!(target instanceof HTMLElement)) return;

      const style = window.getComputedStyle(target);
      if (style.display === 'inline' || style.position === 'fixed') return;

      const rect = target.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Guard against ripple accumulation on held-down buttons.
      const existing = target.querySelectorAll(':scope > .click-ripple');
      if (existing.length >= 2) existing[0].remove();

      if (style.position === 'static') target.style.position = 'relative';

      const span = document.createElement('span');
      span.className = 'click-ripple';
      span.setAttribute('aria-hidden', 'true');
      span.style.left = `${event.clientX - rect.left}px`;
      span.style.top = `${event.clientY - rect.top}px`;
      target.appendChild(span);

      span.addEventListener('animationend', () => span.remove(), { once: true });
      window.setTimeout(() => span.remove(), 900);

      if (document.querySelectorAll('.click-ripple').length > MAX_RIPPLES) {
        document.querySelector('.click-ripple')?.remove();
      }
    };

    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, []);

  return null;
}
