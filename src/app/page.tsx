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
  Minimize2, ShieldCheck, BookOpen, Star, Users, Clock, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { HeaderAd, NativeAd } from '@/components/ads/ad-banner';

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

// --- Typing Text Effect ---
function TypingText() {
  const words = [
    'Compress PDF',
    'Merge PDF',
    'Remove Background',
    'Resize Image',
    'Convert HEIC to JPG',
    'Split PDF',
    'Compress Image',
    'Image to PDF',
  ];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState(words[0]); // Match SSR
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[currentIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting && displayText === currentWord) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayText === '') {
      timeout = setTimeout(() => {
        setIsDeleting(false);
        setCurrentIndex((prev) => (prev + 1) % words.length);
      }, 300);
    } else {
      timeout = setTimeout(() => {
        setDisplayText(
          isDeleting
            ? currentWord.substring(0, displayText.length - 1)
            : currentWord.substring(0, displayText.length + 1)
        );
      }, isDeleting ? 40 : 80);
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentIndex]);

  return (
    <span className="gradient-text inline-block min-w-[200px] md:min-w-[320px] text-left">
      {displayText || '\u00A0'}
      <span className="inline-block w-[3px] h-[0.85em] bg-primary ml-0.5 align-middle animate-pulse" />
    </span>
  );
}

