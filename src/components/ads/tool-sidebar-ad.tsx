'use client';

import { SidebarAd } from '@/components/ads/ad-banner';
import { adsConfig } from '@/lib/ads-config';

/**
 * Tool-page ad layout:
 * - Desktop (≥1400px): sticky right rail (300×250+)
 * - Below that: a single in-content unit between header and tool UI
 *
 * Renders nothing when ads are disabled and not in test mode,
 * so pages don't show empty "Sponsored" chrome.
 */
export function ToolSidebarAd() {
  const hasSidebar = Boolean(adsConfig.slots.sidebar) || adsConfig.testMode;
  const hasInContent = Boolean(adsConfig.slots.inContent) || adsConfig.testMode;

  if (!adsConfig.enabled && !adsConfig.testMode) {
    return null;
  }

  if (!hasSidebar && !hasInContent) {
    return null;
  }

  return (
    <>
      {hasSidebar ? (
        <aside
          className="pointer-events-none fixed right-4 top-24 z-30 hidden w-[300px] min-[1400px]:block"
          aria-label="Sponsored"
        >
          <div className="pointer-events-auto sticky top-24 rounded-2xl border border-border/50 bg-card/90 p-3 shadow-soft backdrop-blur-md">
            <SidebarAd />
          </div>
        </aside>
      ) : null}
    </>
  );
}
