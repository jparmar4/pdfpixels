'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeftRight,
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
import { InContentAd } from '@/components/ads/ad-banner';
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
const PDF_OUTPUT_FORMATS: OutputFormat[] = ['jpg', 'png', 'webp'];

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
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

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
    if (toolId.includes('svg-to')) return 'SVG';
    return 'Image';
  }, [activeTool?.id]);

  const isPdfToImage = activeTool?.id === 'pdf-to-image';
  const [dpi, setDpi] = useState(150);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [convertedPageCount, setConvertedPageCount] = useState(0);
  const availableFormats = useMemo(
    () => (isPdfToImage ? PDF_OUTPUT_FORMATS : (Object.keys(formatInfo) as OutputFormat[])),
    [isPdfToImage],
  );

  useEffect(() => {
    if (!isPdfToImage || !uploadedFile) {
      setPdfPageCount(0);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { PDFDocument } = await import('pdf-lib');
        const bytes = await uploadedFile.arrayBuffer();
        const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
        if (!cancelled) setPdfPageCount(pdf.getPageCount());
      } catch {
        if (!cancelled) setPdfPageCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isPdfToImage, uploadedFile]);

  useEffect(() => {
    if (isPdfToImage && !PDF_OUTPUT_FORMATS.includes(outputFormat)) {
      setOutputFormat('jpg');
    }
  }, [isPdfToImage, outputFormat]);

  const revokeBlobUrls = useCallback(() => {
    if (downloadUrl?.startsWith('blob:')) URL.revokeObjectURL(downloadUrl);
    if (processedImage?.startsWith('blob:')) URL.revokeObjectURL(processedImage);
  }, [downloadUrl, processedImage]);

  const handleProcess = useCallback(async () => {
    if (!uploadedFile) {
      toast.error(isPdfToImage ? 'Please upload a PDF first' : 'Please upload an image first');
      return;
    }

    const safeFormat = isPdfToImage && !PDF_OUTPUT_FORMATS.includes(outputFormat) ? 'jpg' : outputFormat;

    setIsProcessing(true);
    setProgress(0);
    revokeBlobUrls();
    setDownloadUrl(null);

    const formData = new FormData();
    formData.append('file', uploadedFile);
    formData.append('format', safeFormat);
    formData.append('quality', quality.toString());

    // PDF-to-image uses a different API endpoint
    if (isPdfToImage) {
      formData.append('dpi', dpi.toString());
      formData.append('pages', 'all');
    } else {
      formData.append('image', uploadedFile);
    }

    let progressInterval: ReturnType<typeof setInterval> | undefined;
    try {
      progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 180);

      const endpoint = isPdfToImage ? '/api/pdf/to-image' : '/api/image/process';
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

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

      if (isPdfToImage) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/zip')) {
          const JSZip = (await import('jszip')).default;
          const blob = await response.blob();
          const zipUrl = URL.createObjectURL(blob);
          setDownloadUrl(zipUrl);
          
          const zip = new JSZip();
          const unzipped = await zip.loadAsync(blob);
          const files = Object.values(unzipped.files).filter(f => !f.dir);
          
          if (files.length > 0) {
            const firstFile = files[0];
            const firstBlob = await firstFile.async('blob');
            const previewUrl = URL.createObjectURL(firstBlob);
            setProcessedImage(previewUrl);
            setProcessingStats({
              originalSize: uploadedFile.size,
              processedSize: blob.size,
              savedPercent: 0,
            });
            setViewMode('preview');
            const convertedPages = Number(response.headers.get('x-converted-pages') || files.length);
            setConvertedPageCount(convertedPages);
            toast.success(`Converted ${convertedPages} page(s) to ${formatInfo[safeFormat].name}.`);
            requestAnimationFrame(() => {
              document.getElementById('pdf-to-image-result')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
          } else {
            throw new Error('No images found in the response.');
          }
        } else {
          // Fallback if not zip
          const data = await response.json();
          if (data.images && data.images.length > 0) {
            setProcessedImage(data.images[0].imageUrl);
            setConvertedPageCount(Number(data.convertedPages || data.images.length));
            setProcessingStats({
              originalSize: uploadedFile.size,
              processedSize: data.images[0].size || 0,
              savedPercent: 0,
            });
            toast.success(`Converted ${data.convertedPages || data.images.length} page(s) to images.`);
            requestAnimationFrame(() => {
              document.getElementById('pdf-to-image-result')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
          } else {
            throw new Error('No pages could be converted from the PDF.');
          }
        }
      } else {
        const data = await response.json();
        setProcessedImage(data.imageUrl);
        setProcessingStats({
          originalSize: data.originalSize,
          processedSize: data.processedSize,
          savedPercent: data.savedPercent,
        });
        toast.success(`Image converted to ${formatInfo[safeFormat].name}.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (isPdfToImage ? 'Failed to convert PDF. Please try again.' : 'Failed to convert image. Please try again.'));
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      setIsProcessing(false);
    }
  }, [isPdfToImage, outputFormat, quality, dpi, revokeBlobUrls, setIsProcessing, setProcessedImage, setProgress, uploadedFile]);

  const handleDownload = useCallback(() => {
    if (!processedImage && !downloadUrl) return;

    const base = uploadedFile?.name?.replace(/\.[^.]+$/, '') || 'converted';
    const link = document.createElement('a');
    link.href = downloadUrl || processedImage || '';
    link.download = isPdfToImage
      ? `${base}-pages.zip`
      : `${base}.${outputFormat === 'jpg' ? 'jpg' : outputFormat}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Download started');
  }, [outputFormat, processedImage, downloadUrl, isPdfToImage, uploadedFile]);

  const handleReset = useCallback(() => {
    revokeBlobUrls();
    reset();
    setOutputFormat(lockedFormat || (isPdfToImage ? 'jpg' : 'jpg'));
    setQuality(isPdfToImage ? 90 : 92);
    setDpi(150);
    setProcessingStats(null);
    setViewMode('preview');
    setDownloadUrl(null);
    setPdfPageCount(0);
    setConvertedPageCount(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [isPdfToImage, lockedFormat, reset, revokeBlobUrls]);

  if (!activeTool) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 py-8 lg:px-8">
      <ToolPageHeader title={activeTool.name} description={activeTool.description} icon={ArrowLeftRight} onReset={handleReset}>
        {processedImage && !isPdfToImage ? (
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
          <FileUpload accept={activeTool.id.includes('pdf-to') ? '.pdf,application/pdf' : 'image/*'} maxSizeMb={25} />
          <ToolLimitNotice
            limits={
              isPdfToImage
                ? ['PDF only · max 25 MB', 'Up to 10 pages per conversion', 'ZIP download for multi-page', 'JPG / PNG / WebP']
                : ['Image input only', 'Quality affects size & fidelity', 'Pick format for your use case']
            }
          />

          {uploadedFile ? (
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-border/60 bg-card/75 p-6 shadow-premium backdrop-blur-xl">
              {isPdfToImage ? (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/50 bg-background/70 px-3 py-2.5 text-sm">
                  <span className="font-medium truncate max-w-[60%]">{uploadedFile.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatBytes(uploadedFile.size)}
                    {pdfPageCount > 0 ? ` · ${pdfPageCount} page${pdfPageCount === 1 ? '' : 's'}` : ''}
                  </span>
                </div>
              ) : null}
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
            <motion.div
              id="pdf-to-image-result"
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/75 shadow-premium backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 bg-background/75 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">
                      {isPdfToImage ? 'Page preview' : 'Processed preview'}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isPdfToImage && convertedPageCount > 0 ? (
                      <Badge variant="secondary">
                        {convertedPageCount} page{convertedPageCount === 1 ? '' : 's'}
                      </Badge>
                    ) : null}
                    {processingStats ? (
                      <>
                        <Badge variant="outline" className="border-primary/20 text-primary">
                          {processingStats.savedPercent > 0 ? `Saved ${processingStats.savedPercent}%` : formatInfo[outputFormat].name}
                        </Badge>
                        {processingStats.processedSize > 0 ? (
                          <Badge variant="secondary">{formatBytes(processingStats.processedSize)}</Badge>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="p-4">
                  {viewMode === 'compare' && objectUrl && !isPdfToImage ? (
                    <ComparisonSlider before={objectUrl} after={processedImage} />
                  ) : (
                    <div className="flex aspect-video items-center justify-center rounded-[1.35rem] bg-muted/25">                      <img src={processedImage} alt="Converted" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                </div>
                {isPdfToImage && convertedPageCount > 1 ? (
                  <p className="border-t border-border/40 px-5 py-2.5 text-xs text-muted-foreground">
                    Preview shows page 1. Download the ZIP for all {convertedPageCount} pages.
                  </p>
                ) : null}
              </div>

              <ResultCard
                title={isPdfToImage ? 'PDF converted to images' : 'Conversion complete'}
                description={
                  isPdfToImage
                    ? `Pages exported as ${formatInfo[outputFormat].name}${convertedPageCount > 1 ? ' in a ZIP archive' : ''}.`
                    : `Your file is ready in ${formatInfo[outputFormat].name}.`
                }
                onDownload={handleDownload}
                downloadLabel={
                  isPdfToImage && (downloadUrl || convertedPageCount > 1)
                    ? 'Download ZIP of images'
                    : 'Download converted file'
                }
                primaryMeta={
                  isPdfToImage
                    ? `${convertedPageCount || pdfPageCount || '—'} page(s) · ${dpi} DPI · ${formatInfo[outputFormat].name}`
                    : processingStats
                      ? `${formatBytes(processingStats.originalSize)} to ${formatBytes(processingStats.processedSize)}`
                      : formatInfo[outputFormat].name
                }
                nextActions={
                  isPdfToImage
                    ? [
                        { label: 'Compress PDF', href: '/tools/compress-pdf' },
                        { label: 'Merge PDF', href: '/tools/merge-pdf' },
                      ]
                    : [
                        { label: 'Compress image', href: '/tools/compress-image' },
                        { label: 'Resize image', href: '/tools/resize-image' },
                      ]
                }
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
                    {availableFormats.map((key) => (
                      <SelectItem key={key} value={key}>
                        {formatInfo[key].name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs leading-5 text-muted-foreground">
                  {lockedFormat
                    ? `Output format fixed to ${formatInfo[lockedFormat].name}.`
                    : isPdfToImage
                      ? 'PDF pages export as JPG, PNG, or WebP.'
                      : formatInfo[outputFormat].description}
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
                  {availableFormats.map((key) => {
                    const info = formatInfo[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setOutputFormat(key)}
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
                    );
                  })}
                </div>
              ) : null}

              {isPdfToImage ? (
                <div className="space-y-2">
                  <Label>Resolution (DPI)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { v: 72, label: '72', hint: 'Fast' },
                      { v: 150, label: '150', hint: 'Balanced' },
                      { v: 200, label: '200', hint: 'Sharp' },
                      { v: 300, label: '300', hint: 'Print' },
                    ].map((item) => (
                      <button
                        key={item.v}
                        type="button"
                        onClick={() => setDpi(item.v)}
                        className={`rounded-xl border p-2.5 text-left transition-colors ${
                          dpi === item.v
                            ? 'border-primary/40 bg-primary/8 ring-1 ring-primary/20'
                            : 'border-border/60 bg-background/70 hover:border-primary/25'
                        }`}
                      >
                        <p className="text-sm font-bold tabular-nums">{item.label} DPI</p>
                        <p className="text-[10px] text-muted-foreground">{item.hint}</p>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Higher DPI = more detail and larger files. Max 10 pages per run.
                  </p>
                </div>
              ) : null}

              <Button className="btn-premium h-12 w-full rounded-2xl" onClick={handleProcess} disabled={!uploadedFile || isProcessing}>
                {isProcessing ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="mr-2 h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    {isPdfToImage ? 'Converting PDF…' : 'Converting…'}
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    {isPdfToImage
                      ? `Convert to ${formatInfo[outputFormat].name.split('/')[0]}${pdfPageCount > 0 ? ` (${Math.min(pdfPageCount, 10)} pg)` : ''}`
                      : 'Convert image'}
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
          
          <div className="rounded-[1.75rem] border border-border/60 bg-card/75 p-4 shadow-soft backdrop-blur-xl">
            <InContentAd />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
