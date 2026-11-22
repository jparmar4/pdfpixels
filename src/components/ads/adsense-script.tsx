'use client';

import { adsenseConfig, hasAdvertisingConsent } from '@/lib/ads-config';
import { useEffect } from 'react';

const ADSENSE_SCRIPT_ID = 'pp-adsense-script';

export function AdSenseScript() {
  useEffect(() => {
    const sync = () => {
      const consented = hasAdvertisingConsent();
      const w = window as unknown as {
        adsbygoogle?: unknown[] & { requestNonPersonalizedAds?: number };
      };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.requestNonPersonalizedAds = consented ? 0 : 1;

      // Only inject Google AdSense after explicit advertising consent.
      // Site ownership verification is handled statically via <meta name="google-adsense-account">.
      if (
        consented &&
        adsenseConfig.enabled &&
        adsenseConfig.clientId &&
        !document.getElementById(ADSENSE_SCRIPT_ID)
      ) {
        const script = document.createElement('script');
        script.id = ADSENSE_SCRIPT_ID;
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsenseConfig.clientId)}`;
        document.head.appendChild(script);
      }
    };

    sync();
    window.addEventListener('cookie-consent-updated', sync);
    return () => window.removeEventListener('cookie-consent-updated', sync);
  }, []);

  return null;
}
