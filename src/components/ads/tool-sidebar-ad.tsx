'use client';

import { SidebarAd } from '@/components/ads/ad-banner';
import { adsConfig, adsenseConfig } from '@/lib/ads-config';

/**
 * Tool-page ad layout:
 * - Desktop (≥1400px): sticky right rail (160×600 / responsive)
 * - Below that: a single in-content unit between header and tool UI
 *
 * Renders when ads are enabled, ensuring maximum viewability and revenue
 * without shifting layout (zero CLS).
 */
export function ToolSidebarAd() {
  const hasSidebar =
    (adsenseConfig.enabled && Boolean(adsenseConfig.slots.sidebar)) ||
    Boolean(adsConfig.slots.sidebar) ||
    adsConfig.testMode;

  if (!hasSidebar) {
    return null;
  }

  return (
    <>
      {hasSidebar ? (
        <aside
          className="pointer-events-none fixed right-3 top-24 z-30 hidden w-[180px] xl:block"
          aria-label="Sponsored"
        >
          <div className="pointer-events-auto sticky top-24 rounded-2xl border border-border/50 bg-card/90 p-2 shadow-soft backdrop-blur-md flex flex-col items-center">
            <SidebarAd />
          </div>
        </aside>
      ) : null}
    </>
  );
}
