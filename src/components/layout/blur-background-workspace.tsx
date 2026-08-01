'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Aperture,
  ArrowRight,
  CheckCircle2,
  Download,
  Focus,
  RotateCcw,
  Settings,
  Sparkles,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { ResultCard } from './result-card';

type StrengthPreset = {
  id: string;
  label: string;
  value: number;
  hint: string;
};

const STRENGTH_PRESETS: StrengthPreset[] = [
  { id: 'soft', label: 'Soft', value: 28, hint: 'Subtle depth of field' },
  { id: 'medium', label: 'Medium', value: 50, hint: 'Natural portrait look' },
  { id: 'strong', label: 'Strong', value: 72, hint: 'Clear subject pop' },
  { id: 'max', label: 'Max', value: 92, hint: 'Heavy bokeh-style blur' },
];

export function BlurBackgroundWorkspace() {
  const {
    activeTool,
    uploadedFile,
    processedImage,
    isProcessing,
    progress,
    reset,
    setIsProcessing,
    setProcessedImage,
    setProgress,
  } = useAppStore();

  const [error, setError] = useState<string | null>(null);
  const [blurStrength, setBlurStrength] = useState(55);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [engineLabel, setEngineLabel] = useState<string | null>(null);

  // Source preview URL
  useEffect(() => {
    if (!uploadedFile || !uploadedFile.type.startsWith('image/')) {
      setSourcePreview(null);
      setProcessedImage(null);
      setError(null);
      setEngineLabel(null);
      return;
    }
    const url = URL.createObjectURL(uploadedFile);
    setSourcePreview(url);
    setProcessedImage(null);
    setError(null);
    setShowCompare(false);
    return () => URL.revokeObjectURL(url);
  }, [uploadedFile, setProcessedImage]);

  const activePreset = useMemo(
    () =>
      STRENGTH_PRESETS.find((p) => Math.abs(p.value - blurStrength) <= 6) ?? null,
    [blurStrength],
  );

  const handleProcess = useCallback(async () => {
    if (!uploadedFile) {
      toast.error('Please upload an image first');
      return;
    }

    setIsProcessing(true);
    setProgress(8);
    setError(null);
    setEngineLabel(null);

    try {
      const formData = new FormData();
      formData.append('image', uploadedFile);
      formData.append('tool', 'blur-background');
      formData.append('blurStrength', String(blurStrength));
      // Coarse mode for API fallbacks / logging
      const mode =
        blurStrength >= 80 ? 'privacy-max' : blurStrength >= 50 ? 'high' : 'balanced';
      formData.append('mode', mode);
      formData.append(
        'prompt',
        'Apply professional depth-of-field blur to the background while keeping the subject sharp.',
      );

      setProgress(25);
      const response = await fetch('/api/ai', {
        method: 'POST',
        body: formData,
      });
      setProgress(78);

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Background blur failed');
      }

      if (!data.imageUrl) {
        throw new Error('No result image returned from the server');
      }

      setProcessedImage(data.imageUrl);
      setEngineLabel(typeof data.engine === 'string' ? data.engine : null);
      setProgress(100);
      setShowCompare(true);
      toast.success('Background blurred — subject kept sharp.');
      requestAnimationFrame(() => {
        document.getElementById('blur-bg-result')?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to blur background';
      setError(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  }, [blurStrength, setIsProcessing, setProcessedImage, setProgress, uploadedFile]);

  const handleDownload = useCallback(() => {
    if (!processedImage) return;
    const base = uploadedFile?.name?.replace(/\.[^.]+$/, '') || 'image';
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `${base}-blur-background.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Download started');
  }, [processedImage, uploadedFile]);

  const handleReset = useCallback(() => {
    setError(null);
    setBlurStrength(55);
    setShowCompare(false);
    setEngineLabel(null);
    setSourcePreview(null);
    reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [reset]);

  if (!activeTool) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 py-8 lg:px-8">
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        icon={<Aperture className="h-7 w-7 text-white" />}
        onReset={handleReset}
        isAI
      >
        {processedImage ? (
          <Button onClick={handleDownload} className="btn-premium gap-2 rounded-xl">
            <Download className="h-4 w-4" />
            Download
          </Button>
        ) : null}
      </ToolPageHeader>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <FileUpload accept="image/*" maxSizeMb={20} />
          <ToolLimitNotice
            limits={[
              'Images only · max 20 MB',
              'Keeps the main subject sharp',
              'Best with a clear person/object vs background',
              'PNG export',
            ]}
          />

          {/* Source preview before run */}
          {sourcePreview && !processedImage && !isProcessing ? (
            <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/75 shadow-premium">
              <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
                <p className="text-sm font-semibold">Source image</p>
                <Badge variant="secondary">Ready to blur</Badge>
              </div>
              <div className="flex min-h-[240px] items-center justify-center bg-muted/25 p-4">
                <img
                  src={sourcePreview}
                  alt="Source"
                  className="max-h-[420px] max-w-full rounded-xl object-contain"
                />
              </div>
            </div>
          ) : null}

          {isProcessing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-[1.75rem] border border-violet-200/50 bg-gradient-to-r from-violet-50 to-sky-50 p-8 shadow-premium dark:border-violet-800/50 dark:from-violet-950/30 dark:to-sky-950/30"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-600">
                <Focus className="h-6 w-6 animate-pulse" />
              </div>
              <h3 className="mb-1 text-center text-lg font-bold">Blurring background…</h3>
              <p className="mb-4 text-center text-sm text-muted-foreground">
                Detecting the subject, then applying depth-of-field blur.
              </p>
              <Progress value={progress} className="mx-auto h-2 max-w-md" />
              <p className="mt-2 text-center text-xs font-medium text-muted-foreground tabular-nums">
                {Math.round(progress)}%
              </p>
            </motion.div>
          ) : null}

          {processedImage ? (
            <motion.div
              id="blur-bg-result"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/75 shadow-premium">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 bg-background/75 px-5 py-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {showCompare && sourcePreview ? 'Before & after' : 'Result preview'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sourcePreview ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg text-xs"
                        onClick={() => setShowCompare((v) => !v)}
                      >
                        {showCompare ? 'Result only' : 'Compare'}
                      </Button>
                    ) : null}
                    <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                      PNG ready
                    </Badge>
                  </div>
                </div>

                {showCompare && sourcePreview ? (
                  <div className="grid sm:grid-cols-2">
                    <div className="border-b border-border/40 p-4 sm:border-b-0 sm:border-r">
                      <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        Original
                      </p>
                      <div className="flex min-h-[260px] items-center justify-center bg-muted/20">
                        <img
                          src={sourcePreview}
                          alt="Original"
                          className="max-h-[440px] max-w-full rounded-xl object-contain"
                        />
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                        Blurred background
                      </p>
                      <div className="flex min-h-[260px] items-center justify-center bg-muted/20">
                        <img
                          src={processedImage}
                          alt="Blurred background result"
                          className="max-h-[440px] max-w-full rounded-xl object-contain"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[320px] items-center justify-center bg-muted/25 p-4">
                    <img
                      src={processedImage}
                      alt="Blurred background result"
                      className="max-h-[520px] max-w-full rounded-2xl object-contain"
                    />
                  </div>
                )}
              </div>

              <ResultCard
                title="Background blur complete"
                description="Subject stays sharp while the background is soft-focused for a portrait-style look."
                onDownload={handleDownload}
                downloadLabel="Download PNG"
                primaryMeta={`Blur strength ${blurStrength}%${activePreset ? ` · ${activePreset.label}` : ''}`}
                nextActions={[
                  { label: 'Remove background', href: '/tools/remove-image-background' },
                  { label: 'Compress image', href: '/tools/compress-image' },
                ]}
              />
            </motion.div>
          ) : null}

          {error ? (
            <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
              <p className="text-sm text-red-600 dark:text-red-400">
                <strong>Error:</strong> {error}
              </p>
              <p className="mt-2 text-xs text-red-600/80 dark:text-red-400/80">
                Try a photo with a clear subject and simpler background, or adjust blur strength.
              </p>
            </div>
          ) : null}
        </div>

        {/* Controls */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-[1.75rem] border border-border/40 bg-card/60 shadow-premium backdrop-blur-xl">
            <div className="border-b border-border/40 bg-gradient-to-r from-violet-500/10 to-transparent p-5">
              <h3 className="flex items-center gap-2.5 font-bold tracking-tight">
                <Settings className="h-4 w-4 text-violet-500" />
                Blur settings
              </h3>
            </div>
            <div className="space-y-5 p-5">
              <div className="rounded-xl border border-violet-200/50 bg-gradient-to-br from-violet-50 to-sky-50 p-3 dark:border-violet-800/30 dark:from-violet-950/30 dark:to-sky-950/20">
                <p className="text-xs leading-5 text-muted-foreground">
                  Detects the main subject and softens everything behind it — like a camera
                  aperture effect for portraits and product shots.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Strength preset
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {STRENGTH_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setBlurStrength(preset.value);
                        setProcessedImage(null);
                      }}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        activePreset?.id === preset.id
                          ? 'border-primary/40 bg-primary/8 ring-1 ring-primary/20'
                          : 'border-border/60 bg-background/70 hover:border-primary/25'
                      }`}
                    >
                      <p className="text-sm font-bold text-foreground">{preset.label}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{preset.hint}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Custom strength</Label>
                  <span className="rounded-lg bg-violet-500/10 px-2.5 py-0.5 font-mono text-sm font-bold text-violet-600 dark:text-violet-300 tabular-nums">
                    {blurStrength}%
                  </span>
                </div>
                <Slider
                  value={[blurStrength]}
                  onValueChange={([v]) => {
                    setBlurStrength(v);
                    setProcessedImage(null);
                  }}
                  min={10}
                  max={100}
                  step={1}
                />
                <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  <span>Soft</span>
                  <span>Strong</span>
                </div>
              </div>

              <div className="grid gap-3 rounded-[1.25rem] border border-border/60 bg-background/75 p-4 text-sm text-muted-foreground">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-500" /> Subject
                  </span>
                  <span className="font-semibold text-foreground">Kept sharp</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2">
                    <Aperture className="h-4 w-4 text-violet-500" /> Background
                  </span>
                  <span className="font-semibold text-foreground">Soft focus</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-sky-500" /> Output
                  </span>
                  <span className="font-semibold text-foreground">PNG</span>
                </div>
              </div>

              <Button
                className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-sky-600 py-6 font-bold text-white shadow-xl shadow-violet-500/25 hover:from-violet-600 hover:to-sky-700"
                onClick={handleProcess}
                disabled={!uploadedFile || isProcessing}
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="mr-3 h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                    />
                    Blurring…
                  </>
                ) : (
                  <>
                    <Aperture className="mr-3 h-5 w-5" />
                    Blur background
                  </>
                )}
              </Button>

              <Button variant="outline" className="w-full rounded-xl py-6" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Start over
              </Button>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border/40 bg-gradient-to-br from-violet-500/5 to-transparent p-5 space-y-3">
            <h4 className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4 text-violet-500" />
              Tips for best results
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                Use a photo where the subject stands out from the background.
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                Medium strength suits portraits; Max works for busy scenes.
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                Need a full cutout instead?{' '}
                <Link
                  href="/tools/remove-image-background"
                  className="font-semibold text-primary underline-offset-2 hover:underline"
                >
                  Remove background
                </Link>
                .
              </li>
            </ul>
            {engineLabel ? (
              <p className="pt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
                Pipeline: {engineLabel}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
