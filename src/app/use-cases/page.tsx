import Link from 'next/link';
import { LayoutTemplate } from 'lucide-react';
import { SitePageShell } from '@/components/layout/site-page-shell';
import { useCasePages } from '@/lib/use-cases';

export const metadata = {
  title: 'Use Cases | PdfPixels',
  description: 'High-intent guides for common image and PDF tasks like compressing to strict size targets, passport sizing, and document optimization.',
};

export default function UseCasesIndexPage() {
  return (
    <SitePageShell
      eyebrow="Use cases"
      title="Intent-driven entry points for real image and PDF jobs."
      description="These pages connect common user goals to the fastest PdfPixels workflow, reducing decision time and getting people to the right tool immediately."
      iconName="layout"
      align="center"
      stats={[
        { label: 'Use cases', value: `${useCasePages.length}` },
        { label: 'Purpose', value: 'High intent' },
        { label: 'Flow', value: 'Tool-first' },
        { label: 'Outcome', value: 'Faster completion' },
      ]}
      contentClassName="max-w-6xl"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {useCasePages.map((item) => (
          <Link
            key={item.slug}
            href={`/use-cases/${item.slug}`}
            className="section-panel rounded-[1.75rem] p-5 transition-colors hover:border-primary/25"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Workflow guide</p>
            <h2 className="mt-3 text-xl font-bold text-foreground">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description}</p>
          </Link>
        ))}
      </div>
    </SitePageShell>
  );
}
