'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
  RotateCw,
  Settings,
  Sparkles,
  Undo2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';

type BgMode = 'auto' | 'transparent' | 'white' | 'black';
type OutputFormat = 'png' | 'jpg' | 'webp';

const ANGLE_PRESETS = [0, 90, 180, 270] as const;

function normalizeAngle(deg: number) {
  // Keep in (-180, 180] for the slider, but accept full circle inputs
  let a = deg % 360;
  if (a > 180) a -= 360;
  if (a <= -180) a += 360;
  return a;
}

function isRightAngle(deg: number) {
  const a = ((deg % 360) + 360) % 360;
  return a === 0 || a === 90 || a === 180 || a === 270;
}

function resolveBackground(bg: BgMode, format: OutputFormat): string | null {
  // null = leave transparent (canvas clear)
  if (bg === 'transparent') return null;
  if (bg === 'white') return '#ffffff';
  if (bg === 'black') return '#000000';
  // auto: transparent for png/webp, white for jpg (no alpha)
  if (format === 'jpg') return '#ffffff';
  return null;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this image file'));
    };
    img.src = url;
  });
}

/**
 * Full-quality rotate + flip into a new canvas sized to the rotated bounding box.
 */
function renderRotatedImage(
  source: HTMLImageElement,
  angleDeg: number,
  flipH: boolean,
  flipV: boolean,
  background: string | null,
): HTMLCanvasElement {
  const radians = (angleDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const rotW = Math.max(1, Math.round(source.naturalWidth * cos + source.naturalHeight * sin));
  const rotH = Math.max(1, Math.round(source.naturalWidth * sin + source.naturalHeight * cos));

  const canvas = document.createElement('canvas');
  canvas.width = rotW;
  canvas.height = rotH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser');

  // High quality resampling for non-90° angles
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, rotW, rotH);
  } else {
    ctx.clearRect(0, 0, rotW, rotH);
  }

  ctx.translate(rotW / 2, rotH / 2);
  ctx.rotate(radians);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(
    source,
    -source.naturalWidth / 2,
    -source.naturalHeight / 2,
    source.naturalWidth,
    source.naturalHeight,
  );

  return canvas;
}

