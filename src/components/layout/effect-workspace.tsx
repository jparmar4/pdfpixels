'use client';

import { motion } from 'framer-motion';
import { Download, RotateCcw, Sparkles, ChevronRight, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

const EFFECT_CONFIG: Record<string, { emoji: string; hasIntensity: boolean; label: string }> = {
  'blur-image': { emoji: '🌫️', hasIntensity: true, label: 'Blur Intensity' },
  pixelate: { emoji: '🔲', hasIntensity: true, label: 'Pixel Size' },
  grayscale: { emoji: '🖤', hasIntensity: false, label: '' },
  'black-white': { emoji: '⬛', hasIntensity: true, label: 'Threshold' },
  sepia: { emoji: '🟤', hasIntensity: true, label: 'Sepia Strength' },
  invert: { emoji: '🔄', hasIntensity: false, label: '' },
  'motion-blur': { emoji: '💨', hasIntensity: true, label: 'Motion Amount' },
  'censor-photo': { emoji: '🚫', hasIntensity: true, label: 'Censor Strength' },
  'pixel-art': { emoji: '🎮', hasIntensity: true, label: 'Pixel Block Size' },
};

type Region = { x: number; y: number; w: number; h: number };

export function EffectWorkspace() {
  const { activeTool, uploadedFile, processedImage, isProcessing, reset, setIsProcessing, setProcessedImage, setProgress } = useAppStore();
  const [intensity, setIntensity] = useState(50);
  const [angle, setAngle] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const dragRef = useRef<{ startX: number; startY: number; drawing: boolean } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const config = EFFECT_CONFIG[activeTool?.id || ''] || { emoji: '✨', hasIntensity: true, label: 'Intensity' };
  const isCensor = activeTool?.id === 'censor-photo';

  useEffect(() => {
    if (!uploadedFile) {
      return;
    }
    const url = URL.createObjectURL(uploadedFile);
    const img = new Image();
    img.onload = () => {
      setPreviewUrl(url);
      setNaturalSize({ w: img.width, h: img.height });
      // Default center region for censor
      if (isCensor) {
        const w = Math.round(img.width * 0.35);
        const h = Math.round(img.height * 0.25);
        setRegion({
          x: Math.round((img.width - w) / 2),
          y: Math.round((img.height - h) / 2),
          w,
          h,
        });
      } else {
        setRegion(null);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      toast.error('Could not load image preview');
    };
    img.src = url;
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [uploadedFile, isCensor]);

  const applyEffectToCanvas = useCallback((
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    img: HTMLImageElement,
    toolId: string,
  ) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    if (toolId === 'grayscale') {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        const gray = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
        d[i] = d[i + 1] = d[i + 2] = gray;
      }
      ctx.putImageData(imageData, 0, 0);
    } else if (toolId === 'black-white') {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      const threshold = (intensity / 100) * 255;
      for (let i = 0; i < d.length; i += 4) {
        const gray = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
        const bw = gray > threshold ? 255 : 0;
        d[i] = d[i + 1] = d[i + 2] = bw;
      }
      ctx.putImageData(imageData, 0, 0);
    } else if (toolId === 'sepia') {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      const strength = intensity / 100;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        const tr = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        const tg = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        const tb = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
        d[i] = r + (tr - r) * strength;
        d[i + 1] = g + (tg - g) * strength;
        d[i + 2] = b + (tb - b) * strength;
      }
      ctx.putImageData(imageData, 0, 0);
    } else if (toolId === 'invert') {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        d[i] = 255 - d[i];
        d[i + 1] = 255 - d[i + 1];
        d[i + 2] = 255 - d[i + 2];
      }
      ctx.putImageData(imageData, 0, 0);
    } else if (toolId === 'blur-image') {
      ctx.filter = `blur(${Math.max(0.5, intensity / 8)}px)`;
      ctx.drawImage(img, 0, 0);
      ctx.filter = 'none';
    } else if (toolId === 'pixelate' || toolId === 'pixel-art') {
      const pixelSize = Math.max(2, Math.floor(intensity / (toolId === 'pixel-art' ? 2 : 3)));
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCanvas.width = Math.max(1, Math.ceil(canvas.width / pixelSize));
        tempCanvas.height = Math.max(1, Math.ceil(canvas.height / pixelSize));
        tempCtx.imageSmoothingEnabled = false;
        tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
        if (toolId === 'pixel-art') {
          ctx.strokeStyle = 'rgba(0,0,0,0.08)';
          ctx.lineWidth = 0.5;
          for (let x = 0; x < canvas.width; x += pixelSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }
          for (let y = 0; y < canvas.height; y += pixelSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
          }
        }
      }
    } else if (toolId === 'censor-photo') {
      // Pixelate only the selected region (or center if missing)
      const r = region || {
        x: Math.round(canvas.width * 0.3),
        y: Math.round(canvas.height * 0.3),
        w: Math.round(canvas.width * 0.4),
        h: Math.round(canvas.height * 0.3),
      };
      const rx = Math.max(0, Math.min(canvas.width - 1, Math.round(r.x)));
      const ry = Math.max(0, Math.min(canvas.height - 1, Math.round(r.y)));
      const rw = Math.max(4, Math.min(canvas.width - rx, Math.round(r.w)));
      const rh = Math.max(4, Math.min(canvas.height - ry, Math.round(r.h)));
      const pixelSize = Math.max(4, Math.floor(intensity / 2.5));

      const slice = document.createElement('canvas');
      slice.width = rw;
      slice.height = rh;
      const sctx = slice.getContext('2d');
      if (sctx) {
        sctx.drawImage(img, rx, ry, rw, rh, 0, 0, rw, rh);
        const tiny = document.createElement('canvas');
        tiny.width = Math.max(1, Math.ceil(rw / pixelSize));
        tiny.height = Math.max(1, Math.ceil(rh / pixelSize));
        const tctx = tiny.getContext('2d');
        if (tctx) {
          tctx.imageSmoothingEnabled = false;
          tctx.drawImage(slice, 0, 0, tiny.width, tiny.height);
          sctx.imageSmoothingEnabled = false;
          sctx.clearRect(0, 0, rw, rh);
          sctx.drawImage(tiny, 0, 0, rw, rh);
          ctx.drawImage(slice, rx, ry);
        }
      }
    } else if (toolId === 'motion-blur') {
      const amount = intensity / 8;
      const rad = (angle * Math.PI) / 180;
      const steps = Math.max(4, Math.round(amount * 1.5));
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1 / steps;
      for (let i = 0; i < steps; i += 1) {
        const dx = Math.cos(rad) * (i - steps / 2) * (amount / steps) * 3;
        const dy = Math.sin(rad) * (i - steps / 2) * (amount / steps) * 3;
        ctx.drawImage(img, dx, dy);
      }
      ctx.globalAlpha = 1;
    }
  }, [angle, intensity, region]);

  const handleProcess = useCallback(async () => {
    if (!uploadedFile) {
      toast.error('Please upload an image first');
      return;
    }
    if (isCensor && !region) {
      toast.error('Drag on the image to select the area to censor.');
      return;
    }

    const toolKey = activeTool?.id || '';
    setIsProcessing(true);
    setProgress(0);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        toast.error('Failed to process');
        setIsProcessing(false);
        return;
      }

      try {
        applyEffectToCanvas(ctx, canvas, img, toolKey);
        setProgress(100);
        setProcessedImage(canvas.toDataURL('image/png'));
        toast.success('Effect applied!');
      } catch {
        toast.error('Failed to apply effect');
      }
      setIsProcessing(false);
    };
    img.onerror = () => {
      toast.error('Failed to load image');
      setIsProcessing(false);
    };
    img.src = URL.createObjectURL(uploadedFile);
  }, [activeTool, applyEffectToCanvas, isCensor, region, setIsProcessing, setProcessedImage, setProgress, uploadedFile]);

  const handleDownload = useCallback(() => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `${activeTool?.id || 'effect'}-${Date.now()}.png`;
    link.click();
  }, [processedImage, activeTool]);

  const handleReset = useCallback(() => {
    setIntensity(50);
    setAngle(0);
    setRegion(null);
    setPreviewUrl(null);
    setNaturalSize({ w: 0, h: 0 });
    reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [reset]);

  const onOverlayPointerDown = (e: React.PointerEvent) => {
    if (!isCensor || !overlayRef.current || !naturalSize.w) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const scaleX = naturalSize.w / rect.width;
    const scaleY = naturalSize.h / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    dragRef.current = { startX: x, startY: y, drawing: true };
    setRegion({ x, y, w: 4, h: 4 });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onOverlayPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current?.drawing || !overlayRef.current || !naturalSize.w) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const scaleX = naturalSize.w / rect.width;
    const scaleY = naturalSize.h / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const x0 = Math.min(dragRef.current.startX, x);
    const y0 = Math.min(dragRef.current.startY, y);
    setRegion({
      x: Math.max(0, x0),
      y: Math.max(0, y0),
      w: Math.max(4, Math.abs(x - dragRef.current.startX)),
      h: Math.max(4, Math.abs(y - dragRef.current.startY)),
    });
  };

  const onOverlayPointerUp = () => {
    if (dragRef.current) dragRef.current.drawing = false;
  };

  if (!activeTool) return null;

  const regionStyle = region && naturalSize.w
    ? {
        left: `${(region.x / naturalSize.w) * 100}%`,
        top: `${(region.y / naturalSize.h) * 100}%`,
        width: `${(region.w / naturalSize.w) * 100}%`,
        height: `${(region.h / naturalSize.h) * 100}%`,
      }
    : undefined;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 lg:px-8 py-8">
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        emoji={config.emoji}
        icon={null}
        onReset={handleReset}
      >
        {processedImage ? (
          <Button onClick={handleDownload} className="gap-2 btn-premium rounded-xl">
            <Download className="w-4 h-4" />
            Download
          </Button>
        ) : null}
      </ToolPageHeader>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <FileUpload accept="image/*" />

          {previewUrl && isCensor ? (
            <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/60 shadow-lg">
              <div className="border-b border-border/40 p-4">
                <h3 className="font-semibold">Select area to censor</h3>
                <p className="text-xs text-muted-foreground">Drag on the image to draw the blur/pixelate region.</p>
              </div>
              <div className="relative bg-muted/30 p-3">
                <div
                  ref={overlayRef}
                  className="relative mx-auto inline-block max-w-full touch-none cursor-crosshair"
                  onPointerDown={onOverlayPointerDown}
                  onPointerMove={onOverlayPointerMove}
                  onPointerUp={onOverlayPointerUp}
                  onPointerLeave={onOverlayPointerUp}
                >
                  <img src={previewUrl} alt="Source" className="max-h-[520px] max-w-full select-none rounded-lg" draggable={false} />
                  {regionStyle ? (
                    <div
                      className="pointer-events-none absolute border-2 border-dashed border-red-500 bg-red-500/20"
                      style={regionStyle}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {previewUrl && !isCensor && !processedImage ? (
            <div className="flex justify-center rounded-2xl border border-border/40 bg-muted/20 p-4">
              <img src={previewUrl} alt="Source preview" className="max-h-[420px] max-w-full rounded-lg object-contain" />
            </div>
          ) : null}

          {processedImage ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border border-primary/30 bg-primary/5 shadow-lg">
              <div className="flex items-center justify-between border-b border-primary/20 p-4">
                <h3 className="font-semibold">Result</h3>
                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">Applied</Badge>
              </div>
              <div className="flex aspect-video items-center justify-center bg-muted/30 p-4 dark:bg-zinc-900">
                <img src={processedImage} alt="Processed" className="max-h-full max-w-full rounded-lg object-contain" />
              </div>
            </motion.div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/60 shadow-premium backdrop-blur-xl">
            <div className="border-b border-border/40 bg-gradient-to-r from-primary/10 to-transparent p-5">
              <h3 className="flex items-center gap-2.5 font-bold">
                <Settings className="h-4 w-4 text-primary" />
                Effect settings
              </h3>
            </div>
            <div className="space-y-6 p-5">
              {config.hasIntensity ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>{config.label}</Label>
                    <span className="rounded-lg bg-primary/10 px-2.5 py-0.5 font-mono text-sm font-bold text-primary">{intensity}%</span>
                  </div>
                  <Slider value={[intensity]} onValueChange={([v]) => setIntensity(v)} min={1} max={100} step={1} />
                </div>
              ) : null}

              {activeTool.id === 'motion-blur' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Direction</Label>
                    <span className="rounded-lg bg-primary/10 px-2.5 py-0.5 font-mono text-sm font-bold text-primary">{angle}°</span>
                  </div>
                  <Slider value={[angle]} onValueChange={([v]) => setAngle(v)} min={0} max={360} step={15} />
                </div>
              ) : null}

              <div className="space-y-3 pt-2">
                <Button
                  className="btn-premium w-full rounded-xl py-6 font-bold"
                  onClick={handleProcess}
                  disabled={!uploadedFile || isProcessing}
                  size="lg"
                >
                  {isProcessing ? 'Processing…' : (
                    <>
                      <Sparkles className="mr-3 h-5 w-5" />
                      Apply effect
                    </>
                  )}
                </Button>
                <Button variant="outline" className="w-full gap-2 rounded-xl py-6" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                  Start over
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 to-transparent p-5">
            <h4 className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
              Tips
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Effects run in your browser — files stay private.
              </li>
              {isCensor ? (
                <li className="flex items-start gap-2">
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Draw a box over faces/plates, then apply.
                </li>
              ) : null}
              <li className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Adjust intensity, then re-apply for fine control.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
