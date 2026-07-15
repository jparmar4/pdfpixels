'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Minimize2, RefreshCw, Sparkles, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ResultCard } from './result-card';
import { ToolLimitNotice } from './tool-limit-notice';
import { ToolPageHeader } from './tool-page-header';

interface CompressionResult {
  imageUrl: string;
  originalSize: number;
  processedSize: number;
  savedPercent: number;
  format?: string;
}

const PRESETS = [
  { label: '50 KB', value: '50' },
  { label: '100 KB', value: '100' },
  { label: '200 KB', value: '200' },
  { label: '500 KB', value: '500' },
  { label: '1 MB', value: '1024' },
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function CompressWorkspace() {
  const { activeTool, uploadedFile, processedImage, isProcessing, reset, setIsProcessing, setProcessedImage, setProgress } = useAppStore();
  const [targetSize, setTargetSize] = useState('100');
  const [result, setResult] = useState<CompressionResult | null>(null);

  useEffect(() => {
    const toolId = activeTool?.id || '';
    const sizeMatch = toolId.match(/(\d+)kb/);
    if (sizeMatch) {
      setTargetSize(sizeMatch[1]);
    }
  }, [activeTool]);

  const handleProcess = useCallback(async () => {
    if (!uploadedFile) {
      toast.error('Please upload an image first');
      return;
    }

    if (!targetSize || Number.parseInt(targetSize, 10) <= 0) {
      toast.error('Please enter a valid target size');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    const isIncrease = activeTool?.id === 'increase-image-size';
    const formData = new FormData();
    formData.append('image', uploadedFile);
    formData.append('targetSize', targetSize);
    if (isIncrease) {
      formData.append('sizeMode', 'increase');
    }

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 8, 90));
      }, 150);

      const response = await fetch('/api/image/process', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        let message = 'Processing failed';
        try {
          const errorJson = await response.json();
          message = errorJson?.error || message;
        } catch {
          // Keep default message.
        }
        throw new Error(message);
      }

      const data = await response.json();
      const deltaPercent = Math.round(((data.processedSize - data.originalSize) / Math.max(1, data.originalSize)) * 100);
      const savedPercent = Math.max(0, Math.round((1 - data.processedSize / data.originalSize) * 100));
      const nextResult: CompressionResult = {
        imageUrl: data.imageUrl,
        originalSize: data.originalSize,
        processedSize: data.processedSize,
        savedPercent: isIncrease ? Math.max(0, deltaPercent) : savedPercent,
        format: data.format,
      };

      setResult(nextResult);
      setProcessedImage(data.imageUrl);
      toast.success(
        isIncrease
          ? `Increased file size to ${formatSize(data.processedSize)} (target ${targetSize} KB).`
          : `Compressed successfully. Saved ${savedPercent}% file size.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to compress image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [activeTool?.id, setIsProcessing, setProcessedImage, setProgress, targetSize, uploadedFile]);

  const handleDownload = useCallback(() => {
    if (!processedImage || !uploadedFile || !result) return;

    const link = document.createElement('a');
    const originalName = uploadedFile.name;
    const baseName = originalName.includes('.') ? originalName.substring(0, originalName.lastIndexOf('.')) : originalName;
    const extension = result.format || 'jpg';
    link.href = processedImage;
    const suffix = activeTool?.id === 'increase-image-size' ? 'increased' : 'compressed';
    link.download = `${baseName}-${suffix}.${extension}`;
    link.click();
  }, [activeTool?.id, processedImage, result, uploadedFile]);

  const handleReset = useCallback(() => {
    reset();
    setResult(null);
  }, [reset]);

  if (!activeTool) return null;

  const isIncrease = activeTool.id === 'increase-image-size';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto max-w-5xl px-4 py-8 lg:px-8 md:py-12">
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        icon={Minimize2}
        onReset={handleReset}
      />

      <div className="space-y-6">
        <FileUpload accept="image/*" />
        <ToolLimitNotice limits={['Images only', 'Custom target size from 5 KB upward', isIncrease ? 'Pads/encodes image to meet minimum KB requirements' : 'Exact result depends on source image complexity']} />

        {uploadedFile && !result ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-[1.75rem] border border-border/60 bg-card/75 p-6 shadow-premium backdrop-blur-xl">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Choose your target size</h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {isIncrease
                      ? 'Increase the file to meet a minimum upload requirement (for example form portals that demand 50–200 KB).'
                      : 'Aim for an upload requirement or a practical sharing size. Lower targets usually require more aggressive quality reduction.'}
                  </p>
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-border/60 bg-background/75 p-4">
                <div className="flex flex-col items-center justify-center gap-3 text-center sm:flex-row">
                  <span className="text-sm font-bold uppercase tracking-[0.16em] text-muted-foreground">Target size</span>
                  <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-3 py-2 shadow-soft">
                    <Input
                      id="targetSize"
                      type="number"
                      min="5"
                      max="50000"
                      value={targetSize}
                      onChange={(event) => setTargetSize(event.target.value)}
                      className="h-9 w-24 border-none bg-transparent px-0 text-center text-lg font-bold shadow-none"
                    />
                    <span className="text-sm font-bold text-primary">KB</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setTargetSize(preset.value)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] transition-all ${targetSize === preset.value
                        ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                        : 'border-border/60 bg-background/80 text-muted-foreground hover:border-primary/30 hover:text-primary'
                        }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-border/60 bg-card/75 p-6 shadow-premium backdrop-blur-xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                {isIncrease ? 'Increase summary' : 'Compression summary'}
              </p>
              <h3 className="mt-2 text-xl font-bold text-foreground">Target: {targetSize} KB</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {isIncrease
                  ? 'Best for portals and forms that reject files under a minimum size.'
                  : 'Great for portals, forms, messaging apps, or faster delivery on slow connections.'}
              </p>

              <Button className="btn-premium mt-6 h-12 w-full rounded-2xl text-sm font-bold" onClick={handleProcess} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="mr-2 h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                    />
                    {isIncrease ? 'Increasing size...' : 'Compressing...'}
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    {isIncrease ? 'Increase image size' : 'Compress image'}
                  </>
                )}
              </Button>

              <Button variant="outline" className="mt-3 h-11 w-full rounded-2xl" onClick={handleReset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Start over
              </Button>
            </div>
          </div>
        ) : null}

        <AnimatePresence>
          {result && processedImage && uploadedFile ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300">
                  Saved {result.savedPercent}%
                </Badge>
                <Badge variant="secondary" className="rounded-full px-4 py-2 text-sm font-semibold">
                  {formatSize(result.originalSize)}
                  <ArrowRight className="mx-2 inline h-3.5 w-3.5" />
                  {formatSize(result.processedSize)}
                </Badge>
              </div>

              <ResultCard
                title="Image compression complete"
                description="Your optimized image is ready for upload, email, and faster page delivery."
                onDownload={handleDownload}
                downloadLabel="Download compressed image"
                primaryMeta={`${uploadedFile.name} - ${formatSize(result.originalSize)} to ${formatSize(result.processedSize)}`}
                nextActions={[
                  { label: 'Resize image', href: '/tools/resize-image' },
                  { label: 'Convert format', href: '/tools/png-to-jpeg' },
                ]}
              />

              <Button variant="outline" onClick={handleReset} className="h-11 rounded-2xl px-5 font-medium">
                <RefreshCw className="mr-2 h-4 w-4" />
                Compress another image
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
