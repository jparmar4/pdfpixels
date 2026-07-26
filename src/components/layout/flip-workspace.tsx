'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Download,
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
  Settings,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';

type OutputFormat = 'png' | 'jpg' | 'webp';
type FlipMode = 'horizontal' | 'vertical' | 'both';

const FLIP_MODES: Array<{
  id: FlipMode;
  title: string;
  description: string;
  flipH: boolean;
  flipV: boolean;
  icon: typeof FlipHorizontal;
}> = [
  {
    id: 'horizontal',
    title: 'Horizontal',
    description: 'Mirror left ↔ right (like looking in a mirror)',
    flipH: true,
    flipV: false,
    icon: FlipHorizontal,
  },
  {
    id: 'vertical',
    title: 'Vertical',
    description: 'Flip upside down (top ↔ bottom)',
    flipH: false,
    flipV: true,
    icon: FlipVertical,
  },
  {
    id: 'both',
    title: 'Both axes',
    description: 'Horizontal + vertical (same as 180° rotate)',
    flipH: true,
    flipV: true,
    icon: FlipHorizontal,
  },
];

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this image file'));
    };
    img.src = url;
  });
}

/** Pixel-perfect flip (no resampling needed — dimensions stay the same). */
function renderFlippedImage(
  source: HTMLImageElement,
  flipH: boolean,
  flipV: boolean,
): HTMLCanvasElement {
  const w = source.naturalWidth;
  const h = source.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser');

  // Disable smoothing for crisp flip of pixel art / UI screenshots
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.translate(flipH ? w : 0, flipV ? h : 0);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(source, 0, 0, w, h);
  ctx.restore();
  return canvas;
}

