import Link from 'next/link';
import { ArrowRight, CheckCircle2, Download, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { normalizeDisplayText } from '@/lib/display-text';

interface NextAction {
  label: string;
  href: string;
}

interface ResultCardProps {
  title: string;
  description: string;
  onDownload: () => void;
  downloadLabel?: string;
  primaryMeta?: string;
  nextActions?: NextAction[];
}

export function ResultCard({
  title,
  description,
  onDownload,
  downloadLabel = 'Download',
  primaryMeta,
  nextActions = [],
}: ResultCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-emerald-500/25 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(255,255,255,0.82))] p-6 shadow-premium dark:bg-[linear-gradient(180deg,rgba(16,185,129,0.14),rgba(17,24,39,0.82))]">
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

      <div className="relative z-10 space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 shadow-sm dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-foreground">
                {normalizeDisplayText(title)}
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {normalizeDisplayText(description)}
              </p>
              {primaryMeta ? <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{normalizeDisplayText(primaryMeta)}</p> : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-background/80 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              Ready to download
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-sky-500" />
              Securely processed
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={onDownload} className="btn-premium h-12 flex-1 gap-2 rounded-2xl" size="lg">
            <Download className="h-4 w-4" />
            {normalizeDisplayText(downloadLabel)}
          </Button>
          {nextActions.length > 0 ? (
            <div className="flex flex-1 flex-wrap gap-2">
              {nextActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-border/60 bg-background/80 px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {normalizeDisplayText(action.label)}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
