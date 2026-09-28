'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  FileText,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Upload,
  X,
  Zap,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  allTools,
  toolCategories,
  type Tool,
  allPdfTools,
  allImageTools,
  pdfToolGroups,
} from '@/lib/tools-data';
import { useAppStore } from '@/store/app-store';
import { normalizeDisplayText } from '@/lib/display-text';

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Tool[]>([]);
  const [searchFilter, setSearchFilter] = useState<'all' | 'pdf' | 'image' | 'popular'>('all');
  const [scrolled, setScrolled] = useState(false);
  const [activeMegaCategory, setActiveMegaCategory] = useState<string | null>(null);
  const { setTheme, resolvedTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';
  const [searchFocused, setSearchFocused] = useState(false);
  const megaTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchDialogRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const setActiveTool = useAppStore((state) => state.setActiveTool);

  const featuredTools = useMemo(() => allTools.filter((tool) => tool.popular).slice(0, 6), []);
  const activeCategory = toolCategories.find((category) => category.id === activeMegaCategory) ?? null;


  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDarkMode = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const targetTag = (event.target as HTMLElement).tagName;
      const isTypingTarget = ['INPUT', 'TEXTAREA'].includes(targetTag);

      if ((event.ctrlKey && event.key.toLowerCase() === 'k') || (event.key === '/' && !isTypingTarget)) {
        event.preventDefault();
        setSearchOpen(true);
        setSearchFocused(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }

      if (event.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
        setSearchFocused(false);
        setActiveMegaCategory(null);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const executeSearch = (query: string, filter: 'all' | 'pdf' | 'image' | 'popular') => {
    let pool: Tool[];
    if (filter === 'pdf') {
      pool = allPdfTools;
    } else if (filter === 'image') {
      pool = allImageTools;
    } else if (filter === 'popular') {
      pool = allTools.filter((t) => t.popular);
    } else {
      pool = allTools;
    }

    if (!query.trim()) {
      setSearchResults(filter === 'all' ? [] : pool.slice(0, 20));
      return;
    }

    const q = query.toLowerCase().trim();
    const results = pool.filter(
      (tool) =>
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.keywords.some((kw) => kw.toLowerCase().includes(q))
    );
    setSearchResults(results.slice(0, 20));
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setSearchFilter('all');
    setSearchFocused(false);
  };

  // Keep Tab/Shift+Tab inside the search dialog so keyboard users cannot tab
  // out into the page behind the modal (WCAG 2.1.2 / 2.4.3).
  const handleSearchKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    const dialog = searchDialogRef.current;
    if (!dialog) return;
    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    executeSearch(query, searchFilter);
  };

  const handleFilterSelect = (filter: 'all' | 'pdf' | 'image' | 'popular') => {
    setSearchFilter(filter);
    executeSearch(searchQuery, filter);
  };

  const handleToolSelect = (tool: Tool) => {
    setActiveTool({
      id: tool.id,
      name: normalizeDisplayText(tool.name),
      description: normalizeDisplayText(tool.description),
    });
    router.push(`/tools/${tool.slug}`);
    closeSearch();
    setMobileMenuOpen(false);
    setActiveMegaCategory(null);
  };

  const openMega = (categoryId: string) => {
    if (megaTimeout.current) clearTimeout(megaTimeout.current);
    setActiveMegaCategory(categoryId);
  };

  const closeMega = () => {
    megaTimeout.current = setTimeout(() => setActiveMegaCategory(null), 140);
  };

  const dismissMega = () => {
    if (megaTimeout.current) clearTimeout(megaTimeout.current);
    setActiveMegaCategory(null);
  };

  const handleHomeLink = () => {
    if (window.location.pathname !== '/') {
      router.push('/');
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div className="relative z-40 border-b border-border/30 bg-[linear-gradient(90deg,rgba(59,130,246,0.08),rgba(16,185,129,0.06),rgba(59,130,246,0.08))]">
        <div className="container mx-auto flex min-h-10 items-center justify-between gap-4 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground lg:px-8">
          <div className="hidden items-center gap-3 md:flex">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Private workflows
            </span>
            <span className="inline-flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-sky-500" />
              Built for speed
            </span>
          </div>
          <div className="flex items-center gap-2 text-foreground/80">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Premium PDF and image tooling
          </div>
          <button
            type="button"
            onClick={toggleDarkMode}
            className="ml-2 flex h-8 w-8 items-center justify-center rounded-full border border-border/50 bg-card/60 text-muted-foreground transition-all duration-200 hover:border-primary/30 hover:bg-card hover:text-foreground"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span key={isDark ? 'sun' : 'moon'} className="inline-flex animate-in fade-in zoom-in-75 duration-200">
              {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </span>
          </button>
        </div>
      </div>

      <header className={`sticky top-0 z-50 w-full pointer-events-none transition-all duration-500 ${scrolled ? 'pt-3 lg:pt-5' : 'pt-0'}`}>
        <div className={`mx-auto w-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto ${scrolled ? 'px-3 sm:px-6 lg:px-8 max-w-[85rem]' : 'px-0 max-w-full'}`}>
          <div className={`mx-auto flex w-full items-center justify-between gap-4 transition-all duration-500 ease-out ${scrolled ? 'rounded-[2.5rem] border border-border/40 bg-card/65 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(255,255,255,0.02)] px-3 py-2 sm:px-5 lg:w-[98%]' : 'border-b border-border/20 bg-background/60 backdrop-blur-md px-4 py-3 sm:px-6 lg:px-8'}`}>
            <Link
              href="/"
              className="group flex flex-shrink-0 items-center gap-3"
              onClick={(event) => {
                if (window.location.pathname === '/') {
                  event.preventDefault();
                  useAppStore.getState().reset();
                  handleHomeLink();
                }
              }}
            >
              <div className="relative flex h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-primary to-sky-500 text-white shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:scale-[1.05]">
                <ImageIcon className="h-4 w-4" />
                <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-[8px] font-black text-primary">P</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-xl font-extrabold tracking-tight text-foreground leading-none">
                  PdfPixels
                </div>
                <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground mt-1">
                  Pro Suite
                </div>
              </div>
            </Link>

            {/* Center Desktop Navigation */}
            <div className="hidden lg:flex flex-1 items-center justify-center gap-1 xl:gap-2">
              {/* Prominent PDF Tools Mega Dropdown */}
              <div
                className="relative group py-1.5"
                onMouseEnter={() => openMega('pdf-tools')}
                onMouseLeave={closeMega}
                onFocus={() => openMega('pdf-tools')}
                onBlur={closeMega}
              >
                <Link
                  href="/pdf-tools"
                  onClick={dismissMega}
                  aria-haspopup="true"
                  aria-expanded={activeMegaCategory === 'pdf-tools'}
                  className={`relative z-10 inline-flex items-center gap-1.5 rounded-full px-3 xl:px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    activeMegaCategory === 'pdf-tools' ? 'text-primary' : 'text-foreground hover:text-primary'
                  }`}
                >
                  <FileText className="h-4 w-4 text-primary" />
                  PDF Tools
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-black text-primary">52</span>
                  <ChevronRight
                    className={`h-3 w-3 opacity-60 transition-transform duration-300 ${
                      activeMegaCategory === 'pdf-tools' ? 'rotate-90' : 'group-hover:translate-y-0.5 group-hover:rotate-90'
                    }`}
                  />
                </Link>
                {activeMegaCategory === 'pdf-tools' && (
                  <span className="absolute inset-0 z-0 rounded-full bg-secondary shadow-sm ring-1 ring-border/20" />
                )}
              </div>

              {toolCategories.filter(c => ['pdf-organize', 'pdf-optimize', 'pdf-convert', 'basic-editing'].includes(c.id)).map(category => {
                const isActive = activeMegaCategory === category.id;
                const label = category.id === 'pdf-organize'
                  ? 'Organize PDF'
                  : category.id === 'pdf-optimize'
                    ? 'Compress PDF'
                    : category.id === 'pdf-convert'
                      ? 'Convert PDF'
                      : 'Image Tools';
                return (
                  <div
                    key={category.id}
                    className="relative group py-1.5"
                    onMouseEnter={() => openMega(category.id)}
                    onMouseLeave={closeMega}
                    onFocus={() => openMega(category.id)}
                    onBlur={closeMega}
                  >
                    <Link
                      href={`/tools/category/${category.id}`}
                      onClick={dismissMega}
                      aria-haspopup="true"
                      aria-expanded={isActive}
                      className={`relative z-10 inline-flex items-center gap-1.5 rounded-full px-3 xl:px-4 py-2 text-sm font-medium transition-all duration-200 ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {label}
                      <ChevronRight className={`h-3 w-3 opacity-60 transition-transform duration-300 ${isActive ? 'rotate-90' : 'group-hover:translate-y-0.5 group-hover:rotate-90'}`} />
                    </Link>
                    {isActive && (
                      <span className="absolute inset-0 z-0 rounded-full bg-secondary shadow-sm ring-1 ring-border/20" />
                    )}
                  </div>
                );
              })}

              <Link
                href="/tools"
                className="relative inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground"
              >
                All Tools
              </Link>
              
              <Link
                href="/pricing"
                className="relative inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-500"
              >
                <Sparkles className="h-3 w-3 text-amber-500" />
                Pricing
              </Link>
            </div>

            {/* Right Actions */}
            <div className="flex flex-shrink-0 items-center gap-2 xl:gap-3">
              <Link href="/blog" className="hidden xl:inline-flex text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
                Blog
              </Link>

              <div className="hidden xl:block h-4 w-px bg-border/60 mx-1" />

              <Button
                variant="outline"
                size="sm"
                className={`hidden lg:inline-flex h-9 rounded-full border-border/40 px-3 text-xs font-bold text-muted-foreground shadow-none transition-colors hover:bg-secondary hover:text-foreground ${scrolled ? 'bg-background/50' : 'bg-background/80'}`}
                onClick={() => {
                  setSearchOpen(true);
                  setSearchFocused(true);
                  setTimeout(() => searchRef.current?.focus(), 50);
                }}
              >
                <Search className="mr-2 h-3.5 w-3.5" />
                Search...
                <kbd className="ml-3 hidden md:inline-flex h-5 select-none items-center gap-1 rounded bg-muted/80 px-1.5 font-mono text-[10px] font-bold text-muted-foreground">
                  ⌘K
                </kbd>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground hover:text-foreground lg:hidden"
                onClick={() => {
                  setSearchOpen(true);
                  setSearchFocused(true);
                  setTimeout(() => searchRef.current?.focus(), 50);
                }}
              >
                <Search className="h-5 w-5" />
              </Button>

              <Button asChild size="sm" className="hidden lg:inline-flex h-9 rounded-full px-5 text-sm font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 btn-premium">
                <Link href="/tools/compress-pdf">Get Started</Link>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full lg:hidden text-foreground"
                onClick={() => setMobileMenuOpen((current) => !current)}
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          <div className={`mx-auto w-full transition-all duration-300 ${scrolled ? 'mt-3 max-w-[80rem] px-4 sm:px-8' : 'mt-0 px-4 sm:px-6 lg:px-8'}`}>
            {/* Tool pages render their breadcrumb server-side (see app/tools/[slug]/page.tsx)
                so it is present in the HTML without JS and mirrors the JSON-LD. */}

            {activeMegaCategory === 'pdf-tools' ? (
              <div
                id="mega-menu-pdf-tools"
                role="group"
                aria-label="All PDF tools"
                onMouseEnter={() => openMega('pdf-tools')}
                onMouseLeave={closeMega}
                className="hidden lg:block pb-4 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="rounded-[1.75rem] border border-border/50 bg-card/95 p-6 shadow-premium backdrop-blur-2xl">
                  <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
                    <div className="flex flex-col justify-between rounded-[1.5rem] border border-border/50 bg-background/80 p-5">
                      <div>
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-sky-500 text-white shadow-md shadow-primary/20">
                          <FileText className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-extrabold text-foreground">PDF Super Suite</h3>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          All 52 free PDF tools: compress, merge, convert to Word & Excel, sign, fill forms, and protect files.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          <span className="rounded-full border border-border/60 bg-card px-2 py-0.5 text-primary">52 Tools</span>
                          <span className="rounded-full border border-border/60 bg-card px-2 py-0.5 text-emerald-600 dark:text-emerald-400">100% Free</span>
                          <span className="rounded-full border border-border/60 bg-card px-2 py-0.5 text-sky-600 dark:text-sky-400">No Signup</span>
                        </div>
                      </div>
                      <div className="mt-5 border-t border-border/40 pt-4">
                        <Link
                          href="/pdf-tools"
                          onClick={dismissMega}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-95 transition-all hover:scale-[1.02]"
                        >
                          View All 52 PDF Tools
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 lg:max-h-[60vh] lg:overflow-y-auto lg:pr-1">
                      {pdfToolGroups.map((group) => (
                        <div key={group.id} className="space-y-1.5">
                          <div className="border-b border-border/40 pb-1.5 flex items-center justify-between">
                            <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
                              {group.name}
                            </h4>
                            <span className="text-[10px] font-semibold text-muted-foreground">
                              {group.tools.length}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            {group.tools.map((tool) => (
                              <button
                                key={tool.id}
                                type="button"
                                onClick={() => handleToolSelect(tool)}
                                className="group flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-primary/10 hover:text-primary"
                              >
                                <span className="truncate font-medium text-foreground group-hover:text-primary">
                                  {normalizeDisplayText(tool.name)}
                                </span>
                                {tool.badge && (
                                  <span className="ml-1 shrink-0 rounded-full border border-border/60 px-1 py-0.2 text-[8px] font-bold text-muted-foreground">
                                    {tool.badge}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : activeCategory ? (
              <div
                id={`mega-menu-${activeCategory.id}`}
                role="group"
                aria-label={`${activeCategory.name} tools`}
                onMouseEnter={() => openMega(activeCategory.id)}
                onMouseLeave={closeMega}
                className="hidden lg:block pb-4 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="rounded-[1.75rem] border border-border/50 bg-card/95 p-6 shadow-premium">
                  <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                    <div className="rounded-[1.5rem] border border-border/50 bg-background/75 p-5">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-sky-500/10 text-primary">
                        <activeCategory.icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">{normalizeDisplayText(activeCategory.name)}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{normalizeDisplayText(activeCategory.description)}</p>
                      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        <span className="rounded-full border border-border/60 bg-card px-3 py-1.5">{activeCategory.tools.length} tools</span>
                        <Link
                          href={`/tools/category/${activeCategory.id}`}
                          onClick={dismissMega}
                          className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-primary hover:bg-primary/20 transition-colors"
                        >
                          View all →
                        </Link>
                      </div>
                    </div>

                    {/* Full category listing — every tool in the category stays visible here */}
                    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3 lg:max-h-[58vh] lg:overflow-y-auto lg:pr-1">
                      {activeCategory.tools.map((tool) => {
                        const Icon = tool.icon;
                        return (
                          <button
                            key={tool.id}
                            type="button"
                            onClick={() => handleToolSelect(tool)}
                            className="group rounded-[1.35rem] border border-border/50 bg-background/75 p-3.5 text-left transition-all duration-200 hover:border-primary/30 hover:bg-background hover:shadow-soft"
                          >
                            <div className="mb-2 flex items-start justify-between gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Icon className="h-4 w-4" />
                              </div>
                              {tool.badge ? <span className="rounded-full border border-border/60 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{tool.badge}</span> : null}
                            </div>
                            <p className="text-sm font-semibold text-foreground group-hover:text-primary">{normalizeDisplayText(tool.name)}</p>
                            <p className="mt-1 line-clamp-1 text-sm leading-5 text-muted-foreground">{normalizeDisplayText(tool.description)}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {mobileMenuOpen ? (
              <div
                id="mobile-menu"
                className="overflow-hidden border-t border-border/30 lg:hidden animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="space-y-5 py-4">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Button asChild className="btn-premium h-11 rounded-2xl shadow-primary/20">
                      <Link href="/pdf-tools" onClick={() => setMobileMenuOpen(false)}>
                        <FileText className="mr-2 h-4 w-4" />
                        All PDF Tools (52)
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-11 rounded-2xl">
                      <Link href="/tools" onClick={() => setMobileMenuOpen(false)}>
                        Browse all categories
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-11 rounded-2xl">
                      <Link href="/blog" onClick={() => setMobileMenuOpen(false)}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Blog
                      </Link>
                    </Button>
                  </div>

                  {/* Featured Mobile PDF Suite Card */}
                  <div className="rounded-[1.4rem] border border-primary/40 bg-gradient-to-br from-primary/10 via-background to-sky-500/10 p-4 shadow-soft">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-primary" />
                          PDF Super Suite
                        </p>
                        <p className="text-xs text-muted-foreground">52 free tools · Compress, merge, convert, sign & protect</p>
                      </div>
                      <Link
                        href="/pdf-tools"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-white shadow-xs"
                      >
                        View All 52 →
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/tools/compress-pdf"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-xl border border-border/50 bg-background/80 p-2.5 text-xs font-semibold text-foreground hover:text-primary transition-colors text-center"
                      >
                        Compress PDF
                      </Link>
                      <Link
                        href="/tools/merge-pdf"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-xl border border-border/50 bg-background/80 p-2.5 text-xs font-semibold text-foreground hover:text-primary transition-colors text-center"
                      >
                        Merge PDF
                      </Link>
                      <Link
                        href="/tools/pdf-to-word"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-xl border border-border/50 bg-background/80 p-2.5 text-xs font-semibold text-foreground hover:text-primary transition-colors text-center"
                      >
                        PDF to Word
                      </Link>
                      <Link
                        href="/tools/sign-pdf"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-xl border border-border/50 bg-background/80 p-2.5 text-xs font-semibold text-foreground hover:text-primary transition-colors text-center"
                      >
                        Sign PDF
                      </Link>
                    </div>
                  </div>

                  {toolCategories.map((category) => (
                    <div key={category.id} className="rounded-[1.4rem] border border-border/50 bg-card/65 p-4 shadow-soft">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-foreground">{normalizeDisplayText(category.name)}</p>
                          <p className="text-xs text-muted-foreground">{category.tools.length} tools</p>
                        </div>
                        <Link
                          href={`/tools/category/${category.id}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="text-xs font-semibold uppercase tracking-[0.16em] text-primary"
                        >
                          View all
                        </Link>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {category.tools.map((tool) => (
                          <button
                            key={tool.id}
                            type="button"
                            onClick={() => handleToolSelect(tool)}
                            className="flex items-center gap-3 rounded-2xl border border-border/50 bg-background/75 px-3 py-3 text-left"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <tool.icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">{normalizeDisplayText(tool.name)}</p>
                              <p className="truncate text-xs text-muted-foreground">{normalizeDisplayText(tool.description)}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
        </div>
      </div>
    </header>

    {searchOpen ? (
      <div
        className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh] animate-in fade-in duration-200"
      >
        <button type="button" className="absolute inset-0 bg-background/95" onClick={closeSearch} aria-label="Close search" />

        <div
          ref={searchDialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Search tools"
          onKeyDown={handleSearchKeyDown}
          className={`relative w-full max-w-3xl overflow-hidden rounded-[2rem] border bg-card/98 shadow-premium transition-all duration-300 animate-in fade-in zoom-in-95 slide-in-from-top-4 ${searchFocused ? 'border-primary/40 shadow-primary/10' : 'border-border/50'}`}
        >
          {/* Gradient border animation when focused */}
          {searchFocused && (
            <div
              className="pointer-events-none absolute inset-0 rounded-[2rem]"
                  style={{
                    padding: '2px',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.3), rgba(217,70,239,0.2), rgba(6,182,212,0.3), rgba(99,102,241,0.4))',
                    backgroundSize: '300% 300%',
                    animation: 'gradientShift 4s ease infinite',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    borderRadius: '2rem',
                  }}
                />
              )}

              <div className="border-b border-border/40 bg-background/70 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(event) => handleSearch(event.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    placeholder="Search PDF and image tools"
                    aria-label="Search PDF and image tools"
                    className="flex-1 border-none bg-transparent text-base font-semibold outline-none placeholder:text-muted-foreground/70"
                    autoFocus
                  />
                  <span className="hidden rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:inline-flex">
                    ESC
                  </span>
                </div>
              </div>

              {/* Quick Search Category Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border/30 bg-muted/20 px-5 py-2.5 no-scrollbar">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">Filter:</span>
                <button
                  type="button"
                  onClick={() => handleFilterSelect('all')}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                    searchFilter === 'all'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-background/80 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All ({allTools.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterSelect('pdf')}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                    searchFilter === 'pdf'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-background/80 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  📄 PDF Tools ({allPdfTools.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterSelect('image')}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                    searchFilter === 'image'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-background/80 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  🖼️ Image Tools ({allImageTools.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterSelect('popular')}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                    searchFilter === 'popular'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-background/80 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ⭐ Popular
                </button>
              </div>

              <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="max-h-[60vh] overflow-y-auto p-3">
                  {searchResults.length > 0 ? (
                    <div className="space-y-2">
                      {searchResults.map((tool) => (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => handleToolSelect(tool)}
                          className="flex w-full items-center gap-3 rounded-[1.35rem] border border-transparent px-3 py-3 text-left transition-colors hover:border-primary/20 hover:bg-primary/5"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <tool.icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-semibold text-foreground">{normalizeDisplayText(tool.name)}</p>
                              {tool.badge ? <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{tool.badge}</span> : null}
                            </div>
                            <p className="truncate text-sm text-muted-foreground">{normalizeDisplayText(tool.description)}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground/60" />
                        </button>
                      ))}
                    </div>
                  ) : searchQuery.length > 0 ? (
                    <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                        <Search className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">No tools found</p>
                        <p className="text-sm text-muted-foreground">Try a broader keyword like compress, convert, resize, or merge.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5 p-2">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Popular starts</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {featuredTools.map((tool) => (
                            <button
                              key={tool.id}
                              type="button"
                              onClick={() => handleToolSelect(tool)}
                              className="flex items-center gap-3 rounded-[1.2rem] border border-border/50 bg-background/75 px-3 py-3 text-left"
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <tool.icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">{normalizeDisplayText(tool.name)}</p>
                                <p className="truncate text-xs text-muted-foreground">{normalizeDisplayText(tool.description)}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-border/40 bg-background/65 p-4 lg:border-l lg:border-t-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Quick actions</p>
                  <div className="mt-3 space-y-2">
                    <Link href="/tools/compress-pdf" onClick={closeSearch} className="flex items-center justify-between rounded-[1.2rem] border border-border/50 bg-card/75 px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/30 hover:text-primary">
                      Compress PDF
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href="/tools/image-to-pdf" onClick={closeSearch} className="flex items-center justify-between rounded-[1.2rem] border border-border/50 bg-card/75 px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/30 hover:text-primary">
                      Image to PDF
                      <Upload className="h-4 w-4" />
                    </Link>
                  </div>

                  <div className="mt-5 rounded-[1.35rem] border border-border/50 bg-card/75 p-4">
                    <p className="text-sm font-semibold text-foreground">Why teams choose PdfPixels</p>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <li>Consistent output quality across mobile and desktop.</li>
                      <li>Fast upload, preview, and download loops.</li>
                      <li>Clean UI without account friction.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
    </>
  );
}
