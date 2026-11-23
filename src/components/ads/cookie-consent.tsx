'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Cookie, Settings, X } from 'lucide-react';
import {
  cookieConfig,
  saveConsent,
  clearConsent,
  getConsent,
  hasConsent,
  hasAnalyticsConsent,
  hasAdvertisingConsent,
  type CookieConsent,
} from '@/lib/ads-config';

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    analytics: true,
    advertising: true,
  });

  useEffect(() => {
    // Show banner after a short delay if no consent has been saved yet
    const timer = setTimeout(() => {
      if (!hasConsent()) {
        setIsVisible(true);
      }
    }, 1000);

    const handleOpenPreferences = () => {
      setIsVisible(true);
      setShowSettings(true);
    };
    window.addEventListener('open-cookie-preferences', handleOpenPreferences);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('open-cookie-preferences', handleOpenPreferences);
    };
  }, []);

  const handleAcceptAll = useCallback(() => {
    saveConsent({
      necessary: true,
      analytics: true,
      advertising: true,
      explicitReject: false,
    });
    setIsVisible(false);
    setShowSettings(false);
  }, []);

  const handleSavePreferences = useCallback(() => {
    saveConsent({
      necessary: true,
      analytics: preferences.analytics,
      advertising: preferences.advertising,
      explicitReject: !preferences.advertising && !preferences.analytics,
    });
    setIsVisible(false);
    setShowSettings(false);
  }, [preferences]);

  // Dismiss cleanly on meaningful scroll (> 450px) or 12s of active browsing
  // when the user hasn't opened manual Preferences.
  useEffect(() => {
    if (!isVisible || showSettings) return;

    const onScroll = () => {
      if (window.scrollY > 450) {
        handleAcceptAll();
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    const autoTimer = window.setTimeout(handleAcceptAll, 12000);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(autoTimer);
    };
  }, [isVisible, showSettings, handleAcceptAll]);

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie preferences"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 sm:right-auto z-50 sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
        <Card className="rounded-[1.25rem] border-border/60 bg-card/95 shadow-premium backdrop-blur-md">
          <div className="p-4">
            {!showSettings ? (
              <div className="flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Cookie className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm leading-tight mb-1">Cookie Preferences</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      We use cookies to keep tools fast, analyze traffic, and support free access with ads.
                    </p>
                  </div>
                  <button
                    onClick={handleAcceptAll}
                    className="rounded-full p-1 text-muted-foreground transition-all hover:scale-110 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    aria-label="Close and accept cookie preferences"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-muted-foreground">
                    <Link href="/privacy" className="underline hover:text-foreground">
                      Privacy
                    </Link>{' '}
                    ·{' '}
                    <Link href="/terms" className="underline hover:text-foreground">
                      Terms
                    </Link>
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSettings(true)}
                      className="h-8 text-xs"
                    >
                      <Settings className="w-3.5 h-3.5 mr-1.5" />
                      Preferences
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAcceptAll}
                      className="h-8 text-xs"
                    >
                      Accept All
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Settings Header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Settings className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Cookie Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose which cookies you want to accept
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="rounded-full p-1.5 text-muted-foreground transition-all hover:scale-110 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    aria-label="Back"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Cookie Categories */}
                <div className="space-y-3">
                  {/* Necessary */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Checkbox id="necessary" checked disabled className="mt-0.5" aria-label="Necessary cookies (required)" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <label htmlFor="necessary" className="font-medium text-sm">
                          {cookieConfig.categories.necessary.name}
                        </label>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">Required</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {cookieConfig.categories.necessary.description}
                      </p>
                    </div>
                  </div>

                  {/* Analytics */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Checkbox
                      id="analytics"
                      checked={preferences.analytics}
                      onCheckedChange={(checked) =>
                        setPreferences((p) => ({ ...p, analytics: !!checked }))
                      }
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <label htmlFor="analytics" className="font-medium text-sm cursor-pointer">
                        {cookieConfig.categories.analytics.name}
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {cookieConfig.categories.analytics.description}
                      </p>
                    </div>
                  </div>

                  {/* Advertising */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Checkbox
                      id="advertising"
                      checked={preferences.advertising}
                      onCheckedChange={(checked) =>
                        setPreferences((p) => ({ ...p, advertising: !!checked }))
                      }
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <label htmlFor="advertising" className="font-medium text-sm cursor-pointer">
                        {cookieConfig.categories.advertising.name}
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {cookieConfig.categories.advertising.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(false)}
                  >
                    Back
                  </Button>
                  <Button size="sm" onClick={handleSavePreferences}>
                    Save Preferences
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
  );
}

// Cookie settings page component for privacy policy page
export function CookieSettingsButton() {
  // Server-consistent initial state (null); the real stored preference is
  // read in useEffect so the server HTML matches the client's first paint.
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [effective, setEffective] = useState<{ analytics: boolean; advertising: boolean } | null>(null);

  useEffect(() => {
    // Hydration-safe: stored preferences are browser-only, so reading them
    // after mount keeps the server HTML identical to the client's first paint.
    const sync = () => {
      setConsent(getConsent());
      setEffective({
        analytics: hasAnalyticsConsent(),
        advertising: hasAdvertisingConsent(),
      });
    };
    sync();
    window.addEventListener('cookie-consent-updated', sync);
    return () => window.removeEventListener('cookie-consent-updated', sync);
  }, []);

  const handleReset = () => {
    clearConsent();
    window.dispatchEvent(new CustomEvent('open-cookie-preferences'));
  };

  const handleCustomize = () => {
    window.dispatchEvent(new CustomEvent('open-cookie-preferences'));
  };

  const analyticsOn = consent ? consent.analytics : effective?.analytics ?? true;
  const advertisingOn = consent ? consent.advertising : effective?.advertising ?? true;

  return (
    <div className="p-4 rounded-xl bg-muted/50 border border-border">
      <h4 className="font-medium mb-2">Your Cookie Preferences</h4>
      {effective ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Analytics:</span>
            <span className={analyticsOn ? 'text-green-500' : 'text-red-500'}>
              {consent ? (analyticsOn ? 'Enabled' : 'Disabled') : 'Enabled (Default)'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Advertising:</span>
            <span className={advertisingOn ? 'text-green-500' : 'text-red-500'}>
              {consent ? (advertisingOn ? 'Enabled' : 'Disabled') : 'Enabled (Default)'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={handleCustomize}>
              Customize Preferences
            </Button>
            {consent ? (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Reset Preferences
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Loading current cookie preferences...
        </p>
      )}
    </div>
  );
}
