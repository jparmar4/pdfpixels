'use client';

import { useCallback, useEffect, useState } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { CheckCircle2, Download, Grid3X3, Package, Printer, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ResultScreenAd, SmartlinkButton } from '@/components/ads/ad-banner';
import { triggerDownloadWithSmartlink } from '@/lib/ads-config';
import { useAppStore } from '@/store/app-store';
import { useConsumeChainedFile } from '@/hooks/use-consume-chained-file';
import { FileUpload } from './file-upload';
import { PrivateModeBadge } from './private-mode-badge';
import { ToolLimitNotice } from './tool-limit-notice';
import { ToolPageHeader } from './tool-page-header';
import { toast } from 'sonner';

type FbaMode = 'fnsku-30up' | 'box-split' | 'custom-grid';

interface ThermalStickerSpec {
  id: string;
  label: string;
  widthPt: number;
  heightPt: number;
}

// 72 points = 1 inch
const FNSKU_ROLL_PRESETS: ThermalStickerSpec[] = [
  { id: 'dymo-30334', label: 'DYMO 30334 (2.25" × 1.25" · 57×32mm)', widthPt: 162, heightPt: 90 },
  { id: 'dymo-30252', label: 'DYMO 30252 Address (3.5" × 1.125")', widthPt: 252, heightPt: 81 },
  { id: 'rollo-2x1', label: 'Rollo / Zebra FNSKU (2" × 1")', widthPt: 144, heightPt: 72 },
  { id: 'rollo-3x1', label: 'Rollo / Munbyn Barcode (3" × 1")', widthPt: 216, heightPt: 72 },
  { id: 'thermal-4x6', label: 'Standard 4" × 6" Thermal (288×432 pt)', widthPt: 288, heightPt: 432 },
];

