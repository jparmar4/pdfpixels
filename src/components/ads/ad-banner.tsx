'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { adsenseConfig, adsterraConfig, adsConfig, hasAdvertisingConsent } from '@/lib/ads-config';
import { OptimizationVerificationSummary } from '@/components/layout/optimization-verification-summary';
import { WorkflowChainBar } from '@/components/layout/workflow-chain-bar';
import { useWorkflowStore } from '@/store/workflow-store';

function useAdvertisingConsent(): boolean {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const sync = () => setConsented(hasAdvertisingConsent());
    sync();
    window.addEventListener('cookie-consent-updated', sync);
    return () => window.removeEventListener('cookie-consent-updated', sync);
  }, []);

  return consented;
}

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
      { rootMargin: '350px', threshold: 0 }
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
  const adConsent = useAdvertisingConsent();
  const initialized = useRef(false);

  useEffect(() => {
    if (!adConsent || initialized.current) return;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
      initialized.current = true;
    } catch {
      // Ad blocker or adsbygoogle error handled safely
    }
  }, [adConsent]);

  if (!adConsent || !adsenseConfig.enabled || (!slot && !adsConfig.testMode)) return null;

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

function buildBannerFallbackHtml(width: number, height: number, smartlink: string): string {
  const safeHref = smartlink.replace(/"/g, '&quot;');
  const isCompact = height <= 60;
  const isVertical = height >= 300 && width <= 200;

  if (isVertical) {
    return `<a id="pp-smartlink-fallback" href="${safeHref}" target="_blank" rel="noopener noreferrer sponsored" style="display:none;flex-direction:column;justify-content:space-between;align-items:center;width:100%;height:100%;padding:18px 12px;border-radius:12px;background:linear-gradient(160deg,#4f46e5 0%,#312e81 100%);color:#fff;text-decoration:none;font-family:system-ui,-apple-system,sans-serif;text-align:center;box-sizing:border-box;">
      <span style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;background:rgba(255,255,255,0.16);padding:4px 8px;border-radius:999px;">Sponsored</span>
      <div>
        <div style="font-size:16px;font-weight:800;line-height:1.25;margin-bottom:8px;">PDF &amp; Office Pro Tools</div>
        <div style="font-size:12px;line-height:1.4;opacity:0.9;">Compress, sign, convert &amp; organize documents faster.</div>
      </div>
      <span style="display:inline-block;background:#fff;color:#312e81;font-size:12px;font-weight:700;padding:8px 14px;border-radius:8px;width:100%;">Explore Offer &rarr;</span>
    </a>`;
  }

  if (isCompact) {
    return `<a id="pp-smartlink-fallback" href="${safeHref}" target="_blank" rel="noopener noreferrer sponsored" style="display:none;align-items:center;justify-content:space-between;gap:10px;width:100%;height:100%;padding:0 12px;border-radius:10px;background:linear-gradient(90deg,#4f46e5 0%,#3730a3 100%);color:#fff;text-decoration:none;font-family:system-ui,-apple-system,sans-serif;box-sizing:border-box;">
      <div style="display:flex;align-items:center;gap:8px;min-width:0;">
        <span style="font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;background:rgba(255,255,255,0.18);padding:2px 6px;border-radius:999px;flex-shrink:0;">Ad</span>
        <span style="font-size:${width <= 340 ? '11px' : '13px'};font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Recommended PDF &amp; Office Productivity Suite</span>
      </div>
      <span style="background:#fff;color:#312e81;font-size:11px;font-weight:700;padding:5px 10px;border-radius:6px;flex-shrink:0;">Open &rarr;</span>
    </a>`;
  }

  if (height <= 120) {
    return `<a id="pp-smartlink-fallback" href="${safeHref}" target="_blank" rel="noopener noreferrer sponsored" style="display:none;align-items:center;justify-content:space-between;gap:16px;width:100%;height:100%;padding:0 20px;border-radius:12px;background:linear-gradient(90deg,#4f46e5 0%,#312e81 100%);color:#fff;text-decoration:none;font-family:system-ui,-apple-system,sans-serif;box-sizing:border-box;">
      <div style="min-width:0;">
        <div style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;opacity:0.85;margin-bottom:3px;">Sponsored Partner</div>
        <div style="font-size:15px;font-weight:800;line-height:1.2;">Upgrade Your PDF &amp; Document Workflow</div>
      </div>
      <span style="background:#fff;color:#312e81;font-size:13px;font-weight:700;padding:9px 16px;border-radius:8px;flex-shrink:0;">Continue &rarr;</span>
    </a>`;
  }

  return `<a id="pp-smartlink-fallback" href="${safeHref}" target="_blank" rel="noopener noreferrer sponsored" style="display:none;flex-direction:column;justify-content:space-between;width:100%;height:100%;padding:20px;border-radius:12px;background:linear-gradient(145deg,#4f46e5 0%,#312e81 100%);color:#fff;text-decoration:none;font-family:system-ui,-apple-system,sans-serif;box-sizing:border-box;">
    <span style="align-self:flex-start;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;background:rgba(255,255,255,0.16);padding:4px 9px;border-radius:999px;">Sponsored Recommendation</span>
    <div>
      <div style="font-size:18px;font-weight:800;line-height:1.25;margin-bottom:8px;">All-in-One PDF &amp; Office Productivity Suite</div>
      <div style="font-size:13px;line-height:1.45;opacity:0.9;">Fast document conversion, compression, and workflow utilities tailored for everyday files.</div>
    </div>
    <span style="display:block;text-align:center;background:#fff;color:#312e81;font-size:13px;font-weight:700;padding:10px 16px;border-radius:8px;">Explore Recommended Tool &rarr;</span>
  </a>`;
}

function buildNativeFallbackHtml(smartlink: string): string {
  const safeHref = smartlink.replace(/"/g, '&quot;');
  const cards = [
    { badge: 'Featured', title: 'High-Speed PDF Compression & Merge', cta: 'Try Now' },
    { badge: 'Productivity', title: 'Cloud Document & E-Signature Suite', cta: 'Explore' },
    { badge: 'Utilities', title: 'Smart File Converter & OCR Scanner', cta: 'Learn More' },
    { badge: 'Recommended', title: 'Complete Office Workflow Toolkit', cta: 'Open' },
  ];
  const cardHtml = cards
    .map(
      (c) => `<a href="${safeHref}" target="_blank" rel="noopener noreferrer sponsored" style="display:flex;flex-direction:column;justify-content:space-between;gap:8px;padding:14px;border-radius:12px;border:1px solid rgba(99,102,241,0.22);background:linear-gradient(160deg,rgba(79,70,229,0.08),rgba(49,46,129,0.03));color:#1e293b;text-decoration:none;">
        <span style="align-self:flex-start;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#4f46e5;">${c.badge}</span>
        <div style="font-size:13px;font-weight:700;line-height:1.35;">${c.title}</div>
        <span style="font-size:12px;font-weight:700;color:#4f46e5;">${c.cta} &rarr;</span>
      </a>`
    )
    .join('');
  return `<div id="pp-native-fallback" style="display:none;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;width:100%;padding:12px;font-family:system-ui,-apple-system,sans-serif;">${cardHtml}</div>`;
}

/**
 * Same-origin isolated iframe container for Adsterra banner scripts.
 * Runs in a dedicated window so `atOptions` globals never collide across slots,
 * preserves `document.referrer` and cookie/top-window access required by Adsterra's
 * loader, adds automatic secondary CDN failover (`highperformanceformat.com`),
 * reveals a Smartlink fallback on no-fill so zero blank boxes appear, and refreshes
 * while visible during long tool sessions to maximize eCPM and impressions.
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
  const adConsent = useAdvertisingConsent();
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldMount = useAdLazyVisible(containerRef, loading === 'eager');
  const [inView, setInView] = useState(false);
  const [tickState, setTickState] = useState<{ path: string; count: number }>({
    path: pathname,
    count: 0,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setInView(entry.isIntersecting && entry.intersectionRatio >= 0.45);
        }
      },
      { threshold: [0, 0.45, 1] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldMount]);

  useEffect(() => {
    if (!inView || !shouldMount) return;
    const timer = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        setTickState((prev) => {
          const base = prev.path === pathname ? prev.count : 0;
          return base < 6 ? { path: pathname, count: base + 1 } : prev;
        });
      }
    }, 55000);
    return () => window.clearInterval(timer);
  }, [inView, pathname, shouldMount]);

  if (!adConsent || !adsterraConfig.enabled || !adKey) return null;

  const autoTick = tickState.path === pathname ? tickState.count : 0;
  const scriptHost = adsterraConfig.scriptHost || 'https://bauval.org';
  const fallbackHost = adsterraConfig.fallbackScriptHost || 'https://www.highperformanceformat.com';
  const fallbackHtml = adsterraConfig.smartlink
    ? buildBannerFallbackHtml(width, height, adsterraConfig.smartlink)
    : '';

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
    <script>
      try {
        if (!document.referrer && window.top && window.top.location) {
          Object.defineProperty(document, 'referrer', {
            get: function() { return window.top.location.href; },
            configurable: true
          });
        }
      } catch (e) {}
    </script>
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
      window.__ppAdFallbackLoaded = false;
      function __ppLoadFallback() {
        if (window.__ppAdFallbackLoaded) return;
        window.__ppAdFallbackLoaded = true;
        try {
          window.atOptions = { 'key': '${adKey}', 'format': 'iframe', 'height': ${height}, 'width': ${width}, 'params': {} };
          var s = document.createElement('script');
          s.type = 'text/javascript';
          s.src = '${fallbackHost}/${adKey}/invoke.js';
          document.body.appendChild(s);
        } catch (e) {}
      }
    </script>
    <script type="text/javascript" src="${scriptHost}/22/${adKey}" onerror="__ppLoadFallback()"></script>
    ${fallbackHtml}
    <script>
      (function() {
        var fb = document.getElementById('pp-smartlink-fallback');
        if (!fb) return;
        function hasCreative() {
          var direct = document.querySelectorAll('a[id^="atLink-"], body > a:not(#pp-smartlink-fallback), body > img, ins');
          if (direct.length > 0) return true;
          var frames = document.querySelectorAll('iframe');
          for (var i = 0; i < frames.length; i++) {
            var fr = frames[i];
            if (fr.src && fr.src !== 'about:blank' && fr.src.indexOf('https://') === 0) return true;
            try {
              var doc = fr.contentDocument || (fr.contentWindow && fr.contentWindow.document);
              if (doc && doc.body && doc.body.querySelector('a, img, ins, video, canvas, iframe, div')) return true;
            } catch (e) {
              return true;
            }
          }
          return false;
        }
        function syncFallback() {
          if (hasCreative()) {
            fb.style.display = 'none';
          } else {
            fb.style.display = 'flex';
          }
        }
        setTimeout(syncFallback, 3200);
        setTimeout(syncFallback, 5500);
        if (typeof MutationObserver !== 'undefined') {
          var obs = new MutationObserver(function() {
            if (hasCreative()) fb.style.display = 'none';
          });
          obs.observe(document.body, { childList: true, subtree: true });
        }
      })();
    </script>
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
          title={unitId ? `Sponsored slot ${unitId}` : 'Advertisement'}
          referrerPolicy="no-referrer-when-downgrade"
          width={width}
          height={height}
          loading="eager"
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
 * Rendered inside a same-origin dedicated iframe so Adsterra's native script can
 * read top-window metadata cleanly while preventing CSS/ID collisions across routes,
 * with a Smartlink grid fallback if unfilled after 3.5s.
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
  const adConsent = useAdvertisingConsent();
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldMount = useAdLazyVisible(containerRef, eager);

  if (!adConsent || !adsterraConfig.enabled || !adsterraConfig.slots.nativeBanner.scriptSrc) return null;

  const containerId = adsterraConfig.slots.nativeBanner.containerId;
  const fallbackHtml = adsterraConfig.smartlink
    ? buildNativeFallbackHtml(adsterraConfig.smartlink)
    : '';

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
    <script>
      try {
        if (!document.referrer && window.top && window.top.location) {
          Object.defineProperty(document, 'referrer', {
            get: function() { return window.top.location.href; },
            configurable: true
          });
        }
      } catch (e) {}
    </script>
  </head>
  <body>
    <div id="${containerId}"></div>
    <script async="async" data-cfasync="false" src="${adsterraConfig.slots.nativeBanner.scriptSrc}"></script>
    ${fallbackHtml}
    <script>
      (function() {
        var box = document.getElementById('${containerId}');
        var fb = document.getElementById('pp-native-fallback');
        if (!box || !fb) return;
        function isFilled() {
          return Boolean(box.querySelector('a, img, [class*="__bn"]'));
        }
        function check() {
          fb.style.display = isFilled() ? 'none' : 'grid';
        }
        setTimeout(check, 3500);
        setTimeout(check, 6000);
        if (typeof MutationObserver !== 'undefined') {
          var obs = new MutationObserver(function() {
            if (isFilled()) fb.style.display = 'none';
          });
          obs.observe(box, { childList: true, subtree: true });
        }
      })();
    </script>
  </body>
</html>`;

  const heightClasses = compact
    ? 'h-[260px] sm:h-[250px]'
    : 'h-[440px] sm:h-[300px] md:h-[250px]';

  return (
    <div
      ref={containerRef}
      data-ad-slot="native-banner"
      className={cn('my-6 w-full flex flex-col items-center justify-center overflow-hidden', className)}
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
            title="Sponsored recommendations"
            referrerPolicy="no-referrer-when-downgrade"
            width="100%"
            height="100%"
            loading="eager"
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
  const adConsent = useAdvertisingConsent();
  if (!adConsent) return null;

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
  const adConsent = useAdvertisingConsent();
  if (!adConsent) return null;

  const slot = adsenseConfig.slots.header;
  if (adsenseConfig.enabled && (slot || adsConfig.testMode)) {
    return (
      <div
        className={cn('mx-auto w-full max-w-5xl px-4 py-3 lg:px-8 flex flex-col items-center', className)}
        data-ad-slot="header"
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
        data-ad-slot="header"
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
  const adConsent = useAdvertisingConsent();
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
    if (!adConsent) return null;

    if (adsenseConfig.enabled && (slot || adsConfig.testMode)) {
      return (
        <div
          className="w-full flex flex-col items-center justify-center"
          data-ad-slot="result"
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
          data-ad-slot="result"
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
  const adConsent = useAdvertisingConsent();
  const sidebarTier = useSidebarTier();
  if (!adConsent) return null;

  const slot = adsenseConfig.slots.sidebar;
  if (adsenseConfig.enabled && (slot || adsConfig.testMode)) {
    return (
      <div className={cn('w-full flex flex-col items-center justify-center', className)} data-ad-slot="sidebar">
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
      <div className={cn('w-full flex flex-col items-center justify-center', className)} data-ad-slot="sidebar">
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
  const adConsent = useAdvertisingConsent();
  const isDesktop = useMediaQueryMatch('(min-width: 768px)');
  if (!adConsent || !adsterraConfig.enabled || !adsterraConfig.slots.banner300x250.key) return null;

  const { key, unitId } = adsterraConfig.slots.banner300x250;
  const loadingMode = eager ? 'eager' : 'lazy';

  return (
    <div
      className={cn('my-8 w-full min-h-[270px] flex flex-col items-center justify-center px-2', className)}
      data-ad-slot={`dual-${instanceId}`}
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
  const adConsent = useAdvertisingConsent();
  if (!adConsent) return null;

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
        data-ad-slot={`incontent-${instanceId}`}
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
          data-ad-slot={`incontent-responsive-${instanceId}`}
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
        data-ad-slot={`incontent-rect-${instanceId}`}
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
  const adConsent = useAdvertisingConsent();
  if (!adConsent) return null;

  const slot = adsenseConfig.slots.footer;
  if (adsenseConfig.enabled && (slot || adsConfig.testMode)) {
    return (
      <div
        className={cn('mx-auto w-full max-w-5xl px-4 py-6 lg:px-8 flex flex-col items-center', className)}
        data-ad-slot="footer"
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
        data-ad-slot="footer"
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
  const adConsent = useAdvertisingConsent();
  if (!adConsent) return null;

  const slot = adsenseConfig.slots.inContent;
  if (adsenseConfig.enabled && (slot || adsConfig.testMode)) {
    return (
      <div className={cn('my-6 w-full flex flex-col items-center justify-center overflow-hidden', className)} data-ad-slot="native">
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
