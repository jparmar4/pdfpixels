'use client';

import { useEffect, useRef } from 'react';
import { adsterraConfig } from '@/lib/ads-config';

/**
 * Adsterra Social Bar (In-Page Push) script injector.
 * High-CPM format ($1.50 - $4.00+ CPM) with high engagement and CTR.
 * Runs non-intrusively across devices with data-cfasync="false".
 */
export function AdsterraSocialBar() {
  const isLoaded = useRef(false);

  useEffect(() => {
    if (!adsterraConfig.enabled || isLoaded.current || typeof window === 'undefined') return;
    isLoaded.current = true;

    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = adsterraConfig.slots.socialBar.scriptSrc;
    document.head.appendChild(script);
  }, []);

  return null;
}
