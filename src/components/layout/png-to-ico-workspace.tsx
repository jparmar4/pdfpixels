'use client';

import { useCallback, useState } from 'react';
import { Download, RotateCcw, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useActiveTool } from '@/hooks/use-active-tool';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { toast } from 'sonner';

const ALL_SIZES = [16, 32, 48, 64, 128, 256] as const;
const DEFAULT_SIZES: number[] = [16, 32, 48, 64];

export function PNGToIcoWorkspace() {
  const { activeTool, isProcessing, setIsProcessing, setProgress, reset } = useActiveTool();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sizes, setSizes] = useState<number[]>(DEFAULT_SIZES);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState<string>('favicon.ico');

  const handleSelect = useCallback((selected: File | undefined) => {
    if (!selected) return;
    if (!/\.(png|jpe?g|webp)$/i.test(selected.name) && !selected.type.startsWith('image/')) {
      toast.error('Please choose a PNG, JPG, or WebP image');
      return;
    }
    if (selected.size > 25 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 25 MB.');
      return;
    }
    setFile(selected);
    setResultUrl(null);
    setPreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return URL.createObjectURL(selected);
    });
  }, []);

  const handleConvert = useCallback(async () => {
    if (!file || sizes.length === 0) return;
    setIsProcessing(true);
    setProgress(10);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sizes', sizes.join(','));
      setProgress(45);
      const res = await fetch('/api/image/ico', { method: 'POST', body: formData });
      setProgress(90);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Conversion failed' }));
        throw new Error(err.error || 'Conversion failed');
      }
      const blob = await res.blob();
      setResultUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return URL.createObjectURL(blob);
      });
      setResultName('favicon.ico');
      setProgress(100);
      toast.success(`favicon.ico created with ${sizes.length} sizes`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Conversion failed');
    } finally {
      setIsProcessing(false);
    }
  }, [file, sizes, setIsProcessing, setProgress]);

  const handleReset = useCallback(() => {
    reset();
    setFile(null);
    setResultUrl(null);
    setPreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    setSizes(DEFAULT_SIZES);
  }, [reset]);

  const download = () => {
    if (!resultUrl) return;
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = resultName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Download started');
  };

  if (!activeTool) return null;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        icon={<Square className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'PNG, JPG, or WebP Â· max 25 MB',
          'One multi-size .ico with the sizes you pick',
          'Square images give the cleanest icons',
        ]}
      />

      <div className="mt-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {!file ? (
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload an image for favicon conversion"
              onClick={() => document.getElementById('ico-file-input')?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  document.getElementById('ico-file-input')?.click();
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleSelect(e.dataTransfer.files[0]);
              }}
              className="drop-zone flex flex-col items-center justify-center p-12 rounded-2xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <input
                id="ico-file-input"
                type="file"
                accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                className="sr-only"
                onChange={(e) => handleSelect(e.target.files?.[0])}
              />
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                <Square className="w-10 h-10 text-primary" />
              </div>
              <p className="text-lg font-semibold">Upload your logo</p>
              <p className="text-sm text-muted-foreground mt-1">A square PNG of 256px or larger works best</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-6 flex flex-wrap items-center gap-4">
              {previewUrl && (
                <img src={previewUrl} alt={file.name} className="w-16 h-16 rounded-xl border border-border object-contain bg-background" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{file.name}</p>
                <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              {resultUrl && (
                <Button onClick={download} className="gap-2 btn-premium rounded-xl">
                  <Download className="w-4 h-4" /> Download .ICO
                </Button>
              )}
            </div>
          )}

          {resultUrl && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-3">
              <p className="font-semibold">favicon.ico ready</p>
              <p className="text-sm text-muted-foreground">
                Upload it to your site root and add{' '}
                <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">&lt;link rel=&quot;icon&quot; href=&quot;/favicon.ico&quot;&gt;</code>{' '}
                to your HTML head.
              </p>
              <div className="flex gap-4">
                {sizes.map((size) => (
                  <img
                    key={size}
                    src={resultUrl}
                    alt={`${size} pixel favicon preview`}
                    width={size}
                    height={size}
                    className="border border-border rounded bg-background"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden shadow-premium">
            <div className="p-5 border-b border-border/40 bg-gradient-to-r from-primary/10 to-transparent">
              <h3 className="font-bold tracking-tight text-foreground">Sizes to include</h3>
              <p className="text-sm text-muted-foreground mt-1">Browsers pick the sharpest size per surface.</p>
            </div>
            <div className="p-5 space-y-3">
              {ALL_SIZES.map((size) => (
                <div key={size} className="flex items-center gap-3">
                  <Checkbox
                    id={`ico-size-${size}`}
                    checked={sizes.includes(size)}
                    onCheckedChange={(checked) => {
                      setSizes((previous) => {
                        if (checked) return [...previous, size].sort((a, b) => a - b);
                        if (previous.length === 1) return previous;
                        return previous.filter((value) => value !== size);
                      });
                    }}
                  />
                  <Label htmlFor={`ico-size-${size}`} className="text-sm cursor-pointer">
                    {size} Ã— {size} px{size === 16 ? ' â€” browser tabs' : size === 32 ? ' â€” taskbars' : size === 256 ? ' â€” large shortcuts' : ''}
                  </Label>
                </div>
              ))}

              <Button
                className="w-full btn-premium py-6 rounded-xl font-bold shadow-xl shadow-primary/20 mt-4"
                onClick={handleConvert}
                disabled={!file || isProcessing}
                size="lg"
              >
                {isProcessing ? 'Convertingâ€¦' : 'Create favicon.ico'}
              </Button>
              <Button variant="outline" className="w-full gap-2 rounded-xl" onClick={handleReset}>
                <RotateCcw className="w-4 h-4" /> Start Over
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
