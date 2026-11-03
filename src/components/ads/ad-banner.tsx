'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { adsenseConfig, adsterraConfig, adsConfig } from '@/lib/ads-config';

interface AdBannerProps {
  slot?: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle' | 'native';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  minHeight?: number;
  labeled?: boolean;
}

function AdLabel() {
  return (
    <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
      Advertisement
    </p>
  );
}

/**
 * Official, policy-compliant Google AdSense Banner Unit.
 * Ensures adsbygoogle push is called safely once on client mount with Zero CLS.
 * Suppressed when slot is unconfigured and testMode is false, preventing empty ad boxes
 * from triggering Google AdSense "Low Value Content / Under Construction / Valuable Inventory" rejections.
 */
export function GoogleAdSenseUnit({
  slot,
  format = 'auto',
  style,
  className,
}: {
  slot?: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  style?: React.CSSProperties;
  className?: string;
}) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
      initialized.current = true;
    } catch {
      // Ad blocker or adsbygoogle error handled safely
    }
  }, []);

  if (!adsenseConfig.enabled || (!slot && !adsConfig.testMode)) return null;

  return (
    <div className={cn('overflow-hidden flex items-center justify-center w-full min-h-[90px]', className)}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', textAlign: 'center', ...style }}
        data-ad-client={adsenseConfig.clientId}
        {...(slot ? { 'data-ad-slot': slot } : {})}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

/**
 * Isolated iframe container for Adsterra banner scripts (fallback).
 * Isolates atOptions on the iframe's own window to avoid race conditions.
 */
export function AdsterraIframe({
  adKey,
  width,
  height,
  className,
  loading = 'lazy',
}: {
  adKey: string;
  width: number;
  height: number;
  className?: string;
  loading?: 'lazy' | 'eager';
}) {
  if (!adsterraConfig.enabled || !adKey) return null;

  const scriptHost = process.env.NEXT_PUBLIC_ADSTERRA_HOST || 'https://www.profitablecpmrate.com';
  const srcDoc = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <base target="_blank">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; overflow: hidden; background: transparent; display: flex; align-items: center; justify-content: center; }
    </style>
  </head>
  <body>
    <script type="text/javascript">
      atOptions = {
        'key' : '${adKey}',
        'format' : 'iframe',
        'height' : ${height},
        'width' : ${width},
        'params' : {}
      };
    </script>
    <script type="text/javascript" src="${scriptHost}/22/${adKey}"></script>
  </body>
</html>`;

  return (
    <div
      className={cn('flex items-center justify-center overflow-hidden', className)}
      style={{ width: '100%', minHeight: height }}
    >
      <iframe
        title={`adsterra-${adKey}`}
        width={width}
        height={height}
        loading={loading}
        scrolling="no"
        frameBorder="0"
        style={{ border: 'none', overflow: 'hidden', maxWidth: '100%' }}
        srcDoc={srcDoc}
      />
    </div>
  );
}

/**
 * Adsterra Native Banner container (fallback).
 */
export function AdsterraNativeBanner({ className }: { className?: string }) {
  if (!adsterraConfig.enabled || !adsterraConfig.slots.nativeBanner.scriptSrc) return null;

  const srcDoc = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <base target="_blank">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; min-height: 100%; overflow: hidden; background: transparent; }
    </style>
  </head>
  <body>
    <div id="${adsterraConfig.slots.nativeBanner.containerId}"></div>
    <script async="async" data-cfasync="false" src="${adsterraConfig.slots.nativeBanner.scriptSrc}"></script>
  </body>
</html>`;

  return (
    <div className={cn('my-6 w-full flex flex-col items-center justify-center overflow-hidden', className)}>
      <AdLabel />
      <div className="w-full flex items-center justify-center min-h-[160px]">
        <iframe
          title="adsterra-native-banner"
          width="100%"
          height="160"
          loading="lazy"
          scrolling="no"
          frameBorder="0"
          style={{ border: 'none', overflow: 'hidden', width: '100%', maxWidth: '960px' }}
          srcDoc={srcDoc}
        />
      </div>
    </div>
  );
}

/**
 * Universal AdBanner component maintaining backwards compatibility with all layouts.
 */
