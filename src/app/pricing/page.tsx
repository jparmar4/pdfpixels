import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, ShieldCheck, Sparkles, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: `Pricing — Free Online PDF & Image Tools | ${siteConfig.name}`,
  description:
    'PdfPixels tools are free for everyday PDF and image tasks. No paid Pro tier required for core compress, convert, merge, and resize workflows.',
  alternates: { canonical: '/pricing' },
  robots: {
    index: true,
    follow: true,
  },
};

const freeIncludes = [
  '50+ online PDF and image tools',
  'No account required for core workflows',
  'Compress, merge, split, convert, resize, and more',
  'Practical guides and use-case walkthroughs',
  'Works on desktop and mobile browsers',
];

export default function PricingPage() {
  return (
    <div className="relative overflow-hidden bg-background pt-24 pb-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.06),transparent_25%)]" />

      <div className="container relative z-10 mx-auto max-w-6xl px-4 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center lg:mb-20">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
            <Heart className="h-3.5 w-3.5" />
            Simple & honest
          </span>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Free tools for real file jobs
          </h1>
          <p className="text-lg font-medium leading-relaxed text-muted-foreground">
            PdfPixels is free for everyday personal and work use. There is no paid “Pro” checkout on this site
            today — open a tool, process your file, download the result.
          </p>
        </div>

        <div className="mx-auto max-w-xl">
          <div className="rounded-[2rem] border border-border/60 bg-card/70 p-8 shadow-soft backdrop-blur-xl lg:p-10">
            <div className="mb-6">
              <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Free forever</h2>
              <p className="text-sm text-muted-foreground">
                Built for students, freelancers, and anyone who needs a clean browser utility — not a trial wall.
              </p>
            </div>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-5xl font-extrabold tracking-tight">$0</span>
              <span className="text-sm font-semibold text-muted-foreground">/ no paid plan required</span>
            </div>

            <ul className="mb-10 space-y-4">
              {freeIncludes.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Button asChild className="btn-premium h-14 w-full rounded-2xl text-base font-bold">
              <Link href="/tools">Browse free tools</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-3xl rounded-[2rem] border border-border/50 bg-muted/20 p-8 text-center lg:p-10">
          <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-emerald-500" />
          <h2 className="mb-3 text-xl font-bold text-foreground">About limits & future paid features</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Some tools process in your browser; others use servers with fair-use rate limits to keep the service
            stable. If we ever introduce optional paid features (for example higher server limits or API access for
            businesses), they will be labeled clearly — free tools will stay free for normal use. Questions?{' '}
            <Link href="/contact" className="font-semibold text-primary hover:underline">
              Contact us
            </Link>
            .
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/about">About PdfPixels</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/blog">
                <Sparkles className="mr-2 h-4 w-4" />
                Read guides
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
