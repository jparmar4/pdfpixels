'use client';

/* eslint-disable react/no-unescaped-entities */

import { AnimatePresence, motion } from 'framer-motion';
import { Navigation } from '@/components/layout/navigation';
import { CategorySection } from '@/components/layout/category-section';
import { Footer } from '@/components/layout/footer';
import { AnimatedMeshBg } from '@/components/ui/animated-mesh-bg';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { toolCategories } from '@/lib/tools-data';
import { faqData } from '@/lib/seo-config';
import { HomePageSchemas } from '@/components/seo/json-ld';
import {
  ArrowUp, Search, X, ChevronDown, Upload, Sliders,
  Download, Shield, Zap, Globe, Lock, FileImage,
  Sparkles, ArrowRight, CheckCircle2, Star, Wrench,
  Server, Files, DollarSign, Image as ImageIcon, FileText,
  MousePointerClick, Cpu, LineChart
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ─── Magnetic Button Component ───
function MagneticButton({ children, href, className = '' }: { children: React.ReactNode, href: string, className?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current!.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.a
      href={href}
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={`relative ${className}`}
    >
      {children}
    </motion.a>
  );
}

// ─── Animated Counter ───
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

// ─── Floating Decorative Dots ───
function FloatingDots() {
  return (
    <>
      {/* Decorative gradient orbs */}
      <div className="absolute top-20 left-[10%] w-3 h-3 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 opacity-40 animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute top-40 right-[15%] w-2 h-2 rounded-full bg-gradient-to-r from-fuchsia-400 to-pink-400 opacity-30 animate-float" style={{ animationDelay: '1.5s' }} />
      <div className="absolute bottom-32 left-[20%] w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 opacity-35 animate-float" style={{ animationDelay: '3s' }} />
      <div className="absolute top-60 right-[8%] w-2 h-2 rounded-full bg-gradient-to-r from-violet-400 to-purple-400 opacity-25 animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-20 right-[25%] w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-300 to-blue-400 opacity-30 animate-float" style={{ animationDelay: '4s' }} />
      {/* Floating tool icons */}
      <motion.div
        animate={{ y: [-8, 8, -8], rotate: [-3, 3, -3] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-28 left-[8%] md:left-[15%] w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 backdrop-blur-sm border border-indigo-200/30 dark:border-indigo-500/20 flex items-center justify-center opacity-60"
      >
        <ImageIcon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
      </motion.div>
      <motion.div
        animate={{ y: [6, -10, 6], rotate: [2, -2, 2] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute top-36 right-[6%] md:right-[12%] w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500/10 to-pink-500/10 backdrop-blur-sm border border-fuchsia-200/30 dark:border-fuchsia-500/20 flex items-center justify-center opacity-60"
      >
        <FileText className="w-4 h-4 text-fuchsia-500 dark:text-fuchsia-400" />
      </motion.div>
      <motion.div
        animate={{ y: [-5, 12, -5], rotate: [-2, 4, -2] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-28 left-[5%] md:left-[18%] w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/10 to-teal-500/10 backdrop-blur-sm border border-cyan-200/30 dark:border-cyan-500/20 flex items-center justify-center opacity-50"
      >
        <Sparkles className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
      </motion.div>
    </>
  );
}

// ─── Compact Premium Header + Search ───
function ToolsHeader({ search, setSearch }: { search: string, setSearch: (val: string) => void }) {
  return (
    <section className="relative overflow-hidden border-b border-border/40 min-h-[40vh] flex flex-col justify-center">
      {/* SaaS Tier Fluid Background */}
      <AnimatedMeshBg />
      <FloatingDots />

      <div className="relative z-10 container mx-auto px-4 lg:px-8 py-14 md:py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            Professional Image & PDF Tools
          </h1>
          <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto font-medium">
            Fast, secure, and thoughtfully designed for a premium editing experience.
          </p>
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
            placeholder="Search 55+ tools (e.g. compress, merge)..."
            className="block w-full pl-14 pr-12 py-5 border border-white/10 dark:border-white/5 rounded-2xl leading-5 bg-card/60 dark:bg-card/40 backdrop-blur-xl shadow-2xl shadow-primary/20 placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-base font-medium"
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
    </section>
  );
}

// ─── Search + Tools Section ───
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
      {/* Tool Grid */}
      <div className="container mx-auto px-4 lg:px-8 py-12 space-y-6">
        {search && (
          <p className="text-sm font-medium text-muted-foreground">
            {filteredCategories.reduce((acc, c) => acc + c.tools.length, 0)} tools match &quot;{search}&quot;
          </p>
        )}

        {/* AI Tools Highlight */}
        {!search && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-50/80 to-violet-50/40 dark:from-indigo-500/[0.08] dark:to-violet-500/[0.05] border border-indigo-200/60 dark:border-indigo-500/15 shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-bold text-violet-700 dark:text-violet-300">AI-Powered Tools</span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 text-violet-600 dark:text-violet-400 border border-violet-200/60 dark:border-violet-500/25">
                  OpenAI
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Remove backgrounds, enhance photos, upscale images, blur faces — all powered by advanced AI.</p>
            </div>
          </motion.div>
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
            <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Stats Banner ───
function StatsBanner() {
  const stats = [
    { value: 55, suffix: '+', label: 'Free Tools', icon: Wrench, gradient: 'from-indigo-500 to-violet-500' },
    { value: 99, suffix: '.9%', label: 'Uptime', icon: Server, gradient: 'from-emerald-500 to-teal-500' },
    { value: 8, suffix: '+', label: 'File Formats', icon: Files, gradient: 'from-fuchsia-500 to-pink-500' },
    { value: 0, suffix: '₹', label: 'Cost', display: 'Free', icon: DollarSign, gradient: 'from-cyan-500 to-blue-500' },
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

// ─── How It Works ───
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

// ─── Bento Box Features Section ───
function FeaturesSection() {
  return (
    <section className="py-32 border-t border-border/30 relative overflow-hidden bg-muted/10">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8 max-w-6xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <span className="inline-flex items-center justify-center font-bold text-primary uppercase tracking-[0.2em] mb-4 text-xs">Platform Capabilities</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-6">
            Everything you need,<br />
            <span className="text-primary">nothing you don't.</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            A meticulously crafted suite of tools designed to handle your documents natively, securely, and instantly.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[280px]">

          {/* Main Feature - Large Col Span */}
          <SpotlightCard className="md:col-span-2 lg:col-span-2 row-span-2 flex flex-col justify-end p-8 sm:p-10 group" spotlightColor="rgba(99, 102, 241, 0.4)">
            <div className="absolute inset-x-8 top-8 bottom-48 rounded-2xl border border-border/50 bg-background/50 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                <Lock className="w-24 h-24 text-primary/40 drop-shadow-2xl" strokeWidth={1} />
              </div>
            </div>

            <div className="relative z-10 mt-auto">
              <div className="w-12 h-12 rounded-xl bg-card border border-border/60 flex items-center justify-center mb-6 shadow-sm">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 tracking-tight">Privacy-First Processing</h3>
              <p className="text-muted-foreground font-medium leading-relaxed max-w-sm">
                Files are processed securely with automatic cleanup and no account required.
              </p>
            </div>
          </SpotlightCard>

          {/* Secondary Feature - High */}
          <SpotlightCard className="md:col-span-1 lg:col-span-2 row-span-1 p-6 md:p-8 group flex items-center gap-5 md:gap-8" spotlightColor="rgba(16, 185, 129, 0.3)">
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-3 tracking-tight">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                Powered by WebAssembly for near-native speeds. Resize 50 images before traditional cloud services finish uploading one.
              </p>
            </div>
            <div className="hidden sm:flex w-24 h-24 rounded-full bg-emerald-500/10 items-center justify-center shrink-0 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
              <Zap className="w-10 h-10 text-emerald-500" />
            </div>
          </SpotlightCard>

          {/* Small Feature 1 */}
          <SpotlightCard className="md:col-span-1 lg:col-span-1 row-span-1 p-8 flex flex-col group" spotlightColor="rgba(217, 70, 239, 0.3)">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-pink-500/10 flex items-center justify-center mb-auto border border-fuchsia-500/20 group-hover:-translate-y-2 transition-transform duration-300">
              <Sparkles className="w-5 h-5 text-fuchsia-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">Beautiful UI</h3>
              <p className="text-sm text-muted-foreground font-medium">Crafted for focus. No intrusive popups, pure utility.</p>
            </div>
          </SpotlightCard>

          {/* Small Feature 2 */}
          <SpotlightCard className="md:col-span-1 lg:col-span-1 row-span-1 p-8 flex flex-col group" spotlightColor="rgba(6, 182, 212, 0.3)">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 flex items-center justify-center mb-auto border border-cyan-500/20 group-hover:-translate-y-2 transition-transform duration-300">
              <Globe className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">Free Forever</h3>
              <p className="text-sm text-muted-foreground font-medium">No paywalls or premium tiers. Every tool is unlocked.</p>
            </div>
          </SpotlightCard>

          {/* Bottom Wide Feature */}
          <SpotlightCard className="md:col-span-3 lg:col-span-4 row-span-1 p-6 sm:p-8 md:p-10 flex flex-col sm:flex-row items-center gap-5 md:gap-8 group" spotlightColor="rgba(245, 158, 11, 0.3)">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-500 mb-4">
                <Cpu className="w-3.5 h-3.5" />
                No Cloud Required
              </div>
              <h3 className="text-2xl font-bold mb-3 tracking-tight">Works Offline</h3>
              <p className="text-muted-foreground font-medium leading-relaxed max-w-2xl">
                Once loaded, PdfPixels can run entirely without internet connection. Perfect for handling confidential documents while traveling or in secure environments.
              </p>
            </div>
            <div className="w-full sm:w-1/3 h-full min-h-[120px] rounded-xl border border-border/50 bg-background/50 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
              <LineChart className="w-16 h-16 text-muted-foreground/30 group-hover:text-amber-500/50 transition-colors duration-500" />
            </div>
          </SpotlightCard>

        </div>
      </div>
    </section>
  );
}

// ─── FAQ Section ───
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

// ─── CTA Section ───
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

// ─── Main Page ───
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
        <ToolsSection />
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
