'use client';

import { motion } from 'framer-motion';
import { Download, Presentation, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActiveTool } from '@/hooks/use-active-tool';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

export function PDFToPptxWorkspace() {
  const { uploadedFile, isProcessing, progress, setIsProcessing, setProgress, reset } = useActiveTool();
  const [result, setResult] = useState<{ url: string; name: string } | null>(null);

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
        const res = await fetchWithUploadProgress('/api/pdf/to-pptx', formData, setProgress);
        setProgress(90);

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Conversion failed' }));
          throw new Error(err.error || 'Failed to convert PDF to PowerPoint');
        }

        const blob = await res.blob();
        const disposition = res.headers.get('content-disposition') || '';
        const nameMatch = disposition.match(/filename="?([^";]+)"?/i);
        const url = URL.createObjectURL(blob);
        if (active) {
          setResult((previous) => {
            if (previous) URL.revokeObjectURL(previous.url);
            return { url, name: nameMatch?.[1] || `${uploadedFile.name.replace(/\.pdf$/i, '')}.pptx` };
          });
          setProgress(100);
          toast.success('Presentation ready — download it below');
        }
      } catch (err: any) {
        if (active) toast.error(err.message || 'Conversion failed');
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
        title="PDF to PowerPoint Converter"
        description="Convert every PDF page into a high-resolution slide in a .pptx presentation that opens in PowerPoint, Google Slides, and Keynote."
        icon={<Presentation className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'PDF only · max 50 MB · up to 300 slides per run',
          'One full-bleed 16:9 slide per page at high resolution',
          'Opens in PowerPoint, Google Slides, and Keynote',
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
                <p className="font-semibold text-sm">Rendering pages to slides…</p>
                <p className="text-xs text-muted-foreground mt-0.5">{Math.round(progress)}%</p>
              </div>
            </div>
          )}

          {result && !isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Presentation className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold">{result.name}</p>
                  <p className="text-sm text-muted-foreground">Each PDF page is one slide — add your own text on top.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleDownload} className="gap-2 btn-premium rounded-xl">
                  <Download className="w-4 h-4" /> Download .PPTX
                </Button>
                <Button size="sm" variant="ghost" onClick={handleReset} className="text-xs text-muted-foreground">
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Start Over
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
