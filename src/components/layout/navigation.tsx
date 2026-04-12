'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Command,
  Home,
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
import { allTools, searchTools, toolCategories, type Tool } from '@/lib/tools-data';
import { useAppStore } from '@/store/app-store';
import { normalizeDisplayText } from '@/lib/display-text';

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Tool[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [activeMegaCategory, setActiveMegaCategory] = useState<string | null>(null);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';
  const [searchFocused, setSearchFocused] = useState(false);
  const megaTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const setActiveTool = useAppStore((state) => state.setActiveTool);
  const activeTool = useAppStore((state) => state.activeTool);

  const featuredTools = useMemo(() => allTools.filter((tool) => tool.popular).slice(0, 6), []);
  const activeCategory = toolCategories.find((category) => category.id === activeMegaCategory) ?? null;

  // Breadcrumb: show on /tools/* pages
  const isToolPage = pathname.startsWith('/tools/');
  const toolSlug = isToolPage ? pathname.replace('/tools/', '') : '';
  const toolName = activeTool?.name ?? (toolSlug ? toolSlug.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : '');

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

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setSearchFocused(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSearchResults(query.length > 0 ? searchTools(query).slice(0, 8) : []);
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

  const handleHomeLink = (categoryId?: string) => {
    if (window.location.pathname !== '/') {
      router.push(categoryId ? `/#${categoryId}` : '/');
      return;
    }

    if (!categoryId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const element = document.getElementById(categoryId);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'border-b border-border/50 bg-background/95 shadow-soft' : 'bg-background/80'}`}>
        {/* Top thin gradient bar */}
        <div className="border-b border-border/30 bg-[linear-gradient(90deg,rgba(59,130,246,0.08),rgba(16,185,129,0.06),rgba(59,130,246,0.08))]">
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
            {/* Dark mode toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="ml-2 flex h-8 w-8 items-center justify-center rounded-full border border-border/50 bg-card/60 text-muted-foreground transition-all duration-200 hover:border-primary/30 hover:bg-card hover:text-foreground"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <AnimatePresence mode="wait">
                {isDark ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    exit={{ rotate: 90, scale: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="h-3.5 w-3.5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    exit={{ rotate: -90, scale: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="h-3.5 w-3.5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        <nav className="container mx-auto px-4 lg:px-8">
          <div className="flex min-h-[4.5rem] items-center justify-between gap-4">
            <Link
              href="/"
              className="group flex shrink-0 items-center gap-3"
              onClick={(event) => {
                if (window.location.pathname === '/') {
                  event.preventDefault();
                  useAppStore.getState().reset();
                  handleHomeLink();
                }
              }}
            >
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-sky-500 text-white shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:scale-[1.03]">
                <ImageIcon className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-black text-primary">P</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-xl font-extrabold tracking-tight text-foreground">
                  PdfPixels
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Pro document suite
                </div>
              </div>
            </Link>

            <div className="hidden xl:flex items-center gap-1 rounded-full border border-border/50 bg-card/90 p-1 shadow-soft">
              <Button variant="ghost" size="sm" className="rounded-full px-4 text-sm" onClick={() => handleHomeLink()}>
                All tools
              </Button>
              <Link href="/blog">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <BookOpen className="h-4 w-4" />
                  Blog
                </button>
              </Link>
              {toolCategories.map((category) => {
                const CategoryIcon = category.icon;
                return (
                  <div
                    key={category.id}
                    className="relative"
                    onMouseEnter={() => openMega(category.id)}
                    onMouseLeave={closeMega}
                  >
                    <button
                      type="button"
                      onClick={() => handleHomeLink(category.id)}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${activeMegaCategory === category.id ? 'bg-background text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <CategoryIcon className="h-4 w-4" />
                      {normalizeDisplayText(category.name)}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 rounded-full border border-border/50 bg-card/60 px-4 text-sm text-muted-foreground shadow-soft transition-colors hover:bg-card hover:text-foreground"
                onClick={() => {
                  setSearchOpen(true);
                  setSearchFocused(true);
                  setTimeout(() => searchRef.current?.focus(), 50);
                }}
              >
                <Search className="h-4 w-4" />
                <span className="hidden md:inline">Search tools</span>
                <span className="hidden items-center gap-1 rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-[10px] font-bold md:inline-flex">
                  <Command className="h-3 w-3" />K
                </span>
              </Button>

              <Button asChild size="sm" className="hidden h-10 rounded-full px-4 lg:inline-flex btn-premium">
                <Link href="/tools/compress-pdf">Start with PDF</Link>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full lg:hidden"
                onClick={() => setMobileMenuOpen((current) => !current)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Breadcrumb navigation for tool pages */}
          <AnimatePresence>
            {isToolPage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pb-3 text-xs text-muted-foreground">
                  <Link href="/" className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
                    <Home className="h-3 w-3" />
                    Home
                  </Link>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                  <Link href="/" onClick={(e) => { e.preventDefault(); handleHomeLink(); }} className="transition-colors hover:text-foreground">
                    Tools
                  </Link>
                  {toolName && (
                    <>
                      <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                      <span className="font-medium text-foreground">{normalizeDisplayText(toolName)}</span>
                    </>
                  )}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {activeCategory ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                onMouseEnter={() => openMega(activeCategory.id)}
                onMouseLeave={closeMega}
                className="hidden xl:block pb-4"
              >
                <div className="rounded-[1.75rem] border border-border/50 bg-card/95 p-6 shadow-premium">
                  <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
                    <div className="rounded-[1.5rem] border border-border/50 bg-background/75 p-5">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-sky-500/10 text-primary">
                        <activeCategory.icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">{normalizeDisplayText(activeCategory.name)}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{normalizeDisplayText(activeCategory.description)}</p>
                      <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        <span className="rounded-full border border-border/60 bg-card px-3 py-1.5">{activeCategory.tools.length} tools</span>
                        <span className="rounded-full border border-border/60 bg-card px-3 py-1.5">Curated workflows</span>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {activeCategory.tools.slice(0, 6).map((tool) => {
                        const Icon = tool.icon;
                        return (
                          <button
                            key={tool.id}
                            type="button"
                            onClick={() => handleToolSelect(tool)}
                            className="group rounded-[1.35rem] border border-border/50 bg-background/75 p-4 text-left transition-all duration-200 hover:border-primary/30 hover:bg-background hover:shadow-soft"
                          >
                            <div className="mb-3 flex items-start justify-between gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Icon className="h-4 w-4" />
                              </div>
                              {tool.badge ? <span className="rounded-full border border-border/60 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{tool.badge}</span> : null}
                            </div>
                            <p className="text-sm font-semibold text-foreground group-hover:text-primary">{normalizeDisplayText(tool.name)}</p>
                            <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{normalizeDisplayText(tool.description)}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {mobileMenuOpen ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden border-t border-border/30 lg:hidden"
              >
                <div className="space-y-5 py-4">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Button asChild className="btn-premium h-11 rounded-2xl">
                      <Link href="/tools/compress-pdf" onClick={() => setMobileMenuOpen(false)}>Open PDF tools</Link>
                    </Button>
                    <Button variant="outline" className="h-11 rounded-2xl" onClick={() => handleHomeLink()}>
                      Browse all categories
                    </Button>
                    <Button asChild variant="outline" className="h-11 rounded-2xl">
                      <Link href="/blog" onClick={() => setMobileMenuOpen(false)}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Blog
                      </Link>
                    </Button>
                  </div>

                  {toolCategories.map((category) => (
                    <div key={category.id} className="rounded-[1.4rem] border border-border/50 bg-card/65 p-4 shadow-soft">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-foreground">{normalizeDisplayText(category.name)}</p>
                          <p className="text-xs text-muted-foreground">{category.tools.length} tools</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            handleHomeLink(category.id);
                          }}
                          className="text-xs font-semibold uppercase tracking-[0.16em] text-primary"
                        >
                          View
                        </button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {category.tools.slice(0, 4).map((tool) => (
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
              </motion.div>
            ) : null}
          </AnimatePresence>
        </nav>
      </header>

      <AnimatePresence>
        {searchOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]"
          >
            <button type="button" className="absolute inset-0 bg-background/95" onClick={closeSearch} aria-label="Close search" />

            <motion.div
              initial={{ opacity: 0, y: -18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.985 }}
              transition={{ duration: 0.2 }}
              className={`relative w-full max-w-3xl overflow-hidden rounded-[2rem] border bg-card/98 shadow-premium transition-all duration-300 ${searchFocused ? 'border-primary/40 shadow-primary/10' : 'border-border/50'}`}
            >
              {/* Gradient border animation when focused */}
              {searchFocused && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
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
                    className="flex-1 border-none bg-transparent text-base font-semibold outline-none placeholder:text-muted-foreground/70"
                    autoFocus
                  />
                  <span className="hidden rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:inline-flex">
                    ESC
                  </span>
                </div>
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
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
