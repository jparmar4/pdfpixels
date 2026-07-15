'use client';

import Script from 'next/script';
import { adsConfig, hasAdvertisingConsent } from '@/lib/ads-config';
import { useEffect, useState } from 'react';

// Google AdSense Script Component
// Add this to your layout.tsx to load AdSense
export function AdSenseScript() {
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

  // Don't load if ads are disabled, publisher missing, or no consent
  if (!adsConfig.enabled || !adsConfig.publisherId || !hasConsent) {
    return null;
  }

  return (
    <Script
      id="adsense-loader"
      async
      src={adsConfig.scriptUrl}
      crossOrigin="anonymous"
      strategy="lazyOnload"
    />
  );
}

// Non-personalized ads version (for users without personalized consent)
export function AdSenseScriptNonPersonalized() {
  if (!adsConfig.enabled || !adsConfig.publisherId) {
    return null;
  }

  return (
    <>
      <Script
        id="adsense-loader-np"
        async
        src={adsConfig.scriptUrl}
        crossOrigin="anonymous"
        strategy="lazyOnload"
      />
      <Script
        id="adsense-config-np"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            (adsbygoogle = window.adsbygoogle || []).push({
              google_ad_client: "${adsConfig.publisherId}",
              enable_page_level_ads: true,
              requestNonPersonalizedAds: 1
            });
          `,
        }}
      />
    </>
  );
}
