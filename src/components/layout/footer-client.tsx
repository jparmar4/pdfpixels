'use client';

import { useState, useCallback } from 'react';
import { Mail, ShieldCheck, Send } from 'lucide-react';

export function FooterNewsletterForm() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribeError, setSubscribeError] = useState('');

  const handleSubscribe = useCallback(async () => {
    if (!email.trim() || !email.includes('@')) return;
    setSubscribeError('');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubscribed(true);
        setEmail('');
      } else {
        setSubscribeError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setSubscribeError('Network error. Please try again.');
    }
  }, [email]);

  return (
    <div className="pt-2">
      <p className="mb-2.5 text-sm font-medium text-muted-foreground">
        Get notified about new tools and features
      </p>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="email"
            placeholder="Enter your email for updates"
            aria-label="Email for newsletter"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
            className="h-11 w-full rounded-2xl border border-border/60 bg-background/80 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <button
          type="button"
          onClick={handleSubscribe}
          disabled={subscribed}
          className="btn-premium inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold disabled:opacity-60"
        >
          {subscribed ? (
            <>
              <ShieldCheck className="h-4 w-4" />
              Subscribed!
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Subscribe
            </>
          )}
        </button>
      </div>
      {subscribeError && (
        <p role="alert" className="text-xs text-destructive mt-1">
          {subscribeError}
        </p>
      )}
    </div>
  );
}
