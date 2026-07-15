'use client';

import { motion } from 'framer-motion';
import { Download, RotateCcw, PenTool, Type, Trash2, ChevronRight, Sparkles, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

export function SignatureWorkspace() {
  const { activeTool, uploadedFile, reset, setProcessedImage, processedImage } = useAppStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [penColor, setPenColor] = useState('#000000');
  const [penSize, setPenSize] = useState(3);
  const [typedText, setTypedText] = useState('');
  const [selectedFont, setSelectedFont] = useState('Georgia');
  const [fontSize, setFontSize] = useState(48);
  const [sigScale, setSigScale] = useState(35);
  const [sigOpacity, setSigOpacity] = useState(100);
  const [sigPosition, setSigPosition] = useState<'bottom-right' | 'bottom-left' | 'center'>('bottom-right');
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const toolId = activeTool?.id || 'generate-signature';
  const isResize = toolId === 'resize-signature';
  const isMerge = toolId === 'merge-photo-signature';
  const isGenerate = !isResize && !isMerge;

  useEffect(() => {
    if (isResize) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 900;
    canvas.height = 280;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [isResize, toolId]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    lastPos.current = getPos(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPos.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    const pos = getPos(e);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDraw = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  const generateFromText = () => {
    if (!typedText.trim()) {
      toast.error('Please type your signature');
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = penColor;
    ctx.font = `italic ${fontSize}px '${selectedFont}', cursive, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedText, canvas.width / 2, canvas.height / 2);
    toast.success('Typed signature rendered — click Save.');
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL('image/png');
    setSignatureData(data);
    setProcessedImage(data);
    toast.success('Signature saved!');
  };

  const loadImage = (file: File) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not load image'));
      };
      img.src = url;
    });

  const handleResizeSignature = async () => {
    if (!uploadedFile) {
      toast.error('Upload a signature image first');
      return;
    }
    try {
      const img = await loadImage(uploadedFile);
      const scale = sigScale / 100;
      // Interpret scale as relative width against a 600px reference canvas
      const targetW = Math.max(40, Math.round(img.width * scale));
      const targetH = Math.max(20, Math.round((img.height / img.width) * targetW));
      const out = document.createElement('canvas');
      out.width = targetW;
      out.height = targetH;
      const ctx = out.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      ctx.drawImage(img, 0, 0, targetW, targetH);
      const data = out.toDataURL('image/png');
      setSignatureData(data);
      setProcessedImage(data);
      toast.success(`Signature resized to ${targetW}×${targetH}px`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Resize failed');
    }
  };

  const handleMergePhotoSignature = async () => {
    if (!uploadedFile) {
      toast.error('Upload a photo first');
      return;
    }
    if (!signatureData) {
      toast.error('Create or upload a signature first (draw/type then Save, or use a PNG signature file via Generate tab workflow)');
      return;
    }
    try {
      const photo = await loadImage(uploadedFile);
      const sigImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Invalid signature image'));
        img.src = signatureData;
      });

      const out = document.createElement('canvas');
      out.width = photo.width;
      out.height = photo.height;
      const ctx = out.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      ctx.drawImage(photo, 0, 0);

      const targetW = Math.max(40, Math.round(photo.width * (sigScale / 100)));
      const targetH = Math.round((sigImg.height / Math.max(1, sigImg.width)) * targetW);
      const pad = Math.round(Math.min(photo.width, photo.height) * 0.04);
      let x = pad;
      let y = photo.height - targetH - pad;
      if (sigPosition === 'bottom-right') {
        x = photo.width - targetW - pad;
      } else if (sigPosition === 'center') {
        x = Math.round((photo.width - targetW) / 2);
        y = Math.round((photo.height - targetH) / 2);
      }

      ctx.globalAlpha = Math.max(0.1, Math.min(1, sigOpacity / 100));
      ctx.drawImage(sigImg, x, y, targetW, targetH);
      ctx.globalAlpha = 1;

      const data = out.toDataURL('image/png');
      setProcessedImage(data);
      toast.success('Photo + signature merged!');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Merge failed');
    }
  };

  const handleDownload = useCallback(() => {
    const src = processedImage || signatureData;
    if (!src) return;
    const link = document.createElement('a');
    link.href = src;
    link.download = `${toolId}-${Date.now()}.png`;
    link.click();
    toast.success('Downloaded!');
  }, [processedImage, signatureData, toolId]);

  const handleReset = useCallback(() => {
    clearCanvas();
    setTypedText('');
    setSignatureData(null);
    setProcessedImage(null);
    reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [reset, setProcessedImage]);

  if (!activeTool) return null;

  const fonts = ['Georgia', 'Times New Roman', 'Palatino Linotype', 'Brush Script MT', 'Segoe Script', 'Comic Sans MS', 'Caveat', 'cursive'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 lg:px-8 py-8">
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        icon={PenTool}
        onReset={handleReset}
      >
        {(signatureData || processedImage) ? (
          <Button onClick={handleDownload} className="gap-2 btn-premium rounded-xl">
            <Download className="w-4 h-4" />
            Download PNG
          </Button>
        ) : null}
      </ToolPageHeader>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {(isResize || isMerge) ? (
            <FileUpload accept="image/*" />
          ) : null}

          {isGenerate ? (
            <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/60 shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-border/40 bg-gradient-to-r from-primary/5 to-transparent p-4">
                <h3 className="font-semibold">Draw your signature</h3>
                <Button variant="ghost" size="sm" onClick={clearCanvas} className="hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              </div>
              <div className="bg-white p-3 dark:bg-zinc-100">
                <canvas
                  ref={canvasRef}
                  className="w-full cursor-crosshair rounded-xl border-2 border-dashed border-gray-200"
                  style={{ touchAction: 'none', aspectRatio: '3/1' }}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                />
              </div>
              <div className="flex justify-center border-t border-border/40 p-3">
                <Button onClick={saveSignature} className="gap-2 btn-premium rounded-xl">
                  <PenTool className="h-4 w-4" />
                  Save signature
                </Button>
              </div>
            </div>
          ) : null}

          {/* Optional: draw signature even in merge mode */}
          {isMerge ? (
            <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/60 shadow-lg">
              <div className="border-b border-border/40 p-4">
                <h3 className="font-semibold">Signature layer</h3>
                <p className="text-xs text-muted-foreground">Draw below, then Save — or upload a transparent signature PNG as the main file after drawing on Generate tool.</p>
              </div>
              <div className="bg-white p-3 dark:bg-zinc-100">
                <canvas
                  ref={canvasRef}
                  className="w-full cursor-crosshair rounded-xl border-2 border-dashed border-gray-200"
                  style={{ touchAction: 'none', aspectRatio: '3/1' }}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                />
              </div>
              <div className="flex flex-wrap justify-center gap-2 border-t border-border/40 p-3">
                <Button onClick={saveSignature} className="gap-2 rounded-xl">
                  <PenTool className="h-4 w-4" />
                  Save signature
                </Button>
                <Button variant="outline" onClick={clearCanvas} className="rounded-xl">
                  Clear
                </Button>
              </div>
            </div>
          ) : null}

          {(signatureData || processedImage) ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border border-primary/30 bg-primary/5 shadow-lg">
              <div className="flex items-center justify-between border-b border-primary/20 p-4">
                <h3 className="font-semibold">Preview</h3>
                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">Ready</Badge>
              </div>
              <div className="flex items-center justify-center bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:16px_16px] p-6">
                <img src={processedImage || signatureData || ''} alt="Signature result" className="max-h-64 max-w-full object-contain" />
              </div>
            </motion.div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/60 shadow-premium backdrop-blur-xl">
            {isGenerate || isMerge ? (
              <Tabs defaultValue="draw">
                <div className="border-b border-border/40 p-4">
                  <TabsList className="w-full">
                    <TabsTrigger value="draw" className="flex-1">
                      <PenTool className="mr-1 h-3 w-3" />
                      Draw
                    </TabsTrigger>
                    <TabsTrigger value="type" className="flex-1">
                      <Type className="mr-1 h-3 w-3" />
                      Type
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="draw" className="space-y-4 p-5">
                  <div className="space-y-2">
                    <Label>Pen color</Label>
                    <div className="flex gap-2">
                      {['#000000', '#1e40af', '#dc2626', '#059669', '#7c3aed'].map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setPenColor(hex)}
                          className={`h-8 w-8 rounded-full border-2 ${penColor === hex ? 'scale-110 border-primary ring-2 ring-primary/30' : 'border-gray-200'}`}
                          style={{ backgroundColor: hex }}
                          aria-label={hex}
                        />
                      ))}
                      <input type="color" value={penColor} onChange={(e) => setPenColor(e.target.value)} className="h-8 w-8 cursor-pointer rounded-full" aria-label="Custom color" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Pen size</Label>
                      <span className="text-sm font-bold text-primary">{penSize}px</span>
                    </div>
                    <Slider value={[penSize]} onValueChange={([v]) => setPenSize(v)} min={1} max={12} step={1} />
                  </div>
                </TabsContent>
                <TabsContent value="type" className="space-y-4 p-5">
                  <div className="space-y-2">
                    <Label>Your name</Label>
                    <Input value={typedText} onChange={(e) => setTypedText(e.target.value)} placeholder="Type your name…" />
                  </div>
                  <div className="space-y-2">
                    <Label>Font style</Label>
                    <Select value={selectedFont} onValueChange={setSelectedFont}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fonts.map((f) => (
                          <SelectItem key={f} value={f} style={{ fontFamily: f }}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Font size</Label>
                      <span className="text-sm font-bold text-primary">{fontSize}px</span>
                    </div>
                    <Slider value={[fontSize]} onValueChange={([v]) => setFontSize(v)} min={24} max={96} step={2} />
                  </div>
                  <Button onClick={generateFromText} className="w-full btn-premium rounded-xl">
                    <Type className="mr-2 h-4 w-4" />
                    Render typed signature
                  </Button>
                </TabsContent>
              </Tabs>
            ) : null}

            {(isResize || isMerge) ? (
              <div className="space-y-4 p-5">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>{isResize ? 'Output size' : 'Signature size on photo'}</Label>
                    <span className="text-sm font-bold text-primary">{sigScale}%</span>
                  </div>
                  <Slider value={[sigScale]} onValueChange={([v]) => setSigScale(v)} min={10} max={90} step={1} />
                </div>
                {isMerge ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Signature opacity</Label>
                        <span className="text-sm font-bold text-primary">{sigOpacity}%</span>
                      </div>
                      <Slider value={[sigOpacity]} onValueChange={([v]) => setSigOpacity(v)} min={20} max={100} step={5} />
                    </div>
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Select value={sigPosition} onValueChange={(v) => setSigPosition(v as typeof sigPosition)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bottom-right">Bottom right</SelectItem>
                          <SelectItem value="bottom-left">Bottom left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : null}
                <Button
                  className="w-full btn-premium rounded-xl py-6"
                  onClick={isResize ? handleResizeSignature : handleMergePhotoSignature}
                  disabled={!uploadedFile}
                >
                  <ImagePlus className="mr-2 h-4 w-4" />
                  {isResize ? 'Resize signature' : 'Merge photo + signature'}
                </Button>
              </div>
            ) : null}
          </div>

          <Button variant="outline" className="w-full gap-2 rounded-xl py-6" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
            Start over
          </Button>

          <div className="space-y-3 rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 to-transparent p-5">
            <h4 className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
              How to use
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {isGenerate ? (
                <>
                  <li className="flex gap-2"><ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Draw or type your signature</li>
                  <li className="flex gap-2"><ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Click Save Signature</li>
                  <li className="flex gap-2"><ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Download transparent PNG</li>
                </>
              ) : isResize ? (
                <>
                  <li className="flex gap-2"><ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Upload a signature image</li>
                  <li className="flex gap-2"><ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Choose output scale</li>
                  <li className="flex gap-2"><ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Download resized PNG</li>
                </>
              ) : (
                <>
                  <li className="flex gap-2"><ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Upload a photo</li>
                  <li className="flex gap-2"><ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Draw/save a signature</li>
                  <li className="flex gap-2"><ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Merge and download</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
