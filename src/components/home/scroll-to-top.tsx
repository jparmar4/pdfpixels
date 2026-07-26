'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUp } from 'lucide-react';

const SHOW_AFTER_PX = 280;
const NEAR_BOTTOM_PX = 240;

/**
 * Site-wide scroll helpers:
 * 1. Always open new routes at the top (unless a hash target is present)
 * 2. Jump-to-top / jump-to-bottom controls on long pages
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(false);

  // Prefer manual control so client navigations don't restore mid-page scroll
  useEffect(() => {
    if (typeof window === 'undefined' || !('scrollRestoration' in window.history)) return;
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  // On every route change, land at the top (skip hash deep-links)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hasHash = Boolean(window.location.hash);
    if (hasHash) {
      // Allow the browser/Next to honor #section anchors
      const id = window.location.hash.slice(1);
      if (id) {
        // Defer until layout is ready
        requestAnimationFrame(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: 'auto', block: 'start' });
        });
      }
      return;
    }

    // Instant jump so tool pages don't flash mid/bottom content
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    // Re-assert after paint (dynamic tool workspaces can shift layout)
    const t1 = window.setTimeout(() => {
      if (!window.location.hash) {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    }, 0);
    const t2 = window.setTimeout(() => {
      if (!window.location.hash && window.scrollY > 8) {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    }, 120);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [pathname]);

  const updateVisibility = useCallback(() => {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const viewport = window.innerHeight;
    const docHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body?.scrollHeight ?? 0,
    );
    const distanceFromBottom = docHeight - (scrollY + viewport);
    const canScroll = docHeight > viewport + 80;

    setShowTop(scrollY > SHOW_AFTER_PX);
    setShowBottom(canScroll && distanceFromBottom > NEAR_BOTTOM_PX);
  }, []);

  useEffect(() => {
    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility, { passive: true });
    // Content height can change after images/tool panels load
    const interval = window.setInterval(updateVisibility, 800);
    return () => {
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
      window.clearInterval(interval);
    };
  }, [pathname, updateVisibility]);

  const jumpTop = useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, []);

  const jumpBottom = useCallback(() => {
    const docHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body?.scrollHeight ?? 0,
    );
    window.scrollTo({ top: docHeight, left: 0, behavior: 'smooth' });
  }, []);

  const showAny = showTop || showBottom;

  return (
    <AnimatePresence>
      {showAny ? (
        <motion.div
          key="scroll-jump-nav"
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-5 right-4 z-40 flex flex-col gap-2 sm:bottom-6 sm:right-6"
          role="navigation"
          aria-label="Page scroll jump controls"
        >
          <AnimatePresence initial={false}>
            {showTop ? (
              <motion.button
                key="jump-top"
                type="button"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={jumpTop}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-card/95 text-foreground shadow-lg backdrop-blur-md transition-colors hover:border-primary/40 hover:text-primary sm:h-12 sm:w-12"
                aria-label="Jump to top of page"
                title="Jump to top"
              >
                <ArrowUp className="h-5 w-5" />
              </motion.button>
            ) : null}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {showBottom ? (
              <motion.button
                key="jump-bottom"
                type="button"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={jumpBottom}
                className="btn-premium flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg sm:h-12 sm:w-12"
                aria-label="Jump to bottom of page"
                title="Jump to bottom"
              >
                <ArrowDown className="h-5 w-5 relative z-10" />
              </motion.button>
            ) : null}
          </AnimatePresence>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/** Alias for clearer imports */
export const ScrollJumpNav = ScrollToTop;
