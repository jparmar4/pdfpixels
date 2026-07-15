'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Cookie, Settings, X } from 'lucide-react';
import {
  cookieConfig,
  saveConsent,
  getConsent,
  hasConsent,
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
    // Show banner after a short delay if no consent has been given
    const timer = setTimeout(() => {
      if (!hasConsent()) {
        setIsVisible(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleAcceptAll = useCallback(() => {
    saveConsent({
      necessary: true,
      analytics: true,
      advertising: true,
    });
    setIsVisible(false);
  }, []);

  const handleRejectAll = useCallback(() => {
    saveConsent({
      necessary: true,
      analytics: false,
      advertising: false,
    });
    setIsVisible(false);
  }, []);

  const handleSavePreferences = useCallback(() => {
    saveConsent({
      necessary: true,
      analytics: preferences.analytics,
      advertising: preferences.advertising,
    });
    setIsVisible(false);
    setShowSettings(false);
  }, [preferences]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
      >
        <Card className="max-w-3xl mx-auto shadow-2xl border-border/50 bg-card/95 backdrop-blur-xl">
          <div className="p-4 sm:p-6">
            {!showSettings ? (
              <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Cookie className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Cookie Preferences</h3>
                    <p className="text-sm text-muted-foreground">
                      We use cookies to enhance your experience, analyze site traffic, and serve 
                      personalized ads through Google AdSense. You can choose your preferences below.
                    </p>
                  </div>
                  <button
                    onClick={handleRejectAll}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(true)}
                    className="order-3 sm:order-1"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Customize
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRejectAll}
                    className="order-2 sm:order-2"
                  >
                    Reject All
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAcceptAll}
                    className="order-1 sm:order-3"
                  >
                    Accept All
                  </Button>
                </div>

                {/* Privacy Link */}
                <p className="text-xs text-muted-foreground">
                  By accepting, you agree to our{' '}
                  <Link href="/privacy" className="underline hover:text-foreground">
                    Privacy Policy
                  </Link>{' '}
                  and{' '}
                  <Link href="/terms" className="underline hover:text-foreground">
                    Terms of Service
                  </Link>
                  .
                </p>
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
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Back"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Cookie Categories */}
                <div className="space-y-3">
                  {/* Necessary */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Checkbox checked disabled className="mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {cookieConfig.categories.necessary.name}
                        </span>
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
      </motion.div>
    </AnimatePresence>
  );
}

// Cookie settings page component for privacy policy page
export function CookieSettingsButton() {
  const [consent] = useState<CookieConsent | null>(() => {
    if (typeof window === 'undefined') return null;
    return getConsent();
  });

  const handleReset = () => {
    localStorage.removeItem(cookieConfig.cookieName);
    window.location.reload();
  };

  return (
    <div className="p-4 rounded-xl bg-muted/50 border border-border">
      <h4 className="font-medium mb-2">Your Cookie Preferences</h4>
      {consent ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Analytics:</span>
            <span className={consent.analytics ? 'text-green-500' : 'text-red-500'}>
              {consent.analytics ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Advertising:</span>
            <span className={consent.advertising ? 'text-green-500' : 'text-red-500'}>
              {consent.advertising ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset} className="mt-2">
            Reset Preferences
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No cookie preferences set. You will be prompted when you visit the homepage.
        </p>
      )}
    </div>
  );
}
