'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Navigation } from '@/components/layout/navigation';
import { CategorySection } from '@/components/layout/category-section';
import { Footer } from '@/components/layout/footer';
import { AnimatedMeshBg } from '@/components/ui/animated-mesh-bg';
import { toolCategories } from '@/lib/tools-data';
import { faqData } from '@/lib/seo-config';
import { HomePageSchemas } from '@/components/seo/json-ld';
import {
  ArrowUp, Search, X, ChevronDown, Upload, Sliders,
  Download, Zap, Sparkles, ArrowRight, CheckCircle2, Wrench,
  Server, Files, DollarSign, Image as ImageIcon, FileText,
  Minimize2, ShieldCheck
} from 'lucide-react';
import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
function AnimatedCounter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
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

// --- Compact Premium Header + Search ---
function ToolsHeader({ search, setSearch }: { search: string, setSearch: (val: string) => void }) {
  return (
    <section className="relative overflow-hidden border-b border-border/40 min-h-[54vh] flex flex-col justify-center bg-gradient-to-b from-background via-background to-muted/20">
      {/* SaaS Tier Fluid Background */}
      <AnimatedMeshBg />

      <div className="relative z-10 container mx-auto px-4 lg:px-8 py-16 md:py-24 text-center">
        <div className="max-w-4xl mx-auto rounded-3xl border border-border/60 bg-card/60 backdrop-blur-2xl shadow-[0_24px_80px_-32px_rgba(99,102,241,.5)] px-6 md:px-10 py-10 md:py-14">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-primary/20 bg-primary/10 text-primary mb-5">
              Fast · Secure · No signup
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 leading-[1.05]">
              Premium PDF & Image Tools
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl mb-7 max-w-2xl mx-auto font-medium leading-relaxed">
              Compress, convert, and edit files in seconds with a clean, professional workflow.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <Link href="/tools/compress-pdf" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:opacity-95 transition-opacity">
                Start with Compress PDF
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/tools" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border/70 bg-background/80 text-sm font-semibold hover:border-primary/40 hover:text-primary transition-colors">
                Browse All Tools
              </Link>
            </div>

            <p className="text-xs text-muted-foreground">55+ tools · Free forever · Works on mobile and desktop</p>
          </motion.div>

          {/* Search Bar - Lifted into the mesh header for premium feel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-w-2xl mx-auto group z-20"
          >
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools: compress pdf, merge pdf, resize image..."
              aria-label="Search tools"
              className="block w-full pl-14 pr-12 py-5 border border-white/20 rounded-2xl leading-5 bg-background/85 backdrop-blur-2xl shadow-[0_16px_45px_-22px_rgba(99,102,241,.45)] placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-base font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-5 flex items-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// --- Popular Tools Mini Grid ---
function PopularToolsMiniGrid() {
  const items = [
    { title: 'Compress PDF', href: '/tools/compress-pdf', desc: 'Reduce file size fast', icon: Minimize2 },
    { title: 'Merge PDF', href: '/tools/merge-pdf', desc: 'Combine multiple PDFs', icon: Files },
    { title: 'Split PDF', href: '/tools/split-pdf', desc: 'Extract selected pages', icon: FileText },
    { title: 'Image to PDF', href: '/tools/image-to-pdf', desc: 'Convert JPG/PNG to PDF', icon: ImageIcon },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-6 md:mt-8">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group rounded-2xl border border-border/60 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-xl p-4 hover:border-primary/40 hover:shadow-[0_12px_30px_-20px_rgba(99,102,241,.65)] transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-violet-500/20 text-primary flex items-center justify-center mb-3">
            <item.icon className="w-4 h-4" />
          </div>
          <p className="font-semibold text-sm flex items-center gap-1.5">
            {item.title}
            <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </p>
          <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
        </Link>
      ))}
    </div>
  );
}

// --- Search + Tools Section ---
function ToolsSection() {
  const [search, setSearch] = useState('');
  const filteredCategories = search.trim()
    ? toolCategories.map(cat => ({
      ...cat,
      tools: cat.tools.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.keywords.some(k => k.includes(search.toLowerCase()))
      ),
    })).filter(cat => cat.tools.length > 0)
    : toolCategories;

  return (
    <section className="bg-background">
      <ToolsHeader search={search} setSearch={setSearch} />
      <div className="container mx-auto px-4 lg:px-8 pt-6 md:pt-8">
        {!search && (
          <>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg md:text-xl font-bold tracking-tight">Popular right now</h2>
              <Link href="/tools" className="text-sm font-medium text-primary hover:underline underline-offset-4">View all tools</Link>
            </div>
            <PopularToolsMiniGrid />
          </>
        )}
      </div>
      {/* Tool Grid */}
      <div className="container mx-auto px-4 lg:px-8 py-12 space-y-6">
        {search && (
          <p className="text-sm font-medium text-muted-foreground">
            {filteredCategories.reduce((acc, c) => acc + c.tools.length, 0)} tools match &quot;{search}&quot;
          </p>
        )}


        {/* Categories */}
        {filteredCategories.map((category, idx) => (
          <div key={category.id}>
            {idx > 0 && <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent my-10" />}
            <motion.section
              id={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4, delay: idx * 0.03 }}
              aria-labelledby={`${category.id}-heading`}
            >
              <CategorySection category={category} />
            </motion.section>
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-muted-foreground">No tools found for &quot;{search}&quot;</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different keyword or open a popular tool below.</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <Link href="/tools/compress-pdf" className="px-3.5 py-2 rounded-lg border border-border/70 text-sm font-medium hover:border-primary/40 hover:text-primary transition-colors">Compress PDF</Link>
              <Link href="/tools/merge-pdf" className="px-3.5 py-2 rounded-lg border border-border/70 text-sm font-medium hover:border-primary/40 hover:text-primary transition-colors">Merge PDF</Link>
              <Link href="/tools/resize-image" className="px-3.5 py-2 rounded-lg border border-border/70 text-sm font-medium hover:border-primary/40 hover:text-primary transition-colors">Resize Image</Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// --- Stats Banner ---
function StatsBanner() {
  const stats = [
    { value: 55, suffix: '+', label: 'Free Tools', icon: Wrench, gradient: 'from-indigo-500 to-violet-500' },
    { value: 99, suffix: '.9%', label: 'Uptime', icon: Server, gradient: 'from-emerald-500 to-teal-500' },
    { value: 8, suffix: '+', label: 'File Formats', icon: Files, gradient: 'from-fuchsia-500 to-pink-500' },
    { value: 0, suffix: '', label: 'Cost', display: 'Free', icon: DollarSign, gradient: 'from-cyan-500 to-blue-500' },
  ];

  return (
    <section className="py-16 relative overflow-hidden border-y border-border/50">
      {/* Subtle gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.03] via-fuchsia-500/[0.02] to-cyan-500/[0.03]" />
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-4xl mx-auto">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="relative text-center p-6 rounded-2xl glass-card group hover:shadow-premium transition-all duration-300"
            >
              {/* Gradient top accent */}
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
      </div>
    </section>
  );
}

// --- How It Works ---
function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      title: 'Upload Your File',
      description: 'Drag & drop or browse. Supports JPG, PNG, WebP, HEIC, PDF and more.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Sliders,
      title: 'Adjust Settings',
      description: 'Configure quality, dimensions, format, or effects to match your needs.',
      color: 'from-violet-500 to-fuchsia-500',
    },
    {
      icon: Download,
      title: 'Download Result',
      description: 'Click process and download instantly. Most results in under 5 seconds.',
      color: 'from-emerald-500 to-teal-600',
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-muted/20 border-t border-border/50 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 dot-pattern opacity-40" />

      <div className="container mx-auto px-4 lg:px-8 max-w-5xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-[0.2em] px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-4">Simple Process</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mt-3 mb-4">
            How It <span className="text-foreground">Works</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Three simple steps. No accounts, no installations, no hassle.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-10 relative">
          {/* Animated connector line */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 overflow-hidden rounded-full">
            <div className="h-full connector-flow" />
          </div>

          {steps.map((step, idx) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              className="relative text-center group"
            >
              <div className={`relative w-24 h-24 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-105 transition-all duration-300`}>
                <step.icon className="w-9 h-9 text-white" />
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center text-xs font-extrabold gradient-text shadow-sm">
                  {idx + 1}
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- Bento Box Features Section ---
function FeaturesSection() {
  const trustBullets = [
    {
      title: 'Private processing',
      description: 'Clear upload, processing, and download states keep sensitive document work predictable.',
      icon: ShieldCheck,
      tone: 'text-emerald-500',
      bg: 'from-emerald-500/15 to-teal-500/10',
    },
    {
      title: 'Reliable results',
      description: 'Professional defaults, clean export surfaces, and fewer dead ends across PDF and image flows.',
      icon: CheckCircle2,
      tone: 'text-sky-500',
      bg: 'from-sky-500/15 to-cyan-500/10',
    },
    {
      title: 'No signup friction',
      description: 'Users can move from upload to final file without account walls or unnecessary distractions.',
      icon: Sparkles,
      tone: 'text-violet-500',
      bg: 'from-violet-500/15 to-fuchsia-500/10',
    },
  ];

  const valueCards = [
    {
      value: '55+',
      label: 'Tools ready',
      description: 'Broad coverage for compression, conversion, editing, and PDF workflows.',
      icon: Files,
      tone: 'text-primary',
      gradient: 'from-primary/18 to-sky-500/10',
    },
    {
      value: 'PDF + Image',
      label: 'One platform',
      description: 'A single polished experience for the document and image jobs users actually need.',
      icon: Server,
      tone: 'text-cyan-500',
      gradient: 'from-cyan-500/18 to-blue-500/10',
    },
    {
      value: 'Fast',
      label: 'Professional output',
      description: 'High-quality exports, strong defaults, and a cleaner finish from upload to download.',
      icon: Zap,
      tone: 'text-amber-500',
      gradient: 'from-amber-500/18 to-orange-500/10',
    },
  ];

  return (
    <section className="relative overflow-hidden border-t border-border/40 bg-muted/10 py-18 md:py-22 lg:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,76,181,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(14,165,170,0.08),transparent_22%),radial-gradient(circle_at_center,rgba(168,85,247,0.06),transparent_32%)]" />
      <div className="pointer-events-none absolute left-1/2 top-8 h-56 w-56 -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />

      <div className="container mx-auto max-w-6xl px-4 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 text-center md:mb-12"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Trust and quality
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            Premium workflows built for
            <span className="block text-primary">documents that need to feel dependable.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-7 text-muted-foreground md:text-lg">
            PdfPixels is designed to look polished, stay clear under pressure, and deliver professional output without turning simple file work into a messy utility experience.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/80 p-7 shadow-premium backdrop-blur-xl md:p-9"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,76,181,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(14,165,170,0.1),transparent_24%)] pointer-events-none" />
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            <div className="relative z-10 flex h-full flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Built for trust
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  <Zap className="h-3.5 w-3.5 text-sky-500" />
                  Fast completion
                </span>
              </div>

              <div className="mt-6 max-w-2xl">
                <h3 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  Clean, premium tooling for image and PDF work that still needs to feel professional.
                </h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
                  The homepage should communicate confidence, not clutter. This section now reinforces the core product promise: reliable workflows, stronger output quality, and a premium experience without signup friction.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {trustBullets.map((bullet) => (
                  <div key={bullet.title} className="rounded-[1.4rem] border border-border/60 bg-background/75 p-4 shadow-soft">
                    <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${bullet.bg}`}>
                      <bullet.icon className={`h-5 w-5 ${bullet.tone}`} />
                    </div>
                    <h4 className="text-base font-bold text-foreground">{bullet.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{bullet.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
            {valueCards.map((card, idx) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.45, delay: idx * 0.06 }}
                className="group relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/80 p-5 shadow-premium backdrop-blur-xl"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-80 pointer-events-none`} />
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
                <div className="relative z-10 flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-background/85 ${card.tone} shadow-soft`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Value
                    </span>
                  </div>
                  <div className="mt-5">
                    <p className="text-2xl font-extrabold tracking-tight text-foreground">{card.value}</p>
                    <p className="mt-1 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">{card.label}</p>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{card.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const visibleFaqs = faqData.slice(0, 10);

  return (
    <section id="faq-section" className="py-16 md:py-20 bg-muted/20 border-t border-border/50">
      <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-[0.2em] px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-4">FAQ</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mt-3 mb-4">
            Frequently Asked <span className="text-foreground">Questions</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Quick answers about our free image and PDF processing tools.
          </p>
        </motion.div>

        <div className="space-y-3">
          {visibleFaqs.map((faq, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.03 }}
              className={`rounded-2xl border bg-card/60 dark:bg-card/40 backdrop-blur-sm overflow-hidden transition-all duration-300 ${openIndex === idx ? 'border-primary/30 shadow-lg shadow-primary/5' : 'border-border/60 hover:border-primary/15'}`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-primary/[0.02] transition-colors"
              >
                <span className="font-semibold text-sm pr-4">{faq.question}</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${openIndex === idx ? 'bg-primary/10 rotate-180' : 'bg-muted'}`}>
                  <ChevronDown className={`w-4 h-4 ${openIndex === idx ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
              </button>
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 flex gap-3">
                      <div className="w-0.5 rounded-full bg-gradient-to-b from-primary/60 via-violet-500/40 to-transparent flex-shrink-0" />
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- CTA Section ---
function CTASection() {
  return (
    <section className="py-16 md:py-20 border-t border-border/50">
      <div className="container mx-auto px-4 lg:px-8 max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="relative p-8 md:p-12 rounded-3xl overflow-hidden aurora-bg">
            {/* Noise overlay */}
            <div className="noise-overlay absolute inset-0 pointer-events-none" />

            {/* Border gradient */}
            <div className="absolute inset-0 rounded-3xl border border-primary/15" />

            {/* Floating sparkles */}
            <div className="absolute top-6 left-8 w-2 h-2 rounded-full bg-primary/30 animate-sparkle" />
            <div className="absolute bottom-8 right-12 w-1.5 h-1.5 rounded-full bg-fuchsia-400/30 animate-sparkle" style={{ animationDelay: '1s' }} />
            <div className="absolute top-12 right-8 w-1 h-1 rounded-full bg-cyan-400/30 animate-sparkle" style={{ animationDelay: '2s' }} />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-5">
                Ready to <span className="gradient-text">Get Started</span>?
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-10 text-lg">
                No signup. No installation. Just upload your file and go.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/tools/compress-image"
                  className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl btn-premium font-semibold text-sm relative z-10"
                >
                  <span className="relative z-10">Try Compress Image</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
                </Link>
                <Link
                  href="/tools/resize-image"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl glass-card font-semibold text-sm hover:border-primary/40 transition-all hover:shadow-premium"
                >
                  Resize Image
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// --- Main Page ---
export default function Home() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <main className="flex-1" role="main">
        <HomePageSchemas />
        <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center">Loading tools...</div>}>
          <ToolsSection />
        </Suspense>
        <StatsBanner />
        <HowItWorks />
        <FeaturesSection />
        <FAQSection />
        <CTASection />
      </main>

      <Footer />

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 w-12 h-12 rounded-2xl btn-premium flex items-center justify-center z-40"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5 relative z-10" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

