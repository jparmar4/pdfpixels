'use client';

import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Clock, DollarSign, Files, Minimize2, Search, Sparkles, Star, Wrench, X, Zap } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatedMeshBg } from '@/components/ui/animated-mesh-bg';
import { CategorySection } from '@/components/layout/category-section';
import { toolCategories } from '@/lib/tools-data';
import { HeaderAd } from '@/components/ads/ad-banner';
import { TypingText } from './typing-text';
import { GeoRegion } from '@/lib/geo-data';

function ToolsHeader({ search, setSearch, region }: { search: string, setSearch: (val: string) => void, region?: GeoRegion }) {
  const floatingBadges = [
    { text: 'Free Forever', Icon: DollarSign, className: 'float-badge-1', color: 'text-emerald-500' },
    { text: 'No Signup', Icon: Zap, className: 'float-badge-2', color: 'text-primary' },
    { text: '55+ Tools', Icon: Wrench, className: 'float-badge-3', color: 'text-violet-500' },
    { text: 'Fast Processing', Icon: Clock, className: 'float-badge-4', color: 'text-cyan-500' },
  ];

  return (
    <section className="relative overflow-hidden border-b border-border/40 min-h-[54vh] flex flex-col justify-center bg-gradient-to-b from-background via-background to-muted/20">
      <AnimatedMeshBg />
      <div className="absolute inset-0 dot-pattern opacity-30" />
      <div className="absolute inset-0 hero-grid" />

      <div className="relative z-10 container mx-auto px-4 lg:px-8 py-16 md:py-24 text-center">
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
              {region ? `Premium PDF & Image Tools for the ${region.adjective} Market` : 'Premium PDF & Image Tools'}
            </h1>
            <div className="text-lg md:text-xl mb-4 max-w-2xl mx-auto font-medium leading-relaxed text-muted-foreground">
              Try{' '}
              <TypingText />
            </div>
            <p id="home-hero-summary" className="text-muted-foreground text-sm md:text-base mb-7 max-w-xl mx-auto font-medium leading-relaxed opacity-80">
              {region 
                ? `Compress, convert, and edit files in seconds. Fast, free, and ${region.localCopy}.`
                : 'Compress, convert, and edit files in seconds with a clean, professional workflow.'}
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
            <ArrowUpRight className="w-3.5 h-3.5" />
          </p>
          <p className="text-xs text-muted-foreground mt-1.5 font-medium">{item.desc}</p>
        </Link>
      ))}
    </div>
  );
}

function ToolsSectionInner({ region, initialSearch = '' }: { region?: GeoRegion; initialSearch?: string }) {
  const [search, setSearch] = useState(initialSearch);

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
      <ToolsHeader search={search} setSearch={setSearch} region={region} />
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
      {/* Ad after primary content starts — better content-to-ad ratio for AdSense */}
      <div className="container mx-auto px-4 lg:px-8 py-4">
        <HeaderAd />
      </div>
      <div className="container mx-auto px-4 lg:px-8 py-12 space-y-6">
        {search && (
          <p className="text-sm font-medium text-muted-foreground">
            {filteredCategories.reduce((acc, c) => acc + c.tools.length, 0)} tools match &quot;{search}&quot;
          </p>
        )}

        {filteredCategories.map((category, idx) => (
          <div key={category.id}>
            {idx > 0 && <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent my-10" />}
            <section id={category.id} aria-labelledby={`${category.id}-heading`}>
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

function ToolsSectionWithSearch({ region }: { region?: GeoRegion }) {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') ?? searchParams.get('q') ?? '';
  return <ToolsSectionInner region={region} initialSearch={initialSearch} />;
}

export function ToolsSection({ region }: { region?: GeoRegion } = {}) {
  return (
    <Suspense fallback={<ToolsSectionInner region={region} />}>
      <ToolsSectionWithSearch region={region} />
    </Suspense>
  );
}
