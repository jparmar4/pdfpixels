'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Eraser,
  Heart,
  RotateCcw,
  Server,
  ShieldCheck,
  Sparkles,
  Wand,
  ZoomIn,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ResultCard } from './result-card';
import { ToolLimitNotice } from './tool-limit-notice';

type ProcessingMode = 'balanced' | 'high';

const AI_TOOLS: Record<
  string,
  {
    icon: React.ReactNode;
    label: string;
    prompt: string;
    action: string;
    tips: string[];
    nextActions: Array<{ label: string; href: string }>;
  }
> = {
  'remove-background': {
    icon: <Eraser className="w-7 h-7 text-white" />,
    label: 'Remove Background',
    action: 'Remove background',
    prompt: 'Remove the background and keep a clean transparent subject cutout.',
    tips: [
      'Clear subject vs background works best.',
      'Export is PNG with transparency.',
      'Follow with resize or compress if you need a smaller file.',
    ],
    nextActions: [
      { label: 'Blur background', href: '/tools/blur-background' },
      { label: 'Compress image', href: '/tools/compress-image' },
    ],
  },
  'enhance-image': {
    icon: <Sparkles className="w-7 h-7 text-white" />,
    label: 'AI Enhance',
    action: 'Enhance image',
    prompt: 'Improve lighting, sharpness, and color for a cleaner photo.',
    tips: [
      'Natural mode is subtle; Vivid adds more punch.',
      'Works well on slightly soft or dark photos.',
    ],
    nextActions: [
      { label: 'Upscale image', href: '/tools/upscale-image' },
      { label: 'Compress image', href: '/tools/compress-image' },
    ],
  },
  beautify: {
    icon: <Heart className="w-7 h-7 text-white" />,
    label: 'Beautify',
    action: 'Beautify photo',
    prompt: 'Soft portrait polish while keeping a natural look.',
    tips: ['Best on portraits with visible skin.', 'Natural mode for light retouching.'],
    nextActions: [
      { label: 'Retouch photo', href: '/tools/retouch-photo' },
      { label: 'Remove background', href: '/tools/remove-image-background' },
    ],
  },
  retouch: {
    icon: <Wand className="w-7 h-7 text-white" />,
    label: 'Retouch',
    action: 'Retouch photo',
    prompt: 'Smooth blemishes and refine skin while staying natural.',
    tips: ['Use Vivid carefully on already-edited shots.', 'Pair with beautify for portraits.'],
    nextActions: [
      { label: 'Beautify', href: '/tools/beautify-image' },
      { label: 'Enhance', href: '/tools/increase-image-quality' },
    ],
  },
  upscale: {
    icon: <ZoomIn className="w-7 h-7 text-white" />,
    label: 'AI Upscale',
    action: 'Upscale 2×',
    prompt: 'Enlarge about 2× while preserving detail.',
    tips: [
      'Output can be large — compress after if needed.',
      'Works best on non-tiny source images.',
    ],
    nextActions: [
      { label: 'Compress image', href: '/tools/compress-image' },
      { label: 'Resize image', href: '/tools/resize-image' },
    ],
  },
};

