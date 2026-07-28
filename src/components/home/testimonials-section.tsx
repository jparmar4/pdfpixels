'use client';

import Link from 'next/link';
import { ArrowRight, FileText, Image as ImageIcon, Shield, Sparkles, Users } from 'lucide-react';

/**
 * Authentic workflow cards — not fabricated user reviews.
 * Fake star-rated testimonials are a common AdSense quality red flag.
 */
const workflows = [
  {
    title: 'Email-ready PDFs',
    audience: 'Students & office users',
    text: 'Shrink large PDFs for Gmail, Outlook, and job portals without rewriting the whole document.',
    href: '/tools/compress-pdf',
    cta: 'Compress PDF',
    icon: FileText,
    color: 'from-violet-500 to-purple-600',
  },
  {
    title: 'Form & portal photos',
    audience: 'Applicants & freelancers',
    text: 'Hit exact KB limits (20KB–200KB), passport dimensions, and common ID photo sizes for uploads.',
    href: '/tools/compress-image',
    cta: 'Compress Image',
    icon: ImageIcon,
    color: 'from-cyan-500 to-blue-600',
  },
  {
    title: 'iPhone HEIC compatibility',
    audience: 'Mobile photographers',
    text: 'Convert HEIC photos to JPG so Windows, web forms, and email clients open them without plugins.',
    href: '/tools/heic-to-jpg',
    cta: 'HEIC to JPG',
    icon: Sparkles,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    title: 'Product & profile cutouts',
    audience: 'Sellers & creators',
    text: 'Remove backgrounds for listings, headshots, and graphics, then export a transparent PNG.',
    href: '/tools/remove-image-background',
    cta: 'Remove Background',
    icon: Users,
    color: 'from-amber-500 to-orange-600',
  },
  {
    title: 'Combine & split documents',
    audience: 'Teams & freelancers',
    text: 'Merge invoices or reports into one PDF, or extract only the pages you need to share.',
    href: '/tools/merge-pdf',
    cta: 'Merge PDF',
    icon: FileText,
    color: 'from-fuchsia-500 to-pink-600',
  },
  {
    title: 'Privacy-minded processing',
    audience: 'Everyone',
    text: 'Many image tools run in your browser. Server-side jobs process files for the task, then discard them — no account wall for core tools.',
    href: '/privacy',
    cta: 'Read privacy policy',
    icon: Shield,
    color: 'from-sky-500 to-indigo-600',
  },
];

export function TestimonialsSection() {
  return (
    <section
      ref={undefined}
      className="border-t border-border/50 bg-muted/15 py-16 md:py-20"
      aria-labelledby="workflows-heading"
    >
      <div className="container mx-auto max-w-6xl px-4 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Real workflows
          </span>
          <h2
            id="workflows-heading"
            className="mt-4 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl"
          >
            Built for jobs people actually do
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
            PdfPixels focuses on everyday file tasks with clear steps and practical guides — not generic
            filler. Pick a workflow below or browse the full tool library.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="flex h-full flex-col rounded-2xl border border-border/60 bg-card/80 p-5 shadow-soft transition-all hover:border-primary/25 hover:shadow-premium"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-sm`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                    <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {item.audience}
                    </p>
                  </div>
                </div>
                <p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground">{item.text}</p>
                <Link
                  href={item.href}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-4"
                >
                  {item.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
