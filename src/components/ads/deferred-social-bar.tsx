'use client';

import { useEffect } from 'react';
import { adsterraConfig } from '@/lib/ads-config';
import { useWorkflowStore } from '@/store/workflow-store';

/**
 * Gates the high-CPM Adsterra Social Bar script so it injects ONLY after
 * at least one file download (`onDownloadSuccess`) has occurred in the session.
 * This protects initial Core Web Vitals and focuses Social Bar impressions on
 * engaged tool users rather than first-paint visitors.
 */
export function DeferredSocialBar() {
  const hasDownloadedOnce = useWorkflowStore((s) => s.hasDownloadedOnce);
  const hydrateFromSession = useWorkflowStore((s) => s.hydrateFromSession);

  useEffect(() => {
    hydrateFromSession();
  }, [hydrateFromSession]);

  useEffect(() => {
    if (!hasDownloadedOnce) return;
    if (!adsterraConfig.enabled || !adsterraConfig.slots.socialBar.scriptSrc) return;
    if (document.getElementById('pp-adsterra-social-bar')) return;

    const script = document.createElement('script');
    script.id = 'pp-adsterra-social-bar';
    script.type = 'text/javascript';
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = adsterraConfig.slots.socialBar.scriptSrc;
    document.body.appendChild(script);
  }, [hasDownloadedOnce]);

  return null;
}
