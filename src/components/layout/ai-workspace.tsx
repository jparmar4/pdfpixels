'use client';

import { motion } from 'framer-motion';
import { Download, RotateCcw, Sparkles, Eraser, ScanFace, Heart, Wand, ZoomIn, ChevronRight, ShieldCheck, Server, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ResultCard } from './result-card';
import { ToolLimitNotice } from './tool-limit-notice';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const AI_TOOLS: Record<string, { icon: React.ReactNode; label: string; prompt: string }> = {
  'remove-background': {
    icon: <Eraser className="w-7 h-7 text-white" />,
    label: 'Remove Background',
    prompt: 'Remove the background from this image and make it transparent. Keep the main subject intact with clean edges.',
  },
  'enhance-image': {
    icon: <Sparkles className="w-7 h-7 text-white" />,
    label: 'AI Enhance',
    prompt: 'Enhance this image quality. Improve lighting, sharpen details, reduce noise, and correct colors for a professional result.',
  },
  'blur-background': {
    icon: <ScanFace className="w-7 h-7 text-white" />,
    label: 'Blur Background',
    prompt: 'Apply a professional bokeh or depth-of-field blur to the background while keeping the main subject sharply in focus.',
  },
  'blur-face': {
    icon: <ScanFace className="w-7 h-7 text-white" />,
    label: 'Blur Face',
    prompt: 'Detect all faces in this image and blur them for privacy protection. Keep the rest of the image sharp.',
  },
  beautify: {
    icon: <Heart className="w-7 h-7 text-white" />,
    label: 'Beautify',
    prompt: 'Enhance this portrait photo. Smooth skin, brighten eyes, and apply subtle beauty enhancements while keeping a natural look.',
  },
  retouch: {
    icon: <Wand className="w-7 h-7 text-white" />,
    label: 'Retouch',
    prompt: 'Retouch this photo by removing blemishes, spots, and skin imperfections. Keep the result looking natural.',
  },
  upscale: {
    icon: <ZoomIn className="w-7 h-7 text-white" />,
    label: 'AI Upscale',
    prompt: 'Upscale this image to 2x resolution while preserving details and reducing artifacts. Produce a high-quality enlarged version.',
  },
};

type ProcessingMode = 'balanced' | 'high' | 'privacy-max';

