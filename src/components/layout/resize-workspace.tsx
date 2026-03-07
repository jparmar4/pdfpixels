'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Download,
  Link2,
  Maximize2,
  RefreshCw,
  Ruler,
  Settings2,
  Sparkles,
  Unlink,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface ResizeResult {
  imageUrl: string;
  originalDimensions: { width: number; height: number };
  newDimensions: { width: number; height: number };
}

const presetSizes = [
  { name: 'Passport 3.5 x 4.5 cm', width: 3.5, height: 4.5, unit: 'cm' as const, dpi: 300 },
  { name: 'Passport 35 x 45 mm', width: 3.5, height: 4.5, unit: 'cm' as const, dpi: 300 },
  { name: '2 x 2 inch passport', width: 2, height: 2, unit: 'inch' as const, dpi: 300 },
  { name: '4 x 6 inch print', width: 4, height: 6, unit: 'inch' as const, dpi: 300 },
  { name: 'HD 1920 x 1080', width: 1920, height: 1080, unit: 'px' as const },
  { name: 'Square 1000 x 1000', width: 1000, height: 1000, unit: 'px' as const },
  { name: 'Instagram post', width: 1080, height: 1080, unit: 'px' as const },
  { name: 'Instagram story', width: 1080, height: 1920, unit: 'px' as const },
  { name: 'YouTube thumbnail', width: 1280, height: 720, unit: 'px' as const },
  { name: 'LinkedIn banner', width: 1584, height: 396, unit: 'px' as const },
];

