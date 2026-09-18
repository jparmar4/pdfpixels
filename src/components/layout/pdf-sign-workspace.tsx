'use client';

import { motion } from 'framer-motion';
import {
  Download, RotateCcw, PenTool, Type, Trash2,
  Sparkles, FileSignature, Calendar, ArrowLeft, ArrowRight, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function PDFSignWorkspace() {
  const { uploadedFile, isProcessing, setIsProcessing, setProgress, reset } = useAppStore();

  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageWidth, setPageWidth] = useState<number>(595);
  const [pageHeight, setPageHeight] = useState<number>(842);

  // Signature creator state
  const [sigMode, setSigMode] = useState<'draw' | 'type' | 'upload'>('draw');
  const [penColor, setPenColor] = useState<string>('#000000');
  const [penSize, setPenSize] = useState<number>(3);
  const [typedText, setTypedText] = useState<string>('');
  const [selectedFont, setSelectedFont] = useState<string>('cursive');
  const [createdSigDataUrl, setCreatedSigDataUrl] = useState<string | null>(null);

  // Signature placement state on the active page
  const [sigPlaced, setSigPlaced] = useState<boolean>(false);
  const [sigX, setSigX] = useState<number>(60);
  const [sigY, setSigY] = useState<number>(700); // from top
  const [sigW, setSigW] = useState<number>(160);
  const [sigH, setSigH] = useState<number>(60);
  const [includeDate, setIncludeDate] = useState<boolean>(true);
  const [dateText, setDateText] = useState<string>(new Date().toISOString().split('T')[0]);

  // Result state
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFileName, setResultFileName] = useState<string>('');

  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Inspect PDF on file change
  useEffect(() => {
    if (!uploadedFile) {
      setTotalPages(1);
      setResultUrl(null);
      setCurrentPage(1);
      return;
    }

    let active = true;
    (async () => {
      try {
        const { PDFDocument } = await import('pdf-lib');
        const buffer = await uploadedFile.arrayBuffer();
        const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const pages = pdf.getPages();
        if (active) {
          setTotalPages(pages.length);
          if (pages.length > 0) {
            const sz = pages[0].getSize();
            setPageWidth(sz.width);
            setPageHeight(sz.height);
          }
          toast.success(`PDF loaded (${pages.length} page${pages.length === 1 ? '' : 's'})`);
        }
      } catch {
        if (active) {
          setTotalPages(1);
          toast.success('PDF document loaded');
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [uploadedFile]);

  // Initialize draw canvas
  useEffect(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [sigMode]);

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = drawCanvasRef.current;
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
    lastPos.current = getCanvasPos(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPos.current) return;
    e.preventDefault();
    const canvas = drawCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    const pos = getCanvasPos(e);
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
    const canvas = drawCanvasRef.current;
    if (canvas) {
      setCreatedSigDataUrl(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setCreatedSigDataUrl(null);
  };

  // Generate typed signature
  useEffect(() => {
    if (sigMode !== 'type' || !typedText.trim()) return;
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `italic 54px ${selectedFont}`;
    ctx.fillStyle = penColor;
    ctx.textBaseline = 'middle';
    ctx.fillText(typedText, 40, 100);
    setCreatedSigDataUrl(canvas.toDataURL('image/png'));
  }, [typedText, selectedFont, penColor, sigMode]);

  const handleUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCreatedSigDataUrl(reader.result as string);
      toast.success('Signature image uploaded');
    };
    reader.readAsDataURL(file);
  };

  const handlePlaceSignature = () => {
    if (!createdSigDataUrl) {
      toast.error('Please draw, type, or upload a signature first');
      return;
    }
    setSigPlaced(true);
    toast.success(`Signature placed on Page ${currentPage}. Drag or resize handles below.`);
  };

  const handleSignPdf = async () => {
    if (!uploadedFile) {
      toast.error('Please upload a PDF document');
      return;
    }
    if (!createdSigDataUrl) {
      toast.error('Please create or place your signature');
      return;
    }

    setIsProcessing(true);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('signatureImage', createdSigDataUrl);
      formData.append('pageNumber', String(currentPage));
      formData.append('x', String(Math.round(sigX)));
      formData.append('y', String(Math.round(sigY)));
      formData.append('width', String(Math.round(sigW)));
      formData.append('height', String(Math.round(sigH)));
      if (includeDate && dateText) {
        formData.append('dateText', `Date: ${dateText}`);
      }

      setProgress(40);
      const res = await fetch('/api/pdf/sign', {
        method: 'POST',
        body: formData,
      });

      setProgress(90);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Signing failed' }));
        throw new Error(err.error || 'Failed to sign PDF');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultFileName(uploadedFile.name.replace(/\.pdf$/i, '-signed.pdf'));
      setProgress(100);
      toast.success('PDF signed successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Signing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = resultFileName || 'signed-document.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success('Download started');
  };

  const handleReset = useCallback(() => {
    if (resultUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(resultUrl);
    }
    reset();
    setResultUrl(null);
    setCreatedSigDataUrl(null);
    setSigPlaced(false);
    setCurrentPage(1);
  }, [reset, resultUrl]);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl">
      <ToolPageHeader
        title="Sign PDF Online Free"
        description="Add legally valid electronic signatures to PDF contracts, lease agreements, tax forms, and NDAs. Draw, type, or upload your signature."
        icon={<FileSignature className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'PDF only · max 25 MB',
          'Draw, type, or upload transparent e-signatures',
          'Legally compliant with US ESIGN Act and EU eIDAS regulation',
        ]}
      />

      {!uploadedFile ? (
        <div className="mt-8">
          <FileUpload accept=".pdf,application/pdf" />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {/* Main Workspace Layout */}
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left: Document View & Signature Placement Canvas (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between bg-card p-3 rounded-xl border">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    Page {currentPage} of {totalPages}
                  </Badge>
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {uploadedFile.name}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Visual PDF Page Mockup with placed signature */}
              <div
                ref={previewContainerRef}
                className="relative bg-white dark:bg-zinc-900 border-2 border-dashed rounded-2xl aspect-[1/1.414] shadow-sm overflow-hidden flex flex-col justify-between p-8"
              >
                {/* Header Mockup */}
                <div className="space-y-3 opacity-30 select-none">
                  <div className="h-4 bg-muted-foreground/30 rounded w-1/3" />
                  <div className="h-2.5 bg-muted-foreground/20 rounded w-full" />
                  <div className="h-2.5 bg-muted-foreground/20 rounded w-5/6" />
                  <div className="h-2.5 bg-muted-foreground/20 rounded w-4/6" />
                </div>

                {/* Placed Signature Box Overlay */}
                {sigPlaced && createdSigDataUrl && (
                  <motion.div
                    drag
                    dragConstraints={previewContainerRef}
                    className="absolute cursor-move border-2 border-primary bg-primary/5 rounded-lg p-2 shadow-md group select-none"
                    style={{ left: `${(sigX / pageWidth) * 100}%`, top: `${(sigY / pageHeight) * 100}%` }}
                    onDragEnd={(_, info) => {
                      const container = previewContainerRef.current;
                      if (!container) return;
                      const rect = container.getBoundingClientRect();
                      const xPercent = (info.point.x - rect.left) / rect.width;
                      const yPercent = (info.point.y - rect.top) / rect.height;
                      setSigX(Math.max(0, Math.min(pageWidth - sigW, Math.round(xPercent * pageWidth))));
                      setSigY(Math.max(0, Math.min(pageHeight - sigH, Math.round(yPercent * pageHeight))));
                    }}
                  >
                    <div className="relative">
                      <img src={createdSigDataUrl} alt="Created signature preview" style={{ width: `${sigW}px`, height: `${sigH}px` }} className="object-contain pointer-events-none" />
                      {includeDate && (
                        <p className="text-[10px] font-mono text-zinc-600 dark:text-zinc-300 mt-1 pointer-events-none">
                          Date: {dateText}
                        </p>
                      )}
                      <div className="absolute -top-3 -right-3 hidden group-hover:flex">
                        <Badge variant="default" className="text-[9px] px-1 py-0">Drag</Badge>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Footer Mockup */}
                <div className="space-y-2 opacity-30 select-none">
                  <div className="h-2 bg-muted-foreground/20 rounded w-full" />
                  <div className="h-2 bg-muted-foreground/20 rounded w-2/3" />
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[10px] text-muted-foreground">Document Page {currentPage}</span>
                    <span className="text-[10px] text-muted-foreground">PDFPixels Electronic Signature</span>
                  </div>
                </div>
              </div>

              {/* Placement Coordinate Sliders */}
              {sigPlaced && (
                <div className="bg-muted/40 p-4 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between font-medium">
                    <span>Signature Dimensions & Position</span>
                    <span className="text-muted-foreground">Drag on document or adjust sliders</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sigW" className="text-[11px]">Width: {sigW}px</Label>
                      <Slider id="sigW" value={[sigW]} min={80} max={300} step={5} onValueChange={([v]) => setSigW(v)} />
                    </div>
                    <div>
                      <Label htmlFor="sigH" className="text-[11px]">Height: {sigH}px</Label>
                      <Slider id="sigH" value={[sigH]} min={30} max={150} step={5} onValueChange={([v]) => setSigH(v)} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Signature Creation & Controls (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2">
                  <FileSignature className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-base">Create Your Signature</h3>
                </div>

                {/* Creation Mode Tabs */}
                <Tabs value={sigMode} onValueChange={(v: any) => setSigMode(v)}>
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="draw" className="text-xs flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5" /> Draw
                    </TabsTrigger>
                    <TabsTrigger value="type" className="text-xs flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5" /> Type
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="text-xs flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5" /> Upload
                    </TabsTrigger>
                  </TabsList>

                  {/* Draw Tab */}
                  <TabsContent value="draw" className="space-y-4 pt-3">
                    <div className="border rounded-xl bg-white dark:bg-zinc-950 p-2 relative shadow-inner">
                      <canvas
                        ref={drawCanvasRef}
                        className="w-full h-36 cursor-crosshair touch-none"
                        onMouseDown={startDraw}
                        onMouseMove={draw}
                        onMouseUp={stopDraw}
                        onMouseLeave={stopDraw}
                        onTouchStart={startDraw}
                        onTouchMove={draw}
                        onTouchEnd={stopDraw}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute bottom-2 right-2 text-xs text-muted-foreground h-7 px-2"
                        onClick={clearCanvas}
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Clear
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label id="penColor" className="text-xs">Ink:</Label>
                        {['#000000', '#002060', '#b91c1c'].map((color) => (
                          <button
                            key={color}
                            type="button"
                            aria-labelledby="penColor"
                            className={`w-6 h-6 rounded-full border-2 transition-transform ${penColor === color ? 'scale-110 border-primary' : 'border-transparent'}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setPenColor(color)}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2 w-32">
                        <Label htmlFor="penSize" className="text-xs">Stroke:</Label>
                        <Slider id="penSize" value={[penSize]} min={1} max={6} step={1} onValueChange={([v]) => setPenSize(v)} />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Type Tab */}
                  <TabsContent value="type" className="space-y-4 pt-3">
                    <div className="space-y-2">
                      <Label htmlFor="type-your-legal-name-or-initials" className="text-xs">Type your legal name or initials:</Label>
                      <Input id="type-your-legal-name-or-initials"
                        placeholder="John Doe"
                        value={typedText}
                        onChange={(e) => setTypedText(e.target.value)}
                        className="font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label id="font-style" className="text-xs">Font Style:</Label>
                      <div role="group" aria-labelledby="font-style" className="grid grid-cols-2 gap-2">
                        {['cursive', 'Georgia', 'serif', 'Pacifico, cursive'].map((f) => (
                          <Button
                            key={f}
                            type="button"
                            size="sm"
                            variant={selectedFont === f ? 'default' : 'outline'}
                            className="h-10 text-sm font-normal truncate"
                            style={{ fontFamily: f }}
                            onClick={() => setSelectedFont(f)}
                          >
                            {typedText || 'Signature'}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Upload Tab */}
                  <TabsContent value="upload" className="space-y-4 pt-3">
                    <div className="border border-dashed rounded-xl p-6 text-center space-y-2">
                      <Input
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={handleUploadSignature}
                        className="text-xs cursor-pointer"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Upload transparent PNG or photo of your handwritten signature.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Date Stamp Option */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="field" className="text-xs flex items-center gap-1.5 cursor-pointer">
                      <Calendar className="w-3.5 h-3.5 text-primary" /> Include Date Stamp
                    </Label>
                    <input id="field"
                      type="checkbox"
                      checked={includeDate}
                      onChange={(e) => setIncludeDate(e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    />
                  </div>
                  {includeDate && (
                    <Input
                      type="date"
                      value={dateText}
                      onChange={(e) => setDateText(e.target.value)}
                      className="text-xs h-9"
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  {!sigPlaced ? (
                    <Button
                      type="button"
                      className="w-full rounded-xl font-semibold gap-2"
                      onClick={handlePlaceSignature}
                    >
                      <Check className="w-4 h-4" /> Place on Document
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled={isProcessing}
                      className="w-full rounded-xl font-semibold gap-2"
                      onClick={handleSignPdf}
                    >
                      <Sparkles className="w-4 h-4" /> {isProcessing ? 'Signing Document...' : 'Sign & Export PDF'}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground"
                    onClick={handleReset}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Start Over
                  </Button>
                </div>
              </div>

              {/* Result Download Card */}
              {resultUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center space-y-4"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-base">Your PDF is Signed!</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Downloaded file contains embedded digital signatures and timestamp.
                    </p>
                  </div>
                  <Button onClick={handleDownload} className="w-full font-semibold gap-2 rounded-xl">
                    <Download className="w-4 h-4" /> Download Signed PDF
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


