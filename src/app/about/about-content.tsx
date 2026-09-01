'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Globe, Shield, Users, Zap, ArrowRight, Rocket, TrendingUp, Code2,
  CheckCircle2, Wrench, DollarSign, MonitorSmartphone
} from 'lucide-react';
import { SitePageShell } from '@/components/layout/site-page-shell';
import { Button } from '@/components/ui/button';
import { allTools } from '@/lib/tools-data';

/* ─── Animated Counter ────────────────────────────────────────────── */
function AnimatedCounter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(end);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <div ref={ref}>{count}{suffix}</div>;
}

/* ─── Data ────────────────────────────────────────────────────────── */
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

const timelineMilestones = [
  {
    year: '2025 - Started',
    title: 'Launch & Foundation',
    description: 'Launched PdfPixels with an initial set of 20 carefully crafted image and PDF tools, focused on speed and usability.',
    icon: Rocket,
    color: 'from-primary/20 to-sky-500/15',
    iconColor: 'text-primary',
  },
  {
    year: '2025 - Growth',
    title: 'AI-Powered Expansion',
    description: 'Added AI-powered tools like background removal, image enhancement, and upscale. Expanded to 40+ tools with broader format support.',
    icon: TrendingUp,
    color: 'from-emerald-500/20 to-teal-500/15',
    iconColor: 'text-emerald-500',
  },
  {
    year: '2026 - Expansion',
    title: `${allTools.length}+ Tools & Content`,
    description: `Reached ${allTools.length}+ tools, launched the blog with product guides, comparison pages, and use-case-driven entry points.`,
    icon: Wrench,
    color: 'from-violet-500/20 to-fuchsia-500/15',
    iconColor: 'text-violet-500',
  },
];

const statsData = [
  { value: allTools.length, suffix: '+', label: 'Free Tools', icon: Wrench, gradient: 'from-indigo-500 to-violet-500' },
  { value: 100, suffix: '%', label: 'Free Forever', icon: DollarSign, gradient: 'from-emerald-500 to-teal-500' },
  { value: 0, suffix: '', label: 'No Signup Required', icon: Users, gradient: 'from-fuchsia-500 to-pink-500', display: 'Zero' },
  { value: 0, suffix: '', label: 'Works Everywhere', icon: MonitorSmartphone, gradient: 'from-cyan-500 to-blue-500', display: 'All' },
];

const techStack = [
  { name: 'Next.js', description: 'React Framework', gradient: 'from-slate-700 to-slate-900' },
  { name: 'React', description: 'UI Library', gradient: 'from-sky-400 to-sky-600' },
  { name: 'TypeScript', description: 'Type Safety', gradient: 'from-blue-500 to-blue-700' },
  { name: 'Tailwind CSS', description: 'Utility-First CSS', gradient: 'from-cyan-500 to-teal-600' },
  { name: 'Server Processing', description: 'Sharp & pdf-lib', gradient: 'from-violet-500 to-purple-600' },
  { name: 'AI Powered', description: 'Neural Networks', gradient: 'from-fuchsia-500 to-pink-600' },
];

