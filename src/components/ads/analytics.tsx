'use client';

import { useEffect, useState } from 'react';
import { GoogleAnalytics, sendGAEvent } from '@next/third-parties/google';
import { hasAnalyticsConsent } from '@/lib/ads-config';

// Referrers from AI answer engines — tracked as a dedicated event so AI-search
// traffic (ChatGPT, Perplexity, Copilot, Gemini, Claude…) is measurable in GA4.
const AI_REFERRER_HOSTS = [
  'chatgpt.com',
  'chat.openai.com',
  'perplexity.ai',
  'copilot.microsoft.com',
  'gemini.google.com',
  'claude.ai',
  'you.com',
  'phind.com',
  'poe.com',
  'grok.com',
  'x.ai',
  'deepseek.com',
];

function aiSourceFromReferrer(referrer: string): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');
    return AI_REFERRER_HOSTS.find((domain) => host === domain || host.endsWith(`.${domain}`)) ?? null;
  } catch {
    return null;
  }
}

function AIReferralTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('pp-ai-ref-tracked')) return;
    const source = aiSourceFromReferrer(document.referrer);
    if (!source) return;
    sessionStorage.setItem('pp-ai-ref-tracked', '1');
    try {
      sendGAEvent('event', 'ai_referral', { ai_source: source });
    } catch {
      // Analytics blocked — ignore.
    }
  }, []);

  return null;
}

export function Analytics() {
  const [hasConsent, setHasConsent] = useState(() => {
    if (typeof window === 'undefined') return false;
    return hasAnalyticsConsent();
  });

  useEffect(() => {
    const handleConsentUpdate = () => {
      setHasConsent(hasAnalyticsConsent());
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

  return (
    <>
      <GoogleAnalytics gaId={gaId} />
      <AIReferralTracker />
    </>
  );
}
