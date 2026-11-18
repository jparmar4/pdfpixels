'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Download,
  Printer,
  CheckCircle2,
  ShoppingBag,
  Globe2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { FileUpload } from './file-upload';
import { ResultScreenAd, SmartlinkButton } from '@/components/ads/ad-banner';
import { triggerDownloadWithSmartlink } from '@/lib/ads-config';
import { useActiveTool } from '@/hooks/use-active-tool';
import { useConsumeChainedFile } from '@/hooks/use-consume-chained-file';
import { toast } from 'sonner';

type CarrierPreset =
  | 'usps'
  | 'ups'
  | 'fedex'
  | 'ebay'
  | 'etsy'
  | 'poshmark'
  | 'mercari'
  | 'shopify'
  | 'amazon-fba'
  | 'royal-mail'
  | 'dhl'
  | 'flipkart'
  | 'meesho'
  | 'amazon'
  | 'indiapost';

interface PresetOption {
  id: CarrierPreset;
  name: string;
  subtitle: string;
  tag: string;
  badgeColor: string;
}

const TIER1_PRESETS: PresetOption[] = [
  { id: 'usps', name: 'USPS Click-N-Ship', subtitle: '8.5×11" Priority / Ground Advantage → 4×6"', tag: 'US', badgeColor: 'bg-blue-500/10 text-blue-600' },
  { id: 'ups', name: 'UPS Shipping', subtitle: 'UPS.com & CampusShip half-sheet → 4×6"', tag: 'UP', badgeColor: 'bg-amber-600/10 text-amber-700' },
  { id: 'fedex', name: 'FedEx Express / Ground', subtitle: 'FedEx Ship Manager PDF → 4×6"', tag: 'FX', badgeColor: 'bg-violet-500/10 text-violet-600' },
  { id: 'ebay', name: 'eBay Seller Labels', subtitle: 'USPS / UPS / FedEx eBay order sheet trim', tag: 'EB', badgeColor: 'bg-emerald-500/10 text-emerald-600' },
  { id: 'etsy', name: 'Etsy Shipping Labels', subtitle: '4×6 label + optional Etsy packing slip', tag: 'ET', badgeColor: 'bg-orange-500/10 text-orange-600' },
  { id: 'poshmark', name: 'Poshmark Priority Mail', subtitle: 'Split 2-up Letter sheet for thermal rolls', tag: 'PM', badgeColor: 'bg-rose-500/10 text-rose-600' },
  { id: 'mercari', name: 'Mercari Shipping', subtitle: 'Auto-crop QR / barcode label cleanly', tag: 'MC', badgeColor: 'bg-indigo-500/10 text-indigo-600' },
  { id: 'shopify', name: 'Shopify Shipping', subtitle: 'Shopify admin multi-carrier label crop', tag: 'SH', badgeColor: 'bg-lime-600/10 text-lime-700' },
  { id: 'amazon-fba', name: 'Amazon FBA Box / FNSKU', subtitle: 'FBA box ID & carrier barcode 4×6" split', tag: 'AZ', badgeColor: 'bg-amber-500/10 text-amber-600' },
  { id: 'royal-mail', name: 'Royal Mail (UK)', subtitle: 'Click & Drop A4 label → 100×150mm / 4×6"', tag: 'RM', badgeColor: 'bg-red-500/10 text-red-600' },
  { id: 'dhl', name: 'DHL Parcel (DE / EU)', subtitle: 'DHL Paketschein & Express A4 → 100×150mm', tag: 'DH', badgeColor: 'bg-yellow-500/15 text-yellow-700' },
];

const INDIA_PRESETS: PresetOption[] = [
  { id: 'flipkart', name: 'Flipkart Seller Hub', subtitle: 'Top 4×6" shipping label + bottom GST invoice', tag: 'F', badgeColor: 'bg-yellow-500/10 text-yellow-600' },
  { id: 'meesho', name: 'Meesho Supplier', subtitle: 'Top AWB shipping barcode + dispatch slip', tag: 'M', badgeColor: 'bg-pink-500/10 text-pink-600' },
  { id: 'amazon', name: 'Amazon Easy Ship (IN)', subtitle: 'India Easy Ship 4×6" thermal trim', tag: 'A', badgeColor: 'bg-amber-500/10 text-amber-600' },
  { id: 'indiapost', name: 'India Post Speed Post', subtitle: 'Parcel AWB barcode section extract', tag: 'P', badgeColor: 'bg-red-500/10 text-red-600' },
];

const PRINTER_PROFILES = [
  { id: 'rollo-4x6', label: 'Rollo Thermal (4×6 in / 100×150mm)' },
  { id: 'zebra-4x6', label: 'Zebra GK420d / ZP450 (4×6 in)' },
  { id: 'munbyn-4x6', label: 'Munbyn ITPP941 / Wireless (4×6 in)' },
  { id: 'dymo-4xl', label: 'DYMO LabelWriter 4XL (4×6 in)' },
  { id: 'eu-100x150', label: 'UK / EU Standard (100×150 mm)' },
];

