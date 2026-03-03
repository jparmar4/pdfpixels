'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import {
  Download,
  RotateCcw,
  Settings2,
  Image as ImageIcon,
  CheckCircle2,
  Split,
  Eye,
  ArrowRight,
  ArrowLeftRight,
  Zap,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';

const formatInfo = {
  jpg: { name: 'JPG/JPEG', description: 'Best for photos, smaller file size', supportsTransparency: false },
  png: { name: 'PNG', description: 'Best for graphics, supports transparency', supportsTransparency: true },
  webp: { name: 'WebP', description: 'Modern format, best compression', supportsTransparency: true },
  avif: { name: 'AVIF', description: 'Next-gen format, superior compression', supportsTransparency: true },
};

// Derive the target format from the tool ID (for locked-format converters)
function getTargetFormat(toolId: string): string | null {
  if (toolId.includes('-to-jpg') || toolId.includes('-to-jpeg')) return 'jpg';
  if (toolId.includes('-to-png')) return 'png';
  if (toolId.includes('-to-webp')) return 'webp';
  if (toolId.includes('-to-avif')) return 'avif';
  return null; // Not a directional converter — allow free choice
}

// Comparison Slider Component
function ComparisonSlider({ before, after }: { before: string; after: string }) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = ((x - rect.left) / rect.width) * 100;
    setSliderPos(Math.min(100, Math.max(0, position)));
  };

  const safeSliderPos = Math.max(1, Math.min(99, sliderPos));

  return (
    <div
      ref={containerRef}
      className="relative aspect-video rounded-lg overflow-hidden cursor-col-resize select-none bg-muted group"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
    >
      {/* After Image (Background) */}
      <img src={after} alt="After" className="absolute inset-0 w-full h-full object-contain" />

      {/* Before Image (Foreground, Clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${safeSliderPos}%`, borderRight: '2px solid white' }}
      >
        <img src={before} alt="Before" className="absolute inset-0 w-full h-full object-contain max-w-none" style={{ width: `${10000 / safeSliderPos}%` }} />
      </div>

      {/* Slider Controls */}
      <div
        className="absolute inset-y-0 z-10 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] pointer-events-none"
        style={{ left: `${safeSliderPos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
          <Split className="w-4 h-4 text-primary" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-4 left-4 z-20 px-2 py-1 rounded bg-black/50 text-white text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
        Before
      </div>
      <div className="absolute bottom-4 right-4 z-20 px-2 py-1 rounded bg-black/50 text-white text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
        After
      </div>
    </div>
  );
}

export function ConvertWorkspace() {
  const { activeTool, uploadedFile, processedImage, isProcessing, reset, setIsProcessing, setProcessedImage, setProgress } = useAppStore();

  const lockedFormat = activeTool ? getTargetFormat(activeTool.id) : null;
  const [outputFormat, setOutputFormat] = useState(lockedFormat || 'jpg');
  const [quality, setQuality] = useState(activeTool?.id.includes('compress') ? 80 : 92);
  const [viewMode, setViewMode] = useState<'preview' | 'compare'>('preview');
  const [processingStats, setProcessingStats] = useState<{ originalSize: number; processedSize: number; savedPercent: number } | null>(null);

  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile);
      setObjectUrl(url);

      // Auto-detect format for generic tools (where lockedFormat is null)
      if (!lockedFormat) {
        const type = uploadedFile.type;
        if (type === 'image/png') setOutputFormat('png');
        else if (type === 'image/jpeg' || type === 'image/jpg') setOutputFormat('jpg');
        else if (type === 'image/webp') setOutputFormat('webp');
        else if (type === 'image/avif') setOutputFormat('avif');
      }

      return () => URL.revokeObjectURL(url);
    }
  }, [uploadedFile, lockedFormat]);

  // Sync format when tool changes
  useEffect(() => {
    if (lockedFormat) setOutputFormat(lockedFormat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool?.id]);

  // Detect source format from tool ID
  const getSourceFormat = () => {
    const toolId = activeTool?.id || '';
    if (toolId.includes('png-to')) return 'PNG';
    if (toolId.includes('jpg-to') || toolId.includes('jpeg-to')) return 'JPG';
    if (toolId.includes('webp-to')) return 'WebP';
    if (toolId.includes('heic-to')) return 'HEIC';
    if (toolId.includes('pdf-to')) return 'PDF';
    return 'Unknown';
  };

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
      }, 200);

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
      setProcessingStats({
        originalSize: data.originalSize,
        processedSize: data.processedSize,
        savedPercent: data.savedPercent
      });
      toast.success(`Image converted to ${formatInfo[outputFormat as keyof typeof formatInfo].name}!`);
    } catch {
      toast.error('Failed to convert image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedFile, outputFormat, quality, setIsProcessing, setProcessedImage, setProgress]);

  const handleDownload = useCallback(() => {
    if (processedImage) {
      const link = document.createElement('a');
      link.href = processedImage;
      const extension = outputFormat === 'jpg' ? 'jpg' : outputFormat;
      link.download = `converted-${Date.now()}.${extension}`;
      link.click();
    }
  }, [processedImage, outputFormat]);

  const handleReset = useCallback(() => {
    reset();
    window.history.pushState({}, '', window.location.pathname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setOutputFormat('jpg');
    setQuality(90);
  }, [reset]);

  if (!activeTool) return null;

  const sourceFormat = getSourceFormat();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 lg:px-8 py-8"
    >
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        icon={ArrowLeftRight}
        onReset={handleReset}
      >
        {processedImage && (
          <div className="flex items-center gap-2 p-1 rounded-lg bg-muted/50 border">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'preview' | 'compare')}>
              <TabsList className="h-8 bg-transparent">
                <TabsTrigger value="preview" className="h-7 text-xs gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Preview
                </TabsTrigger>
                <TabsTrigger value="compare" className="h-7 text-xs gap-1.5">
                  <Split className="w-3.5 h-3.5" /> Compare
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
      </ToolPageHeader>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Panel - Upload & Preview */}
        <div className="lg:col-span-2 space-y-6">
          <FileUpload accept={activeTool?.id.includes('pdf-to') ? '.pdf' : 'image/*'} />

          {/* Conversion Preview */}
          {uploadedFile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center mb-2">
                    <span className="text-lg font-bold text-muted-foreground">{sourceFormat}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Source</p>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <motion.div
                    animate={{ x: [0, 10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowLeftRight className="w-8 h-8 text-primary" />
                  </motion.div>
                  <p className="text-xs text-muted-foreground">Converting...</p>
                </div>

                <div className="text-center">
                  <div className="w-20 h-20 rounded-xl bg-primary/10 border-2 border-primary flex items-center justify-center mb-2">
                    <span className="text-lg font-bold text-primary">{formatInfo[outputFormat as keyof typeof formatInfo]?.name.split('/')[0]}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Target</p>
                </div>
              </div>
            </motion.div>
          )}

          {processedImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm"
            >
              <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <h3 className="font-medium">Processed Result</h3>
                </div>
                {processingStats && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-mono border-primary/20 text-primary">
                      {processingStats.savedPercent > 0 ? `Saved ${processingStats.savedPercent}%` : 'Optimized'}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {(processingStats.processedSize / 1024).toFixed(1)} KB
                    </Badge>
                  </div>
                )}
              </div>

              <div className="relative group">
                {viewMode === 'compare' && objectUrl ? (
                  <ComparisonSlider before={objectUrl} after={processedImage} />
                ) : (
                  <div className="aspect-video bg-muted/20 flex items-center justify-center relative">
                    <img
                      src={processedImage}
                      alt="Converted"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/20 to-transparent flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" onClick={handleDownload} className="gap-2 shadow-lg">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-primary/5 flex items-center justify-between border-t">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Perfect Fidelity</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Format: {formatInfo[outputFormat as keyof typeof formatInfo]?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-muted-foreground text-right">
                    Original: {(processingStats?.originalSize || 0) / 1024 > 1024 ? `${((processingStats?.originalSize || 0) / 1024 / 1024).toFixed(2)} MB` : `${((processingStats?.originalSize || 0) / 1024).toFixed(1)} KB`}
                    <ArrowRight className="w-2.5 h-2.5 inline mx-1" />
                    Target: {outputFormat.toUpperCase()}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Panel - Settings */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-medium">Conversion Settings</h3>
            </div>

            <div className="p-4 space-y-6">
              {/* Output Format */}
              <div className="space-y-2">
                <Label>Output Format</Label>
                <Select value={outputFormat} onValueChange={lockedFormat ? undefined : setOutputFormat} disabled={!!lockedFormat}>
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
                {lockedFormat && (
                  <p className="text-xs text-primary/70 font-medium">
                    ✓ Output format locked to {formatInfo[lockedFormat as keyof typeof formatInfo]?.name}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatInfo[outputFormat as keyof typeof formatInfo]?.description}
                </p>
              </div>

              {/* Quality (for JPG/WebP/AVIF/PNG) */}
              {(outputFormat === 'jpg' || outputFormat === 'webp' || outputFormat === 'avif' || outputFormat === 'png') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>{outputFormat === 'png' ? 'Compression Level' : 'Quality'}</Label>
                    <span className="text-sm font-mono text-primary">{quality}%</span>
                  </div>
                  <Slider
                    value={[quality]}
                    onValueChange={([v]) => setQuality(v)}
                    min={10}
                    max={100}
                    step={5}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Smaller file</span>
                    <span>Better quality</span>
                  </div>
                </div>
              )}

              {/* Format Info Cards */}
              {!lockedFormat && (
                <div className="space-y-2">
                  {Object.entries(formatInfo).map(([key, info]) => (
                    <div
                      key={key}
                      className={`p-3 rounded-lg border transition-colors cursor-pointer ${outputFormat === key
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                        }`}
                      onClick={() => setOutputFormat(key)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{info.name}</span>
                        {outputFormat === key && (
                          <Badge variant="secondary" className="text-xs">Selected</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 space-y-3">
                <Button
                  className="w-full"
                  onClick={handleProcess}
                  disabled={!uploadedFile || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"
                      />
                      Converting...
                    </>
                  ) : (
                    'Convert Image'
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
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-4">
            <h4 className="font-medium mb-2">Format Guide</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li><strong>JPG:</strong> Photos, web images</li>
              <li><strong>PNG:</strong> Graphics with transparency</li>
              <li><strong>WebP:</strong> Modern, smaller files</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
