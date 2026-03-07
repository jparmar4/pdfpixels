import Link from 'next/link';
import { GitCompareArrows } from 'lucide-react';
import { SitePageShell } from '@/components/layout/site-page-shell';
import { comparisonPages } from '@/lib/comparisons';

export const metadata = {
  title: 'Comparisons | PdfPixels',
  description: 'Objective comparisons of PdfPixels with popular tools for image and PDF workflows.',
};

export default function CompareIndexPage() {
  return (
    <SitePageShell
      eyebrow="Comparisons"
      title="Use-case focused comparisons for practical tool decisions."
      description="These pages help users decide when PdfPixels is the better fit and where alternative tools may still be stronger depending on the workflow."
      iconName="compare"
      align="center"
      stats={[
        { label: 'Guides', value: `${comparisonPages.length}` },
        { label: 'Focus', value: 'Decision support' },
        { label: 'Format', value: 'Practical' },
        { label: 'Goal', value: 'Lower friction' },
      ]}
      contentClassName="max-w-6xl"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {comparisonPages.map((item) => (
          <Link
            key={item.slug}
            href={`/compare/${item.slug}`}
            className="section-panel rounded-[1.75rem] p-5 transition-colors hover:border-primary/25"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Comparison guide</p>
            <h2 className="mt-3 text-xl font-bold text-foreground">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description}</p>
          </Link>
        ))}
      </div>
    </SitePageShell>
  );
}
