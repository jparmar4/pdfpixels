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
      className={cn('overflow-hidden rounded-xl bg-muted/15', className)}
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
  const [hasConsent, setHasConsent] = useState(() => {
    if (typeof window === 'undefined') return false;
    return hasAdvertisingConsent();
  });
  // Default true when IO missing; observer flips true when near viewport
  const [inView, setInView] = useState(
    () => typeof window === 'undefined' || typeof IntersectionObserver === 'undefined',
  );

  useEffect(() => {
    const handleConsentUpdate = () => {
      setHasConsent(hasAdvertisingConsent());
    };

    window.addEventListener('cookie-consent-updated', handleConsentUpdate);
    return () => {
      window.removeEventListener('cookie-consent-updated', handleConsentUpdate);
    };
  }, []);

  // Lazy-init: only push ads when near viewport (better CWV + fill rate)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
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
  }, []);

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

export function MultiplexAd({ className }: { className?: string }) {
  if (!adsConfig.enabled || !adsConfig.slots.native || adsConfig.testMode) {
    if (adsConfig.testMode) {
      return (
        <div className={cn('w-full', className)}>
          <AdLabel />
          <ReservedSpace minHeight={280} className="border border-dashed border-border/40" />
        </div>
      );
    }
    return null;
  }

  return (
    <div className={cn('w-full min-h-[280px]', className)} aria-label="Advertisement" role="complementary">
      <AdLabel />
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight: 280 }}
        data-ad-format="autorelaxed"
        data-ad-client={adsConfig.publisherId}
        data-ad-slot={adsConfig.slots.native}
      />
    </div>
  );
}
