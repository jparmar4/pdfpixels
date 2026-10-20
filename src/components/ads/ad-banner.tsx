'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { adsterraConfig } from '@/lib/ads-config';

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
 * Isolated iframe container for Adsterra banner scripts.
 * Isolates `atOptions` on the iframe's own window to avoid race conditions,
 * eliminates CLS with explicit width/height, and prevents Next.js hydration issues.
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
    <script type="text/javascript" src="https://bauval.org/22/${adKey}"></script>
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
 * Adsterra Native Banner container (4-item / responsive recommendation grid)
 */
export function AdsterraNativeBanner({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    if (!adsterraConfig.enabled || isLoaded.current || !containerRef.current) return;
    isLoaded.current = true;

    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = adsterraConfig.slots.nativeBanner.scriptSrc;
    document.body.appendChild(script);
  }, []);

  if (!adsterraConfig.enabled) return null;

  return (
    <div className={cn('my-6 w-full flex flex-col items-center justify-center overflow-hidden', className)}>
      <AdLabel />
      <div
        id={adsterraConfig.slots.nativeBanner.containerId}
        ref={containerRef}
        className="w-full min-h-[140px] flex items-center justify-center"
      />
    </div>
  );
}

/**
 * Universal AdBanner component maintaining backwards compatibility with any slot call.
 */
export function AdBanner({
  format = 'auto',
  className,
  labeled = true,
}: AdBannerProps) {
  if (!adsterraConfig.enabled) return null;

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

  // Horizontal (default) - responsive 728x90 on desktop, 320x50 on mobile
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

/**
 * Top header leaderboard (728x90 on desktop, 320x50 on mobile).
 * Uses loading="eager" so immediate landing page impressions count reliably.
 */
export function HeaderAd({ className }: { className?: string } = {}) {
  if (!adsterraConfig.enabled) return null;
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

/**
 * High-converting Result / Post-Processing Ad (300x250 on desktop, 320x50 on mobile).
 * Displayed directly under the download button where user engagement and CTR are highest.
 */
export function ResultScreenAd({ className }: { className?: string } = {}) {
  if (!adsterraConfig.enabled) return null;
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

/**
 * Desktop sidebar skyscraper (160x600 wide skyscraper)
 */
export function SidebarAd({ className }: { className?: string } = {}) {
  if (!adsterraConfig.enabled) return null;
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

/**
 * High-performing In-Content 300x250 Medium Rectangle (ideal for articles and tool post-processing)
 */
export function InContentAd({ className }: { className?: string } = {}) {
  if (!adsterraConfig.enabled) return null;
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

/**
 * Footer leaderboard (728x90 on desktop, 320x50 on mobile)
 */
export function FooterAd({ className }: { className?: string } = {}) {
  if (!adsterraConfig.enabled) return null;
  return (
    <div
      className={cn('mx-auto w-full max-w-5xl px-4 py-6 lg:px-8 flex flex-col items-center', className)}
      aria-label="Advertisement"
      role="complementary"
    >
      <AdLabel />
      <div className="hidden md:flex justify-center w-full">
        <AdsterraIframe
          adKey={adsterraConfig.slots.banner728x90.key}
          width={728}
          height={90}
        />
      </div>
      <div className="flex md:hidden justify-center w-full">
        <AdsterraIframe
          adKey={adsterraConfig.slots.banner320x50.key}
          width={320}
          height={50}
        />
      </div>
    </div>
  );
}

/**
 * Native banner ad
 */
export function NativeAd({ className }: { className?: string } = {}) {
  if (!adsterraConfig.enabled) return null;
  return <AdsterraNativeBanner className={className} />;
}
