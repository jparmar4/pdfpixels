'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Download, RotateCcw, Merge, FileText, Plus, ChevronDown, ChevronUp, Trash2, GripVertical, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { ToolPageHeader } from './tool-page-header';
import { useState, useCallback, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { ToolLimitNotice } from './tool-limit-notice';
import { ResultCard } from './result-card';

interface PDFFile {
  file: File;
  name: string;
  size: number;
  pageCount?: number;
}

export function PDFMergeWorkspace() {
  const { activeTool, isProcessing, progress, setIsProcessing, setProgress, reset } = useAppStore();

  const [files, setFiles] = useState<PDFFile[]>([]);
  const [result, setResult] = useState<{ pdfUrl: string; fileName: string; pageCount: number } | null>(null);
  const [statusLabel, setStatusLabel] = useState<'Idle' | 'Uploading' | 'Processing' | 'Finalizing'>('Idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const newFiles: PDFFile[] = Array.from(selectedFiles)
        .filter(f => f.name.toLowerCase().endsWith('.pdf'))
        .map(f => ({
          file: f,
          name: f.name,
          size: f.size,
        }));

      setFiles(prev => [...prev, ...newFiles]);
      toast.success(`Added ${newFiles.length} PDF file(s)`);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    const newFiles: PDFFile[] = Array.from(droppedFiles)
      .filter(f => f.name.toLowerCase().endsWith('.pdf'))
      .map(f => ({
        file: f,
        name: f.name,
        size: f.size,
      }));

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      toast.success(`Added ${newFiles.length} PDF file(s)`);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const moveFile = useCallback((index: number, direction: 'up' | 'down') => {
    setFiles(prev => {
      const newFiles = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= newFiles.length) return prev;
      [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
      return newFiles;
    });
  }, []);

  const handleProcess = useCallback(async () => {
    if (files.length < 2) {
      toast.error('Please add at least 2 PDF files to merge');
      return;
    }

    setIsProcessing(true);
    setStatusLabel('Uploading');
    setProgress(0);

    const formData = new FormData();
    files.forEach((f) => {
      formData.append('files', f.file);
    });

    try {
      const progressInterval = setInterval(() => {
        setStatusLabel('Processing');
        setProgress((prev) => Math.min(prev + 8, 90));
      }, 150);

      const response = await fetch('/api/pdf/merge', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setStatusLabel('Finalizing');
      setProgress(100);

      if (!response.ok) {
        let message = 'Processing failed';
        try {
          const err = await response.json();
          message = err?.error || message;
        } catch {}
        throw new Error(message);
      }

      const blob = await response.blob();
      const pdfUrl = URL.createObjectURL(blob);
      const disposition = response.headers.get('content-disposition') || '';
      const fileNameMatch = disposition.match(/filename=\"?([^\";]+)\"?/i);
      const fileName = fileNameMatch?.[1] || `merged-${Date.now()}.pdf`;

      const pageCount = Number(response.headers.get('x-page-count') || 0);

      setResult({
        pdfUrl,
        fileName,
        pageCount,
      });
      toast.success(`Merged ${files.length} PDFs into ${pageCount || 'multiple'} pages!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to merge PDFs. Please try again.');
    } finally {
      setIsProcessing(false);
      setStatusLabel('Idle');
    }
  }, [files, setIsProcessing, setProgress]);

  const handleDownload = useCallback(() => {
    if (result) {
      const link = document.createElement('a');
      link.href = result.pdfUrl;
      link.download = result.fileName;
      link.click();
    }
  }, [result]);

  const handleReset = useCallback(() => {
    if (result?.pdfUrl) {
      URL.revokeObjectURL(result.pdfUrl);
    }
    reset();
    window.history.pushState({}, '', window.location.pathname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setFiles([]);
    setResult(null);
  }, [reset, result]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (!activeTool) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      aria-busy={isProcessing}
      className="container mx-auto px-4 lg:px-8 py-8"
    >
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        icon={Merge}
        onReset={handleReset}
      >
        {result && (
          <Button onClick={handleDownload} className="gap-2 btn-premium rounded-xl">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        )}
      </ToolPageHeader>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Panel - Upload & File List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Drop Zone */}
          <motion.div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            aria-label="Add PDF files"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className="drop-zone relative flex flex-col items-center justify-center p-8 rounded-2xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-primary" />
            </div>

            <p className="text-lg font-semibold">Add PDF files</p>
            <p className="text-sm text-muted-foreground mt-1">
              Drag, drop, or click to choose files in merge order
            </p>

            <Badge variant="secondary" className="mt-3">PDF Only</Badge>
          </motion.div>

          <ToolLimitNotice limits={['PDF only', '2–20 files per merge', 'Max 25MB per file', 'Max 100MB total']} />

          {/* File List */}
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden shadow-lg"
            >
              <div className="p-4 border-b border-border">
                <h3 className="font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Files to Merge ({files.length})
                </h3>
              </div>

              <div className="divide-y divide-border">
                {files.map((file, index) => (
                  <motion.div
                    key={`${file.name}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="text-muted-foreground cursor-grab">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-red-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                    </div>

                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveFile(index, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveFile(index, 'down')}
                        disabled={index === files.length - 1}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeFile(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ResultCard
                  title="PDF Merged Successfully"
                  description="Your files have been combined in the selected order."
                  primaryMeta={`${result.pageCount} page${result.pageCount === 1 ? '' : 's'}`}
                  onDownload={handleDownload}
                  downloadLabel="Download Merged PDF"
                  nextActions={[
                    { label: 'Compress PDF', href: '/tools/compress-pdf' },
                    { label: 'Reorder Pages', href: '/tools/reorder-pdf-pages' },
                  ]}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Panel - Settings */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden shadow-premium">
            <div className="p-5 border-b border-border/40 bg-gradient-to-r from-primary/10 to-transparent">
              <h3 className="font-bold flex items-center gap-2.5 tracking-tight text-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                Merge Settings
              </h3>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Total Files</span>
                  <span className="text-lg font-bold text-primary">{files.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Size</span>
                  <span className="text-sm text-muted-foreground">
                    {formatSize(files.reduce((acc, f) => acc + f.size, 0))}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Reorder files before merging. The final PDF follows the exact order shown above.
              </p>

              {/* Action Buttons */}
              <div className="pt-4 space-y-3">
                <Button
                  className="w-full btn-premium py-6 rounded-xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all"
                  onClick={handleProcess}
                  disabled={files.length < 2 || isProcessing}
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <motion.div
                        animate={prefersReducedMotion ? undefined : { rotate: 360 }}
                        transition={prefersReducedMotion ? undefined : { duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full mr-3"
                      />
                      {statusLabel}...
                    </>
                  ) : (
                    <>
                      <Merge className="w-5 h-5 mr-3" />
                      Merge {files.length} PDFs
                    </>
                  )}
                </Button>
                {isProcessing && (
                  <p className="text-xs text-muted-foreground" role="status" aria-live="polite">{statusLabel} • {Math.round(progress)}%</p>
                )}

                <Button
                  variant="outline"
                  className="w-full gap-2 rounded-xl py-6 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-colors bg-background/50"
                  onClick={handleReset}
                >
                  <RotateCcw className="w-4 h-4" />
                  Start Over
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 to-transparent p-5 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              How to Use
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Add two or more PDF files</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Drag to reorder the files</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Click Merge to combine</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Download your merged PDF</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {files.length >= 2 && !result && (
        <div className="fixed bottom-0 inset-x-0 z-40 p-3 bg-background/95 backdrop-blur border-t border-border md:hidden">
          <Button
            className="w-full btn-premium h-11"
            onClick={handleProcess}
            disabled={isProcessing}
          >
            {isProcessing ? `${statusLabel} • ${Math.round(progress)}%` : `Merge ${files.length} PDFs`}
          </Button>
        </div>
      )}
    </motion.div >
  );
}
