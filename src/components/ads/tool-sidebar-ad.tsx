'use client';

import { AdBanner, SidebarAd } from '@/components/ads/ad-banner';
import { adsConfig } from '@/lib/ads-config';

export function ToolSidebarAd() {
  return (
    <>
      {/* Floating Sidebar for large screens (>= 1400px) */}
      <aside className="pointer-events-none fixed right-5 top-24 z-30 hidden min-[1400px]:block animate-fade-in" aria-label="Sidebar Advertisement">
        <div className="pointer-events-auto w-[300px] rounded-[1.75rem] border border-border/60 bg-card/85 p-3 shadow-premium backdrop-blur-xl">
          <p className="px-2 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Sponsored
          </p>
          <div className="mt-3 overflow-hidden rounded-[1.25rem] border border-border/50 bg-background/70 p-2">
            <SidebarAd />
          </div>
        </div>
      </aside>

      {/* Inline Ad Unit for screens < 1400px (mobile, tablet, standard laptop) */}
      <div className="block min-[1400px]:hidden container mx-auto px-4 py-4 lg:px-8" aria-label="Inline Advertisement">
        <div className="w-full rounded-[1.5rem] border border-border/40 bg-card/45 p-3 shadow-soft backdrop-blur-md">
          <p className="px-2 text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground text-center">
            Sponsored Advertisement
          </p>
          <div className="mt-2 flex justify-center min-h-[100px] overflow-hidden">
            <AdBanner
              slot={adsConfig.slots.inContent}
              format="auto"
              responsive={true}
              className="w-full max-w-[728px]"
            />
          </div>
        </div>
      </div>
    </>
  );
}