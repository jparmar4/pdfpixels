'use client';

import { motion } from 'framer-motion';
import {
  Download,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Settings,
  Grid3X3,
  Contrast,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ToolLimitNotice } from './tool-limit-notice';

type EffectMeta = {
  emoji: string;
  hasIntensity: boolean;
  label: string;
  applyLabel: string;
  tips: string[];
  presets?: Array<{ label: string; value: number }>;
  defaultIntensity: number;
  intensityUnit?: string;
};

const EFFECT_CONFIG: Record<string, EffectMeta> = {
  'blur-image': {
    emoji: '🌫️',
    hasIntensity: true,
    label: 'Blur intensity',
    applyLabel: 'Apply blur',
    defaultIntensity: 40,
    tips: ['Higher values create a softer, dreamier look.', 'Processing stays in your browser.'],
    presets: [
      { label: 'Light', value: 20 },
      { label: 'Medium', value: 45 },
      { label: 'Heavy', value: 75 },
    ],
  },
  pixelate: {
    emoji: '🔲',
    hasIntensity: true,
    label: 'Pixel block size',
    applyLabel: 'Apply pixelate',
    defaultIntensity: 45,
    intensityUnit: 'px',
    tips: [
      'Larger blocks hide more detail — good for privacy mosaics.',
      'Live preview updates as you drag the slider.',
    ],
    presets: [
      { label: 'Fine', value: 20 },
      { label: 'Medium', value: 45 },
      { label: 'Blocky', value: 70 },
      { label: 'Heavy', value: 90 },
    ],
  },
  grayscale: {
    emoji: '🖤',
    hasIntensity: true,
    label: 'Desaturation',
    applyLabel: 'Convert to grayscale',
    defaultIntensity: 100,
    tips: [
      '100% is full grayscale; lower keeps some color.',
      'Contrast boost makes monochrome photos pop.',
    ],
    presets: [
      { label: 'Soft', value: 60 },
      { label: 'Full', value: 100 },
    ],
  },
  'black-white': {
    emoji: '⬛',
    hasIntensity: true,
    label: 'Contrast',
    applyLabel: 'Convert to B&W',
    defaultIntensity: 55,
    tips: [
      'Smooth B&W keeps mid-tones so text and details stay readable.',
      'Raise contrast for punchier photos; use Document for scans with text.',
      'Poster mode (95%+) is a hard black/white cut — only for stamp-style looks.',
    ],
    presets: [
      { label: 'Soft', value: 30 },
      { label: 'Balanced', value: 55 },
      { label: 'Document', value: 72 },
      { label: 'Poster', value: 98 },
    ],
  },
  sepia: {
    emoji: '🟤',
    hasIntensity: true,
    label: 'Sepia strength',
    applyLabel: 'Apply sepia',
    defaultIntensity: 70,
    tips: ['Warm vintage tone — raise strength for a stronger look.'],
    presets: [
      { label: 'Subtle', value: 35 },
      { label: 'Classic', value: 70 },
      { label: 'Deep', value: 100 },
    ],
  },
  invert: {
    emoji: '🔄',
    hasIntensity: false,
    label: '',
    applyLabel: 'Invert colors',
    defaultIntensity: 50,
    tips: ['Creates a negative-style color invert.'],
  },
  'motion-blur': {
    emoji: '💨',
    hasIntensity: true,
    label: 'Motion amount',
    applyLabel: 'Apply motion blur',
    defaultIntensity: 50,
    tips: ['Adjust direction for horizontal, vertical, or diagonal streak.'],
    presets: [
      { label: 'Soft', value: 25 },
      { label: 'Medium', value: 50 },
      { label: 'Strong', value: 80 },
    ],
  },
  'censor-photo': {
    emoji: '🚫',
    hasIntensity: true,
    label: 'Censor strength',
    applyLabel: 'Apply censor',
    defaultIntensity: 55,
    tips: ['Drag on the image to select the area to hide.'],
  },
  'pixel-art': {
    emoji: '🎮',
    hasIntensity: true,
    label: 'Pixel block size',
    applyLabel: 'Apply pixel art',
    defaultIntensity: 40,
    tips: ['Creates a retro game-style look with optional grid.'],
    presets: [
      { label: 'Fine', value: 25 },
      { label: 'Classic', value: 45 },
      { label: 'Chunky', value: 70 },
    ],
  },
};

