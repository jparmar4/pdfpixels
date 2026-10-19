// Adsterra Advertising Configuration
// Supported formats: 728x90, 468x60, 320x50, 300x250, 160x600, 160x300, and Native Banner

export const adsterraConfig = {
  enabled: process.env.NEXT_PUBLIC_ADSTERRA_ENABLED !== 'false',
  slots: {
    banner728x90: {
      key: 'cc2cce8a2df76b72b3ff70946c516588',
      width: 728,
      height: 90,
    },
    banner320x50: {
      key: '0b00c66251afffc9b834943d1a7cbf35',
      width: 320,
      height: 50,
    },
    banner468x60: {
      key: 'b07dd02b30ebdc4eabb7f2497e3f1627',
      width: 468,
      height: 60,
    },
    banner300x250: {
      key: '60e2f20431171a62210e7189380ed0f4',
      width: 300,
      height: 250,
    },
    banner160x300: {
      key: '23a0c5d83de92016cac66cd6006e3bc6',
      width: 160,
      height: 300,
    },
    banner160x600: {
      key: '4db808e74356da4d4bdee2f7720cf1cc',
      width: 160,
      height: 600,
    },
    nativeBanner: {
      scriptSrc: 'https://bauval.org/21/a71ba0b513f2755b9f56ff45b5814958',
      containerId: 'container-a71ba0b513f2755b9f56ff45b5814958',
    },
  },
};

export function hasConfiguredAdSlot(): boolean {
  return adsterraConfig.enabled;
}

export const adsConfig = {
  enabled: adsterraConfig.enabled,
  testMode: false,
  slots: {
    header: adsterraConfig.slots.banner728x90.key,
    sidebar: adsterraConfig.slots.banner160x600.key,
    inContent: adsterraConfig.slots.banner300x250.key,
    footer: adsterraConfig.slots.banner728x90.key,
    native: adsterraConfig.slots.nativeBanner.containerId,
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
