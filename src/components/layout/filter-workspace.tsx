'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Download, RotateCcw, Sparkles, ChevronRight, RefreshCw, Wand2, Sun, Contrast, Droplets, Circle, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToolPageHeader } from './tool-page-header';

interface FilterSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  sharpen: number;
  grayscale: boolean;
  invert: boolean;
  sepia: boolean;
  hueRotate: number;
}

const defaultFilters: FilterSettings = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  sharpen: 0,
  grayscale: false,
  invert: false,
  sepia: false,
  hueRotate: 0,
};

const presetFilters = [
  { name: 'None', settings: defaultFilters },
  { name: 'Vivid', settings: { ...defaultFilters, saturation: 140, contrast: 110 } },
  { name: 'Muted', settings: { ...defaultFilters, saturation: 60, brightness: 95 } },
  { name: 'Bright', settings: { ...defaultFilters, brightness: 120, contrast: 105 } },
  { name: 'High Contrast', settings: { ...defaultFilters, contrast: 150 } },
  { name: 'Soft', settings: { ...defaultFilters, brightness: 105, blur: 1 } },
  { name: 'Grayscale', settings: { ...defaultFilters, grayscale: true } },
  { name: 'Sepia', settings: { ...defaultFilters, sepia: true } },
  { name: 'Cool', settings: { ...defaultFilters, hueRotate: 180, saturation: 90 } },
  { name: 'Warm', settings: { ...defaultFilters, hueRotate: 30, saturation: 110 } },
];

