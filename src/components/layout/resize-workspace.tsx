'use client';

import { motion } from 'framer-motion';
import { Download, RotateCcw, Maximize2, Link2, Unlink, ChevronRight, Sparkles, Ruler, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { ToolPageHeader } from './tool-page-header';

interface ResizeResult {
  imageUrl: string;
  originalDimensions: { width: number; height: number };
  newDimensions: { width: number; height: number };
}

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

  // Calculate aspect ratio
  const aspectRatio = originalDimensions.width / originalDimensions.height || 1;

  // Update original dimensions when file is uploaded
  useEffect(() => {
    if (uploadedFile && uploadedFile.type.startsWith('image/')) {
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
        setWidth(img.width);
        setHeight(img.height);
      };
      img.src = URL.createObjectURL(uploadedFile);
    }
  }, [uploadedFile]);

  const handleWidthChange = useCallback((newWidth: number) => {
    setWidth(newWidth);
    if (maintainRatio && newWidth > 0) {
      setHeight(Math.round(newWidth / aspectRatio));
    }
  }, [maintainRatio, aspectRatio]);

  const handleHeightChange = useCallback((newHeight: number) => {
    setHeight(newHeight);
    if (maintainRatio && newHeight > 0) {
      setWidth(Math.round(newHeight * aspectRatio));
    }
  }, [maintainRatio, aspectRatio]);

  const handleScaleChange = useCallback((percent: number) => {
    setScalePercent(percent);
    if (originalDimensions.width > 0 && originalDimensions.height > 0) {
      setWidth(Math.round(originalDimensions.width * percent / 100));
      setHeight(Math.round(originalDimensions.height * percent / 100));
    }
  }, [originalDimensions]);

  const handleProcess = useCallback(async () => {
    if (!uploadedFile) {
      toast.error('Please upload an image first');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    // Convert cm/inch to pixels if needed
    let pixelWidth = width;
    let pixelHeight = height;

    if (unit === 'cm') {
      pixelWidth = Math.round((width / 2.54) * dpi);
      pixelHeight = Math.round((height / 2.54) * dpi);
    } else if (unit === 'inch') {
      pixelWidth = Math.round(width * dpi);
      pixelHeight = Math.round(height * dpi);
    }

    const formData = new FormData();
    formData.append('image', uploadedFile);
    formData.append('width', pixelWidth.toString());
    formData.append('height', pixelHeight.toString());

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
        throw new Error('Processing failed');
      }

      const data = await response.json();

      setResult({
        imageUrl: data.imageUrl,
        originalDimensions: data.originalDimensions,
        newDimensions: { width: pixelWidth, height: pixelHeight }
      });

      setProcessedImage(data.imageUrl);
      toast.success(`Image resized to ${pixelWidth}×${pixelHeight} pixels!`);
    } catch {
      toast.error('Failed to resize image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedFile, width, height, unit, dpi, setIsProcessing, setProcessedImage, setProgress]);

  const handleDownload = useCallback(() => {
    if (processedImage) {
      const link = document.createElement('a');
      link.href = processedImage;
      link.download = `resized-${width}x${height}-${Date.now()}.jpg`;
      link.click();
    }
  }, [processedImage, width, height]);

  const handleReset = useCallback(() => {
    reset();
    window.history.pushState({}, '', window.location.pathname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setResult(null);
  }, [reset]);

  if (!activeTool) return null;

  // Preset sizes for common formats
  const presetSizes = [
    { name: 'Passport 3.5×4.5 cm', width: 3.5, height: 4.5, unit: 'cm' as const, dpi: 300 },
    { name: 'Passport 35×45 mm', width: 3.5, height: 4.5, unit: 'cm' as const, dpi: 300 },
    { name: '2×2 Inch (US Passport)', width: 2, height: 2, unit: 'inch' as const, dpi: 300 },
    { name: '4×6 Inch (Photo Print)', width: 4, height: 6, unit: 'inch' as const, dpi: 300 },
    { name: 'HD 1920×1080', width: 1920, height: 1080, unit: 'px' as const },
    { name: 'Full HD 1920×1080', width: 1920, height: 1080, unit: 'px' as const },
    { name: 'Square 1000×1000', width: 1000, height: 1000, unit: 'px' as const },
    { name: 'Instagram Post', width: 1080, height: 1080, unit: 'px' as const },
    { name: 'Instagram Story', width: 1080, height: 1920, unit: 'px' as const },
    { name: 'YouTube Thumbnail', width: 1280, height: 720, unit: 'px' as const },
    { name: 'Facebook Cover', width: 820, height: 312, unit: 'px' as const },
    { name: 'LinkedIn Banner', width: 1584, height: 396, unit: 'px' as const },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 lg:px-8 py-8"
    >
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        icon={Maximize2}
        onReset={handleReset}
      >
        {processedImage && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button onClick={handleDownload} className="gap-2 btn-glow">
              <Download className="w-4 h-4" />
              Download
            </Button>
          </motion.div>
        )}
      </ToolPageHeader>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Panel - Upload & Preview */}
        <div className="lg:col-span-2 space-y-6">
          <FileUpload />

          {originalDimensions.width > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-2 gap-4"
            >
              {/* Original Size */}
              <div className="p-4 rounded-2xl border border-border bg-card">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <Ruler className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">Original Size</span>
                </div>
                <div className="text-2xl font-bold">
                  {originalDimensions.width} × {originalDimensions.height}
                  <span className="text-sm font-normal text-muted-foreground ml-1">px</span>
                </div>
              </div>

              {/* New Size */}
              <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Maximize2 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-primary">New Size</span>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {width} × {height}
                  <span className="text-sm font-normal text-primary/70 ml-1">{unit}</span>
                </div>
              </div>
            </motion.div>
          )}

          {result && processedImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border overflow-hidden bg-card"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-medium">Resized Image</h3>
                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20">
                  {result.newDimensions.width}×{result.newDimensions.height} px
                </Badge>
              </div>
              <div className="aspect-video bg-muted/50 flex items-center justify-center">
                <img
                  src={processedImage}
                  alt="Resized"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Panel - Settings */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
              <h3 className="font-semibold flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-primary" />
                Resize Settings
              </h3>
            </div>

            <div className="p-4 space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="dimensions">Size</TabsTrigger>
                  <TabsTrigger value="presets">Presets</TabsTrigger>
                  <TabsTrigger value="scale">Scale</TabsTrigger>
                </TabsList>

                <TabsContent value="dimensions" className="space-y-4 mt-4">
                  {/* Unit Selection */}
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select value={unit} onValueChange={(v) => setUnit(v as typeof unit)}>
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

                  {/* DPI for cm/inch */}
                  {(unit === 'cm' || unit === 'inch') && (
                    <div className="space-y-2">
                      <Label>DPI (Resolution)</Label>
                      <Select value={dpi.toString()} onValueChange={(v) => setDpi(parseInt(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="72">72 DPI (Web)</SelectItem>
                          <SelectItem value="96">96 DPI (Screen)</SelectItem>
                          <SelectItem value="150">150 DPI</SelectItem>
                          <SelectItem value="300">300 DPI (Print)</SelectItem>
                          <SelectItem value="600">600 DPI (High Quality)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Dimensions */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Width</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={width}
                          onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                          className="pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          {unit}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Height</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={height}
                          onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                          className="pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          {unit}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Maintain Ratio */}
                  <Button
                    variant={maintainRatio ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMaintainRatio(!maintainRatio)}
                    className="w-full gap-2"
                  >
                    {maintainRatio ? <Link2 className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
                    Maintain Aspect Ratio
                  </Button>
                </TabsContent>

                <TabsContent value="presets" className="space-y-3 mt-4 max-h-80 overflow-y-auto">
                  {presetSizes.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        setWidth(preset.width);
                        setHeight(preset.height);
                        setUnit(preset.unit);
                        if (preset.dpi) setDpi(preset.dpi);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-accent transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Maximize2 className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-sm">{preset.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {preset.width}×{preset.height} {preset.unit}
                      </span>
                    </button>
                  ))}
                </TabsContent>

                <TabsContent value="scale" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Scale Percentage</Label>
                      <span className="text-sm font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">{scalePercent}%</span>
                    </div>
                    <Slider
                      value={[scalePercent]}
                      onValueChange={([v]) => handleScaleChange(v)}
                      min={10}
                      max={200}
                      step={5}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>10%</span>
                      <span>Original</span>
                      <span>200%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[25, 50, 75, 100, 125, 150, 175, 200].map((pct) => (
                      <Button
                        key={pct}
                        variant={scalePercent === pct ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleScaleChange(pct)}
                        className="text-xs"
                      >
                        {pct}%
                      </Button>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="pt-4 space-y-3">
                <Button
                  className="w-full btn-glow"
                  onClick={handleProcess}
                  disabled={!uploadedFile || isProcessing}
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"
                      />
                      Resizing...
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-4 h-4 mr-2" />
                      Resize Image
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleReset}
                >
                  <RotateCcw className="w-4 h-4" />
                  Start Over
                </Button>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-4 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Resize Tips
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Use pixels for web and digital images</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Use cm/inch with 300 DPI for print</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Upscaling may reduce image quality</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
