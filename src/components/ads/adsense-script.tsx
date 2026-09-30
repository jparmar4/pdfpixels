'use client';

import { hasAdvertisingConsent } from '@/lib/ads-config';
import { useEffect } from 'react';

export function AdSenseScript() {
  useEffect(() => {
    const sync = () => {
      const w = window as unknown as {
        adsbygoogle?: unknown[] & { requestNonPersonalizedAds?: number };
      };
      w.adsbygoogle = w.adsbygoogle || [];
      // If user has not consented to personalized ads, enforce non-personalized ads (NPA = 1).
      // When consented, allow personalized ads (NPA = 0).
      w.adsbygoogle.requestNonPersonalizedAds = hasAdvertisingConsent() ? 0 : 1;
    };
    sync();
    window.addEventListener('cookie-consent-updated', sync);
    return () => window.removeEventListener('cookie-consent-updated', sync);
  }, []);

  return null;
}
