'use client';

import { useState, useCallback } from 'react';
import { Download, RotateCcw, Hash, CheckCircle2, Sliders, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { toast } from 'sonner';

type Position = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export function BatesNumberingWorkspace() {
  const { uploadedFile, isProcessing, setIsProcessing, setProgress, reset } = useAppStore();

  const [prefix, setPrefix] = useState<string>('PLAINTIFF-');
  const [suffix, setSuffix] = useState<string>('');
  const [startNumber, setStartNumber] = useState<number>(1);
  const [padding, setPadding] = useState<number>(6);
  const [position, setPosition] = useState<Position>('bottom-right');
  const [fontSize, setFontSize] = useState<number>(10);
  const [banner, setBanner] = useState<string>('');

  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [stampedFileName, setStampedFileName] = useState<string>('');

  const sampleLabel = `${prefix}${String(startNumber).padStart(padding, '0')}${suffix}`;

  const handleReset = useCallback(() => {
    reset();
    setDownloadUrl(null);
    setStampedFileName('');
  }, [reset]);

  const handleApplyBates = async () => {
    if (!uploadedFile) {
      toast.error('Please upload a PDF first');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('prefix', prefix);
      formData.append('suffix', suffix);
      formData.append('startNumber', String(startNumber));
      formData.append('padding', String(padding));
      formData.append('position', position);
      formData.append('fontSize', String(fontSize));
      if (banner) formData.append('banner', banner);

      const { fetchWithUploadProgress } = await import('@/lib/upload-with-progress');
      const res = await fetchWithUploadProgress('/api/pdf/bates-numbering', formData, setProgress);

      setProgress(90);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Bates numbering failed' }));
        throw new Error(err.error || 'Failed to apply Bates numbering');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      const baseName = uploadedFile.name.replace(/\.pdf$/i, '');
      setStampedFileName(`${baseName}-bates-stamped.pdf`);
      setProgress(100);
      toast.success('Bates numbering applied across all pages!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to apply Bates numbers');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = stampedFileName || 'bates-stamped-document.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success('Downloaded Bates-stamped document!');
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
      <ToolPageHeader
        title="Bates Numbering PDF Online"
        description="Add sequential legal Bates stamps, custom case prefixes, and confidentiality notices to PDF pages for discovery and litigation."
        icon={<Hash className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'PDF legal documents · depositions, exhibits, filings',
          'Sequential numbering with custom prefix and padding (000001)',
          'Compliant with US Federal Court (PACER) and e-filing rules',
        ]}
      />

      {!uploadedFile ? (
        <div className="mt-8">
          <FileUpload accept=".pdf,application/pdf" />
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Controls & Settings */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Sliders className="w-4 h-4 text-primary" />
                    Bates Sequence Configuration
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {uploadedFile.name}
                  </Badge>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prefix-e-g-case-or-party" className="text-xs font-semibold">Prefix (e.g. Case or Party)</Label>
                    <Input id="prefix-e-g-case-or-party"
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value)}
                      placeholder="PLAINTIFF-"
                      className="mt-1 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <Label htmlFor="suffix-optional" className="text-xs font-semibold">Suffix (Optional)</Label>
                    <Input id="suffix-optional"
                      value={suffix}
                      onChange={(e) => setSuffix(e.target.value)}
                      placeholder="-CONF"
                      className="mt-1 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <Label htmlFor="starting-number" className="text-xs font-semibold">Starting Number</Label>
                    <Input id="starting-number"
                      type="number"
                      min={1}
                      value={startNumber}
                      onChange={(e) => setStartNumber(parseInt(e.target.value, 10) || 1)}
                      className="mt-1 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <Label htmlFor="digit-padding-leading-zeros" className="text-xs font-semibold">Digit Padding (Leading Zeros)</Label>
                    <Input id="digit-padding-leading-zeros"
                      type="number"
                      min={1}
                      max={10}
                      value={padding}
                      onChange={(e) => setPadding(Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 6)))}
                      className="mt-1 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="confidentiality-banner-optional" className="text-xs font-semibold">Confidentiality Banner (Optional)</Label>
                  <Input id="confidentiality-banner-optional"
                    value={banner}
                    onChange={(e) => setBanner(e.target.value)}
                    placeholder="CONFIDENTIAL - FOR COUNSEL ONLY"
                    className="mt-1 text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Adds a legal confidentiality warning alongside the Bates stamp.
                  </p>
                </div>

                {/* Placement Preset Grid */}
                <div>
                  <Label id="stamp-position-on-page" className="text-xs font-semibold block mb-2">Stamp Position on Page</Label>
                  <div role="group" aria-labelledby="stamp-position-on-page" className="grid grid-cols-3 gap-2">
                    {(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'] as Position[]).map((pos) => (
                      <Button
                        key={pos}
                        type="button"
                        size="sm"
                        variant={position === pos ? 'default' : 'outline'}
                        onClick={() => setPosition(pos)}
                        className="text-xs capitalize h-9"
                      >
                        {pos.replace('-', ' ')}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Font Size Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="font-size" className="text-xs font-semibold">Font Size</Label>
                    <span className="text-xs font-mono text-muted-foreground">{fontSize} pt</span>
                  </div>
                  <input id="font-size"
                    type="range"
                    min={8}
                    max={16}
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Right Col: Live Preview & Action Card */}
            <div className="space-y-6">
              <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2 font-semibold text-sm border-b pb-3">
                  <Eye className="w-4 h-4 text-primary" />
                  Live Stamp Preview
                </div>

                <div className="bg-muted/40 border rounded-xl p-5 text-center space-y-2">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">
                    Sample First Page Stamp
                  </span>
                  <div className="inline-block bg-white dark:bg-zinc-900 border shadow-xs px-4 py-2 rounded-lg font-mono text-xs font-bold text-foreground">
                    {banner && <span className="text-red-600 dark:text-red-400 block text-[10px] uppercase">{banner}</span>}
                    {sampleLabel}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Positioned at {position.replace('-', ' ')} on every page.
                  </p>
                </div>

                {!downloadUrl ? (
                  <Button
                    onClick={handleApplyBates}
                    disabled={isProcessing}
                    className="w-full gap-2 shadow-sm font-semibold"
                  >
                    <Hash className="w-4 h-4" />
                    {isProcessing ? 'Stamping Legal Document...' : 'Apply Bates Numbers'}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4" /> Ready for Court Filing
                    </div>
                    <Button onClick={handleDownload} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                      <Download className="w-4 h-4" /> Download Stamped PDF
                    </Button>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="w-full text-xs text-muted-foreground"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Start Over
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


