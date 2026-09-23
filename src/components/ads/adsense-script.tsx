'use client';

import { adsConfig, hasAdvertisingConsent } from '@/lib/ads-config';
import { useEffect } from 'react';

export function AdSenseScript() {
  useEffect(() => {
    const sync = () => {
      if (!adsConfig.enabled || !hasAdvertisingConsent()) return;
      const w = window as unknown as {
        adsbygoogle?: unknown[] & { requestNonPersonalizedAds?: number };
      };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.requestNonPersonalizedAds = 0;
      if (document.querySelector('script[data-pdfpixels-adsense]')) return;
      const script = document.createElement('script');
      script.async = true;
      script.src = adsConfig.scriptUrl;
      script.crossOrigin = 'anonymous';
      script.dataset.pdfpixelsAdsense = '1';
      document.head.appendChild(script);
    };
    sync();
    window.addEventListener('cookie-consent-updated', sync);
    return () => window.removeEventListener('cookie-consent-updated', sync);
  }, []);

  return null;
}
