'use client';

import { SidebarAd } from '@/components/ads/ad-banner';

export function ToolSidebarAd() {
  return (
    <aside className="pointer-events-none fixed right-5 top-24 z-30 hidden min-[1400px]:block">
      <div className="pointer-events-auto w-[300px] rounded-[1.75rem] border border-border/60 bg-card/85 p-3 shadow-premium backdrop-blur-xl">
        <p className="px-2 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          Sponsored
        </p>
        <div className="mt-3 overflow-hidden rounded-[1.25rem] border border-border/50 bg-background/70 p-2">
          <SidebarAd />
        </div>
      </div>
    </aside>
  );
}