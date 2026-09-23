'use client';

import { useState, useCallback, useEffect } from 'react';
import { Download, RotateCcw, FileImage, CheckCircle2, Smartphone, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { toast } from 'sonner';

export function HeicToPdfWorkspace() {
  const [files, setFiles] = useState<File[]>([]);
  const [orientation, setOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [margin, setMargin] = useState<number>(20);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('');

  useEffect(() => {
    return () => {
      if (downloadUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setDownloadUrl(null);
    setPdfFileName('');
  }, []);

  const handleConvert = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one HEIC or HEIF photo');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const formData = new FormData();
      for (const f of files) {
        formData.append('file', f);
      }
      formData.append('orientation', orientation);
      formData.append('margin', String(margin));

      const { fetchWithUploadProgress } = await import('@/lib/upload-with-progress');
      const res = await fetchWithUploadProgress('/api/pdf/from-heic', formData, setProgress);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Conversion failed' }));
        throw new Error(err.error || 'Failed to convert HEIC to PDF');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      const firstName = files[0].name.replace(/\.(heic|heif)$/i, '');
      setPdfFileName(`${firstName}.pdf`);
      toast.success(`Converted ${files.length} iPhone photo${files.length > 1 ? 's' : ''} to PDF!`);
    } catch (err: any) {
      toast.error(err.message || 'HEIC to PDF conversion failed');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = pdfFileName || 'converted-photos.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success('Downloaded compiled PDF!');
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-4xl">
      <ToolPageHeader
        title="HEIC to PDF Converter Online"
        description="Convert Apple iPhone HEIC and HEIF photos into high-resolution standard PDF documents with custom page orientation."
        icon={<FileImage className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'Apple HEIC & HEIF camera formats · iPhone & iPad photos',
          'Automatic EXIF orientation correction (no sideways photos)',
          'Combine multiple photos into a single sequential PDF',
        ]}
      />

      <div className="mt-8 space-y-6">
        {files.length === 0 ? (
          <div className="bg-card border-2 border-dashed rounded-2xl p-10 text-center hover:border-primary/50 transition-colors">
            <label className="cursor-pointer block">
              <input
                type="file"
                multiple
                accept=".heic,.heif"
                className="hidden"
                onChange={(e) => {
                  const selected = Array.from(e.target.files || []);
                  if (selected.length > 0) setFiles(selected);
                }}
              />
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-7 h-7" />
              </div>
              <span className="text-base font-semibold text-foreground block">
                Select iPhone HEIC / HEIF Photos
              </span>
              <span className="text-xs text-muted-foreground mt-1 block">
                Choose one or multiple photos to convert into a single PDF
              </span>
            </label>
          </div>
        ) : (
          <div className="space-y-6">
            {/* File list card */}
            <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">Selected Photos ({files.length})</span>
                </div>
                <Button size="sm" variant="ghost" onClick={handleReset} className="text-xs text-muted-foreground">
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Clear
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-56 overflow-y-auto p-1">
                {files.map((file, idx) => (
                  <div key={idx} className="p-3 bg-muted/40 border rounded-xl flex items-center gap-2">
                    <FileImage className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-xs truncate font-medium">{file.name}</span>
                  </div>
                ))}
              </div>

              {/* Options */}
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-xs font-semibold block mb-2">Page Orientation</span>
                  <div className="flex gap-2">
                    {(['auto', 'portrait', 'landscape'] as const).map((opt) => (
                      <Button
                        key={opt}
                        type="button"
                        size="sm"
                        variant={orientation === opt ? 'default' : 'outline'}
                        onClick={() => setOrientation(opt)}
                        className="text-xs capitalize h-8"
                      >
                        {opt}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold block mb-2">Page Margin</span>
                  <div className="flex gap-2">
                    {[
                      { label: 'None', val: 0 },
                      { label: 'Standard', val: 20 },
                      { label: 'Wide', val: 36 },
                    ].map((m) => (
                      <Button
                        key={m.label}
                        type="button"
                        size="sm"
                        variant={margin === m.val ? 'default' : 'outline'}
                        onClick={() => setMargin(m.val)}
                        className="text-xs h-8"
                      >
                        {m.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 flex flex-wrap items-center gap-3">
                {!downloadUrl ? (
                  <Button
                    onClick={handleConvert}
                    disabled={isProcessing}
                    className="gap-2 font-semibold shadow-sm"
                  >
                    <FileImage className="w-4 h-4" />
                    {isProcessing ? `Converting… ${Math.round(progress)}%` : `Convert ${files.length} Photo${files.length > 1 ? 's' : ''} to PDF`}
                  </Button>
                ) : (
                  <div className="flex items-center gap-3">
                    <Button onClick={handleDownload} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm">
                      <Download className="w-4 h-4" /> Download PDF
                    </Button>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="w-4 h-4" /> Successfully Converted
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
