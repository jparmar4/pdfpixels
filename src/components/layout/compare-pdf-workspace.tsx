'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  RotateCcw,
  ArrowLeftRight,
  FileText,
  Plus,
  Minus,
  Copy,
  Check,
  Layers,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { ResultScreenAd, SmartlinkButton } from '@/components/ads/ad-banner';
import { PrivateModeBadge } from './private-mode-badge';
import { toast } from 'sonner';

interface DiffItem {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

interface CompareStats {
  additions: number;
  deletions: number;
  unchanged: number;
  similarity: number;
}

export function ComparePdfWorkspace() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [diffItems, setDiffItems] = useState<DiffItem[]>([]);
  const [stats, setStats] = useState<CompareStats | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'text' | 'visual'>('text');

  // Visual 150 DPI Pixel Diff state
  const [visualPage, setVisualPage] = useState<number>(1);
  const [visualMaxPages, setVisualMaxPages] = useState<number>(1);
  const [isRenderingVisual, setIsRenderingVisual] = useState<boolean>(false);
  const [onionOpacity, setOnionOpacity] = useState<number>(50);
  const [showMagentaDiff, setShowMagentaDiff] = useState<boolean>(true);
  const [pixelStats, setPixelStats] = useState<{ changedPixels: number; totalPixels: number; pct: string } | null>(null);
  const visualCanvasRef = useRef<HTMLCanvasElement>(null);
  const renderedLayersRef = useRef<{
    canvasA: HTMLCanvasElement;
    canvasB: HTMLCanvasElement;
    diffOverlay: HTMLCanvasElement;
    width: number;
    height: number;
  } | null>(null);

