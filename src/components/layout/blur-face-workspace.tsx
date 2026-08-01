'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Grid3X3,
  RotateCcw,
  ScanFace,
  Settings,
  ShieldCheck,
  Sparkles,
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

type PrivacyPreset = 'balanced' | 'high' | 'privacy-max';
type FaceStyle = 'blur' | 'pixelate';

const PRESETS: Array<{
  id: PrivacyPreset;
  label: string;
  strength: number;
  hint: string;
}> = [
  { id: 'balanced', label: 'Soft', strength: 40, hint: 'Light anonymity' },
  { id: 'high', label: 'Strong', strength: 70, hint: 'Solid privacy blur' },
  { id: 'privacy-max', label: 'Max privacy', strength: 95, hint: 'Heavy coverage' },
];

export function BlurFaceWorkspace() {
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
  const [mode, setMode] = useState<PrivacyPreset>('high');
  const [blurStrength, setBlurStrength] = useState(70);
  const [faceStyle, setFaceStyle] = useState<FaceStyle>('blur');
  const [expectedFaces, setExpectedFaces] = useState<'auto' | '1' | '2' | '3' | '4' | '5'>('auto');
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [faceCount, setFaceCount] = useState<number | null>(null);
  const [engineLabel, setEngineLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!uploadedFile || !uploadedFile.type.startsWith('image/')) {
      setSourcePreview(null);
      setProcessedImage(null);
      setError(null);
      setFaceCount(null);
      return;
    }
    const url = URL.createObjectURL(uploadedFile);
    setSourcePreview(url);
    setProcessedImage(null);
    setError(null);
    setShowCompare(false);
    setFaceCount(null);
    return () => URL.revokeObjectURL(url);
  }, [uploadedFile, setProcessedImage]);

  const applyPreset = useCallback((preset: (typeof PRESETS)[0]) => {
    setMode(preset.id);
    setBlurStrength(preset.strength);
    setProcessedImage(null);
  }, [setProcessedImage]);

  const handleProcess = useCallback(async () => {
    if (!uploadedFile) {
      toast.error('Please upload an image first');
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    setError(null);
    setFaceCount(null);
    setEngineLabel(null);

    try {
      const formData = new FormData();
      formData.append('image', uploadedFile);
      formData.append('tool', 'blur-face');
      formData.append('mode', mode);
      formData.append('blurStrength', String(blurStrength));
      formData.append('faceStyle', faceStyle);
      formData.append(
        'prompt',
        'Detect all faces and blur or pixelate them for privacy protection.',
      );
      if (expectedFaces !== 'auto') {
        formData.append('expectedFaces', expectedFaces);
      }

      setProgress(28);
      const response = await fetch('/api/ai', {
        method: 'POST',
        body: formData,
      });
      setProgress(75);

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Face blur failed');
      }
      if (!data.imageUrl) {
        throw new Error('No result image returned');
      }

      setProcessedImage(data.imageUrl);
      setFaceCount(typeof data.faceCount === 'number' ? data.faceCount : null);
      setEngineLabel(typeof data.engine === 'string' ? data.engine : null);
      setProgress(100);
      setShowCompare(true);
      if (data.faceCountMismatch && typeof data.faceCount === 'number' && typeof data.expectedFaces === 'number') {
        toast.message(
          `Detected and blurred ${data.faceCount} of ${data.expectedFaces} expected faces. Try High quality or Privacy max if some faces remain visible.`,
        );
      } else {
        toast.success(
          typeof data.faceCount === 'number'
            ? `Blurred ${data.faceCount} face${data.faceCount === 1 ? '' : 's'}.`
            : 'Faces blurred successfully.',
        );
      }
      requestAnimationFrame(() => {
        document.getElementById('blur-face-result')?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to blur faces';
      setError(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  }, [
    blurStrength,
    expectedFaces,
    faceStyle,
    mode,
    setIsProcessing,
    setProcessedImage,
    setProgress,
    uploadedFile,
  ]);

  const handleDownload = useCallback(() => {
    if (!processedImage) return;
    const base = uploadedFile?.name?.replace(/\.[^.]+$/, '') || 'image';
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `${base}-faces-${faceStyle}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Download started');
  }, [faceStyle, processedImage, uploadedFile]);

  const handleReset = useCallback(() => {
    setError(null);
    setMode('high');
    setBlurStrength(70);
    setFaceStyle('blur');
    setExpectedFaces('auto');
    setShowCompare(false);
    setFaceCount(null);
    setEngineLabel(null);
    setSourcePreview(null);
    reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [reset]);

  if (!activeTool) return null;

  const activePreset = PRESETS.find((p) => Math.abs(p.strength - blurStrength) <= 8);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 py-8 lg:px-8">
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        icon={<ScanFace className="h-7 w-7 text-white" />}
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
              'Auto face detection',
              'Blur or pixelate faces',
              'PNG export',
            ]}
          />

          {sourcePreview && !processedImage && !isProcessing ? (
            <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/75 shadow-premium">
              <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
                <p className="text-sm font-semibold">Source image</p>
                <Badge variant="secondary">Ready to anonymize</Badge>
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
                <ScanFace className="h-6 w-6 animate-pulse" />
              </div>
              <h3 className="mb-1 text-center text-lg font-bold">Detecting & blurring faces…</h3>
              <p className="mb-4 text-center text-sm text-muted-foreground">
                Privacy pipeline is running on the server.
              </p>
              <Progress value={progress} className="mx-auto h-2 max-w-md" />
              <p className="mt-2 text-center text-xs font-medium text-muted-foreground tabular-nums">
                {Math.round(progress)}%
              </p>
            </motion.div>
          ) : null}

          {processedImage ? (
            <motion.div
              id="blur-face-result"
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
                    {faceCount != null ? (
                      <Badge variant="secondary">
                        {faceCount} face{faceCount === 1 ? '' : 's'}
                      </Badge>
                    ) : null}
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
                        <img src={sourcePreview} alt="Original" className="max-h-[440px] max-w-full rounded-xl object-contain" />
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                        Anonymized
                      </p>
                      <div className="flex min-h-[260px] items-center justify-center bg-muted/20">
                        <img src={processedImage} alt="Blurred faces result" className="max-h-[440px] max-w-full rounded-xl object-contain" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[320px] items-center justify-center bg-muted/25 p-4">
                    <img
                      src={processedImage}
                      alt="Blurred faces result"
                      className="max-h-[520px] max-w-full rounded-2xl object-contain"
                    />
                  </div>
                )}
              </div>

              <ResultCard
                title="Faces anonymized"
                description="Detected faces were covered with your selected privacy style."
                onDownload={handleDownload}
                downloadLabel="Download PNG"
                primaryMeta={`${faceStyle === 'pixelate' ? 'Pixelate' : 'Blur'} · strength ${blurStrength}%${faceCount != null ? ` · ${faceCount} face(s)` : ''}`}
                nextActions={[
                  { label: 'Pixelate image', href: '/tools/pixelate-image' },
                  { label: 'Censor area', href: '/tools/censor-photo' },
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
                Try a clearer face photo, set expected face count, or use{' '}
                <Link href="/tools/censor-photo" className="font-semibold underline">
                  Censor Photo
                </Link>{' '}
                to paint a region manually.
              </p>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-[1.75rem] border border-border/40 bg-card/60 shadow-premium backdrop-blur-xl">
            <div className="border-b border-border/40 bg-gradient-to-r from-violet-500/10 to-transparent p-5">
              <h3 className="flex items-center gap-2.5 font-bold tracking-tight">
                <Settings className="h-4 w-4 text-violet-500" />
                Privacy settings
              </h3>
            </div>
            <div className="space-y-5 p-5">
              <div className="rounded-xl border border-violet-200/50 bg-gradient-to-br from-violet-50 to-sky-50 p-3 dark:border-violet-800/30 dark:from-violet-950/30 dark:to-sky-950/20">
                <p className="text-xs leading-5 text-muted-foreground">
                  Detects faces automatically and covers them with blur or mosaic so people stay private in shared photos.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Cover style
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFaceStyle('blur');
                      setProcessedImage(null);
                    }}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      faceStyle === 'blur'
                        ? 'border-primary/40 bg-primary/8 ring-1 ring-primary/20'
                        : 'border-border/60 bg-background/70 hover:border-primary/25'
                    }`}
                  >
                    <p className="flex items-center gap-2 text-sm font-bold">
                      <ScanFace className="h-4 w-4" /> Blur
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Smooth privacy blur</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFaceStyle('pixelate');
                      setProcessedImage(null);
                    }}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      faceStyle === 'pixelate'
                        ? 'border-primary/40 bg-primary/8 ring-1 ring-primary/20'
                        : 'border-border/60 bg-background/70 hover:border-primary/25'
                    }`}
                  >
                    <p className="flex items-center gap-2 text-sm font-bold">
                      <Grid3X3 className="h-4 w-4" /> Pixelate
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Mosaic block cover</p>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Privacy preset
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`rounded-xl border p-2.5 text-center transition-all ${
                        activePreset?.id === preset.id
                          ? 'border-primary/40 bg-primary/8 ring-1 ring-primary/20'
                          : 'border-border/60 bg-background/70 hover:border-primary/25'
                      }`}
                    >
                      <p className="text-xs font-bold">{preset.label}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{preset.hint}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Strength</Label>
                  <span className="rounded-lg bg-violet-500/10 px-2.5 py-0.5 font-mono text-sm font-bold text-violet-600 dark:text-violet-300 tabular-nums">
                    {blurStrength}%
                  </span>
                </div>
                <Slider
                  value={[blurStrength]}
                  onValueChange={([v]) => {
                    setBlurStrength(v);
                    setMode(v >= 85 ? 'privacy-max' : v >= 55 ? 'high' : 'balanced');
                    setProcessedImage(null);
                  }}
                  min={15}
                  max={100}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Expected faces
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(['auto', '1', '2', '3', '4', '5'] as const).map((value) => (
                    <Button
                      key={value}
                      type="button"
                      variant={expectedFaces === value ? 'default' : 'outline'}
                      className="h-9 text-xs"
                      onClick={() => setExpectedFaces(value)}
                    >
                      {value === 'auto' ? 'Auto' : value}
                    </Button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Use a number if detection misses someone in a group photo.
                </p>
              </div>

              <div className="grid gap-3 rounded-[1.25rem] border border-border/60 bg-background/75 p-4 text-sm text-muted-foreground">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" /> Privacy
                  </span>
                  <span className="font-semibold text-foreground">Face-only cover</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-500" /> Output
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
                    Processing…
                  </>
                ) : (
                  <>
                    <ScanFace className="mr-3 h-5 w-5" />
                    {faceStyle === 'pixelate' ? 'Pixelate faces' : 'Blur faces'}
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
              Tips
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                Front-facing, well-lit faces detect most reliably.
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                Pixelate is great for news/privacy mosaics; blur looks softer.
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                Missed a region? Use{' '}
                <Link href="/tools/censor-photo" className="font-semibold text-primary hover:underline">
                  Censor Photo
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
