'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { adsterraConfig, hasAdvertisingConsent } from '@/lib/ads-config';
import { useAppStore } from '@/store/app-store';
import { useWorkflowStore } from '@/store/workflow-store';

const POPUNDER_SCRIPT_ID = 'pp-adsterra-popunder';

function isUploadWorkspaceRoute(pathname: string): boolean {
  if (pathname.startsWith('/tools/category/')) return false;
  return (
    /^\/(?:(?:de|es|fr|jp|pt)\/)?tools\/[^/]+$/.test(pathname) ||
    /^\/in\/[^/]+$/.test(pathname) ||
    /^\/workflows\/[^/]+$/.test(pathname)
  );
}

/**
 * Injects the Adsterra Popunder script (`https://abscloud.org/1/893e27ddba5b4b20f76e839a457f8ca0`)
 * with `data-cfasync="false"` safely after LCP and consent checks:
 *  - Skips automated/headless crawlers (`navigator.webdriver`) to protect SEO & CWV.
 *  - On upload tool pages, waits until a file is selected (`uploadedFile`), a download
 *    occurs, the user scrolls past the dropzone, or 4.5s elapses so browser `<input type="file">`
 *    dialogs are never blocked on the first click—then fires cleanly on the Process/Download click.
 *  - On blog, Google Discover, hub, comparison, and guide pages, injects shortly after first paint
 *    so the first click monetizes immediately with zero LCP impact.
 */
export function DeferredPopunder() {
  const pathname = usePathname() || '/';
  const uploadedFile = useAppStore((s) => s.uploadedFile);
  const hasDownloadedOnce = useWorkflowStore((s) => s.hasDownloadedOnce);
  const [adConsent, setAdConsent] = useState(true);

  useEffect(() => {
    const syncConsent = () => setAdConsent(hasAdvertisingConsent());
    syncConsent();
    window.addEventListener('cookie-consent-updated', syncConsent);
    return () => window.removeEventListener('cookie-consent-updated', syncConsent);
  }, []);

  useEffect(() => {
    const scriptSrc = adsterraConfig.slots.popunder.scriptSrc;
    if (!adConsent || !adsterraConfig.enabled || !scriptSrc) return;
    if (typeof navigator !== 'undefined' && navigator.webdriver) return;
    if (typeof document !== 'undefined' && document.getElementById(POPUNDER_SCRIPT_ID)) return;

    const injectPopunder = () => {
      if (!hasAdvertisingConsent()) return;
      if (typeof navigator !== 'undefined' && navigator.webdriver) return;
      if (document.getElementById(POPUNDER_SCRIPT_ID)) return;

      const script = document.createElement('script');
      script.id = POPUNDER_SCRIPT_ID;
      script.setAttribute('data-cfasync', 'false');
      script.async = true;
      script.src = scriptSrc;
      document.body.appendChild(script);
    };

    const onToolWorkspace = isUploadWorkspaceRoute(pathname);

    if (uploadedFile || hasDownloadedOnce) {
      injectPopunder();
      return;
    }

    if (onToolWorkspace) {
      const onScroll = () => {
        if (window.scrollY > 280) {
          cleanup();
          injectPopunder();
        }
      };
      const timer = window.setTimeout(() => {
        cleanup();
        injectPopunder();
      }, 4500);
      const cleanup = () => {
        window.removeEventListener('scroll', onScroll);
        window.clearTimeout(timer);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      return cleanup;
    }

    const mountTime = Date.now();
    let engageTimer: number | null = null;

    const onEngage = () => {
      cleanupContentListeners();
      const delay = Math.max(0, 250 - (Date.now() - mountTime));
      engageTimer = window.setTimeout(injectPopunder, delay);
    };

    const cleanupContentListeners = () => {
      window.removeEventListener('scroll', onEngage);
      window.removeEventListener('touchstart', onEngage);
      window.removeEventListener('mousemove', onEngage);
    };

    window.addEventListener('scroll', onEngage, { passive: true, once: true });
    window.addEventListener('touchstart', onEngage, { passive: true, once: true });
    window.addEventListener('mousemove', onEngage, { passive: true, once: true });

    const fallbackTimer = window.setTimeout(() => {
      cleanupContentListeners();
      injectPopunder();
    }, 900);

    return () => {
      cleanupContentListeners();
      window.clearTimeout(fallbackTimer);
      if (engageTimer !== null) window.clearTimeout(engageTimer);
    };
  }, [adConsent, pathname, uploadedFile, hasDownloadedOnce]);

  return null;
}
