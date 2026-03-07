import type { Metadata } from 'next';
import Link from 'next/link';
import { Globe, Shield, Users, Zap } from 'lucide-react';
import { SitePageShell } from '@/components/layout/site-page-shell';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'About Us - PdfPixels | Free Online Image & PDF Tools',
  description: 'Learn about PdfPixels and the product principles behind our premium image and PDF tooling platform.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  const values = [
    {
      icon: Zap,
      title: 'Fast by default',
      description: 'The platform is designed to feel immediate, from upload to result, without adding friction or account walls.',
    },
    {
      icon: Shield,
      title: 'Privacy aware',
      description: 'We prioritize secure processing and clear expectations around how files move through the product.',
    },
    {
      icon: Globe,
      title: 'Accessible globally',
      description: 'The goal is a professional-grade experience that works for students, teams, freelancers, and businesses worldwide.',
    },
    {
      icon: Users,
      title: 'User-led evolution',
      description: 'We improve the product around real workflows: upload limits, document constraints, visual QA, and faster completion paths.',
    },
  ];

  return (
    <SitePageShell
      eyebrow="About PdfPixels"
      title="Professional image and PDF tooling without product friction."
      description="PdfPixels is built for users who want clean design, reliable processing, and a no-nonsense workflow for common document and image tasks."
      iconName="sparkles"
      align="center"
      stats={[
        { label: 'Tools available', value: '55+' },
        { label: 'Signup required', value: 'No' },
        { label: 'Design goal', value: 'Premium UX' },
        { label: 'Core principle', value: 'Fast output' },
      ]}
      actions={[
        { label: 'Explore all tools', href: '/' },
        { label: 'Contact us', href: '/contact', variant: 'outline' },
      ]}
      contentClassName="max-w-6xl"
    >
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="section-panel rounded-[2rem] p-6 md:p-8">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">Why the product exists</h2>
          <div className="premium-prose mt-5">
            <p>
              Many image and PDF tools feel disposable: generic UI, inconsistent output, too many ads, or important features hidden behind signup flows. PdfPixels is being designed in the opposite direction.
            </p>
            <p>
              The objective is straightforward: give users a polished utility platform that feels global in quality, delivers predictable output, and removes as much operational friction as possible from everyday file work.
            </p>
            <p>
              That means strong defaults, clear controls, mobile-friendly workflows, and surfaces that feel closer to a premium SaaS product than a typical free tool directory.
            </p>
          </div>
        </div>

        <div className="section-panel rounded-[2rem] p-6 md:p-8">
          <h2 className="text-2xl font-bold text-foreground">What we focus on</h2>
          <div className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground">
            <div className="legal-callout">
              Better visual quality across every page, not just the homepage.
            </div>
            <div className="legal-callout">
              Reliable tool behavior with clearer constraints and better output states.
            </div>
            <div className="legal-callout">
              SEO, AEO, and GEO-friendly page structures that still feel premium to humans.
            </div>
            <div className="legal-callout">
              A deployment-ready Next.js codebase suited for production hosting.
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {values.map((value) => (
          <div key={value.title} className="section-panel rounded-[1.75rem] p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <value.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-foreground">{value.title}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{value.description}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 section-panel rounded-[2rem] p-6 md:p-8 lg:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Platform direction</p>
            <h2 className="mt-2 text-2xl font-bold text-foreground md:text-3xl">A premium utility layer for document and image work.</h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            The product is evolving toward a consistent visual language, stronger tool trust, and better monetization surfaces without degrading the core utility experience.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="btn-premium rounded-2xl px-6">
            <Link href="/tools/compress-pdf">Open PDF workflows</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-2xl px-6">
            <Link href="/blog">Read product guides</Link>
          </Button>
        </div>
      </section>
    </SitePageShell>
  );
}
