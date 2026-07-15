'use client';

import { motion } from 'framer-motion';
import { Download, RotateCcw, Crop, Circle, Square, Scissors, Settings, Move, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

type CropMode = 'rect' | 'circle' | 'square' | 'freehand';
type DragMode = 'none' | 'move' | 'create' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se' | 'freehand';

const ASPECT_PRESETS = [
  { label: 'Free', value: 'free' },
  { label: '1:1', value: '1:1' },
  { label: '4:3', value: '4:3' },
  { label: '16:9', value: '16:9' },
  { label: '3:2', value: '3:2' },
  { label: '2:3', value: '2:3' },
  { label: '9:16', value: '9:16' },
];

const HANDLE_SIZE = 12;
const MIN_CROP = 20;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function parseAspect(value: string): number | null {
  if (!value || value === 'free') return null;
  const [w, h] = value.split(':').map(Number);
  if (!w || !h) return null;
  return w / h;
}

export function CropWorkspace() {
  const {
    activeTool, uploadedFile, processedImage, isProcessing,
    reset, setIsProcessing, setProcessedImage, setProgress,
  } = useAppStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const dragRef = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    originW: number;
    originH: number;
  } | null>(null);

  const cropMode: CropMode =
    activeTool?.id === 'circle-crop' ? 'circle'
      : activeTool?.id === 'square-crop' ? 'square'
        : activeTool?.id === 'freehand-crop' ? 'freehand'
          : 'rect';

  const [aspectRatio, setAspectRatio] = useState(
    cropMode === 'square' || cropMode === 'circle' ? '1:1' : 'free',
  );
  const [crop, setCrop] = useState({ x: 50, y: 50, w: 300, h: 300 });
  const [freehandPath, setFreehandPath] = useState<Array<{ x: number; y: number }>>([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [cursor, setCursor] = useState('crosshair');

  const lockedAspect = useMemo(() => {
    if (cropMode === 'square' || cropMode === 'circle') return 1;
    return parseAspect(aspectRatio);
  }, [aspectRatio, cropMode]);

  // Load image
  useEffect(() => {
    if (!uploadedFile) {
      setImageLoaded(false);
      imageRef.current = null;
      setFreehandPath([]);
      return;
    }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(uploadedFile);
    objectUrlRef.current = url;

    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      const maxW = Math.min(900, typeof window !== 'undefined' ? window.innerWidth - 48 : 900);
      const scale = Math.min(1, maxW / img.width);
      const cw = Math.max(1, Math.round(img.width * scale));
      const ch = Math.max(1, Math.round(img.height * scale));
      setCanvasSize({ w: cw, h: ch });

      const side = Math.round(Math.min(cw, ch) * 0.62);
      const w = cropMode === 'circle' || cropMode === 'square' ? side : Math.round(cw * 0.7);
      const h = cropMode === 'circle' || cropMode === 'square' ? side : Math.round(ch * 0.55);
      setCrop({
        x: Math.round((cw - w) / 2),
        y: Math.round((ch - h) / 2),
        w,
        h,
      });
      setFreehandPath([]);
      setImageLoaded(true);
      setProcessedImage(null);
    };
    img.onerror = () => {
      toast.error('Could not load this image. Try JPG or PNG.');
      setImageLoaded(false);
    };
    img.src = url;

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only on file/mode
  }, [uploadedFile, cropMode]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded || canvasSize.w === 0) return;

    canvas.width = canvasSize.w;
    canvas.height = canvasSize.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Dim outside selection
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (cropMode === 'freehand' && freehandPath.length > 2) {
      ctx.beginPath();
      ctx.moveTo(freehandPath[0].x, freehandPath[0].y);
      for (let i = 1; i < freehandPath.length; i += 1) {
        ctx.lineTo(freehandPath[i].x, freehandPath[i].y);
      }
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(freehandPath[0].x, freehandPath[0].y);
      for (let i = 1; i < freehandPath.length; i += 1) {
        ctx.lineTo(freehandPath[i].x, freehandPath[i].y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }

    if (cropMode === 'circle') {
      const r = Math.min(crop.w, crop.h) / 2;
      const cx = crop.x + r;
      const cy = crop.y + r;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.beginPath();
      ctx.rect(crop.x, crop.y, crop.w, crop.h);
      ctx.clip();
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(crop.x, crop.y, crop.w, crop.h);
      ctx.setLineDash([]);

      // Rule-of-thirds guides
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 2; i += 1) {
        const gx = crop.x + (crop.w * i) / 3;
        const gy = crop.y + (crop.h * i) / 3;
        ctx.beginPath();
        ctx.moveTo(gx, crop.y);
        ctx.lineTo(gx, crop.y + crop.h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(crop.x, gy);
        ctx.lineTo(crop.x + crop.w, gy);
        ctx.stroke();
      }
    }

    // Corner handles (not freehand)
    if (cropMode !== 'freehand') {
      const corners = [
        { x: crop.x, y: crop.y },
        { x: crop.x + crop.w, y: crop.y },
        { x: crop.x, y: crop.y + crop.h },
        { x: crop.x + crop.w, y: crop.y + crop.h },
      ];
      for (const c of corners) {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(c.x - HANDLE_SIZE / 2, c.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
        ctx.fill();
        ctx.stroke();
      }
    }
  }, [imageLoaded, canvasSize, crop, cropMode, freehandPath]);

  const getCanvasPoint = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: clamp((clientX - rect.left) * scaleX, 0, canvas.width),
      y: clamp((clientY - rect.top) * scaleY, 0, canvas.height),
    };
  }, []);

  const hitHandle = useCallback((x: number, y: number): DragMode => {
    if (cropMode === 'freehand') return 'freehand';
    const pts: Array<{ mode: DragMode; x: number; y: number }> = [
      { mode: 'resize-nw', x: crop.x, y: crop.y },
      { mode: 'resize-ne', x: crop.x + crop.w, y: crop.y },
      { mode: 'resize-sw', x: crop.x, y: crop.y + crop.h },
      { mode: 'resize-se', x: crop.x + crop.w, y: crop.y + crop.h },
    ];
    for (const p of pts) {
      if (Math.abs(x - p.x) <= HANDLE_SIZE && Math.abs(y - p.y) <= HANDLE_SIZE) {
        return p.mode;
      }
    }
    if (x >= crop.x && x <= crop.x + crop.w && y >= crop.y && y <= crop.y + crop.h) {
      return 'move';
    }
    return 'create';
  }, [crop, cropMode]);

  const applyAspect = useCallback((box: { x: number; y: number; w: number; h: number }, fromCorner: DragMode) => {
    const ratio = lockedAspect;
    if (!ratio) return box;
    const x = box.x;
    let y = box.y;
    let w = box.w;
    let h = Math.round(w / ratio);
    if (fromCorner === 'resize-nw' || fromCorner === 'resize-ne') {
      y = box.y + box.h - h;
    }
    if (h < MIN_CROP) {
      h = MIN_CROP;
      w = Math.round(h * ratio);
    }
    return { x, y, w, h };
  }, [lockedAspect]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!imageLoaded) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const { x, y } = getCanvasPoint(e.clientX, e.clientY);

    if (cropMode === 'freehand') {
      setFreehandPath([{ x, y }]);
      dragRef.current = {
        mode: 'freehand',
        startX: x,
        startY: y,
        originX: crop.x,
        originY: crop.y,
        originW: crop.w,
        originH: crop.h,
      };
      setCursor('crosshair');
      return;
    }

    const mode = hitHandle(x, y);
    dragRef.current = {
      mode,
      startX: x,
      startY: y,
      originX: crop.x,
      originY: crop.y,
      originW: crop.w,
      originH: crop.h,
    };
    if (mode === 'create') {
      setCrop({ x, y, w: MIN_CROP, h: MIN_CROP });
    }
    setCursor(mode === 'move' ? 'move' : 'crosshair');
  }, [crop, cropMode, getCanvasPoint, hitHandle, imageLoaded]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!imageLoaded) return;
    const { x, y } = getCanvasPoint(e.clientX, e.clientY);

    if (!dragRef.current) {
      const mode = hitHandle(x, y);
      if (mode === 'move') setCursor('move');
      else if (mode.startsWith('resize')) setCursor('nwse-resize');
      else setCursor('crosshair');
      return;
    }

    const d = dragRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (d.mode === 'freehand') {
      setFreehandPath((prev) => {
        const last = prev[prev.length - 1];
        if (last && Math.hypot(last.x - x, last.y - y) < 2) return prev;
        return [...prev, { x, y }];
      });
      return;
    }

    if (d.mode === 'move') {
      const dx = x - d.startX;
      const dy = y - d.startY;
      setCrop({
        x: clamp(d.originX + dx, 0, canvas.width - d.originW),
        y: clamp(d.originY + dy, 0, canvas.height - d.originH),
        w: d.originW,
        h: d.originH,
      });
      return;
    }

    if (d.mode === 'create') {
      const x1 = Math.min(d.startX, x);
      const y1 = Math.min(d.startY, y);
      const w = Math.abs(x - d.startX);
      const h = Math.abs(y - d.startY);
      let box = { x: x1, y: y1, w: Math.max(MIN_CROP, w), h: Math.max(MIN_CROP, h) };
      box = applyAspect(box, 'resize-se');
      box.w = clamp(box.w, MIN_CROP, canvas.width - box.x);
      box.h = clamp(box.h, MIN_CROP, canvas.height - box.y);
      if (lockedAspect === 1 || cropMode === 'square' || cropMode === 'circle') {
        const s = Math.min(box.w, box.h);
        box.w = s;
        box.h = s;
      }
      setCrop(box);
      return;
    }

    // Resize from corners
    let x0 = d.originX;
    let y0 = d.originY;
    let x1 = d.originX + d.originW;
    let y1 = d.originY + d.originH;

    if (d.mode === 'resize-nw') { x0 = x; y0 = y; }
    if (d.mode === 'resize-ne') { x1 = x; y0 = y; }
    if (d.mode === 'resize-sw') { x0 = x; y1 = y; }
    if (d.mode === 'resize-se') { x1 = x; y1 = y; }

    const nx = Math.min(x0, x1);
    const ny = Math.min(y0, y1);
    const nw = Math.abs(x1 - x0);
    const nh = Math.abs(y1 - y0);

    const box = applyAspect(
      { x: nx, y: ny, w: Math.max(MIN_CROP, nw), h: Math.max(MIN_CROP, nh) },
      d.mode,
    );

    if (cropMode === 'square' || cropMode === 'circle' || lockedAspect === 1) {
      const s = Math.min(box.w, box.h);
      box.w = s;
      box.h = s;
      if (d.mode === 'resize-nw') {
        box.x = d.originX + d.originW - s;
        box.y = d.originY + d.originH - s;
      } else if (d.mode === 'resize-ne') {
        box.y = d.originY + d.originH - s;
      } else if (d.mode === 'resize-sw') {
        box.x = d.originX + d.originW - s;
      }
    }

    box.x = clamp(box.x, 0, canvas.width - MIN_CROP);
    box.y = clamp(box.y, 0, canvas.height - MIN_CROP);
    box.w = clamp(box.w, MIN_CROP, canvas.width - box.x);
    box.h = clamp(box.h, MIN_CROP, canvas.height - box.y);
    setCrop(box);
  }, [applyAspect, cropMode, getCanvasPoint, hitHandle, imageLoaded, lockedAspect]);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleCrop = useCallback(() => {
    if (!imageRef.current || !canvasRef.current) {
      toast.error('Please upload an image first');
      return;
    }

    setIsProcessing(true);
    setProgress(10);

    try {
      const img = imageRef.current;
      const canvas = canvasRef.current;
      const scale = img.width / canvas.width;

      if (cropMode === 'freehand') {
        if (freehandPath.length < 8) {
          toast.error('Draw a larger freehand shape around the area to keep.');
          setIsProcessing(false);
          return;
        }
        const xs = freehandPath.map((p) => p.x);
        const ys = freehandPath.map((p) => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const bw = Math.max(1, maxX - minX);
        const bh = Math.max(1, maxY - minY);

        const out = document.createElement('canvas');
        out.width = Math.round(bw * scale);
        out.height = Math.round(bh * scale);
        const ctx = out.getContext('2d');
        if (!ctx) throw new Error('Canvas unavailable');

        ctx.save();
        ctx.beginPath();
        freehandPath.forEach((p, i) => {
          const px = (p.x - minX) * scale;
          const py = (p.y - minY) * scale;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(
          img,
          minX * scale,
          minY * scale,
          bw * scale,
          bh * scale,
          0,
          0,
          out.width,
          out.height,
        );
        ctx.restore();
        setProcessedImage(out.toDataURL('image/png'));
      } else {
        const sx = Math.round(crop.x * scale);
        const sy = Math.round(crop.y * scale);
        const sw = Math.round(crop.w * scale);
        const sh = Math.round(crop.h * scale);

        const out = document.createElement('canvas');
        if (cropMode === 'circle') {
          const size = Math.min(sw, sh);
          out.width = size;
          out.height = size;
          const ctx = out.getContext('2d');
          if (!ctx) throw new Error('Canvas unavailable');
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
        } else {
          out.width = sw;
          out.height = sh;
          const ctx = out.getContext('2d');
          if (!ctx) throw new Error('Canvas unavailable');
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        }
        setProcessedImage(out.toDataURL('image/png'));
      }

      setProgress(100);
      toast.success('Image cropped successfully.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to crop image');
    } finally {
      setIsProcessing(false);
    }
  }, [crop, cropMode, freehandPath, setIsProcessing, setProcessedImage, setProgress]);

  const handleDownload = useCallback(() => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `cropped-${Date.now()}.png`;
    link.click();
  }, [processedImage]);

  const handleReset = useCallback(() => {
    setImageLoaded(false);
    setFreehandPath([]);
    reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [reset]);

  const fitCenter = useCallback(() => {
    if (!canvasSize.w) return;
    const side = Math.round(Math.min(canvasSize.w, canvasSize.h) * 0.7);
    const w = cropMode === 'circle' || cropMode === 'square' || lockedAspect === 1
      ? side
      : Math.round(canvasSize.w * 0.75);
    let h = cropMode === 'circle' || cropMode === 'square' || lockedAspect === 1
      ? side
      : Math.round(canvasSize.h * 0.6);
    if (lockedAspect && lockedAspect !== 1) {
      h = Math.round(w / lockedAspect);
    }
    setCrop({
      x: Math.round((canvasSize.w - w) / 2),
      y: Math.round((canvasSize.h - h) / 2),
      w,
      h: Math.min(h, canvasSize.h),
    });
    setFreehandPath([]);
  }, [canvasSize, cropMode, lockedAspect]);

  if (!activeTool) return null;

  const modeIcons: Record<CropMode, React.ReactNode> = {
    rect: <Crop className="w-4 h-4" />,
    circle: <Circle className="w-4 h-4" />,
    square: <Square className="w-4 h-4" />,
    freehand: <Scissors className="w-4 h-4" />,
  };

  const helpText =
    cropMode === 'freehand'
      ? 'Draw around the area you want to keep. Lift your finger/mouse to finish the path.'
      : 'Drag on the image to create a selection. Drag inside to move. Use corner handles to resize.';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 lg:px-8 py-8">
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        icon={modeIcons[cropMode]}
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

          {uploadedFile && imageLoaded ? (
            <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/60 shadow-lg backdrop-blur-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 bg-gradient-to-r from-primary/5 to-transparent p-4">
                <div>
                  <h3 className="font-semibold">Select crop area</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{helpText}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Move className="h-3 w-3" />
                    Drag to move
                  </Badge>
                  {cropMode !== 'freehand' ? (
                    <Badge variant="secondary" className="gap-1">
                      <Maximize2 className="h-3 w-3" />
                      Corners resize
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div
                ref={containerRef}
                className="flex justify-center overflow-auto bg-muted/30 p-3 dark:bg-zinc-950"
              >
                <canvas
                  ref={canvasRef}
                  className="max-w-full touch-none rounded-lg shadow-md"
                  style={{ cursor, maxHeight: '70vh' }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  onPointerLeave={onPointerUp}
                />
              </div>
            </div>
          ) : null}

          {processedImage ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-2xl border border-primary/30 bg-primary/5 shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-primary/20 p-4">
                <h3 className="font-semibold">Cropped result</h3>
                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">Done</Badge>
              </div>
              <div className="flex min-h-[200px] items-center justify-center bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] p-4 dark:bg-[linear-gradient(45deg,#1f2937_25%,transparent_25%),linear-gradient(-45deg,#1f2937_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1f2937_75%),linear-gradient(-45deg,transparent_75%,#1f2937_75%)]">
                <img src={processedImage} alt="Cropped result" className="max-h-96 max-w-full rounded-lg object-contain" />
              </div>
            </motion.div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/60 shadow-premium backdrop-blur-xl">
            <div className="border-b border-border/40 bg-gradient-to-r from-primary/10 to-transparent p-5">
              <h3 className="flex items-center gap-2.5 font-bold tracking-tight">
                <Settings className="h-4 w-4 text-primary" />
                Crop settings
              </h3>
            </div>
            <div className="space-y-4 p-5">
              {cropMode === 'rect' ? (
                <div className="space-y-2">
                  <Label>Aspect ratio</Label>
                  <Select
                    value={aspectRatio}
                    onValueChange={(v) => {
                      setAspectRatio(v);
                      const ratio = parseAspect(v);
                      if (ratio && canvasRef.current) {
                        const h = Math.round(crop.w / ratio);
                        setCrop((c) => ({
                          ...c,
                          h: clamp(h, MIN_CROP, canvasSize.h - c.y),
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASPECT_PRESETS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {cropMode !== 'freehand' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">X</Label>
                    <Input
                      type="number"
                      value={Math.round(crop.x)}
                      onChange={(e) => setCrop((c) => ({ ...c, x: Number(e.target.value) || 0 }))}
                      min={0}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Y</Label>
                    <Input
                      type="number"
                      value={Math.round(crop.y)}
                      onChange={(e) => setCrop((c) => ({ ...c, y: Number(e.target.value) || 0 }))}
                      min={0}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Width</Label>
                    <Input
                      type="number"
                      value={Math.round(crop.w)}
                      onChange={(e) => {
                        const w = Math.max(MIN_CROP, Number(e.target.value) || MIN_CROP);
                        setCrop((c) => ({
                          ...c,
                          w,
                          h: cropMode === 'square' || cropMode === 'circle' ? w : c.h,
                        }));
                      }}
                      min={MIN_CROP}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Height</Label>
                    <Input
                      type="number"
                      value={Math.round(crop.h)}
                      onChange={(e) => setCrop((c) => ({ ...c, h: Math.max(MIN_CROP, Number(e.target.value) || MIN_CROP) }))}
                      min={MIN_CROP}
                      disabled={cropMode === 'square' || cropMode === 'circle'}
                    />
                  </div>
                </div>
              ) : (
                <p className="rounded-xl border border-border/50 bg-muted/40 p-3 text-sm text-muted-foreground">
                  Freehand points: <strong className="text-foreground">{freehandPath.length}</strong>
                  {freehandPath.length > 0 ? (
                    <button
                      type="button"
                      className="ml-2 text-primary underline"
                      onClick={() => setFreehandPath([])}
                    >
                      Clear path
                    </button>
                  ) : null}
                </p>
              )}

              <Button type="button" variant="secondary" className="w-full rounded-xl" onClick={fitCenter} disabled={!imageLoaded}>
                Reset selection to center
              </Button>

              <div className="space-y-3 pt-1">
                <Button
                  className="btn-premium w-full rounded-xl py-6 font-bold shadow-xl shadow-primary/20"
                  onClick={handleCrop}
                  disabled={!uploadedFile || !imageLoaded || isProcessing}
                  size="lg"
                >
                  {isProcessing ? 'Cropping…' : 'Crop image'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2 rounded-xl py-6"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-4 w-4" />
                  Start over
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 to-transparent p-5 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Tips for a clean crop</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Use corner handles for precise framing.</li>
              <li>Lock aspect ratio for social/passport formats.</li>
              <li>Output is PNG so transparency (circle/freehand) is preserved.</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