type Region = { x: number; y: number; w: number; h: number };

function pixelSizeFromIntensity(intensity: number, toolId: string) {
  if (toolId === 'pixel-art') return Math.max(2, Math.floor(2 + (intensity / 100) * 28));
  // pixelate: ~3–40px blocks
  return Math.max(2, Math.floor(3 + (intensity / 100) * 37));
}

export function EffectWorkspace() {
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

  const toolId = activeTool?.id || '';
  const config = EFFECT_CONFIG[toolId] || {
    emoji: '✨',
    hasIntensity: true,
    label: 'Intensity',
    applyLabel: 'Apply effect',
    defaultIntensity: 50,
    tips: ['Effects run in your browser — files stay private.'],
  };

  const [intensity, setIntensity] = useState(config.defaultIntensity);
  const [contrast, setContrast] = useState(0); // grayscale only: -50..50 mapped
  const [angle, setAngle] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [livePreviewUrl, setLivePreviewUrl] = useState<string | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [showCompare, setShowCompare] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; drawing: boolean } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCensor = toolId === 'censor-photo';
  const isGrayscale = toolId === 'grayscale';
  const isPixelate = toolId === 'pixelate' || toolId === 'pixel-art';
  const isBW = toolId === 'black-white';
  const supportsLivePreview = !isCensor; // censor needs selection first

  // Reset defaults when tool changes
  useEffect(() => {
    setIntensity(config.defaultIntensity);
    setContrast(0);
    setAngle(0);
    setShowCompare(false);
    setProcessedImage(null);
    setLivePreviewUrl(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolId]);

  useEffect(() => {
    if (!uploadedFile) {
      setPreviewUrl(null);
      setLivePreviewUrl(null);
      imageRef.current = null;
      return;
    }
    const url = URL.createObjectURL(uploadedFile);
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setPreviewUrl(url);
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      setProcessedImage(null);
      setShowCompare(false);
      if (isCensor) {
        const w = Math.round(img.naturalWidth * 0.35);
        const h = Math.round(img.naturalHeight * 0.25);
        setRegion({
          x: Math.round((img.naturalWidth - w) / 2),
          y: Math.round((img.naturalHeight - h) / 2),
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
  }, [uploadedFile, isCensor, setProcessedImage]);

  const applyEffectToCanvas = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      img: HTMLImageElement,
      id: string,
      opts: { intensity: number; angle: number; contrast: number; region: Region | null },
    ) => {
      const { intensity: int, angle: ang, contrast: con, region: reg } = opts;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      if (id === 'grayscale') {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;
        const amount = Math.max(0, Math.min(1, int / 100));
        // contrast: -40..60 → multiplier around 0.6..1.6
        const c = 1 + con / 100;
        for (let i = 0; i < d.length; i += 4) {
          const gray = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
          let g = (gray - 128) * c + 128;
          g = Math.max(0, Math.min(255, g));
          d[i] = d[i] + (g - d[i]) * amount;
          d[i + 1] = d[i + 1] + (g - d[i + 1]) * amount;
          d[i + 2] = d[i + 2] + (g - d[i + 2]) * amount;
        }
        ctx.putImageData(imageData, 0, 0);
      } else if (id === 'black-white') {
        /**
         * Readable black & white (NOT pure binary threshold by default).
         * Old hard threshold crushed mid-tones so colored text became unreadable.
         *
         * Pipeline:
         * 1) Rec.601 luminance (true perceived brightness of colored pixels)
         * 2) Auto-levels stretch so ink separates from tinted backgrounds
         * 3) S-curve + contrast slider for punch without destroying detail
         * 4) Poster preset (intensity ≥ 92) only then eases toward hard cut
         */
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;
        const pixelCount = d.length / 4;
        const grays = new Float32Array(pixelCount);

        let minG = 255;
        let maxG = 0;
        // Histogram for percentile auto-levels (ignore extreme 1% outliers)
        const hist = new Uint32Array(256);
        for (let p = 0, i = 0; p < pixelCount; p += 1, i += 4) {
          const g = Math.round(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
          const gv = Math.max(0, Math.min(255, g));
          grays[p] = gv;
          hist[gv] += 1;
          if (gv < minG) minG = gv;
          if (gv > maxG) maxG = gv;
        }

        const lowCount = Math.floor(pixelCount * 0.01);
        const highCount = Math.floor(pixelCount * 0.99);
        let acc = 0;
        let pLow = minG;
        let pHigh = maxG;
        for (let b = 0; b < 256; b += 1) {
          acc += hist[b];
          if (acc >= lowCount && pLow === minG) pLow = b;
          if (acc >= highCount) {
            pHigh = b;
            break;
          }
        }
        const range = Math.max(24, pHigh - pLow);

        // Contrast: Soft 30→~1.05, Balanced 55→~1.3, Document 72→~1.45
        const contrastAmt = 0.9 + (Math.min(88, Math.max(1, int)) / 100) * 0.95;
        const posterT = int >= 92 ? Math.min(1, (int - 92) / 8) : 0;

        for (let p = 0, i = 0; p < pixelCount; p += 1, i += 4) {
          // Auto-level using percentiles so text on color backgrounds pops
          let g = ((grays[p] - pLow) / range) * 255;
          g = Math.max(0, Math.min(255, g));

          // Gentle S-curve: strengthens edges (text) without full binary crush
          const x = g / 255;
          const s = x * x * (3 - 2 * x);
          g = (x * 0.55 + s * 0.45) * 255;

          // User contrast around mid-gray
          g = (g - 128) * contrastAmt + 128;

          // Keep thin/light text from vanishing into pure black
          if (posterT === 0 && g > 28 && g < 200) {
            g += 4 * (1 - Math.abs(g - 140) / 140);
          }

          g = Math.max(0, Math.min(255, g));

          if (posterT > 0) {
            // Soft sigmoid → hard poster only for Poster preset
            const mid = 120;
            const softness = Math.max(3, 26 * (1 - posterT));
            const sigmoid = 1 / (1 + Math.exp(-(g - mid) / softness));
            g = g * (1 - posterT) + sigmoid * 255 * posterT;
            g = Math.max(0, Math.min(255, g));
          }

          const v = Math.round(g);
          d[i] = v;
          d[i + 1] = v;
          d[i + 2] = v;
        }
        ctx.putImageData(imageData, 0, 0);
      } else if (id === 'sepia') {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;
        const strength = int / 100;
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
      } else if (id === 'invert') {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          d[i] = 255 - d[i];
          d[i + 1] = 255 - d[i + 1];
          d[i + 2] = 255 - d[i + 2];
        }
        ctx.putImageData(imageData, 0, 0);
      } else if (id === 'blur-image') {
        ctx.filter = `blur(${Math.max(0.5, int / 8)}px)`;
        ctx.drawImage(img, 0, 0);
        ctx.filter = 'none';
      } else if (id === 'pixelate' || id === 'pixel-art') {
        const pixelSize = pixelSizeFromIntensity(int, id);
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCanvas.width = Math.max(1, Math.ceil(canvas.width / pixelSize));
          tempCanvas.height = Math.max(1, Math.ceil(canvas.height / pixelSize));
          tempCtx.imageSmoothingEnabled = false;
          tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
          ctx.imageSmoothingEnabled = false;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
          if (id === 'pixel-art') {
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
      } else if (id === 'censor-photo') {
        const r = reg || {
          x: Math.round(canvas.width * 0.3),
          y: Math.round(canvas.height * 0.3),
          w: Math.round(canvas.width * 0.4),
          h: Math.round(canvas.height * 0.3),
        };
        const rx = Math.max(0, Math.min(canvas.width - 1, Math.round(r.x)));
        const ry = Math.max(0, Math.min(canvas.height - 1, Math.round(r.y)));
        const rw = Math.max(4, Math.min(canvas.width - rx, Math.round(r.w)));
        const rh = Math.max(4, Math.min(canvas.height - ry, Math.round(r.h)));
        const pixelSize = Math.max(4, Math.floor(int / 2.5));

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
      } else if (id === 'motion-blur') {
        const amount = int / 8;
        const rad = (ang * Math.PI) / 180;
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
    },
    [],
  );

  // Live preview (downscaled for speed)
  useEffect(() => {
    if (!supportsLivePreview || !imageRef.current || !uploadedFile) {
      return;
    }

    const render = () => {
      const img = imageRef.current;
      if (!img) return;
      try {
        const maxSide = 900;
        const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw scaled source first into temp for effect functions that use img size
        const scaled = document.createElement('canvas');
        scaled.width = w;
        scaled.height = h;
        const sctx = scaled.getContext('2d');
        if (!sctx) return;
        sctx.drawImage(img, 0, 0, w, h);
        const scaledImg = new Image();
        // Use the scaled canvas as image source via blob-free path: apply on scaled canvas directly
        // Re-implement: draw img scaled then run effect using scaled dimensions
        const proxy = {
          naturalWidth: w,
          naturalHeight: h,
          width: w,
          height: h,
        } as HTMLImageElement;

        // Custom path: draw source scaled then apply pixel ops on that canvas
        ctx.drawImage(img, 0, 0, w, h);
        // Build a fake image from current canvas for drawImage-based effects
        const tmp = document.createElement('canvas');
        tmp.width = w;
        tmp.height = h;
        const tctx = tmp.getContext('2d')!;
        tctx.drawImage(img, 0, 0, w, h);
        const dataUrlSrc = tmp.toDataURL('image/png');
        const i2 = new window.Image();
        i2.onload = () => {
          applyEffectToCanvas(ctx, canvas, i2, toolId, {
            intensity,
            angle,
            contrast,
            region: region
              ? {
                  x: region.x * scale,
                  y: region.y * scale,
                  w: region.w * scale,
                  h: region.h * scale,
                }
              : null,
          });
          setLivePreviewUrl(canvas.toDataURL('image/png'));
        };
        i2.src = dataUrlSrc;
        void proxy;
      } catch {
        // ignore
      }
    };

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(render, 60);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    angle,
    applyEffectToCanvas,
    contrast,
    intensity,
    region,
    supportsLivePreview,
    toolId,
    uploadedFile,
    naturalSize,
  ]);

  const handleProcess = useCallback(async () => {
    if (!uploadedFile) {
      toast.error('Please upload an image first');
      return;
    }
    if (isCensor && !region) {
      toast.error('Drag on the image to select the area to censor.');
      return;
    }

    setIsProcessing(true);
    setProgress(15);

    try {
      const img = imageRef.current ?? (await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error('Failed to load image'));
        i.src = URL.createObjectURL(uploadedFile);
      }));
      imageRef.current = img;

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');

      setProgress(55);
      applyEffectToCanvas(ctx, canvas, img, toolId, {
        intensity,
        angle,
        contrast,
        region,
      });
      setProgress(100);
      const dataUrl = canvas.toDataURL('image/png');
      setProcessedImage(dataUrl);
      setShowCompare(true);
      toast.success(
        isBW
          ? 'Black & white conversion complete.'
          : isGrayscale
            ? 'Grayscale conversion complete.'
            : isPixelate
              ? 'Pixelate effect applied.'
              : 'Effect applied!',
      );
      requestAnimationFrame(() => {
        document.getElementById('effect-result')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to apply effect');
    } finally {
      setIsProcessing(false);
    }
  }, [
    angle,
    applyEffectToCanvas,
    contrast,
    intensity,
    isBW,
    isCensor,
    isGrayscale,
    isPixelate,
    region,
    setIsProcessing,
    setProcessedImage,
    setProgress,
    toolId,
    uploadedFile,
  ]);

  const handleDownload = useCallback(() => {
    if (!processedImage) return;
    const base = uploadedFile?.name?.replace(/\.[^.]+$/, '') || 'image';
    const suffix =
      toolId === 'black-white'
        ? 'bw'
        : toolId === 'grayscale'
          ? 'grayscale'
          : toolId === 'pixelate'
            ? 'pixelate'
            : toolId || 'effect';
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `${base}-${suffix}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Download started');
  }, [processedImage, toolId, uploadedFile]);

  const handleProcessAndDownload = useCallback(async () => {
    if (!uploadedFile) {
      toast.error('Please upload an image first');
      return;
    }
    setIsProcessing(true);
    setProgress(20);
    try {
      const img = imageRef.current ?? (await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error('Failed to load image'));
        i.src = URL.createObjectURL(uploadedFile);
      }));
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      applyEffectToCanvas(ctx, canvas, img, toolId, { intensity, angle, contrast, region });
      const dataUrl = canvas.toDataURL('image/png');
      setProcessedImage(dataUrl);
      setProgress(100);
      const base = uploadedFile.name?.replace(/\.[^.]+$/, '') || 'image';
      const suffix =
        toolId === 'black-white' ? 'bw' : toolId === 'grayscale' ? 'grayscale' : toolId === 'pixelate' ? 'pixelate' : toolId || 'effect';
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${base}-${suffix}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Effect applied and download started.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to process');
    } finally {
      setIsProcessing(false);
    }
  }, [
    angle,
    applyEffectToCanvas,
    contrast,
    intensity,
    region,
    setIsProcessing,
    setProcessedImage,
    setProgress,
    toolId,
    uploadedFile,
  ]);

  const handleReset = useCallback(() => {
    setIntensity(config.defaultIntensity);
    setContrast(0);
    setAngle(0);
    setRegion(null);
    setPreviewUrl(null);
    setLivePreviewUrl(null);
    setNaturalSize({ w: 0, h: 0 });
    setShowCompare(false);
    imageRef.current = null;
    reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [config.defaultIntensity, reset]);

  const onOverlayPointerDown = (e: React.PointerEvent) => {
    if (!isCensor || !overlayRef.current || !naturalSize.w) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const scaleX = naturalSize.w / rect.width;
    const scaleY = naturalSize.h / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    dragRef.current = { startX: x, startY: y, drawing: true };
    setRegion({ x, y, w: 4, h: 4 });
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
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

  const displayPreview = livePreviewUrl || previewUrl;
  const pixelLabel = isPixelate ? `${pixelSizeFromIntensity(intensity, toolId)}px` : null;

  const intensityDisplay = useMemo(() => {
    if (isPixelate) return pixelLabel;
    if (isBW) return `${intensity}%`;
    return `${intensity}%`;
  }, [intensity, isBW, isPixelate, pixelLabel]);

  if (!activeTool) return null;

  const regionStyle = region && naturalSize.w
    ? {
        left: `${(region.x / naturalSize.w) * 100}%`,
        top: `${(region.y / naturalSize.h) * 100}%`,
        width: `${(region.w / naturalSize.w) * 100}%`,
        height: `${(region.h / naturalSize.h) * 100}%`,
      }
    : undefined;

  const limits =
    isPixelate
      ? ['Browser-side · private', 'Adjustable mosaic block size', 'PNG export']
      : isGrayscale
        ? ['Browser-side · private', 'Partial or full desaturation', 'Optional contrast']
        : isBW
          ? ['Browser-side · private', 'Threshold black & white', 'PNG export']
          : ['Browser-side · private', 'PNG export'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 py-8 lg:px-8">
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        emoji={config.emoji}
        icon={
          isPixelate ? (
            <Grid3X3 className="h-7 w-7 text-white" />
          ) : isGrayscale || isBW ? (
            <Contrast className="h-7 w-7 text-white" />
          ) : null
        }
        onReset={handleReset}
      >
        {processedImage ? (
          <Button onClick={handleDownload} className="btn-premium gap-2 rounded-xl">
            <Download className="h-4 w-4" />
            Download
          </Button>
        ) : null}
      </ToolPageHeader>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <FileUpload accept="image/*" />
          <ToolLimitNotice limits={limits} />

          {previewUrl && isCensor ? (
            <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/60 shadow-lg">
              <div className="border-b border-border/40 p-4">
                <h3 className="font-semibold">Select area to censor</h3>
                <p className="text-xs text-muted-foreground">Drag on the image to draw the pixelate region.</p>
              </div>
              <div className="relative bg-muted/30 p-3">
                <div
                  ref={overlayRef}
                  className="relative mx-auto inline-block max-w-full touch-none cursor-crosshair"
                  onPointerDown={onOverlayPointerDown}
                  onPointerMove={onOverlayPointerMove}
                  onPointerUp={onOverlayPointerUp}
                  onPointerCancel={onOverlayPointerUp}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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

          {displayPreview && !isCensor && !processedImage ? (
            <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/60 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 px-4 py-3">
                <div>
                  <h3 className="font-semibold">Live preview</h3>
                  <p className="text-xs text-muted-foreground">Updates as you change settings</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pixelLabel ? (
                    <Badge variant="secondary" className="tabular-nums">
                      {pixelLabel} blocks
                    </Badge>
                  ) : null}
                  {isBW ? (
                    <Badge variant="secondary" className="tabular-nums">
                      {intensity >= 92 ? 'Poster' : intensity >= 68 ? 'Document' : 'Smooth'} · {intensity}%
                    </Badge>
                  ) : null}
                  {isGrayscale ? (
                    <Badge variant="secondary" className="tabular-nums">
                      {intensity}% gray
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="flex min-h-[240px] items-center justify-center bg-muted/25 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayPreview}
                  alt="Effect preview"
                  className="max-h-[min(55vh,480px)] max-w-full rounded-lg object-contain"
                />
              </div>
            </div>
          ) : null}

          {processedImage ? (
            <motion.div
              id="effect-result"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-2xl border border-primary/30 bg-primary/5 shadow-lg"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/20 p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {showCompare && previewUrl ? 'Before & after' : 'Result'}
                </div>
                <div className="flex flex-wrap gap-2">
                  {previewUrl ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg text-xs"
                      onClick={() => setShowCompare((v) => !v)}
                    >
                      {showCompare ? 'Result only' : 'Compare'}
                    </Button>
                  ) : null}
                  <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">Done</Badge>
                  <Button size="sm" className="btn-premium gap-1.5 rounded-xl" onClick={handleDownload}>
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                </div>
              </div>
              {showCompare && previewUrl ? (
                <div className="grid sm:grid-cols-2">
                  <div className="border-b border-border/40 p-4 sm:border-b-0 sm:border-r">
                    <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Original
                    </p>
                    <div className="flex min-h-[220px] items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewUrl} alt="Original" className="max-h-[400px] max-w-full rounded-lg object-contain" />
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                      Result
                    </p>
                    <div className="flex min-h-[220px] items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={processedImage} alt="Result" className="max-h-[400px] max-w-full rounded-lg object-contain" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[240px] items-center justify-center bg-muted/30 p-4 dark:bg-zinc-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={processedImage} alt="Processed" className="max-h-[480px] max-w-full rounded-lg object-contain" />
                </div>
              )}
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
            <div className="space-y-5 p-5">
              {config.presets && config.presets.length > 0 ? (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Presets
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {config.presets.map((p) => (
                      <Button
                        key={p.label}
                        type="button"
                        size="sm"
                        variant={Math.abs(intensity - p.value) <= 2 ? 'default' : 'outline'}
                        className="rounded-xl"
                        onClick={() => {
                          setIntensity(p.value);
                          setProcessedImage(null);
                        }}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}

              {config.hasIntensity ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>{config.label}</Label>
                    <span className="rounded-lg bg-primary/10 px-2.5 py-0.5 font-mono text-sm font-bold text-primary tabular-nums">
                      {intensityDisplay}
                    </span>
                  </div>
                  <Slider
                    value={[intensity]}
                    onValueChange={([v]) => {
                      setIntensity(v);
                      setProcessedImage(null);
                    }}
                    min={1}
                    max={100}
                    step={1}
                  />
                </div>
              ) : null}

              {isGrayscale ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Contrast</Label>
                    <span className="font-mono text-sm font-bold text-primary tabular-nums">
                      {contrast > 0 ? `+${contrast}` : contrast}
                    </span>
                  </div>
                  <Slider
                    value={[contrast]}
                    onValueChange={([v]) => {
                      setContrast(v);
                      setProcessedImage(null);
                    }}
                    min={-40}
                    max={60}
                    step={1}
                  />
                </div>
              ) : null}

              {toolId === 'motion-blur' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Direction</Label>
                    <span className="rounded-lg bg-primary/10 px-2.5 py-0.5 font-mono text-sm font-bold text-primary">
                      {angle}°
                    </span>
                  </div>
                  <Slider value={[angle]} onValueChange={([v]) => setAngle(v)} min={0} max={360} step={15} />
                </div>
              ) : null}

              <div className="space-y-2 pt-1">
                <Button
                  className="btn-premium w-full rounded-xl py-6 font-bold"
                  onClick={handleProcess}
                  disabled={!uploadedFile || isProcessing}
                  size="lg"
                >
                  {isProcessing ? (
                    'Processing…'
                  ) : (
                    <>
                      <Sparkles className="mr-3 h-5 w-5" />
                      {config.applyLabel}
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full gap-2 rounded-xl py-5"
                  onClick={handleProcessAndDownload}
                  disabled={!uploadedFile || isProcessing}
                >
                  <Download className="h-4 w-4" />
                  Apply & download
                </Button>
                <Button variant="outline" className="w-full gap-2 rounded-xl py-5" onClick={handleReset}>
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
              {config.tips.map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {tip}
                </li>
              ))}
              <li className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Effects run in your browser — files stay private.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
