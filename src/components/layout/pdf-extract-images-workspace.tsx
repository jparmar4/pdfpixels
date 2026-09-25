'use client';

import { motion } from 'framer-motion';
import { Download, FileArchive, Images, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActiveTool } from '@/hooks/use-active-tool';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export function PDFExtractImagesWorkspace() {
  const { uploadedFile, isProcessing, progress, setIsProcessing, setProgress, reset } = useActiveTool();
  const [result, setResult] = useState<{ url: string; name: string; images: number; skipped: number } | null>(null);

  useEffect(() => {
    return () => {
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  useEffect(() => {
    if (!uploadedFile) {
      setResult(null);
      return;
    }

    let active = true;
    (async () => {
      setIsProcessing(true);
      setProgress(0);
      try {
        const formData = new FormData();
        formData.append('file', uploadedFile);

        const { fetchWithUploadProgress } = await import('@/lib/upload-with-progress');
        const res = await fetchWithUploadProgress('/api/pdf/extract-images', formData, setProgress);
        setProgress(90);

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Extraction failed' }));
          throw new Error(err.error || 'Failed to extract images');
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const images = Number(res.headers.get('x-images-extracted') || 0);
        const skipped = Number(res.headers.get('x-images-skipped') || 0);
        if (active) {
          setResult((previous) => {
            if (previous) URL.revokeObjectURL(previous.url);
            return { url, name: `${uploadedFile.name.replace(/\.pdf$/i, '')}-images.zip`, images, skipped };
          });
          setProgress(100);
          toast.success(`Extracted ${images} image${images === 1 ? '' : 's'}${skipped > 0 ? ` · ${skipped} skipped (unsupported format)` : ''}`);
        }
      } catch (err: any) {
        if (active) toast.error(err.message || 'Extraction failed');
      } finally {
        if (active) setIsProcessing(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [uploadedFile, setIsProcessing, setProgress]);

  const handleReset = useCallback(() => {
    reset();
    setResult(null);
  }, [reset]);

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.url;
    link.download = result.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Download started');
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
      <ToolPageHeader
        title="Extract Images from PDF"
        description="Pull the original embedded images out of any PDF at full stored quality — returned as one ZIP, not page screenshots."
        icon={<Images className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'PDF only · max 50 MB · up to 200 images per run',
          'Returns stored image bytes — no re-compression',
          'JPEG and flate bitmaps extracted; exotic codecs are skipped',
        ]}
      />

      {!uploadedFile ? (
        <div className="mt-8">
          <FileUpload accept=".pdf,application/pdf" />
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {isProcessing && (
            <div className="rounded-2xl border border-border bg-card p-6 flex items-center gap-4">
              <motion.div
                className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <div>
                <p className="font-semibold text-sm">Walking the document for embedded images…</p>
                <p className="text-xs text-muted-foreground mt-0.5">{Math.round(progress)}%</p>
              </div>
            </div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <FileArchive className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{result.name}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="font-mono text-xs">{result.images} images</Badge>
                      {result.skipped > 0 && (
                        <Badge variant="secondary" className="font-mono text-xs">{result.skipped} skipped</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleDownload} className="gap-2 btn-premium rounded-xl">
                    <Download className="w-4 h-4" /> Download ZIP
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleReset} className="text-xs text-muted-foreground">
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Start Over
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Images are numbered in document order. Pages often reuse the same image (headers, backgrounds) — it is stored once and extracted once.
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
