'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Download, RotateCcw, Split, FileText, Scissors, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/app-store';
import { ToolPageHeader } from './tool-page-header';
import { useState, useCallback, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { ToolLimitNotice } from './tool-limit-notice';
import { ResultCard } from './result-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PDFInfo {
  name: string;
  size: number;
  pageCount: number;
}

interface SplitResult {
  mode: string;
  totalPages: number;
  pages?: Array<{
    pageNumber: number;
    pdfUrl: string;
    fileName: string;
  }>;
  pdfUrl?: string;
  fileName?: string;
  extractedPages?: number[];
  truncated?: boolean;
}

export function PDFSplitWorkspace() {
  const { activeTool, isProcessing, progress, setIsProcessing, setProgress, reset } = useAppStore();

  const [file, setFile] = useState<File | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PDFInfo | null>(null);
  const [result, setResult] = useState<SplitResult | null>(null);
  const [mode, setMode] = useState<'all' | 'range' | 'single'>('all');
  const [pageRange, setPageRange] = useState('');
  const [singlePage, setSinglePage] = useState('1');
  const [statusLabel, setStatusLabel] = useState<'Idle' | 'Uploading' | 'Processing' | 'Finalizing'>('Idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const loadPdfMeta = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    setPdfInfo({
      name: selectedFile.name,
      size: selectedFile.size,
      pageCount: 0,
    });
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bytes = await selectedFile.arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pageCount = pdf.getPageCount();
      setPdfInfo({
        name: selectedFile.name,
        size: selectedFile.size,
        pageCount,
      });
      toast.success(`PDF added · ${pageCount} page${pageCount === 1 ? '' : 's'}`);
    } catch {
      toast.success('PDF file added');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.toLowerCase().endsWith('.pdf')) {
      void loadPdfMeta(selectedFile);
    } else if (selectedFile) {
      toast.error('Please select a PDF file');
    }
  }, [loadPdfMeta]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.toLowerCase().endsWith('.pdf')) {
      void loadPdfMeta(droppedFile);
    } else {
      toast.error('Please drop a PDF file');
    }
  }, [loadPdfMeta]);

  const handleProcess = useCallback(async () => {
    if (!file) {
      toast.error('Please upload a PDF file first');
      return;
    }

    setIsProcessing(true);
    setStatusLabel('Uploading');
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);

    if (mode === 'range') {
      formData.append('pageRange', pageRange);
    } else if (mode === 'single') {
      formData.append('singlePage', singlePage);
    }

    try {
      const progressInterval = setInterval(() => {
        setStatusLabel('Processing');
        setProgress((prev) => Math.min(prev + 8, 90));
      }, 150);

      const response = await fetch('/api/pdf/split', {
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
        } catch { /* ignore parse error */ }
        throw new Error(message);
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const data = await response.json();
        setResult(data);

        if (data.pages) {
          toast.success(`Split into ${data.pages.length} files!`);
          if (data.truncated) {
            toast.info('Showing first 20 pages only for performance. Use range for larger PDFs.');
          }
        } else {
          toast.success(`Extracted ${data.extractedPages?.length || 0} pages!`);
        }
      } else if (contentType.includes('application/zip')) {
        const JSZip = (await import('jszip')).default;
        const blob = await response.blob();
        const zip = await JSZip.loadAsync(blob);
        const pages = [];
        let i = 1;
        
        for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
          if (!zipEntry.dir) {
            const fileData = await zipEntry.async('blob');
            const pdfUrl = URL.createObjectURL(fileData);
            pages.push({
              pageNumber: i++,
              pdfUrl,
              fileName: relativePath,
            });
          }
        }
        
        const totalPages = Number(response.headers.get('x-total-pages') || 0);
        const truncated = response.headers.get('x-truncated') === 'true';
        
        setResult({
          mode: 'split-all',
          totalPages,
          pages,
          truncated,
        });
        
        toast.success(`Split into ${pages.length} files!`);
        if (truncated) {
          toast.info('Showing first 20 pages only for performance. Use range for larger PDFs.');
        }
      } else {
        const blob = await response.blob();
        const pdfUrl = URL.createObjectURL(blob);
        const disposition = response.headers.get('content-disposition') || '';
        const fileNameMatch = disposition.match(/filename="?([^";]+)"?/i);
        const fileName = fileNameMatch?.[1] || `extracted-pages-${Date.now()}.pdf`;
        const totalPages = Number(response.headers.get('x-total-pages') || 0);
        const extractedPagesHeader = response.headers.get('x-extracted-pages') || '';
        const extractedPages = extractedPagesHeader
          ? extractedPagesHeader.split(',').map((n) => parseInt(n, 10)).filter((n) => !Number.isNaN(n))
          : [];

        setResult({
          mode: 'extract',
          totalPages,
          extractedPages,
          fileName,
          pdfUrl,
        });
        toast.success(`Extracted ${extractedPages.length || 1} pages!`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to split PDF. Please try again.');
    } finally {
      setIsProcessing(false);
      setStatusLabel('Idle');
    }
  }, [file, mode, pageRange, singlePage, setIsProcessing, setProgress]);

  const handleDownload = useCallback((pdfUrl?: string, fileName?: string) => {
    const url = pdfUrl || result?.pdfUrl;
    const name = fileName || result?.fileName;
    if (url && name) {
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.click();
    }
  }, [result]);

  const handleReset = useCallback(() => {
    if (result?.pdfUrl) URL.revokeObjectURL(result.pdfUrl);
    result?.pages?.forEach((p) => {
      if (p.pdfUrl.startsWith('blob:')) URL.revokeObjectURL(p.pdfUrl);
    });

    reset();
    window.history.pushState({}, '', window.location.pathname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setFile(null);
    setPdfInfo(null);
    setResult(null);
    setPageRange('');
    setSinglePage('1');
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
        icon={Split}
        onReset={handleReset}
      >
        {result?.pdfUrl && (
          <Button onClick={() => handleDownload()} className="gap-2 btn-premium rounded-xl">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        )}
      </ToolPageHeader>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Panel - Upload & Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Drop Zone */}
          {!file ? (
            <motion.div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              aria-label="Upload PDF file"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className="drop-zone relative flex flex-col items-center justify-center p-12 rounded-2xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                <FileText className="w-10 h-10 text-primary" />
              </div>

              <p className="text-lg font-semibold">Upload a PDF</p>
              <p className="text-sm text-muted-foreground mt-1">
                Drag, drop, or click to choose a file
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{pdfInfo?.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span>PDF</span>
                    <span>•</span>
                    <span>{formatSize(pdfInfo?.size || 0)}</span>
                    {result?.totalPages && (
                      <>
                        <span>•</span>
                        <span>{result.totalPages} pages</span>
                      </>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  if (result?.pdfUrl) URL.revokeObjectURL(result.pdfUrl);
                  result?.pages?.forEach((p) => {
                    if (p.pdfUrl.startsWith('blob:')) URL.revokeObjectURL(p.pdfUrl);
                  });
                  setFile(null);
                  setPdfInfo(null);
                  setResult(null);
                }}>
                  Change
                </Button>
              </div>
            </motion.div>
          )}

          <ToolLimitNotice limits={['PDF only', 'Max file size: 25MB', 'Split output capped at 20 pages per run']} />

          {/* Results */}
          <AnimatePresence>
            {result?.pdfUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-4"
              >
                <ResultCard
                  title="PDF Extract Ready"
                  description="Selected pages were extracted successfully."
                  primaryMeta={result.extractedPages?.length ? `${result.extractedPages.length} extracted page(s)` : undefined}
                  onDownload={() => handleDownload()}
                  downloadLabel="Download Extracted PDF"
                  nextActions={[
                    { label: 'Compress PDF', href: '/tools/compress-pdf' },
                    { label: 'Merge PDF', href: '/tools/merge-pdf' },
                  ]}
                />
              </motion.div>
            )}
            {result && result.pages && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="rounded-2xl border border-border bg-card overflow-hidden"
              >
                <div className="p-4 border-b border-border">
                  <h3 className="font-medium">Split Pages ({result.pages.length})</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 max-h-96 overflow-y-auto">
                  {result.pages.map((page, index) => (
                    <motion.div
                      key={page.pageNumber}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-xl border border-border bg-muted/50 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Page {page.pageNumber}</p>
                          <p className="text-xs text-muted-foreground">{page.fileName}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleDownload(page.pdfUrl, page.fileName)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </motion.div>
                  ))}
                </div>
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
                Split Options
              </h3>
            </div>

            <div className="p-5 space-y-6">
              <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="all">All Pages</TabsTrigger>
                  <TabsTrigger value="range">Range</TabsTrigger>
                  <TabsTrigger value="single">Single</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
                  <div className="p-4 rounded-xl bg-muted/50 space-y-1">
                    <p className="text-sm font-medium">Create one file per page</p>
                    <p className="text-sm text-muted-foreground">
                      Best for sharing or removing specific pages quickly.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="range" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Page Range</Label>
                    <Input
                      placeholder="e.g., 1-3,5,7-9"
                      value={pageRange}
                      onChange={(e) => setPageRange(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter pages to extract (e.g., 1-3,5,7-9)
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="single" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Page Number</Label>
                    <Input
                      type="number"
                      min={1}
                      value={singlePage}
                      onChange={(e) => setSinglePage(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Extract a single page from the PDF
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="pt-4 space-y-3">
                <Button
                  className="w-full btn-premium py-6 rounded-xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all"
                  onClick={handleProcess}
                  disabled={!file || isProcessing || (mode === 'range' && !pageRange)}
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
                      <Scissors className="w-5 h-5 mr-3" />
                      Split PDF
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
              Split Options Guide
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>All Pages:</strong> Split into separate files</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Range:</strong> Extract specific pages</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Single:</strong> Extract one page</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {file && !result && (
        <div className="fixed bottom-0 inset-x-0 z-40 p-3 bg-background/95 backdrop-blur border-t border-border md:hidden">
          <Button
            className="w-full btn-premium h-11"
            onClick={handleProcess}
            disabled={isProcessing || (mode === 'range' && !pageRange)}
          >
            {isProcessing ? `${statusLabel} • ${Math.round(progress)}%` : 'Split PDF'}
          </Button>
        </div>
      )}
    </motion.div >
  );
}
