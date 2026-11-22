// Advertising & Monetization Configuration (Adsterra Primary & AdSense Optional)
// Supported Adsterra formats: 728x90, 468x60, 320x50, 300x250, 160x600, 160x300, Native Banner, Social Bar, and Smartlink.
import { useWorkflowStore, type OutputTelemetry } from '@/store/workflow-store';

export const ADSENSE_CLIENT_ID = 'ca-pub-3541576002060495';

export const adsenseConfig = {
  // Enabled by default for Auto Ads & site verification; manual slots upgrade seamlessly when configured
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
  enabled: process.env.NEXT_PUBLIC_ADSTERRA_ENABLED !== 'false',
  scriptHost: process.env.NEXT_PUBLIC_ADSTERRA_HOST || 'https://bauval.org',
  smartlink:
    process.env.NEXT_PUBLIC_ADSTERRA_SMARTLINK ||
    'https://araplhn.org/4/e2520ac9b4a8217fc6f4ca143b25a1a2',
  slots: {
    banner728x90: {
      key: process.env.NEXT_PUBLIC_ADSTERRA_728X90 || 'cc2cce8a2df76b72b3ff70946c516588',
      width: 728,
      height: 90,
    },
    banner320x50: {
      key: process.env.NEXT_PUBLIC_ADSTERRA_320X50 || '0b00c66251afffc9b834943d1a7cbf35',
      width: 320,
      height: 50,
    },
    banner468x60: {
      key: process.env.NEXT_PUBLIC_ADSTERRA_468X60 || 'b07dd02b30ebdc4eabb7f2497e3f1627',
      width: 468,
      height: 60,
    },
    banner300x250: {
      unitId: '31811019',
      key: process.env.NEXT_PUBLIC_ADSTERRA_300X250 || '60e2f20431171a62210e7189380ed0f4',
      width: 300,
      height: 250,
    },
    banner160x300: {
      key: process.env.NEXT_PUBLIC_ADSTERRA_160X300 || '23a0c5d83de92016cac66cd6006e3bc6',
      width: 160,
      height: 300,
    },
    banner160x600: {
      key: process.env.NEXT_PUBLIC_ADSTERRA_160X600 || '4db808e74356da4d4bdee2f7720cf1cc',
      width: 160,
      height: 600,
    },
    nativeBanner: {
      scriptSrc:
        process.env.NEXT_PUBLIC_ADSTERRA_NATIVE_SRC ||
        'https://bauval.org/21/a71ba0b513f2755b9f56ff45b5814958',
      containerId:
        process.env.NEXT_PUBLIC_ADSTERRA_NATIVE_CONTAINER ||
        'container-a71ba0b513f2755b9f56ff45b5814958',
    },
    socialBar: {
      unitId: '31836252',
      scriptSrc:
        process.env.NEXT_PUBLIC_ADSTERRA_SOCIAL_BAR_SRC ||
        'https://bauval.org/14/4cb2c6ce7427559857aecec157fd016f',
    },
  },
};

export function hasConfiguredAdSlot(): boolean {
  const hasAdSenseSlot = adsenseConfig.enabled && Boolean(
    adsenseConfig.slots.header ||
    adsenseConfig.slots.sidebar ||
    adsenseConfig.slots.inContent ||
    adsenseConfig.slots.footer ||
    adsenseConfig.slots.result
  );
  const hasAdsterraSlot = adsterraConfig.enabled && Boolean(
    adsterraConfig.slots.banner728x90.key ||
    adsterraConfig.slots.banner468x60.key ||
    adsterraConfig.slots.banner160x600.key ||
    adsterraConfig.slots.banner300x250.key ||
    adsterraConfig.slots.banner320x50.key ||
    adsterraConfig.slots.nativeBanner.containerId
  );
  return hasAdSenseSlot || hasAdsterraSlot || adsConfig.testMode;
}

/**
 * Marks a successful user download (`onDownloadSuccess`), unlocking high-CPM
 * post-action formats (Social Bar) and revealing the 1-click workflow chain bar.
 */
