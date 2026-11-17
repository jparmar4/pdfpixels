'use client';

import { Lock, MonitorSmartphone, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLiveOnlineStatus } from '@/hooks/use-pro-tool-shortcuts';
import { cn } from '@/lib/utils';

interface PrivateModeBadgeProps {
  className?: string;
  description?: string;
}

/**
 * Visible badge highlighting 100% client-side browser-native execution with
 * zero server upload and live `navigator.onLine` offline-proof indicator.
 */
export function PrivateModeBadge({
  className,
  description = 'Your files stay strictly in browser memory and never touch any external server.',
}: PrivateModeBadgeProps) {
  const isOnline = useLiveOnlineStatus();

  return (
    <div
      data-testid="client-private-mode-badge"
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.08] px-4 py-3 text-left',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
              100% Client-Side Private Mode (Zero Server Upload)
            </span>
            <Badge
              variant="outline"
              className="border-emerald-500/35 bg-background/70 px-2 py-0 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"
            >
              <Lock className="mr-1 h-2.5 w-2.5" />
              Zero Retention
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          data-testid="offline-proof-pill"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold',
            isOnline
              ? 'border-emerald-500/30 bg-background/85 text-emerald-700 dark:text-emerald-300'
              : 'border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300',
          )}
        >
          {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {isOnline
            ? 'Works 100% offline — test by turning off Wi-Fi'
            : 'Offline / Airplane Mode — Verified 100% Working'}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-background/80 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
          <MonitorSmartphone className="h-3.5 w-3.5" />
          Runs Locally
        </span>
      </div>
    </div>
  );
}
