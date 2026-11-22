'use client';

import { useEffect, useState } from 'react';
import { adsterraConfig, hasAdvertisingConsent } from '@/lib/ads-config';
import { useWorkflowStore } from '@/store/workflow-store';

/**
 * Loads the high-CPM Adsterra Social Bar (Unit ID 31836252) after initial paint
 * AND only after the visitor grants advertising cookie consent:
 *  - Injects immediately once a download occurs (`hasDownloadedOnce`), OR
 *  - On first user interaction (`pointerdown`, `scroll`, `keydown`) after 1.2s, OR
 *  - Automatically after 3.5s on active pages.
 */
export function DeferredSocialBar() {
  const hasDownloadedOnce = useWorkflowStore((s) => s.hasDownloadedOnce);
  const hydrateFromSession = useWorkflowStore((s) => s.hydrateFromSession);
  const [adConsent, setAdConsent] = useState(false);

  useEffect(() => {
    hydrateFromSession();
  }, [hydrateFromSession]);

  useEffect(() => {
    const syncConsent = () => setAdConsent(hasAdvertisingConsent());
    syncConsent();
    window.addEventListener('cookie-consent-updated', syncConsent);
    return () => window.removeEventListener('cookie-consent-updated', syncConsent);
  }, []);

  useEffect(() => {
    if (!adConsent || !adsterraConfig.enabled || !adsterraConfig.slots.socialBar.scriptSrc) return;

    const injectSocialBar = () => {
      if (!hasAdvertisingConsent()) return;
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
  }, [adConsent, hasDownloadedOnce]);

  return null;
}