export function ShippingLabelCropWorkspace() {
  const { activeTool, uploadedFile, setUploadedFile, isProcessing, setIsProcessing, setProgress, reset } = useActiveTool();

  const [regionTab, setRegionTab] = useState<'tier1' | 'india'>(() => {
    if (typeof window !== 'undefined' && (window.location.pathname.startsWith('/in') || document.referrer.includes('/in'))) {
      return 'india';
    }
    return 'tier1';
  });
  const [preset, setPreset] = useState<CarrierPreset>(() => {
    if (typeof window !== 'undefined' && (window.location.pathname.startsWith('/in') || document.referrer.includes('/in'))) {
      return 'flipkart';
    }
    return 'usps';
  });
  const [printer, setPrinter] = useState<string>('rollo-4x6');
  const [keepInvoice, setKeepInvoice] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [processedSize, setProcessedSize] = useState<number>(0);
  const [outputFileName, setOutputFileName] = useState<string>('');

  useConsumeChainedFile(
    (chained) => {
      setUploadedFile(chained);
      setDownloadUrl(null);
    },
    (chained) => Boolean(chained.type === 'application/pdf' || chained.name.toLowerCase().endsWith('.pdf')),
  );

  useEffect(() => {
    if (!uploadedFile) {
      const t = window.setTimeout(() => {
        setTotalPages(1);
        setDownloadUrl(null);
      }, 0);
      return () => window.clearTimeout(t);
    }

    let active = true;
    (async () => {
      try {
        const { PDFDocument } = await import('pdf-lib');
        const buffer = await uploadedFile.arrayBuffer();
        const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
        if (active) {
          setTotalPages(pdf.getPageCount());
          toast.success(`Loaded PDF with ${pdf.getPageCount()} label page${pdf.getPageCount() === 1 ? '' : 's'}.`);
        }
      } catch {
        if (active) setTotalPages(1);
      }
    })();

    return () => {
      active = false;
    };
  }, [uploadedFile]);

  const handleReset = useCallback(() => {
    if (downloadUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(downloadUrl);
    }
    reset();
    setDownloadUrl(null);
    setProcessedSize(0);
    setOutputFileName('');
  }, [reset, downloadUrl]);

  const handleProcessLabels = async () => {
    if (!uploadedFile) {
      toast.error('Please upload a shipping label PDF first');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('preset', preset);
      formData.append('printer', printer);
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
      setDownloadUrl((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return url;
      });
      setProcessedSize(blob.size);
      const baseName = uploadedFile.name.replace(/\.pdf$/i, '');
      setOutputFileName(`${baseName}-${preset}-4x6-thermal.pdf`);
      setProgress(100);
      toast.success('Successfully formatted 4×6" thermal shipping labels!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error processing shipping labels';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const activePrinter = PRINTER_PROFILES.find((p) => p.id === printer)?.label || '4×6" Thermal';
    triggerDownloadWithSmartlink(
      () => {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = outputFileName || 'shipping-labels-4x6.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Downloaded ready-to-print thermal labels!');
      },
      {
        originalSize: uploadedFile?.size,
        processedSize,
        formatLabel: 'PDF',
        dpiLabel: activePrinter,
        fileName: outputFileName,
      },
    );
  };

  const activePresetInfo =
    [...TIER1_PRESETS, ...INDIA_PRESETS].find((item) => item.id === preset) ?? TIER1_PRESETS[0];

  const renderPresetGrid = (list: PresetOption[]) => (
    <div className="grid sm:grid-cols-2 gap-2.5">
      {list.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setPreset(item.id)}
          className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
            preset === item.id
              ? 'border-primary bg-primary/5 ring-1 ring-primary'
              : 'border-border/60 bg-muted/20 hover:border-border'
          }`}
        >
          <div className={`h-8 w-8 rounded-lg ${item.badgeColor} flex items-center justify-center shrink-0 font-black text-xs`}>
            {item.tag}
          </div>
          <div className="min-w-0">
            <span className="font-bold text-xs text-foreground block truncate">{item.name}</span>
            <span className="text-[11px] text-muted-foreground line-clamp-1">{item.subtitle}</span>
          </div>
        </button>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
      <ToolPageHeader
        title={activeTool?.name || 'Shipping Label Cropper (USPS, UPS, FedEx, eBay & Thermal)'}
        description={activeTool?.description || 'Crop US Letter (8.5×11") and A4 carrier sheets into crisp 4×6 inch (100×150mm) thermal labels for USPS Click-N-Ship, UPS, FedEx, eBay, Etsy, Poshmark, Mercari, Shopify, Amazon FBA, Royal Mail, and DHL.'}
        icon={<Printer className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />

      <ToolLimitNotice
        limits={[
          'USPS, UPS, FedEx, eBay, Etsy, Poshmark, Mercari, Shopify, Amazon FBA, Royal Mail & DHL',
          'Exact 4×6 inch (100×150 mm) output calibrated for Rollo, Zebra, Munbyn & DYMO 4XL',
          'Batch multi-page PDF cropping + optional separate packing slip page · 100% Free',
        ]}
      />

      {!uploadedFile ? (
        <div className="mt-8">
          <FileUpload accept=".pdf,application/pdf" />
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <ShoppingBag className="w-4 h-4 text-primary" />
                    Carrier &amp; Marketplace Presets
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {totalPages} Page{totalPages === 1 ? '' : 's'}
                  </Badge>
                </div>

                <Tabs
                  value={regionTab}
                  onValueChange={(v) => {
                    const next = v === 'india' ? 'india' : 'tier1';
                    setRegionTab(next);
                    if (next === 'india' && !INDIA_PRESETS.some((p) => p.id === preset)) {
                      setPreset('flipkart');
                    } else if (next === 'tier1' && !TIER1_PRESETS.some((p) => p.id === preset)) {
                      setPreset('usps');
                    }
                  }}
                >
                  <TabsList className="grid w-full grid-cols-2 rounded-xl">
                    <TabsTrigger value="tier1" className="text-xs font-semibold gap-1.5">
                      <Globe2 className="w-3.5 h-3.5" />
                      US / UK / EU Carriers
                    </TabsTrigger>
                    <TabsTrigger value="india" className="text-xs font-semibold">
                      India Marketplace Presets
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="tier1" className="mt-3">
                    {renderPresetGrid(TIER1_PRESETS)}
                  </TabsContent>
                  <TabsContent value="india" className="mt-3">
                    {renderPresetGrid(INDIA_PRESETS)}
                  </TabsContent>
                </Tabs>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="keep-invoice" className="font-bold text-xs cursor-pointer text-foreground">
                      Keep Packing Slip / Tax Invoice on Separate Sheet
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Page 1 exports the 4×6&quot; thermal shipping label; Page 2 preserves the lower packing slip or tax invoice separately.
                    </p>
                  </div>
                  <Switch
                    id="keep-invoice"
                    checked={keepInvoice}
                    onCheckedChange={setKeepInvoice}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Thermal Printer Profile</Label>
                    <Select value={printer} onValueChange={setPrinter}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Printer Model" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRINTER_PROFILES.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Roll Feed Rotation</Label>
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
                </div>

                <Button
                  onClick={handleProcessLabels}
                  disabled={isProcessing}
                  className="w-full h-11 text-xs font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  {isProcessing ? 'Cropping Thermal Labels...' : `Crop for ${activePresetInfo.name}`}
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-5 sticky top-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-foreground">Thermal Spec Preview</h3>
                  <Badge variant="outline" className="text-xs font-mono">
                    {printer === 'eu-100x150' ? '100×150 mm' : '4×6 Inch · 288×432 pt'}
                  </Badge>
                </div>

                <div className="aspect-[4/6] max-w-[230px] mx-auto rounded-xl border-2 border-dashed border-primary/40 bg-card p-4 flex flex-col justify-between shadow-inner relative overflow-hidden">
                  <div className="space-y-2 border-b border-border/60 pb-3">
                    <div className="flex items-center justify-between text-[10px] font-bold text-foreground">
                      <span>{activePresetInfo.tag} PRIORITY</span>
                      <span>ROLLO / ZEBRA</span>
                    </div>
                    <div className="h-7 w-full bg-slate-800 dark:bg-slate-200 rounded flex items-center justify-center text-[10px] text-white dark:text-black font-mono tracking-widest">
                      ||||||||||||||||||||
                    </div>
                  </div>

                  <div className="space-y-1.5 py-3 text-[10px] text-muted-foreground">
                    <div className="flex justify-between">
                      <span className="font-semibold text-foreground">SHIP TO RECIPIENT</span>
                      <span>TRACKED</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded" />
                    <div className="h-2 w-4/5 bg-muted rounded" />
                  </div>

                  <div className="border-t border-border/60 pt-2 flex items-center justify-between text-[10px]">
                    <span className="font-bold text-primary uppercase truncate">{activePresetInfo.name}</span>
                    <span className="font-mono text-muted-foreground shrink-0">4×6 in</span>
                  </div>
                </div>

                {downloadUrl && (
                  <div className="space-y-3 pt-2">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>Ready to print on Rollo, Zebra, Munbyn &amp; DYMO 4XL!</span>
                    </div>

                    <Button
                      onClick={handleDownload}
                      className="w-full h-11 text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download 4×6 Thermal PDF
                    </Button>
                    <SmartlinkButton className="w-full text-xs" />
                    <ResultScreenAd
                      refreshKey={downloadUrl}
                      originalSize={uploadedFile.size}
                      processedSize={processedSize}
                      formatLabel="PDF"
                      dpiLabel="4×6 Thermal"
                      fileName={outputFileName}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
