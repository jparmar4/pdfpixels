'use client';

import { motion } from 'framer-motion';
import {
  RotateCcw, Presentation, Check, Sparkles, FileCheck, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { ToolResultBar } from './tool-result-bar';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const ACCEPT = '.pptx,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint';

function presentationKind(name: string): 'pptx' | 'ppt' | null {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pptx')) return 'pptx';
  if (lower.endsWith('.ppt')) return 'ppt';
  return null;
}

export function PowerPointToPDFWorkspace() {
  const { uploadedFile, isProcessing, progress, setIsProcessing, setProgress, reset } = useAppStore();

  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFileName, setResultFileName] = useState<string>('');
  const [convertError, setConvertError] = useState<string | null>(null);
  const [engineNote, setEngineNote] = useState<string | null>(null);

  useEffect(() => {
    if (!uploadedFile) {
      setResultUrl(null);
      return;
    }
    if (!presentationKind(uploadedFile.name)) {
      toast.error('Please upload a PowerPoint (.pptx or .ppt) presentation');
      reset();
      return;
    }
    toast.success('Presentation loaded');
  }, [uploadedFile, reset]);

  const handleReset = useCallback(() => {
    if (resultUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(resultUrl);
    }
    reset();
    setResultUrl(null);
  }, [reset, resultUrl]);

  const handleConvert = async () => {
    if (!uploadedFile) {
      toast.error('Please upload a presentation');
      return;
    }

    setIsProcessing(true);
    setConvertError(null);
    setEngineNote(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const { fetchWithUploadProgress } = await import('@/lib/upload-with-progress');
      const res = await fetchWithUploadProgress('/api/pdf/from-powerpoint', formData, (percent) => {
        setProgress(percent);
      });

      setProgress(90);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Conversion failed' }));
        throw new Error(err.error || 'Failed to convert PowerPoint to PDF');
      }

      const convertEngine = res.headers.get('x-convert-engine');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultFileName(uploadedFile.name.replace(/\.pptx?$/i, '') + '.pdf');
      setProgress(100);
      if (convertEngine === 'libreoffice') {
        toast.success('Presentation converted with layout preservation!');
      } else {
        toast.success('Presentation converted to PDF.');
      }
    } catch (err: any) {
      const message = err.message || 'Conversion failed';
      setConvertError(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = resultFileName || 'converted-presentation.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success('Download started');
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
      <ToolPageHeader
        title="PowerPoint to PDF Converter Online Free"
        description="Convert PowerPoint presentations (.pptx, .ppt) into shareable PDF documents — one slide per page with layout and formatting preserved."
        icon={<Presentation className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'PowerPoint (.pptx, .ppt) · max 25 MB',
          'One slide per page — animations export in their final state',
          'Files are deleted after processing — nothing is stored',
        ]}
      />

      {!uploadedFile ? (
        <div className="mt-8">
          <FileUpload accept={ACCEPT} maxSizeMb={25} />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <div className="grid md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-7 bg-card border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-semibold text-lg">{uploadedFile.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(uploadedFile.size / 1024).toFixed(1)} KB · Presentation
                  </p>
                </div>
                <Badge variant="default" className="font-mono text-xs">
                  Ready to Convert
                </Badge>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-muted/40 border space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-primary">
                    <FileCheck className="w-4 h-4" /> Share-Ready PDF Slides
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Every slide becomes a standard PDF page — no font substitution, no slide shifting, identical appearance on every device.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <ToolResultBar error={convertError} />
                <Button
                  type="button"
                  disabled={isProcessing}
                  size="lg"
                  className="w-full rounded-xl font-semibold gap-2"
                  onClick={handleConvert}
                >
                  <Presentation className="w-5 h-5" /> {isProcessing ? `Converting… ${Math.round(progress)}%` : 'Convert to PDF'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  onClick={handleReset}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Upload Different Presentation
                </Button>
              </div>
            </div>

            <div className="md:col-span-5 space-y-6">
              {resultUrl ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center space-y-4"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-base">Conversion Completed!</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your presentation is now a shareable PDF.
                    </p>
                  </div>
                  {engineNote ? (
                    <p className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-left text-xs leading-5 text-amber-900 dark:text-amber-100">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      {engineNote}
                    </p>
                  ) : null}
                  <ToolResultBar
                    downloadUrl={resultUrl}
                    downloadName={resultFileName || 'converted-presentation.pdf'}
                    summary="Your PDF document is ready."
                    onDownload={handleDownload}
                  />
                </motion.div>
              ) : (
                <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Sparkles className="w-4 h-4 text-primary" /> Why Convert to PDF?
                  </div>
                  <ul className="space-y-2 text-muted-foreground list-disc pl-4 leading-relaxed">
                    <li><strong className="text-foreground">No PowerPoint Needed:</strong> Clients and students can view slides anywhere.</li>
                    <li><strong className="text-foreground">Fixed Appearance:</strong> Fonts and layouts are locked — no more broken decks on other machines.</li>
                    <li><strong className="text-foreground">Print-Friendly:</strong> Standard PDF pages print cleanly as handouts.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