  const compositeVisualDiff = useCallback(() => {
    const target = visualCanvasRef.current;
    const layers = renderedLayersRef.current;
    if (!target || !layers) return;
    target.width = layers.width;
    target.height = layers.height;
    const ctx = target.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, layers.width, layers.height);

    ctx.globalAlpha = Math.max(0, Math.min(1, 1 - onionOpacity / 100));
    ctx.drawImage(layers.canvasA, 0, 0);
    ctx.globalAlpha = Math.max(0, Math.min(1, onionOpacity / 100));
    ctx.drawImage(layers.canvasB, 0, 0);
    ctx.globalAlpha = 1;

    if (showMagentaDiff) {
      ctx.drawImage(layers.diffOverlay, 0, 0);
    }
  }, [onionOpacity, showMagentaDiff]);

  useEffect(() => {
    if (activeTab === 'visual') {
      compositeVisualDiff();
    }
  }, [compositeVisualDiff, activeTab, pixelStats]);

  const computeVisualDiffPage = useCallback(async (pageNum: number) => {
    if (!fileA || !fileB) return;
    setIsRenderingVisual(true);
    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const [bufA, bufB] = await Promise.all([fileA.arrayBuffer(), fileB.arrayBuffer()]);
      const [docA, docB] = await Promise.all([
        pdfjs.getDocument({ data: new Uint8Array(bufA), cMapUrl: '/pdfjs/cmaps/', cMapPacked: true, standardFontDataUrl: '/pdfjs/standard_fonts/' }).promise,
        pdfjs.getDocument({ data: new Uint8Array(bufB), cMapUrl: '/pdfjs/cmaps/', cMapPacked: true, standardFontDataUrl: '/pdfjs/standard_fonts/' }).promise,
      ]);

      try {
        const maxPages = Math.max(docA.numPages, docB.numPages);
        setVisualMaxPages(maxPages);
        const clamped = Math.min(maxPages, Math.max(1, pageNum));
        setVisualPage(clamped);

        const dpiScale = 150 / 72;
        const pageA = clamped <= docA.numPages ? await docA.getPage(clamped) : null;
        const pageB = clamped <= docB.numPages ? await docB.getPage(clamped) : null;
        const vpA = pageA?.getViewport({ scale: dpiScale });
        const vpB = pageB?.getViewport({ scale: dpiScale });
        const width = Math.max(1, Math.round(Math.max(vpA?.width || 612, vpB?.width || 612)));
        const height = Math.max(1, Math.round(Math.max(vpA?.height || 792, vpB?.height || 792)));

        const renderToCanvas = async (pg: any, vp: any) => {
          const c = document.createElement('canvas');
          c.width = width;
          c.height = height;
          const cctx = c.getContext('2d', { willReadFrequently: true });
          if (cctx) {
            cctx.fillStyle = '#ffffff';
            cctx.fillRect(0, 0, width, height);
            if (pg && vp) await pg.render({ canvasContext: cctx, viewport: vp, canvas: c }).promise;
          }
          return c;
        };

        const [canvasA, canvasB] = await Promise.all([renderToCanvas(pageA, vpA), renderToCanvas(pageB, vpB)]);
        const dataA = canvasA.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, width, height).data;
        const dataB = canvasB.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, width, height).data;

        const diffOverlay = document.createElement('canvas');
        diffOverlay.width = width;
        diffOverlay.height = height;
        const diffCtx = diffOverlay.getContext('2d')!;
        const diffImg = diffCtx.createImageData(width, height);
        const out = diffImg.data;

        let changed = 0;
        const totalPixels = width * height;
        for (let i = 0; i < dataA.length; i += 4) {
          const delta = Math.abs(dataA[i] - dataB[i]) + Math.abs(dataA[i + 1] - dataB[i + 1]) + Math.abs(dataA[i + 2] - dataB[i + 2]);
          if (delta > 38) {
            // Neon Magenta (#EC4899)
            out[i] = 236;
            out[i + 1] = 72;
            out[i + 2] = 153;
            out[i + 3] = 225;
            changed += 1;
          }
        }
        diffCtx.putImageData(diffImg, 0, 0);

        renderedLayersRef.current = { canvasA, canvasB, diffOverlay, width, height };
        setPixelStats({
          changedPixels: changed,
          totalPixels,
          pct: ((changed / Math.max(1, totalPixels)) * 100).toFixed(2),
        });
        compositeVisualDiff();
      } finally {
        await Promise.all([docA.destroy(), docB.destroy()]);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not render 150 DPI visual pixel diff.');
    } finally {
      setIsRenderingVisual(false);
    }
  }, [fileA, fileB, compositeVisualDiff]);

  const handleReset = useCallback(() => {
    setFileA(null);
    setFileB(null);
    setDiffItems([]);
    setStats(null);
    setCopied(false);
    setPixelStats(null);
    renderedLayersRef.current = null;
  }, []);

  const runCompare = async () => {
    if (!fileA || !fileB) {
      toast.error('Please select both the Original PDF and the Revised PDF to compare');
      return;
    }
    if (fileA.size === 0 || fileB.size === 0) {
      toast.error('One of your PDFs is empty. Please choose valid files.');
      return;
    }
    if (fileA.size > 50 * 1024 * 1024 || fileB.size > 50 * 1024 * 1024) {
      toast.error('Each PDF must be 50MB or smaller.');
      return;
    }
    if (
      fileA.name === fileB.name &&
      fileA.size === fileB.size &&
      fileA.lastModified === fileB.lastModified
    ) {
      toast.error('Please upload two different PDFs to compare.');
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('fileA', fileA);
      formData.append('fileB', fileB);

      const { fetchWithUploadProgress } = await import('@/lib/upload-with-progress');
      const res = await fetchWithUploadProgress('/api/pdf/compare', formData, setProgress);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Comparison failed' }));
        throw new Error(err.error || 'Failed to compare documents');
      }

      const data = await res.json();
      setDiffItems(data.diff || []);
      setStats(data.stats || null);
      toast.success(`Comparison complete! Found ${data.stats?.additions || 0} additions and ${data.stats?.deletions || 0} deletions.`);
    } catch (err: any) {
      toast.error(err.message || 'Comparison failed');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleCopyDiff = async () => {
    if (diffItems.length === 0) return;
    const text = diffItems
      .map((d) => {
        if (d.type === 'added') return `+ ${d.text}`;
        if (d.type === 'removed') return `- ${d.text}`;
        return `  ${d.text}`;
      })
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Redline diff copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not access clipboard. Select and copy manually.');
    }
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
      <ToolPageHeader
        title="Compare PDF Documents Online"
        description="Compare two versions of a contract or PDF side-by-side to highlight text differences, clause additions, and deletions with redline diff."
        icon={<ArrowLeftRight className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'Upload 2 PDF documents · Original (Baseline) vs. Revised',
          'Word-level and sentence-level redline highlighting (Green/Red)',
          '100% private in-memory document comparison',
        ]}
      />

      <div className="mt-8 space-y-6">
        {/* Upload Dual Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* File A: Original */}
          <div className="bg-card border-2 border-dashed rounded-2xl p-6 text-center space-y-3 hover:border-primary/50 transition-colors">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              1. Original PDF (Baseline)
            </span>
            {fileA ? (
              <div className="p-4 bg-muted/40 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-5 h-5 text-primary shrink-0" />
                  <span className="font-medium text-xs truncate">{fileA.name}</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => { setFileA(null); setStats(null); setDiffItems([]); }} className="text-xs text-muted-foreground h-7">
                  Change
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer block py-4">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFileA(f);
                  }}
                />
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2 text-muted-foreground">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-foreground block">Select Original Document</span>
                <span className="text-[11px] text-muted-foreground">PDF up to 50 MB</span>
              </label>
            )}
          </div>

          {/* File B: Revised */}
          <div className="bg-card border-2 border-dashed rounded-2xl p-6 text-center space-y-3 hover:border-primary/50 transition-colors">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              2. Revised PDF (Modified Version)
            </span>
            {fileB ? (
              <div className="p-4 bg-muted/40 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="font-medium text-xs truncate">{fileB.name}</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => { setFileB(null); setStats(null); setDiffItems([]); }} className="text-xs text-muted-foreground h-7">
                  Change
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer block py-4">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFileB(f);
                  }}
                />
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2 text-muted-foreground">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-foreground block">Select Revised Document</span>
                <span className="text-[11px] text-muted-foreground">PDF up to 50 MB</span>
              </label>
            )}
          </div>
        </div>

        {/* Mode Selector Tabs (Redline Text Diff vs 150 DPI Visual Pixel Diff) */}
        {fileA && fileB && (
          <Tabs
            value={activeTab}
            onValueChange={(val) => {
              const mode = val === 'visual' ? 'visual' : 'text';
              setActiveTab(mode);
              if (mode === 'visual') {
                void computeVisualDiffPage(visualPage);
              }
            }}
            className="space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                <TabsTrigger value="text" className="gap-1.5 text-xs">
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  Redline Text Diff
                </TabsTrigger>
                <TabsTrigger value="visual" className="gap-1.5 text-xs">
                  <Layers className="w-3.5 h-3.5 text-pink-600" />
                  Visual Pixel Diff (150 DPI)
                </TabsTrigger>
              </TabsList>

              {activeTab === 'text' && diffItems.length === 0 && (
                <Button size="sm" onClick={runCompare} disabled={isProcessing} className="gap-2 font-semibold">
                  <ArrowLeftRight className="w-4 h-4" />
                  {isProcessing ? `Comparing… ${Math.round(progress)}%` : 'Compare Text Diff'}
                </Button>
              )}

              {activeTab === 'visual' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void computeVisualDiffPage(visualPage)}
                  disabled={isRenderingVisual}
                  className="gap-1.5 text-xs"
                >
                  {isRenderingVisual ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5 text-pink-600" />}
                  Re-Render 150 DPI Diff
                </Button>
              )}
            </div>

            <TabsContent value="text" className="space-y-4">
              {stats ? (
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground">Compares selectable text line by line. Switch to Visual Pixel Diff (150 DPI) to inspect signature, stamp, and CAD/blueprint changes.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-card border rounded-xl p-4 text-center">
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">Similarity</span>
                      <span className="text-2xl font-bold text-foreground font-mono">{stats.similarity}%</span>
                    </div>
                    <div className="bg-card border rounded-xl p-4 text-center">
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">Additions</span>
                      <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">+{stats.additions}</span>
                    </div>
                    <div className="bg-card border rounded-xl p-4 text-center">
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">Deletions</span>
                      <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">-{stats.deletions}</span>
                    </div>
                    <div className="bg-card border rounded-xl p-4 text-center">
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">Unchanged</span>
                      <span className="text-2xl font-bold text-muted-foreground font-mono">{stats.unchanged}</span>
                    </div>
                  </div>

                  <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                      <span className="font-semibold text-xs">Redline Text Comparison View</span>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={handleCopyDiff} className="h-8 gap-1.5 text-xs">
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? 'Copied' : 'Copy Redline'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleReset} className="h-8 text-xs text-muted-foreground">
                          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Clear
                        </Button>
                      </div>
                    </div>

                    <div className="p-6 max-h-[500px] overflow-y-auto font-mono text-xs space-y-1.5 bg-background select-text">
                      {diffItems.map((item, idx) => {
                        if (item.type === 'added') {
                          return (
                            <div key={idx} className="p-2 rounded bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-l-4 border-emerald-500 flex items-start gap-2">
                              <Plus className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span>{item.text}</span>
                            </div>
                          );
                        }
                        if (item.type === 'removed') {
                          return (
                            <div key={idx} className="p-2 rounded bg-rose-500/10 text-rose-800 dark:text-rose-300 border-l-4 border-rose-500 line-through opacity-80 flex items-start gap-2">
                              <Minus className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span>{item.text}</span>
                            </div>
                          );
                        }
                        return (
                          <div key={idx} className="px-2 py-1 text-muted-foreground leading-relaxed">
                            {item.text}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border bg-card/75 p-6 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">Click below to compute word-level Additions &amp; Deletions, or open Visual Pixel Diff (150 DPI).</p>
                  <Button size="lg" onClick={runCompare} disabled={isProcessing} className="gap-2 font-semibold">
                    <ArrowLeftRight className="w-4 h-4" />
                    {isProcessing ? `Comparing… ${Math.round(progress)}%` : 'Compare PDF Documents'}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="visual" className="space-y-4">
              <PrivateModeBadge description="150 DPI Visual Pixel Diff renders both PDFs on browser canvases locally — signatures, stamps, and drawings never leave your device." />

              <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={visualPage <= 1 || isRenderingVisual}
                      onClick={() => void computeVisualDiffPage(visualPage - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs font-mono font-semibold">
                      Page {visualPage} / {visualMaxPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={visualPage >= visualMaxPages || isRenderingVisual}
                      onClick={() => void computeVisualDiffPage(visualPage + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    {pixelStats && (
                      <Badge className="ml-2 bg-pink-500/12 text-pink-700 dark:text-pink-300 border-pink-500/30 font-mono">
                        {pixelStats.pct}% changed ({pixelStats.changedPixels.toLocaleString()} px)
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showMagentaDiff}
                        onChange={(e) => setShowMagentaDiff(e.target.checked)}
                        className="accent-pink-600"
                      />
                      Highlight Diff (#EC4899 Neon Magenta)
                    </label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const c = visualCanvasRef.current;
                        if (!c) return;
                        c.toBlob((b) => {
                          if (!b) return;
                          const url = URL.createObjectURL(b);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `pixel-diff-page-${visualPage}.png`;
                          a.click();
                          window.setTimeout(() => URL.revokeObjectURL(url), 1000);
                        }, 'image/png');
                      }}
                      className="gap-1.5 text-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Diff PNG
                    </Button>
                  </div>
                </div>

                {/* Onion-Skin Opacity Slider */}
                <div className="rounded-xl border border-border/60 bg-background/70 p-3 flex flex-wrap items-center gap-4">
                  <Label htmlFor="onion-skin-slider" className="text-xs font-semibold whitespace-nowrap">
                    Onion-Skin Blend: {100 - onionOpacity}% Original / {onionOpacity}% Revised
                  </Label>
                  <input
                    id="onion-skin-slider"
                    type="range"
                    min={0}
                    max={100}
                    value={onionOpacity}
                    onChange={(e) => setOnionOpacity(Number(e.target.value))}
                    className="flex-1 min-w-[180px] accent-pink-600"
                  />
                </div>

                <div className="relative overflow-auto rounded-xl border bg-muted/20 p-3 flex items-center justify-center min-h-[360px]">
                  {isRenderingVisual && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/75 backdrop-blur-xs">
                      <Loader2 className="w-6 h-6 animate-spin text-pink-600 mr-2" />
                      <span className="text-xs font-semibold">Rasterizing 150 DPI Visual Pixel Diff...</span>
                    </div>
                  )}
                  <canvas ref={visualCanvasRef} className="max-w-full h-auto shadow-md bg-white rounded" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {(stats || pixelStats) && (
          <div className="flex flex-col items-center gap-3 pt-2">
            <SmartlinkButton />
            <ResultScreenAd refreshKey={stats?.similarity ?? pixelStats?.pct ?? 'diff'} />
          </div>
        )}
      </div>
    </div>
  );
}
