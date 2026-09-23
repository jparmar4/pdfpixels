'use client';

import { motion } from 'framer-motion';
import {
  Download, RotateCcw, Scissors, Check, CheckSquare, Square
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export function PDFExtractWorkspace() {
  const { uploadedFile, isProcessing, setIsProcessing, setProgress, reset } = useAppStore();

  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set([1]));
  const [rangeInput, setRangeInput] = useState<string>('1');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFileName, setResultFileName] = useState<string>('');

  useEffect(() => {
    if (!uploadedFile) {
      setTotalPages(1);
      setSelectedPages(new Set([1]));
      setRangeInput('1');
      setResultUrl(null);
      return;
    }

    let active = true;
    (async () => {
      try {
        const { PDFDocument } = await import('pdf-lib');
        const buffer = await uploadedFile.arrayBuffer();
        const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const count = pdf.getPageCount();
        if (active) {
          setTotalPages(count);
          setSelectedPages(new Set([1]));
          setRangeInput('1');
          toast.success(`PDF loaded (${count} page${count === 1 ? '' : 's'})`);
        }
      } catch {
        if (active) {
          setTotalPages(1);
          setSelectedPages(new Set([1]));
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [uploadedFile]);

  const handleReset = useCallback(() => {
    if (resultUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(resultUrl);
    }
    reset();
    setResultUrl(null);
  }, [reset, resultUrl]);

  const togglePage = (pageIdx: number) => {
    setSelectedPages(prev => {
      const next = new Set(prev);
      if (next.has(pageIdx)) next.delete(pageIdx);
      else next.add(pageIdx);
      setRangeInput(Array.from(next).sort((a, b) => a - b).join(', '));
      return next;
    });
  };

  const selectAll = () => {
    const all = new Set(Array.from({ length: totalPages }, (_, i) => i + 1));
    setSelectedPages(all);
    setRangeInput(`1-${totalPages}`);
  };

  const clearAll = () => {
    setSelectedPages(new Set());
    setRangeInput('');
  };

  const selectOdd = () => {
    const odds = new Set(Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p % 2 !== 0));
    setSelectedPages(odds);
    setRangeInput(Array.from(odds).join(', '));
  };

  const selectEven = () => {
    const evens = new Set(Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p % 2 === 0));
    setSelectedPages(evens);
    setRangeInput(Array.from(evens).join(', '));
  };

  const handleRangeInputChange = (input: string) => {
    setRangeInput(input);
    const indices = new Set<number>();
    const tokens = input.split(',').map(t => t.trim()).filter(Boolean);

    for (const token of tokens) {
      const rangeMatch = token.match(/^(\d+)\s*-\s*(\d+)$/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = parseInt(rangeMatch[2], 10);
        for (let p = Math.min(start, end); p <= Math.max(start, end); p++) {
          if (p >= 1 && p <= totalPages) indices.add(p);
        }
      } else {
        const p = parseInt(token, 10);
        if (p >= 1 && p <= totalPages) indices.add(p);
      }
    }
    setSelectedPages(indices);
  };

  const handleExtract = async () => {
    if (!uploadedFile) {
      toast.error('Please upload a PDF document');
      return;
    }
    if (selectedPages.size === 0) {
      toast.error('Please select at least one page to extract');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      const pagesStr = Array.from(selectedPages).sort((a, b) => a - b).join(',');
      formData.append('pages', pagesStr);

      const { fetchWithUploadProgress } = await import('@/lib/upload-with-progress');
      const res = await fetchWithUploadProgress('/api/pdf/extract', formData, setProgress);

      setProgress(90);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Extraction failed' }));
        throw new Error(err.error || 'Failed to extract pages');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultFileName(uploadedFile.name.replace(/\.pdf$/i, '-extracted.pdf'));
      setProgress(100);
      toast.success(`Extracted ${selectedPages.size} page${selectedPages.size === 1 ? '' : 's'} into new PDF!`);
    } catch (err: any) {
      toast.error(err.message || 'Extraction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = resultFileName || 'extracted-document.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success('Download started');
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl">
      <ToolPageHeader
        title="Extract PDF Pages Online"
        description="Select and extract individual pages or custom page ranges from any PDF into a brand new document. Fast, free, and completely private."
        icon={<Scissors className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'PDF only · max 50 MB',
          'Click individual page thumbnails or type ranges (e.g. 1, 3-5)',
          'Extracted pages are saved losslessly into a single new PDF',
        ]}
      />

      {!uploadedFile ? (
        <div className="mt-8">
          <FileUpload accept=".pdf,application/pdf" />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {/* Top Control Bar */}
          <div className="bg-card border rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono text-xs">
                {totalPages} Total Pages
              </Badge>
              <Badge variant="default" className="font-mono text-xs">
                {selectedPages.size} Selected
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={selectAll}>
                Select All
              </Button>
              <Button size="sm" variant="outline" onClick={clearAll}>
                Clear
              </Button>
              <Button size="sm" variant="outline" onClick={selectOdd}>
                Odd Pages
              </Button>
              <Button size="sm" variant="outline" onClick={selectEven}>
                Even Pages
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left: Thumbnail Grid of Pages (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto p-2 border rounded-2xl bg-muted/20">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  const isSelected = selectedPages.has(pageNum);
                  return (
                    <div
                      key={pageNum}
                      onClick={() => togglePage(pageNum)}
                      className={`relative cursor-pointer rounded-xl border-2 transition-all p-3 flex flex-col items-center justify-between aspect-[1/1.4] bg-white dark:bg-zinc-900 select-none shadow-xs ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 scale-[1.02]'
                          : 'border-border opacity-70 hover:opacity-100 hover:border-primary/50'
                      }`}
                    >
                      <div className="w-full flex justify-between items-center text-xs">
                        <span className="font-semibold font-mono text-[11px]">#{pageNum}</span>
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4 text-muted-foreground/50" />
                        )}
                      </div>

                      {/* Mock thumbnail representation */}
                      <div className="w-full space-y-2 py-4 opacity-30">
                        <div className="h-2.5 bg-muted-foreground/40 rounded w-2/3" />
                        <div className="h-1.5 bg-muted-foreground/30 rounded w-full" />
                        <div className="h-1.5 bg-muted-foreground/30 rounded w-5/6" />
                        <div className="h-1.5 bg-muted-foreground/30 rounded w-full" />
                        <div className="h-1.5 bg-muted-foreground/30 rounded w-3/4" />
                      </div>

                      <span className="text-[10px] text-muted-foreground font-medium">
                        Page {pageNum}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Actions & Range Input (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-base">Extraction Settings</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="selected-page-range" className="text-xs">Selected Page Range:</Label>
                  <Input id="selected-page-range"
                    placeholder="e.g. 1, 3-5, 8"
                    value={rangeInput}
                    onChange={(e) => handleRangeInputChange(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Type page numbers separated by commas or dashes (e.g. 1, 4-7).
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <Button
                    type="button"
                    disabled={isProcessing || selectedPages.size === 0}
                    className="w-full rounded-xl font-semibold gap-2"
                    onClick={handleExtract}
                  >
                    <Scissors className="w-4 h-4" />{' '}
                    {isProcessing ? 'Extracting Pages...' : `Extract ${selectedPages.size} Page${selectedPages.size === 1 ? '' : 's'}`}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground"
                    onClick={handleReset}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Start Over
                  </Button>
                </div>
              </div>

              {resultUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center space-y-4"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-base">Extraction Complete!</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      New PDF created containing your {selectedPages.size} selected pages.
                    </p>
                  </div>
                  <Button onClick={handleDownload} className="w-full font-semibold gap-2 rounded-xl">
                    <Download className="w-4 h-4" /> Download Extracted PDF
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

