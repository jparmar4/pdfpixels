'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Download, FilePlus2, MoveLeft, MoveRight, RotateCcw, ScanLine, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useActiveTool } from '@/hooks/use-active-tool';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { ResultScreenAd, SmartlinkButton } from '@/components/ads/ad-banner';
import { triggerDownloadWithSmartlink } from '@/lib/ads-config';
import { toast } from 'sonner';

type Enhancement = 'original' | 'gray' | 'boosted' | 'bw';
type PageMode = 'fit' | 'letter' | 'a4';

interface ScanPage {
  id: number;
  dataUrl: string; // JPEG data URL of the processed capture
  width: number;
  height: number;
}

const ENHANCEMENTS: Array<{ id: Enhancement; label: string }> = [
  { id: 'original', label: 'Original' },
  { id: 'gray', label: 'Document Gray' },
  { id: 'boosted', label: 'Boosted (recommended)' },
  { id: 'bw', label: 'Black & White' },
];

function applyEnhancement(ctx: CanvasRenderingContext2D, mode: Enhancement) {
  if (mode === 'original') return;
  const image = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const d = image.data;
  if (mode === 'bw') {
    // Otsu-style global threshold on luminance (fast single pass with histogram)
    const histogram = new Uint32Array(256);
    for (let i = 0; i < d.length; i += 4) {
      const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0;
      histogram[lum]++;
    }
    // Find the darkest 45th-percentile as the threshold — keeps faint ink while
    // pushing gray paper backgrounds to white.
    const total = (d.length / 4) * 0.45;
    let threshold = 128;
    let acc = 0;
    for (let v = 0; v < 256; v++) {
      acc += histogram[v];
      if (acc >= total) { threshold = v; break; }
    }
    for (let i = 0; i < d.length; i += 4) {
      const lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
      const v = lum > threshold + 12 ? 255 : 0;
      d[i] = v; d[i + 1] = v; d[i + 2] = v;
    }
  } else {
    for (let i = 0; i < d.length; i += 4) {
      const lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
      let v = lum;
      if (mode === 'boosted') {
        // Contrast stretch: push paper toward white, ink toward black.
        v = Math.max(0, Math.min(255, (v - 70) * (255 / 175)));
        // Slight gamma lift for readability.
        v = 255 * Math.pow(v / 255, 0.92);
      }
      d[i] = v; d[i + 1] = v; d[i + 2] = v;
    }
  }
  ctx.putImageData(image, 0, 0);
}

