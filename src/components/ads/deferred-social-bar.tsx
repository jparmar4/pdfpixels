'use client';

import { useEffect } from 'react';
import { adsterraConfig } from '@/lib/ads-config';
import { useWorkflowStore } from '@/store/workflow-store';

/**
 * Loads the high-CPM Adsterra Social Bar (Unit ID 31836252) after initial paint
 * so Core Web Vitals (LCP/FCP/CLS) stay clean while monetizing engaged sessions
 * across all routes (tools, workflows, blog guides, comparisons, use-cases, and hubs):
 *  - Injects immediately once a download occurs (`hasDownloadedOnce`), OR
 *  - On first user interaction (`pointerdown`, `scroll`, `keydown`) after 1.2s, OR
 *  - Automatically after 3.5s on active pages.
 */
export function DeferredSocialBar() {
  const hasDownloadedOnce = useWorkflowStore((s) => s.hasDownloadedOnce);
  const hydrateFromSession = useWorkflowStore((s) => s.hydrateFromSession);

  useEffect(() => {
    hydrateFromSession();
  }, [hydrateFromSession]);

  useEffect(() => {
    if (!adsterraConfig.enabled || !adsterraConfig.slots.socialBar.scriptSrc) return;

    const injectSocialBar = () => {
      if (document.getElementById('pp-adsterra-social-bar')) return;
      const script = document.createElement('script');
      script.id = 'pp-adsterra-social-bar';
      script.type = 'text/javascript';
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.setAttribute('data-adsterra-unit-id', adsterraConfig.slots.socialBar.unitId);
      script.src = adsterraConfig.slots.socialBar.scriptSrc;
      document.body.appendChild(script);
    };

    if (hasDownloadedOnce) {
      injectSocialBar();
      return;
    }

    const mountTime = Date.now();
    let interactionTimer: number | null = null;

    const onUserEngage = () => {
      cleanupListeners();
      const elapsed = Date.now() - mountTime;
      const delay = Math.max(0, 1200 - elapsed);
      interactionTimer = window.setTimeout(injectSocialBar, delay);
    };

    const cleanupListeners = () => {
      window.removeEventListener('pointerdown', onUserEngage);
      window.removeEventListener('scroll', onUserEngage);
      window.removeEventListener('keydown', onUserEngage);
    };

    window.addEventListener('pointerdown', onUserEngage, { passive: true, once: true });
    window.addEventListener('scroll', onUserEngage, { passive: true, once: true });
    window.addEventListener('keydown', onUserEngage, { passive: true, once: true });

    const fallbackTimer = window.setTimeout(() => {
      cleanupListeners();
      injectSocialBar();
    }, 3500);

    return () => {
      cleanupListeners();
      window.clearTimeout(fallbackTimer);
      if (interactionTimer !== null) window.clearTimeout(interactionTimer);
    };
  }, [hasDownloadedOnce]);

  return null;
}
