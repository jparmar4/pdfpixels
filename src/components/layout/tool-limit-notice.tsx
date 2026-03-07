import { Info, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ToolLimitNoticeProps {
  title?: string;
  limits: string[];
}

export function ToolLimitNotice({ title = 'Tool limits', limits }: ToolLimitNoticeProps) {
  if (limits.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-border/60 bg-card/70 shadow-soft backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 border-b border-border/40 bg-background/70 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Info className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">Keep the workflow predictable across devices.</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/5 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 sm:inline-flex">
          <ShieldCheck className="h-3.5 w-3.5" />
          Stable output
        </div>
      </div>
      <div className="flex flex-wrap gap-2 p-4">
        {limits.map((limit) => (
          <Badge key={limit} variant="secondary" className="rounded-full border border-border/60 bg-background/80 px-3 py-1 font-medium">
            {limit}
          </Badge>
        ))}
      </div>
    </div>
  );
}
