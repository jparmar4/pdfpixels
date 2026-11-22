'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Cpu,
  FileText,
  LayoutGrid,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  Layers,
  Wrench,
} from 'lucide-react';
import { toolCategories, allTools, aiTools, searchTools, allPdfTools, allImageTools } from '@/lib/tools-data';
import { useAppStore } from '@/store/app-store';
import { normalizeDisplayText } from '@/lib/display-text';
import { AnimatedMeshBg } from '@/components/ui/animated-mesh-bg';
import { TiltCard } from '@/components/ui/tilt-card';

function getIconColorClass(toolId: string): string {

  const id = toolId.toLowerCase();
  if (
    id.includes('pdf-merge') ||
    id.includes('pdf-split') ||
    id.includes('pdf-compress') ||
    id.includes('pdf-to') ||
    id.includes('image-to-pdf')
  ) {
    return 'icon-violet';
  }
  if (id.includes('compress') || id.includes('reduce') || id.includes('kb')) {
    return 'icon-emerald';
  }
  if (id.includes('resize') || id.includes('pixel') || id.includes('cm') || id.includes('inch')) {
    return 'icon-blue';
  }
  if (
    id.includes('to-') ||
    id.includes('convert') ||
    id.includes('png') ||
    id.includes('jpg') ||
    id.includes('webp')
  ) {
    return 'icon-cyan';
  }
  if (id.includes('filter') || id.includes('brightness') || id.includes('contrast') || id.includes('saturation')) {
    return 'icon-amber';
  }
  if (id.includes('blur') || id.includes('pixelate') || id.includes('grayscale') || id.includes('beautify')) {
    return 'icon-rose';
  }
  return 'icon-blue';
}

function getBadgeClasses(badge?: string) {
  switch (badge) {
    case 'AI':
      return 'badge-ai';
    case 'Popular':
      return 'badge-popular';
    case 'Secure':
      return 'badge-secure';
    case 'New':
      return 'bg-sky-500/12 text-sky-600 dark:text-sky-400 border-sky-500/18';
    case 'OCR':
      return 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/18';
    default:
      return 'bg-primary/10 text-primary border-primary/15';
  }
}

function getProcessingMeta(tool: (typeof allTools)[0]) {
  if (tool.processing === 'ai') {
    return {
      label: 'AI powered',
      icon: Sparkles,
      className: 'text-violet-600 dark:text-violet-300',
    };
  }
  if (tool.processing === 'client') {
    return {
      label: 'Browser processing',
      icon: ShieldCheck,
      className: 'text-emerald-600 dark:text-emerald-300',
    };
  }
  return {
    label: 'Server optimized',
    icon: Cpu,
    className: 'text-sky-600 dark:text-sky-300',
  };
}

