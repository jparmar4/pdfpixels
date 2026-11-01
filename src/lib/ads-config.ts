// Advertising & Monetization Configuration (Google AdSense Primary & Adsterra Fallback)
// Compliant with Google AdSense Policies, Coalition for Better Ads, and GDPR/CCPA.

export const ADSENSE_CLIENT_ID = 'ca-pub-3541576002060495';

export const adsenseConfig = {
  // Enabled by default for official Google AdSense integration & Auto Ads
  enabled: process.env.NEXT_PUBLIC_ADSENSE_ENABLED !== 'false',
  clientId: process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || ADSENSE_CLIENT_ID,
  slots: {
    header: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HEADER || '',
    sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR || '',
    inContent: process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT || '',
    footer: process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER || '',
    result: process.env.NEXT_PUBLIC_ADSENSE_SLOT_RESULT || '',
  },
};

export const adsterraConfig = {
  // Disabled during AdSense review and re-application to ensure 100% policy compliance
  enabled: process.env.NEXT_PUBLIC_ADSTERRA_ENABLED === 'true',
  smartlink: '',
  slots: {
    banner728x90: {
      key: process.env.NEXT_PUBLIC_ADSTERRA_728X90 || '',
      width: 728,
      height: 90,
    },
    banner320x50: {
      key: process.env.NEXT_PUBLIC_ADSTERRA_320X50 || '',
      width: 320,
      height: 50,
    },
    banner468x60: {
      key: process.env.NEXT_PUBLIC_ADSTERRA_468X60 || '',
      width: 468,
      height: 60,
    },
    banner300x250: {
      key: process.env.NEXT_PUBLIC_ADSTERRA_300X250 || '',
      width: 300,
      height: 250,
    },
    banner160x300: {
      key: process.env.NEXT_PUBLIC_ADSTERRA_160X300 || '',
      width: 160,
      height: 300,
    },
    banner160x600: {
      key: process.env.NEXT_PUBLIC_ADSTERRA_160X600 || '',
      width: 160,
      height: 600,
    },
    nativeBanner: {
      scriptSrc: process.env.NEXT_PUBLIC_ADSTERRA_NATIVE_SRC || '',
      containerId: process.env.NEXT_PUBLIC_ADSTERRA_NATIVE_CONTAINER || '',
    },
    socialBar: {
      scriptSrc: '',
    },
  },
};

export function hasConfiguredAdSlot(): boolean {
  return adsenseConfig.enabled || adsterraConfig.enabled;
}

/**
 * Permanently deactivated: Opening background tabs / smartlinks upon download
 * is a direct violation of Google AdSense Site Navigation & Better Ads policies
 * and was the primary trigger for repeated rejections.
 */
export function triggerSmartlinkOncePerSession(): void {
  // Intentional no-op for policy compliance and clean user experience
}

export const adsConfig = {
  enabled: adsenseConfig.enabled || adsterraConfig.enabled,
  testMode: false,
  slots: {
    header: adsenseConfig.slots.header || adsterraConfig.slots.banner728x90.key,
    sidebar: adsenseConfig.slots.sidebar || adsterraConfig.slots.banner160x600.key,
    inContent: adsenseConfig.slots.inContent || adsterraConfig.slots.banner300x250.key,
    footer: adsenseConfig.slots.footer || adsterraConfig.slots.banner728x90.key,
    native: adsterraConfig.slots.nativeBanner.containerId,
    socialBar: '',
  },
};

// Cookie consent configuration
export const cookieConfig = {
  // Cookie name for storing consent
  cookieName: 'cookie-consent',

  // Cookie expiration in days
  cookieExpiration: 365,

  // Required consent categories
  categories: {
    necessary: {
      name: 'Necessary',
      description: 'Essential cookies for the website to function properly',
      required: true,
    },
    analytics: {
      name: 'Analytics',
      description: 'Help us understand how visitors interact with our website',
      required: false,
    },
    advertising: {
      name: 'Advertising',
      description: 'Used to deliver relevant advertisements (Google AdSense)',
      required: false,
    },
  },
};

// Type for consent settings
export type CookieConsent = {
  necessary: boolean;
  analytics: boolean;
  advertising: boolean;
  timestamp: number;
};

// Check if advertising consent is given
export function hasAdvertisingConsent(): boolean {
  if (typeof window === 'undefined') return false;
  const consent = getConsent();
  return consent?.advertising ?? false;
}

// Check if analytics consent is given
export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  const consent = getConsent();
  return consent?.analytics ?? false;
}

// Save consent settings
export function saveConsent(consent: Omit<CookieConsent, 'timestamp'>): void {
  if (typeof window === 'undefined') return;

  const fullConsent: CookieConsent = {
    ...consent,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(cookieConfig.cookieName, JSON.stringify(fullConsent));
  } catch {
    // Storage restricted — cookie fallback below will still preserve preference
  }

  // Also set a lightweight cookie so server components can optionally read preference later.
  // Encodes the actual choice (1 = granted advertising/analytics, 0 = rejected)
  // instead of a constant, so SSR never mistakes a rejection for consent.
  try {
    const maxAge = cookieConfig.cookieExpiration * 24 * 60 * 60;
    const granted = consent.analytics || consent.advertising ? '1' : '0';
    const payload = encodeURIComponent(
      JSON.stringify({ a: consent.analytics ? 1 : 0, d: consent.advertising ? 1 : 0 }),
    );
    document.cookie = `${cookieConfig.cookieName}=${granted}; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `${cookieConfig.cookieName}-prefs=${payload}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    // ignore cookie write failures
  }

  // Dispatch event for other components to react
  window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: fullConsent }));
}

// Get current consent
export function getConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(cookieConfig.cookieName);
    if (!stored) return null;

    return JSON.parse(stored) as CookieConsent;
  } catch {
    return null;
  }
}

// Check if consent has been given (any choice made)
export function hasConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return getConsent() !== null;
}