export function AIWorkspace() {
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
  const [mode, setMode] = useState<ProcessingMode>('high');
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);

  const toolId = activeTool?.id || 'enhance-image';
  const toolConfig = AI_TOOLS[toolId] || AI_TOOLS['enhance-image'];
  const isRemoveBg = toolId === 'remove-background';

  useEffect(() => {
    if (!uploadedFile || !uploadedFile.type.startsWith('image/')) {
      setSourcePreview(null);
      setProcessedImage(null);
      setError(null);
      setShowCompare(false);
      return;
    }
    const url = URL.createObjectURL(uploadedFile);
    setSourcePreview(url);
    setProcessedImage(null);
    setError(null);
    setShowCompare(false);
    return () => URL.revokeObjectURL(url);
  }, [uploadedFile, setProcessedImage]);

  const handleProcess = useCallback(async () => {
    if (!uploadedFile) {
      toast.error('Please upload an image first');
      return;
    }

    setIsProcessing(true);
    setProgress(12);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', uploadedFile);
      formData.append('tool', toolId);
      formData.append('prompt', toolConfig.prompt);
      formData.append('mode', mode);

      setProgress(35);
      const response = await fetch('/api/ai', {
        method: 'POST',
        body: formData,
      });
      setProgress(78);

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'AI processing failed');
      }
      if (!data.imageUrl) {
        throw new Error('No result image returned');
      }

      setProcessedImage(data.imageUrl);
      setProgress(100);
      setShowCompare(true);
      toast.success(`${toolConfig.label} completed.`);
      requestAnimationFrame(() => {
        document.getElementById('ai-result')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process image';
      setError(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  }, [mode, setIsProcessing, setProcessedImage, setProgress, toolConfig, toolId, uploadedFile]);

  const handleDownload = useCallback(() => {
    if (!processedImage) return;
    const base = uploadedFile?.name?.replace(/\.[^.]+$/, '') || 'image';
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `${base}-${toolId}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Download started');
  }, [processedImage, toolId, uploadedFile]);

  const handleReset = useCallback(() => {
    setError(null);
    setMode('high');
    setShowCompare(false);
    setSourcePreview(null);
    reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [reset]);

  if (!activeTool) return null;

  const checker =
    'bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] dark:bg-[linear-gradient(45deg,#1f2937_25%,transparent_25%),linear-gradient(-45deg,#1f2937_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1f2937_75%),linear-gradient(-45deg,transparent_75%,#1f2937_75%)]';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 py-8 lg:px-8">
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        icon={toolConfig.icon}
        onReset={handleReset}
        isAI
      >
        {processedImage ? (
          <Button onClick={handleDownload} className="btn-premium rounded-xl gap-2">
            <Download className="w-4 h-4" />
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
              'Server-side AI pipeline',
              'PNG export',
              isRemoveBg ? 'Transparent background result' : 'Best on clear, well-lit subjects',
            ]}
          />

          {sourcePreview && !processedImage && !isProcessing ? (
            <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/75 shadow-premium">
              <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
                <p className="text-sm font-semibold">Source image</p>
                <Badge variant="secondary">Ready</Badge>
              </div>
              <div className={`flex min-h-[240px] items-center justify-center p-4 ${isRemoveBg ? checker : 'bg-muted/25'}`}>
                <img src={sourcePreview} alt="Source" className="max-h-[420px] max-w-full rounded-xl object-contain" />
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
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
              <h3 className="mb-1 text-center text-lg font-bold">Running {toolConfig.label}…</h3>
              <p className="mb-4 text-center text-sm text-muted-foreground">Processing on the server and preparing a PNG result.</p>
              <Progress value={progress} className="mx-auto h-2 max-w-md" />
              <p className="mt-2 text-center text-xs font-medium tabular-nums text-muted-foreground">{Math.round(progress)}%</p>
            </motion.div>
          ) : null}

          {processedImage ? (
            <motion.div id="ai-result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/75 shadow-premium">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 bg-background/75 px-5 py-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {showCompare && sourcePreview ? 'Before & after' : 'Result preview'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sourcePreview ? (
                      <Button type="button" size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={() => setShowCompare((v) => !v)}>
                        {showCompare ? 'Result only' : 'Compare'}
                      </Button>
                    ) : null}
                    <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">PNG ready</Badge>
                  </div>
                </div>

                {showCompare && sourcePreview ? (
                  <div className="grid sm:grid-cols-2">
                    <div className="border-b border-border/40 p-4 sm:border-b-0 sm:border-r">
                      <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Original</p>
                      <div className={`flex min-h-[240px] items-center justify-center ${isRemoveBg ? checker : 'bg-muted/20'}`}>
                        <img src={sourcePreview} alt="Original" className="max-h-[420px] max-w-full rounded-xl object-contain" />
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Result</p>
                      <div className={`flex min-h-[240px] items-center justify-center ${isRemoveBg ? checker : 'bg-muted/20'}`}>
                        <img src={processedImage} alt="AI result" className="max-h-[420px] max-w-full rounded-xl object-contain" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`flex min-h-[320px] items-center justify-center p-4 ${isRemoveBg ? checker : 'bg-muted/25'}`}>
                    <img src={processedImage} alt={`${toolConfig.label} result`} className="max-h-[520px] max-w-full rounded-2xl object-contain" />
                  </div>
                )}
              </div>

              <ResultCard
                title={`${toolConfig.label} complete`}
                description="Your AI-processed image is ready to download."
                onDownload={handleDownload}
                downloadLabel="Download PNG"
                primaryMeta={mode === 'high' ? 'Vivid / high profile' : 'Natural / balanced profile'}
                nextActions={toolConfig.nextActions}
              />
            </motion.div>
          ) : null}

          {error ? (
            <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
              <p className="text-sm text-red-600 dark:text-red-400">
                <strong>Error:</strong> {error}
              </p>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-[1.75rem] border border-border/40 bg-card/60 shadow-premium backdrop-blur-xl">
            <div className="border-b border-border/40 bg-gradient-to-r from-violet-500/10 to-transparent p-5">
              <h3 className="flex items-center gap-2.5 font-bold tracking-tight">
                <Sparkles className="h-4 w-4 text-violet-500" />
                AI settings
              </h3>
            </div>
            <div className="space-y-4 p-5">
              <div className="rounded-xl border border-violet-200/50 bg-gradient-to-br from-violet-50 to-sky-50 p-3 dark:border-violet-800/30 dark:from-violet-950/30 dark:to-sky-950/20">
                <p className="text-xs leading-5 text-muted-foreground">{toolConfig.prompt}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Quality mode</p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'balanced' as const, label: 'Natural' },
                      { id: 'high' as const, label: 'Vivid' },
                    ] as const
                  ).map((item) => (
                    <Button
                      key={item.id}
                      type="button"
                      variant={mode === item.id ? 'default' : 'outline'}
                      className="h-10 rounded-xl text-xs"
                      onClick={() => {
                        setMode(item.id);
                        setProcessedImage(null);
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 rounded-[1.25rem] border border-border/60 bg-background/75 p-4 text-sm text-muted-foreground">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2">
                    <Server className="h-4 w-4 text-sky-500" /> Pipeline
                  </span>
                  <span className="font-semibold text-foreground">Server-side</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" /> Cache
                  </span>
                  <span className="font-semibold text-foreground">No store</span>
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
                    <Sparkles className="mr-3 h-5 w-5" />
                    {toolConfig.action}
                  </>
                )}
              </Button>

              <Button variant="outline" className="w-full rounded-xl py-6" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Start over
              </Button>
            </div>
          </div>

          <div className="space-y-3 rounded-[1.75rem] border border-border/40 bg-gradient-to-br from-violet-500/5 to-transparent p-5">
            <h4 className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4 text-violet-500" />
              Tips
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {toolConfig.tips.map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                  <span>{tip}</span>
                </li>
              ))}
              {isRemoveBg ? (
                <li className="flex items-start gap-2">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                  <span>
                    Prefer soft blur instead?{' '}
                    <Link href="/tools/blur-background" className="font-semibold text-primary hover:underline">
                      Blur background
                    </Link>
                  </span>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