export function ScanToPdfWorkspace() {
  const { activeTool, isProcessing, setIsProcessing, setProgress, reset } = useActiveTool();

  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [enhancement, setEnhancement] = useState<Enhancement>('boosted');
  const [pageMode, setPageMode] = useState<PageMode>('fit');
  const [pages, setPages] = useState<ScanPage[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState('scan.pdf');
  const [importing, setImporting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const nextIdRef = useRef(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Camera lifecycle ──
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('This browser does not support camera access. Import photos instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      // Wait for the video element then attach
      requestAnimationFrame(() => {
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          void video.play();
        }
      });
    } catch (err) {
      const message = err instanceof Error && /permission|denied/i.test(err.message)
        ? 'Camera permission denied — allow access or import photos instead.'
        : 'Camera unavailable. Import photos instead.';
      setCameraError(message);
    }
  }, []);

  // ── Capture a frame from the live camera ──
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      toast.error('Camera is still warming up — try again in a second');
      return;
    }
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return;
    // Cap long edge at 2000px to keep PDFs reasonable
    const scale = Math.min(1, 2000 / Math.max(vw, vh));
    canvas.width = Math.round(vw * scale);
    canvas.height = Math.round(vh * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    applyEnhancement(ctx, enhancement);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPages((prev) => [...prev, { id: nextIdRef.current++, dataUrl, width: canvas.width, height: canvas.height }]);
    toast.success(`Page ${pages.length + 1} captured`);
  }, [enhancement, pages.length]);

  // ── Import photos ──
  const importFiles = useCallback(async (files: FileList | File[]) => {
    setImporting(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('read failed'));
          reader.readAsDataURL(file);
        });
        const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
          img.onerror = () => reject(new Error('decode failed'));
          img.src = dataUrl;
        });
        // Re-draw through canvas so the chosen enhancement applies to imports too
        const canvas = captureCanvasRef.current ?? document.createElement('canvas');
        const scale = Math.min(1, 2000 / Math.max(dims.w, dims.h));
        canvas.width = Math.round(dims.w * scale);
        canvas.height = Math.round(dims.h * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); resolve(); };
          img.onerror = () => reject(new Error('draw failed'));
          img.src = dataUrl;
        });
        applyEnhancement(ctx, enhancement);
        const processed = canvas.toDataURL('image/jpeg', 0.9);
        setPages((prev) => [...prev, { id: nextIdRef.current++, dataUrl: processed, width: canvas.width, height: canvas.height }]);
      }
      toast.success('Photos imported');
    } catch {
      toast.error('Could not read one of the images');
    } finally {
      setImporting(false);
    }
  }, [enhancement]);

  // ── Export ──
  const handleExport = useCallback(async () => {
    if (!pages.length) {
      toast.error('Capture or import at least one page first');
      return;
    }
    setIsProcessing(true);
    setProgress(30);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdf = await PDFDocument.create();
      for (const page of pages) {
        const commaIdx = page.dataUrl.indexOf(',');
        const b64 = page.dataUrl.slice(commaIdx + 1);
        const raw = atob(b64);
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
        const image = await pdf.embedJpg(bytes);
        const pxToPt = 72 / 96;
        const imgW = page.width * pxToPt;
        const imgH = page.height * pxToPt;
        if (pageMode === 'fit') {
          const p = pdf.addPage([imgW, imgH]);
          p.drawImage(image, { x: 0, y: 0, width: imgW, height: imgH });
        } else {
          const size = pageMode === 'letter' ? [612, 792] as [number, number] : [595.28, 841.89] as [number, number];
          const [pw, ph] = size;
          const p = pdf.addPage(size);
          const margin = 18;
          const scale = Math.min((pw - margin * 2) / imgW, (ph - margin * 2) / imgH);
          const w = imgW * scale;
          const h = imgH * scale;
          p.drawImage(image, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
        }
      }
      const bytes = await pdf.save();
      const copy = new Uint8Array(bytes.byteLength);
      copy.set(bytes);
      const blob = new Blob([copy.buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return url;
      });
      setResultName(`scan-${pages.length}-page${pages.length === 1 ? '' : 's'}.pdf`);
      setProgress(100);
      toast.success('Scan PDF ready — download it below');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'PDF export failed');
    } finally {
      setIsProcessing(false);
    }
  }, [pages, pageMode, setIsProcessing, setProgress]);

  useEffect(() => {
    return () => {
      if (resultUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(resultUrl);
      }
    };
  }, [resultUrl]);

  const handleReset = useCallback(() => {
    reset();
    stopCamera();
    setPages([]);
    setEnhancement('boosted');
    setPageMode('fit');
    setResultUrl((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return null;
    });
  }, [reset, stopCamera]);

  const download = () => {
    if (!resultUrl) return;
    triggerDownloadWithSmartlink(() => {
      const link = document.createElement('a');
      link.href = resultUrl;
      link.download = resultName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Download started');
    });
  };

  const movePage = (index: number, dir: -1 | 1) => {
    setPages((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removePage = (id: number) => setPages((prev) => prev.filter((p) => p.id !== id));

  if (!activeTool) return null;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl">
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        icon={<ScanLine className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'Camera feed and PDF assembly run 100% on your device — nothing uploads',
          'No watermark, no page limit, no app install required',
          'Enhancements: Original · Document Gray · Boosted · Black & White',
        ]}
      />

      <div className="mt-8 grid lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* ── Camera / capture column ── */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden shadow-premium">
            <div className="p-4 border-b border-border/40 bg-gradient-to-r from-primary/10 to-transparent flex items-center justify-between">
              <h3 className="font-bold tracking-tight text-foreground text-sm">Scanner</h3>
              {cameraOn && (
                <Button variant="outline" size="sm" className="rounded-xl h-8" onClick={stopCamera}>
                  Stop camera
                </Button>
              )}
            </div>
            <div className="p-4 space-y-4">
              {!cameraOn ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center space-y-4">
                  <Camera className="w-10 h-10 mx-auto text-muted-foreground/60" />
                  <p className="text-sm text-muted-foreground font-medium">
                    Point your phone or webcam at a paper document.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button onClick={startCamera} className="gap-2 btn-premium rounded-xl font-bold">
                      <Camera className="w-4 h-4" /> Start camera
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2 rounded-xl"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={importing}
                    >
                      <FilePlus2 className="w-4 h-4" /> {importing ? 'Importing…' : 'Import photos'}
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    aria-label="Import document photos"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) void importFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                  {cameraError && (
                    <p className="text-xs text-destructive">{cameraError}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-border bg-black">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      aria-label="Camera preview"
                      className="w-full max-h-[420px] object-contain bg-black"
                    />
                    <div className="absolute inset-x-6 inset-y-4 pointer-events-none">
                      <div className="w-full h-full border-2 border-white/60 rounded-lg" />
                    </div>
                  </div>
                  <Button onClick={captureFrame} className="w-full gap-2 btn-premium rounded-xl font-bold py-6">
                    <Camera className="w-5 h-5" /> Capture page
                  </Button>
                </div>
              )}
            </div>
          </div>

          <canvas ref={captureCanvasRef} className="hidden" aria-hidden="true" />

          {/* Pages */}
          <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden shadow-premium">
            <div className="p-4 border-b border-border/40 bg-gradient-to-r from-primary/10 to-transparent flex items-center justify-between">
              <h3 className="font-bold tracking-tight text-foreground text-sm">
                Pages <span className="text-muted-foreground font-medium">({pages.length})</span>
              </h3>
              {pages.length > 0 && (
                <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive" onClick={() => setPages([])}>
                  <Trash2 className="w-3.5 h-3.5" /> Clear all
                </Button>
              )}
            </div>
            <div className="p-4">
              {pages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No pages yet — capture with the camera or import photos.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {pages.map((page, index) => (
                    <div key={page.id} className="rounded-xl border border-border overflow-hidden bg-background group relative">
                      <img src={page.dataUrl} alt={`Scanned page ${index + 1}`} className="w-full aspect-[3/4] object-cover" />
                      <span className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-background/90 text-foreground text-xs font-bold flex items-center justify-center shadow">
                        {index + 1}
                      </span>
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-background/90 backdrop-blur px-1 py-1 opacity-95 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                        <button type="button" aria-label="Move page earlier" onClick={() => movePage(index, -1)} disabled={index === 0} className="p-1 rounded disabled:opacity-30 hover:text-primary">
                          <MoveLeft className="w-4 h-4" />
                        </button>
                        <button type="button" aria-label={`Delete page ${index + 1}`} onClick={() => removePage(page.id)} className="p-1 rounded text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button type="button" aria-label="Move page later" onClick={() => movePage(index, 1)} disabled={index === pages.length - 1} className="p-1 rounded disabled:opacity-30 hover:text-primary">
                          <MoveRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Settings column ── */}
        <div className="space-y-5 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden shadow-premium">
            <div className="p-4 border-b border-border/40 bg-gradient-to-r from-primary/10 to-transparent">
              <h3 className="font-bold tracking-tight text-foreground text-sm">Enhancement & output</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stp-enhancement">Enhancement</Label>
                <Select value={enhancement} onValueChange={(v) => setEnhancement(v as Enhancement)}>
                  <SelectTrigger id="stp-enhancement" aria-label="Enhancement mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENHANCEMENTS.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">Applies to the next capture and imports.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stp-page-size">Page size</Label>
                <Select value={pageMode} onValueChange={(v) => setPageMode(v as PageMode)}>
                  <SelectTrigger id="stp-page-size" aria-label="Page size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fit">Fit to image</SelectItem>
                    <SelectItem value="letter">US Letter</SelectItem>
                    <SelectItem value="a4">A4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full btn-premium py-6 rounded-xl font-bold shadow-xl shadow-primary/20"
                onClick={handleExport}
                disabled={isProcessing || pages.length === 0}
                size="lg"
              >
                {isProcessing ? 'Building PDF…' : `Create PDF (${pages.length} page${pages.length === 1 ? '' : 's'})`}
              </Button>
              <Button variant="outline" className="w-full gap-2 rounded-xl" onClick={handleReset}>
                <RotateCcw className="w-4 h-4" /> Start Over
              </Button>
            </div>
          </div>

          {resultUrl && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-3 shadow-premium">
              <p className="font-semibold text-sm">Scan PDF ready</p>
              <Button onClick={download} className="w-full gap-2 btn-premium rounded-xl">
                <Download className="w-4 h-4" /> Download PDF
              </Button>
              <div className="flex flex-col items-center gap-3 pt-1">
                <SmartlinkButton />
                <ResultScreenAd refreshKey={resultUrl} />
              </div>
            </div>
          )}
          {!resultUrl && pages.length > 0 && (
            <div className="flex flex-col items-center">
              <SmartlinkButton />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
