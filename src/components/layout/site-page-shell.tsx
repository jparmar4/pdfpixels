'use client';

import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  FileText,
  GitCompareArrows,
  LayoutTemplate,
  Mail,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  TriangleAlert,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeroAction {
  label: string;
  href: string;
  variant?: 'default' | 'outline';
}

interface HeroStat {
  label: string;
  value: string;
}

const shellIconMap = {
  sparkles: Sparkles,
  terminal: Terminal,
  compare: GitCompareArrows,
  mail: Mail,
  layout: LayoutTemplate,
  shield: Shield,
  'shield-alert': ShieldAlert,
  'triangle-alert': TriangleAlert,
  'file-text': FileText,
} satisfies Record<string, LucideIcon>;

export type SitePageShellIconName = keyof typeof shellIconMap;

interface SitePageShellProps {
  eyebrow?: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  iconName?: SitePageShellIconName;
  actions?: HeroAction[];
  stats?: HeroStat[];
  children: React.ReactNode;
  align?: 'left' | 'center';
  contentClassName?: string;
}

export function SitePageShell({
  eyebrow,
  title,
  description,
  icon: Icon,
  iconName,
  actions = [],
  stats = [],
  children,
  align = 'left',
  contentClassName,
}: SitePageShellProps) {
  const centered = align === 'center';
  const ResolvedIcon = Icon ?? (iconName ? shellIconMap[iconName] : undefined);
  const trustPoints = [
    { icon: Sparkles, label: 'Premium interface' },
    { icon: Zap, label: 'Fast completion paths' },
    { icon: ShieldCheck, label: 'Clear processing states' },
  ];

  return (
    <div className="premium-page-bg min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="hero-grid absolute inset-0 opacity-60" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,76,181,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,170,0.14),transparent_26%),radial-gradient(circle_at_bottom,rgba(184,134,39,0.12),transparent_32%)]" />
          <div className="pointer-events-none absolute left-[-8rem] top-12 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-8rem] right-[-6rem] h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="container mx-auto px-4 py-20 lg:px-8 md:py-24">
            <div className={cn('mx-auto max-w-5xl', centered && 'text-center')}>
              {eyebrow ? (
                <Badge className="badge-gradient mb-6 inline-flex rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                  {ResolvedIcon ? <ResolvedIcon className="h-3.5 w-3.5" /> : null}
                  {eyebrow}
                </Badge>
              ) : null}

              <h1 className="text-balance text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className={cn('mt-6 max-w-3xl text-lg leading-8 text-muted-foreground', centered && 'mx-auto')}>
                {description}
              </p>

              <div className={cn('mt-8 flex flex-wrap gap-3', centered ? 'justify-center' : 'justify-start')}>
                {trustPoints.map((point) => (
                  <div
                    key={point.label}
                    className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground shadow-soft backdrop-blur-xl"
                  >
                    <point.icon className="h-3.5 w-3.5 text-primary" />
                    {point.label}
                  </div>
                ))}
              </div>

              {actions.length > 0 ? (
                <div className={cn('mt-8 flex flex-wrap gap-3', centered ? 'justify-center' : 'justify-start')}>
                  {actions.map((action) => (
                    <Button
                      key={`${action.href}-${action.label}`}
                      asChild
                      size="lg"
                      variant={action.variant === 'outline' ? 'outline' : 'default'}
                      className={cn('rounded-2xl px-6', action.variant !== 'outline' && 'btn-premium')}
                    >
                      <Link href={action.href} className="inline-flex items-center gap-2">
                        {action.label}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ))}
                </div>
              ) : null}

              {stats.length > 0 ? (
                <div className={cn('mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4', centered && 'mx-auto max-w-4xl')}>
                  {stats.map((stat) => (
                    <div key={stat.label} className="section-panel rounded-[1.5rem] p-4">
                      <div className="mb-3 h-1 w-16 rounded-full bg-[linear-gradient(90deg,rgba(14,76,181,0.9),rgba(14,165,170,0.7),rgba(184,134,39,0.5))]" />
                      <p className="text-2xl font-extrabold tracking-tight text-foreground">{stat.value}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3 rounded-[1.5rem] border border-border/50 bg-card/75 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground shadow-soft backdrop-blur-xl">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Premium page system
            </span>
            <span className="hidden h-4 w-px bg-border/80 sm:block" />
            <span>Responsive layout</span>
            <span className="hidden h-4 w-px bg-border/80 sm:block" />
            <span>Readable content hierarchy</span>
            <span className="hidden h-4 w-px bg-border/80 lg:block" />
            <span className="hidden lg:inline">Conversion-ready structure</span>
          </div>
        </div>

        <div className={cn('container mx-auto px-4 pb-12 pt-4 lg:px-8 md:pb-16', contentClassName)}>{children}</div>
      </main>
      <Footer />
    </div>
  );
}