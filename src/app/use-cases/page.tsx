import Link from 'next/link';
import { useCasePages } from '@/lib/use-cases';

export const metadata = {
  title: 'Use Cases | PdfPixels',
  description: 'High-intent guides for common image and PDF tasks like compressing to 20KB, passport sizing, and PDF email optimization.',
};

export default function UseCasesIndexPage() {
  return (
    <main className="container mx-auto px-4 lg:px-8 py-12">
      <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Popular Use Cases</h1>
      <p className="text-muted-foreground mb-8">Solve common image and PDF tasks in one click with the right tool workflow.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {useCasePages.map((item) => (
          <Link
            key={item.slug}
            href={`/use-cases/${item.slug}`}
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
