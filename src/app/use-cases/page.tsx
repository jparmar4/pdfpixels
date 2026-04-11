'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight, Search, X, Minimize2, Maximize2, Eraser, IdCard, ArrowLeftRight,
  FileText, Merge, Split, Sparkles, ImageIcon
} from 'lucide-react';
import { AnimatedMeshBg } from '@/components/ui/animated-mesh-bg';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { useCasePages } from '@/lib/use-cases';
import { getToolBySlug, allTools } from '@/lib/tools-data';

/* ─── Category definitions for filtering ──────────────────────────── */
const categories = [
  { id: 'all', label: 'All Use Cases' },
  { id: 'compress', label: 'Compress' },
  { id: 'resize', label: 'Resize' },
  { id: 'convert', label: 'Convert' },
  { id: 'pdf', label: 'PDF Tools' },
  { id: 'ai', label: 'AI Tools' },
];

function getUseCaseCategory(slug: string): string {
  if (slug.includes('compress')) return 'compress';
  if (slug.includes('resize') || slug.includes('passport')) return 'resize';
  if (slug.includes('convert') || slug.includes('heic') || slug.includes('png') || slug.includes('jpg') || slug.includes('pdf-to')) return 'convert';
  if (slug.includes('merge-pdf') || slug.includes('split-pdf') || slug.includes('pdf-for-email')) return 'pdf';
  if (slug.includes('background')) return 'ai';
  return 'all';
}

function getUseCaseIconName(slug: string): string {
  if (slug.includes('compress')) return 'Minimize2';
  if (slug.includes('resize') || slug.includes('passport')) return 'Maximize2';
  if (slug.includes('background')) return 'Eraser';
  if (slug.includes('passport')) return 'IdCard';
  if (slug.includes('convert') || slug.includes('heic') || slug.includes('png-to') || slug.includes('jpg')) return 'ArrowLeftRight';
  if (slug.includes('pdf-to')) return 'Image';
  if (slug.includes('merge-pdf')) return 'Merge';
  if (slug.includes('split-pdf')) return 'Split';
  if (slug.includes('email')) return 'FileText';
  return 'Sparkles';
}

function getUseCaseColor(category: string): { gradient: string; bg: string; textColor: string } {
  const colors: Record<string, { gradient: string; bg: string; textColor: string }> = {
    compress: { gradient: 'from-emerald-500 to-teal-500', bg: 'from-emerald-500/15 to-teal-500/10', textColor: 'text-emerald-500' },
    resize: { gradient: 'from-sky-500 to-blue-500', bg: 'from-sky-500/15 to-blue-500/10', textColor: 'text-sky-500' },
    convert: { gradient: 'from-violet-500 to-purple-500', bg: 'from-violet-500/15 to-purple-500/10', textColor: 'text-violet-500' },
    pdf: { gradient: 'from-orange-500 to-red-500', bg: 'from-orange-500/15 to-red-500/10', textColor: 'text-orange-500' },
    ai: { gradient: 'from-fuchsia-500 to-pink-500', bg: 'from-fuchsia-500/15 to-pink-500/10', textColor: 'text-fuchsia-500' },
  };
  return colors[category] || { gradient: 'from-primary to-sky-500', bg: 'from-primary/15 to-sky-500/10', textColor: 'text-primary' };
}

