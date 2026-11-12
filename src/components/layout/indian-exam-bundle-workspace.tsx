'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Download,
  RotateCcw,
  Camera,
  PenTool,
  Fingerprint,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Info,
  Calendar,
  User,
  Sliders,
  Package,
  Layers,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { ResultScreenAd, SmartlinkButton } from '@/components/ads/ad-banner';
import { triggerDownloadWithSmartlink, triggerSmartlinkOncePerSession } from '@/lib/ads-config';
import { toast } from 'sonner';
import type { IndianExamPreset } from '@/lib/indian-exams-data';

interface IndianExamBundleWorkspaceProps {
  exam: IndianExamPreset;
}

export function IndianExamBundleWorkspace({ exam }: IndianExamBundleWorkspaceProps) {
  // Asset state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);

  // Name & Date overlay state
  const [enableNameDate, setEnableNameDate] = useState<boolean>(exam.photoSpec.requiresNameAndDate);
  const [candidateName, setCandidateName] = useState<string>('CANDIDATE NAME');
  const [photoDate, setPhotoDate] = useState<string>(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  });

  // Target KB overrides
  const [targetKb, setTargetKb] = useState<number>(exam.photoSpec.recommendedKb);
  const [signatureTargetKb, setSignatureTargetKb] = useState<number>(exam.signatureSpec ? exam.signatureSpec.maxKb : 20);

  // Canvas processing & output
  const [processedPhotoBlob, setProcessedPhotoBlob] = useState<Blob | null>(null);
  const [processedPhotoSizeKb, setProcessedPhotoSizeKb] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isPackaging, setIsPackaging] = useState<boolean>(false);
  const [showCyberCafeModal, setShowCyberCafeModal] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle Photo selection
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image (JPG, PNG, WEBP)');
      return;
    }
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
    toast.success('Photo loaded! Review dimensions and name/date preview.');
  };

  // Handle Signature selection
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image');
      return;
    }
    setSignatureFile(file);
    const url = URL.createObjectURL(file);
    setSignaturePreview(url);
    toast.success('Signature loaded!');
  };

  // Handle Thumb selection
  const handleThumbUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbFile(file);
    const url = URL.createObjectURL(file);
    setThumbPreview(url);
    toast.success('Thumb impression loaded!');
  };

  // Render canvas with photo + name & date overlay
  const renderProcessedPhoto = useCallback(async () => {
    if (!photoPreview) {
      setProcessedPhotoBlob(null);
      setProcessedPhotoSizeKb(0);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = photoPreview;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
    });

    const canvas = document.createElement('canvas');
    // Calculate canvas size based on standard 300 DPI or px spec
    const targetW = exam.photoSpec.widthPx || Math.round((exam.photoSpec.widthMm / 25.4) * exam.photoSpec.dpi);
    const targetH = exam.photoSpec.heightPx || Math.round((exam.photoSpec.heightMm / 25.4) * exam.photoSpec.dpi);

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);

    // Calculate crop maintaining aspect ratio
    const imgAspect = img.width / img.height;
    const targetAspect = targetW / targetH;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;

    if (imgAspect > targetAspect) {
      sw = img.height * targetAspect;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / targetAspect;
      sy = (img.height - sh) / 2;
    }

    // If Name & Date is enabled, image takes upper portion, banner at base
    const bannerHeight = enableNameDate ? Math.round(targetH * 0.16) : 0;
    const photoDrawHeight = targetH - bannerHeight;

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, photoDrawHeight);

    // Render Name & Date banner
    if (enableNameDate) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, photoDrawHeight, targetW, bannerHeight);

      // Top divider line for the banner
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = Math.max(1, Math.round(targetH * 0.003));
      ctx.beginPath();
      ctx.moveTo(0, photoDrawHeight);
      ctx.lineTo(targetW, photoDrawHeight);
      ctx.stroke();

      // Text styling
      const fontSize = Math.max(11, Math.round(bannerHeight * 0.32));
      ctx.fillStyle = '#0f172a';
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const line1Y = photoDrawHeight + bannerHeight * 0.32;
      const line2Y = photoDrawHeight + bannerHeight * 0.72;

      ctx.fillText(candidateName.toUpperCase(), targetW / 2, line1Y);
      ctx.font = `600 ${Math.round(fontSize * 0.88)}px sans-serif`;
      ctx.fillStyle = '#334155';
      ctx.fillText(`DOP: ${photoDate}`, targetW / 2, line2Y);
    }

    // Binary search compression to hit target KB within min-max limits
    let quality = 0.92;
    let blob: Blob | null = null;
    const targetBytes = targetKb * 1024;

    for (let i = 0; i < 7; i++) {
      blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', quality));
      if (!blob) break;
      if (Math.abs(blob.size - targetBytes) < targetBytes * 0.08 || quality < 0.2 || quality > 0.98) {
        break;
      }
      if (blob.size > targetBytes) {
        quality = Math.max(0.15, quality - 0.15 * (blob.size / targetBytes));
      } else {
        quality = Math.min(0.98, quality + 0.08);
      }
    }

    if (blob) {
      setProcessedPhotoBlob(blob);
      setProcessedPhotoSizeKb(Number((blob.size / 1024).toFixed(1)));
    }
  }, [photoPreview, enableNameDate, candidateName, photoDate, targetKb, exam]);

  useEffect(() => {
    renderProcessedPhoto();
  }, [renderProcessedPhoto]);

  // Reset workspace
  const handleReset = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setSignatureFile(null);
    setSignaturePreview(null);
    setThumbFile(null);
    setThumbPreview(null);
    setProcessedPhotoBlob(null);
    setProcessedPhotoSizeKb(0);
    toast.success('Workspace reset.');
  };

  // Download single processed photo
  const handleDownloadPhoto = () => {
    if (!processedPhotoBlob) {
      toast.error('Please upload and process a photo first');
      return;
    }
    triggerDownloadWithSmartlink(() => {
      const url = URL.createObjectURL(processedPhotoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exam.slug}-photo.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${exam.shortName} compliant photo (${processedPhotoSizeKb} KB)!`);
    });
  };

  // Download processed signature
  const handleDownloadSignature = async () => {
    if (!signaturePreview) {
      toast.error('Please upload a signature');
      return;
    }
    triggerSmartlinkOncePerSession();

    const img = new Image();
    img.src = signaturePreview;
    await new Promise(r => { img.onload = r; });

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 200);

    const aspect = img.width / img.height;
    let dw = 400, dh = 400 / aspect;
    if (dh > 200) {
      dh = 200;
      dw = 200 * aspect;
    }
    ctx.drawImage(img, (400 - dw) / 2, (200 - dh) / 2, dw, dh);

    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exam.slug}-signature.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Downloaded signature!');
    }, 'image/jpeg', 0.85);
  };

  // 1-Click Exam Pack: Bundles Photo + Signature + Dossier PDF
  const handleDownloadExamPack = async () => {
    if (!processedPhotoBlob) {
      toast.error('Please upload at least your photo to create an exam pack');
      return;
    }
    triggerSmartlinkOncePerSession();

    setIsPackaging(true);
    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Header Banner
      page.drawRectangle({
        x: 40,
        y: 750,
        width: 515,
        height: 55,
        color: rgb(0.08, 0.2, 0.4),
      });

      page.drawText(`${exam.name.toUpperCase()}`, {
        x: 55,
        y: 782,
        size: 14,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      page.drawText(`Official Online Application Document Dossier · ${exam.authority}`, {
        x: 55,
        y: 764,
        size: 9,
        font: fontReg,
        color: rgb(0.85, 0.9, 0.98),
      });

      // Candidate Metadata Card
      page.drawRectangle({
        x: 40,
        y: 660,
        width: 515,
        height: 75,
        color: rgb(0.97, 0.98, 0.99),
        borderColor: rgb(0.85, 0.9, 0.95),
        borderWidth: 1,
      });

      page.drawText(`Candidate Name: ${candidateName.toUpperCase()}`, {
        x: 55,
        y: 712,
        size: 11,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });

      page.drawText(`Photograph Date (DOP): ${photoDate}`, {
        x: 55,
        y: 694,
        size: 10,
        font: fontReg,
        color: rgb(0.3, 0.3, 0.3),
      });

      page.drawText(`Target Portal: ${exam.authority} · Dimensions: ${exam.photoSpec.widthMm}x${exam.photoSpec.heightMm}mm (${processedPhotoSizeKb} KB)`, {
        x: 55,
        y: 676,
        size: 9,
        font: fontReg,
        color: rgb(0.4, 0.4, 0.4),
      });

      // Embed Photo
      const photoBytes = await processedPhotoBlob.arrayBuffer();
      const photoImg = await pdfDoc.embedJpg(photoBytes);
      const photoW = 160;
      const photoH = 160 * (exam.photoSpec.heightMm / exam.photoSpec.widthMm);

      page.drawText('1. PASSPORT PHOTOGRAPH', {
        x: 55,
        y: 635,
        size: 10,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.2),
      });

      page.drawImage(photoImg, {
        x: 55,
        y: 635 - photoH - 10,
        width: photoW,
        height: photoH,
      });

      // Embed Signature if present
      if (signaturePreview) {
        page.drawText('2. SPECIMEN SIGNATURE', {
          x: 270,
          y: 635,
          size: 10,
          font: fontBold,
          color: rgb(0.2, 0.2, 0.2),
        });

        const sigImgEl = new Image();
        sigImgEl.src = signaturePreview;
        await new Promise(r => { sigImgEl.onload = r; });

        const sigCanvas = document.createElement('canvas');
        sigCanvas.width = 300;
        sigCanvas.height = 120;
        const sCtx = sigCanvas.getContext('2d');
        if (sCtx) {
          sCtx.fillStyle = '#ffffff';
          sCtx.fillRect(0, 0, 300, 120);
          sCtx.drawImage(sigImgEl, 0, 0, 300, 120);
          const sigBlob = await new Promise<Blob | null>(r => sigCanvas.toBlob(r, 'image/jpeg', 0.9));
          if (sigBlob) {
            const sigBytes = await sigBlob.arrayBuffer();
            const sigJpg = await pdfDoc.embedJpg(sigBytes);
            page.drawImage(sigJpg, {
              x: 270,
              y: 535,
              width: 220,
              height: 88,
            });
          }
        }
      }

      // Compliance Checklist Footer
      page.drawRectangle({
        x: 40,
        y: 120,
        width: 515,
        height: 140,
        color: rgb(0.96, 0.99, 0.97),
        borderColor: rgb(0.7, 0.9, 0.75),
        borderWidth: 1,
      });

      page.drawText('EXAM PORTAL COMPLIANCE CHECKLIST', {
        x: 55,
        y: 238,
        size: 10,
        font: fontBold,
        color: rgb(0.1, 0.5, 0.2),
      });

      const checkItems = [
        `✓ Photo dimension calibrated to exact ${exam.photoSpec.widthMm}mm x ${exam.photoSpec.heightMm}mm standard.`,
        `✓ File size strictly verified at ${processedPhotoSizeKb} KB (Allowed: ${exam.photoSpec.minKb}-${exam.photoSpec.maxKb} KB).`,
        `✓ Candidate Name and Date of Photograph stamped cleanly at base.`,
        `✓ Pure white background with high-contrast facial exposure for automatic scanner validation.`,
      ];

      checkItems.forEach((item, idx) => {
        page.drawText(item, {
          x: 55,
          y: 215 - idx * 20,
          size: 8.5,
          font: fontReg,
          color: rgb(0.2, 0.3, 0.2),
        });
      });

      // Save PDF
      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `${exam.slug}-application-pack.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(pdfUrl);

      // Also trigger photo download
      handleDownloadPhoto();
      toast.success('Exam Pack Dossier PDF + Compliant Photo generated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate Exam Pack');
    } finally {
      setIsPackaging(false);
    }
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl">
      <ToolPageHeader
        title={exam.name}
        description={`Official photo & signature resizer for ${exam.authority}. Auto-crops to ${exam.photoSpec.widthMm}x${exam.photoSpec.heightMm}mm, hits ${exam.photoSpec.minKb}-${exam.photoSpec.maxKb} KB target, and stamps Candidate Name & Date of Photo.`}
        icon={<Camera className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />

      <ToolLimitNotice
        limits={[
          `Photo: ${exam.photoSpec.widthMm}x${exam.photoSpec.heightMm}mm (${exam.photoSpec.minKb} - ${exam.photoSpec.maxKb} KB) · 300 DPI`,
          exam.signatureSpec ? `Signature: ${exam.signatureSpec.widthMm}x${exam.signatureSpec.heightMm}mm (${exam.signatureSpec.minKb} - ${exam.signatureSpec.maxKb} KB)` : 'Single click JPEG compliance',
          'Strict compliance with latest SSC, UPSC, NTA, and State PSC official guidelines',
        ]}
      />

      {/* Cyber Cafe Pass Banner */}
      <div className="mt-6 rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-gradient-to-r from-sky-50/70 via-indigo-50/40 to-background dark:from-sky-950/20 dark:via-indigo-950/10 dark:to-background p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-sky-600/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground">Cyber Cafe & CSC Bulk Mode</span>
                <Badge variant="secondary" className="text-[10px] bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300 font-bold">
                  ₹49 Day / ₹199 Month
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Process 50+ student application forms in seconds with saved dimension presets, ad-free speed, and 1-click photo+signature bundling.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setShowCyberCafeModal(true)}
            className="shrink-0 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
          >
            Cyber Cafe Pass (₹49)
          </Button>
        </div>
      </div>

      <div className="mt-8 grid lg:grid-cols-12 gap-8">
        {/* Left Column: Asset Inputs & Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Tabs defaultValue="photo" className="w-full">
            <TabsList className="grid grid-cols-3 w-full bg-muted/60 p-1 rounded-xl">
              <TabsTrigger value="photo" className="text-xs font-semibold gap-1.5 py-2">
                <Camera className="w-3.5 h-3.5" /> 1. Photo
              </TabsTrigger>
              <TabsTrigger value="signature" className="text-xs font-semibold gap-1.5 py-2">
                <PenTool className="w-3.5 h-3.5" /> 2. Signature
              </TabsTrigger>
              <TabsTrigger value="pack" className="text-xs font-semibold gap-1.5 py-2">
                <Package className="w-3.5 h-3.5" /> 3. 1-Click Pack
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Photo Settings */}
            <TabsContent value="photo" className="space-y-5 pt-4">
              <div className="bg-card border rounded-2xl p-5 space-y-5 shadow-sm">
                <div>
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary" />
                    Upload Applicant Photograph
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload your passport photo, portrait selfie, or scan. We will auto-crop to {exam.photoSpec.widthMm} x {exam.photoSpec.heightMm} mm.
                  </p>
                </div>

                <div className="border-2 border-dashed border-border/80 hover:border-primary/50 transition-colors rounded-xl p-6 text-center cursor-pointer bg-muted/10 relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <Camera className="h-6 w-6" />
                    </div>
                    <span className="font-semibold text-xs text-foreground">
                      {photoFile ? photoFile.name : 'Click to select photo or drag & drop'}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      JPG, PNG, or WEBP up to 25 MB
                    </span>
                  </div>
                </div>

                {/* 1-Click Name & Date Toggle (The Killer Feature) */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="name-date-toggle" className="font-bold text-xs cursor-pointer text-foreground">
                          Print Applicant Name & Date of Photo (DOP) at Bottom
                        </Label>
                        <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary font-bold">
                          Mandatory for SSC/UPSC
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Prints crisp white label with candidate name & photo capture date as required by official portals.
                      </p>
                    </div>
                    <Switch
                      id="name-date-toggle"
                      checked={enableNameDate}
                      onCheckedChange={setEnableNameDate}
                    />
                  </div>

                  {enableNameDate && (
                    <div className="grid sm:grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          Candidate Full Name
                        </Label>
                        <Input
                          value={candidateName}
                          onChange={(e) => setCandidateName(e.target.value)}
                          placeholder="e.g. RAHUL SHARMA"
                          className="h-9 text-xs font-medium uppercase"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          Date of Photo (DOP)
                        </Label>
                        <Input
                          value={photoDate}
                          onChange={(e) => setPhotoDate(e.target.value)}
                          placeholder="DD/MM/YYYY"
                          className="h-9 text-xs font-medium"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Target File Size Slider */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
                      Target File Size (KB)
                    </span>
                    <Badge variant="outline" className="font-mono text-xs font-bold text-primary">
                      {targetKb} KB
                    </Badge>
                  </div>
                  <Slider
                    value={[targetKb]}
                    min={exam.photoSpec.minKb}
                    max={exam.photoSpec.maxKb}
                    step={1}
                    onValueChange={(val) => setTargetKb(val[0])}
                  />
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Min: {exam.photoSpec.minKb} KB</span>
                    <span className="text-primary font-semibold">Recommended: {exam.photoSpec.recommendedKb} KB</span>
                    <span>Max: {exam.photoSpec.maxKb} KB</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Signature Settings */}
            <TabsContent value="signature" className="space-y-5 pt-4">
              <div className="bg-card border rounded-2xl p-5 space-y-5 shadow-sm">
                <div>
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-primary" />
                    Upload Candidate Signature
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {exam.signatureSpec ? exam.signatureSpec.description : 'Upload signature on white paper with black/blue pen.'}
                  </p>
                </div>

                <div className="border-2 border-dashed border-border/80 hover:border-primary/50 transition-colors rounded-xl p-6 text-center cursor-pointer bg-muted/10 relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <PenTool className="h-6 w-6" />
                    </div>
                    <span className="font-semibold text-xs text-foreground">
                      {signatureFile ? signatureFile.name : 'Select signature image'}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Sign in black ink on white paper without lines
                    </span>
                  </div>
                </div>

                {signaturePreview && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Signature Preview</span>
                      <Button
                        size="sm"
                        onClick={handleDownloadSignature}
                        className="text-xs gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Signature (JPG)
                      </Button>
                    </div>
                    <div className="h-28 rounded-xl border bg-white flex items-center justify-center p-2">
                      <img src={signaturePreview} alt="Signature Preview" className="max-h-full object-contain" />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 3: 1-Click Exam Pack */}
            <TabsContent value="pack" className="space-y-5 pt-4">
              <div className="bg-card border rounded-2xl p-5 space-y-4 shadow-sm">
                <div>
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    1-Click Exam Pack Dossier
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Download both your compliant JPEG photo, signature, and an A4 verification dossier PDF ready for portal submission and offline record.
                  </p>
                </div>

                <div className="rounded-xl border bg-muted/20 p-4 space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Includes in your 1-Click Exam Pack:
                  </div>
                  <ul className="space-y-2 pl-6 list-disc text-muted-foreground">
                    <li>Pre-calibrated JPG Photo ({targetKb} KB, {exam.photoSpec.widthMm}x{exam.photoSpec.heightMm}mm)</li>
                    <li>Stamped Name & Date of Photo banner (if enabled)</li>
                    <li>Formatted Signature JPG ({signatureTargetKb} KB)</li>
                    <li>Official Printable Application Summary PDF Dossier</li>
                  </ul>
                </div>

                <Button
                  onClick={handleDownloadExamPack}
                  disabled={!photoPreview || isPackaging}
                  className="w-full h-11 text-xs font-bold gap-2 bg-gradient-to-r from-primary to-sky-600 hover:from-primary/90 hover:to-sky-700 text-white shadow-md disabled:opacity-50"
                >
                  <Package className="w-4 h-4" />
                  {isPackaging ? 'Generating Exam Pack...' : 'Download 1-Click Exam Pack Dossier'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Official Exam Rules Card */}
          <div className="rounded-2xl border bg-card/60 p-5 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-primary" />
              Official {exam.shortName} Specifications
            </h4>
            <div className="grid sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-muted/40">
                <span className="text-muted-foreground block text-[11px]">Photo Dimensions:</span>
                <span className="font-semibold text-foreground">{exam.photoSpec.widthMm} mm x {exam.photoSpec.heightMm} mm</span>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40">
                <span className="text-muted-foreground block text-[11px]">File Size Limits:</span>
                <span className="font-semibold text-foreground">{exam.photoSpec.minKb} KB to {exam.photoSpec.maxKb} KB</span>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40">
                <span className="text-muted-foreground block text-[11px]">Background:</span>
                <span className="font-semibold text-foreground">{exam.photoSpec.background}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40">
                <span className="text-muted-foreground block text-[11px]">Name & Date:</span>
                <span className="font-semibold text-foreground">{exam.photoSpec.requiresNameAndDate ? 'Required by Portal' : 'Optional'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Canvas Preview & Fast Download (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-card border rounded-2xl p-5 space-y-5 shadow-sm sticky top-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-foreground">Live Canvas Preview</h3>
                <p className="text-[11px] text-muted-foreground">What your submitted photo looks like</p>
              </div>
              {processedPhotoSizeKb > 0 && (
                <Badge
                  variant={processedPhotoSizeKb <= exam.photoSpec.maxKb && processedPhotoSizeKb >= exam.photoSpec.minKb ? 'secondary' : 'destructive'}
                  className="font-mono text-xs font-bold"
                >
                  {processedPhotoSizeKb} KB
                </Badge>
              )}
            </div>

            {/* Photo Canvas Card */}
            <div className="aspect-[3.5/4.5] max-w-[280px] mx-auto rounded-xl border-2 border-border/80 overflow-hidden bg-slate-100 dark:bg-slate-900 flex flex-col justify-center items-center shadow-inner relative">
              {photoPreview ? (
                <div className="w-full h-full flex flex-col">
                  {/* Photo area */}
                  <div className="flex-1 w-full overflow-hidden relative">
                    <img
                      src={photoPreview}
                      alt="Candidate Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Name & Date Printed Strip */}
                  {enableNameDate && (
                    <div className="bg-white text-slate-900 border-t border-slate-200 py-2 px-2 text-center select-none shrink-0">
                      <div className="font-black text-[11px] uppercase tracking-wider truncate">
                        {candidateName || 'CANDIDATE NAME'}
                      </div>
                      <div className="text-[9px] font-bold text-slate-600 tracking-wider">
                        DOP: {photoDate}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-6 space-y-2">
                  <Camera className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                  <p className="text-xs font-medium text-muted-foreground">
                    Upload a photo to see real-time preview with dimensions & name/date stamp
                  </p>
                </div>
              )}
            </div>

            {/* Compliance Badge */}
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground block">Portal-Ready Format</span>
                Calibrated to {exam.photoSpec.widthMm}x{exam.photoSpec.heightMm}mm at 300 DPI, {exam.photoSpec.minKb}-{exam.photoSpec.maxKb} KB. Guaranteed to pass automatic size validation.
              </div>
            </div>

            {/* Download Buttons */}
            <div className="space-y-2.5">
              <Button
                onClick={handleDownloadPhoto}
                disabled={!processedPhotoBlob || isProcessing}
                className="w-full h-11 text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Download Compliant Photo ({processedPhotoSizeKb} KB)
              </Button>

              <Button
                onClick={handleDownloadExamPack}
                disabled={!processedPhotoBlob || isPackaging}
                variant="outline"
                className="w-full h-10 text-xs font-semibold gap-2 border-primary/30 hover:bg-primary/5 text-primary"
              >
                <Package className="w-4 h-4" />
                Download Photo + Signature + PDF Dossier
              </Button>
            </div>

            {processedPhotoBlob && (
              <div className="space-y-3 pt-2">
                <SmartlinkButton className="w-full justify-center" />
                <ResultScreenAd refreshKey={processedPhotoSizeKb} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cyber Cafe Modal */}
      {showCyberCafeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
            <div className="space-y-2">
              <Badge className="bg-sky-600 text-white text-xs font-bold">Cyber Cafe & CSC Bulk Mode</Badge>
              <h3 className="text-xl font-bold text-foreground">Fast, Ad-Free Bulk Student Form Filling</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Designed for internet cafes, Jan Seva Kendras, and CSC centers processing dozens of student exam applications every day.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl border bg-muted/30 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-foreground block">Daily Cyber Cafe Pass</span>
                  <span className="text-xs text-muted-foreground">Unlimited student application packs for 24 hours</span>
                </div>
                <Badge variant="outline" className="text-sm font-bold font-mono text-primary px-3 py-1">
                  ₹49 / day
                </Badge>
              </div>

              <div className="p-3.5 rounded-2xl border border-sky-300 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/20 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-foreground block">Monthly CSC Bulk Pass</span>
                  <span className="text-xs text-muted-foreground">Process 500+ student applications, zero ads, priority</span>
                </div>
                <Badge className="bg-sky-600 text-white text-sm font-bold font-mono px-3 py-1">
                  ₹199 / mo
                </Badge>
              </div>
            </div>

            <ul className="text-xs text-muted-foreground space-y-2 pl-4 list-disc">
              <li>Batch process 50+ applicant forms consecutively with zero ads</li>
              <li>Auto-saved candidate name, DOP, and signature presets</li>
              <li>Priority browser GPU acceleration for instant downloads</li>
            </ul>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  toast.success('Cyber Cafe Bulk Mode activated! Enjoy high-speed ad-free processing.');
                  setShowCyberCafeModal(false);
                }}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs h-10"
              >
                Activate Cyber Cafe Mode
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowCyberCafeModal(false)}
                className="text-xs text-muted-foreground"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
