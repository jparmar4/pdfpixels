'use client';

import { useCallback, useRef, useState } from 'react';
import { Check, Code2, Copy, RotateCcw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActiveTool } from '@/hooks/use-active-tool';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { toast } from 'sonner';

type OutputFormat = 'datauri' | 'html' | 'css' | 'json';

const FORMAT_META: Record<OutputFormat, { label: string; language: string }> = {
  datauri: { label: 'Data URI', language: 'text' },
  html: { label: 'HTML <img>', language: 'html' },
  css: { label: 'CSS url()', language: 'css' },
  json: { label: 'JSON', language: 'json' },
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ImageToBase64Workspace() {
  const { activeTool } = useActiveTool();
  const [source, setSource] = useState<{ name: string; mime: string; size: number; dataUrl: string } | null>(null);
  const [format, setFormat] = useState<OutputFormat>('datauri');
  const [copied, setCopied] = useState<OutputFormat | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Keep images under 10MB — Base64 output becomes unwieldy beyond that.');
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    setSource({ name: file.name, mime: file.type || 'image/png', size: file.size, dataUrl });
  }, []);

  const snippet = (() => {
    if (!source) return '';
    const uri = source.dataUrl;
    switch (format) {
      case 'html':
        return `<img src="${uri}" alt="${source.name.replace(/"/g, '')}" />`;
      case 'css':
        return `background-image: url("${uri}");`;
      case 'json':
        return JSON.stringify(uri);
      default:
        return uri;
    }
  })();

  const base64Bytes = source ? source.dataUrl.length - source.dataUrl.indexOf(',') - 1 : 0;

  const copy = async (value: string, key: OutputFormat) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    toast.success(`${FORMAT_META[key].label} copied`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleReset = useCallback(() => {
    setSource(null);
    setCopied(null);
  }, []);

  if (!activeTool) return null;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        icon={<Code2 className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'Runs 100% in your browser — the image is never uploaded',
          'Images up to 10 MB · PNG, JPG, WebP, GIF, SVG',
          'Base64 output is ~33% larger than the original file',
        ]}
      />

      {!source ? (
        <div className="mt-8">
          <div
            role="button"
            tabIndex={0}
            aria-label="Choose an image to encode"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) void handleFile(file);
            }}
            className="drop-zone flex flex-col items-center justify-center p-12 rounded-2xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            <p className="text-lg font-semibold">Choose an image</p>
            <p className="text-sm text-muted-foreground mt-1">Drag, drop, or click — nothing leaves your device</p>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="bg-card border rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={source.dataUrl}
                alt={source.name}
                className="w-12 h-12 rounded-lg border border-border object-contain bg-background"
              />
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate max-w-[240px]">{source.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(source.size)} → Base64 {formatBytes(base64Bytes)} (
                  {Math.round((base64Bytes / Math.max(1, source.size) - 1) * 100)}% overhead)
                </p>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={handleReset} className="text-xs text-muted-foreground">
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Choose another
            </Button>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Output format">
                {(Object.keys(FORMAT_META) as OutputFormat[]).map((key) => (
                  <Button
                    key={key}
                    size="sm"
                    variant={format === key ? 'default' : 'outline'}
                    className="h-8 rounded-lg text-xs"
                    onClick={() => setFormat(key)}
                    aria-pressed={format === key}
                  >
                    {FORMAT_META[key].label}
                  </Button>
                ))}
              </div>
              <Button size="sm" onClick={() => copy(snippet, format)} className="gap-1.5 text-xs">
                {copied === format ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                Copy
              </Button>
            </div>
            <textarea
              readOnly
              value={snippet}
              rows={8}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full bg-transparent font-mono text-xs md:text-sm leading-relaxed outline-none resize-y p-4 text-foreground/90 select-text"
              aria-label={`Base64 output as ${FORMAT_META[format].label}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