// --- Compact Premium Header + Search ---
function ToolsHeader({ search, setSearch }: { search: string, setSearch: (val: string) => void }) {
  const floatingBadges = [
    { text: 'Free Forever', Icon: DollarSign, className: 'float-badge-1', color: 'text-emerald-500' },
    { text: 'No Signup', Icon: Zap, className: 'float-badge-2', color: 'text-primary' },
    { text: '55+ Tools', Icon: Wrench, className: 'float-badge-3', color: 'text-violet-500' },
    { text: 'Fast Processing', Icon: Clock, className: 'float-badge-4', color: 'text-cyan-500' },
  ];

  return (
    <section className="relative overflow-hidden border-b border-border/40 min-h-[54vh] flex flex-col justify-center bg-gradient-to-b from-background via-background to-muted/20">
      {/* SaaS Tier Fluid Background */}
      <AnimatedMeshBg />

      {/* Particle dot grid background */}
      <div className="absolute inset-0 dot-pattern opacity-30" />
      <div className="absolute inset-0 hero-grid" />

      <div className="relative z-10 container mx-auto px-4 lg:px-8 py-16 md:py-24 text-center">
        {/* Floating decorative badges */}
        <div className="absolute inset-0 pointer-events-none hidden lg:block">
          {floatingBadges.map((badge, idx) => {
            const BadgeIcon = badge.Icon;
            const positions = [
              'top-[12%] left-[8%]',
              'top-[18%] right-[10%]',
              'bottom-[22%] left-[12%]',
              'bottom-[18%] right-[8%]',
            ];
            return (
              <motion.div
                key={badge.text}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + idx * 0.15, ease: [0.16, 1, 0.3, 1] }}
                className={`${badge.className} absolute ${positions[idx]}`}
              >
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-premium transition-shadow text-xs font-bold text-muted-foreground">
                  <BadgeIcon className={`w-3.5 h-3.5 ${badge.color}`} />
                  {badge.text}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="max-w-4xl mx-auto rounded-3xl border border-border/60 bg-card/60 backdrop-blur-2xl shadow-[0_24px_80px_-32px_rgba(99,102,241,.5)] px-6 md:px-10 py-10 md:py-14">
          <motion.div
            /* Removed initial opacity to ensure text is visible during slow hydration */
            initial={{ y: 15 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link href="/tools/linearize-pdf" className="group mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-5 py-1.5 text-sm font-bold text-amber-600 dark:text-amber-500 transition-all hover:scale-105 hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)] shadow-sm">
              <Zap className="h-4 w-4 group-hover:scale-110 transition-transform" />
              New Pro Tool: Fast Web View (Linearize)
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <h1 id="home-hero-title" className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-2 leading-[1.05]">
              Premium PDF & Image Tools
            </h1>
            <div className="text-lg md:text-xl mb-4 max-w-2xl mx-auto font-medium leading-relaxed text-muted-foreground">
              Try{' '}
              <TypingText />
            </div>
            <p id="home-hero-summary" className="text-muted-foreground text-sm md:text-base mb-7 max-w-xl mx-auto font-medium leading-relaxed opacity-80">
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
    { title: 'Linearize PDF', href: '/tools/linearize-pdf', desc: 'Fast web view optimization', icon: Zap, isPro: true, badge: 'Pro' },
    { title: 'Remove BG', href: '/tools/remove-image-background', desc: 'AI background removal', icon: Sparkles, isPro: true, badge: 'AI' },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-6 md:mt-8">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`group relative rounded-2xl border ${item.isPro ? 'border-amber-500/20 shadow-[0_16px_40px_-18px_rgba(245,158,11,.2)] bg-gradient-to-b from-amber-500/[0.03] to-card/40' : 'border-border/60 bg-gradient-to-b from-card/80 to-card/40 shadow-soft'} backdrop-blur-xl p-4 hover:-translate-y-1 hover:shadow-premium transition-all duration-300`}
        >
          {item.badge ? (
             <span className={`absolute -top-2.5 -right-2 z-10 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] shadow-sm text-white ${item.badge === 'Pro' ? 'bg-gradient-to-r from-amber-500 to-orange-600' : 'bg-gradient-to-r from-violet-500 to-fuchsia-600'}`}>
                {item.badge}
             </span>
          ) : (
             <span className="absolute -top-2.5 -right-2 z-10 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white text-[9px] font-black uppercase tracking-[0.15em] shadow-sm">
                <Star className="w-2.5 h-2.5 fill-current" />
                Popular
             </span>
          )}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 ${item.isPro ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
            <item.icon className="w-5 h-5" />
          </div>
          <p className="font-bold text-sm flex items-center gap-1.5 text-foreground group-hover:text-primary transition-colors">
            {item.title}
            <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
          </p>
          <p className="text-xs text-muted-foreground mt-1.5 font-medium">{item.desc}</p>
        </Link>
      ))}
    </div>
  );
}

// --- Search + Tools Section ---
function ToolsSection() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') ?? searchParams.get('q') ?? '';
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

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
      <div className="container mx-auto px-4 lg:px-8 py-6">
        <HeaderAd />
      </div>
      <div className="container mx-auto px-4 lg:px-8 pt-2 md:pt-4">
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
            <section
              id={category.id}
              aria-labelledby={`${category.id}-heading`}
            >
              <CategorySection category={category} />
            </section>
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

function AnswerEngineSection() {
  const answerCards = [
    {
      question: 'What is the fastest free way to compress a PDF online?',
      answer: 'Use PdfPixels Compress PDF to upload a document, choose a compression level, and download a smaller PDF without creating an account.',
      href: '/tools/compress-pdf',
      cta: 'Open Compress PDF',
    },
    {
      question: 'Can I merge or split PDF files without installing software?',
      answer: 'Yes. PdfPixels provides browser-friendly PDF merge, split, rotate, reorder, delete, watermark, and conversion workflows for everyday document jobs.',
      href: '/tools/merge-pdf',
      cta: 'Open Merge PDF',
    },
    {
      question: 'Which image tools are available for uploads, forms, and social media?',
      answer: 'PdfPixels supports image compression, resizing, format conversion, background removal, passport photo creation, metadata cleanup, and OCR.',
      href: '/tools/resize-image',
      cta: 'Open Resize Image',
    },
  ];

  return (
    <section className="border-t border-border/50 bg-background py-16 md:py-20">
      <div className="container mx-auto max-w-6xl px-4 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Search and AI answers
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Direct answers for common PDF and image tasks
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
            PdfPixels is built for high-intent workflows: reduce file size, combine documents, convert formats, prepare application photos, and clean up files quickly on any modern device.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {answerCards.map((card) => (
            <article key={card.question} className="flex h-full flex-col rounded-2xl border border-border/60 bg-card/75 p-5 shadow-soft">
              <h3 className="text-base font-bold leading-6 text-foreground">{card.question}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{card.answer}</p>
              <Link href={card.href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-4">
                {card.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
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

// --- Testimonials Section ---
function TestimonialsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [activeDot, setActiveDot] = useState(0);

  const testimonials = [
    {
      name: 'Sarah Mitchell',
      role: 'Marketing Manager',
      initials: 'SM',
      color: 'from-violet-500 to-purple-600',
      text: 'PdfPixels has been a game-changer for our team. We compress hundreds of PDFs weekly and the quality is always outstanding. The speed is incredible compared to other tools.',
      stars: 5,
    },
    {
      name: 'James Rodriguez',
      role: 'Freelance Designer',
      initials: 'JR',
      color: 'from-cyan-500 to-blue-600',
      text: 'The image compression and background removal tools are absolutely perfect. I use them daily for client work. Clean interface, fast results, and no watermarks.',
      stars: 5,
    },
    {
      name: 'Emily Chen',
      role: 'University Researcher',
      initials: 'EC',
      color: 'from-emerald-500 to-teal-600',
      text: 'I love how simple everything is. No signup, no ads, no nonsense. Just upload, process, download. The HEIC to JPG converter saved me so much time.',
      stars: 5,
    },
    {
      name: 'Michael Brooks',
      role: 'Small Business Owner',
      initials: 'MB',
      color: 'from-amber-500 to-orange-600',
      text: 'Merge PDF is my most-used feature. Combining invoices and reports into one file has never been easier. It handles large files without breaking a sweat.',
      stars: 5,
    },
    {
      name: 'Lisa Thompson',
      role: 'Content Creator',
      initials: 'LT',
      color: 'from-fuchsia-500 to-pink-600',
      text: 'The resize and crop tools are perfect for social media. I batch process images all the time and PdfPixels handles it flawlessly. Highly recommended!',
      stars: 5,
    },
    {
      name: 'David Kim',
      role: 'Software Engineer',
      initials: 'DK',
      color: 'from-sky-500 to-indigo-600',
      text: 'As a developer, I appreciate clean tools that just work. PdfPixels nails this — fast API-like performance with a beautiful UI. Split PDF is fantastic.',
      stars: 5,
    },
  ];

  // Auto-scroll only when visible (performance: avoid rAF when off-screen)
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setIsVisible(e.isIntersecting),
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!scrollRef.current || isHovered || !isVisible) return;
    const container = scrollRef.current;
    let scrollPos = 0;
    let animationId: number;

    const autoScroll = () => {
      scrollPos += 0.5;
      if (scrollPos >= container.scrollWidth / 2) {
        scrollPos = 0;
      }
      container.scrollLeft = scrollPos;
      animationId = requestAnimationFrame(autoScroll);
    };

    animationId = requestAnimationFrame(autoScroll);
    return () => cancelAnimationFrame(animationId);
  }, [isHovered, isVisible]);

  // Update active dot based on scroll position
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const cardWidth = 316;
      const idx = Math.round(container.scrollLeft / cardWidth) % testimonials.length;
      setActiveDot(idx);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToIndex = useCallback((idx: number) => {
    if (!scrollRef.current) return;
    const cardWidth = 316;
    scrollRef.current.scrollTo({ left: idx * cardWidth, behavior: 'smooth' });
    setActiveDot(idx);
  }, []);

  const scrollPrev = useCallback(() => {
    const prevIdx = activeDot === 0 ? testimonials.length - 1 : activeDot - 1;
    scrollToIndex(prevIdx);
  }, [activeDot, scrollToIndex, testimonials.length]);

  const scrollNext = useCallback(() => {
    const nextIdx = (activeDot + 1) % testimonials.length;
    scrollToIndex(nextIdx);
  }, [activeDot, scrollToIndex, testimonials.length]);

  return (
    <section ref={sectionRef} className="py-16 md:py-20 bg-background border-t border-border/50 relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 max-w-6xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-[0.2em] px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-4">
            <Users className="w-3.5 h-3.5" />
            Loved by thousands
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mt-3 mb-4">
            What Our <span className="text-foreground">Users Say</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Trusted by professionals, creators, and teams around the world.
          </p>
        </motion.div>

        {/* Carousel with navigation */}
        <div className="relative">
          {/* Left arrow */}
          <button
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-20 w-10 h-10 rounded-full glass-card shadow-premium flex items-center justify-center hover:border-primary/30 transition-all hidden md:flex"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Right arrow */}
          <button
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-20 w-10 h-10 rounded-full glass-card shadow-premium flex items-center justify-center hover:border-primary/30 transition-all hidden md:flex"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Gradient fade edges */}
          <div className="absolute left-0 top-0 bottom-3 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-3 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          {/* Scrollable carousel */}
          <div
            ref={scrollRef}
            className="scroll-carousel px-2"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Duplicate cards for seamless loop */}
            {[...testimonials, ...testimonials].map((testimonial, idx) => (
              <div key={`test-${idx}`} className="testimonial-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                    {testimonial.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: testimonial.stars }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
              </div>
            ))}
          </div>

          {/* Navigation dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollToIndex(idx)}
                className={`rounded-full transition-all duration-300 ${
                  activeDot === idx
                    ? 'w-6 h-2 bg-primary'
                    : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Go to testimonial ${idx + 1}`}
              />
            ))}
          </div>
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
          
          <div className="py-4">
            <NativeAd />
          </div>
        </div>
      </div>
    </section>
  );
}

// --- CTA Section ---
function CTASection() {
  return (
    <section className="py-16 md:py-20 border-t border-border/50 relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="relative p-8 md:p-12 rounded-3xl overflow-hidden aurora-bg">
            {/* Noise overlay */}
            <div className="noise-overlay absolute inset-0 pointer-events-none" />

            {/* Animated gradient border */}
            <div className="absolute inset-0 rounded-3xl p-[2px] overflow-hidden">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/30 via-fuchsia-500/20 to-cyan-500/30 animate-gradient-shift" style={{ backgroundSize: '300% 300%' }} />
            </div>

            {/* Inner border */}
            <div className="absolute inset-[2px] rounded-3xl border border-primary/15" />

            {/* Floating sparkles */}
            <div className="absolute top-6 left-8 w-2 h-2 rounded-full bg-primary/30 animate-sparkle" />
            <div className="absolute bottom-8 right-12 w-1.5 h-1.5 rounded-full bg-fuchsia-400/30 animate-sparkle" style={{ animationDelay: '1s' }} />
            <div className="absolute top-12 right-8 w-1 h-1 rounded-full bg-cyan-400/30 animate-sparkle" style={{ animationDelay: '2s' }} />
            <div className="absolute bottom-12 left-10 w-1.5 h-1.5 rounded-full bg-emerald-400/25 animate-sparkle" style={{ animationDelay: '0.5s' }} />

            <div className="relative z-10">
              {/* User count badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
                <div className="flex -space-x-2">
                  <div className="avatar-ring bg-gradient-to-br from-violet-500 to-purple-600">S</div>
                  <div className="avatar-ring bg-gradient-to-br from-cyan-500 to-blue-600">J</div>
                  <div className="avatar-ring bg-gradient-to-br from-emerald-500 to-teal-600">E</div>
                  <div className="avatar-ring bg-gradient-to-br from-amber-500 to-orange-600">M</div>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  Join <span className="text-foreground"><AnimatedCounter end={1250} suffix="+" duration={2500} /></span> happy users
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-5">
                Ready to <span className="gradient-text">Get Started</span>?
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-10 text-lg">
                No signup. No installation. Just upload your file and go.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
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
                <Link
                  href="/tools/remove-image-background"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/5 text-sm font-semibold text-fuchsia-600 dark:text-fuchsia-400 hover:bg-fuchsia-500/10 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Try AI Tools
                </Link>
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border/70 bg-background/50 text-sm font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
                >
                  <BookOpen className="w-4 h-4" />
                  Explore Blog
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
        <AnswerEngineSection />
        <TestimonialsSection />
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