/* ─── Page Component ──────────────────────────────────────────────── */
export function AboutPageContent() {
  return (
    <SitePageShell
      eyebrow="About PdfPixels"
      title="Professional image and PDF tooling without product friction."
      description="PdfPixels is built for users who want clean design, reliable processing, and a no-nonsense workflow for common document and image tasks."
      iconName="sparkles"
      align="center"
      stats={[
        { label: 'Tools available', value: `${allTools.length}+` },
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
      {/* ── Why the product exists ───────────────────────────────── */}
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="section-panel rounded-[2rem] p-6 md:p-8">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">Why the product exists</h2>
          <div className="premium-prose mt-5">
            <p>
              PdfPixels exists because everyday file jobs are still harder than they should be: a PDF that will not fit in email, a photo rejected for being 12KB over a portal limit, an iPhone HEIC that will not open on Windows, or a passport crop that needs exact dimensions.
            </p>
            <p>
              We build free browser tools for those moments — compress, merge, convert, resize, and clean up files — with clear steps, practical guides, and no account wall for core workflows. The product should feel reliable and calm, not like a cluttered tool farm.
            </p>
            <p>
              Alongside the tools, we publish long-form how-to articles (PDF size limits, HEIC conversion, form photo sizes, and more) so people can learn the “why” as well as click a button. That combination of working utilities and real educational content is the foundation of the site.
            </p>
            <p>
              If something breaks, a limit is unclear, or a tool should work differently, use the{' '}
              <Link href="/contact" className="font-semibold text-primary hover:underline">contact page</Link>
              {' '}or email{' '}
              <a href="mailto:support@pdfpixels.com" className="font-semibold text-primary hover:underline">support@pdfpixels.com</a>
              . Product decisions come from real upload errors and form requirements people hit every day.
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
              Honest pages: we describe what each tool actually does, including file limits.
            </div>
            <div className="legal-callout">
              Guides written around real upload errors — Gmail size caps, HEIC on Windows, form KB limits.
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] border border-border/50 bg-card/70 p-6 md:p-8">
        <h2 className="text-2xl font-bold text-foreground">How the site stays free</h2>
        <div className="premium-prose mt-4">
          <p>
            PdfPixels is free for everyday personal use. We plan to fund the servers with Google AdSense
            advertisements after approval. Ads will sit beside or below tool instructions — never as the only
            thing on a page. You can reject advertising cookies in the cookie banner.
          </p>
          <p>
            We do not sell uploaded files. Server-side jobs process a file for that request and then delete it
            on supported flows. Browser tools stay on your device. Details are in the{' '}
            <Link href="/privacy" className="font-semibold text-primary hover:underline">privacy policy</Link>.
          </p>
        </div>
      </section>

      {/* ── Animated Stats Section ───────────────────────────────── */}
      <section className="mt-12 relative overflow-hidden rounded-[2rem] border border-border/50">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.03] via-fuchsia-500/[0.02] to-cyan-500/[0.03]" />
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-5 p-6 md:p-8">
          {statsData.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="relative text-center p-6 rounded-2xl glass-card group hover:shadow-premium transition-all duration-300"
            >
              <div className={`absolute top-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r ${stat.gradient} opacity-60`} />
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl md:text-4xl font-extrabold text-foreground mb-1">
                {stat.display ? stat.display : <AnimatedCounter end={stat.value} suffix={stat.suffix} />}
              </div>
              <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Values Grid ──────────────────────────────────────────── */}
      <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {values.map((value, idx) => (
          <motion.div
            key={value.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.08 }}
            className="section-panel rounded-[1.75rem] p-6 hover:shadow-premium transition-all duration-300"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <value.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-foreground">{value.title}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{value.description}</p>
          </motion.div>
        ))}
      </section>

      {/* ── Our Journey Timeline ─────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-12"
      >
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">Our Journey</p>
          <h2 className="text-3xl font-extrabold text-foreground md:text-4xl">From idea to {allTools.length}+ tools</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            A brief look at the key milestones that shaped PdfPixels into the platform it is today.
          </p>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-violet-500/30 to-transparent md:-translate-x-px" />

          <div className="space-y-8 md:space-y-12">
            {timelineMilestones.map((milestone, idx) => {
              const isLeft = idx % 2 === 0;
              return (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.12 }}
                  className="relative flex items-start gap-6 md:gap-0"
                >
                  {/* Dot on the line */}
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 z-10">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${milestone.color} flex items-center justify-center border-2 border-background shadow-lg`}>
                      <milestone.icon className={`w-5 h-5 ${milestone.iconColor}`} />
                    </div>
                  </div>

                  {/* Content card */}
                  <div className={`flex-1 pl-20 md:pl-0 ${isLeft ? 'md:pr-[calc(50%+2.5rem)] md:text-right' : 'md:pl-[calc(50%+2.5rem)]'}`}>
                    <div className="section-panel rounded-[1.75rem] p-5 md:p-6 hover:shadow-premium transition-all duration-300">
                      <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                        {milestone.year}
                      </span>
                      <h3 className="mt-2 text-lg font-bold text-foreground">{milestone.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{milestone.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* ── Technology Stack ─────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-12 section-panel rounded-[2rem] p-6 md:p-8 lg:p-10"
      >
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">Built With</p>
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">Modern Technology Stack</h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
            PdfPixels leverages cutting-edge technologies for reliable, fast, and secure file processing.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {techStack.map((tech, idx) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.06 }}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-background/75 p-4 shadow-soft hover:shadow-premium hover:border-primary/20 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tech.gradient} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <p className="font-bold text-sm text-foreground">{tech.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{tech.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Editorial Standards & Team Transparency ───────────────── */}
      <section className="mt-12 section-panel rounded-[2rem] p-6 md:p-8 lg:p-10">
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">Our Standards</p>
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">Editorial & Engineering Integrity</h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
            PdfPixels is engineered and maintained by a dedicated team of full-stack software engineers, graphic specialists, and digital publishing professionals.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-border/50 bg-background/70 p-6 shadow-soft">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 mb-4">
              <Code2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Rigorous Tool Testing</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Every tool and compression pipeline is benchmarked across hundreds of real-world test files (scanned PDFs, multi-gigabyte photos, transparent graphics) to prevent visual corruption and data loss.
            </p>
          </div>

          <div className="rounded-2xl border border-border/50 bg-background/70 p-6 shadow-soft">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-4">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Security by Default</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              We operate under a strict zero-retention policy. Browser-native tools keep your data on your device, and server-assisted jobs process files in memory with automatic hourly purging.
            </p>
          </div>

          <div className="rounded-2xl border border-border/50 bg-background/70 p-6 shadow-soft">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500 mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Human-Authored Guides</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              All guides, tutorials, and comparison articles are written and verified by real practitioners based on actual form requirements, email attachment caps, and print specifications.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-border/40 bg-muted/20 p-6">
          <h3 className="text-base font-bold text-foreground">Publisher & Contact Information</h3>
          <div className="mt-3 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <div>
              <p><strong className="text-foreground">Platform:</strong> PdfPixels (pdfpixels.com)</p>
              <p><strong className="text-foreground">Publisher:</strong> PdfPixels Team</p>
              <p><strong className="text-foreground">Contact Email:</strong> <a href="mailto:support@pdfpixels.com" className="text-primary hover:underline">support@pdfpixels.com</a></p>
            </div>
            <div>
              <p><strong className="text-foreground">Inquiries & Support:</strong> 24-48 hour response SLA</p>
              <p><strong className="text-foreground">Office / Operating Hours:</strong> Monday – Friday, 9:00 AM – 6:00 PM IST (Global Support 24/7)</p>
              <p><strong className="text-foreground">Official Channels:</strong> Web contact form, GitHub, and Twitter / X</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Platform Direction ───────────────────────────────────── */}
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

      {/* ── CTA with Aurora BG ───────────────────────────────────── */}
      <section className="mt-12 aurora-bg rounded-[2rem] overflow-hidden">
        <div className="relative z-10 px-6 py-14 md:px-12 md:py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-extrabold text-foreground md:text-4xl lg:text-5xl">
              Ready to transform your workflow?
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-base md:text-lg leading-relaxed">
              Open a tool, upload a file, and download the result — no account required for core workflows.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Button asChild size="lg" className="btn-premium rounded-2xl px-8 py-6 text-base">
                <Link href="/" className="inline-flex items-center gap-2">
                  Explore All Tools
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-2xl px-8 py-6 text-base border-white/20 bg-background/40 backdrop-blur-xl">
                <Link href="/contact">Get In Touch</Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                100% Free
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                No Signup
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Instant Results
              </span>
            </div>
          </motion.div>
        </div>
      </section>
    </SitePageShell>
  );
}
