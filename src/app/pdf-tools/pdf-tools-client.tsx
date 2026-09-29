'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Files,
  HelpCircle,
  LayoutGrid,
  Lock,
  Minimize2,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  X,
  Zap,
} from 'lucide-react';
import { allPdfTools, pdfToolGroups, type Tool } from '@/lib/tools-data';
import { useAppStore } from '@/store/app-store';
import { normalizeDisplayText } from '@/lib/display-text';
import { AnimatedMeshBg } from '@/components/ui/animated-mesh-bg';

function getIconColorClass(toolId: string): string {
  const id = toolId.toLowerCase();
  if (id.includes('compress') || id.includes('reduce') || id.includes('kb') || id.includes('linearize')) {
    return 'from-emerald-500/15 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  }
  if (id.includes('merge') || id.includes('split') || id.includes('reorder') || id.includes('delete') || id.includes('crop') || id.includes('rotate')) {
    return 'from-indigo-500/15 to-violet-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
  }
  if (id.includes('to-word') || id.includes('to-excel') || id.includes('to-csv') || id.includes('ocr') || id.includes('bank-statement')) {
    return 'from-blue-500/15 to-cyan-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
  }
  if (id.includes('word-to') || id.includes('excel-to') || id.includes('powerpoint-to') || id.includes('image-to') || id.includes('text-to')) {
    return 'from-sky-500/15 to-blue-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
  }
  if (id.includes('sign') || id.includes('fill') || id.includes('protect') || id.includes('unlock') || id.includes('redact') || id.includes('watermark')) {
    return 'from-amber-500/15 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  }
  return 'from-primary/15 to-violet-500/10 text-primary border-primary/20';
}

function getBadgeClasses(badge?: string) {
  switch (badge) {
    case 'AI':
      return 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30';
    case 'Popular':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
    case 'Secure':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    case 'New':
      return 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30';
    default:
      return 'bg-primary/10 text-primary border-primary/20';
  }
}

function InitialQuerySync({ onQuery, onGroup }: { onQuery: (q: string) => void; onGroup: (g: string) => void }) {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || searchParams.get('search') || '';
  const group = searchParams.get('group') || searchParams.get('category') || '';

  useEffect(() => {
    if (q) onQuery(q);
    if (group) onGroup(group);
  }, [q, group, onQuery, onGroup]);

  return null;
}

export function PdfToolsClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroupId, setActiveGroupId] = useState('all');
  const setActiveTool = useAppStore((state) => state.setActiveTool);

  const filteredTools = useMemo(() => {
    let tools: Tool[] = allPdfTools;

    if (activeGroupId !== 'all') {
      const group = pdfToolGroups.find((g) => g.id === activeGroupId);
      if (group) {
        tools = group.tools;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      tools = tools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q) ||
          tool.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }

    return tools;
  }, [searchQuery, activeGroupId]);

  const quickShortcuts = [
    { name: 'Compress PDF', slug: 'compress-pdf', icon: Minimize2, badge: 'Popular' },
    { name: 'Merge PDF', slug: 'merge-pdf', icon: Files, badge: 'Top Tool' },
    { name: 'PDF to Word', slug: 'pdf-to-word', icon: FileText, badge: 'Editable' },
    { name: 'Sign PDF', slug: 'sign-pdf', icon: FileCheck2, badge: 'Secure' },
    { name: 'PDF to Excel', slug: 'pdf-to-excel', icon: FileSpreadsheet, badge: 'Tables' },
    { name: 'Fast Web View', slug: 'linearize-pdf', icon: Zap, badge: 'New' },
    { name: 'Protect PDF', slug: 'protect-pdf', icon: Lock, badge: 'Encrypted' },
  ];

  return (
    <>
      <Suspense fallback={null}>
        <InitialQuerySync onQuery={setSearchQuery} onGroup={setActiveGroupId} />
      </Suspense>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-background via-background to-muted/20 pb-16 pt-20 md:pb-20 md:pt-28">
        <AnimatedMeshBg />
        <div className="hero-grid absolute inset-0 opacity-40 pointer-events-none" />
        <div className="absolute inset-0 dot-pattern opacity-25 pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4 text-center lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-4xl"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              All {allPdfTools.length} Free Online PDF Tools • Zero Signup
            </div>

            <h1 className="text-balance text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl leading-[1.08]">
              The Complete <span className="gradient-text">PDF Super Suite</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Compress, merge, split, convert, sign, and edit your PDF files with military-grade speed and privacy.
              No watermarks, no file caps, and no software installation required.
            </p>

            {/* Live Search Input */}
            <div className="mx-auto mt-8 max-w-2xl">
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
                  <Search className="h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${allPdfTools.length} PDF tools (e.g. compress, merge, word, excel, sign, protect)...`}
                  aria-label="Search all PDF tools"
                  className="block w-full rounded-2xl border border-border/70 bg-card/85 py-4 pl-14 pr-12 text-base font-medium shadow-[0_12px_40px_-20px_rgba(99,102,241,0.35)] backdrop-blur-sm transition-all placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Quick Jump Pills */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
                <span className="font-semibold text-muted-foreground">Quick jumps:</span>
                {quickShortcuts.map((sc) => (
                  <Link
                    key={sc.slug}
                    href={`/tools/${sc.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1 font-semibold text-muted-foreground transition-all hover:border-primary/40 hover:text-primary hover:shadow-sm"
                  >
                    <sc.icon className="h-3 w-3 text-primary" />
                    {sc.name}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Filter Tabs */}
      <section className="sticky top-16 z-30 border-b border-border/40 bg-background/90 backdrop-blur-sm py-3.5 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="scroll-carousel flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
            <button
              onClick={() => setActiveGroupId('all')}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-all duration-200 ${
                activeGroupId === 'all'
                  ? 'btn-premium text-white shadow-primary shadow-sm'
                  : 'border border-border/60 bg-card/80 text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              All PDF Tools ({allPdfTools.length})
            </button>

            {pdfToolGroups.map((group) => {
              const isActive = activeGroupId === group.id;
              return (
                <button
                  key={group.id}
                  onClick={() => setActiveGroupId(group.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-all duration-200 ${
                    isActive
                      ? 'btn-premium text-white shadow-primary shadow-sm'
                      : 'border border-border/60 bg-card/80 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  }`}
                >
                  {group.name} ({group.tools.length})
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tools Grid Section */}
      <section className="container mx-auto px-4 py-12 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
              {activeGroupId === 'all'
                ? 'All PDF Tools'
                : pdfToolGroups.find((g) => g.id === activeGroupId)?.name ?? 'PDF Tools'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Showing {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'}
              {searchQuery ? ` matching "${searchQuery}"` : ''}
            </p>
          </div>

          {(searchQuery || activeGroupId !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveGroupId('all');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <X className="h-3.5 w-3.5" />
              Reset filters
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {filteredTools.length > 0 ? (
            <motion.div
              key={`${activeGroupId}-${searchQuery}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filteredTools.map((tool) => {
                const Icon = tool.icon;
                const colorClasses = getIconColorClass(tool.id);

                return (
                  <Link
                    key={tool.id}
                    href={`/tools/${tool.slug}`}
                    onClick={() =>
                      setActiveTool({
                        id: tool.id,
                        name: normalizeDisplayText(tool.name),
                        description: normalizeDisplayText(tool.description),
                      })
                    }
                    className="group relative flex flex-col justify-between rounded-2xl border border-border/60 bg-gradient-to-b from-card/90 to-card/50 p-5 shadow-soft backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-premium"
                  >
                    <div>
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl border bg-gradient-to-br transition-transform duration-300 group-hover:scale-105 ${colorClasses}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        {tool.badge && (
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] shadow-2xs ${getBadgeClasses(
                              tool.badge
                            )}`}
                          >
                            {tool.badge}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-foreground transition-colors group-hover:text-primary">
                        {normalizeDisplayText(tool.name)}
                      </h3>

                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {normalizeDisplayText(tool.description)}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-3 text-xs">
                      <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground">
                        {tool.processing === 'client' ? (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                            Browser Private
                          </>
                        ) : (
                          <>
                            <Cpu className="h-3.5 w-3.5 text-sky-500" />
                            High Speed
                          </>
                        )}
                      </span>

                      <span className="inline-flex items-center gap-1 font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                        Launch
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-muted/10 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground">No PDF tools found</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                No tools matched &quot;{searchQuery}&quot;. Try searching for compress, merge, word, or sign.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveGroupId('all');
                }}
                className="btn-premium mt-5 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-sm"
              >
                Show All {allPdfTools.length} PDF Tools
              </button>
            </div>
          )}
        </AnimatePresence>
      </section>

      {/* Trust & Enterprise Quality Badges */}
      <section className="border-y border-border/40 bg-muted/20 py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid gap-6 md:grid-cols-4">
            <div className="flex items-start gap-3.5 rounded-2xl border border-border/50 bg-card/60 p-4 shadow-2xs">
              <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-500" />
              <div>
                <h4 className="text-sm font-bold text-foreground">100% Data Privacy</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Browser-based execution or automatic server purge within 60 minutes. Zero tracking or retention.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-2xl border border-border/50 bg-card/60 p-4 shadow-2xs">
              <Zap className="h-6 w-6 shrink-0 text-amber-500" />
              <div>
                <h4 className="text-sm font-bold text-foreground">Instant Processing</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Optimized WebAssembly & multithreaded cloud workers process gigabytes of PDF pages in seconds.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-2xl border border-border/50 bg-card/60 p-4 shadow-2xs">
              <Star className="h-6 w-6 shrink-0 text-violet-500" />
              <div>
                <h4 className="text-sm font-bold text-foreground">No Subscriptions</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Save hundreds per year over Adobe Acrobat Pro. All 52 core tools are completely free to use.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-2xl border border-border/50 bg-card/60 p-4 shadow-2xs">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-sky-500" />
              <div>
                <h4 className="text-sm font-bold text-foreground">Global Portal Ready</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Outputs strictly adhere to ISO 32000-1 and PDF/A standards for IRS, USCIS, HMRC, and university uploads.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* In-Depth Editorial Section: Tier 1 & Tier 2 Portal Compliance */}
      <section className="container mx-auto max-w-5xl px-4 py-16 lg:px-8">
        <div className="rounded-3xl border border-border/60 bg-card/75 p-6 md:p-10 shadow-soft">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Compliance & Specifications
          </span>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            Optimized for Government, Corporate & Academic Portals Worldwide
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
            Uploading documents to official portals often comes with strict file-size limits, format restrictions, and security mandates.
            PdfPixels is engineered specifically to satisfy these strict requirements:
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border/50 bg-background/70 p-5">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                United States (IRS, USCIS, State Portals)
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                US immigration (USCIS) and tax (IRS) portals frequently enforce 2MB to 6MB upload ceilings.
                Our <Link href="/tools/compress-pdf-to-500kb" className="text-primary hover:underline">Compress PDF to 500KB</Link> and{' '}
                <Link href="/tools/compress-pdf-under-1mb" className="text-primary hover:underline">Compress Under 1MB</Link> tools ensure your documents pass portal size filters without degrading text readability.
              </p>
            </div>

            <div className="rounded-2xl border border-border/50 bg-background/70 p-5">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                United Kingdom (HMRC & Council Portals)
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                UK planning applications, visa submissions, and university portals require consolidated PDF dossiers.
                Use <Link href="/tools/merge-pdf" className="text-primary hover:underline">Merge PDF</Link> to combine bank slips and tenancy agreements, followed by <Link href="/tools/flatten-pdf" className="text-primary hover:underline">Flatten PDF</Link> to freeze interactive form fields.
              </p>
            </div>

            <div className="rounded-2xl border border-border/50 bg-background/70 p-5">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-violet-500" />
                Canada (CRA & IRCC Portals)
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                IRCC study and work permits limit files strictly to 4MB per slot.
                Easily convert high-res phone photos using <Link href="/tools/image-to-pdf" className="text-primary hover:underline">Image to PDF</Link> and optimize them with target compression before submitting.
              </p>
            </div>

            <div className="rounded-2xl border border-border/50 bg-background/70 p-5">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Australia & New Zealand (ATO & MyGov)
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Australian MyGov and university submissions require standardized non-password protected PDFs.
                Use our <Link href="/tools/unlock-pdf" className="text-primary hover:underline">Unlock PDF</Link> and <Link href="/tools/linearize-pdf" className="text-primary hover:underline">Linearize PDF</Link> tools to make large multi-page reports stream instantly in browser viewers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table: PdfPixels vs Adobe Acrobat */}
      <section className="container mx-auto max-w-5xl px-4 py-8 lg:px-8">
        <div className="rounded-3xl border border-border/60 bg-card/75 p-6 md:p-10 shadow-soft">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Honest Comparison
          </span>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            PdfPixels vs Desktop Software & Paid Subscriptions
          </h2>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="py-3 pr-4">Feature</th>
                  <th className="py-3 px-4 text-primary">PdfPixels (Online)</th>
                  <th className="py-3 px-4 text-muted-foreground">Adobe Acrobat Pro</th>
                  <th className="py-3 pl-4 text-muted-foreground">Freemium Websites</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs md:text-sm">
                <tr>
                  <td className="py-3 pr-4 font-semibold text-foreground">Annual Cost</td>
                  <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">Free ($0)</td>
                  <td className="py-3 px-4 text-muted-foreground">$239.88 / year</td>
                  <td className="py-3 pl-4 text-muted-foreground">$72 – $120 / year</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-semibold text-foreground">Account / Registration</td>
                  <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">Never Required</td>
                  <td className="py-3 px-4 text-muted-foreground">Required Adobe ID</td>
                  <td className="py-3 pl-4 text-muted-foreground">Required for 2+ files</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-semibold text-foreground">Device Compatibility</td>
                  <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">Browser (Mac, PC, iOS, Android)</td>
                  <td className="py-3 px-4 text-muted-foreground">Heavy desktop install</td>
                  <td className="py-3 pl-4 text-muted-foreground">Browser-based</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-semibold text-foreground">Target Size Compression (50KB, 100KB, etc.)</td>
                  <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">Built-in 1-Click Presets</td>
                  <td className="py-3 px-4 text-muted-foreground">Complex custom settings</td>
                  <td className="py-3 pl-4 text-muted-foreground">Generic compression only</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-semibold text-foreground">Document Privacy & Auto-Purge</td>
                  <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">Strict 60-min automatic wipe</td>
                  <td className="py-3 px-4 text-muted-foreground">Synced to Adobe Cloud</td>
                  <td className="py-3 pl-4 text-muted-foreground">Varies by provider</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Step-by-Step Guides Section */}
      <section className="container mx-auto max-w-5xl px-4 py-8 lg:px-8">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
          Quick How-To Guides for Everyday PDF Tasks
        </h2>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-border/50 bg-card/60 p-5 shadow-2xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-xs font-black text-primary">
              1
            </div>
            <h3 className="mt-3 text-base font-bold text-foreground">How to Compress a PDF</h3>
            <ol className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground list-decimal pl-4">
              <li>Open the <Link href="/tools/compress-pdf" className="text-primary hover:underline">Compress PDF</Link> tool.</li>
              <li>Upload your PDF file (up to 50MB).</li>
              <li>Choose compression level: Recommended, Extreme, or Target Size (100KB, 200KB).</li>
              <li>Download the optimized document instantly.</li>
            </ol>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card/60 p-5 shadow-2xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-xs font-black text-primary">
              2
            </div>
            <h3 className="mt-3 text-base font-bold text-foreground">How to Merge PDFs</h3>
            <ol className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground list-decimal pl-4">
              <li>Open <Link href="/tools/merge-pdf" className="text-primary hover:underline">Merge PDF</Link>.</li>
              <li>Select or drag and drop up to 20 PDF files.</li>
              <li>Drag pages or documents into your preferred order.</li>
              <li>Click &quot;Merge PDF&quot; and save the single combined document.</li>
            </ol>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card/60 p-5 shadow-2xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-xs font-black text-primary">
              3
            </div>
            <h3 className="mt-3 text-base font-bold text-foreground">How to Convert PDF to Word</h3>
            <ol className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground list-decimal pl-4">
              <li>Open <Link href="/tools/pdf-to-word" className="text-primary hover:underline">PDF to Word</Link>.</li>
              <li>Upload your scanned or standard PDF document.</li>
              <li>Our engine preserves original fonts, tables, and paragraphs.</li>
              <li>Download your fully editable DOCX file.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Comprehensive FAQ Section */}
      <section className="container mx-auto max-w-4xl px-4 py-16 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            <HelpCircle className="h-3.5 w-3.5" />
            Frequently Asked Questions
          </div>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">
            Everything You Need to Know About PdfPixels PDF Tools
          </h2>
        </div>

        <div className="mt-8 space-y-4">
          <details className="group rounded-2xl border border-border/60 bg-card/75 p-5 shadow-2xs transition-all [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between font-bold text-foreground">
              Are these PDF tools really 100% free with no hidden charges?
              <span className="ml-4 shrink-0 rounded-full border border-border/60 p-1 text-muted-foreground transition-transform duration-200 group-open:rotate-180">
                ↓
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Yes, completely free. Unlike other platforms that allow one or two free tasks before locking you behind an expensive recurring subscription, PdfPixels provides unlimited everyday access to its PDF compression, conversion, merging, splitting, and signing workflows without requiring credit cards or signups.
            </p>
          </details>

          <details className="group rounded-2xl border border-border/60 bg-card/75 p-5 shadow-2xs transition-all [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between font-bold text-foreground">
              Is it safe to upload confidential business, tax, or legal documents?
              <span className="ml-4 shrink-0 rounded-full border border-border/60 p-1 text-muted-foreground transition-transform duration-200 group-open:rotate-180">
                ↓
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Security is our highest priority. All data in transit is encrypted using TLS 1.3 encryption. For tools that execute in the browser (such as our PDF reader and metadata viewer), your files never leave your computer. For server-assisted tools, your files are processed in isolated sandboxes and automatically deleted within 60 minutes. We never index, sell, or inspect document content.
            </p>
          </details>

          <details className="group rounded-2xl border border-border/60 bg-card/75 p-5 shadow-2xs transition-all [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between font-bold text-foreground">
              Can I compress a PDF to a specific size like 100KB or 200KB?
              <span className="ml-4 shrink-0 rounded-full border border-border/60 p-1 text-muted-foreground transition-transform duration-200 group-open:rotate-180">
                ↓
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Yes! We have specialized target compression tools: Compress PDF to 50KB, Compress PDF to 100KB, Compress PDF to 200KB, Compress PDF to 300KB, Compress PDF to 500KB, and Compress PDF under 1MB. These are calibrated to meet strict portal upload ceilings without causing blurry text.
            </p>
          </details>

          <details className="group rounded-2xl border border-border/60 bg-card/75 p-5 shadow-2xs transition-all [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between font-bold text-foreground">
              Does PdfPixels work on iPhone, Android, and iPad?
              <span className="ml-4 shrink-0 rounded-full border border-border/60 p-1 text-muted-foreground transition-transform duration-200 group-open:rotate-180">
                ↓
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Yes. All 52 PDF tools are fully responsive and work seamlessly inside Safari on iOS/iPadOS, Chrome on Android, as well as desktop Edge, Chrome, Safari, and Firefox. You can sign contracts, convert photos to PDF, or compress scans directly from your mobile phone.
            </p>
          </details>

          <details className="group rounded-2xl border border-border/60 bg-card/75 p-5 shadow-2xs transition-all [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between font-bold text-foreground">
              What is Fast Web View (Linearization) and why does it matter?
              <span className="ml-4 shrink-0 rounded-full border border-border/60 p-1 text-muted-foreground transition-transform duration-200 group-open:rotate-180">
                ↓
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Linearizing a PDF restructures its internal byte order so web browsers can display the first page immediately while the rest of the document streams in the background (byte-range request). This is essential for large multi-page reports, ebooks, and technical manuals hosted on websites.
            </p>
          </details>
        </div>
      </section>
    </>
  );
}