export function recordDownloadSuccess(override?: Partial<OutputTelemetry>): void {
  if (typeof window === 'undefined') return;
  try {
    useWorkflowStore.getState().markDownloadSuccess(override);
  } catch {
    // Keep downloads resilient even if store access fails
  }
}

/**
 * Triggers the Adsterra Smartlink (Direct Link) in a new tab at most ONCE
 * per user browser session when a conversion download happens.
 * Ensures the user's file downloads reliably without interrupting repeat tasks.
 */
export function triggerSmartlinkOncePerSession(): void {
  recordDownloadSuccess();
  if (typeof window === 'undefined') return;
  if (!adsterraConfig.enabled || !adsterraConfig.smartlink) return;
  if (!hasAdvertisingConsent()) return;
  try {
    const visited = sessionStorage.getItem('pp_sl_seen');
    if (!visited) {
      sessionStorage.setItem('pp_sl_seen', '1');
      window.open(adsterraConfig.smartlink, '_blank', 'noopener,noreferrer');
    }
  } catch {
    // Silently continue if popups are blocked
  }
}

/**
 * Fires the session-capped Smartlink synchronously within the click gesture,
 * runs the download callback after 80ms so the file download starts reliably,
 * and emits `onDownloadSuccess` state for post-download monetization & chaining.
 */
export function triggerDownloadWithSmartlink(
  downloadFn: () => void,
  outputOverride?: Partial<OutputTelemetry>,
): void {
  recordDownloadSuccess(outputOverride);
  triggerSmartlinkOncePerSession();
  setTimeout(downloadFn, 80);
}

export const adsConfig = {
  enabled: adsenseConfig.enabled || adsterraConfig.enabled,
  clientId: adsenseConfig.clientId,
  testMode: false,
  slots: {
    header:
      adsenseConfig.enabled && adsenseConfig.slots.header
        ? adsenseConfig.slots.header
        : adsterraConfig.enabled
          ? adsterraConfig.slots.banner728x90.key
          : '',
    sidebar:
      adsenseConfig.enabled && adsenseConfig.slots.sidebar
        ? adsenseConfig.slots.sidebar
        : adsterraConfig.enabled
          ? adsterraConfig.slots.banner160x600.key || adsterraConfig.slots.banner160x300.key
          : '',
    inContent:
      adsenseConfig.enabled && adsenseConfig.slots.inContent
        ? adsenseConfig.slots.inContent
        : adsterraConfig.enabled
          ? adsterraConfig.slots.banner300x250.key
          : '',
    footer:
      adsenseConfig.enabled && adsenseConfig.slots.footer
        ? adsenseConfig.slots.footer
        : adsterraConfig.enabled
          ? adsterraConfig.slots.banner728x90.key
          : '',
    native: adsterraConfig.enabled ? adsterraConfig.slots.nativeBanner.containerId : '',
    socialBar: adsterraConfig.enabled ? adsterraConfig.slots.socialBar.scriptSrc : '',
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
      description: 'Used to deliver relevant advertisements and sponsored partner links',
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
    const secureAttr = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${cookieConfig.cookieName}=${granted}; path=/; max-age=${maxAge}; SameSite=Lax${secureAttr}`;
    document.cookie = `${cookieConfig.cookieName}-prefs=${payload}; path=/; max-age=${maxAge}; SameSite=Lax${secureAttr}`;
  } catch {
    // ignore cookie write failures
  }

  // Dispatch event for other components to react
  window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: fullConsent }));
}

// Clear stored consent (localStorage + companion cookies)
export function clearConsent(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(cookieConfig.cookieName);
  } catch {
    // ignore storage failures
  }
  try {
    const secureAttr = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${cookieConfig.cookieName}=; path=/; max-age=0; SameSite=Lax${secureAttr}`;
    document.cookie = `${cookieConfig.cookieName}-prefs=; path=/; max-age=0; SameSite=Lax${secureAttr}`;
  } catch {
    // ignore cookie failures
  }
  window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: null }));
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
