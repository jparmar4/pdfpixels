'use client';

import { useDeferredValue, useState, useMemo, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Clock, DollarSign, Files, Minimize2, Search, Sparkles, Star, Wrench, X, Zap } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatedMeshBg } from '@/components/ui/animated-mesh-bg';
import { CategorySection } from '@/components/layout/category-section';
import { allTools, toolCategories, ToolCategory } from '@/lib/tools-data';
import { HeaderAd } from '@/components/ads/ad-banner';
import { TypingText } from './typing-text';
import { GeoRegion } from '@/lib/geo-data';

function ToolsHeader({
  search,
  setSearch,
  region,
  onSelectTab,
}: {
  search: string;
  setSearch: (val: string) => void;
  region?: GeoRegion;
  onSelectTab?: (tab: 'all' | 'pdf' | 'image') => void;
}) {
  const floatingBadges = [
    { text: 'Free Forever', Icon: DollarSign, className: 'float-badge-1', color: 'text-emerald-500' },
    { text: 'No Signup', Icon: Zap, className: 'float-badge-2', color: 'text-primary' },
    { text: `${allTools.length}+ Tools`, Icon: Wrench, className: 'float-badge-3', color: 'text-violet-500' },
    { text: 'Fast Processing', Icon: Clock, className: 'float-badge-4', color: 'text-cyan-500' },
  ];

  const handleTabClick = (tab: 'all' | 'pdf' | 'image') => {
    onSelectTab?.(tab);
    const el = document.getElementById('tools-directory');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
            <Link href="/pdf-tools" className="group mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-gradient-to-r from-primary/10 via-sky-500/10 to-indigo-500/10 px-5 py-1.5 text-sm font-bold text-primary transition-all hover:scale-105 hover:shadow-[0_8px_30px_rgba(99,102,241,0.2)] shadow-sm">
              <Sparkles className="h-4 w-4 group-hover:scale-110 transition-transform" />
              Explore All 52 Free Online PDF Tools
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            {region ? (
              <h2 id="home-hero-title" className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-2 leading-[1.05]">
                {`Tools people in ${region.name} use most`}
              </h2>
            ) : (
              <h1 id="home-hero-title" className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-2 leading-[1.05]">
                Premium PDF & Image Tools
              </h1>
            )}
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
              <Link href="/pdf-tools" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:opacity-95 transition-opacity">
                All PDF Tools (52)
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/tools" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border/70 bg-background/80 text-sm font-semibold hover:border-primary/40 hover:text-primary transition-colors">
                Browse All Tools
              </Link>
            </div>

            <p className="text-xs text-muted-foreground">{allTools.length}+ tools · Free forever · Works on mobile and desktop</p>
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

          {/* Quick Action Pills */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="font-semibold text-muted-foreground/80">Quick filter:</span>
            <button
              type="button"
              onClick={() => handleTabClick('pdf')}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-bold text-primary transition-all hover:bg-primary/20 hover:scale-105"
            >
              📄 PDF Tools (52)
            </button>
            <Link
              href="/tools/compress-pdf"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1 font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground hover:scale-105"
            >
              Compress PDF
            </Link>
            <Link
              href="/tools/merge-pdf"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1 font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground hover:scale-105"
            >
              Merge PDF
            </Link>
            <Link
              href="/tools/pdf-to-word"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1 font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground hover:scale-105"
            >
              PDF to Word
            </Link>
            <Link
              href="/tools/sign-pdf"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1 font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground hover:scale-105"
            >
              Sign PDF
            </Link>
            <button
              type="button"
              onClick={() => handleTabClick('image')}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1 font-bold text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground hover:scale-105"
            >
              🖼️ Image Tools (53)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function PopularToolsMiniGrid() {
  const items = [
    { title: 'Compress PDF', href: '/tools/compress-pdf', desc: 'Reduce file size fast', icon: Minimize2 },
    { title: 'Merge PDF', href: '/tools/merge-pdf', desc: 'Combine multiple PDFs', icon: Files },
    { title: 'Linearize PDF', href: '/tools/linearize-pdf', desc: 'Fast web view optimization', icon: Zap, badge: 'New' },
    { title: 'Remove BG', href: '/tools/remove-image-background', desc: 'AI background removal', icon: Sparkles, badge: 'AI' },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-6 md:mt-8">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`group relative rounded-2xl border ${item.badge === 'New' ? 'border-amber-500/20 shadow-[0_16px_40px_-18px_rgba(245,158,11,.2)] bg-gradient-to-b from-amber-500/[0.03] to-card/40' : 'border-border/60 bg-gradient-to-b from-card/80 to-card/40 shadow-soft'} backdrop-blur-xl p-4 hover:-translate-y-1 hover:shadow-premium transition-all duration-300`}
        >
          {item.badge ? (
             <span className={`absolute -top-2.5 -right-2 z-10 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] shadow-sm text-white ${item.badge === 'New' ? 'bg-gradient-to-r from-amber-500 to-orange-600' : 'bg-gradient-to-r from-violet-500 to-fuchsia-600'}`}>
                {item.badge}
             </span>
          ) : (
             <span className="absolute -top-2.5 -right-2 z-10 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white text-[9px] font-black uppercase tracking-[0.15em] shadow-sm">
                <Star className="w-2.5 h-2.5 fill-current" />
                Popular
             </span>
          )}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 ${item.badge === 'New' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
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

function ToolsSectionInner({
  region,
  initialSearch = '',
  initialTab = 'all',
}: {
  region?: GeoRegion;
  initialSearch?: string;
  initialTab?: 'all' | 'pdf' | 'image' | 'popular' | 'ai';
}) {
  const [search, setSearch] = useState(initialSearch);
  const [activeTab, setActiveTab] = useState<'all' | 'pdf' | 'image' | 'popular' | 'ai'>(initialTab);

  // Defer heavy category filtering so typing stays responsive (INP).
  const deferredSearch = useDeferredValue(search);
  const query = deferredSearch.trim().toLowerCase();

  const filteredCategories = useMemo<ToolCategory[]>(() => {
    // 1. Filter by category tab
    let baseCategories: ToolCategory[] = toolCategories;

    if (activeTab === 'pdf') {
      baseCategories = toolCategories
        .map((cat) => {
          if (cat.id.startsWith('pdf-')) return cat;
          if (cat.id === 'most-used') {
            return {
              ...cat,
              tools: cat.tools.filter((t) => t.category.startsWith('pdf') || t.slug.includes('pdf') || t.id === 'image-to-pdf'),
            };
          }
          return { ...cat, tools: [] };
        })
        .filter((cat) => cat.tools.length > 0);
    } else if (activeTab === 'image') {
      baseCategories = toolCategories
        .map((cat) => {
          if (cat.id.startsWith('pdf-')) return { ...cat, tools: [] };
          if (cat.id === 'most-used') {
            return {
              ...cat,
              tools: cat.tools.filter((t) => !t.category.startsWith('pdf') && t.id !== 'image-to-pdf'),
            };
          }
          return cat;
        })
        .filter((cat) => cat.tools.length > 0);
    } else if (activeTab === 'popular') {
      baseCategories = toolCategories
        .map((cat) => ({
          ...cat,
          tools: cat.tools.filter((t) => t.popular),
        }))
        .filter((cat) => cat.tools.length > 0);
    } else if (activeTab === 'ai') {
      baseCategories = toolCategories
        .map((cat) => ({
          ...cat,
          tools: cat.tools.filter((t) => t.isAI || t.processing === 'ai'),
        }))
        .filter((cat) => cat.tools.length > 0);
    }

    // 2. Filter by search query
    if (query) {
      return baseCategories
        .map((cat) => ({
          ...cat,
          tools: cat.tools.filter(
            (t) =>
              t.name.toLowerCase().includes(query) ||
              t.description.toLowerCase().includes(query) ||
              t.keywords.some((k) => k.includes(query))
          ),
        }))
        .filter((cat) => cat.tools.length > 0);
    }

    return baseCategories;
  }, [activeTab, query]);

  return (
    <section className="bg-background">
      <ToolsHeader
        search={search}
        setSearch={setSearch}
        region={region}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSearch('');
        }}
      />

      <div className="container mx-auto px-4 lg:px-8 pt-2 md:pt-4">
        {!search && (
          <>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg md:text-xl font-bold tracking-tight">Popular right now</h2>
              <Link href="/tools" className="text-sm font-medium text-primary hover:underline underline-offset-4">
                View all tools
              </Link>
            </div>
            <PopularToolsMiniGrid />
          </>
        )}
      </div>

      {/* Ad after primary content starts — better content-to-ad ratio for AdSense */}
      <div className="container mx-auto px-4 lg:px-8 py-4">
        <HeaderAd />
      </div>

      {/* Directory Category Filter Tabs */}
      <div id="tools-directory" className="container mx-auto px-4 lg:px-8 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
          <div className="scroll-carousel flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-all duration-200 ${
                activeTab === 'all'
                  ? 'btn-premium text-white shadow-primary shadow-sm'
                  : 'border border-border/60 bg-card/80 text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              All Tools ({allTools.length})
            </button>
            <button
              onClick={() => setActiveTab('pdf')}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-all duration-200 ${
                activeTab === 'pdf'
                  ? 'btn-premium text-white shadow-primary shadow-sm'
                  : 'border border-border/60 bg-card/80 text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              📄 PDF Tools (52)
            </button>
            <button
              onClick={() => setActiveTab('image')}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-all duration-200 ${
                activeTab === 'image'
                  ? 'btn-premium text-white shadow-primary shadow-sm'
                  : 'border border-border/60 bg-card/80 text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              🖼️ Image Tools (53)
            </button>
            <button
              onClick={() => setActiveTab('popular')}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-all duration-200 ${
                activeTab === 'popular'
                  ? 'btn-premium text-white shadow-primary shadow-sm'
                  : 'border border-border/60 bg-card/80 text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              <Star className="h-3 w-3" />
              Popular
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-all duration-200 ${
                activeTab === 'ai'
                  ? 'btn-premium text-white shadow-primary shadow-sm'
                  : 'border border-border/60 bg-card/80 text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              AI Tools
            </button>
          </div>

          {activeTab === 'pdf' && (
            <Link
              href="/pdf-tools"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              Open Dedicated PDF Suite Page →
            </Link>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8 space-y-6">
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
            <p className="text-sm text-muted-foreground mt-1">Try a different keyword or reset filters.</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <button
                onClick={() => {
                  setSearch('');
                  setActiveTab('all');
                }}
                className="px-3.5 py-2 rounded-lg bg-primary text-white text-sm font-semibold"
              >
                Reset All Filters
              </button>
              <Link href="/pdf-tools" className="px-3.5 py-2 rounded-lg border border-border/70 text-sm font-medium hover:border-primary/40 hover:text-primary transition-colors">
                All 52 PDF Tools
              </Link>
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
  const tabParam = searchParams.get('tab') ?? searchParams.get('category') ?? '';
  const initialTab =
    tabParam === 'pdf' || tabParam === 'pdf-tools'
      ? 'pdf'
      : tabParam === 'image' || tabParam === 'image-tools'
        ? 'image'
        : 'all';

  return <ToolsSectionInner region={region} initialSearch={initialSearch} initialTab={initialTab} />;
}

export function ToolsSection({ region }: { region?: GeoRegion } = {}) {
  return (
    <Suspense fallback={<ToolsSectionInner region={region} />}>
      <ToolsSectionWithSearch region={region} />
    </Suspense>
  );
}

