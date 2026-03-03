import Link from 'next/link';
import { comparisonPages } from '@/lib/comparisons';

export const metadata = {
  title: 'Comparisons | PdfPixels',
  description: 'Objective comparisons of PdfPixels with popular tools for image and PDF workflows.',
};

export default function CompareIndexPage() {
  return (
    <main className="container mx-auto px-4 lg:px-8 py-12">
      <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Tool Comparisons</h1>
      <p className="text-muted-foreground mb-8">Use-case focused comparisons to pick the best tool for your workflow.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {comparisonPages.map((item) => (
          <Link
            key={item.slug}
            href={`/compare/${item.slug}`}
            className="rounded-xl border border-border/60 bg-card/70 p-4 hover:border-primary/50 transition-colors"
          >
            <h2 className="text-base font-semibold mb-1">{item.title}</h2>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
