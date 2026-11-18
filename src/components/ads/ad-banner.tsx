'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { adsenseConfig, adsterraConfig, adsConfig } from '@/lib/ads-config';
import { OptimizationVerificationSummary } from '@/components/layout/optimization-verification-summary';
import { WorkflowChainBar } from '@/components/layout/workflow-chain-bar';
import { useWorkflowStore } from '@/store/workflow-store';

type HorizontalTier = 'desktop' | 'tablet' | 'mobile' | null;
type ResultTier = 'rect' | 'mobile' | null;
type SidebarTier = 'tall' | 'short' | null;

function useMediaQueryMatch(query: string): boolean | null {
  const [matches, setMatches] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);

  return matches;
}

function useHorizontalTier(): HorizontalTier {
  const isDesktop = useMediaQueryMatch('(min-width: 768px)');
  const isTablet = useMediaQueryMatch('(min-width: 520px)');
  if (isDesktop === null || isTablet === null) return null;
  if (isDesktop) return 'desktop';
  if (isTablet) return 'tablet';
  return 'mobile';
}

function useResultTier(): ResultTier {
  const isWideEnough = useMediaQueryMatch('(min-width: 360px)');
  if (isWideEnough === null) return null;
  return isWideEnough ? 'rect' : 'mobile';
}

function useSidebarTier(): SidebarTier {
  const isTall = useMediaQueryMatch('(min-height: 760px)');
  if (isTall === null) return null;
  return isTall ? 'tall' : 'short';
}

interface AdBannerProps {
  slot?: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle' | 'native';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  minHeight?: number;
  labeled?: boolean;
}

function useAdLazyVisible(ref: React.RefObject<Element | null>, eager: boolean): boolean {
  const [visible, setVisible] = useState(() => eager);

  useEffect(() => {
    if (eager || visible) return;
    if (typeof IntersectionObserver === 'undefined') {
      const timer = window.setTimeout(() => setVisible(true), 0);
      return () => window.clearTimeout(timer);
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [eager, visible, ref]);

  return eager || visible;
}

function AdLabel() {
  return (
    <p className="mb-1 h-4 leading-4 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80 select-none">
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
 * eliminates CLS with explicit dimensions, supports refreshKey for multi-run tools,
 * and performs viewability-gated auto-refresh (every 55s while visible in viewport)
 * to maximize Adsterra eCPM and impressions during long user sessions.
 */
export function AdsterraIframe({
  adKey,
  width,
  height,
  className,
  loading = 'lazy',
  refreshKey,
  unitId,
  instanceId,
}: {
  adKey: string;
  width: number;
  height: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  refreshKey?: string | number;
  unitId?: string;
  instanceId?: string;
}) {
  const pathname = usePathname() || '/';
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldMount = useAdLazyVisible(containerRef, loading === 'eager');
  const [inView, setInView] = useState(false);
  const [autoTick, setAutoTick] = useState(0);

  useEffect(() => {
    setAutoTick(0);
  }, [pathname]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setInView(entry.isIntersecting && entry.intersectionRatio >= 0.5);
        }
      },
      { threshold: [0, 0.5, 1] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const timer = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        setAutoTick((prev) => (prev < 8 ? prev + 1 : prev));
      }
    }, 45000);
    return () => window.clearInterval(timer);
  }, [inView]);

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

  const compositeKey = `${pathname}-${adKey}-${instanceId ?? 'slot'}-${refreshKey ?? 'init'}-${autoTick}`;

  return (
    <div
      ref={containerRef}
      data-adsterra-unit-id={unitId}
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-xl border border-border/25 bg-muted/15',
        className
      )}
      style={{ width: '100%', maxWidth: width, minHeight: height }}
    >
      {shouldMount ? (
        <iframe
          key={compositeKey}
          title={unitId ? `adsterra-${unitId}-${adKey}` : `adsterra-${adKey}`}
          width={width}
          height={height}
          loading={loading}
          scrolling="no"
          frameBorder="0"
          style={{ border: 'none', overflow: 'hidden', maxWidth: '100%', height }}
          srcDoc={srcDoc}
        />
      ) : (
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/50">
          Sponsored slot
        </span>
      )}
    </div>
  );
}

