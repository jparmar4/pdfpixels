'use client';

import { motion } from 'framer-motion';
import {
  Download, RotateCcw, Contrast, Check, Printer, FileDown, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export function PDFGrayscaleWorkspace() {
  const { uploadedFile, isProcessing, setIsProcessing, setProgress, reset } = useAppStore();

  const [totalPages, setTotalPages] = useState<number>(1);
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
        if (active) {
          setTotalPages(pdf.getPageCount());
          toast.success(`PDF loaded (${pdf.getPageCount()} page${pdf.getPageCount() === 1 ? '' : 's'})`);
        }
      } catch {
        if (active) {
          setTotalPages(1);
          toast.success('PDF document loaded');
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

  const handleConvertGrayscale = async () => {
    if (!uploadedFile) {
      toast.error('Please upload a PDF document');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const { fetchWithUploadProgress } = await import('@/lib/upload-with-progress');
      const res = await fetchWithUploadProgress('/api/pdf/grayscale', formData, setProgress);

      setProgress(90);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Grayscale conversion failed' }));
        throw new Error(err.error || 'Failed to convert PDF to grayscale');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultFileName(uploadedFile.name.replace(/\.pdf$/i, '-grayscale.pdf'));
      setProgress(100);
      toast.success('PDF converted to grayscale successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Conversion failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = resultFileName || 'grayscale-document.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success('Download started');
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
      <ToolPageHeader
        title="Grayscale PDF Converter (Black & White)"
        description="Convert color PDF files into monochrome grayscale documents. Save printer ink costs, meet court filing standards, and reduce file size."
        icon={<Contrast className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'PDF only · max 50 MB',
          'Converts all color vectors, fonts, and photos to 8-bit DeviceGray',
          'Preserves searchable text, hyperlinks, and document layout',
        ]}
      />

      {!uploadedFile ? (
        <div className="mt-8">
          <FileUpload accept=".pdf,application/pdf" />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <div className="grid md:grid-cols-12 gap-8 items-start">
            {/* Left: Summary & Conversion (7 cols) */}
            <div className="md:col-span-7 bg-card border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-semibold text-lg">{uploadedFile.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB · {totalPages} Page{totalPages === 1 ? '' : 's'}
                  </p>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  Full Document
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border">
                  <Printer className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-foreground">Printer & Court Compliance</p>
                    <p className="text-muted-foreground leading-relaxed">
                      Converts all vector graphics, text, and embedded raster images to true 8-bit DeviceGray monochrome, saving expensive color toner while preserving sharp typography.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl border bg-card/60 space-y-1">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Contrast className="w-4 h-4 text-primary" /> High-Contrast Tones
                    </span>
                    <p className="text-muted-foreground">Maintains readable contrast across colored diagrams & photos.</p>
                  </div>
                  <div className="p-3 rounded-xl border bg-card/60 space-y-1">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <FileDown className="w-4 h-4 text-emerald-500" /> Vector Preservation
                    </span>
                    <p className="text-muted-foreground">Text remains fully selectable and searchable after conversion.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  type="button"
                  disabled={isProcessing}
                  size="lg"
                  className="w-full rounded-xl font-semibold gap-2"
                  onClick={handleConvertGrayscale}
                >
                  <Contrast className="w-5 h-5" /> {isProcessing ? 'Converting to Grayscale...' : 'Convert to Grayscale PDF'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  onClick={handleReset}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Upload Different PDF
                </Button>
              </div>
            </div>

            {/* Right: Results or Benefits Card (5 cols) */}
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
                      PDF has been converted to black & white / grayscale.
                    </p>
                  </div>
                  <Button onClick={handleDownload} className="w-full font-semibold gap-2 rounded-xl">
                    <Download className="w-4 h-4" /> Download Grayscale PDF
                  </Button>
                </motion.div>
              ) : (
                <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Sparkles className="w-4 h-4 text-primary" /> Key Use Cases
                  </div>
                  <ul className="space-y-2 text-muted-foreground list-disc pl-4 leading-relaxed">
                    <li><strong className="text-foreground">Legal & Court Submissions:</strong> PACER and court systems often reject documents with unnecessary color channels.</li>
                    <li><strong className="text-foreground">Office Printing:</strong> Commercial printers charge up to 5x more for color page passes. Convert first to guarantee monochrome print rates.</li>
                    <li><strong className="text-foreground">File Size Reduction:</strong> Stripping multi-channel RGB/CMYK image streams reduces document weight for email.</li>
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
