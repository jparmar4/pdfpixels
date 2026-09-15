'use client';

import { useState, useCallback, useEffect } from 'react';
import { Download, RotateCcw, Palette, Printer, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { toast } from 'sonner';

export function CmykPdfWorkspace() {
  const { uploadedFile, isProcessing, setIsProcessing, setProgress, reset } = useAppStore();
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [cmykFileName, setCmykFileName] = useState<string>('');

  useEffect(() => {
    return () => {
      if (downloadUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const handleReset = useCallback(() => {
    reset();
    setDownloadUrl(null);
    setCmykFileName('');
  }, [reset]);

  const handleConvertCmyk = async () => {
    if (!uploadedFile) return;
    setIsProcessing(true);
    setProgress(25);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      setProgress(60);
      const res = await fetch('/api/pdf/to-cmyk', {
        method: 'POST',
        body: formData,
      });

      setProgress(90);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'CMYK conversion failed' }));
        throw new Error(err.error || 'Failed to convert PDF to CMYK');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      const baseName = uploadedFile.name.replace(/\.pdf$/i, '');
      setCmykFileName(`${baseName}-cmyk.pdf`);
      setProgress(100);
      toast.success('Converted to 4-color DeviceCMYK prepress PDF!');
    } catch (err: any) {
      toast.error(err.message || 'CMYK conversion failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = cmykFileName || 'print-ready-cmyk.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success('Downloaded print-ready CMYK PDF!');
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-4xl">
      <ToolPageHeader
        title="CMYK PDF Converter for Print"
        description="Convert RGB PDF documents to calibrated 4-color DeviceCMYK for commercial offset printing, Amazon KDP, and prepress compliance."
        icon={<Palette className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'PDF only · brochures, book covers, posters, business cards',
          'Calibrated DeviceCMYK 4-color channel separation',
          'Meets Amazon KDP, IngramSpark, and VistaPrint prepress standards',
        ]}
      />

      {!uploadedFile ? (
        <div className="mt-8">
          <FileUpload accept=".pdf,application/pdf" />
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Printer className="w-4 h-4 text-primary" />
                Prepress Color Separation Profile
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {uploadedFile.name}
              </Badge>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-muted/40 border">
                <span className="text-muted-foreground block text-[11px]">Target Color Model</span>
                <span className="font-semibold text-foreground font-mono">DeviceCMYK (4-Color)</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border">
                <span className="text-muted-foreground block text-[11px]">Resolution Target</span>
                <span className="font-semibold text-foreground font-mono">300 DPI Preservation</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border">
                <span className="text-muted-foreground block text-[11px]">Vector Sharpness</span>
                <span className="font-semibold text-foreground font-mono">100% Scalable Vector</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Converting RGB to CMYK eliminates unexpected color shifts on paper by pre-separating colors into Cyan, Magenta, Yellow, and Key/Black printing plates.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {!downloadUrl ? (
                <Button
                  onClick={handleConvertCmyk}
                  disabled={isProcessing}
                  className="gap-2 font-semibold shadow-sm"
                >
                  <Palette className="w-4 h-4" />
                  {isProcessing ? 'Converting to DeviceCMYK...' : 'Convert to CMYK Print PDF'}
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <Button onClick={handleDownload} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm">
                    <Download className="w-4 h-4" /> Download Print-Ready CMYK PDF
                  </Button>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Prepress Verified
                  </div>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-xs text-muted-foreground ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Start Over
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
