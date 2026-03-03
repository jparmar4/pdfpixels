'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Search,
  ChevronDown,
  Moon,
  Sun,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { toolCategories, searchTools, type Tool } from '@/lib/tools-data';
import { useAppStore } from '@/store/app-store';

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Tool[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const megaTimeout = useRef<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const setActiveTool = useAppStore((state) => state.setActiveTool);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcut: Ctrl+K or / to open search
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName))) {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSearchResults(query.length > 0 ? searchTools(query).slice(0, 8) : []);
  };

  const handleToolSelect = (tool: Tool) => {
    setActiveTool({ id: tool.id, name: tool.name, description: tool.description });
    router.push(`/tools/${tool.slug}`);
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setMobileMenuOpen(false);
    setMegaOpen(false);
  };

  const openMega = () => {
    if (megaTimeout.current) clearTimeout(megaTimeout.current);
    setMegaOpen(true);
  };
  const closeMega = () => {
    megaTimeout.current = setTimeout(() => setMegaOpen(false), 200);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-background/85 backdrop-blur-lg border-b border-border/50 shadow-soft' : 'bg-background/55 backdrop-blur-md'
          }`}
      >
        <nav className="container mx-auto px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">

            {/* ── Logo ── */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group shrink-0"
              onClick={(e) => {
                if (window.location.pathname === '/') {
                  e.preventDefault();
                  useAppStore.getState().reset();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            >
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-all duration-300">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight hidden sm:block">
                <span className="text-shimmer">Pdf</span>Pixels
              </span>
            </Link>

            {/* ── Desktop: Category nav ── */}
            <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
              {toolCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="relative group"
                  onMouseEnter={openMega}
                  onMouseLeave={closeMega}
                >
                  <button
                    onClick={() => {
                      const el = document.getElementById(cat.id);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                      else router.push(`/#${cat.id}`);
                    }}
                    className="px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
                  >
                    {cat.name}
                  </button>
                </div>
              ))}
            </div>

            {/* ── Right side: Search + Theme + Mobile ── */}
            <div className="flex items-center gap-1.5 shrink-0">

              {/* Search trigger */}
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-2 text-muted-foreground hover:text-foreground text-sm font-medium px-4 rounded-xl bg-muted/40 hover:bg-muted/60 border border-transparent hover:border-border/50 transition-all"
                onClick={() => {
                  setSearchOpen(true);
                  setTimeout(() => searchRef.current?.focus(), 50);
                }}
              >
                <Search className="w-4 h-4" />
                <span className="hidden md:inline">Search tools...</span>
                <kbd className="hidden md:inline-flex h-5 items-center gap-0.5 rounded border border-border/60 bg-background/50 px-1.5 text-[10px] font-mono text-muted-foreground font-bold">
                  Ctrl+K
                </kbd>
              </Button>

              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 hover:bg-muted/50 rounded-lg"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>

              {/* Mobile hamburger */}
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 lg:hidden hover:bg-muted/50 rounded-lg"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* ── Mobile Menu ── */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden border-t border-border/20 overflow-hidden"
              >
                <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                  {toolCategories.map((category) => (
                    <div key={category.id}>
                      <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1 flex items-center gap-2">
                        <div className="w-1 h-3 rounded-full bg-primary/60" />
                        {category.name}
                        <span className="text-primary/60 font-normal normal-case tracking-normal">({category.tools.length})</span>
                      </h3>
                      <div className="grid grid-cols-2 gap-1">
                        {category.tools.map((tool) => (
                          <button
                            key={tool.id}
                            onClick={() => handleToolSelect(tool)}
                            className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-muted/50 text-left text-sm transition-colors"
                          >
                            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <tool.icon className="w-3 h-3 text-primary" />
                            </div>
                            <span className="truncate text-xs font-medium">{tool.name}</span>
                            {tool.badge === 'AI' && (
                              <span className="text-[9px] font-bold text-violet-500 ml-auto shrink-0">AI</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </header>

      {/* ── Search Modal (full-screen overlay) ── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]); }} />

            {/* Search panel */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg bg-card/95 backdrop-blur-xl border border-border/60 rounded-3xl shadow-premium overflow-hidden"
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border/30 bg-background/50">
                <Search className="w-5 h-5 text-primary shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search all tools..."
                  className="flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-muted-foreground/60 border-none"
                  autoFocus
                />
                <kbd className="hidden sm:inline-flex h-6 items-center rounded-md border border-border/60 bg-card px-2 text-[10px] font-mono text-muted-foreground font-bold shadow-sm">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              {searchResults.length > 0 ? (
                <div className="p-2 max-h-[50vh] overflow-y-auto">
                  {searchResults.map((tool, i) => (
                    <button
                      key={tool.id}
                      onClick={() => handleToolSelect(tool)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/5 text-left transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <tool.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold flex items-center gap-2">
                          {tool.name}
                          {tool.badge && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${tool.badge === 'AI' ? 'bg-violet-500/15 text-violet-500' : 'bg-primary/10 text-primary'}`}>
                              {tool.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{tool.description}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                    </button>
                  ))}
                </div>
              ) : searchQuery.length > 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">No tools found for &quot;{searchQuery}&quot;</p>
                </div>
              ) : (
                <div className="p-3">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">Popular tools</p>
                  <div className="grid grid-cols-2 gap-1">
                    {toolCategories.flatMap(c => c.tools).filter(t => t.popular).slice(0, 6).map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => handleToolSelect(tool)}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-muted/50 text-left transition-colors"
                      >
                        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          <tool.icon className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-xs font-medium truncate">{tool.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