/* ─── Hero Section with AnimatedMeshBg and Search ─────────────────── */
function HeroSection({ search, setSearch }: { search: string; setSearch: (val: string) => void }) {
  return (
    <section className="relative overflow-hidden border-b border-border/40 min-h-[46vh] flex flex-col justify-center bg-gradient-to-b from-background via-background to-muted/20">
      <AnimatedMeshBg />
      <div className="absolute inset-0 dot-pattern opacity-30" />

      <div className="relative z-10 container mx-auto px-4 lg:px-8 py-16 md:py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-primary/20 bg-primary/10 text-primary mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Intent-driven workflows
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-3 leading-[1.05]">
            Use Cases & Guides
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-2xl mx-auto font-medium leading-relaxed">
            Find the fastest path from your goal to the right tool. Step-by-step guides for common image and PDF tasks.
          </p>

          {/* Search bar */}
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
              placeholder="Search use cases: compress to 20kb, passport photo..."
              aria-label="Search use cases"
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

          <p className="mt-4 text-xs text-muted-foreground">
            {useCasePages.length} step-by-step guides · Tool-first approach
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Filter Pills ─────────────────────────────────────────────────── */
function FilterPills({
  activeCategory,
  setActiveCategory,
}: {
  activeCategory: string;
  setActiveCategory: (val: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => setActiveCategory(cat.id)}
          className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.14em] border transition-all duration-300 ${
            activeCategory === cat.id
              ? 'border-primary/40 bg-primary/10 text-primary shadow-sm'
              : 'border-border/60 bg-background/60 text-muted-foreground hover:border-primary/20 hover:text-foreground'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Use Case Card ────────────────────────────────────────────────── */
function UseCaseIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case 'Minimize2': return <Minimize2 className={className} />;
    case 'Maximize2': return <Maximize2 className={className} />;
    case 'Eraser': return <Eraser className={className} />;
    case 'IdCard': return <IdCard className={className} />;
    case 'ArrowLeftRight': return <ArrowLeftRight className={className} />;
    case 'Image': return <ImageIcon className={className} />;
    case 'Merge': return <Merge className={className} />;
    case 'Split': return <Split className={className} />;
    case 'FileText': return <FileText className={className} />;
    default: return <Sparkles className={className} />;
  }
}

function UseCaseCard({ item }: { item: typeof useCasePages[number] }) {
  const category = getUseCaseCategory(item.slug);
  const iconName = getUseCaseIconName(item.slug);
  const colors = getUseCaseColor(category);
  const tool = getToolBySlug(item.targetToolSlug);

  // Find related tools for this use case
  const relatedTools = useMemo(() => {
    if (!tool) return [];
    const sameCategory = allTools.filter(
      (t) => t.category === tool.category && t.slug !== tool.slug
    );
    return sameCategory.slice(0, 3);
  }, [tool]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className="group"
    >
      <Link
        href={`/use-cases/${item.slug}`}
        className="block section-panel rounded-[1.75rem] p-5 md:p-6 transition-all duration-300 hover:shadow-premium hover:-translate-y-1 hover:border-primary/25 h-full"
      >
        {/* Category icon with gradient */}
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${colors.bg} mb-4 group-hover:scale-110 transition-transform duration-300`}>
          <UseCaseIcon name={iconName} className={`h-5 w-5 ${colors.textColor}`} />
        </div>

        {/* Title and description */}
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-2">Workflow guide</p>
        <h2 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{item.title}</h2>
        <p className="text-sm leading-7 text-muted-foreground">{item.description}</p>

        {/* Related tools list */}
        {relatedTools.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {tool && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold">
                <UseCaseIcon name={iconName} className="w-3 h-3" />
                {tool.name}
              </span>
            )}
            {relatedTools.map((rt) => (
              <span key={rt.slug} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/80 text-muted-foreground text-[11px] font-semibold">
                <UseCaseIcon name={getUseCaseIconName(rt.slug)} className="w-3 h-3" />
                {rt.name}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Get Started
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Main Page Component ──────────────────────────────────────────── */
export default function UseCasesIndexPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredUseCases = useMemo(() => {
    let filtered = useCasePages;

    if (activeCategory !== 'all') {
      filtered = filtered.filter((item) => getUseCaseCategory(item.slug) === activeCategory);
    }

    if (search.trim()) {
      const lowerQuery = search.toLowerCase().trim();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(lowerQuery) ||
          item.description.toLowerCase().includes(lowerQuery) ||
          item.intent.toLowerCase().includes(lowerQuery)
      );
    }

    return filtered;
  }, [search, activeCategory]);

  return (
    <div className="premium-page-bg min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="flex-1">
        <HeroSection search={search} setSearch={setSearch} />

        <div className="container mx-auto px-4 py-8 lg:px-8 max-w-6xl">
          {/* Filter pills */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <FilterPills activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
            <p className="text-xs text-muted-foreground font-medium">
              {filteredUseCases.length} guide{filteredUseCases.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {/* Cards grid */}
          {filteredUseCases.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredUseCases.map((item) => (
                <UseCaseCard key={item.slug} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold text-muted-foreground">No use cases found</p>
              <p className="text-sm text-muted-foreground mt-1">Try a different search term or category.</p>
              <button
                onClick={() => { setSearch(''); setActiveCategory('all'); }}
                className="mt-4 px-4 py-2 rounded-xl border border-border/70 text-sm font-medium hover:border-primary/40 hover:text-primary transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
