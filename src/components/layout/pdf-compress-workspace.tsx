'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, FileText, Minimize2, RefreshCw, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ResultCard } from './result-card';
import { ToolLimitNotice } from './tool-limit-notice';
import { ToolPageHeader } from './tool-page-header';

type CompressionLevel = 'extreme' | 'recommended' | 'less';

interface CompressionResult {
  pdfUrl: string;
  level: CompressionLevel;
  originalSize: number;
  processedSize: number;
  savedPercent: number;
}

const compressionLevels: Array<{
  value: CompressionLevel;
  title: string;
  description: string;
}> = [
  {
    value: 'recommended',
    title: 'Recommended',
    description: 'Balanced reduction for everyday sharing and uploads.',
  },
  {
    value: 'less',
    title: 'High quality',
    description: 'Lighter compression when visual fidelity matters most.',
  },
  {
    value: 'extreme',
    title: 'Smallest size',
    description: 'Maximum reduction for strict upload limits.',
  },
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function CompressPDFWorkspace() {
  const { activeTool, uploadedFile, isProcessing, progress, reset, setIsProcessing, setProgress } = useAppStore();
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [statusLabel, setStatusLabel] = useState<'Idle' | 'Uploading' | 'Processing' | 'Finalizing'>('Idle');
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('recommended');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const activeLevel = useMemo(
    () => compressionLevels.find((level) => level.value === compressionLevel) ?? compressionLevels[0],
    [compressionLevel],
  );

  useEffect(() => {
    return () => {
      if (result?.pdfUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(result.pdfUrl);
      }
    };
  }, [result]);

  const handleProcess = useCallback(async () => {
    if (!uploadedFile) {
      toast.error('Please upload a PDF first');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setStatusLabel('Uploading');
    setProgress(0);

    const formData = new FormData();
    formData.append('file', uploadedFile);
    formData.append('level', compressionLevel);

    try {
      const progressInterval = setInterval(() => {
        setStatusLabel('Processing');
        setProgress((prev) => Math.min(prev + 8, 90));
      }, 150);

      const response = await fetch('/api/pdf/compress', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setStatusLabel('Finalizing');
      setProgress(100);

      if (!response.ok) {
        let message = 'Processing failed';
        try {
          const errorText = await response.text();
          try {
            const errorJson = JSON.parse(errorText);
            message = errorJson?.error || message;
          } catch {
            message = errorText || message;
          }
        } catch {
          // Keep default message.
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const pdfUrl = URL.createObjectURL(blob);
      const originalSize = Number(response.headers.get('x-size-before') || uploadedFile.size);
      const processedSize = Number(response.headers.get('x-size-after') || blob.size);
      const savedPercent = Math.max(0, Math.round((1 - processedSize / originalSize) * 1000) / 10);
      setResult({
        pdfUrl,
        level: compressionLevel,
        originalSize,
        processedSize,
        savedPercent,
      });
      setErrorMessage(null);
      toast.success(`PDF compressed by ${savedPercent}% (${formatSize(originalSize)} to ${formatSize(processedSize)}).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to compress PDF. Please try again.';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
      setStatusLabel('Idle');
    }
  }, [compressionLevel, setIsProcessing, setProgress, uploadedFile]);

  const handleDownload = useCallback(() => {
    if (!result || !uploadedFile) return;

    const link = document.createElement('a');
    const originalName = uploadedFile.name;
    const baseName = originalName.includes('.') ? originalName.substring(0, originalName.lastIndexOf('.')) : originalName;
    link.href = result.pdfUrl;
    link.download = `${baseName}-compressed.pdf`;
    link.click();
  }, [result, uploadedFile]);

  const handleReset = useCallback(() => {
    if (result?.pdfUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(result.pdfUrl);
    }
    reset();
    setResult(null);
    setErrorMessage(null);
    setCompressionLevel('recommended');
  }, [reset, result]);

  if (!activeTool) return null;

  return (
    <div aria-busy={isProcessing} className="container mx-auto max-w-5xl px-4 py-8 lg:px-8 md:py-12">
      <ToolPageHeader
        title="Compress PDF"
        description="Reduce PDF size with a cleaner preset-driven workflow optimized for faster uploads and sharing."
        icon={<Minimize2 className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />

      <div className="space-y-6">
        <FileUpload accept=".pdf" />
        <ToolLimitNotice limits={['PDF only', 'Max file size: 25 MB', 'Best results on image-heavy or scanned PDFs with a real compression engine']} />

        {uploadedFile && !result ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-[1.75rem] border border-border/60 bg-card/75 p-6 shadow-premium backdrop-blur-xl">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Choose your compression preset</h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Pick the output profile based on whether you care more about visual quality or file size.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {compressionLevels.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setCompressionLevel(level.value)}
                    className={`rounded-[1.35rem] border p-4 text-left transition-colors ${compressionLevel === level.value
                      ? 'border-primary/30 bg-primary/6 shadow-soft'
                      : 'border-border/60 bg-background/75 hover:border-primary/25 hover:bg-background'
                      }`}
                  >
                    <p className="text-sm font-bold text-foreground">{level.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{level.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-border/60 bg-card/75 p-6 shadow-premium backdrop-blur-xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Current selection</p>
              <h3 className="mt-2 text-xl font-bold text-foreground">{activeLevel.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{activeLevel.description}</p>

              <Button
                className="btn-premium mt-6 h-12 w-full rounded-2xl text-sm font-bold"
                onClick={handleProcess}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <motion.div
                      animate={prefersReducedMotion ? undefined : { rotate: 360 }}
                      transition={prefersReducedMotion ? undefined : { duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="mr-2 h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                    />
                    {statusLabel} - {Math.round(progress)}%
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Compress PDF
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

        {errorMessage && !result ? (
          <div className="rounded-[1.5rem] border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-900 shadow-soft dark:text-amber-100">
            <p className="font-semibold">Compression could not complete</p>
            <p className="mt-1 leading-6">{errorMessage}</p>
          </div>
        ) : null}

        {result && uploadedFile ? (
          <div className="space-y-4 pt-2">
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
              title="PDF compression complete"
              description="Your PDF is ready for faster sharing, uploads, and document workflows."
              onDownload={handleDownload}
              downloadLabel="Download compressed PDF"
              primaryMeta={`${uploadedFile.name} - ${compressionLevels.find((level) => level.value === result.level)?.title} preset - ${formatSize(result.originalSize)} to ${formatSize(result.processedSize)}`}
              nextActions={[
                { label: 'Merge PDF', href: '/tools/merge-pdf' },
                { label: 'Split PDF', href: '/tools/split-pdf' },
              ]}
            />
            <Button variant="outline" onClick={handleReset} className="h-11 rounded-2xl px-5 font-medium">
              <RefreshCw className="mr-2 h-4 w-4" />
              Compress another PDF
            </Button>
          </div>
        ) : null}
      </div>

      {uploadedFile && !result ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur md:hidden">
          <Button className="btn-premium h-11 w-full" onClick={handleProcess} disabled={isProcessing}>
            {isProcessing ? `${statusLabel} - ${Math.round(progress)}%` : `Compress PDF (${activeLevel.title})`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}