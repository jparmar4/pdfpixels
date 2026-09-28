'use client';

import { useDeferredValue, useState, useMemo, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Clock, Files, Minimize2, Search, ShieldCheck, Sparkles, Star, Wrench, X, Zap } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  const handleTabClick = (tab: 'all' | 'pdf' | 'image') => {
    onSelectTab?.(tab);
    const el = document.getElementById('tools-directory');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const trustItems = [
    { icon: Zap, label: 'No signup' },
    { icon: ShieldCheck, label: 'Private & secure' },
    { icon: Wrench, label: `${allTools.length}+ free tools` },
    { icon: Clock, label: 'Results in seconds' },
  ];

  const quickLinks = [
    { label: 'Compress PDF', href: '/tools/compress-pdf' },
    { label: 'Merge PDF', href: '/tools/merge-pdf' },
    { label: 'PDF to Word', href: '/tools/pdf-to-word' },
    { label: 'Remove background', href: '/tools/remove-image-background' },
    { label: 'Sign PDF', href: '/tools/sign-pdf' },
  ];

  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-accent/60 via-background to-background">
      <div className="absolute inset-0 hero-grid" aria-hidden="true" />

      <div className="relative z-10 container mx-auto px-4 lg:px-8 py-14 md:py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ y: 12 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            {region ? (
              <>
                <h2 id="home-hero-title" className="text-4xl md:text-5xl font-bold tracking-tight mb-3 leading-[1.08]">
                  Tools people in <span className="gradient-text">{region.name}</span> use most
                </h2>
                <p className="text-base md:text-lg mb-8 max-w-2xl mx-auto leading-relaxed text-muted-foreground">
                  Compress, convert, and edit files in seconds. Fast, free, and {region.localCopy}.
                </p>
              </>
            ) : (
              <>
                <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card px-4 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground shadow-soft">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  The complete PDF &amp; image toolkit — free forever
                </p>
                <h1 id="home-hero-title" className="text-balance text-4xl md:text-5xl lg:text-[3.4rem] font-bold tracking-tight mb-3 leading-[1.06]">
                  PDF &amp; image tools that <span className="gradient-text whitespace-nowrap">just work</span>
                </h1>
                <p className="text-base md:text-lg mb-5 max-w-2xl mx-auto leading-relaxed text-muted-foreground">
                  Compress, convert, edit, and sign files in seconds — right in your browser.
                </p>
                <p className="text-base md:text-lg mb-8 font-medium text-foreground">
                  Try <TypingText />
                </p>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ y: 16 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-w-2xl mx-auto group z-20"
          >
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search 105+ tools — try “compress pdf”"
              aria-label="Search tools"
              className="block w-full pl-14 pr-12 py-4 border border-border rounded-2xl leading-5 bg-card shadow-premium placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all text-base font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-5 flex items-center text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </motion.div>

          <motion.div
            initial={{ y: 10 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
          >
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[13px]">
              <span className="font-medium text-muted-foreground">Popular:</span>
              {quickLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/pdf-tools"
                className="btn-premium inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold"
              >
                Explore PDF tools
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => handleTabClick('image')}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-soft transition-colors hover:border-primary/40 hover:text-primary"
              >
                Image tools
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] font-medium text-muted-foreground">
              {trustItems.map((item) => (
                <span key={item.label} className="inline-flex items-center gap-1.5">
                  <item.icon className="h-4 w-4 text-primary/70" />
                  {item.label}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function PopularToolsMiniGrid() {
  const items = [
    { title: 'Compress PDF', href: '/tools/compress-pdf', desc: 'Reduce file size fast', icon: Minimize2, chip: 'icon-violet' },
    { title: 'Merge PDF', href: '/tools/merge-pdf', desc: 'Combine multiple PDFs', icon: Files, chip: 'icon-blue' },
    { title: 'Linearize PDF', href: '/tools/linearize-pdf', desc: 'Fast web view optimization', icon: Zap, chip: 'icon-cyan', badge: 'New' },
    { title: 'Remove BG', href: '/tools/remove-image-background', desc: 'AI background removal', icon: Sparkles, chip: 'icon-violet', badge: 'AI' },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-6 md:mt-8">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group flex items-start gap-3.5 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated"
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.chip} transition-transform duration-300 group-hover:scale-105`}>
            <item.icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
              {item.title}
              {item.badge ? (
                <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${item.badge === 'New' ? 'badge-secure' : 'badge-ai'}`}>
                  {item.badge}
                </span>
              ) : (
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-label="Popular" />
              )}
            </p>
            <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{item.desc}</p>
          </div>
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

  const tabs: Array<{ id: 'all' | 'pdf' | 'image' | 'popular' | 'ai'; label: string; icon?: typeof Star }> = [
    { id: 'all', label: `All tools (${allTools.length})` },
    { id: 'pdf', label: `PDF tools (52)` },
    { id: 'image', label: `Image tools (53)` },
    { id: 'popular', label: 'Popular', icon: Star },
    { id: 'ai', label: 'AI tools', icon: Sparkles },
  ];

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
            <div className="flex items-center justify-between gap-3 mt-6">
              <h2 className="text-lg md:text-xl font-semibold tracking-tight">Popular right now</h2>
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="scroll-carousel flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={activeTab === tab.id}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'btn-premium text-white'
                    : 'border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
                }`}
              >
                {tab.icon ? <tab.icon className="h-3.5 w-3.5" /> : null}
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'pdf' && (
            <Link
              href="/pdf-tools"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              Open dedicated PDF suite →
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
            {idx > 0 && <div className="gradient-divider my-10" />}
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
                className="btn-premium rounded-lg px-3.5 py-2 text-sm font-semibold"
              >
                Reset all filters
              </button>
              <Link href="/pdf-tools" className="rounded-lg border border-border px-3.5 py-2 text-sm font-medium hover:border-primary/40 hover:text-primary transition-colors">
                All 52 PDF tools
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