export function AIWorkspace() {
  const { activeTool, uploadedFile, processedImage, isProcessing, reset, setIsProcessing, setProcessedImage, setProgress } = useAppStore();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ProcessingMode>('high');
  const [expectedFaces, setExpectedFaces] = useState<'auto' | '1' | '2' | '3' | '4' | '5'>('auto');

  const toolConfig = AI_TOOLS[activeTool?.id || ''] || AI_TOOLS['enhance-image'];
  const isFaceBlur = activeTool?.id === 'blur-face';
  // All AI tools accept a quality mode (enhance/beautify/retouch/upscale use balanced/high)
  const supportsModeSelector = true;
  const modeLabels = isFaceBlur || activeTool?.id === 'remove-background' || activeTool?.id === 'blur-background'
    ? ([
        { id: 'balanced' as const, label: 'Balanced' },
        { id: 'high' as const, label: 'High' },
        { id: 'privacy-max' as const, label: 'Privacy Max' },
      ])
    : ([
        { id: 'balanced' as const, label: 'Natural' },
        { id: 'high' as const, label: 'Vivid' },
      ]);

  const handleProcess = useCallback(async () => {
    if (!uploadedFile) {
      toast.error('Please upload an image first');
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', uploadedFile);
      formData.append('tool', activeTool?.id || 'enhance-image');
      formData.append('prompt', toolConfig.prompt);
      formData.append('mode', mode);
      if (isFaceBlur && expectedFaces !== 'auto') {
        formData.append('expectedFaces', expectedFaces);
      }

      setProgress(30);
      const response = await fetch('/api/ai', {
        method: 'POST',
        body: formData,
      });

      setProgress(70);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'AI processing failed');
      }

      const data = await response.json();
      setProgress(100);
      setProcessedImage(data.imageUrl);
      toast.success(`${toolConfig.label} completed.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process image';
      setError(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedFile, activeTool, toolConfig, mode, expectedFaces, isFaceBlur, setIsProcessing, setProcessedImage, setProgress]);

  const handleDownload = useCallback(() => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `${activeTool?.id || 'ai'}-${Date.now()}.png`;
    link.click();
  }, [processedImage, activeTool]);

  const handleReset = useCallback(() => {
    setError(null);
    reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [reset]);

  if (!activeTool) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 py-8 lg:px-8">
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        icon={toolConfig.icon}
        onReset={handleReset}
        isAI={true}
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
          <FileUpload maxSizeMb={20} />
          <ToolLimitNotice limits={['Image input only', 'Max 20 MB per run', 'PNG result export', 'Best results on clear, well-lit subjects']} />

          {isProcessing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-[1.75rem] border border-violet-200/50 bg-gradient-to-r from-violet-50 to-sky-50 p-8 text-center shadow-premium backdrop-blur-sm dark:border-violet-800/50 dark:from-violet-950/30 dark:to-sky-950/30"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="mx-auto mb-4 h-12 w-12 rounded-full border-[3px] border-violet-500/30 border-t-violet-500"
              />
              <h3 className="mb-1 text-lg font-bold text-foreground">Running AI pipeline</h3>
              <p className="text-sm font-medium text-muted-foreground">We are processing the image and returning a high-quality PNG result.</p>
            </motion.div>
          ) : null}

          {processedImage ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/75 shadow-premium backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3 border-b border-border/40 bg-background/75 px-5 py-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Result preview
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300">PNG ready</Badge>
                </div>
                <div
                  className={`flex min-h-[320px] items-center justify-center p-4 ${
                    activeTool.id === 'remove-background'
                      ? 'bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0] dark:bg-[linear-gradient(45deg,#1f2937_25%,transparent_25%),linear-gradient(-45deg,#1f2937_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1f2937_75%),linear-gradient(-45deg,transparent_75%,#1f2937_75%)]'
                      : 'bg-muted/30'
                  }`}
                >
                  <img src={processedImage} alt={`${toolConfig.label} result`} className="max-h-[520px] max-w-full rounded-2xl object-contain" />
                </div>
              </div>

              <ResultCard
                title={`${toolConfig.label} complete`}
                description="Your AI-processed image is ready for download and follow-up editing."
                onDownload={handleDownload}
                downloadLabel="Download PNG result"
                primaryMeta={mode === 'privacy-max' ? 'Privacy-max profile' : mode === 'high' ? 'High quality profile' : 'Balanced profile'}
                nextActions={[
                  { label: 'Compress image', href: '/tools/compress-image' },
                  { label: 'Resize image', href: '/tools/resize-image' },
                ]}
              />
            </motion.div>
          ) : null}

          {error ? (
            <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
              <p className="text-sm text-red-600 dark:text-red-400"><strong>Error:</strong> {error}</p>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-[1.75rem] border border-border/40 bg-card/60 shadow-premium backdrop-blur-xl">
            <div className="border-b border-border/40 bg-gradient-to-r from-violet-500/10 to-transparent p-5">
              <h3 className="flex items-center gap-2.5 font-bold tracking-tight text-foreground">
                <Sparkles className="h-4 w-4 text-violet-500" />
                AI processing profile
              </h3>
            </div>
            <div className="space-y-4 p-5">
              <div className="rounded-xl border border-violet-200/50 bg-gradient-to-br from-violet-50 to-sky-50 p-3 dark:border-violet-800/30 dark:from-violet-950/30 dark:to-sky-950/20">
                <p className="text-xs leading-5 text-muted-foreground">{toolConfig.prompt}</p>
              </div>

              {supportsModeSelector ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Quality mode</p>
                  <div className={`grid gap-2 ${modeLabels.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {modeLabels.map((item) => (
                      <Button
                        key={item.id}
                        type="button"
                        variant={mode === item.id ? 'default' : 'outline'}
                        className="h-9 text-xs"
                        onClick={() => setMode(item.id)}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}

              {isFaceBlur ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Expected faces</p>
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
                </div>
              ) : null}

              <div className="grid gap-3 rounded-[1.25rem] border border-border/60 bg-background/75 p-4 text-sm text-muted-foreground">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2"><Server className="h-4 w-4 text-sky-500" /> Pipeline</span>
                  <span className="font-semibold text-foreground">Server-side</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Processing</span>
                  <span className="font-semibold text-foreground">No cache</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-500" /> Output</span>
                  <span className="font-semibold text-foreground">PNG export</span>
                </div>
              </div>

              <Button
                className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-sky-600 py-6 font-bold text-white shadow-xl shadow-violet-500/25 transition-all hover:from-violet-600 hover:to-sky-700"
                onClick={handleProcess}
                disabled={!uploadedFile || isProcessing}
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="mr-3 h-5 w-5 rounded-full border-2 border-white/30 border-t-white" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-3 h-5 w-5" />
                    Process image
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full rounded-xl py-6"
                onClick={handleReset}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Start over
              </Button>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border/40 bg-gradient-to-br from-violet-500/5 to-transparent p-5 space-y-3">
            <h4 className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4 text-violet-500" />
              Workflow notes
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-500" />
                <span>Clear subjects and backgrounds produce cleaner segmentation.</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-500" />
                <span>Use privacy-max when face coverage matters more than visual subtlety.</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-500" />
                <span>Follow with compression or resizing if you need a lighter export.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
