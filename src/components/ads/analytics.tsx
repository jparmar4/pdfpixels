'use client';

import { useEffect, useState } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';
import { hasAdvertisingConsent } from '@/lib/ads-config';

export function Analytics() {
  const [hasConsent, setHasConsent] = useState(() => {
    if (typeof window === 'undefined') return false;
    return hasAdvertisingConsent();
  });

  useEffect(() => {
    const handleConsentUpdate = () => {
      setHasConsent(hasAdvertisingConsent());
    };

    window.addEventListener('cookie-consent-updated', handleConsentUpdate);
    return () => {
      window.removeEventListener('cookie-consent-updated', handleConsentUpdate);
    };
  }, []);

  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  if (!gaId || !hasConsent) {
    return null;
  }

  return <GoogleAnalytics gaId={gaId} />;
}
