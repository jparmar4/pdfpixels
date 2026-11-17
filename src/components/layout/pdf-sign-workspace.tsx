'use client';

import { motion } from 'framer-motion';
import {
  Download, RotateCcw, PenTool, Type, Trash2,
  Sparkles, FileSignature, Calendar, ArrowLeft, ArrowRight, Check, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useAppStore } from '@/store/app-store';
import { useConsumeChainedFile } from '@/hooks/use-consume-chained-file';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { PrivateModeBadge } from './private-mode-badge';
import { ResultScreenAd, SmartlinkButton } from '@/components/ads/ad-banner';
import { triggerDownloadWithSmartlink } from '@/lib/ads-config';
import { signPdfClient } from '@/lib/client-pdf-ops';
import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PdfPagePreview } from './pdf-page-preview';

export function PDFSignWorkspace() {
  const { uploadedFile, setUploadedFile, isProcessing, setIsProcessing, setProgress, reset } = useAppStore();

  useConsumeChainedFile(
    (chained) => {
      setUploadedFile(chained);
    },
    (chained) => Boolean(chained.type === 'application/pdf' || chained.name.toLowerCase().endsWith('.pdf')),
  );

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
  const [includeAuditTrail, setIncludeAuditTrail] = useState<boolean>(true);
  const [signerName, setSignerName] = useState<string>('');
  const [signerEmail, setSignerEmail] = useState<string>('');

  // Result state
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFileName, setResultFileName] = useState<string>('');
  const [signedSize, setSignedSize] = useState<number>(0);
  const [auditMeta, setAuditMeta] = useState<{ certificateId?: string; sha256: string } | null>(null);

  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const sigDragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const handleSigPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    sigDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: sigX,
      origY: sigY,
    };
    const onMove = (ev: PointerEvent) => {
      const dragState = sigDragRef.current;
      const container = previewContainerRef.current;
      if (!dragState || !container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const dx = ((ev.clientX - dragState.startX) / rect.width) * pageWidth;
      const dy = ((ev.clientY - dragState.startY) / rect.height) * pageHeight;
      setSigX(Math.max(0, Math.min(Math.max(0, pageWidth - sigW), Math.round(dragState.origX + dx))));
      setSigY(Math.max(0, Math.min(Math.max(0, pageHeight - sigH), Math.round(dragState.origY + dy))));
    };
    const onUp = () => {
      sigDragRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

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
        if (pdf.isEncrypted) {
          if (active) {
            setTotalPages(1);
            toast.warning('This PDF is password-protected — please unlock it before signing.');
          }
          return;
        }
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
    setProgress(25);

    try {
      const signed = await signPdfClient(uploadedFile, {
        signatureDataUrl: createdSigDataUrl,
        pageNumber: currentPage,
        x: Math.round(sigX),
        y: Math.round(sigY),
        width: Math.round(sigW),
        height: Math.round(sigH),
        dateText: includeDate && dateText ? `Date: ${dateText}` : undefined,
        includeAuditTrail,
        signerName,
        signerEmail,
      });

      setProgress(100);
      const copy = new Uint8Array(signed.bytes.byteLength);
      copy.set(signed.bytes);
      const blob = new Blob([copy.buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return url;
      });
      setSignedSize(blob.size);
      setAuditMeta({ certificateId: signed.certificateId, sha256: signed.sha256 });
      setResultFileName(uploadedFile.name.replace(/\.pdf$/i, '-signed.pdf'));
      toast.success(
        signed.certificateId
          ? 'PDF signed locally with SHA-256 Audit Trail Certificate (Zero Server Upload)!'
          : 'PDF signed locally inside your browser (Zero Server Upload)!',
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Signing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    triggerDownloadWithSmartlink(
      () => {
        const a = document.createElement('a');
        a.href = resultUrl;
        a.download = resultFileName || 'signed-document.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Download started');
      },
      {
        originalSize: uploadedFile?.size,
        processedSize: signedSize,
        formatLabel: 'PDF',
        fileName: resultFileName,
      },
    );
  };

  const handleReset = useCallback(() => {
    if (resultUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(resultUrl);
    }
    reset();
    setResultUrl(null);
    setSignedSize(0);
    setAuditMeta(null);
    setCreatedSigDataUrl(null);
    setSigPlaced(false);
    setCurrentPage(1);
  }, [reset, resultUrl]);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl">
      <ToolPageHeader
        title="Sign PDF Online Free"
        description="Add legally valid electronic signatures & optional SHA-256 Audit Trail Certificates to PDF contracts, tax forms, and NDAs — 100% client-side with zero server upload."
        icon={<FileSignature className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'PDF only · max 50 MB · 100% browser-native pdf-lib signing',
          'Draw, type, or upload signatures + optional Audit Trail Certificate page',
          'Records SHA-256 checksum & UTC timestamp under US ESIGN / EU eIDAS rules',
        ]}
      />
      <PrivateModeBadge
        className="mt-4"
        description="Your signature image, PDF content, SHA-256 hash, and verification certificate remain strictly in browser memory."
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

              {/* Visual PDF Page Preview with placed signature */}
              <div
                ref={previewContainerRef}
                className="relative bg-white dark:bg-zinc-900 border-2 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between"
                style={{ aspectRatio: `${pageWidth} / ${pageHeight}` }}
              >
                <div className="absolute inset-0">
                  <PdfPagePreview
                    file={uploadedFile}
                    pageNumber={currentPage}
                    onPageDimensions={({ width, height }) => {
                      setPageWidth(width);
                      setPageHeight(height);
                      setSigX((prev) => Math.max(0, Math.min(Math.max(0, width - sigW), prev)));
                      setSigY((prev) => Math.max(0, Math.min(Math.max(0, height - sigH), prev)));
                    }}
                  />
                </div>

                {/* Placed Signature Box Overlay */}
                {sigPlaced && createdSigDataUrl && (
                  <div
                    role="presentation"
                    onPointerDown={handleSigPointerDown}
                    className="absolute z-10 cursor-move touch-none border-2 border-primary bg-primary/5 rounded-lg p-1 shadow-md group select-none"
                    style={{
                      left: `${(sigX / pageWidth) * 100}%`,
                      top: `${(sigY / pageHeight) * 100}%`,
                      width: `${(sigW / pageWidth) * 100}%`,
                    }}
                  >
                    <div className="relative">
                      <img
                        src={createdSigDataUrl}
                        alt="Created signature preview"
                        className="w-full object-contain pointer-events-none"
                        style={{ aspectRatio: `${sigW} / ${sigH}` }}
                      />
                      {includeDate && (
                        <p className="text-[10px] font-mono text-zinc-700 mt-0.5 pointer-events-none truncate">
                          Date: {dateText}
                        </p>
                      )}
                      <div className="absolute -top-3 -right-3 hidden group-hover:flex">
                        <Badge variant="default" className="text-[9px] px-1 py-0">Drag</Badge>
                      </div>
                    </div>
                  </div>
                )}
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

                {/* Audit Trail & Verification Certificate Generator */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label htmlFor="audit-trail-switch" className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Audit Trail &amp; Verification Certificate
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Appends SHA-256 document hash &amp; UTC timestamp page.
                      </p>
                    </div>
                    <Switch
                      id="audit-trail-switch"
                      checked={includeAuditTrail}
                      onCheckedChange={setIncludeAuditTrail}
                    />
                  </div>
                  {includeAuditTrail && (
                    <div className="grid sm:grid-cols-2 gap-2">
                      <Input
                        placeholder="Signer Name (optional)"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        className="text-xs h-8"
                      />
                      <Input
                        placeholder="Signer Email / ID (optional)"
                        value={signerEmail}
                        onChange={(e) => setSignerEmail(e.target.value)}
                        className="text-xs h-8"
                      />
                    </div>
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
                      {auditMeta?.certificateId
                        ? `Embedded signature + Audit Trail Certificate (${auditMeta.certificateId})`
                        : 'Downloaded file contains your embedded electronic signature.'}
                    </p>
                    {auditMeta?.sha256 && (
                      <p className="text-[10px] font-mono text-muted-foreground mt-1 truncate">
                        SHA-256: {auditMeta.sha256.slice(0, 24)}...
                      </p>
                    )}
                  </div>
                  <Button onClick={handleDownload} className="w-full font-semibold gap-2 rounded-xl">
                    <Download className="w-4 h-4" /> Download Signed PDF
                  </Button>
                  <SmartlinkButton className="w-full justify-center" />
                  <ResultScreenAd
                    refreshKey={resultUrl}
                    originalSize={uploadedFile?.size}
                    processedSize={signedSize}
                    formatLabel="PDF"
                    fileName={resultFileName}
                  />
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


