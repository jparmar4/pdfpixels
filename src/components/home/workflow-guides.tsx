import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useCasePages } from '@/lib/use-cases';

const featuredWorkflows = [
  { slug: 'compress-pdf-for-email', label: 'Prepare PDFs for email' },
  { slug: 'convert-heic-to-jpg-windows', label: 'Open iPhone photos on Windows' },
  { slug: 'merge-pdf-files-windows', label: 'Combine documents on Windows' },
  { slug: 'sign-pdf-free-without-login', label: 'Add a signature to a PDF' },
  { slug: 'split-pdf-by-size-for-email', label: 'Split a PDF to fit an upload limit' },
  { slug: 'compress-image-to-50kb', label: 'Prepare photos for application forms' },
];

export function WorkflowGuides() {
  return (
    <section className="border-t border-border/50 py-12 md:py-16" aria-labelledby="workflow-guides-heading">
      <div className="container mx-auto max-w-6xl px-4 lg:px-8">
        <h2 id="workflow-guides-heading" className="text-2xl font-bold tracking-tight md:text-3xl">
          Get files ready for work, email, and applications
        </h2>
        <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
          Start with your task. These guides explain the settings to choose, the limits to check,
          and how to review your file before sharing it.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredWorkflows.map(({ slug, label }) => {
            const guide = useCasePages.find((entry) => entry.slug === slug);
            if (!guide) return null;
            return (
              <Link key={slug} href={`/use-cases/${slug}`} className="group rounded-2xl border border-border/60 bg-card p-5 transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                <h3 className="font-semibold group-hover:text-primary">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{guide.description}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  View steps <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
