'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import JSZip from 'jszip';
import {
  CheckCircle2,
  Download,
  FilePlus2,
  Loader2,
  Package,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { ResultScreenAd, SmartlinkButton } from '@/components/ads/ad-banner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { triggerDownloadWithSmartlink } from '@/lib/ads-config';
import { apiFetch } from '@/lib/api-client';
import { normalizeHeicFile } from '@/lib/heic-client';
import { FileUpload } from './file-upload';
import { ToolLimitNotice } from './tool-limit-notice';
import { ToolPageHeader } from './tool-page-header';
import { useActiveTool } from '@/hooks/use-active-tool';

interface MarketplaceSpec {
  id: string;
  marketplace: string;
  fileName: string;
  width: number;
  height: number;
  mime: 'image/jpeg' | 'image/webp';
  ruleNote: string;
}

const MARKETPLACE_SPECS: MarketplaceSpec[] = [
  { id: 'amazon', marketplace: 'Amazon Main Image', fileName: '01-amazon-2000x2000-white.jpg', width: 2000, height: 2000, mime: 'image/jpeg', ruleNote: '2000×2000 · #FFFFFF Pure White' },
  { id: 'shopify', marketplace: 'Shopify WebP Studio', fileName: '02-shopify-2048x2048.webp', width: 2048, height: 2048, mime: 'image/webp', ruleNote: '2048×2048 · Ultra-Fast WebP' },
  { id: 'etsy', marketplace: 'Etsy Hero Frame', fileName: '03-etsy-2700x2025.jpg', width: 2700, height: 2025, mime: 'image/jpeg', ruleNote: '2700×2025 · 4:3 Landscape' },
  { id: 'ebay', marketplace: 'eBay Catalog Square', fileName: '04-ebay-1600x1600.jpg', width: 1600, height: 1600, mime: 'image/jpeg', ruleNote: '1600×1600 · High-Zoom Square' },
  { id: 'poshmark', marketplace: 'Poshmark Social Feed', fileName: '05-poshmark-1080x1350.jpg', width: 1080, height: 1350, mime: 'image/jpeg', ruleNote: '1080×1350 · 4:5 Portrait' },
  { id: 'walmart', marketplace: 'Walmart Marketplace', fileName: '06-walmart-2200x2200-white.jpg', width: 2200, height: 2200, mime: 'image/jpeg', ruleNote: '2200×2200 · #FFFFFF Square' },
];

interface GeneratedAsset {
  spec: MarketplaceSpec;
  previewUrl: string;
  size: number;
  blob: Blob;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function isolateProductCutout(file: File): Promise<{ blob: Blob; engine: string }> {
  const normalized = await normalizeHeicFile(file);
  try {
    const controller = new AbortController();
    const tid = window.setTimeout(() => controller.abort(), 12_000);
    const fd = new FormData();
    fd.append('image', normalized);
    fd.append('tool', 'remove-background');
    fd.append('mode', 'balanced');
    const res = await apiFetch('/api/ai', { method: 'POST', body: fd, signal: controller.signal }).finally(() =>
      window.clearTimeout(tid),
    );
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.imageUrl) {
      const pngBlob = await (await fetch(data.imageUrl)).blob();
      return { blob: pngBlob, engine: 'ONNX AI Background Remover' };
    }
  } catch {
    // Graceful studio chroma keying fallback
  }

  const url = URL.createObjectURL(normalized);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not decode product image'));
      el.src = url;
    });
    const w = Math.min(2000, img.naturalWidth || 800);
    const h = Math.min(2000, img.naturalHeight || 800);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.drawImage(img, 0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    const r0 = d[0];
    const g0 = d[1];
    const b0 = d[2];
    for (let i = 0; i < d.length; i += 4) {
      if (Math.abs(d[i] - r0) + Math.abs(d[i + 1] - g0) + Math.abs(d[i + 2] - b0) < 42) {
        d[i + 3] = 0;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG export failed'))), 'image/png'),
    );
    return { blob, engine: 'Browser Studio Matte Keying' };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function EcommercePhotoPackWorkspace() {
  const { uploadedFile, isProcessing, setIsProcessing, setProgress, reset } = useActiveTool();
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [zipUrl, setZipUrl] = useState<string | null>(null);
  const [zipSize, setZipSize] = useState(0);
  const [engineUsed, setEngineUsed] = useState('');
  const zipUrlRef = useRef<string | null>(null);

  const revokeAll = useCallback((list: GeneratedAsset[]) => {
    if (zipUrlRef.current?.startsWith('blob:')) {
      URL.revokeObjectURL(zipUrlRef.current);
      zipUrlRef.current = null;
    }
    for (const item of list) {
      if (item.previewUrl.startsWith('blob:')) URL.revokeObjectURL(item.previewUrl);
    }
  }, []);

  useEffect(() => {
    if (uploadedFile) {
      setSourceFile(uploadedFile);
    }
  }, [uploadedFile]);

  useEffect(() => {
    return () => {
      revokeAll(assets);
    };
  }, [assets, revokeAll]);

  const activeFile = sourceFile || uploadedFile;

  const handleLoadSample = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, 0, 900, 900);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(240, 180, 420, 520, 48);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('STUDIO ITEM', 450, 450);
    }
    const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), 'image/png'));
    const f = new File([blob], 'sample-product-shot.png', { type: 'image/png' });
    revokeAll(assets);
    setAssets([]);
    setZipUrl(null);
    setSourceFile(f);
    toast.success('Loaded sample studio product image');
  };

  const handleGeneratePack = async () => {
    if (!activeFile) {
      toast.error('Upload a product photo first.');
      return;
    }
    setIsProcessing(true);
    setProgress(15);
    revokeAll(assets);
    setAssets([]);
    setZipUrl(null);

    try {
      const cutout = await isolateProductCutout(activeFile);
      setEngineUsed(cutout.engine);
      setProgress(45);

      const cutoutUrl = URL.createObjectURL(cutout.blob);
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Failed to load product cutout'));
        el.src = cutoutUrl;
      });

      const zip = new JSZip();
      const created: GeneratedAsset[] = [];

      try {
        for (let i = 0; i < MARKETPLACE_SPECS.length; i += 1) {
          const spec = MARKETPLACE_SPECS[i];
          const canvas = document.createElement('canvas');
          canvas.width = spec.width;
          canvas.height = spec.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas unavailable');

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, spec.width, spec.height);

          const scale = Math.min(
            (spec.width * 0.86) / Math.max(1, img.naturalWidth),
            (spec.height * 0.86) / Math.max(1, img.naturalHeight),
          );
          const dw = img.naturalWidth * scale;
          const dh = img.naturalHeight * scale;
          ctx.drawImage(img, (spec.width - dw) / 2, (spec.height - dh) / 2, dw, dh);

          const outBlob = await new Promise<Blob>((resolve, reject) =>
            canvas.toBlob(
              (b) => (b ? resolve(b) : reject(new Error(`Failed encoding ${spec.marketplace}`))),
              spec.mime,
              0.9,
            ),
          );
          zip.file(spec.fileName, outBlob);

          // Generate a lightweight 420px UI card preview so browsers don't decode six 4K bitmaps simultaneously
          const maxSide = 420;
          const pScale = Math.min(1, maxSide / Math.max(spec.width, spec.height));
          const pCanvas = document.createElement('canvas');
          pCanvas.width = Math.max(1, Math.round(spec.width * pScale));
          pCanvas.height = Math.max(1, Math.round(spec.height * pScale));
          const pCtx = pCanvas.getContext('2d');
          if (pCtx) {
            pCtx.drawImage(canvas, 0, 0, pCanvas.width, pCanvas.height);
          }
          const previewUrl = pCanvas.toDataURL('image/jpeg', 0.85);
          pCanvas.width = 0;
          pCanvas.height = 0;
          canvas.width = 0;
          canvas.height = 0;

          created.push({
            spec,
            previewUrl,
            size: outBlob.size,
            blob: outBlob,
          });
          setProgress(50 + Math.round(((i + 1) / MARKETPLACE_SPECS.length) * 40));
        }
      } finally {
        URL.revokeObjectURL(cutoutUrl);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const createdZipUrl = URL.createObjectURL(zipBlob);
      zipUrlRef.current = createdZipUrl;
      setZipUrl(createdZipUrl);
      setZipSize(zipBlob.size);
      setAssets(created);
      setProgress(100);
      toast.success('Generated all 6 marketplace product assets in ZIP!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed generating 6-marketplace pack');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadZip = () => {
    if (!zipUrl) return;
    triggerDownloadWithSmartlink(
      () => {
        const a = document.createElement('a');
        a.href = zipUrl;
        a.download = 'ecommerce-6-marketplace-pack.zip';
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Downloaded ecommerce-6-marketplace-pack.zip');
      },
      {
        originalSize: activeFile?.size,
        processedSize: zipSize,
        formatLabel: '6-Pack ZIP',
        fileName: 'ecommerce-6-marketplace-pack.zip',
      },
    );
  };

  const handleReset = () => {
    revokeAll(assets);
    setAssets([]);
    setZipUrl(null);
    setZipSize(0);
    setSourceFile(null);
    reset();
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl space-y-6">
      <ToolPageHeader
        title="E-Commerce 6-Marketplace Product Photo Pack"
        description="Chain AI/ONNX background removal into a 1-click ZIP generator formatted for Amazon (2000×2000 #FFFFFF), Shopify (2048×2048 WebP), Etsy (2700×2025), eBay (1600×1600), Poshmark (1080×1350), and Walmart (2200×2200)."
        icon={<Package className="h-7 w-7 text-white" />}
        isAI
        onReset={handleReset}
      />

      <ToolLimitNotice
        limits={[
          'JPG, PNG, WebP, or HEIC up to 20 MB',
          'Pure #FFFFFF Amazon & Walmart compliance backdrop',
          'Generates 6 exact marketplace sizes inside 1 ZIP archive',
        ]}
      />

      {!activeFile ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={handleLoadSample} className="gap-1.5 text-xs">
              <FilePlus2 className="w-3.5 h-3.5" />
              Try Sample Product Photo
            </Button>
          </div>
          <FileUpload accept="image/*,.heic,.heif" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-card border rounded-[1.75rem] p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-base text-foreground">{activeFile.name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatBytes(activeFile.size)}
                {engineUsed ? ` · Cutout Engine: ${engineUsed}` : ' · Ready to remove background & export 6 marketplace sizes'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Button
                type="button"
                disabled={isProcessing}
                onClick={handleGeneratePack}
                className="btn-premium rounded-xl gap-2"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isProcessing ? 'Generating 6 Marketplace Cuts...' : 'Generate 6-Marketplace Pack (.ZIP)'}
              </Button>
              {zipUrl && (
                <Button type="button" onClick={handleDownloadZip} className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Download className="w-4 h-4" />
                  Download 6-Pack ZIP ({formatBytes(zipSize)})
                </Button>
              )}
              <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="text-xs">
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
              </Button>
            </div>
          </div>

          {assets.length > 0 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {assets.map((asset) => (
                  <div key={asset.spec.id} className="bg-card border rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-foreground">{asset.spec.marketplace}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {formatBytes(asset.size)}
                      </Badge>
                    </div>
                    <div className="aspect-square max-h-44 w-full rounded-xl border bg-white flex items-center justify-center overflow-hidden p-2">
                      <img src={asset.previewUrl} alt={asset.spec.marketplace} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-muted-foreground">{asset.spec.ruleNote}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const u = URL.createObjectURL(asset.blob);
                          const a = document.createElement('a');
                          a.href = u;
                          a.download = asset.spec.fileName;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          window.setTimeout(() => URL.revokeObjectURL(u), 1500);
                        }}
                        className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Save
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <SmartlinkButton />
              </div>

              <ResultScreenAd
                refreshKey={zipUrl || activeFile.name}
                originalSize={activeFile.size}
                processedSize={zipSize}
                formatLabel="6-Marketplace ZIP"
                fileName="ecommerce-6-marketplace-pack.zip"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
