'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeftRight,
  CheckCircle2,
  Download,
  Eye,
  Image as ImageIcon,
  RotateCcw,
  Settings2,
  Split,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ResultCard } from './result-card';
import { ToolLimitNotice } from './tool-limit-notice';
import { ToolPageHeader } from './tool-page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formatInfo = {
  jpg: { name: 'JPG/JPEG', description: 'Best for photos and broad compatibility.' },
  png: { name: 'PNG', description: 'Best for graphics and transparency.' },
  webp: { name: 'WebP', description: 'Modern web format with efficient compression.' },
  avif: { name: 'AVIF', description: 'Next-generation format with excellent compression.' },
};

type OutputFormat = keyof typeof formatInfo;

function getTargetFormat(toolId: string): OutputFormat | null {
  if (toolId.includes('-to-jpg') || toolId.includes('-to-jpeg')) return 'jpg';
  if (toolId.includes('-to-png')) return 'png';
  if (toolId.includes('-to-webp')) return 'webp';
  if (toolId.includes('-to-avif')) return 'avif';
  return null;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function ComparisonSlider({ before, after }: { before: string; after: string }) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (event: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pointX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const nextPosition = ((pointX - rect.left) / rect.width) * 100;
    setSliderPos(Math.min(100, Math.max(0, nextPosition)));
  };

  const safeSliderPos = Math.max(1, Math.min(99, sliderPos));

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video cursor-col-resize overflow-hidden rounded-[1.35rem] bg-muted select-none"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
    >
      <img src={after} alt="After" className="absolute inset-0 h-full w-full object-contain" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${safeSliderPos}%`, borderRight: '2px solid white' }}>
        <img src={before} alt="Before" className="absolute inset-0 h-full w-full max-w-none object-contain" style={{ width: `${10000 / safeSliderPos}%` }} />
      </div>
      <div className="absolute inset-y-0 z-10 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.4)]" style={{ left: `${safeSliderPos}%` }}>
        <div className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg">
          <Split className="h-4 w-4 text-primary" />
        </div>
      </div>
      <div className="absolute bottom-4 left-4 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white opacity-0 transition-opacity group-hover:opacity-100">
        Before
      </div>
      <div className="absolute bottom-4 right-4 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white opacity-0 transition-opacity group-hover:opacity-100">
        After
      </div>
    </div>
  );
}

export function ConvertWorkspace() {
  const { activeTool, uploadedFile, processedImage, isProcessing, reset, setIsProcessing, setProcessedImage, setProgress } = useAppStore();
  const lockedFormat = activeTool ? getTargetFormat(activeTool.id) : null;
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(lockedFormat || 'jpg');
  const [quality, setQuality] = useState(92);
  const [viewMode, setViewMode] = useState<'preview' | 'compare'>('preview');
  const [processingStats, setProcessingStats] = useState<{ originalSize: number; processedSize: number; savedPercent: number } | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!uploadedFile) {
      setObjectUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(uploadedFile);
    setObjectUrl(nextUrl);

    if (!lockedFormat) {
      const type = uploadedFile.type;
      if (type === 'image/png') setOutputFormat('png');
      else if (type === 'image/jpeg' || type === 'image/jpg') setOutputFormat('jpg');
      else if (type === 'image/webp') setOutputFormat('webp');
      else if (type === 'image/avif') setOutputFormat('avif');
    }

    return () => URL.revokeObjectURL(nextUrl);
  }, [lockedFormat, uploadedFile]);

  useEffect(() => {
    if (lockedFormat) {
      setOutputFormat(lockedFormat);
    }
  }, [lockedFormat]);

  const sourceFormat = useMemo(() => {
    const toolId = activeTool?.id || '';
    if (toolId.includes('png-to')) return 'PNG';
    if (toolId.includes('jpg-to') || toolId.includes('jpeg-to')) return 'JPG';
    if (toolId.includes('webp-to')) return 'WebP';
    if (toolId.includes('heic-to')) return 'HEIC';
    if (toolId.includes('pdf-to')) return 'PDF';
    return 'Image';
  }, [activeTool?.id]);

  const handleProcess = useCallback(async () => {
    if (!uploadedFile) {
      toast.error('Please upload an image first');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('image', uploadedFile);
    formData.append('format', outputFormat);
    formData.append('quality', quality.toString());

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 180);

      const response = await fetch('/api/image/process', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        let message = 'Processing failed';
        try {
          const errorJson = await response.json();
          message = errorJson?.error || message;
        } catch {
          // Keep default message.
        }
        throw new Error(message);
      }

      const data = await response.json();
      setProcessedImage(data.imageUrl);
      setProcessingStats({
        originalSize: data.originalSize,
        processedSize: data.processedSize,
        savedPercent: data.savedPercent,
      });
      toast.success(`Image converted to ${formatInfo[outputFormat].name}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to convert image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [outputFormat, quality, setIsProcessing, setProcessedImage, setProgress, uploadedFile]);

  const handleDownload = useCallback(() => {
    if (!processedImage) return;

    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `converted-${Date.now()}.${outputFormat}`;
    link.click();
  }, [outputFormat, processedImage]);

  const handleReset = useCallback(() => {
    reset();
    setOutputFormat(lockedFormat || 'jpg');
    setQuality(92);
    setProcessingStats(null);
    setViewMode('preview');
  }, [lockedFormat, reset]);

  if (!activeTool) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 py-8 lg:px-8">
      <ToolPageHeader title={activeTool.name} description={activeTool.description} icon={ArrowLeftRight} onReset={handleReset}>
        {processedImage ? (
          <div className="rounded-full border border-border/60 bg-background/80 p-1 shadow-soft">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'preview' | 'compare')}>
              <TabsList className="h-9 bg-transparent">
                <TabsTrigger value="preview" className="gap-1.5 rounded-full px-3 text-xs">
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="compare" className="gap-1.5 rounded-full px-3 text-xs">
                  <Split className="h-3.5 w-3.5" />
                  Compare
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        ) : null}
      </ToolPageHeader>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <FileUpload accept={activeTool.id.includes('pdf-to') ? '.pdf' : 'image/*'} />
          <ToolLimitNotice limits={activeTool.id.includes('pdf-to') ? ['PDF input', 'Each page is exported as an image', 'Review output visually before publishing'] : ['Image input only', 'Quality setting affects file size and output fidelity', 'Choose the target format based on final use case']} />

          {uploadedFile ? (
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-border/60 bg-card/75 p-6 shadow-premium backdrop-blur-xl">
              <div className="flex flex-col items-center justify-center gap-6 text-center md:flex-row md:text-left">
                <div>
                  <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-[1.35rem] bg-muted text-lg font-bold text-muted-foreground">
                    {sourceFormat}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Source</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <motion.div animate={{ x: [0, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <ArrowLeftRight className="h-8 w-8 text-primary" />
                  </motion.div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{isProcessing ? 'Converting' : 'Ready'}</p>
                </div>
                <div>
                  <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-[1.35rem] border border-primary/20 bg-primary/10 text-lg font-bold text-primary">
                    {formatInfo[outputFormat].name.split('/')[0]}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Target</p>
                </div>
              </div>
            </motion.div>
          ) : null}

          {processedImage ? (
            <motion.div initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/75 shadow-premium backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 bg-background/75 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">Processed preview</h3>
                  </div>
                  {processingStats ? (
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-primary/20 text-primary">
                        {processingStats.savedPercent > 0 ? `Saved ${processingStats.savedPercent}%` : 'Optimized'}
                      </Badge>
                      <Badge variant="secondary">{formatBytes(processingStats.processedSize)}</Badge>
                    </div>
                  ) : null}
                </div>

                <div className="p-4">
                  {viewMode === 'compare' && objectUrl ? (
                    <ComparisonSlider before={objectUrl} after={processedImage} />
                  ) : (
                    <div className="flex aspect-video items-center justify-center rounded-[1.35rem] bg-muted/25">
                      <img src={processedImage} alt="Converted" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                </div>
              </div>

              <ResultCard
                title="Conversion complete"
                description={`Your file is ready in ${formatInfo[outputFormat].name}.`}
                onDownload={handleDownload}
                downloadLabel="Download converted file"
                primaryMeta={processingStats ? `${formatBytes(processingStats.originalSize)} to ${formatBytes(processingStats.processedSize)}` : formatInfo[outputFormat].name}
                nextActions={[
                  { label: 'Compress image', href: '/tools/compress-image' },
                  { label: 'Resize image', href: '/tools/resize-image' },
                ]}
              />
            </motion.div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-border/60 bg-card/75 p-5 shadow-premium backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Settings2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Conversion settings</h3>
                <p className="text-sm text-muted-foreground">Tune format and quality before export.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Output format</Label>
                <Select value={outputFormat} onValueChange={(value) => setOutputFormat(value as OutputFormat)} disabled={Boolean(lockedFormat)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jpg">JPG/JPEG</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="webp">WebP</SelectItem>
                    <SelectItem value="avif">AVIF</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs leading-5 text-muted-foreground">
                  {lockedFormat ? `Output format fixed to ${formatInfo[lockedFormat].name}.` : formatInfo[outputFormat].description}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>{outputFormat === 'png' ? 'Compression level' : 'Quality'}</Label>
                  <span className="text-sm font-mono text-primary">{quality}%</span>
                </div>
                <Slider value={[quality]} onValueChange={([value]) => setQuality(value)} min={10} max={100} step={5} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Smaller file</span>
                  <span>Higher fidelity</span>
                </div>
              </div>

              {!lockedFormat ? (
                <div className="space-y-2">
                  {Object.entries(formatInfo).map(([key, info]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setOutputFormat(key as OutputFormat)}
                      className={`w-full rounded-2xl border p-3 text-left transition-colors ${outputFormat === key
                        ? 'border-primary/30 bg-primary/6'
                        : 'border-border/60 bg-background/75 hover:border-primary/20'
                        }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-foreground">{info.name}</span>
                        {outputFormat === key ? <Badge variant="secondary">Selected</Badge> : null}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{info.description}</p>
                    </button>
                  ))}
                </div>
              ) : null}

              <Button className="btn-premium h-12 w-full rounded-2xl" onClick={handleProcess} disabled={!uploadedFile || isProcessing}>
                {isProcessing ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="mr-2 h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    Converting...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Convert image
                  </>
                )}
              </Button>

              <Button variant="outline" className="h-11 w-full rounded-2xl" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Start over
              </Button>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border/60 bg-card/75 p-5 shadow-soft backdrop-blur-xl">
            <h4 className="font-bold text-foreground">Format guide</h4>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              <li><strong>JPG:</strong> photos, websites, and compatibility-first output.</li>
              <li><strong>PNG:</strong> logos, UI assets, and transparency.</li>
              <li><strong>WebP / AVIF:</strong> modern delivery when file size matters most.</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
