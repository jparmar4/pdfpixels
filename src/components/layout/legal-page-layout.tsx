import { CalendarDays } from 'lucide-react';
import { SitePageShell, type SitePageShellIconName } from '@/components/layout/site-page-shell';
import { CookieSettingsButton } from '@/components/ads/cookie-consent';
import { cn } from '@/lib/utils';

interface LegalPageLayoutProps {
  title: string;
  description: string;
  updatedAt: string;
  iconName?: SitePageShellIconName;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function LegalPageLayout({
  title,
  description,
  updatedAt,
  iconName,
  children,
  actions,
}: LegalPageLayoutProps) {
  return (
    <SitePageShell
      eyebrow="Policy"
      title={title}
      description={description}
      iconName={iconName}
      stats={[
        { label: 'Last updated', value: updatedAt },
        { label: 'Scope', value: 'Global users' },
        { label: 'Format', value: 'Readable legal copy' },
        { label: 'Support', value: 'Contact available' },
      ]}
      contentClassName="max-w-5xl"
    >
      <article className="section-panel rounded-[2rem] p-6 md:p-8 lg:p-10">
        {actions ? <div className="mb-8 flex flex-wrap items-center gap-3">{actions}</div> : null}
        <div className="premium-prose">{children}</div>
      </article>
    </SitePageShell>
  );
}

export function LegalMetaRow({ updatedAt }: { updatedAt: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-2 text-sm font-medium text-muted-foreground">
      <CalendarDays className="h-4 w-4 text-primary" />
      Last updated: {updatedAt}
    </div>
  );
}

export function CookieActions() {
  return (
    <div className={cn('inline-flex')}>
      <CookieSettingsButton />
    </div>
  );
}