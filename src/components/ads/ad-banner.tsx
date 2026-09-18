'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { adsConfig, hasAdvertisingConsent } from '@/lib/ads-config';

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** Fixed min height to protect CLS (AdSense requires reserved space) */
  minHeight?: number;
  /** Show "Advertisement" label (recommended for policy + UX) */
  labeled?: boolean;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

function AdLabel() {
  return (
    <p className="mb-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
      Advertisement
    </p>
  );
}

function ReservedSpace({
  className,
  style,
  minHeight = 90,
}: {
  className?: string;
  style?: React.CSSProperties;
  minHeight?: number;
}) {
  return (
    <div
      className={cn('overflow-hidden rounded-xl bg-transparent', className)}
      style={{ minHeight, ...style }}
      aria-hidden="true"
      data-ad-placeholder="reserved"
    />
  );
}

export function AdBanner({
  slot,
  format = 'auto',
  responsive = true,
  className,
  style,
  minHeight = 90,
  labeled = false,
}: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoaded = useRef(false);
  // Initialize to server-consistent values and read the real values in
  // effects. Reading document.cookie / IntersectionObserver during render
  // made the server HTML differ from the client's first paint for consented
  // visitors (hydration mismatch), so this is deferred to useEffect.
  const [hasConsent, setHasConsent] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    // Hydration-safe: read browser-only state after mount so the server HTML
    // matches the client's first render (see the comment on useState above).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasConsent(hasAdvertisingConsent());

    const handleConsentUpdate = () => {
      setHasConsent(hasAdvertisingConsent());
    };

    window.addEventListener('cookie-consent-updated', handleConsentUpdate);
    return () => {
      window.removeEventListener('cookie-consent-updated', handleConsentUpdate);
    };
  }, []);

  // Lazy-init: only push ads when near viewport (better CWV + fill rate).
  // Re-runs when consent flips so the observer can attach once the container
  // actually renders (it stays null while consent is false).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      // No IO support: load eagerly. Server-consistent initial state is false,
      // so this only runs on the client after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px', threshold: 0.01 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasConsent]);

  useEffect(() => {
    if (!adsConfig.enabled || !hasConsent || !slot || !inView || isLoaded.current) return;

    // Defer push to next frame so layout is stable
    const id = requestAnimationFrame(() => {
      try {
        if (typeof window !== 'undefined') {
          window.adsbygoogle = window.adsbygoogle || [];
          window.adsbygoogle.push({});
          isLoaded.current = true;
        }
      } catch {
        // Silently handle ad errors
      }
    });
    return () => cancelAnimationFrame(id);
  }, [hasConsent, slot, inView]);

  // Development placeholder — fixed height avoids CLS
  if (adsConfig.testMode || !adsConfig.enabled) {
    return (
      <div ref={containerRef} className={cn('w-full', className)}>
        {labeled ? <AdLabel /> : null}
        <ReservedSpace
          className="flex items-center justify-center border border-dashed border-border/40 text-[10px] text-muted-foreground/50"
          style={style}
          minHeight={minHeight}
        />
      </div>
    );
  }

  // No consent / missing slot: no empty chrome in production
  if (!hasConsent || !slot) {
    return null;
  }

  return (
    <div ref={containerRef} className={cn('w-full', className)} style={{ minHeight }}>
      {labeled ? <AdLabel /> : null}
      <div className="ad-container overflow-hidden" style={{ minHeight }}>
        {inView ? (
          <ins
            ref={adRef}
            className="adsbygoogle"
            style={{
              display: 'block',
              minHeight,
              ...style,
            }}
            data-ad-client={adsConfig.publisherId}
            data-ad-slot={slot}
            data-ad-format={format}
            data-full-width-responsive={responsive ? 'true' : 'false'}
          />
        ) : (
          <ReservedSpace minHeight={minHeight} style={style} />
        )}
      </div>
    </div>
  );
}

// Pre-configured ad components for common placements

export function HeaderAd({ className }: { className?: string } = {}) {
  if (!adsConfig.slots.header && !adsConfig.testMode) return null;
  return (
    <div
      className={cn('mx-auto w-full max-w-5xl px-4 py-3 lg:px-8', className)}
      aria-label="Advertisement"
      role="complementary"
    >
      <AdBanner
        slot={adsConfig.slots.header}
        format="horizontal"
        minHeight={90}
        labeled
        className="w-full max-w-[728px] mx-auto"
      />
    </div>
  );
}

export function SidebarAd({ className }: { className?: string } = {}) {
  if (!adsConfig.slots.sidebar && !adsConfig.testMode) return null;
  return (
    <div className={cn('w-full', className)} aria-label="Advertisement" role="complementary">
      <AdBanner
        slot={adsConfig.slots.sidebar}
        format="vertical"
        minHeight={250}
        labeled
        className="w-[300px] max-w-full"
      />
    </div>
  );
}

export function InContentAd({ className }: { className?: string } = {}) {
  if (!adsConfig.slots.inContent && !adsConfig.testMode) return null;
  return (
    <div
      className={cn('my-8 w-full flex justify-center', className)}
      aria-label="Advertisement"
      role="complementary"
    >
      <AdBanner
        slot={adsConfig.slots.inContent}
        format="rectangle"
        minHeight={280}
        labeled
        className="w-full max-w-[336px]"
      />
    </div>
  );
}

export function FooterAd({ className }: { className?: string } = {}) {
  if (!adsConfig.slots.footer && !adsConfig.testMode) return null;
  return (
    <div
      className={cn('mx-auto w-full max-w-5xl px-4 py-6 lg:px-8', className)}
      aria-label="Advertisement"
      role="complementary"
    >
      <AdBanner
        slot={adsConfig.slots.footer}
        format="horizontal"
        minHeight={90}
        labeled
        className="w-full max-w-[728px] mx-auto"
      />
    </div>
  );
}

export function NativeAd({ className }: { className?: string }) {
  if (!adsConfig.slots.native && !adsConfig.testMode) return null;
  return (
    <div className={cn('w-full', className)} aria-label="Advertisement" role="complementary">
      <AdBanner slot={adsConfig.slots.native} format="auto" responsive minHeight={200} labeled />
    </div>
  );
}
