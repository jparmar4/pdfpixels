'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Download, Minimize2, Sparkles, ArrowRight, RefreshCw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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

export function CompressWorkspace() {
  const { activeTool, uploadedFile, processedImage, isProcessing, reset, setIsProcessing, setProcessedImage, setProgress } = useAppStore();

  const [targetSize, setTargetSize] = useState<string>('100');
  const [result, setResult] = useState<CompressionResult | null>(null);

  // Get preset size from tool ID if matching
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

    if (!targetSize || parseInt(targetSize) <= 0) {
      toast.error('Please enter a valid target size');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('image', uploadedFile);
    formData.append('targetSize', targetSize);

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
        throw new Error('Processing failed');
      }

      const data = await response.json();

      const savedPercent = Math.round((1 - data.processedSize / data.originalSize) * 100);
      const newResult: CompressionResult = {
        imageUrl: data.imageUrl,
        originalSize: data.originalSize,
        processedSize: data.processedSize,
        savedPercent: savedPercent,
        format: data.format,
      };

      setResult(newResult);
      setProcessedImage(data.imageUrl);

      toast.success(`Compressed! Saved ${savedPercent}% file size.`);
    } catch {
      toast.error('Failed to compress image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedFile, targetSize, setIsProcessing, setProcessedImage, setProgress]);

  const handleDownload = useCallback(() => {
    if (processedImage && uploadedFile && result) {
      const link = document.createElement('a');
      link.href = processedImage;
      const originalName = uploadedFile.name;
      const baseName = originalName.includes('.') ? originalName.substring(0, originalName.lastIndexOf('.')) : originalName;
      const extension = result.format || 'jpg';
      link.download = `${baseName}-compressed.${extension}`;
      link.click();
    }
  }, [processedImage, uploadedFile, result]);

  const handleReset = useCallback(() => {
    reset();
    window.history.pushState({}, '', window.location.pathname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setResult(null);
  }, [reset]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (!activeTool) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 lg:px-8 py-8 md:py-12 max-w-4xl"
    >
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        icon={Minimize2}
        onReset={handleReset}
      />

      {/* Main Content */}
      <div className="space-y-6">
        <FileUpload accept={activeTool?.id.includes('pdf') ? '.pdf' : 'image/*'} />

        {/* Action Row — shown when file is uploaded */}
        {uploadedFile && !result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="flex flex-col items-center gap-5 mt-8 mb-2 max-w-2xl mx-auto"
          >
            {/* Target size pill */}
            <div className="w-full bg-card/60 backdrop-blur-xl border border-border/60 shadow-xl shadow-primary/5 rounded-2xl p-4 space-y-4">
              {/* KB Input row */}
              <div className="flex items-center justify-center gap-3">
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Target Size</span>
                <div className="flex items-center gap-1.5 bg-background/70 border border-border/60 rounded-xl px-3 py-1.5 shadow-inner">
                  <Input
                    id="targetSize"
                    type="number"
                    min="5"
                    max="50000"
                    value={targetSize}
                    onChange={(e) => setTargetSize(e.target.value)}
                    className="h-9 w-20 text-center text-lg font-mono font-bold bg-transparent border-none px-0 shadow-none text-foreground"
                  />
                  <span className="text-sm font-bold text-primary">KB</span>
                </div>
              </div>

              {/* Preset chips */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setTargetSize(p.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 ${targetSize === p.value
                        ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25 scale-105'
                        : 'bg-background/50 text-muted-foreground border-border/60 hover:border-primary/50 hover:text-primary hover:bg-primary/5'
                      }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Compress button */}
            <Button
              className="btn-premium h-14 px-12 rounded-2xl font-bold text-base shadow-lg shadow-violet-500/25 transition-all group w-full max-w-xs"
              onClick={handleProcess}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                />
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Compress Image
                </>
              )}
            </Button>

            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary animate-pulse-soft" />
              Smart compression targets your exact KB size
            </p>
          </motion.div>
        )}

        {/* Result */}
        <AnimatePresence>
          {result && processedImage && uploadedFile && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 pt-2"
            >
              {/* Savings headline */}
              <div className="text-center space-y-1">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-500/10 border border-green-500/25 text-green-600 dark:text-green-400 font-bold text-lg shadow-sm"
                >
                  <span>↓ {result.savedPercent}% smaller</span>
                  <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/25 text-sm py-0.5">
                    Saved {formatSize(result.originalSize - result.processedSize)}
                  </Badge>
                </motion.div>
                <p className="text-sm text-muted-foreground font-medium flex items-center justify-center gap-2 pt-1">
                  <span className="font-semibold text-foreground">{formatSize(result.originalSize)}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-primary" />
                  <span className="font-semibold text-primary">{formatSize(result.processedSize)}</span>
                </p>
              </div>

              {/* Before / After preview */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Before */}
                <div className="rounded-2xl border border-border bg-card/60 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border/60 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Before</span>
                    <span className="text-xs font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">{formatSize(result.originalSize)}</span>
                  </div>
                  <div className="p-3 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjBmMGYwIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMGYwZjAiLz48L3N2Zz4=')] dark:bg-zinc-900 flex items-center justify-center min-h-[200px]">
                    <img
                      src={URL.createObjectURL(uploadedFile)}
                      alt="Original"
                      className="max-w-full max-h-[220px] object-contain rounded-lg shadow-sm"
                    />
                  </div>
                </div>

                {/* After */}
                <div className="rounded-2xl border border-primary/30 bg-primary/5 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-primary/20 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary/80">After</span>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{formatSize(result.processedSize)}</span>
                  </div>
                  <div className="p-3 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjBmMGYwIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMGYwZjAiLz48L3N2Zz4=')] dark:bg-zinc-900 flex items-center justify-center min-h-[200px]">
                    <img
                      src={result.imageUrl}
                      alt="Compressed"
                      className="max-w-full max-h-[220px] object-contain rounded-lg shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Download + Reset row */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                <Button
                  onClick={handleDownload}
                  className="btn-premium w-full sm:w-auto gap-2 h-13 px-8 rounded-2xl font-bold text-base shadow-lg shadow-primary/25 flex-1"
                  size="lg"
                >
                  <Download className="w-5 h-5" />
                  Download Compressed Image
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleReset}
                  className="w-full sm:w-auto gap-2 h-13 px-6 rounded-2xl font-medium text-muted-foreground hover:text-foreground"
                  size="lg"
                >
                  <RefreshCw className="w-4 h-4" />
                  Compress Another
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