/**
 * Adsterra Native Banner container (4-item / responsive recommendation grid).
 * Rendered inside an isolated iframe to prevent ID collisions, eliminate CLS
 * via explicit responsive min-height skeleton, lazy-load below the fold via
 * IntersectionObserver (rootMargin: "200px"), and re-key per route for fresh impressions.
 */
export function AdsterraNativeBanner({
  className,
  eager = false,
  compact = false,
}: {
  className?: string;
  eager?: boolean;
  compact?: boolean;
}) {
  const pathname = usePathname() || '/';
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldMount = useAdLazyVisible(containerRef, eager);

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

  const heightClasses = compact
    ? 'h-[260px] sm:h-[250px]'
    : 'h-[440px] sm:h-[300px] md:h-[250px]';

  return (
    <div
      ref={containerRef}
      className={cn('my-6 w-full flex flex-col items-center justify-center overflow-hidden', className)}
      aria-label="Advertisement"
      role="complementary"
    >
      <AdLabel />
      <div
        className={cn(
          'w-full max-w-[960px] flex items-center justify-center overflow-hidden rounded-xl border border-border/30 bg-muted/15',
          heightClasses
        )}
      >
        {shouldMount ? (
          <iframe
            key={`${pathname}-native-${eager ? 'eager' : 'lazy'}`}
            title="adsterra-native-banner"
            width="100%"
            height="100%"
            loading={eager ? 'eager' : 'lazy'}
            scrolling="no"
            frameBorder="0"
            style={{ border: 'none', overflow: 'hidden', width: '100%', height: '100%', maxWidth: '960px' }}
            srcDoc={srcDoc}
          />
        ) : (
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground/50">
            Advertisement
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * High-converting Adsterra Smartlink CTA button shown alongside download buttons.
 */
export function SmartlinkButton({
  className,
  label = 'Recommended PDF & Office Suite →',
}: {
  className?: string;
  label?: string;
} = {}) {
  if (!adsterraConfig.enabled || !adsterraConfig.smartlink) return null;

  return (
    <a
      href={adsterraConfig.smartlink}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-amber-400/50 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 transition-all hover:-translate-y-0.5 hover:bg-amber-100 hover:shadow-soft dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30',
        className,
      )}
    >
      <ExternalLink className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </a>
  );
}

function ResponsiveHorizontalAdsterra({ loading = 'lazy' }: { loading?: 'lazy' | 'eager' }) {
  const tier = useHorizontalTier();

  let activeSlot: { key: string; width: number; height: number } | null = null;
  if (tier === 'desktop') {
    activeSlot = adsterraConfig.slots.banner728x90.key
      ? adsterraConfig.slots.banner728x90
      : adsterraConfig.slots.banner468x60.key
        ? adsterraConfig.slots.banner468x60
        : adsterraConfig.slots.banner320x50;
  } else if (tier === 'tablet') {
    activeSlot = adsterraConfig.slots.banner468x60.key
      ? adsterraConfig.slots.banner468x60
      : adsterraConfig.slots.banner320x50;
  } else if (tier === 'mobile') {
    activeSlot = adsterraConfig.slots.banner320x50;
  }

  return (
    <div className="flex w-full max-w-[728px] items-center justify-center h-[52px] min-[520px]:h-[62px] md:h-[92px] rounded-xl border border-border/25 bg-muted/15 overflow-hidden">
      {activeSlot?.key ? (
        <AdsterraIframe
          adKey={activeSlot.key}
          width={activeSlot.width}
          height={activeSlot.height}
          loading={loading}
          className="border-0 bg-transparent rounded-none"
        />
      ) : (
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/45">
          Advertisement
        </span>
      )}
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
            unitId={adsterraConfig.slots.banner300x250.unitId}
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
 * High-converting Result / Post-Processing Ad & Verification wrapper.
 * When rendered standalone by tool workspaces (`!suppressSummary`), pairs the
 * 4-second Optimization & Verification Summary directly alongside the primary
 * Adsterra Native unit with Zero CLS, and reveals the 1-click Workflow Chaining Bar
 * immediately after the user clicks Download.
 */
export function ResultScreenAd({
  className,
  refreshKey,
  suppressSummary = false,
  suppressChainBar = false,
  originalSize,
  processedSize,
  savedPercent,
  formatLabel,
  dpiLabel,
  fileName,
}: {
  className?: string;
  refreshKey?: string | number;
  suppressSummary?: boolean;
  suppressChainBar?: boolean;
  originalSize?: number;
  processedSize?: number;
  savedPercent?: number;
  formatLabel?: string;
  dpiLabel?: string;
  fileName?: string;
} = {}) {
  const resultTier = useResultTier();
  const downloadCount = useWorkflowStore((s) => s.downloadCount);
  const lastDownloadedUrl = useWorkflowStore((s) => s.lastDownloadedUrl);
  const [baselineState, setBaselineState] = useState<{ key: string | number | boolean | null | undefined; count: number }>(() => ({
    key: refreshKey,
    count: useWorkflowStore.getState().downloadCount,
  }));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBaselineState({
        key: refreshKey,
        count: useWorkflowStore.getState().downloadCount,
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshKey]);

  const downloadedForRun = Boolean(
    (baselineState.key === refreshKey && downloadCount > baselineState.count) ||
      (refreshKey && lastDownloadedUrl && String(refreshKey) === String(lastDownloadedUrl))
  );

  const slot = adsenseConfig.slots.result;
  const resultUrlStr = typeof refreshKey === 'string' ? refreshKey : null;

  const renderPrimaryAdUnit = () => {
    if (adsenseConfig.enabled && (slot || adsConfig.testMode)) {
      return (
        <div
          className="w-full flex flex-col items-center justify-center"
          aria-label="Advertisement"
          role="complementary"
        >
          <AdLabel />
          <div className="flex w-full items-center justify-center min-h-[250px] rounded-xl border border-border/25 bg-muted/15 overflow-hidden">
            <GoogleAdSenseUnit
              slot={slot}
              format="rectangle"
              style={{ minHeight: 250 }}
            />
          </div>
        </div>
      );
    }

    if (adsterraConfig.enabled && (adsterraConfig.slots.banner300x250.key || adsterraConfig.slots.banner320x50.key)) {
      const showRect = resultTier !== 'mobile' && Boolean(adsterraConfig.slots.banner300x250.key);
      const showMobile =
        (resultTier === 'mobile' || !adsterraConfig.slots.banner300x250.key) &&
        Boolean(adsterraConfig.slots.banner320x50.key);

      return (
        <div
          className="w-full flex flex-col items-center justify-center"
          aria-label="Advertisement"
          role="complementary"
          data-adsterra-unit-id={adsterraConfig.slots.banner300x250.unitId}
        >
          <AdLabel />
          <div className="flex w-full max-w-[320px] items-center justify-center min-h-[50px] min-[360px]:min-h-[250px] rounded-xl border border-border/25 bg-muted/15 overflow-hidden">
            {showRect && (
              <AdsterraIframe
                adKey={adsterraConfig.slots.banner300x250.key}
                unitId={adsterraConfig.slots.banner300x250.unitId}
                instanceId="result-300x250"
                width={300}
                height={250}
                loading="eager"
                refreshKey={refreshKey}
                className="border-0 bg-transparent rounded-none"
              />
            )}
            {showMobile && (
              <AdsterraIframe
                adKey={adsterraConfig.slots.banner320x50.key}
                instanceId="result-320x50"
                width={320}
                height={50}
                loading="eager"
                refreshKey={refreshKey}
                className="border-0 bg-transparent rounded-none"
              />
            )}
          </div>
        </div>
      );
    }

    if (adsterraConfig.enabled && adsterraConfig.slots.nativeBanner.scriptSrc && !suppressSummary) {
      return <AdsterraNativeBanner eager compact className="my-0" />;
    }

    return null;
  };

  const adNode = renderPrimaryAdUnit();

  if (suppressSummary) {
    if (!adNode && suppressChainBar) return null;
    return (
      <div className={cn('w-full pt-4 mt-2 border-t border-border/40', className)}>
        {adNode}
        {!suppressChainBar && (
          <WorkflowChainBar
            visible={downloadedForRun}
            outputOverride={{ url: resultUrlStr, fileName, originalSize, processedSize, savedPercent }}
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn('w-full space-y-4 pt-4 mt-3 border-t border-border/40', className)}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,1fr)] lg:items-start">
        <OptimizationVerificationSummary
          originalSize={originalSize}
          processedSize={processedSize}
          savedPercent={savedPercent}
          formatLabel={formatLabel}
          dpiLabel={dpiLabel}
          resultUrl={resultUrlStr}
          fileName={fileName}
        />
        {adNode ? <div className="min-w-0">{adNode}</div> : null}
      </div>

      {!suppressChainBar && (
        <WorkflowChainBar
          visible={downloadedForRun}
          outputOverride={{ url: resultUrlStr, fileName, originalSize, processedSize, savedPercent }}
        />
      )}
    </div>
  );
}

/**
 * Desktop sidebar skyscraper (160x600 on tall viewports, 160x300 on shorter laptop screens).
 */
export function SidebarAd({ className }: { className?: string } = {}) {
  const sidebarTier = useSidebarTier();
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
    const showTall =
      sidebarTier === 'tall'
        ? Boolean(adsterraConfig.slots.banner160x600.key)
        : sidebarTier === 'short' && !adsterraConfig.slots.banner160x300.key && Boolean(adsterraConfig.slots.banner160x600.key);
    const showShort =
      sidebarTier === 'short'
        ? Boolean(adsterraConfig.slots.banner160x300.key)
        : sidebarTier === 'tall' && !adsterraConfig.slots.banner160x600.key && Boolean(adsterraConfig.slots.banner160x300.key);

    return (
      <div className={cn('w-full flex flex-col items-center justify-center', className)} aria-label="Advertisement" role="complementary">
        <AdLabel />
        <div className="flex w-[160px] items-center justify-center min-h-[300px] [@media(min-height:760px)]:min-h-[600px] rounded-xl border border-border/25 bg-muted/15 overflow-hidden">
          {showTall && (
            <AdsterraIframe
              adKey={adsterraConfig.slots.banner160x600.key}
              width={160}
              height={600}
              loading="eager"
              className="border-0 bg-transparent rounded-none"
            />
          )}
          {showShort && (
            <AdsterraIframe
              adKey={adsterraConfig.slots.banner160x300.key}
              width={160}
              height={300}
              loading="eager"
              className="border-0 bg-transparent rounded-none"
            />
          )}
        </div>
      </div>
    );
  }

  return null;
}

/**
 * High-RPM Dual 300x250 Medium Rectangle Unit (Adsterra Unit ID 31811019).
 * Renders two side-by-side 300x250 units on desktop (md+) and one centered
 * 300x250 unit on mobile, with explicit Zero-CLS min-height reservation.
 */
export function DualRectangleAd({
  className,
  eager = false,
  instanceId = 'dual',
}: {
  className?: string;
  eager?: boolean;
  instanceId?: string;
} = {}) {
  const isDesktop = useMediaQueryMatch('(min-width: 768px)');
  if (!adsterraConfig.enabled || !adsterraConfig.slots.banner300x250.key) return null;

  const { key, unitId } = adsterraConfig.slots.banner300x250;
  const loadingMode = eager ? 'eager' : 'lazy';

  return (
    <div
      className={cn('my-8 w-full min-h-[270px] flex flex-col items-center justify-center px-2', className)}
      aria-label="Advertisement"
      role="complementary"
      data-adsterra-unit-id={unitId}
    >
      <AdLabel />
      <div className="flex w-full max-w-[640px] flex-col items-center justify-center gap-4 md:flex-row">
        <AdsterraIframe
          adKey={key}
          unitId={unitId}
          instanceId={`${instanceId}-a`}
          width={300}
          height={250}
          loading={loadingMode}
        />
        <div className="hidden md:flex w-[300px] min-h-[250px] items-center justify-center">
          {isDesktop ? (
            <AdsterraIframe
              adKey={key}
              unitId={unitId}
              instanceId={`${instanceId}-b`}
              width={300}
              height={250}
              loading={loadingMode}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * High-performing In-Content Ad Unit (supports single 300x250 Medium Rectangle,
 * dual desktop 300x250 Medium Rectangle pair [Adsterra ID 31811019], or
 * Zero-CLS responsive horizontal banner 728x90 / 468x60 / 320x50).
 */
export function InContentAd({
  className,
  variant = 'rectangle',
  eager = false,
  instanceId = 'incontent',
}: {
  className?: string;
  variant?: 'rectangle' | 'dual-rectangle' | 'responsive';
  eager?: boolean;
  instanceId?: string;
} = {}) {
  const slot = adsenseConfig.slots.inContent;
  const isResponsive = variant === 'responsive';
  const isDual = variant === 'dual-rectangle';

  if (adsenseConfig.enabled && (slot || adsConfig.testMode)) {
    return (
      <div
        className={cn(
          'my-8 w-full flex flex-col items-center justify-center',
          isResponsive
            ? 'min-h-[72px] min-[520px]:min-h-[82px] md:min-h-[112px]'
            : 'min-h-[270px]',
          className
        )}
        aria-label="Advertisement"
        role="complementary"
      >
        <AdLabel />
        <GoogleAdSenseUnit
          slot={slot}
          format={isResponsive ? 'horizontal' : 'rectangle'}
          style={{ minHeight: isResponsive ? 90 : 250 }}
        />
      </div>
    );
  }

  if (isDual) {
    return <DualRectangleAd className={className} eager={eager} instanceId={instanceId} />;
  }

  if (isResponsive) {
    if (
      adsterraConfig.enabled &&
      (adsterraConfig.slots.banner728x90.key ||
        adsterraConfig.slots.banner468x60.key ||
        adsterraConfig.slots.banner320x50.key)
    ) {
      return (
        <div
          className={cn(
            'my-8 w-full min-h-[72px] min-[520px]:min-h-[82px] md:min-h-[112px] flex flex-col items-center justify-center',
            className
          )}
          aria-label="Advertisement"
          role="complementary"
        >
          <AdLabel />
          <ResponsiveHorizontalAdsterra loading={eager ? 'eager' : 'lazy'} />
        </div>
      );
    }

    return null;
  }

  if (adsterraConfig.enabled && adsterraConfig.slots.banner300x250.key) {
    return (
      <div
        className={cn('my-8 w-full min-h-[270px] flex flex-col items-center justify-center', className)}
        aria-label="Advertisement"
        role="complementary"
        data-adsterra-unit-id={adsterraConfig.slots.banner300x250.unitId}
      >
        <AdLabel />
        <AdsterraIframe
          adKey={adsterraConfig.slots.banner300x250.key}
          unitId={adsterraConfig.slots.banner300x250.unitId}
          instanceId={instanceId}
          width={300}
          height={250}
          loading={eager ? 'eager' : 'lazy'}
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
export function NativeAd({
  className,
  eager = false,
}: {
  className?: string;
  eager?: boolean;
} = {}) {
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
    return <AdsterraNativeBanner className={className} eager={eager} />;
  }

  return null;
}