export function ResizeWorkspace() {
  const { activeTool, uploadedFile, processedImage, isProcessing, reset, setIsProcessing, setProcessedImage, setProgress } = useAppStore();
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [maintainRatio, setMaintainRatio] = useState(true);
  const [unit, setUnit] = useState<'px' | 'cm' | 'inch'>('px');
  const [dpi, setDpi] = useState(300);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [activeTab, setActiveTab] = useState('dimensions');
  const [scalePercent, setScalePercent] = useState(100);
  const [result, setResult] = useState<ResizeResult | null>(null);

  const aspectRatio = originalDimensions.width / originalDimensions.height || 1;

  useEffect(() => {
    if (!uploadedFile || !uploadedFile.type.startsWith('image/')) {
      setOriginalDimensions({ width: 0, height: 0 });
      return;
    }

    const image = new Image();
    const objectUrl = URL.createObjectURL(uploadedFile);
    image.onload = () => {
      setOriginalDimensions({ width: image.width, height: image.height });
      setWidth(image.width);
      setHeight(image.height);
      setScalePercent(100);
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => URL.revokeObjectURL(objectUrl);
    image.src = objectUrl;

    return () => URL.revokeObjectURL(objectUrl);
  }, [uploadedFile]);

  const handleWidthChange = useCallback((nextWidth: number) => {
    setWidth(nextWidth);
    if (maintainRatio && nextWidth > 0) {
      setHeight(Math.round(nextWidth / aspectRatio));
    }
  }, [aspectRatio, maintainRatio]);

  const handleHeightChange = useCallback((nextHeight: number) => {
    setHeight(nextHeight);
    if (maintainRatio && nextHeight > 0) {
      setWidth(Math.round(nextHeight * aspectRatio));
    }
  }, [aspectRatio, maintainRatio]);

  const handleScaleChange = useCallback((percent: number) => {
    setScalePercent(percent);
    if (originalDimensions.width > 0 && originalDimensions.height > 0) {
      setWidth(Math.round(originalDimensions.width * percent / 100));
      setHeight(Math.round(originalDimensions.height * percent / 100));
    }
  }, [originalDimensions]);

  const pixelDimensions = useMemo(() => {
    if (unit === 'cm') {
      return {
        width: Math.round((width / 2.54) * dpi),
        height: Math.round((height / 2.54) * dpi),
      };
    }

    if (unit === 'inch') {
      return {
        width: Math.round(width * dpi),
        height: Math.round(height * dpi),
      };
    }

    return { width, height };
  }, [dpi, height, unit, width]);

  const handleProcess = useCallback(async () => {
    if (!uploadedFile) {
      toast.error('Please upload an image first');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('image', uploadedFile);
    formData.append('width', pixelDimensions.width.toString());
    formData.append('height', pixelDimensions.height.toString());

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 8, 90));
      }, 150);

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
      setResult({
        imageUrl: data.imageUrl,
        originalDimensions: data.originalDimensions,
        newDimensions: { width: pixelDimensions.width, height: pixelDimensions.height },
      });
      setProcessedImage(data.imageUrl);
      toast.success(`Image resized to ${pixelDimensions.width} x ${pixelDimensions.height} pixels.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to resize image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [pixelDimensions.height, pixelDimensions.width, setIsProcessing, setProcessedImage, setProgress, uploadedFile]);

  const handleDownload = useCallback(() => {
    if (!processedImage) return;

    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `resized-${pixelDimensions.width}x${pixelDimensions.height}-${Date.now()}.jpg`;
    link.click();
  }, [pixelDimensions.height, pixelDimensions.width, processedImage]);

  const handleReset = useCallback(() => {
    reset();
    setResult(null);
    setScalePercent(100);
  }, [reset]);

  if (!activeTool) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 py-8 lg:px-8">
      <ToolPageHeader title={activeTool.name} description={activeTool.description} icon={Maximize2} onReset={handleReset}>
        {processedImage ? (
          <Button onClick={handleDownload} className="btn-premium rounded-2xl">
            <Download className="h-4 w-4" />
            Download
          </Button>
        ) : null}
      </ToolPageHeader>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <FileUpload />
          <ToolLimitNotice limits={['Image input only', 'Use pixels for digital delivery', 'Use cm or inch with DPI for print sizing']} />

          {originalDimensions.width > 0 ? (
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-border/60 bg-card/75 p-5 shadow-soft backdrop-blur-xl">
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Ruler className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Original size</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {originalDimensions.width} x {originalDimensions.height}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">px</span>
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-primary/20 bg-primary/6 p-5 shadow-soft">
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Maximize2 className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-primary">Output size</span>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {width} x {height}
                  <span className="ml-1 text-sm font-normal text-primary/70">{unit}</span>
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-primary/70">
                  {pixelDimensions.width} x {pixelDimensions.height} px effective output
                </p>
              </div>
            </motion.div>
          ) : null}

          {result && processedImage ? (
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/75 shadow-premium backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3 border-b border-border/40 bg-background/75 px-5 py-4">
                  <h3 className="font-semibold text-foreground">Resized preview</h3>
                  <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300">
                    {result.newDimensions.width} x {result.newDimensions.height} px
                  </Badge>
                </div>
                <div className="flex aspect-video items-center justify-center bg-muted/30 p-4">
                  <img src={processedImage} alt="Resized" className="max-h-full max-w-full object-contain" />
                </div>
              </div>

              <ResultCard
                title="Resize complete"
                description="Your image now matches the target dimensions and is ready for export."
                onDownload={handleDownload}
                downloadLabel="Download resized image"
                primaryMeta={`${result.originalDimensions.width} x ${result.originalDimensions.height} px -> ${result.newDimensions.width} x ${result.newDimensions.height} px`}
                nextActions={[
                  { label: 'Compress image', href: '/tools/compress-image' },
                  { label: 'Convert format', href: '/tools/png-to-jpeg' },
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
                <h3 className="font-bold text-foreground">Resize settings</h3>
                <p className="text-sm text-muted-foreground">Control dimensions, presets, and scaling.</p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 rounded-2xl">
                <TabsTrigger value="dimensions">Size</TabsTrigger>
                <TabsTrigger value="presets">Presets</TabsTrigger>
                <TabsTrigger value="scale">Scale</TabsTrigger>
              </TabsList>

              <TabsContent value="dimensions" className="mt-5 space-y-4">
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select value={unit} onValueChange={(value) => setUnit(value as typeof unit)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="px">Pixels (px)</SelectItem>
                      <SelectItem value="cm">Centimeters (cm)</SelectItem>
                      <SelectItem value="inch">Inches</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {unit === 'cm' || unit === 'inch' ? (
                  <div className="space-y-2">
                    <Label>DPI</Label>
                    <Select value={dpi.toString()} onValueChange={(value) => setDpi(Number.parseInt(value, 10))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="72">72 DPI (Web)</SelectItem>
                        <SelectItem value="96">96 DPI (Screen)</SelectItem>
                        <SelectItem value="150">150 DPI</SelectItem>
                        <SelectItem value="300">300 DPI (Print)</SelectItem>
                        <SelectItem value="600">600 DPI (High quality)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Width</Label>
                    <div className="relative">
                      <Input type="number" value={width} onChange={(event) => handleWidthChange(Number.parseFloat(event.target.value) || 0)} className="pr-12" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{unit}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Height</Label>
                    <div className="relative">
                      <Input type="number" value={height} onChange={(event) => handleHeightChange(Number.parseFloat(event.target.value) || 0)} className="pr-12" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{unit}</span>
                    </div>
                  </div>
                </div>

                <Button variant={maintainRatio ? 'default' : 'outline'} size="sm" className="w-full rounded-2xl" onClick={() => setMaintainRatio((current) => !current)}>
                  {maintainRatio ? <Link2 className="mr-2 h-4 w-4" /> : <Unlink className="mr-2 h-4 w-4" />}
                  Maintain aspect ratio
                </Button>
              </TabsContent>

              <TabsContent value="presets" className="mt-5 space-y-3 max-h-80 overflow-y-auto">
                {presetSizes.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setWidth(preset.width);
                      setHeight(preset.height);
                      setUnit(preset.unit);
                      if (preset.dpi) setDpi(preset.dpi);
                    }}
                    className="flex w-full items-center justify-between rounded-2xl border border-border/60 bg-background/75 p-3 text-left transition-colors hover:border-primary/20"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{preset.name}</p>
                      <p className="text-sm text-muted-foreground">{preset.width} x {preset.height} {preset.unit}</p>
                    </div>
                    <Maximize2 className="h-4 w-4 text-primary" />
                  </button>
                ))}
              </TabsContent>

              <TabsContent value="scale" className="mt-5 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Scale percentage</Label>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-sm font-mono text-primary">{scalePercent}%</span>
                  </div>
                  <Slider value={[scalePercent]} onValueChange={([value]) => handleScaleChange(value)} min={10} max={200} step={5} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>10%</span>
                    <span>Original</span>
                    <span>200%</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 75, 100, 125, 150, 175, 200].map((percent) => (
                    <Button key={percent} variant={scalePercent === percent ? 'default' : 'outline'} size="sm" className="text-xs" onClick={() => handleScaleChange(percent)}>
                      {percent}%
                    </Button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 space-y-3">
              <Button className="btn-premium h-12 w-full rounded-2xl" onClick={handleProcess} disabled={!uploadedFile || isProcessing}>
                {isProcessing ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="mr-2 h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    Resizing...
                  </>
                ) : (
                  <>
                    <Maximize2 className="mr-2 h-4 w-4" />
                    Resize image
                  </>
                )}
              </Button>

              <Button variant="outline" className="h-11 w-full rounded-2xl" onClick={handleReset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Start over
              </Button>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border/60 bg-card/75 p-5 shadow-soft backdrop-blur-xl">
            <h4 className="font-bold text-foreground">Resize tips</h4>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              <li className="flex items-start gap-2"><ChevronRight className="mt-1 h-4 w-4 shrink-0 text-primary" />Use pixels for digital delivery and app uploads.</li>
              <li className="flex items-start gap-2"><ChevronRight className="mt-1 h-4 w-4 shrink-0 text-primary" />Use centimeters or inches with 300 DPI for print workflows.</li>
              <li className="flex items-start gap-2"><ChevronRight className="mt-1 h-4 w-4 shrink-0 text-primary" />Upscaling can soften detail if the source image is small.</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