export function AmazonFbaLabelWorkspace() {
  const { uploadedFile, setUploadedFile, isProcessing, setIsProcessing, setProgress, reset } = useAppStore();

  const [mode, setMode] = useState<FbaMode>('fnsku-30up');
  const [stickerSpec, setStickerSpec] = useState<string>('dymo-30334');
  const [gridCols, setGridCols] = useState<number>(3);
  const [gridRows, setGridRows] = useState<number>(10);
  const [skipEmptySlots, setSkipEmptySlots] = useState<boolean>(true);
  const [rotation, setRotation] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [outputCount, setOutputCount] = useState<number>(0);
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
        const buf = await uploadedFile.arrayBuffer();
        const pdf = await PDFDocument.load(buf, { ignoreEncryption: true });
        if (active) setTotalPages(pdf.getPageCount());
      } catch {
        if (active) setTotalPages(1);
      }
    })();

    return () => {
      active = false;
    };
  }, [uploadedFile]);

  const handleConvertFbaLabels = async () => {
    if (!uploadedFile) {
      toast.error('Please upload your Seller Central PDF first.');
      return;
    }

    setIsProcessing(true);
    setProgress(15);

    try {
      const buf = await uploadedFile.arrayBuffer();
      const srcPdf = await PDFDocument.load(buf, { ignoreEncryption: true });
      const pagesCount = srcPdf.getPageCount();
      const outPdf = await PDFDocument.create();

      // Detect populated FNSKU grid cells when skipEmptySlots is toggled ON via pdfjs text items
      const populatedCellsByPage = new Map<number, Set<string>>();
      if ((mode === 'fnsku-30up' || mode === 'custom-grid') && skipEmptySlots) {
        try {
          const pdfjs = await import('pdfjs-dist');
          pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
          const jsDoc = await pdfjs.getDocument({
            data: new Uint8Array(buf),
            cMapUrl: '/pdfjs/cmaps/',
            cMapPacked: true,
            standardFontDataUrl: '/pdfjs/standard_fonts/',
          }).promise;

          const cols = mode === 'fnsku-30up' ? 3 : Math.max(1, gridCols);
          const rows = mode === 'fnsku-30up' ? 10 : Math.max(1, gridRows);

          for (let p = 1; p <= jsDoc.numPages; p += 1) {
            const pObj = await jsDoc.getPage(p);
            const vp = pObj.getViewport({ scale: 1 });
            const tc = await pObj.getTextContent();
            const set = new Set<string>();
            for (const rawItem of tc.items) {
              if (!('str' in rawItem) || !rawItem.str?.trim()) continue;
              const item = rawItem as { transform: number[] };
              const tx = item.transform?.[4] ?? 0;
              const tyFromBottom = item.transform?.[5] ?? 0;
              const c = Math.min(cols - 1, Math.max(0, Math.floor((tx / vp.width) * cols)));
              // Row 0 is top of sheet
              const r = Math.min(rows - 1, Math.max(0, Math.floor(((vp.height - tyFromBottom) / vp.height) * rows)));
              set.add(`${r}-${c}`);
            }
            if (set.size > 0) populatedCellsByPage.set(p - 1, set);
          }
          void jsDoc.destroy();
        } catch {
          // If pdfjs cannot inspect text layer, slice every cell cleanly
        }
      }

      const spec = FNSKU_ROLL_PRESETS.find((s) => s.id === stickerSpec) ?? FNSKU_ROLL_PRESETS[0];
      let labelsWritten = 0;

      for (let i = 0; i < pagesCount; i += 1) {
        const srcPage = srcPdf.getPage(i);
        const { width: pageW, height: pageH } = srcPage.getCropBox();
        const [embedded] = await outPdf.embedPdf(srcPdf, [i]);

        if (mode === 'box-split') {
          // Amazon FBA 8.5x11" / A4 dual box sheet: landscape side-by-side or portrait stacked 2-up
          const boxes =
            pageW > pageH
              ? [
                  { x: 0, y: 0, w: pageW * 0.5, h: pageH },
                  { x: pageW * 0.5, y: 0, w: pageW * 0.5, h: pageH },
                ]
              : [
                  { x: 0, y: pageH * 0.5, w: pageW, h: pageH * 0.5 },
                  { x: 0, y: 0, w: pageW, h: pageH * 0.5 },
                ];

          const targetW = 288;
          const targetH = 432;
          for (const crop of boxes) {
            const p = outPdf.addPage([targetW, targetH]);
            const scale = Math.min(targetW / crop.w, targetH / crop.h);
            p.drawPage(embedded, {
              x: -crop.x * scale + (targetW - crop.w * scale) / 2,
              y: -crop.y * scale + (targetH - crop.h * scale) / 2,
              xScale: scale,
              yScale: scale,
            });
            if (rotation !== 0) p.setRotation(degrees(rotation));
            labelsWritten += 1;
          }
        } else {
          const cols = mode === 'fnsku-30up' ? 3 : Math.max(1, gridCols);
          const rows = mode === 'fnsku-30up' ? 10 : Math.max(1, gridRows);
          // Standard Avery 5160 30-up outer margins in points (~0.19" X, ~0.5" top/bottom on 612x792)
          const marginX = mode === 'fnsku-30up' && pageW <= 630 ? 14 : 0;
          const marginY = mode === 'fnsku-30up' && pageH <= 810 ? 36 : 0;
          const usableW = Math.max(50, pageW - marginX * 2);
          const usableH = Math.max(50, pageH - marginY * 2);
          const cellW = usableW / cols;
          const cellH = usableH / rows;
          const popSet = populatedCellsByPage.get(i);

          for (let r = 0; r < rows; r += 1) {
            for (let c = 0; c < cols; c += 1) {
              if (popSet && !popSet.has(`${r}-${c}`)) continue;
              const cropX = marginX + c * cellW;
              // Top row (r = 0) corresponds to top Y coordinate
              const cropY = marginY + (rows - 1 - r) * cellH;

              const outPage = outPdf.addPage([spec.widthPt, spec.heightPt]);
              const scale = Math.min((spec.widthPt - 4) / cellW, (spec.heightPt - 4) / cellH);
              outPage.drawPage(embedded, {
                x: -cropX * scale + (spec.widthPt - cellW * scale) / 2,
                y: -cropY * scale + (spec.heightPt - cellH * scale) / 2,
                xScale: scale,
                yScale: scale,
              });
              if (rotation !== 0) outPage.setRotation(degrees(rotation));
              labelsWritten += 1;
            }
          }
        }
        setProgress(Math.round(((i + 1) / pagesCount) * 90));
      }

      if (labelsWritten === 0) {
        throw new Error('No barcode cells detected — try unchecking "Skip Empty Grid Slots" or verify sheet grid.');
      }

      const outBytes = await outPdf.save();
      const copy = new Uint8Array(outBytes.byteLength);
      copy.set(outBytes);
      const blob = new Blob([copy.buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const base = uploadedFile.name.replace(/\.pdf$/i, '') || 'amazon-fba';
      const outName = `${base}-${mode === 'box-split' ? '4x6-box' : 'thermal-fnsku'}.pdf`;

      setDownloadUrl((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return url;
      });
      setProcessedSize(blob.size);
      setOutputCount(labelsWritten);
      setOutputFileName(outName);
      setProgress(100);
      toast.success(`Converted into ${labelsWritten} vector thermal label(s) locally (Zero Upload)!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to convert Amazon FBA labels');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    triggerDownloadWithSmartlink(
      () => {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = outputFileName || 'fba-thermal-labels.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Downloaded thermal FBA labels!');
      },
      {
        originalSize: uploadedFile?.size,
        processedSize,
        formatLabel: 'PDF',
        dpiLabel: mode === 'box-split' ? '4×6 Box Thermal' : 'Vector FNSKU Thermal',
        fileName: outputFileName,
      },
    );
  };

  const handleReset = useCallback(() => {
    if (downloadUrl?.startsWith('blob:')) URL.revokeObjectURL(downloadUrl);
    reset();
    setDownloadUrl(null);
    setProcessedSize(0);
    setOutputCount(0);
  }, [downloadUrl, reset]);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
      <ToolPageHeader
        title="Amazon FBA FNSKU & Box Label Thermal Converter"
        description="Split Seller Central 30-up Avery 5160 FNSKU sheets and 8.5×11&quot; box shipment PDFs into crisp individual Dymo, Rollo, Munbyn, and Zebra thermal labels — 100% browser-native."
        icon={<Package className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'Amazon FBA 30-up (3×10) FNSKU sheets + 8.5×11" Partner Carrier / Box Labels',
          'Supports DYMO 30334 / 30252, Rollo 2×1" / 3×1", and standard 4×6" thermal rolls',
          'Vector pdf-lib splitting keeps barcodes razor-sharp + skips blank trailing cells',
        ]}
      />
      <PrivateModeBadge
        className="mt-4"
        description="FNSKU item barcodes and FBA box shipment manifests are sliced 100% inside browser memory — zero server upload."
      />

      {!uploadedFile ? (
        <div className="mt-8">
          <FileUpload accept=".pdf,application/pdf" />
        </div>
      ) : (
        <div className="mt-8 grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-5 bg-card border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Grid3X3 className="w-4 h-4 text-primary" />
                Seller Central Split Mode
              </div>
              <Badge variant="outline" className="font-mono text-xs">{totalPages} Page(s)</Badge>
            </div>

            <div className="grid sm:grid-cols-3 gap-2.5">
              {(
                [
                  { id: 'fnsku-30up' as const, title: 'FNSKU 30-Up Sheet', desc: 'Avery 5160 (3×10) Letter' },
                  { id: 'box-split' as const, title: '8.5×11" FBA Box Split', desc: 'Carrier + Box ID → 4×6"' },
                  { id: 'custom-grid' as const, title: 'Custom Grid (EU/UK)', desc: '21-up, 24-up, 40-up A4' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    mode === item.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border/60 hover:border-border'
                  }`}
                >
                  <p className="font-bold text-xs text-foreground">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>

            {mode === 'custom-grid' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Columns Across</Label>
                  <Input type="number" min={1} max={8} value={gridCols} onChange={(e) => setGridCols(Number(e.target.value) || 3)} className="h-9 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Rows Down</Label>
                  <Input type="number" min={1} max={16} value={gridRows} onChange={(e) => setGridRows(Number(e.target.value) || 10)} className="h-9 text-xs" />
                </div>
              </div>
            )}

            {mode !== 'box-split' && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Thermal Barcode Roll Size</Label>
                  <Select value={stickerSpec} onValueChange={setStickerSpec}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FNSKU_ROLL_PRESETS.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-3.5">
                  <div>
                    <Label htmlFor="skip-empty-cells" className="font-bold text-xs cursor-pointer">
                      Auto-Skip Blank Trailing Sticker Cells
                    </Label>
                    <p className="text-[11px] text-muted-foreground">Detects empty cells so thermal roll labels are never wasted.</p>
                  </div>
                  <Switch id="skip-empty-cells" checked={skipEmptySlots} onCheckedChange={setSkipEmptySlots} />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Orientation Rotation</Label>
              <Select value={String(rotation)} onValueChange={(v) => setRotation(Number(v))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0° Upright</SelectItem>
                  <SelectItem value="90">90° Clockwise</SelectItem>
                  <SelectItem value="180">180° Inverted</SelectItem>
                  <SelectItem value="270">270° Counter-Clockwise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleConvertFbaLabels} disabled={isProcessing} className="flex-1 h-11 text-xs font-bold gap-2">
                <Printer className="w-4 h-4" />
                {isProcessing ? 'Splitting Barcode Vector Grid...' : 'Convert to Thermal Roll PDF'}
              </Button>
              <Button variant="outline" onClick={handleReset} className="h-11 px-3">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5">
            {downloadUrl ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-5 space-y-4">
                <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  {outputCount} Vector Barcode Labels Ready!
                </div>
                <Button onClick={handleDownload} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                  <Download className="w-4 h-4" />
                  Download {outputFileName}
                </Button>
                <SmartlinkButton className="w-full justify-center" />
                <ResultScreenAd
                  refreshKey={downloadUrl}
                  originalSize={uploadedFile.size}
                  processedSize={processedSize}
                  formatLabel="PDF"
                  dpiLabel="Vector Thermal"
                  fileName={outputFileName}
                />
              </div>
            ) : (
              <div className="rounded-2xl border bg-card p-6 space-y-3 text-xs text-muted-foreground">
                <p className="font-bold text-sm text-foreground">Amazon FBA Barcode Compliance Tips</p>
                <p>Use DYMO 30334 (2.25&quot;×1.25&quot;) or Rollo 2&quot;×1&quot; labels when prepping individual FNSKU units from Seller Central 30-up sheets.</p>
                <p>Switch to 8.5×11&quot; FBA Box Split to turn UPS/FedEx + Amazon Box ID paired sheets directly into 4&quot;×6&quot; thermal rolls.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
