'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, LayoutGrid, RotateCcw, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
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
import { toast } from 'sonner';

const MAX_IMAGES = 9;
const CELL = 640; // px per grid cell in the exported canvas

const LAYOUTS = [
  { value: '1x2', rows: 1, cols: 2, label: '1 × 2' },
  { value: '2x1', rows: 2, cols: 1, label: '2 × 1' },
  { value: '2x2', rows: 2, cols: 2, label: '2 × 2' },
  { value: '3x2', rows: 3, cols: 2, label: '3 × 2' },
  { value: '2x3', rows: 2, cols: 3, label: '2 × 3' },
  { value: '3x3', rows: 3, cols: 3, label: '3 × 3' },
] as const;

type Loaded = { id: string; url: string; img: HTMLImageElement };

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export function PhotoCollageWorkspace() {
  const { activeTool, reset } = useActiveTool();
  const [images, setImages] = useState<Loaded[]>([]);
  const [layout, setLayout] = useState('2x2');
  const [gap, setGap] = useState(12);
  const [background, setBackground] = useState('#ffffff');
  const [format, setFormat] = useState('jpeg');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [dropping, setDropping] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<Loaded[]>([]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  const current = LAYOUTS.find((l) => l.value === layout) ?? LAYOUTS[2];

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const incoming = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (incoming.length === 0) {
      toast.error('Please choose image files');
      return;
    }
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast.error(`Collages hold up to ${MAX_IMAGES} photos`);
      return;
    }
    if (incoming.length > room) toast.info(`Added the first ${room} — collages hold up to ${MAX_IMAGES} photos`);
    const accepted = incoming.slice(0, room);
    const loaded: Loaded[] = [];
    for (const file of accepted) {
      try {
        const url = URL.createObjectURL(file);
        const img = await loadImage(url);
        loaded.push({ id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`, url, img });
      } catch {
        toast.error(`Could not read ${file.name}`);
      }
    }
    if (loaded.length) setImages((prev) => [...prev, ...loaded]);
  }, [images.length]);

  // Revoke any remaining object URLs when the workspace unmounts.
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, []);

  // Redraw the preview whenever anything changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const inner = CELL * current.cols + gap * (current.cols - 1);
    const height = CELL * current.rows + gap * (current.rows - 1);
    canvas.width = inner;
    canvas.height = height;

    if (background === 'transparent' && format === 'png') {
      ctx.clearRect(0, 0, inner, height);
    } else {
      ctx.fillStyle = background === 'transparent' ? '#ffffff' : background;
      ctx.fillRect(0, 0, inner, height);
    }

    images.slice(0, current.rows * current.cols).forEach((item, index) => {
      const row = Math.floor(index / current.cols);
      const col = index % current.cols;
      const x = col * (CELL + gap);
      const y = row * (CELL + gap);

      // Cover-fit: scale to fill the cell, centered, cropping overflow.
      const scale = Math.max(CELL / item.img.width, CELL / item.img.height);
      const drawW = item.img.width * scale;
      const drawH = item.img.height * scale;
      ctx.drawImage(item.img, x + (CELL - drawW) / 2, y + (CELL - drawH) / 2, drawW, drawH);
    });
  }, [images, current, gap, background, format]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || images.length === 0) return;
    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error('Could not export the collage');
          return;
        }
        const url = URL.createObjectURL(blob);
        setResultUrl((previous) => {
          if (previous) URL.revokeObjectURL(previous);
          return url;
        });
        const link = document.createElement('a');
        link.href = url;
        link.download = `collage-${Date.now()}.${format === 'png' ? 'png' : 'jpg'}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('Collage downloaded');
      },
      mime,
      0.92,
    );
  }, [images.length, format]);

  const handleReset = useCallback(() => {
    images.forEach((item) => URL.revokeObjectURL(item.url));
    setImages([]);
    setResultUrl(null);
    reset();
  }, [images, reset]);

  if (!activeTool) return null;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl">
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        icon={<LayoutGrid className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'Runs 100% in your browser — photos never leave your device',
          'Up to 9 photos · JPG, PNG, WebP input',
          'Each cell exports at 640px for a sharp result',
        ]}
      />

      <div className="mt-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {images.length === 0 ? (
            <div
              role="button"
              tabIndex={0}
              aria-label="Add photos to the collage"
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDropping(true);
              }}
              onDragLeave={() => setDropping(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDropping(false);
                if (e.dataTransfer.files.length) void addFiles(e.dataTransfer.files);
              }}
              className={`drop-zone flex flex-col items-center justify-center p-12 rounded-2xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors ${dropping ? 'border-primary bg-primary/5' : ''}`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files?.length) void addFiles(e.target.files);
                  e.target.value = '';
                }}
              />
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                <Upload className="w-10 h-10 text-primary" />
              </div>
              <p className="text-lg font-semibold">Add your photos</p>
              <p className="text-sm text-muted-foreground mt-1">Drag, drop, or click — up to 9 photos, nothing is uploaded</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold">{images.length}/{MAX_IMAGES} photos</p>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => inputRef.current?.click()}>
                    <Upload className="w-3.5 h-3.5" /> Add more
                  </Button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      if (e.target.files?.length) void addFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {images.map((item, index) => (
                    <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden border border-border bg-muted/40">
                      <img src={item.url} alt={`Collage photo ${index + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        aria-label={`Remove photo ${index + 1}`}
                        onClick={() => {
                          URL.revokeObjectURL(item.url);
                          setImages((prev) => prev.filter((entry) => entry.id !== item.id));
                        }}
                        className="absolute top-1 right-1 rounded-full bg-background/85 p-1 text-destructive opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <canvas
                  ref={canvasRef}
                  aria-label="Collage preview"
                  className="w-full h-auto block"
                />
              </div>

              {resultUrl && (
                <p className="text-xs text-muted-foreground text-center">
                  Downloaded! Need another format or layout? Adjust the settings and download again.
                </p>
              )}
            </>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden shadow-premium">
            <div className="p-5 border-b border-border/40 bg-gradient-to-r from-primary/10 to-transparent">
              <h3 className="font-bold tracking-tight text-foreground">Collage settings</h3>
            </div>
            <div className="p-5 space-y-5">
              <div className="space-y-2">
                <Label>Layout (rows × columns)</Label>
                <div className="grid grid-cols-3 gap-2" role="group" aria-label="Collage layout">
                  {LAYOUTS.map((option) => (
                    <Button
                      key={option.value}
                      size="sm"
                      variant={layout === option.value ? 'default' : 'outline'}
                      className="h-9 rounded-lg text-xs"
                      onClick={() => setLayout(option.value)}
                      aria-pressed={layout === option.value}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {current.rows * current.cols} cells · photos fill left to right, top to bottom
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="collage-gap">Spacing: {gap}px</Label>
                <Slider
                  id="collage-gap"
                  value={[gap]}
                  min={0}
                  max={48}
                  step={2}
                  onValueChange={([value]) => setGap(value)}
                  aria-label="Spacing between photos in pixels"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="collage-background">Background</Label>
                <Select value={background} onValueChange={setBackground}>
                  <SelectTrigger id="collage-background" aria-label="Collage background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="#ffffff">White</SelectItem>
                    <SelectItem value="#000000">Black</SelectItem>
                    <SelectItem value="#f1f0ef">Warm gray</SelectItem>
                    <SelectItem value="#1e1b4b">Deep indigo</SelectItem>
                    {format === 'png' && <SelectItem value="transparent">Transparent</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="collage-format">Output format</Label>
                <Select
                  value={format}
                  onValueChange={(value) => {
                    setFormat(value);
                    if (value === 'jpeg' && background === 'transparent') setBackground('#ffffff');
                  }}
                >
                  <SelectTrigger id="collage-format" aria-label="Output format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jpeg">JPG — smaller file</SelectItem>
                    <SelectItem value="png">PNG — transparency support</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full btn-premium py-6 rounded-xl font-bold shadow-xl shadow-primary/20"
                onClick={handleDownload}
                disabled={images.length === 0}
                size="lg"
              >
                <Download className="w-5 h-5 mr-3" />
                Download collage
              </Button>
              <Button variant="outline" className="w-full gap-2 rounded-xl" onClick={handleReset}>
                <RotateCcw className="w-4 h-4" /> Start Over
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 to-transparent p-5 space-y-2 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Tips</p>
            <p>Photos fill the grid in the order shown — remove and re-add to reorder.</p>
            <p>For chat sharing, JPG keeps files small. PNG is better for transparent or archival use.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
