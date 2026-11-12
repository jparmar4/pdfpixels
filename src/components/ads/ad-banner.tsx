'use client';

import { useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
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
 * Isolated iframe container for Adsterra banner scripts.
 * Isolates atOptions on the iframe's own window to avoid race conditions,
 * eliminates CLS with explicit dimensions, and supports refreshKey for multi-run tools.
 */
export function AdsterraIframe({
  adKey,
  width,
  height,
  className,
  loading = 'lazy',
  refreshKey,
}: {
  adKey: string;
  width: number;
  height: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  refreshKey?: string | number;
}) {
  if (!adsterraConfig.enabled || !adKey) return null;

  const scriptHost = adsterraConfig.scriptHost || 'https://bauval.org';
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
        key={refreshKey !== undefined ? `${adKey}-${refreshKey}` : adKey}
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
 * Adsterra Native Banner container (4-item / responsive recommendation grid).
 * Rendered inside an isolated iframe to prevent ID collisions, eliminate CLS,
 * and guarantee reliable impression tracking across App Router page navigations.
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
      <div className="w-full flex items-center justify-center min-h-[240px]">
        <iframe
          title="adsterra-native-banner"
          width="100%"
          height="240"
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
 * High-converting Adsterra Smartlink CTA button shown alongside download buttons.
 */
export function SmartlinkButton({ className }: { className?: string } = {}) {
  if (!adsterraConfig.enabled || !adsterraConfig.smartlink) return null;

  return (
    <a
      href={adsterraConfig.smartlink}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-amber-400/50 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition-all hover:-translate-y-0.5 hover:bg-amber-100 hover:shadow-soft dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30',
        className,
      )}
    >
      <ExternalLink className="h-4 w-4 shrink-0" />
      <span>🎯 Get More PDF &amp; Office Tools →</span>
    </a>
  );
}

function ResponsiveHorizontalAdsterra({ loading = 'lazy' }: { loading?: 'lazy' | 'eager' }) {
  return (
    <>
      {adsterraConfig.slots.banner728x90.key && (
        <div className="hidden md:flex justify-center w-full">
          <AdsterraIframe
            adKey={adsterraConfig.slots.banner728x90.key}
            width={adsterraConfig.slots.banner728x90.width}
            height={adsterraConfig.slots.banner728x90.height}
            loading={loading}
          />
        </div>
      )}
      {adsterraConfig.slots.banner468x60.key && (
        <div className="hidden min-[520px]:flex md:hidden justify-center w-full">
          <AdsterraIframe
            adKey={adsterraConfig.slots.banner468x60.key}
            width={adsterraConfig.slots.banner468x60.width}
            height={adsterraConfig.slots.banner468x60.height}
            loading={loading}
          />
        </div>
      )}
      {adsterraConfig.slots.banner320x50.key && (
        <div className="flex min-[520px]:hidden justify-center w-full">
          <AdsterraIframe
            adKey={adsterraConfig.slots.banner320x50.key}
            width={adsterraConfig.slots.banner320x50.width}
            height={adsterraConfig.slots.banner320x50.height}
            loading={loading}
          />
        </div>
      )}
    </>
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
        <ResponsiveHorizontalAdsterra />
      </div>
    );
  }

  return null;
}

/**
 * Top header leaderboard (728x90 desktop / 468x60 tablet / 320x50 mobile).
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

  if (
    adsterraConfig.enabled &&
    (adsterraConfig.slots.banner728x90.key ||
      adsterraConfig.slots.banner468x60.key ||
      adsterraConfig.slots.banner320x50.key)
  ) {
    return (
      <div
        className={cn('mx-auto w-full max-w-5xl px-4 py-3 lg:px-8 flex flex-col items-center', className)}
        aria-label="Advertisement"
        role="complementary"
      >
        <AdLabel />
        <ResponsiveHorizontalAdsterra loading="eager" />
      </div>
    );
  }

  return null;
}

/**
 * High-converting Result / Post-Processing Ad (300x250 down to 360px+ screens / 320x50 on narrow mobile).
 */
export function ResultScreenAd({
  className,
  refreshKey,
}: {
  className?: string;
  refreshKey?: string | number;
} = {}) {
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
        {adsterraConfig.slots.banner300x250.key && (
          <div className="hidden min-[360px]:flex justify-center w-full">
            <AdsterraIframe
              adKey={adsterraConfig.slots.banner300x250.key}
              width={300}
              height={250}
              loading="eager"
              refreshKey={refreshKey}
            />
          </div>
        )}
        {adsterraConfig.slots.banner320x50.key && (
          <div className="flex min-[360px]:hidden justify-center w-full">
            <AdsterraIframe
              adKey={adsterraConfig.slots.banner320x50.key}
              width={320}
              height={50}
              loading="eager"
              refreshKey={refreshKey}
            />
          </div>
        )}
      </div>
    );
  }

  return null;
}

/**
 * Desktop sidebar skyscraper (160x600 on tall viewports, 160x300 on shorter laptop screens).
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

  if (
    adsterraConfig.enabled &&
    (adsterraConfig.slots.banner160x600.key || adsterraConfig.slots.banner160x300.key)
  ) {
    return (
      <div className={cn('w-full flex flex-col items-center justify-center', className)} aria-label="Advertisement" role="complementary">
        <AdLabel />
        {adsterraConfig.slots.banner160x600.key && (
          <div className={cn(adsterraConfig.slots.banner160x300.key ? 'hidden [@media(min-height:760px)]:flex' : 'flex', 'justify-center')}>
            <AdsterraIframe
              adKey={adsterraConfig.slots.banner160x600.key}
              width={160}
              height={600}
            />
          </div>
        )}
        {adsterraConfig.slots.banner160x300.key && (
          <div className={cn(adsterraConfig.slots.banner160x600.key ? 'flex [@media(min-height:760px)]:hidden' : 'flex', 'justify-center')}>
            <AdsterraIframe
              adKey={adsterraConfig.slots.banner160x300.key}
              width={160}
              height={300}
            />
          </div>
        )}
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

  if (
    adsterraConfig.enabled &&
    (adsterraConfig.slots.banner728x90.key ||
      adsterraConfig.slots.banner468x60.key ||
      adsterraConfig.slots.banner320x50.key)
  ) {
    return (
      <div
        className={cn('mx-auto w-full max-w-5xl px-4 py-6 lg:px-8 flex flex-col items-center', className)}
        aria-label="Advertisement"
        role="complementary"
      >
        <AdLabel />
        <ResponsiveHorizontalAdsterra />
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
