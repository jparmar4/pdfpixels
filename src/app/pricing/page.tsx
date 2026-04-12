import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: `Pricing to Power Your PDF Workflows | ${siteConfig.name}`,
  description: 'Simple, transparent pricing. Free forever tools, with unlimited Pro access for power users driving daily document demands.',
};

export default function PricingPage() {
  return (
    <div className="relative overflow-hidden bg-background pt-24 pb-32">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.06),transparent_25%)]" />

      <div className="container relative z-10 mx-auto px-4 lg:px-8 max-w-6xl">
        <div className="mx-auto max-w-2xl text-center mb-16 lg:mb-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-500 mb-6 transition-transform hover:scale-105 cursor-default">
            <Sparkles className="h-3.5 w-3.5" />
            Simple & Transparent
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl mb-6">
            Everything you need for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-sky-500">flawless documents.</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed font-medium">
            Start for free and never look back. Upgrade to Pro when you need higher limits, batch processing, and premium AI workflows.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="relative rounded-[2rem] border border-border/60 bg-card/60 p-8 lg:p-10 shadow-soft backdrop-blur-xl transition-all duration-300 hover:shadow-premium hover:-translate-y-1">
            <div className="mb-6">
              <h3 className="text-2xl font-bold tracking-tight text-foreground mb-2">Basic Free</h3>
              <p className="text-sm text-muted-foreground">For occasional personal document needs.</p>
            </div>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-5xl font-extrabold tracking-tight">$0</span>
              <span className="text-sm font-semibold text-muted-foreground">/forever</span>
            </div>
            
            <ul className="mb-10 space-y-4">
              {['Access to 50+ standard tools', 'File size limit up to 10MB', 'Standard processing queue', 'Basic document compression', 'Watermarked signatures'].map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <div className="flex shrink-0 h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">{feature}</span>
                </li>
              ))}
            </ul>
            
            <Button asChild variant="outline" className="w-full rounded-2xl h-14 text-base font-bold bg-background/50 hover:bg-card">
              <Link href="/tools">Start Free Now</Link>
            </Button>
          </div>

          {/* Pro Tier */}
          <div className="relative rounded-[2rem] border border-primary/40 bg-gradient-to-b from-primary/[0.04] to-card/90 p-8 lg:p-10 shadow-premium backdrop-blur-xl transition-all duration-300 hover:shadow-[0_24px_80px_-24px_rgba(99,102,241,.3)] hover:-translate-y-1">
            <div className="absolute top-0 right-8 -translate-y-1/2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white shadow-lg">
                Most Popular
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold tracking-tight text-primary mb-2 flex items-center gap-2">
                PdfPixels Pro
                <Zap className="h-5 w-5 fill-primary text-primary" />
              </h3>
              <p className="text-sm text-muted-foreground">For professionals pushing out high volumes.</p>
            </div>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-5xl font-extrabold tracking-tight">$9</span>
              <span className="text-sm font-semibold text-muted-foreground">/month</span>
            </div>
            
            <ul className="mb-10 space-y-4">
              {['Unlimited batch processing', 'File size limit up to 500MB', 'Priority server speeds', 'Fast Web View (Linearize) unlocked', 'AI Background Removal unlocked', 'No ads across the entire site'].map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <div className="flex shrink-0 h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-sky-500 text-white shadow-md">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-bold text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
            
            <Button asChild className="w-full rounded-2xl h-14 text-base font-bold btn-premium shadow-xl shadow-primary/20">
              <Link href="/contact?subject=Pro+Subscription">Get Pro Access</Link>
            </Button>
          </div>
        </div>

        {/* Enterprise / Footer Banner */}
        <div className="mt-20 lg:mt-32 rounded-[2.5rem] border border-border/50 bg-gradient-to-br from-card to-background p-10 lg:p-14 text-center max-w-4xl mx-auto shadow-soft flex flex-col items-center">
          <ShieldCheck className="h-12 w-12 text-emerald-500 mb-6" />
          <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground mb-4">Need an Enterprise API?</h2>
          <p className="text-muted-foreground max-w-lg mb-8 font-medium">
            Integrate our high-availability PDF & Image compression endpoints directly into your own SaaS products.
          </p>
          <Button asChild variant="outline" className="rounded-xl h-12 px-8 border-border/80 hover:text-primary transition-colors font-bold">
            <Link href="/contact">Contact Sales</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
