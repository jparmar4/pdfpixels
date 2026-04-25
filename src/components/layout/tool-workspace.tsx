'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Download, RotateCcw, Settings, Sparkles, ChevronRight, RotateCw, FlipHorizontal, FlipVertical, Crop, Type, Stamp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
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
import { SpotlightCard } from '@/components/ui/spotlight-card';

export function ToolWorkspace() {
  const { activeTool, uploadedFile, processedImage, isProcessing, reset, setIsProcessing, setProcessedImage, setProgress } = useAppStore();

  // Tool-specific states
  const [rotate, setRotate] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [outputFormat, setOutputFormat] = useState('jpg');
  const [quality, setQuality] = useState(90);
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkOpacity, setWatermarkOpacity] = useState(50);
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(48);
  const [mergeDirection, setMergeDirection] = useState<'vertical' | 'horizontal'>('vertical');
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [splitRows, setSplitRows] = useState(3);
  const [splitColumns, setSplitColumns] = useState(3);
  const [splitTiles, setSplitTiles] = useState<string[]>([]);
  const [pickedColors, setPickedColors] = useState<Array<{ label: string; value: string }>>([]);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [activeTab, setActiveTab] = useState('transform');
  const toolId = activeTool?.id.toLowerCase() || '';
  const clientCanvasTools = ['watermark', 'add-text', 'merge-images', 'split-image', 'color-picker'];
  const usesClientCanvas = clientCanvasTools.includes(toolId);

  // Get original dimensions when file is uploaded
  useEffect(() => {
    if (uploadedFile && uploadedFile.type.startsWith('image/')) {
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
      };
      img.src = URL.createObjectURL(uploadedFile);
    } else if (uploadedFile) {
      setOriginalDimensions({ width: 0, height: 0 });
    }
  }, [uploadedFile]);

  const loadImageFromFile = useCallback((file: File) => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not read image file'));
      };
      image.src = url;
    });
  }, []);

  const canvasToDataUrl = useCallback((canvas: HTMLCanvasElement) => {
    const mimeType = outputFormat === 'png' ? 'image/png' : outputFormat === 'webp' ? 'image/webp' : 'image/jpeg';
    return canvas.toDataURL(mimeType, Math.max(0.1, Math.min(1, quality / 100)));
  }, [outputFormat, quality]);

  const hexFromRgb = (r: number, g: number, b: number) =>
    `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;

  const handleClientCanvasProcess = useCallback(async () => {
    if (!uploadedFile) {
      toast.error('Please upload an image first');
      return;
    }

    setIsProcessing(true);
    setProgress(15);
    setSplitTiles([]);
    setPickedColors([]);

    try {
      const baseImage = await loadImageFromFile(uploadedFile);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas is not available in this browser');

      if (toolId === 'merge-images') {
        const images = await Promise.all([uploadedFile, ...extraFiles].map((file) => loadImageFromFile(file)));
        if (images.length < 2) {
          throw new Error('Add at least one more image to join.');
        }

        const gap = 24;
        canvas.width = mergeDirection === 'horizontal'
          ? images.reduce((sum, image) => sum + image.width, 0) + gap * (images.length - 1)
          : Math.max(...images.map((image) => image.width));
        canvas.height = mergeDirection === 'horizontal'
          ? Math.max(...images.map((image) => image.height))
          : images.reduce((sum, image) => sum + image.height, 0) + gap * (images.length - 1);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        let offset = 0;
        images.forEach((image) => {
          if (mergeDirection === 'horizontal') {
            ctx.drawImage(image, offset, Math.round((canvas.height - image.height) / 2));
            offset += image.width + gap;
          } else {
            ctx.drawImage(image, Math.round((canvas.width - image.width) / 2), offset);
            offset += image.height + gap;
          }
        });
      } else {
        canvas.width = baseImage.width;
        canvas.height = baseImage.height;
        ctx.drawImage(baseImage, 0, 0);

        if (toolId === 'color-picker') {
          const sample = document.createElement('canvas');
          sample.width = 48;
          sample.height = 48;
          const sampleCtx = sample.getContext('2d');
          if (!sampleCtx) throw new Error('Canvas is not available in this browser');
          sampleCtx.drawImage(baseImage, 0, 0, sample.width, sample.height);
          const pixels = sampleCtx.getImageData(0, 0, sample.width, sample.height).data;
          let r = 0;
          let g = 0;
          let b = 0;
          let count = 0;
          for (let i = 0; i < pixels.length; i += 16) {
            r += pixels[i];
            g += pixels[i + 1];
            b += pixels[i + 2];
            count += 1;
          }
          const average = hexFromRgb(Math.round(r / count), Math.round(g / count), Math.round(b / count));
          const center = ctx.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data;
          setPickedColors([
            { label: 'Average color', value: average },
            { label: 'Center pixel', value: hexFromRgb(center[0], center[1], center[2]) },
          ]);
        }

        if (toolId === 'split-image') {
          const tileWidth = Math.floor(baseImage.width / splitColumns);
          const tileHeight = Math.floor(baseImage.height / splitRows);
          const tiles: string[] = [];
          for (let row = 0; row < splitRows; row += 1) {
            for (let column = 0; column < splitColumns; column += 1) {
              const tile = document.createElement('canvas');
              tile.width = tileWidth;
              tile.height = tileHeight;
              const tileCtx = tile.getContext('2d');
              if (!tileCtx) continue;
              tileCtx.drawImage(baseImage, column * tileWidth, row * tileHeight, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);
              tiles.push(canvasToDataUrl(tile));
            }
          }
          setSplitTiles(tiles);
          ctx.strokeStyle = 'rgba(255,255,255,0.9)';
          ctx.lineWidth = Math.max(2, Math.round(Math.min(canvas.width, canvas.height) * 0.004));
          for (let column = 1; column < splitColumns; column += 1) {
            ctx.beginPath();
            ctx.moveTo(column * tileWidth, 0);
            ctx.lineTo(column * tileWidth, canvas.height);
            ctx.stroke();
          }
          for (let row = 1; row < splitRows; row += 1) {
            ctx.beginPath();
            ctx.moveTo(0, row * tileHeight);
            ctx.lineTo(canvas.width, row * tileHeight);
            ctx.stroke();
          }
        }

        if (toolId === 'watermark' || toolId === 'add-text') {
          const text = watermarkText.trim() || (toolId === 'watermark' ? 'CONFIDENTIAL' : 'Your text');
          const fontSize = Math.max(12, Math.min(textSize, Math.round(canvas.width * 0.12)));
          ctx.save();
          ctx.globalAlpha = toolId === 'watermark' ? watermarkOpacity / 100 : 1;
          ctx.fillStyle = textColor;
          ctx.strokeStyle = 'rgba(0,0,0,0.35)';
          ctx.lineWidth = Math.max(2, fontSize * 0.06);
          ctx.font = `700 ${fontSize}px Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          if (toolId === 'watermark') {
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(-Math.PI / 5);
            ctx.strokeText(text, 0, 0);
            ctx.fillText(text, 0, 0);
          } else {
            ctx.strokeText(text, canvas.width / 2, canvas.height - fontSize * 1.4);
            ctx.fillText(text, canvas.width / 2, canvas.height - fontSize * 1.4);
          }
          ctx.restore();
        }
      }

      setProgress(100);
      setProcessedImage(canvasToDataUrl(canvas));
      toast.success('Image processed successfully.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [canvasToDataUrl, extraFiles, loadImageFromFile, mergeDirection, setIsProcessing, setProcessedImage, setProgress, splitColumns, splitRows, textColor, textSize, toolId, uploadedFile, watermarkOpacity, watermarkText]);

  const handleProcess = useCallback(async () => {
    if (!uploadedFile) {
      toast.error('Please upload an image first');
      return;
    }

    if (usesClientCanvas) {
      await handleClientCanvasProcess();
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('image', uploadedFile);
    formData.append('format', outputFormat);
    formData.append('quality', quality.toString());
    formData.append('rotate', rotate.toString());
    formData.append('flip', flipV.toString());
    formData.append('flop', flipH.toString());

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
      toast.success('Image processed successfully!');
    } catch {
      toast.error('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [handleClientCanvasProcess, uploadedFile, rotate, flipH, flipV, outputFormat, quality, setIsProcessing, setProcessedImage, setProgress, usesClientCanvas]);

  const handleDownload = useCallback(() => {
    if (processedImage) {
      const link = document.createElement('a');
      link.href = processedImage;
      link.download = `processed-${Date.now()}.${outputFormat === 'jpg' ? 'jpg' : outputFormat}`;
      link.click();
    }
  }, [processedImage, outputFormat]);

  const handleReset = useCallback(() => {
    reset();
    window.history.pushState({}, '', window.location.pathname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setRotate(0);
    setFlipH(false);
    setFlipV(false);
    setSplitTiles([]);
    setPickedColors([]);
    setExtraFiles([]);
  }, [reset]);

  const getToolIcon = () => {
    if (toolId.includes('rotate')) return RotateCw;
    if (toolId.includes('flip')) return FlipHorizontal;
    if (toolId.includes('crop')) return Crop;
    if (toolId.includes('watermark')) return Stamp;
    if (toolId.includes('text')) return Type;
    return Settings;
  };

  const ToolIcon = getToolIcon();

  if (!activeTool) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 lg:px-8 py-8"
    >
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        icon={<ToolIcon className="w-7 h-7 text-white" />}
        onReset={handleReset}
      >
        {processedImage && (
          <Button onClick={handleDownload} className="gap-2 btn-premium rounded-xl">
            <Download className="w-4 h-4" />
            Download
          </Button>
        )}
      </ToolPageHeader>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Panel - Upload & Preview */}
        <div className="lg:col-span-2 space-y-6">
          <FileUpload accept={activeTool?.id.includes('pdf-') ? '.pdf' : 'image/*'} />

          {/* Image Info */}
          {originalDimensions.width > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ToolIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Original Size</p>
                  <p className="text-sm text-muted-foreground">
                    {originalDimensions.width} × {originalDimensions.height} px
                  </p>
                </div>
              </div>

              {(rotate !== 0 || flipH || flipV) && (
                <div className="flex items-center gap-2">
                  {rotate !== 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <RotateCw className="w-3 h-3" />
                      {rotate}°
                    </Badge>
                  )}
                  {flipH && (
                    <Badge variant="secondary" className="gap-1">
                      <FlipHorizontal className="w-3 h-3" />
                      Horizontal
                    </Badge>
                  )}
                  {flipV && (
                    <Badge variant="secondary" className="gap-1">
                      <FlipVertical className="w-3 h-3" />
                      Vertical
                    </Badge>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {processedImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border overflow-hidden bg-card"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-medium">Processed Image</h3>
                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20">
                  Complete
                </Badge>
              </div>
              <div className="aspect-video bg-muted/50 flex items-center justify-center">
                <img
                  src={processedImage}
                  alt="Processed"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </motion.div>
          )}

          {pickedColors.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="mb-3 font-semibold">Extracted colors</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {pickedColors.map((color) => (
                  <button
                    key={color.label}
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(color.value)}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/75 p-3 text-left transition-colors hover:border-primary/30"
                  >
                    <span className="h-10 w-10 rounded-lg border border-border" style={{ backgroundColor: color.value }} />
                    <span>
                      <span className="block text-sm font-semibold">{color.label}</span>
                      <span className="font-mono text-sm text-muted-foreground">{color.value.toUpperCase()}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {splitTiles.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-semibold">Split tiles</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => splitTiles.forEach((tile, index) => {
                    const link = document.createElement('a');
                    link.href = tile;
                    link.download = `tile-${index + 1}.${outputFormat === 'jpg' ? 'jpg' : outputFormat}`;
                    link.click();
                  })}
                >
                  Download tiles
                </Button>
              </div>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${splitColumns}, minmax(0, 1fr))` }}>
                {splitTiles.map((tile, index) => (
                  <img key={index} src={tile} alt={`Split tile ${index + 1}`} className="aspect-square rounded-lg border border-border object-cover" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Settings */}
        <div className="space-y-6">
          <SpotlightCard className="h-full rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-border/40 bg-gradient-to-r from-primary/10 to-transparent">
              <h3 className="font-bold flex items-center gap-2.5 tracking-tight text-foreground">
                <Settings className="w-4 h-4 text-primary" />
                Tool Settings
              </h3>
            </div>

            <div className="p-4 space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="transform">Transform</TabsTrigger>
                  <TabsTrigger value="output">Output</TabsTrigger>
                </TabsList>

                <TabsContent value="transform" className="space-y-4 mt-4">
                  {(toolId === 'watermark' || toolId === 'add-text') && (
                    <div className="space-y-4 rounded-2xl border border-border/60 bg-background/75 p-4">
                      <div className="space-y-2">
                        <Label>{toolId === 'watermark' ? 'Watermark text' : 'Text'}</Label>
                        <Input
                          value={watermarkText}
                          onChange={(event) => setWatermarkText(event.target.value)}
                          placeholder={toolId === 'watermark' ? 'CONFIDENTIAL' : 'Add your text'}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Color</Label>
                          <Input type="color" value={textColor} onChange={(event) => setTextColor(event.target.value)} className="h-10 p-1" />
                        </div>
                        <div className="space-y-2">
                          <Label>Size</Label>
                          <Input type="number" min={12} max={180} value={textSize} onChange={(event) => setTextSize(Number(event.target.value) || 48)} />
                        </div>
                      </div>
                      {toolId === 'watermark' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Opacity</Label>
                            <span className="text-sm font-mono text-primary">{watermarkOpacity}%</span>
                          </div>
                          <Slider value={[watermarkOpacity]} onValueChange={([value]) => setWatermarkOpacity(value)} min={10} max={100} step={5} />
                        </div>
                      )}
                    </div>
                  )}

                  {toolId === 'merge-images' && (
                    <div className="space-y-4 rounded-2xl border border-border/60 bg-background/75 p-4">
                      <div className="space-y-2">
                        <Label>Additional images</Label>
                        <Input type="file" accept="image/*" multiple onChange={(event) => setExtraFiles(Array.from(event.target.files ?? []))} />
                        <p className="text-xs text-muted-foreground">{extraFiles.length} extra image{extraFiles.length === 1 ? '' : 's'} selected</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button type="button" variant={mergeDirection === 'vertical' ? 'default' : 'outline'} onClick={() => setMergeDirection('vertical')}>Vertical</Button>
                        <Button type="button" variant={mergeDirection === 'horizontal' ? 'default' : 'outline'} onClick={() => setMergeDirection('horizontal')}>Horizontal</Button>
                      </div>
                    </div>
                  )}

                  {toolId === 'split-image' && (
                    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border/60 bg-background/75 p-4">
                      <div className="space-y-2">
                        <Label>Rows</Label>
                        <Input type="number" min={1} max={10} value={splitRows} onChange={(event) => setSplitRows(Math.max(1, Math.min(10, Number(event.target.value) || 1)))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Columns</Label>
                        <Input type="number" min={1} max={10} value={splitColumns} onChange={(event) => setSplitColumns(Math.max(1, Math.min(10, Number(event.target.value) || 1)))} />
                      </div>
                    </div>
                  )}

                  {toolId === 'color-picker' && (
                    <p className="rounded-xl border border-border/60 bg-background/75 p-3 text-sm text-muted-foreground">
                      Upload an image and process it to extract quick average and center-point colors. Click a swatch to copy its HEX value.
                    </p>
                  )}

                  {/* Rotation */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <RotateCw className="w-4 h-4" />
                        Rotation
                      </Label>
                      <span className="text-sm font-mono text-primary">{rotate}°</span>
                    </div>
                    <Slider
                      value={[rotate]}
                      onValueChange={([v]) => setRotate(v)}
                      min={-180}
                      max={180}
                      step={1}
                    />
                    <div className="grid grid-cols-4 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRotate(0)}
                        className={rotate === 0 ? 'border-primary' : ''}
                      >
                        0°
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRotate(90)}
                        className={rotate === 90 ? 'border-primary' : ''}
                      >
                        90°
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRotate(180)}
                        className={rotate === 180 ? 'border-primary' : ''}
                      >
                        180°
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRotate(-90)}
                        className={rotate === -90 ? 'border-primary' : ''}
                      >
                        -90°
                      </Button>
                    </div>
                  </div>

                  {/* Flip */}
                  <div className="space-y-2">
                    <Label>Flip Image</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={flipH ? "default" : "outline"}
                        onClick={() => setFlipH(!flipH)}
                        className="gap-2"
                      >
                        <FlipHorizontal className="w-4 h-4" />
                        Horizontal
                      </Button>
                      <Button
                        variant={flipV ? "default" : "outline"}
                        onClick={() => setFlipV(!flipV)}
                        className="gap-2"
                      >
                        <FlipVertical className="w-4 h-4" />
                        Vertical
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="output" className="space-y-4 mt-4">
                  {/* Output Format */}
                  <div className="space-y-2">
                    <Label>Output Format</Label>
                    <Select value={outputFormat} onValueChange={setOutputFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="jpg">JPG/JPEG</SelectItem>
                        <SelectItem value="png">PNG</SelectItem>
                        <SelectItem value="webp">WebP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quality */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Quality</Label>
                      <span className="text-sm font-mono text-primary">{quality}%</span>
                    </div>
                    <Slider
                      value={[quality]}
                      onValueChange={([v]) => setQuality(v)}
                      min={10}
                      max={100}
                      step={5}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="pt-6 space-y-4">
                <Button
                  className="w-full btn-premium py-6 rounded-xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all"
                  onClick={handleProcess}
                  disabled={!uploadedFile || isProcessing}
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full mr-3"
                      />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-3" />
                      Apply Changes
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full gap-2 rounded-xl py-6 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-colors bg-background/50"
                  onClick={handleReset}
                >
                  <RotateCcw className="w-4 h-4" />
                  Start Over
                </Button>
              </div>
            </div>
          </SpotlightCard>

          {/* Info Card */}
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-4 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Tips
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Combine rotation and flip for different orientations</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Use PNG for images with transparency</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>All processing happens in your browser</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
