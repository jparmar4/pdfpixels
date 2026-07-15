// Google AdSense Configuration
// Update these values with your actual AdSense credentials after approval

// Keep in sync with public/ads.txt (pub-XXXXXXXX)
const DEFAULT_PUBLISHER_ID = 'ca-pub-3541576002060495';

export const adsConfig = {
  // Your AdSense Publisher ID (starts with ca-pub-)
  // Find it in your AdSense dashboard: Account > Account information
  publisherId: process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || DEFAULT_PUBLISHER_ID,

  // Enable/disable ads globally (set to false during development)
  enabled:
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PUBLIC_ADSENSE_ENABLED !== 'false' &&
    Boolean(process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || DEFAULT_PUBLISHER_ID),

  // Ad slot IDs for different placements
  // Get these from your AdSense dashboard when you create ad units
  slots: {
    header: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HEADER || '',
    sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR || '',
    inContent: process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT || '',
    footer: process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER || '',
    native: process.env.NEXT_PUBLIC_ADSENSE_SLOT_NATIVE || '',
  },

  // AdSense script URL
  get scriptUrl() {
    return `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.publisherId}`;
  },

  // Test mode - shows placeholder ads in development
  testMode: process.env.NODE_ENV !== 'production',
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

  localStorage.setItem(cookieConfig.cookieName, JSON.stringify(fullConsent));

  // Also set a lightweight cookie so server components can optionally read preference later
  try {
    const maxAge = cookieConfig.cookieExpiration * 24 * 60 * 60;
    document.cookie = `${cookieConfig.cookieName}=1; path=/; max-age=${maxAge}; SameSite=Lax`;
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