export function FilterWorkspace() {
  const { activeTool, uploadedFile, processedImage, isProcessing, reset, setIsProcessing, setProcessedImage, setProgress } = useAppStore();

  const [filters, setFilters] = useState<FilterSettings>(defaultFilters);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<FilterSettings[]>([]);
  const [compareMode, setCompareMode] = useState(false);

  // Set original image URL
  useEffect(() => {
    if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile);
      setOriginalUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [uploadedFile]);

  const handleFilterChange = useCallback((key: keyof FilterSettings, value: number | boolean) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      setHistory(h => [...h.slice(-9), prev]);
      return newFilters;
    });
  }, []);

  const applyPreset = useCallback((preset: typeof presetFilters[0]) => {
    setFilters(preset.settings);
    toast.success(`Applied "${preset.name}" filter`);
  }, []);

  const handleProcess = useCallback(async () => {
    if (!uploadedFile) {
      toast.error('Please upload an image first');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('image', uploadedFile);
    formData.append('brightness', (filters.brightness / 100).toString());
    formData.append('contrast', (filters.contrast / 100).toString());
    formData.append('saturation', (filters.saturation / 100).toString());
    formData.append('blur', filters.blur.toString());
    formData.append('sharpen', filters.sharpen.toString());
    formData.append('grayscale', filters.grayscale.toString());
    formData.append('negate', filters.invert.toString());
    formData.append('sepia', filters.sepia.toString());
    if (filters.hueRotate !== 0) formData.append('hue', filters.hueRotate.toString());

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
      setProcessedImage(data.imageUrl);
      toast.success('Filters applied successfully!');
    } catch {
      toast.error('Failed to apply filters. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedFile, filters, setIsProcessing, setProcessedImage, setProgress]);

  const handleDownload = useCallback(() => {
    if (processedImage) {
      const link = document.createElement('a');
      link.href = processedImage;
      link.download = `filtered-${Date.now()}.png`;
      link.click();
    }
  }, [processedImage]);

  const handleReset = useCallback(() => {
    reset();
    window.history.pushState({}, '', window.location.pathname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setFilters(defaultFilters);
    setHistory([]);
  }, [reset]);

  const undo = useCallback(() => {
    if (history.length > 0) {
      const previous = history[history.length - 1];
      setFilters(previous);
      setHistory(h => h.slice(0, -1));
    }
  }, [history]);

  if (!activeTool) return null;

  const getToolIcon = () => {
    const toolId = activeTool.id.toLowerCase();
    if (toolId.includes('blur')) return '🌫️';
    if (toolId.includes('grayscale')) return '🖤';
    if (toolId.includes('contrast')) return '◐';
    if (toolId.includes('brightness')) return '☀️';
    return '✨';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 lg:px-8 py-8"
    >
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        icon={<span className="text-2xl" aria-hidden="true">{getToolIcon()}</span>}
        onReset={handleReset}
      >
        {processedImage && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-2"
          >
            <Button
              variant="outline"
              onClick={() => setCompareMode(!compareMode)}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Compare
            </Button>
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

          {/* Image Comparison */}
          <AnimatePresence>
            {originalUrl && compareMode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid md:grid-cols-2 gap-4"
              >
                <div className="rounded-2xl border border-border overflow-hidden bg-card">
                  <div className="p-3 border-b border-border flex items-center justify-between">
                    <span className="text-sm font-medium">Original</span>
                  </div>
                  <div className="aspect-video bg-muted/50 flex items-center justify-center">
                    <img src={originalUrl} alt="Original" className="max-w-full max-h-full object-contain" />
                  </div>
                </div>

                {processedImage && (
                  <div className="rounded-2xl border border-primary/30 overflow-hidden bg-card">
                    <div className="p-3 border-b border-border flex items-center justify-between">
                      <span className="text-sm font-medium text-primary">Filtered</span>
                    </div>
                    <div className="aspect-video bg-muted/50 flex items-center justify-center">
                      <img src={processedImage} alt="Filtered" className="max-w-full max-h-full object-contain" />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Processed Image */}
          {processedImage && !compareMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border overflow-hidden bg-card"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-medium">Filtered Image</h3>
                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20">
                  Complete
                </Badge>
              </div>
              <div className="aspect-video bg-muted/50 flex items-center justify-center">
                <img
                  src={processedImage}
                  alt="Filtered"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Panel - Settings */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-primary" />
                Filter Settings
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters(defaultFilters)}
                disabled={JSON.stringify(filters) === JSON.stringify(defaultFilters)}
              >
                Reset All
              </Button>
            </div>

            <div className="p-4 space-y-6">
              <Tabs defaultValue="adjustments">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="adjustments">Adjust</TabsTrigger>
                  <TabsTrigger value="presets">Presets</TabsTrigger>
                </TabsList>

                <TabsContent value="adjustments" className="space-y-5 mt-4">
                  {/* Brightness */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Sun className="w-4 h-4 text-muted-foreground" />
                        Brightness
                      </Label>
                      <span className="text-sm font-mono text-primary">{filters.brightness}%</span>
                    </div>
                    <Slider
                      value={[filters.brightness]}
                      onValueChange={([v]) => handleFilterChange('brightness', v)}
                      min={0}
                      max={200}
                      step={5}
                    />
                  </div>

                  {/* Contrast */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Contrast className="w-4 h-4 text-muted-foreground" />
                        Contrast
                      </Label>
                      <span className="text-sm font-mono text-primary">{filters.contrast}%</span>
                    </div>
                    <Slider
                      value={[filters.contrast]}
                      onValueChange={([v]) => handleFilterChange('contrast', v)}
                      min={0}
                      max={200}
                      step={5}
                    />
                  </div>

                  {/* Saturation */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-muted-foreground" />
                        Saturation
                      </Label>
                      <span className="text-sm font-mono text-primary">{filters.saturation}%</span>
                    </div>
                    <Slider
                      value={[filters.saturation]}
                      onValueChange={([v]) => handleFilterChange('saturation', v)}
                      min={0}
                      max={200}
                      step={5}
                    />
                  </div>

                  {/* Blur */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Circle className="w-4 h-4 text-muted-foreground" />
                        Blur
                      </Label>
                      <span className="text-sm font-mono text-primary">{filters.blur}px</span>
                    </div>
                    <Slider
                      value={[filters.blur]}
                      onValueChange={([v]) => handleFilterChange('blur', v)}
                      min={0}
                      max={20}
                      step={0.5}
                    />
                  </div>

                  {/* Hue Rotate */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-muted-foreground" />
                        Hue Rotate
                      </Label>
                      <span className="text-sm font-mono text-primary">{filters.hueRotate}°</span>
                    </div>
                    <Slider
                      value={[filters.hueRotate]}
                      onValueChange={([v]) => handleFilterChange('hueRotate', v)}
                      min={0}
                      max={360}
                      step={15}
                    />
                  </div>

                  {/* Quick Toggle Filters */}
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={filters.grayscale ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange('grayscale', !filters.grayscale)}
                    >
                      B&W
                    </Button>
                    <Button
                      variant={filters.sepia ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange('sepia', !filters.sepia)}
                    >
                      Sepia
                    </Button>
                    <Button
                      variant={filters.invert ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange('invert', !filters.invert)}
                    >
                      Invert
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="presets" className="space-y-3 mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    {presetFilters.map((preset) => (
                      <Button
                        key={preset.name}
                        variant="outline"
                        className="justify-start h-auto py-3"
                        onClick={() => applyPreset(preset)}
                      >
                        <div className="text-left">
                          <div className="font-medium text-sm">{preset.name}</div>
                        </div>
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
                      Applying...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Apply Filters
                    </>
                  )}
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={undo}
                    disabled={history.length === 0}
                  >
                    Undo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-4 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Pro Tips
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Combine multiple adjustments for unique effects</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Use presets as starting points</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Compare before/after to see changes</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