function canvasToDataUrl(canvas: HTMLCanvasElement, format: OutputFormat, quality: number): string {
  const mime =
    format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
  if (format === 'png') return canvas.toDataURL(mime);
  return canvas.toDataURL(mime, Math.max(0.1, Math.min(1, quality / 100)));
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function detectPreferredFormat(file: File): OutputFormat {
  const type = file.type.toLowerCase();
  if (type.includes('jpeg') || type.includes('jpg')) return 'jpg';
  if (type.includes('webp')) return 'webp';
  return 'png';
}

export function FlipWorkspace() {
  const {
    activeTool,
    uploadedFile,
    processedImage,
    isProcessing,
    reset,
    setIsProcessing,
    setProcessedImage,
    setProgress,
  } = useAppStore();

  const [mode, setMode] = useState<FlipMode>('horizontal');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('png');
  const [quality, setQuality] = useState(92);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);
  const sourceUrlRef = useRef<string | null>(null);

  const activeMode = useMemo(
    () => FLIP_MODES.find((m) => m.id === mode) ?? FLIP_MODES[0],
    [mode],
  );
  const flipH = activeMode.flipH;
  const flipV = activeMode.flipV;

  // Load image
  useEffect(() => {
    if (!uploadedFile || !uploadedFile.type.startsWith('image/')) {
      if (sourceUrlRef.current) {
        URL.revokeObjectURL(sourceUrlRef.current);
        sourceUrlRef.current = null;
      }
      setSourceUrl(null);
      setPreviewUrl(null);
      setDims({ w: 0, h: 0 });
      imageRef.current = null;
      setProcessedImage(null);
      return;
    }

    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    const url = URL.createObjectURL(uploadedFile);
    sourceUrlRef.current = url;
    setSourceUrl(url);
    setOutputFormat(detectPreferredFormat(uploadedFile));
    setMode('horizontal');
    setProcessedImage(null);

    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setDims({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => {
      toast.error('Could not load this image. Try JPG, PNG, or WebP.');
      imageRef.current = null;
    };
    img.src = url;

    return () => {
      if (sourceUrlRef.current) {
        URL.revokeObjectURL(sourceUrlRef.current);
        sourceUrlRef.current = null;
      }
    };
  }, [uploadedFile, setProcessedImage]);

  // Live flipped preview whenever mode or image changes
  useEffect(() => {
    if (!imageRef.current || !uploadedFile) {
      setPreviewUrl(null);
      return;
    }

    try {
      const canvas = renderFlippedImage(imageRef.current, flipH, flipV);
      // Cap preview size for memory
      const maxSide = 1400;
      let out = canvas;
      if (canvas.width > maxSide || canvas.height > maxSide) {
        const scale = maxSide / Math.max(canvas.width, canvas.height);
        const small = document.createElement('canvas');
        small.width = Math.max(1, Math.round(canvas.width * scale));
        small.height = Math.max(1, Math.round(canvas.height * scale));
        const sctx = small.getContext('2d');
        if (sctx) {
          sctx.imageSmoothingEnabled = true;
          sctx.imageSmoothingQuality = 'high';
          sctx.drawImage(canvas, 0, 0, small.width, small.height);
          out = small;
        }
      }
      setPreviewUrl(out.toDataURL('image/png'));
    } catch {
      setPreviewUrl(null);
    }
  }, [flipH, flipV, uploadedFile, dims]);

  const selectMode = useCallback((next: FlipMode) => {
    setMode(next);
    setProcessedImage(null);
  }, [setProcessedImage]);

  const handleProcess = useCallback(async () => {
    if (!uploadedFile) {
      toast.error('Please upload an image first');
      return;
    }

    setIsProcessing(true);
    setProgress(25);

    try {
      const img = imageRef.current ?? (await loadImage(uploadedFile));
      imageRef.current = img;
      setProgress(60);

      const canvas = renderFlippedImage(img, flipH, flipV);
      setProgress(90);
      const dataUrl = canvasToDataUrl(canvas, outputFormat, quality);
      setProcessedImage(dataUrl);
      setProgress(100);

      const label =
        mode === 'both'
          ? 'flipped on both axes'
          : mode === 'vertical'
            ? 'flipped vertically'
            : 'flipped horizontally';
      toast.success(`Image ${label} successfully.`);
      requestAnimationFrame(() => {
        document.getElementById('flip-result')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to flip image');
    } finally {
      setIsProcessing(false);
    }
  }, [
    flipH,
    flipV,
    mode,
    outputFormat,
    quality,
    setIsProcessing,
    setProcessedImage,
    setProgress,
    uploadedFile,
  ]);

  const handleDownload = useCallback(() => {
    if (!processedImage) return;
    const ext = outputFormat === 'jpg' ? 'jpg' : outputFormat;
    const base = uploadedFile?.name?.replace(/\.[^.]+$/, '') || 'image';
    const suffix =
      mode === 'both' ? 'flip-both' : mode === 'vertical' ? 'flip-vertical' : 'flip-horizontal';
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `${base}-${suffix}.${ext}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Download started');
  }, [mode, outputFormat, processedImage, uploadedFile]);

  /** Apply and download in one step — common for flip tools */
  const handleApplyAndDownload = useCallback(async () => {
    if (!uploadedFile) {
      toast.error('Please upload an image first');
      return;
    }

    setIsProcessing(true);
    setProgress(25);
    try {
      const img = imageRef.current ?? (await loadImage(uploadedFile));
      imageRef.current = img;
      setProgress(60);
      const canvas = renderFlippedImage(img, flipH, flipV);
      const dataUrl = canvasToDataUrl(canvas, outputFormat, quality);
      setProcessedImage(dataUrl);
      setProgress(100);

      const ext = outputFormat === 'jpg' ? 'jpg' : outputFormat;
      const base = uploadedFile.name?.replace(/\.[^.]+$/, '') || 'image';
      const suffix =
        mode === 'both' ? 'flip-both' : mode === 'vertical' ? 'flip-vertical' : 'flip-horizontal';
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${base}-${suffix}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Flipped image downloaded.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to flip image');
    } finally {
      setIsProcessing(false);
    }
  }, [
    flipH,
    flipV,
    mode,
    outputFormat,
    quality,
    setIsProcessing,
    setProcessedImage,
    setProgress,
    uploadedFile,
  ]);

  const handleReset = useCallback(() => {
    setMode('horizontal');
    setOutputFormat('png');
    setQuality(92);
    setSourceUrl(null);
    setPreviewUrl(null);
    setDims({ w: 0, h: 0 });
    imageRef.current = null;
    reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [reset]);

  if (!activeTool) return null;

  const checkerBg =
    'bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] dark:bg-[linear-gradient(45deg,#1f2937_25%,transparent_25%),linear-gradient(-45deg,#1f2937_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1f2937_75%),linear-gradient(-45deg,transparent_75%,#1f2937_75%)]';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 py-8 lg:px-8">
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        icon={<FlipHorizontal className="h-7 w-7 text-white" />}
        onReset={handleReset}
      >
        {processedImage ? (
          <Button onClick={handleDownload} className="btn-premium gap-2 rounded-xl">
            <Download className="h-4 w-4" />
            Download
          </Button>
        ) : null}
      </ToolPageHeader>

      <div className="space-y-6">
        <FileUpload accept="image/*" />
        <ToolLimitNotice
          limits={[
            'Images only · browser-side processing',
            'Mirror horizontally, vertically, or both',
            'Full resolution · no quality loss on PNG',
          ]}
        />

        {uploadedFile && sourceUrl ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* Before / after preview */}
            <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/75 shadow-premium backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 bg-gradient-to-r from-primary/5 to-transparent p-4">
                <div>
                  <h3 className="font-semibold">Before & after</h3>
                  <p className="text-xs text-muted-foreground">
                    Live preview — {activeMode.title.toLowerCase()} mirror
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="gap-1">
                    {mode === 'vertical' ? (
                      <FlipVertical className="h-3 w-3" />
                    ) : (
                      <FlipHorizontal className="h-3 w-3" />
                    )}
                    {activeMode.title}
                  </Badge>
                  {dims.w > 0 ? (
                    <Badge variant="outline" className="tabular-nums">
                      {dims.w} × {dims.h}
                    </Badge>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-0 sm:grid-cols-2">
                <div className={`border-b border-border/40 p-4 sm:border-b-0 sm:border-r ${checkerBg}`}>
                  <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Original
                  </p>
                  <div className="flex min-h-[220px] items-center justify-center md:min-h-[320px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sourceUrl}
                      alt="Original image"
                      className="max-h-[min(50vh,420px)] max-w-full rounded-lg object-contain shadow-md"
                    />
                  </div>
                </div>
                <div className={`p-4 ${checkerBg}`}>
                  <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                    Flipped preview
                  </p>
                  <div className="flex min-h-[220px] items-center justify-center md:min-h-[320px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl || sourceUrl}
                      alt="Flipped preview"
                      className="max-h-[min(50vh,420px)] max-w-full rounded-lg object-contain shadow-md"
                    />
                  </div>
                </div>
              </div>

              {dims.w > 0 ? (
                <p className="border-t border-border/40 px-4 py-2.5 text-xs text-muted-foreground">
                  {dims.w} × {dims.h}
                  {uploadedFile.size ? ` · ${formatBytes(uploadedFile.size)}` : ''}
                  {' · '}dimensions stay the same after flip
                </p>
              ) : null}
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/75 shadow-premium backdrop-blur-xl">
                <div className="border-b border-border/40 bg-gradient-to-r from-primary/10 to-transparent p-5">
                  <h3 className="flex items-center gap-2 font-bold">
                    <Settings className="h-4 w-4 text-primary" />
                    Flip direction
                  </h3>
                </div>
                <div className="space-y-4 p-5">
                  <div className="space-y-2">
                    {FLIP_MODES.map((item) => {
                      const Icon = item.icon;
                      const selected = mode === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectMode(item.id)}
                          className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                            selected
                              ? 'border-primary/40 bg-primary/8 shadow-soft ring-1 ring-primary/20'
                              : 'border-border/60 bg-background/70 hover:border-primary/25 hover:bg-background'
                          }`}
                        >
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              selected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            <Icon
                              className={`h-5 w-5 ${item.id === 'both' ? '' : ''}`}
                              style={item.id === 'both' ? { transform: 'scaleY(-1)' } : undefined}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-foreground">{item.title}</p>
                            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                          {selected ? (
                            <Badge className="shrink-0 bg-primary/15 text-primary">Active</Badge>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-2">
                    <Label>Output format</Label>
                    <Select
                      value={outputFormat}
                      onValueChange={(v) => {
                        setOutputFormat(v as OutputFormat);
                        setProcessedImage(null);
                      }}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="png">PNG (lossless, keeps transparency)</SelectItem>
                        <SelectItem value="jpg">JPG (smaller photos)</SelectItem>
                        <SelectItem value="webp">WebP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {outputFormat !== 'png' ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Quality</Label>
                        <span className="font-mono text-sm text-primary">{quality}%</span>
                      </div>
                      <Slider
                        value={[quality]}
                        onValueChange={([v]) => setQuality(v)}
                        min={40}
                        max={100}
                        step={1}
                      />
                    </div>
                  ) : null}

                  <div className="space-y-2 pt-1">
                    <Button
                      className="btn-premium h-12 w-full rounded-2xl text-sm font-bold"
                      onClick={handleApplyAndDownload}
                      disabled={!uploadedFile || isProcessing}
                      size="lg"
                    >
                      {isProcessing ? (
                        'Processing…'
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Flip & download
                        </>
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      className="h-11 w-full rounded-2xl gap-2"
                      onClick={handleProcess}
                      disabled={!uploadedFile || isProcessing}
                    >
                      <Sparkles className="h-4 w-4" />
                      Apply flip (preview result)
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11 w-full rounded-2xl gap-2"
                      onClick={handleReset}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Start over
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 to-transparent p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Tips</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-4">
                  <li>Horizontal flip mirrors selfies and text layouts.</li>
                  <li>Vertical flip is useful for reflections and inverted scans.</li>
                  <li>Need free rotation? Use{' '}
                    <Link href="/tools/rotate-image" className="font-semibold text-primary underline-offset-2 hover:underline">
                      Rotate Image
                    </Link>
                    .
                  </li>
                  <li>Everything runs in your browser — files stay private.</li>
                </ul>
              </div>
            </div>
          </div>
        ) : null}

        {processedImage ? (
          <motion.div
            id="flip-result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-[1.75rem] border border-primary/30 bg-primary/5 shadow-lg"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/20 p-4">
              <div>
                <h3 className="font-semibold">Flipped result</h3>
                <p className="text-xs text-muted-foreground">
                  {activeMode.title}
                  {dims.w > 0 ? ` · ${dims.w} × ${dims.h}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">Done</Badge>
                <Button size="sm" className="btn-premium gap-1.5 rounded-xl" onClick={handleDownload}>
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            </div>
            <div className={`flex min-h-[200px] items-center justify-center p-4 ${checkerBg}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={processedImage}
                alt="Flipped result"
                className="max-h-96 max-w-full rounded-lg object-contain shadow-md"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-primary/15 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Want a free angle instead?
              </p>
              <Link
                href="/tools/rotate-image"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Open Rotate Image
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
        ) : null}
      </div>
    </motion.div>
  );
}