export function AdBanner({
  slot,
  format = 'auto',
  className,
  labeled = true,
}: AdBannerProps) {
  if (adsenseConfig.enabled && (slot || adsConfig.testMode)) {
    const adsenseFormat = format === 'native' ? 'auto' : format;
    return (
      <div className={cn('w-full flex flex-col items-center justify-center', className)}>
        {labeled && <AdLabel />}
        <GoogleAdSenseUnit slot={slot} format={adsenseFormat} />
      </div>
    );
  }

  if (adsterraConfig.enabled) {
    if (format === 'vertical') {
      return (
        <div className={cn('flex flex-col items-center justify-center', className)}>
          {labeled && <AdLabel />}
          <AdsterraIframe
            adKey={adsterraConfig.slots.banner160x600.key}
            width={adsterraConfig.slots.banner160x600.width}
            height={adsterraConfig.slots.banner160x600.height}
          />
        </div>
      );
    }

    if (format === 'rectangle') {
      return (
        <div className={cn('flex flex-col items-center justify-center', className)}>
          {labeled && <AdLabel />}
          <AdsterraIframe
            adKey={adsterraConfig.slots.banner300x250.key}
            width={adsterraConfig.slots.banner300x250.width}
            height={adsterraConfig.slots.banner300x250.height}
          />
        </div>
      );
    }

    if (format === 'native') {
      return <AdsterraNativeBanner className={className} />;
    }

    return (
      <div className={cn('w-full flex flex-col items-center justify-center', className)}>
        {labeled && <AdLabel />}
        <div className="hidden md:flex justify-center w-full">
          <AdsterraIframe
            adKey={adsterraConfig.slots.banner728x90.key}
            width={adsterraConfig.slots.banner728x90.width}
            height={adsterraConfig.slots.banner728x90.height}
          />
        </div>
        <div className="flex md:hidden justify-center w-full">
          <AdsterraIframe
            adKey={adsterraConfig.slots.banner320x50.key}
            width={adsterraConfig.slots.banner320x50.width}
            height={adsterraConfig.slots.banner320x50.height}
          />
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Top header leaderboard (728x90 desktop / 320x50 mobile).
 */
export function HeaderAd({ className }: { className?: string } = {}) {
  const slot = adsenseConfig.slots.header;
  if (adsenseConfig.enabled && (slot || adsConfig.testMode)) {
    return (
      <div
        className={cn('mx-auto w-full max-w-5xl px-4 py-3 lg:px-8 flex flex-col items-center', className)}
        aria-label="Advertisement"
        role="complementary"
      >
        <AdLabel />
        <GoogleAdSenseUnit
          slot={slot}
          format="horizontal"
          style={{ minHeight: 90 }}
        />
      </div>
    );
  }

  if (adsterraConfig.enabled && (adsterraConfig.slots.banner728x90.key || adsterraConfig.slots.banner320x50.key)) {
    return (
      <div
        className={cn('mx-auto w-full max-w-5xl px-4 py-3 lg:px-8 flex flex-col items-center', className)}
        aria-label="Advertisement"
        role="complementary"
      >
        <AdLabel />
        <div className="hidden md:flex justify-center w-full">
          <AdsterraIframe
            adKey={adsterraConfig.slots.banner728x90.key}
            width={728}
            height={90}
            loading="eager"
          />
        </div>
        <div className="flex md:hidden justify-center w-full">
          <AdsterraIframe
            adKey={adsterraConfig.slots.banner320x50.key}
            width={320}
            height={50}
            loading="eager"
          />
        </div>
      </div>
    );
  }

  return null;
}

/**
 * High-converting Result / Post-Processing Ad (300x250 desktop / 320x50 mobile).
 */
export function ResultScreenAd({ className }: { className?: string } = {}) {
  const slot = adsenseConfig.slots.result;
  if (adsenseConfig.enabled && (slot || adsConfig.testMode)) {
    return (
      <div
        className={cn('w-full flex flex-col items-center justify-center pt-4 mt-2 border-t border-border/40', className)}
        aria-label="Advertisement"
        role="complementary"
      >
        <AdLabel />
        <GoogleAdSenseUnit
          slot={slot}
          format="rectangle"
          style={{ minHeight: 250 }}
        />
      </div>
    );
  }

  if (adsterraConfig.enabled && (adsterraConfig.slots.banner300x250.key || adsterraConfig.slots.banner320x50.key)) {
    return (
      <div
        className={cn('w-full flex flex-col items-center justify-center pt-4 mt-2 border-t border-border/40', className)}
        aria-label="Advertisement"
        role="complementary"
      >
        <AdLabel />
        <div className="hidden sm:flex justify-center w-full">
          <AdsterraIframe
            adKey={adsterraConfig.slots.banner300x250.key}
            width={300}
            height={250}
            loading="eager"
          />
        </div>
        <div className="flex sm:hidden justify-center w-full">
          <AdsterraIframe
            adKey={adsterraConfig.slots.banner320x50.key}
            width={320}
            height={50}
            loading="eager"
          />
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Desktop sidebar skyscraper (160x600).
 */
export function SidebarAd({ className }: { className?: string } = {}) {
  const slot = adsenseConfig.slots.sidebar;
  if (adsenseConfig.enabled && (slot || adsConfig.testMode)) {
    return (
      <div className={cn('w-full flex flex-col items-center justify-center', className)} aria-label="Advertisement" role="complementary">
        <AdLabel />
        <GoogleAdSenseUnit
          slot={slot}
          format="vertical"
          style={{ minHeight: 600, width: 160 }}
        />
      </div>
    );
  }

  if (adsterraConfig.enabled && adsterraConfig.slots.banner160x600.key) {
    return (
      <div className={cn('w-full flex flex-col items-center justify-center', className)} aria-label="Advertisement" role="complementary">
        <AdLabel />
        <AdsterraIframe
          adKey={adsterraConfig.slots.banner160x600.key}
          width={160}
          height={600}
        />
      </div>
    );
  }

  return null;
}

/**
 * High-performing In-Content 300x250 Medium Rectangle (ideal for articles and tool guides).
 */
export function InContentAd({ className }: { className?: string } = {}) {
  const slot = adsenseConfig.slots.inContent;
  if (adsenseConfig.enabled && (slot || adsConfig.testMode)) {
    return (
      <div
        className={cn('my-8 w-full flex flex-col items-center justify-center', className)}
        aria-label="Advertisement"
        role="complementary"
      >
        <AdLabel />
        <GoogleAdSenseUnit
          slot={slot}
          format="rectangle"
          style={{ minHeight: 250 }}
        />
      </div>
    );
  }

  if (adsterraConfig.enabled && adsterraConfig.slots.banner300x250.key) {
    return (
      <div
        className={cn('my-8 w-full flex flex-col items-center justify-center', className)}
        aria-label="Advertisement"
        role="complementary"
      >
        <AdLabel />
        <AdsterraIframe
          adKey={adsterraConfig.slots.banner300x250.key}
          width={300}
          height={250}
        />
      </div>
    );
  }

  return null;
}

/**
 * Footer leaderboard (728x90 desktop / 320x50 mobile).
 */
export function FooterAd({ className }: { className?: string } = {}) {
  const slot = adsenseConfig.slots.footer;
  if (adsenseConfig.enabled && (slot || adsConfig.testMode)) {
    return (
      <div
        className={cn('mx-auto w-full max-w-5xl px-4 py-6 lg:px-8 flex flex-col items-center', className)}
        aria-label="Advertisement"
        role="complementary"
      >
        <AdLabel />
        <GoogleAdSenseUnit
          slot={slot}
          format="horizontal"
          style={{ minHeight: 90 }}
        />
      </div>
    );
  }

  if (adsterraConfig.enabled && (adsterraConfig.slots.banner728x90.key || adsterraConfig.slots.banner320x50.key)) {
    return (
      <div
        className={cn('mx-auto w-full max-w-5xl px-4 py-6 lg:px-8 flex flex-col items-center', className)}
        aria-label="Advertisement"
        role="complementary"
      >
        <AdLabel />
        {adsterraConfig.slots.banner728x90.key && (
          <div className="hidden md:flex justify-center w-full">
            <AdsterraIframe
              adKey={adsterraConfig.slots.banner728x90.key}
              width={728}
              height={90}
            />
          </div>
        )}
        {adsterraConfig.slots.banner320x50.key && (
          <div className="flex md:hidden justify-center w-full">
            <AdsterraIframe
              adKey={adsterraConfig.slots.banner320x50.key}
              width={320}
              height={50}
            />
          </div>
        )}
      </div>
    );
  }

  return null;
}

/**
 * Native banner ad (responsive recommendation grid).
 */
export function NativeAd({ className }: { className?: string } = {}) {
  const slot = adsenseConfig.slots.inContent;
  if (adsenseConfig.enabled && (slot || adsConfig.testMode)) {
    return (
      <div className={cn('my-6 w-full flex flex-col items-center justify-center overflow-hidden', className)} aria-label="Advertisement" role="complementary">
        <AdLabel />
        <GoogleAdSenseUnit slot={slot} format="auto" style={{ minHeight: 160 }} />
      </div>
    );
  }

  if (adsterraConfig.enabled && adsterraConfig.slots.nativeBanner.containerId) {
    return <AdsterraNativeBanner className={className} />;
  }

  return null;
}
