'use client';

import { motion } from 'framer-motion';
import {
  RotateCcw, FileText, Check, Sparkles, FileCheck, AlertTriangle
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

export function WordToPDFWorkspace() {
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
    if (!uploadedFile.name.toLowerCase().endsWith('.docx')) {
      toast.error('Please upload a Microsoft Word (.docx) document');
      reset();
      return;
    }
    toast.success('Word document loaded');
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
      toast.error('Please upload a Word document');
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
      const res = await fetchWithUploadProgress('/api/pdf/from-word', formData, (percent) => {
        setProgress(percent);
      });

      setProgress(90);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Conversion failed' }));
        throw new Error(err.error || 'Failed to convert Word to PDF');
      }

      const convertEngine = res.headers.get('x-convert-engine');
      const convertNote = res.headers.get('x-convert-note');
      if (convertEngine === 'text-layout') {
        setEngineNote(convertNote || 'LibreOffice was unavailable. Images, tables, and complex layouts were not preserved.');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultFileName(uploadedFile.name.replace(/\.docx$/i, '.pdf'));
      setProgress(100);
      if (convertEngine === 'libreoffice') {
        toast.success('Word document converted with full layout preservation!');
      } else {
        toast.success('Word document converted to PDF (text layout).');
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
    a.download = resultFileName || 'converted-document.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success('Download started');
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
      <ToolPageHeader
        title="Word to PDF Converter Online Free"
        description="Convert Microsoft Word documents (.docx) into standard, clean, read-only PDF files. Preserves headings, paragraph spacing, and text typography."
        icon={<FileText className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'Microsoft Word (.docx) · max 25 MB',
          'Text conversion: headings and paragraphs; images and complex layouts are not retained',
          'Instant client-safe conversion and automatic file cleanup',
        ]}
      />

      {!uploadedFile ? (
        <div className="mt-8">
          <FileUpload
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <div className="grid md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-7 bg-card border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-semibold text-lg">{uploadedFile.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(uploadedFile.size / 1024).toFixed(1)} KB · Microsoft Word (.docx)
                  </p>
                </div>
                <Badge variant="default" className="font-mono text-xs">
                  Ready to Convert
                </Badge>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-muted/40 border space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-primary">
                    <FileCheck className="w-4 h-4" /> Professional PDF Output
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Converts DOCX headings, body paragraphs, and bold typography into standard vector PDF pages. The resulting PDF locks document formatting across mobile devices, Macs, and PCs.
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
                  <FileText className="w-5 h-5" /> {isProcessing ? `Converting… ${Math.round(progress)}%` : 'Convert to PDF'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  onClick={handleReset}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Upload Different Word File
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
                      Your Word document is now a standard PDF file.
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
                    downloadName={resultFileName || 'converted-document.pdf'}
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
                    <li><strong className="text-foreground">Universal Compatibility:</strong> Anyone can open and view a PDF without needing Microsoft Office installed.</li>
                    <li><strong className="text-foreground">Preserved Formatting:</strong> Uses a standard font and a new page layout. Export from Word when exact layout, tables, images, or multilingual fonts must be preserved.</li>
                    <li><strong className="text-foreground">Read-Only Security:</strong> Perfect for sending resumes, contracts, and proposals that should not be edited.</li>
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