function canvasToDataUrl(canvas: HTMLCanvasElement, format: OutputFormat, quality: number): string {
  const mime =
    format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
  // PNG ignores quality; jpeg/webp use 0–1
  if (format === 'png') return canvas.toDataURL(mime);
  return canvas.toDataURL(mime, Math.max(0.1, Math.min(1, quality / 100)));
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function RotateWorkspace() {
  const {
    activeTool,
    uploadedFile,
    processedImage,
    isProcessing,
    reset,
    setIsProcessing,
    setProcessedImage,
    setProgress,
  } = useAppStore();

  const isFlipTool = activeTool?.id === 'flip';
  const isRotateTool = !isFlipTool;

  const [angle, setAngle] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [bgMode, setBgMode] = useState<BgMode>('auto');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('png');
  const [exportFormat, setExportFormat] = useState<OutputFormat>('png');
  const [quality, setQuality] = useState(92);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [livePreviewUrl, setLivePreviewUrl] = useState<string | null>(null);
  const [outputDims, setOutputDims] = useState({ w: 0, h: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);
  const liveUrlRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load source image for preview + processing
  useEffect(() => {
    if (!uploadedFile || !uploadedFile.type.startsWith('image/')) {
      setPreviewUrl(null);
      setDims({ w: 0, h: 0 });
      imageRef.current = null;
      setLivePreviewUrl(null);
      setProcessedImage(null);
      return;
    }

    const url = URL.createObjectURL(uploadedFile);
    setPreviewUrl(url);
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setDims({ w: img.naturalWidth, h: img.naturalHeight });
      // Sensible defaults when file arrives
      if (isFlipTool) {
        setAngle(0);
        setFlipH(true);
        setFlipV(false);
      } else {
        setAngle(0);
        setFlipH(false);
        setFlipV(false);
      }
      setProcessedImage(null);
    };
    img.onerror = () => {
      toast.error('Could not load this image. Try JPG, PNG, or WebP.');
      imageRef.current = null;
    };
    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
     
  }, [uploadedFile, isFlipTool, setProcessedImage]);

  // Live preview canvas (debounced for smooth slider)
  useEffect(() => {
    if (!imageRef.current || !uploadedFile) {
      setLivePreviewUrl(null);
      return;
    }

    const render = () => {
      try {
        const bg = resolveBackground(bgMode, outputFormat);
        const canvas = renderRotatedImage(imageRef.current!, angle, flipH, flipV, bg);
        // Downscale preview if huge for performance
        const maxSide = 1200;
        let previewCanvas = canvas;
        if (canvas.width > maxSide || canvas.height > maxSide) {
          const scale = maxSide / Math.max(canvas.width, canvas.height);
          const small = document.createElement('canvas');
          small.width = Math.max(1, Math.round(canvas.width * scale));
          small.height = Math.max(1, Math.round(canvas.height * scale));
          const sctx = small.getContext('2d');
          if (sctx) {
            sctx.imageSmoothingEnabled = true;
            sctx.imageSmoothingQuality = 'high';
            sctx.drawImage(canvas, 0, 0, small.width, small.height);
            previewCanvas = small;
          }
        }
        const dataUrl = previewCanvas.toDataURL('image/png');
        if (liveUrlRef.current?.startsWith('blob:')) {
          URL.revokeObjectURL(liveUrlRef.current);
        }
        liveUrlRef.current = dataUrl;
        setLivePreviewUrl(dataUrl);
        setOutputDims({ w: canvas.width, h: canvas.height });
      } catch {
        // ignore transient canvas errors
      }
    };

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(render, 40);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [angle, flipH, flipV, bgMode, outputFormat, uploadedFile, dims]);

  const hasChanges = useMemo(() => {
    if (isFlipTool) return flipH || flipV || angle !== 0;
    return angle !== 0 || flipH || flipV;
  }, [angle, flipH, flipV, isFlipTool]);

  const rotateBy = useCallback((delta: number) => {
    setAngle((prev) => normalizeAngle(prev + delta));
    setProcessedImage(null);
  }, [setProcessedImage]);

  const setAnglePreset = useCallback((deg: number) => {
    setAngle(normalizeAngle(deg));
    setProcessedImage(null);
  }, [setProcessedImage]);

  const toggleFlipH = useCallback(() => {
    setFlipH((v) => !v);
    setProcessedImage(null);
  }, [setProcessedImage]);

  const toggleFlipV = useCallback(() => {
    setFlipV((v) => !v);
    setProcessedImage(null);
  }, [setProcessedImage]);

  const handleResetTransforms = useCallback(() => {
    setAngle(0);
    setFlipH(isFlipTool);
    setFlipV(false);
    setProcessedImage(null);
    toast.message(isFlipTool ? 'Flips reset' : 'Rotation reset');
  }, [isFlipTool, setProcessedImage]);

  const handleProcess = useCallback(async () => {
    if (!uploadedFile) {
      toast.error('Please upload an image first');
      return;
    }
    if (!hasChanges) {
      toast.error(isFlipTool ? 'Enable a flip or rotation first' : 'Choose a rotation angle or flip first');
      return;
    }

    setIsProcessing(true);
    setProgress(20);

    try {
      const img = imageRef.current ?? (await loadImage(uploadedFile));
      imageRef.current = img;
      setProgress(55);

      let format = outputFormat;
      const bg = resolveBackground(bgMode, format);
      // Non-right-angle + transparent needs PNG/WebP
      if (!bg && format === 'jpg' && !isRightAngle(angle)) {
        format = 'png';
        setOutputFormat('png');
        toast.message('Switched output to PNG to preserve transparent corners');
      }

      const canvas = renderRotatedImage(img, angle, flipH, flipV, bg);
      setProgress(90);
      const dataUrl = canvasToDataUrl(canvas, format, quality);
      setExportFormat(format);
      setProcessedImage(dataUrl);
      setOutputDims({ w: canvas.width, h: canvas.height });
      setProgress(100);
      toast.success(isFlipTool ? 'Image flipped successfully.' : 'Image rotated successfully.');
      requestAnimationFrame(() => {
        document.getElementById('rotate-result')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  }, [
    angle,
    bgMode,
    flipH,
    flipV,
    hasChanges,
    isFlipTool,
    outputFormat,
    quality,
    setIsProcessing,
    setProcessedImage,
    setProgress,
    uploadedFile,
  ]);

  const handleDownload = useCallback(() => {
    if (!processedImage) return;
    const ext = exportFormat === 'jpg' ? 'jpg' : exportFormat;
    const base = uploadedFile?.name?.replace(/\.[^.]+$/, '') || 'image';
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `${base}-${isFlipTool ? 'flipped' : 'rotated'}.${ext}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Download started');
  }, [exportFormat, isFlipTool, processedImage, uploadedFile]);

  const handleReset = useCallback(() => {
    setAngle(0);
    setFlipH(false);
    setFlipV(false);
    setBgMode('auto');
    setOutputFormat('png');
    setExportFormat('png');
    setQuality(92);
    setPreviewUrl(null);
    setLivePreviewUrl(null);
    setDims({ w: 0, h: 0 });
    imageRef.current = null;
    reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [reset]);

  if (!activeTool) return null;

  const displaySrc = livePreviewUrl || previewUrl;
  const previewStyleBg =
    bgMode === 'black'
      ? 'bg-zinc-900'
      : bgMode === 'white'
        ? 'bg-white'
        : 'bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] dark:bg-[linear-gradient(45deg,#1f2937_25%,transparent_25%),linear-gradient(-45deg,#1f2937_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1f2937_75%),linear-gradient(-45deg,transparent_75%,#1f2937_75%)]';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 py-8 lg:px-8">
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        icon={isFlipTool ? <FlipHorizontal className="h-7 w-7 text-white" /> : <RotateCw className="h-7 w-7 text-white" />}
        onReset={handleReset}
      >
        {processedImage ? (
          <Button onClick={handleDownload} className="btn-premium gap-2 rounded-xl">
            <Download className="h-4 w-4" />
            Download
          </Button>
        ) : null}
      </ToolPageHeader>

      <div className="space-y-6">
        <FileUpload accept="image/*" />
        <ToolLimitNotice
          limits={[
            'Images only · browser-side processing',
            isRotateTool ? 'Any angle from -180° to 180°' : 'Horizontal & vertical mirror',
            'PNG keeps transparent corners for free angles',
          ]}
        />

        {uploadedFile && displaySrc ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* Preview */}
            <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/75 shadow-premium backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 bg-gradient-to-r from-primary/5 to-transparent p-4">
                <div>
                  <h3 className="font-semibold">Live preview</h3>
                  <p className="text-xs text-muted-foreground">
                    Updates as you adjust {isFlipTool ? 'flip and rotation' : 'angle and flips'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {angle !== 0 ? (
                    <Badge variant="secondary" className="gap-1 tabular-nums">
                      <RotateCw className="h-3 w-3" />
                      {angle}°
                    </Badge>
                  ) : null}
                  {flipH ? (
                    <Badge variant="secondary" className="gap-1">
                      <FlipHorizontal className="h-3 w-3" />
                      H
                    </Badge>
                  ) : null}
                  {flipV ? (
                    <Badge variant="secondary" className="gap-1">
                      <FlipVertical className="h-3 w-3" />
                      V
                    </Badge>
                  ) : null}
                  {outputDims.w > 0 ? (
                    <Badge variant="outline" className="tabular-nums">
                      {outputDims.w} × {outputDims.h}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className={`flex min-h-[280px] items-center justify-center p-4 md:min-h-[360px] ${previewStyleBg}`}>
                <img
                  src={displaySrc}
                  alt="Rotation preview"
                  className="max-h-[min(60vh,520px)] max-w-full rounded-lg object-contain shadow-md"
                />
              </div>
              {dims.w > 0 ? (
                <p className="border-t border-border/40 px-4 py-2.5 text-xs text-muted-foreground">
                  Original {dims.w} × {dims.h}
                  {uploadedFile.size ? ` · ${formatBytes(uploadedFile.size)}` : ''}
                  {outputDims.w > 0 && (outputDims.w !== dims.w || outputDims.h !== dims.h)
                    ? ` → output ${outputDims.w} × ${outputDims.h}`
                    : ''}
                </p>
              ) : null}
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/75 shadow-premium backdrop-blur-xl">
                <div className="border-b border-border/40 bg-gradient-to-r from-primary/10 to-transparent p-5">
                  <h3 className="flex items-center gap-2 font-bold">
                    <Settings className="h-4 w-4 text-primary" />
                    {isFlipTool ? 'Flip settings' : 'Rotate settings'}
                  </h3>
                </div>
                <div className="space-y-5 p-5">
                  {isRotateTool ? (
                    <>
                      {/* Quick turn buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 gap-2 rounded-xl"
                          onClick={() => rotateBy(-90)}
                        >
                          <Undo2 className="h-4 w-4" />
                          Left 90°
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 gap-2 rounded-xl"
                          onClick={() => rotateBy(90)}
                        >
                          <RotateCw className="h-4 w-4" />
                          Right 90°
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Presets
                        </Label>
                        <div className="grid grid-cols-4 gap-2">
                          {ANGLE_PRESETS.map((deg) => {
                            const active = ((angle % 360) + 360) % 360 === deg;
                            return (
                              <Button
                                key={deg}
                                type="button"
                                size="sm"
                                variant={active ? 'default' : 'outline'}
                                className="rounded-xl tabular-nums"
                                onClick={() => setAnglePreset(deg)}
                              >
                                {deg}°
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Custom angle</Label>
                          <span className="rounded-lg bg-primary/10 px-2.5 py-0.5 font-mono text-sm font-bold text-primary tabular-nums">
                            {angle}°
                          </span>
                        </div>
                        <Slider
                          value={[angle]}
                          onValueChange={([v]) => {
                            setAngle(v);
                            setProcessedImage(null);
                          }}
                          min={-180}
                          max={180}
                          step={1}
                        />
                        <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          <span>-180°</span>
                          <span>0°</span>
                          <span>180°</span>
                        </div>
                      </div>
                    </>
                  ) : null}

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {isFlipTool ? 'Mirror' : 'Optional flip'}
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={flipH ? 'default' : 'outline'}
                        className="h-11 gap-2 rounded-xl"
                        onClick={toggleFlipH}
                      >
                        <FlipHorizontal className="h-4 w-4" />
                        Horizontal
                      </Button>
                      <Button
                        type="button"
                        variant={flipV ? 'default' : 'outline'}
                        className="h-11 gap-2 rounded-xl"
                        onClick={toggleFlipV}
                      >
                        <FlipVertical className="h-4 w-4" />
                        Vertical
                      </Button>
                    </div>
                  </div>

                  {isFlipTool ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Extra rotation</Label>
                        <span className="font-mono text-sm font-bold text-primary tabular-nums">{angle}°</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {ANGLE_PRESETS.map((deg) => (
                          <Button
                            key={deg}
                            type="button"
                            size="sm"
                            variant={((angle % 360) + 360) % 360 === deg ? 'default' : 'outline'}
                            className="rounded-xl"
                            onClick={() => setAnglePreset(deg)}
                          >
                            {deg}°
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label>Corner fill</Label>
                    <Select
                      value={bgMode}
                      onValueChange={(v) => {
                        setBgMode(v as BgMode);
                        setProcessedImage(null);
                      }}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto (transparent / white for JPG)</SelectItem>
                        <SelectItem value="transparent">Transparent</SelectItem>
                        <SelectItem value="white">White</SelectItem>
                        <SelectItem value="black">Black</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Free angles leave empty corners. Transparent needs PNG or WebP.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Output format</Label>
                    <Select
                      value={outputFormat}
                      onValueChange={(v) => {
                        setOutputFormat(v as OutputFormat);
                        setProcessedImage(null);
                      }}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="png">PNG (best for transparency)</SelectItem>
                        <SelectItem value="jpg">JPG (smaller photos)</SelectItem>
                        <SelectItem value="webp">WebP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {outputFormat !== 'png' ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Quality</Label>
                        <span className="font-mono text-sm text-primary">{quality}%</span>
                      </div>
                      <Slider
                        value={[quality]}
                        onValueChange={([v]) => setQuality(v)}
                        min={40}
                        max={100}
                        step={1}
                      />
                    </div>
                  ) : null}

                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full rounded-xl gap-2"
                    onClick={handleResetTransforms}
                    disabled={!hasChanges}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset transforms
                  </Button>

                  <Button
                    className="btn-premium h-12 w-full rounded-2xl text-sm font-bold"
                    onClick={handleProcess}
                    disabled={!uploadedFile || isProcessing || !hasChanges}
                    size="lg"
                  >
                    {isProcessing ? (
                      'Processing…'
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {isFlipTool ? 'Apply flip' : 'Apply rotation'}
                      </>
                    )}
                  </Button>

                  <Button variant="outline" className="h-11 w-full rounded-2xl gap-2" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4" />
                    Start over
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 to-transparent p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Tips</p>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  <li>Use Left/Right 90° for phone photos and scans.</li>
                  <li>Custom angles expand the canvas to fit the whole image.</li>
                  <li>Pick transparent corners + PNG for clean free rotation.</li>
                  <li>All processing stays in your browser — files are not uploaded.</li>
                </ul>
              </div>
            </div>
          </div>
        ) : null}

        {processedImage ? (
          <motion.div
            id="rotate-result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-[1.75rem] border border-primary/30 bg-primary/5 shadow-lg"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/20 p-4">
              <div>
                <h3 className="font-semibold">Result ready</h3>
                <p className="text-xs text-muted-foreground">
                  {outputDims.w} × {outputDims.h}
                  {angle !== 0 ? ` · ${angle}°` : ''}
                  {flipH ? ' · flip H' : ''}
                  {flipV ? ' · flip V' : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">Done</Badge>
                <Button size="sm" className="btn-premium gap-1.5 rounded-xl" onClick={handleDownload}>
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            </div>
            <div className={`flex min-h-[200px] items-center justify-center p-4 ${previewStyleBg}`}>
              <img
                src={processedImage}
                alt="Rotated result"
                className="max-h-96 max-w-full rounded-lg object-contain shadow-md"
              />
            </div>
          </motion.div>
        ) : null}
      </div>
    </motion.div>
  );
}
