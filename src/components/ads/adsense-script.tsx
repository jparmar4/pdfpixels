'use client';

import Script from 'next/script';
import { adsConfig, hasAdvertisingConsent } from '@/lib/ads-config';
import { useEffect, useState } from 'react';

// Google AdSense Script Component
//
// The loader script MUST render unconditionally in production: AdSense verifies
// the code's presence when reviewing the site, and ads cannot serve without it.
// Personalization stays consent-controlled — without advertising consent we push
// requestNonPersonalizedAds: 1 (Google's documented fallback for consent-gated
// traffic), and personalization resumes once consent is granted.
export function AdSenseScript() {
  const [adConsent, setAdConsent] = useState(false);

  useEffect(() => {
    const handleConsentUpdate = () => {
      setAdConsent(hasAdvertisingConsent());
    };
    handleConsentUpdate();
    window.addEventListener('cookie-consent-updated', handleConsentUpdate);
    return () => {
      window.removeEventListener('cookie-consent-updated', handleConsentUpdate);
    };
  }, []);

  if (!adsConfig.enabled || !adsConfig.publisherId) {
    return null;
  }

  return (
    <>
      <Script
        id="adsense-loader"
        async
        src={adsConfig.scriptUrl}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      {!adConsent && (
        <Script
          id="adsense-npa"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (adsbygoogle = window.adsbygoogle || []).push({
                google_ad_client: "${adsConfig.publisherId}",
                requestNonPersonalizedAds: 1
              });
            `,
          }}
        />
      )}
    </>
  );
}
