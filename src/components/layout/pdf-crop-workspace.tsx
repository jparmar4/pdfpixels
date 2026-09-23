'use client';

import { motion } from 'framer-motion';
import {
  Download, RotateCcw, Crop, Check, ArrowLeft, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

export function PDFCropWorkspace() {
  const { uploadedFile, isProcessing, setIsProcessing, setProgress, reset } = useAppStore();

  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageWidth, setPageWidth] = useState<number>(595);
  const [pageHeight, setPageHeight] = useState<number>(842);

  // Margin crop values in points (72 points = 1 inch)
  const [topMargin, setTopMargin] = useState<number>(36);
  const [bottomMargin, setBottomMargin] = useState<number>(36);
  const [leftMargin, setLeftMargin] = useState<number>(36);
  const [rightMargin, setRightMargin] = useState<number>(36);

  const [applyScope, setApplyScope] = useState<'all' | 'current' | 'odd' | 'even'>('all');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFileName, setResultFileName] = useState<string>('');

  useEffect(() => {
    if (!uploadedFile) {
      setTotalPages(1);
      setResultUrl(null);
      return;
    }

    let active = true;
    (async () => {
      try {
        const { PDFDocument } = await import('pdf-lib');
        const buffer = await uploadedFile.arrayBuffer();
        const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const pages = pdf.getPages();
        if (active) {
          setTotalPages(pages.length);
          if (pages.length > 0) {
            const sz = pages[0].getSize();
            setPageWidth(sz.width);
            setPageHeight(sz.height);
          }
          toast.success(`PDF loaded (${pages.length} page${pages.length === 1 ? '' : 's'})`);
        }
      } catch {
        if (active) setTotalPages(1);
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

  const handleCrop = async () => {
    if (!uploadedFile) {
      toast.error('Please upload a PDF document');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('top', String(topMargin));
      formData.append('bottom', String(bottomMargin));
      formData.append('left', String(leftMargin));
      formData.append('right', String(rightMargin));

      let pagesParam = 'all';
      if (applyScope === 'current') pagesParam = String(currentPage);
      else if (applyScope === 'odd') pagesParam = 'odd';
      else if (applyScope === 'even') pagesParam = 'even';
      formData.append('pages', pagesParam);

      const { fetchWithUploadProgress } = await import('@/lib/upload-with-progress');
      const res = await fetchWithUploadProgress('/api/pdf/crop', formData, setProgress);

      setProgress(90);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Crop failed' }));
        throw new Error(err.error || 'Failed to crop PDF');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultFileName(uploadedFile.name.replace(/\.pdf$/i, '-cropped.pdf'));
      setProgress(100);
      toast.success('PDF cropped successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Crop failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const applyPreset = (marginPt: number) => {
    setTopMargin(marginPt);
    setBottomMargin(marginPt);
    setLeftMargin(marginPt);
    setRightMargin(marginPt);
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = resultFileName || 'cropped-document.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success('Download started');
  };

  const topPercent = (topMargin / pageHeight) * 100;
  const bottomPercent = (bottomMargin / pageHeight) * 100;
  const leftPercent = (leftMargin / pageWidth) * 100;
  const rightPercent = (rightMargin / pageWidth) * 100;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl">
      <ToolPageHeader
        title="Crop PDF Pages Online"
        description="Trim unwanted white margins, crop headers and footers, or adjust PDF dimensions for printing and mobile e-readers."
        icon={<Crop className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'PDF only · max 50 MB',
          'Adjust margins in typography points (72pt = 1 inch)',
          'Choose scope: all pages, odd/even, or current page',
        ]}
      />

      {!uploadedFile ? (
        <div className="mt-8">
          <FileUpload accept=".pdf,application/pdf" />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left: Visual Page Mockup with Crop Bounding Box (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between bg-card p-3 rounded-xl border">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    Page {currentPage} of {totalPages}
                  </Badge>
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {uploadedFile.name}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Page Mockup with Shaded Crop Margins */}
              <div className="relative bg-white dark:bg-zinc-900 border-2 rounded-2xl aspect-[1/1.414] shadow-sm overflow-hidden p-8 flex flex-col justify-between">
                {/* Shaded Cropped Margin Overlays */}
                <div
                  className="absolute top-0 left-0 right-0 bg-red-500/15 border-b border-red-500/40 pointer-events-none"
                  style={{ height: `${topPercent}%` }}
                />
                <div
                  className="absolute bottom-0 left-0 right-0 bg-red-500/15 border-t border-red-500/40 pointer-events-none"
                  style={{ height: `${bottomPercent}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 left-0 bg-red-500/15 border-r border-red-500/40 pointer-events-none"
                  style={{ width: `${leftPercent}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 right-0 bg-red-500/15 border-l border-red-500/40 pointer-events-none"
                  style={{ width: `${rightPercent}%` }}
                />

                {/* Safe Keep Area Bounding Box */}
                <div
                  className="absolute border-2 border-dashed border-emerald-500 bg-emerald-500/5 pointer-events-none flex items-center justify-center"
                  style={{
                    top: `${topPercent}%`,
                    bottom: `${bottomPercent}%`,
                    left: `${leftPercent}%`,
                    right: `${rightPercent}%`,
                  }}
                >
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-1 bg-white/80 dark:bg-zinc-950/80 rounded border shadow-xs">
                    Preserved Crop Area
                  </span>
                </div>

                {/* Background Document Mock Lines */}
                <div className="space-y-4 opacity-25 select-none">
                  <div className="h-5 bg-muted-foreground/30 rounded w-1/3" />
                  <div className="h-3 bg-muted-foreground/20 rounded w-full" />
                  <div className="h-3 bg-muted-foreground/20 rounded w-5/6" />
                  <div className="h-3 bg-muted-foreground/20 rounded w-full" />
                </div>
                <div className="space-y-3 opacity-25 select-none">
                  <div className="h-3 bg-muted-foreground/20 rounded w-full" />
                  <div className="h-3 bg-muted-foreground/20 rounded w-3/4" />
                  <div className="h-3 bg-muted-foreground/20 rounded w-full" />
                </div>
              </div>
            </div>

            {/* Right: Margin Controls (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2">
                  <Crop className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-base">Crop Dimensions</h3>
                </div>

                {/* Quick Presets */}
                <div className="space-y-2">
                  <Label id="quick-margin-presets" className="text-xs">Quick Margin Presets:</Label>
                  <div role="group" aria-labelledby="quick-margin-presets" className="grid grid-cols-3 gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => applyPreset(18)}>
                      Narrow (0.25&quot;)
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => applyPreset(36)}>
                      Standard (0.5&quot;)
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => applyPreset(72)}>
                      Wide (1.0&quot;)
                    </Button>
                  </div>
                </div>

                {/* Individual Margin Sliders */}
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Top Margin:</span>
                      <span className="font-mono text-primary font-semibold">{topMargin}pt</span>
                    </div>
                    <Slider value={[topMargin]} min={0} max={200} step={2} onValueChange={([v]) => setTopMargin(v)} />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Bottom Margin:</span>
                      <span className="font-mono text-primary font-semibold">{bottomMargin}pt</span>
                    </div>
                    <Slider value={[bottomMargin]} min={0} max={200} step={2} onValueChange={([v]) => setBottomMargin(v)} />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Left Margin:</span>
                      <span className="font-mono text-primary font-semibold">{leftMargin}pt</span>
                    </div>
                    <Slider value={[leftMargin]} min={0} max={150} step={2} onValueChange={([v]) => setLeftMargin(v)} />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Right Margin:</span>
                      <span className="font-mono text-primary font-semibold">{rightMargin}pt</span>
                    </div>
                    <Slider value={[rightMargin]} min={0} max={150} step={2} onValueChange={([v]) => setRightMargin(v)} />
                  </div>
                </div>

                {/* Scope Selection */}
                <div className="space-y-2 border-t pt-4">
                  <Label id="applyScope" className="text-xs">Apply Crop To:</Label>
                  <Select aria-labelledby="applyScope" value={applyScope} onValueChange={(v: any) => setApplyScope(v)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Pages ({totalPages})</SelectItem>
                      <SelectItem value="current">Current Page Only (Page {currentPage})</SelectItem>
                      <SelectItem value="odd">Odd Pages Only</SelectItem>
                      <SelectItem value="even">Even Pages Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 pt-2">
                  <Button
                    type="button"
                    disabled={isProcessing}
                    className="w-full rounded-xl font-semibold gap-2"
                    onClick={handleCrop}
                  >
                    <Crop className="w-4 h-4" /> {isProcessing ? 'Cropping Pages...' : 'Crop & Export PDF'}
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
                    <h4 className="font-semibold text-base">Crop Completed!</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      MediaBox and CropBox boundaries updated.
                    </p>
                  </div>
                  <Button onClick={handleDownload} className="w-full font-semibold gap-2 rounded-xl">
                    <Download className="w-4 h-4" /> Download Cropped PDF
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


