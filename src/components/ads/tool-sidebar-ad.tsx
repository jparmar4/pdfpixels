'use client';

import { SidebarAd, StickyRectangleAd } from '@/components/ads/ad-banner';
import { adsConfig, adsenseConfig, adsterraConfig } from '@/lib/ads-config';

/**
 * Tool & Hub sticky right-rail ad layout:
 * - Wide desktop (2xl >= 1536px): Sticky high-RPM 300x250 Banner (Unit ID 31811019) for maximum eCPM & 100% Active View
 * - Standard desktop (xl 1280px–1535px): Sticky 160x600 / 160x300 skyscraper rail
 *
 * Renders with fixed width reservations (Zero CLS).
 */
export function ToolSidebarAd() {
  const hasSidebar =
    (adsenseConfig.enabled && Boolean(adsenseConfig.slots.sidebar)) ||
    Boolean(adsConfig.slots.sidebar) ||
    Boolean(adsterraConfig.enabled && adsterraConfig.slots.banner300x250.key) ||
    adsConfig.testMode;

  if (!hasSidebar) {
    return null;
  }

  const has300x250 = adsterraConfig.enabled && Boolean(adsterraConfig.slots.banner300x250.key);

  return (
    <>
      <aside
        className={`pointer-events-none fixed right-3 top-24 z-30 hidden xl:block ${has300x250 ? '2xl:hidden' : ''} w-[180px]`}
        aria-label="Sponsored"
      >
        <div className="pointer-events-auto sticky top-24 rounded-2xl border border-border/50 bg-card/90 p-2 shadow-soft backdrop-blur-md flex flex-col items-center">
          <SidebarAd />
        </div>
      </aside>
      {has300x250 ? (
        <aside
          className="pointer-events-none fixed right-3 top-24 z-30 hidden 2xl:block w-[320px]"
          aria-label="Sponsored recommendation"
        >
          <div className="pointer-events-auto sticky top-24 rounded-2xl border border-border/50 bg-card/90 p-2.5 shadow-soft backdrop-blur-md flex flex-col items-center">
            <StickyRectangleAd instanceId="rail-2xl-300x250" eager />
          </div>
        </aside>
      ) : null}
    </>
  );
}
