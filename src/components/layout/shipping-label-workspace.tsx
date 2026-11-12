'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Download,
  RotateCcw,
  Printer,
  Package,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  FileText,
  Sliders,
  Zap,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { FileUpload } from './file-upload';
import { ResultScreenAd, SmartlinkButton } from '@/components/ads/ad-banner';
import { triggerDownloadWithSmartlink } from '@/lib/ads-config';
import { useAppStore } from '@/store/app-store';
import { toast } from 'sonner';

type MarketplacePreset = 'flipkart' | 'meesho' | 'amazon' | 'indiapost' | 'custom';

export function ShippingLabelCropWorkspace() {
  const { uploadedFile, isProcessing, setIsProcessing, setProgress, reset } = useAppStore();

  const [preset, setPreset] = useState<MarketplacePreset>('flipkart');
  const [keepInvoice, setKeepInvoice] = useState<boolean>(true);
  const [rotation, setRotation] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [outputFileName, setOutputFileName] = useState<string>('');
  const [showSellerPassModal, setShowSellerPassModal] = useState<boolean>(false);

  useEffect(() => {
    if (!uploadedFile) {
      setTotalPages(1);
      setDownloadUrl(null);
      return;
    }

    let active = true;
    (async () => {
      try {
        const { PDFDocument } = await import('pdf-lib');
        const buffer = await uploadedFile.arrayBuffer();
        const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
        if (active) {
          setTotalPages(pdf.getPageCount());
          toast.success(`Loaded PDF with ${pdf.getPageCount()} invoice page${pdf.getPageCount() === 1 ? '' : 's'}.`);
        }
      } catch {
        if (active) setTotalPages(1);
      }
    })();

    return () => { active = false; };
  }, [uploadedFile]);

  const handleReset = useCallback(() => {
    if (downloadUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(downloadUrl);
    }
    reset();
    setDownloadUrl(null);
    setOutputFileName('');
  }, [reset, downloadUrl]);

  const handleProcessLabels = async () => {
    if (!uploadedFile) {
      toast.error('Please upload an invoice PDF first');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('preset', preset);
      formData.append('keepInvoice', String(keepInvoice));
      formData.append('rotation', String(rotation));

      const { fetchWithUploadProgress } = await import('@/lib/upload-with-progress');
      const res = await fetchWithUploadProgress('/api/pdf/crop-shipping-label', formData, setProgress);

      setProgress(90);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Label cropping failed' }));
        throw new Error(err.error || 'Failed to crop shipping labels');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      const baseName = uploadedFile.name.replace(/\.pdf$/i, '');
      setOutputFileName(`${baseName}-4x6-thermal.pdf`);
      setProgress(100);
      toast.success('Successfully cropped to 4x6 thermal printer format!');
    } catch (err: any) {
      toast.error(err.message || 'Error processing shipping labels');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    triggerDownloadWithSmartlink(() => {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = outputFileName || 'shipping-labels-4x6.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Downloaded ready-to-print 4x6 labels!');
    });
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
      <ToolPageHeader
        title="Shipping Label Cropper for Thermal Printers"
        description="Crop A4 marketplace invoices into 4×6 inch thermal shipping labels for Flipkart, Meesho, Amazon, and India Post. Keep tax invoices on separate sheets in 1 click."
        icon={<Printer className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />

      <ToolLimitNotice
        limits={[
          'Flipkart, Meesho, Amazon, India Post A4 invoices',
          'Standard 4×6 inch (100×150 mm) thermal printer roll formatting',
          'Optional separation: Sheet 1 Label, Sheet 2 Tax Invoice & Packing Slip',
        ]}
      />

      {/* Seller Pass Banner */}
      <div className="mt-6 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-background dark:from-amber-950/20 dark:via-orange-950/10 dark:to-background p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-amber-600/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground">E-Commerce Seller Bulk Pass</span>
                <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-300 font-bold">
                  ₹49 Day / ₹199 Month
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bulk crop 500+ daily orders from Flipkart & Meesho with zero ads, saved margins, and 1-click batch thermal PDF generation.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setShowSellerPassModal(true)}
            className="shrink-0 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
          >
            Seller Pass (₹49)
          </Button>
        </div>
      </div>

      {!uploadedFile ? (
        <div className="mt-8">
          <FileUpload accept=".pdf,application/pdf" />
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left 7 cols: Preset Configuration */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <ShoppingBag className="w-4 h-4 text-primary" />
                    Marketplace & Thermal Settings
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {totalPages} Page{totalPages === 1 ? '' : 's'}
                  </Badge>
                </div>

                {/* 1-Click Marketplace Presets */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-foreground">Select Marketplace Preset:</Label>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPreset('flipkart')}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                        preset === 'flipkart'
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border/60 bg-muted/20 hover:border-border'
                      }`}
                    >
                      <div className="h-8 w-8 rounded-lg bg-yellow-500/10 text-yellow-600 flex items-center justify-center shrink-0 font-black text-sm">
                        F
                      </div>
                      <div>
                        <span className="font-bold text-xs text-foreground block">Flipkart Seller Hub</span>
                        <span className="text-[11px] text-muted-foreground">Top 4x6 label + bottom tax invoice</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreset('meesho')}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                        preset === 'meesho'
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border/60 bg-muted/20 hover:border-border'
                      }`}
                    >
                      <div className="h-8 w-8 rounded-lg bg-pink-500/10 text-pink-600 flex items-center justify-center shrink-0 font-black text-sm">
                        M
                      </div>
                      <div>
                        <span className="font-bold text-xs text-foreground block">Meesho Supplier</span>
                        <span className="text-[11px] text-muted-foreground">Top shipping label + dispatch slip</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreset('amazon')}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                        preset === 'amazon'
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border/60 bg-muted/20 hover:border-border'
                      }`}
                    >
                      <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 font-black text-sm">
                        A
                      </div>
                      <div>
                        <span className="font-bold text-xs text-foreground block">Amazon Easy Ship / FBA</span>
                        <span className="text-[11px] text-muted-foreground">4x6 barcode label trim</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreset('indiapost')}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                        preset === 'indiapost'
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border/60 bg-muted/20 hover:border-border'
                      }`}
                    >
                      <div className="h-8 w-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center shrink-0 font-black text-sm">
                        P
                      </div>
                      <div>
                        <span className="font-bold text-xs text-foreground block">India Post Speed Post</span>
                        <span className="text-[11px] text-muted-foreground">Parcel barcode label extract</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Invoice Separation Switch */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="keep-invoice" className="font-bold text-xs cursor-pointer text-foreground">
                      Keep Tax Invoice on Separate Sheet
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Generates Sheet 1: 4×6 Thermal Label for package, Sheet 2: Customer Tax Invoice for inside box.
                    </p>
                  </div>
                  <Switch
                    id="keep-invoice"
                    checked={keepInvoice}
                    onCheckedChange={setKeepInvoice}
                  />
                </div>

                {/* Rotation for Thermal Printers */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Thermal Roll Orientation</Label>
                    <Select value={String(rotation)} onValueChange={(val) => setRotation(Number(val))}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Rotation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Portrait (0° Default)</SelectItem>
                        <SelectItem value="90">Rotate 90° Clockwise</SelectItem>
                        <SelectItem value="180">Rotate 180° Inverted</SelectItem>
                        <SelectItem value="270">Rotate 270° Counter-Clockwise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Printer Compatibility</Label>
                    <div className="h-9 rounded-md border bg-muted/30 px-3 flex items-center text-xs text-muted-foreground">
                      Rollo, Zebra, TVS, TSC, Bluetooth 4x6
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleProcessLabels}
                  disabled={isProcessing}
                  className="w-full h-11 text-xs font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  {isProcessing ? 'Cropping Labels...' : 'Crop & Format 4×6 Thermal Labels'}
                </Button>
              </div>
            </div>

            {/* Right 5 cols: Output & Preview */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-5 sticky top-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-foreground">Thermal Output Spec</h3>
                  <Badge variant="outline" className="text-xs font-mono">
                    4×6 Inch (100×150 mm)
                  </Badge>
                </div>

                {/* Visual Label Illustration */}
                <div className="aspect-[4/6] max-w-[240px] mx-auto rounded-xl border-2 border-dashed border-primary/40 bg-card p-4 flex flex-col justify-between shadow-inner relative overflow-hidden">
                  <div className="space-y-2 border-b border-border/60 pb-3">
                    <div className="h-3 w-1/3 bg-muted rounded" />
                    <div className="h-6 w-full bg-slate-800 dark:bg-slate-200 rounded flex items-center justify-center text-[10px] text-white dark:text-black font-mono">
                      |||||||||||||||||||||||||||||||
                    </div>
                    <div className="h-2 w-2/3 bg-muted rounded" />
                  </div>

                  <div className="space-y-1.5 py-3 text-[10px] text-muted-foreground">
                    <div className="flex justify-between">
                      <span>SHIP TO: CUSTOMER</span>
                      <span className="font-bold text-foreground">COD / PREPAID</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded" />
                    <div className="h-2 w-4/5 bg-muted rounded" />
                  </div>

                  <div className="border-t border-border/60 pt-2 flex items-center justify-between text-[10px]">
                    <span className="font-bold text-primary uppercase">{preset} LABEL</span>
                    <span className="font-mono text-muted-foreground">4×6 in</span>
                  </div>
                </div>

                {downloadUrl && (
                  <div className="space-y-3 pt-2">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>Ready to print! Optimized for all thermal label rolls.</span>
                    </div>

                    <Button
                      onClick={handleDownload}
                      className="w-full h-11 text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download 4×6 Thermal PDF
                    </Button>
                    <SmartlinkButton className="w-full text-xs" />
                    <ResultScreenAd refreshKey={downloadUrl} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seller Pass Modal */}
      {showSellerPassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
            <div className="space-y-2">
              <Badge className="bg-amber-600 text-white text-xs font-bold">E-Commerce Seller Pass</Badge>
              <h3 className="text-xl font-bold text-foreground">High-Speed Marketplace Batch Cropping</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Designed for Flipkart, Meesho, Amazon, and Shopify sellers processing hundreds of shipping labels every day.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl border bg-muted/30 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-foreground block">Seller Day Pass</span>
                  <span className="text-xs text-muted-foreground">Unlimited 500+ label crops for 24 hours</span>
                </div>
                <Badge variant="outline" className="text-sm font-bold font-mono text-primary px-3 py-1">
                  ₹49 / day
                </Badge>
              </div>

              <div className="p-3.5 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-foreground block">Monthly Seller Pro</span>
                  <span className="text-xs text-muted-foreground">Unlimited monthly batch processing, zero wait</span>
                </div>
                <Badge className="bg-amber-600 text-white text-sm font-bold font-mono px-3 py-1">
                  ₹199 / mo
                </Badge>
              </div>
            </div>

            <ul className="text-xs text-muted-foreground space-y-2 pl-4 list-disc">
              <li>Batch crop 500+ invoice pages into thermal labels in under 10 seconds</li>
              <li>Auto-separate packing slips from shipping labels</li>
              <li>Saved marketplace presets with zero advertisements</li>
            </ul>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  toast.success('Seller Pass activated! Enjoy high-speed batch thermal cropping.');
                  setShowSellerPassModal(false);
                }}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-10"
              >
                Activate Seller Pass
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowSellerPassModal(false)}
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