export function ToolsClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const setActiveTool = useAppStore((state) => state.setActiveTool);

  // Sync deep-link ?q= / ?category= client-side without triggering SSR Suspense bailout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || params.get('search') || '';
    const cat = params.get('category') || params.get('tab') || '';
    if (q) setSearchQuery(q);
    if (cat) {
      if (cat === 'pdf' || cat === 'pdf-tools') setActiveCategory('pdf-tools');
      else if (cat === 'image' || cat === 'image-tools') setActiveCategory('image-tools');
      else setActiveCategory(cat);
    }
  }, []);

  const filteredTools = useMemo(() => {
    let tools: (typeof allTools)[0][];

    if (searchQuery.trim()) {
      tools = searchTools(searchQuery);
    } else if (activeCategory === 'all') {
      tools = allTools;
    } else if (activeCategory === 'pdf-tools' || activeCategory === 'pdf') {
      tools = allPdfTools;
    } else if (activeCategory === 'image-tools' || activeCategory === 'image') {
      tools = allImageTools;
    } else {
      tools = allTools.filter((t) => t.category === activeCategory);
    }

    return tools;
  }, [searchQuery, activeCategory]);

  const stats = useMemo(
    () => [
      { label: 'Total Tools', value: allTools.length, icon: Wrench },
      { label: 'Categories', value: toolCategories.length, icon: LayoutGrid },
      { label: 'AI Powered', value: aiTools.length, icon: Sparkles },
      { label: 'Popular', value: allTools.filter((t) => t.popular).length, icon: Layers },
    ],
    []
  );

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <AnimatedMeshBg />
        <div className="hero-grid absolute inset-0 opacity-60" />

        <div className="container relative z-10 mx-auto px-4 pb-12 pt-24 text-center lg:px-8 md:pb-16 md:pt-32">
          <div className="mx-auto max-w-3xl">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
              <LayoutGrid className="h-3.5 w-3.5" />
              All Tools
            </span>

          <h1 className="text-balance text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Every Tool You{' '}
            <span className="gradient-text">Need</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            Browse our complete collection of image and PDF tools.
            From basic edits to AI-powered enhancements — all in one place.
          </p>

          {/* Search Bar */}
          <div className="mx-auto mt-8 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools... (compress, crop, PDF, AI...)"
                aria-label="Search tools"
                className="h-14 w-full rounded-2xl border border-border/60 bg-card/80 pl-12 pr-12 text-sm backdrop-blur-sm transition-all duration-200 placeholder:text-muted-foreground/60 focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted-foreground/20"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Tool count badge */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/80 px-3 py-1 text-xs font-semibold text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''} available
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>

      <section className="container mx-auto px-4 pb-10 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="glass-card flex items-center gap-3 rounded-xl p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <stat.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl font-extrabold tracking-tight text-foreground">{stat.value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-8 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="scroll-carousel -mx-1 px-1">
            <button
              onClick={() => setActiveCategory('all')}
              className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] transition-all duration-200 ${
                activeCategory === 'all'
                  ? 'btn-premium text-white shadow-primary'
                  : 'border border-border/60 bg-card/80 text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              All Tools ({allTools.length})
            </button>
            <button
              onClick={() => setActiveCategory('pdf-tools')}
              className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] transition-all duration-200 ${
                activeCategory === 'pdf-tools'
                  ? 'btn-premium text-white shadow-primary'
                  : 'border border-border/60 bg-card/80 text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              PDF Tools ({allPdfTools.length})
            </button>
            <button
              onClick={() => setActiveCategory('image-tools')}
              className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] transition-all duration-200 ${
                activeCategory === 'image-tools'
                  ? 'btn-premium text-white shadow-primary'
                  : 'border border-border/60 bg-card/80 text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Image Tools ({allImageTools.length})
            </button>
            {toolCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] transition-all duration-200 ${
                  activeCategory === cat.id
                    ? 'btn-premium text-white shadow-primary'
                    : 'border border-border/60 bg-card/80 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                }`}
              >
                <cat.icon className="h-3.5 w-3.5" />
                {cat.name}
              </button>
            ))}
          </div>
          {activeCategory === 'pdf-tools' && (
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs">
              <span className="font-semibold text-foreground">
                Looking for the dedicated PDF Suite? Browse our full workspace with portal upload checklists & tools.
              </span>
              <Link
                href="/pdf-tools"
                className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 font-bold text-white shadow-sm hover:opacity-95"
              >
                Open /pdf-tools →
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="sr-only">Browse PDF &amp; Image Tools</h2>
          {filteredTools.length > 0 ? (
            <div
              key={`${activeCategory}-${searchQuery}`}
              className="grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filteredTools.map((tool) => (
                <ToolListingCard
                  key={tool.id}
                  tool={tool}
                  onCardClick={() =>
                    setActiveTool({
                      id: tool.id,
                      name: normalizeDisplayText(tool.name),
                      description: normalizeDisplayText(tool.description),
                    })
                  }
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-foreground">No tools found</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                We could not find any tools matching &quot;{searchQuery}&quot;.
                Try a different search term or browse by category.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="btn-premium mt-6 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold"
              >
                <ArrowRight className="h-4 w-4" />
                View all tools
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function ToolListingCard({
  tool,
  onCardClick,
}: {
  tool: (typeof allTools)[0];
  onCardClick: () => void;
}) {
  const Icon = tool.icon;
  const iconColorClass = getIconColorClass(tool.id);
  const processingMeta = getProcessingMeta(tool);
  const ProcessingIcon = processingMeta.icon;
  const categoryName = toolCategories.find((c) => c.id === tool.category)?.name ?? '';

  return (
    <div className="h-full transition-transform duration-200 hover:-translate-y-1">
      <TiltCard wrapperClassName="h-full" max={5}>
        <Link
          href={`/tools/${tool.slug}`}
          onClick={onCardClick}
          className="group rainbow-border relative flex h-full flex-col rounded-[1.75rem] border border-border/50 bg-card p-5 card-shine transition-all duration-300 hover:shadow-premium"
        >
        <div className="flex items-start justify-between gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconColorClass} bg-secondary/80 shadow-sm glow-ring transition-all duration-300 group-hover:scale-105`}
          >
            <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            {tool.badge ? (
              <span
                className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] ${getBadgeClasses(tool.badge)}`}
              >
                {tool.badge}
              </span>
            ) : null}
          </div>
        </div>
        <span className="mt-3 inline-block self-start rounded-md bg-muted/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {categoryName}
        </span>
        <div className="mt-3 space-y-2">
          <h3 className="text-base font-bold tracking-tight text-foreground transition-colors duration-200 group-hover:text-primary">
            {normalizeDisplayText(tool.name)}
          </h3>
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {normalizeDisplayText(tool.description)}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/40 pt-4">
          <div
            className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${processingMeta.className}`}
          >
            <ProcessingIcon className="h-3 w-3" />
            {processingMeta.label}
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background/70 text-muted-foreground transition-all duration-300 group-hover:border-primary/40 group-hover:bg-primary/5 group-hover:text-primary">
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </div>
        </div>
      </Link>
      </TiltCard>
    </div>
  );
}
