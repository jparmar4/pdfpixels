'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import {
  CheckCircle2,
  Cpu,
  Download,
  FilePlus2,
  FolderOpen,
  FolderOutput,
  Loader2,
  Play,
  RotateCcw,
  Square,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { NativeAd, ResultScreenAd } from '@/components/ads/ad-banner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { triggerDownloadWithSmartlink } from '@/lib/ads-config';
import {
  processBatchItemBuffer,
  type BatchConvertTarget,
  type BatchJobOptions,
  type BatchOperation,
  type BatchProcessInput,
  type BatchProcessOutput,
} from '@/lib/local-batch-processor';
import { PrivateModeBadge } from './private-mode-badge';
import { ToolLimitNotice } from './tool-limit-notice';
import { ToolPageHeader } from './tool-page-header';

const MAX_BATCH_FILES = 500;
const SUPPORTED_EXT_RE = /\.(pdf|jpe?g|png|webp|avif|bmp|gif)$/i;

interface StagedBatchItem {
  id: string;
  file: File;
  status: 'pending' | 'working' | 'done' | 'error';
  outName?: string;
  processedSize?: number;
  note?: string;
  error?: string;
}

interface FsWritableStream {
  write(data: ArrayBuffer | Blob | Uint8Array): Promise<void>;
  close(): Promise<void>;
}

interface FsFileHandle {
  kind: 'file';
  name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<FsWritableStream>;
}

interface FsDirHandle {
  kind: 'directory';
  name: string;
  values(): AsyncIterable<FsFileHandle | FsDirHandle>;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FsDirHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FsFileHandle>;
}

declare global {
  interface Window {
    showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FsDirHandle>;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function LocalFolderBatchWorkspace() {
  const folderInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const cancelFlagRef = useRef(false);
  const pendingZipUrlRef = useRef<string | null>(null);

  const [dirHandle, setDirHandle] = useState<FsDirHandle | null>(null);
  const [folderLabel, setFolderLabel] = useState<string>('');
  const [items, setItems] = useState<StagedBatchItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [workerMode, setWorkerMode] = useState<'worker' | 'main-thread'>('worker');
  const [elapsedMs, setElapsedMs] = useState(0);

  const [operation, setOperation] = useState<BatchOperation>('compress');
  const [quality, setQuality] = useState(80);
  const [convertTarget, setConvertTarget] = useState<BatchConvertTarget>('webp');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL — PDFPIXELS');
  const [batesPrefix, setBatesPrefix] = useState('BATCH-');
  const [batesStartIndex, setBatesStartIndex] = useState(1);

  const [zipDownloadUrl, setZipDownloadUrl] = useState<string | null>(null);
  const [writtenFolderCount, setWrittenFolderCount] = useState(0);

  const revokeZip = useCallback(() => {
    if (pendingZipUrlRef.current?.startsWith('blob:')) {
      URL.revokeObjectURL(pendingZipUrlRef.current);
      pendingZipUrlRef.current = null;
    }
    setZipDownloadUrl(null);
  }, []);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      revokeZip();
    };
  }, [revokeZip]);

  const queueFiles = useCallback(
    (fileList: File[], label: string, handle: FsDirHandle | null) => {
      revokeZip();
      setWrittenFolderCount(0);
      setElapsedMs(0);
      const valid = fileList
        .filter((f) => f.size > 0 && SUPPORTED_EXT_RE.test(f.name))
        .slice(0, MAX_BATCH_FILES);

      if (valid.length === 0) {
        toast.error('No supported PDF or image files found in the selected folder.');
        return;
      }

      setDirHandle(handle);
      setFolderLabel(label);
      setItems(
        valid.map((file, idx) => ({
          id: `${idx}-${file.name}`,
          file,
          status: 'pending',
        })),
      );
      toast.success(`Loaded ${valid.length} file(s) from "${label}"`);
    },
    [revokeZip],
  );

  const handleOpenDirectoryPicker = async () => {
    if (typeof window.showDirectoryPicker === 'function') {
      try {
        const rootDir = await window.showDirectoryPicker({ mode: 'readwrite' });
        const collected: File[] = [];
        const walk = async (dir: FsDirHandle) => {
          for await (const entry of dir.values()) {
            if (collected.length >= MAX_BATCH_FILES) break;
            if (entry.kind === 'directory') {
              if (entry.name !== 'optimized_pdfpixels') {
                await walk(entry);
              }
            } else if (entry.kind === 'file' && SUPPORTED_EXT_RE.test(entry.name)) {
              collected.push(await entry.getFile());
            }
          }
        };
        await walk(rootDir);
        queueFiles(collected, rootDir.name, rootDir);
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        toast.info('Folder write permission unavailable — falling back to directory picker upload.');
      }
    }
    folderInputRef.current?.click();
  };

  const handleFallbackInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (picked.length === 0) return;
    const firstRel = (picked[0] as File & { webkitRelativePath?: string }).webkitRelativePath || '';
    const folder = firstRel.includes('/') ? firstRel.split('/')[0] : 'Local Folder';
    queueFiles(picked, folder, null);
  };

  const handleLoadSampleFolder = async () => {
    try {
      const sampleFiles: File[] = [];
      for (let i = 1; i <= 2; i += 1) {
        const doc = await PDFDocument.create();
        const font = await doc.embedFont(StandardFonts.Helvetica);
        const pg = doc.addPage([612, 792]);
        pg.drawText(`PdfPixels Sample Batch PDF #${i}`, { x: 48, y: 710, font, size: 15 });
        pg.drawText('Zero server upload — processed inside browser WebWorker.', { x: 48, y: 670, font, size: 11 });
        const u8 = await doc.save();
        const cp = new Uint8Array(u8.byteLength);
        cp.set(u8);
        sampleFiles.push(new File([cp.buffer], `invoice-batch-${i}.pdf`, { type: 'application/pdf' }));
      }
      for (let i = 1; i <= 2; i += 1) {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = i === 1 ? '#1e3a8a' : '#0f766e';
          ctx.fillRect(0, 0, 640, 480);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 28px sans-serif';
          ctx.fillText(`SAMPLE PHOTO ${i}`, 180, 250);
        }
        const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), 'image/png'));
        sampleFiles.push(new File([blob], `product-shot-${i}.png`, { type: 'image/png' }));
      }
      queueFiles(sampleFiles, 'sample_local_folder', null);
    } catch {
      toast.error('Failed to build sample folder');
    }
  };

  const ensureWorker = useCallback((): Worker | null => {
    if (workerRef.current) return workerRef.current;
    if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') {
      setWorkerMode('main-thread');
      return null;
    }
    try {
      const worker = new Worker(new URL('../../workers/local-batch.worker.ts', import.meta.url));
      workerRef.current = worker;
      setWorkerMode('worker');
      return worker;
    } catch {
      setWorkerMode('main-thread');
      return null;
    }
  }, []);

  const runItem = useCallback(
    (payload: BatchProcessInput, worker: Worker | null): Promise<BatchProcessOutput> => {
      if (!worker) {
        return processBatchItemBuffer(payload);
      }
      return new Promise((resolve) => {
        const onMsg = (ev: MessageEvent<BatchProcessOutput>) => {
          if (ev.data?.id !== payload.id) return;
          worker.removeEventListener('message', onMsg);
          worker.removeEventListener('error', onErr);
          resolve(ev.data);
        };
        const onErr = async () => {
          worker.removeEventListener('message', onMsg);
          worker.removeEventListener('error', onErr);
          resolve(await processBatchItemBuffer(payload));
        };
        worker.addEventListener('message', onMsg);
        worker.addEventListener('error', onErr);
        worker.postMessage(payload, [payload.bytes]);
      });
    },
    [],
  );

  const handleRunBatch = async () => {
    if (items.length === 0 || isRunning) return;
    setIsRunning(true);
    cancelFlagRef.current = false;
    revokeZip();
    setWrittenFolderCount(0);
    const startTs = performance.now();

    const worker = ensureWorker();
    let outDirHandle: FsDirHandle | null = null;
    const zipArchive = new JSZip();
    const outSubfolder = zipArchive.folder('optimized_pdfpixels');

    if (dirHandle) {
      try {
        outDirHandle = await dirHandle.getDirectoryHandle('optimized_pdfpixels', { create: true });
      } catch {
        outDirHandle = null;
      }
    }

    const opts: BatchJobOptions = {
      operation,
      quality: quality / 100,
      convertTarget,
      watermarkText,
      batesPrefix,
      batesStartIndex,
    };

    let directWrites = 0;

    for (let i = 0; i < items.length; i += 1) {
      if (cancelFlagRef.current) break;
      const current = items[i];
      setItems((prev) =>
        prev.map((row, idx) => (idx === i ? { ...row, status: 'working', note: 'Processing...' } : row)),
      );

      const rawBytes = await current.file.arrayBuffer();
      const output = await runItem(
        {
          id: current.id,
          name: current.file.name,
          mimeType: current.file.type,
          bytes: rawBytes,
          fileIndex: i,
          options: opts,
        },
        worker,
      );

      if (output.ok && output.bytes) {
        if (outDirHandle) {
          try {
            const targetFile = await outDirHandle.getFileHandle(output.outName, { create: true });
            const writable = await targetFile.createWritable();
            await writable.write(output.bytes);
            await writable.close();
            directWrites += 1;
          } catch {
            outSubfolder?.file(output.outName, output.bytes);
          }
        } else {
          outSubfolder?.file(output.outName, output.bytes);
        }
      }

      setItems((prev) =>
        prev.map((row, idx) =>
          idx === i
            ? {
                ...row,
                status: output.ok ? 'done' : 'error',
                outName: output.outName,
                processedSize: output.processedSize,
                note: output.note,
                error: output.error,
              }
            : row,
        ),
      );
      setElapsedMs(Math.round(performance.now() - startTs));
    }

    setWrittenFolderCount(directWrites);

    if (!outDirHandle || directWrites < items.filter((r) => r.status !== 'error').length) {
      const hasZipEntries = Object.keys(zipArchive.files).some((k) => !k.endsWith('/'));
      if (hasZipEntries) {
        const zipBlob = await zipArchive.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        pendingZipUrlRef.current = url;
        setZipDownloadUrl(url);
      }
    }

    setIsRunning(false);
    if (directWrites > 0) {
      toast.success(`Wrote ${directWrites} optimized file(s) directly to "${folderLabel}/optimized_pdfpixels/"!`);
    } else {
      toast.success('Batch completed inside WebWorker! Download optimized_pdfpixels.zip below.');
    }
  };

  const metrics = useMemo(() => {
    const done = items.filter((i) => i.status === 'done');
    const orig = done.reduce((s, i) => s + i.file.size, 0);
    const proc = done.reduce((s, i) => s + (i.processedSize ?? i.file.size), 0);
    const pct = orig > 0 ? Math.max(0, Math.round(((orig - proc) / orig) * 100)) : 0;
    return {
      total: items.length,
      completed: done.length,
      errors: items.filter((i) => i.status === 'error').length,
      orig,
      proc,
      pct,
    };
  }, [items]);

  const handleDownloadZip = () => {
    if (!zipDownloadUrl) return;
    triggerDownloadWithSmartlink(
      () => {
        const a = document.createElement('a');
        a.href = zipDownloadUrl;
        a.download = 'optimized_pdfpixels.zip';
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Downloaded optimized_pdfpixels.zip');
      },
      {
        originalSize: metrics.orig,
        processedSize: metrics.proc,
        savedPercent: metrics.pct,
        formatLabel: 'ZIP Folder',
        fileName: 'optimized_pdfpixels.zip',
      },
    );
  };

  const handleReset = () => {
    cancelFlagRef.current = true;
    revokeZip();
    setDirHandle(null);
    setFolderLabel('');
    setItems([]);
    setWrittenFolderCount(0);
    setElapsedMs(0);
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl space-y-6">
      <ToolPageHeader
        title="Local Folder Batch Studio (Up to 500 Files)"
        description="Select a local folder via the HTML5 File System Access API (or folder picker fallback), process up to 500 PDFs & images in a dedicated WebWorker thread, and save directly into an optimized_pdfpixels/ subfolder on your drive."
        icon={<FolderOutput className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />

      <PrivateModeBadge description="100% Air-Gapped Local Folder Execution: All batch compression, format conversion, watermarking, and Bates numbering run locally inside a browser WebWorker with zero server upload." />

      <ToolLimitNotice
        limits={[
          `Up to ${MAX_BATCH_FILES} local PDFs/images per folder pass`,
          'Writes directly to optimized_pdfpixels/ via File System Access API (ZIP fallback in Firefox/Safari)',
          'WebWorker background thread keeps UI responsive during large batches',
        ]}
      />

      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is supported by Chromium/Firefox/Safari directory pickers
        webkitdirectory=""
        multiple
        className="hidden"
        onChange={handleFallbackInputChange}
      />

      {/* ── Folder Picker & Batch Operation Studio Controls ── */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-card border rounded-[1.75rem] p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-foreground">1. Select Local Folder</h2>
              <p className="text-xs text-muted-foreground">Scans PDFs &amp; images up to 500 files without uploading a single byte.</p>
            </div>
            <Badge variant="outline" className="text-[11px] font-mono">
              <Cpu className="w-3 h-3 mr-1 text-primary" />
              {workerMode === 'worker' ? 'WebWorker Active' : 'Browser Thread'}
            </Badge>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-border/70 bg-background/60 p-6 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {folderLabel ? `Selected Folder: ${folderLabel}` : 'Choose a local folder on your drive'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {dirHandle
                  ? 'Direct Drive Write Permission Active → writes to optimized_pdfpixels/'
                  : 'Automatic optimized_pdfpixels.zip export ready for all browsers'}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2.5 pt-1">
              <Button type="button" onClick={handleOpenDirectoryPicker} disabled={isRunning} className="btn-premium rounded-xl gap-2">
                <FolderOpen className="w-4 h-4" />
                Pick Local Folder
              </Button>
              <Button type="button" variant="outline" onClick={handleLoadSampleFolder} disabled={isRunning} className="rounded-xl gap-1.5">
                <FilePlus2 className="w-4 h-4" />
                Try Sample Folder (4 Files)
              </Button>
            </div>
          </div>

          {/* Zero-CLS Adsterra Native Slot #1 inside Studio */}
          <NativeAd className="my-2" />
        </div>

        <div className="bg-card border rounded-[1.75rem] p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-foreground">2. Choose Batch Pipeline</h2>
              <p className="text-xs text-muted-foreground">Applied across all queued PDFs &amp; images inside WebWorker.</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'compress', label: 'Compress Batch' },
                  { id: 'convert', label: 'Convert Images' },
                  { id: 'watermark', label: 'Watermark All' },
                  { id: 'bates', label: 'Bates Stamp PDFs' },
                ] as const
              ).map((op) => (
                <button
                  key={op.id}
                  type="button"
                  disabled={isRunning}
                  onClick={() => setOperation(op.id)}
                  className={`rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition-all ${
                    operation === op.id
                      ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                      : 'border-border/60 bg-background/70 text-foreground hover:border-primary/40'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>

            {operation === 'compress' && (
              <div className="space-y-1.5">
                <Label htmlFor="batch-quality" className="text-xs">Target Quality ({quality}%)</Label>
                <Input
                  id="batch-quality"
                  type="range"
                  min={40}
                  max={95}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                />
              </div>
            )}

            {operation === 'convert' && (
              <div className="space-y-1.5">
                <Label htmlFor="batch-convert-target" className="text-xs">Target Output Format</Label>
                <select
                  id="batch-convert-target"
                  value={convertTarget}
                  onChange={(e) => setConvertTarget(e.target.value as BatchConvertTarget)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
                >
                  <option value="webp">WebP (Smallest Web Assets)</option>
                  <option value="jpg">JPEG (Universal Photo)</option>
                  <option value="png">PNG (Lossless Transparency)</option>
                  <option value="pdf">PDF (Document Bundle)</option>
                </select>
              </div>
            )}

            {operation === 'watermark' && (
              <div className="space-y-1.5">
                <Label htmlFor="batch-wm-text" className="text-xs">Watermark Stamp Text</Label>
                <Input
                  id="batch-wm-text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            )}

            {operation === 'bates' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="batch-bates-prefix" className="text-xs">Bates Prefix</Label>
                  <Input id="batch-bates-prefix" value={batesPrefix} onChange={(e) => setBatesPrefix(e.target.value)} className="h-9 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="batch-bates-start" className="text-xs">Start Index</Label>
                  <Input
                    id="batch-bates-start"
                    type="number"
                    min={1}
                    value={batesStartIndex}
                    onChange={(e) => setBatesStartIndex(Math.max(1, Number.parseInt(e.target.value || '1', 10)))}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-3 border-t border-border/50">
            {!isRunning ? (
              <Button
                type="button"
                size="lg"
                disabled={items.length === 0}
                onClick={handleRunBatch}
                className="w-full btn-premium rounded-2xl gap-2"
              >
                <Play className="w-4 h-4" />
                Process {items.length} Local File(s) → optimized_pdfpixels/
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                variant="destructive"
                onClick={() => {
                  cancelFlagRef.current = true;
                }}
                className="w-full rounded-2xl gap-2"
              >
                <Square className="w-4 h-4" />
                Stop After Current File
              </Button>
            )}
            <Button type="button" size="sm" variant="ghost" onClick={handleReset} disabled={isRunning} className="w-full text-xs">
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Clear Queue
            </Button>
          </div>
        </div>
      </div>

      {/* ── Live Progress Dashboard ── */}
      {items.length > 0 && (
        <div className="bg-card border rounded-[1.75rem] p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-foreground">Live Batch Progress Dashboard</h3>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">{metrics.completed} / {metrics.total} Done</Badge>
              <Badge variant="outline">Saved {metrics.pct}% ({formatBytes(Math.max(0, metrics.orig - metrics.proc))})</Badge>
              {elapsedMs > 0 && <Badge variant="secondary">{elapsedMs} ms</Badge>}
            </div>
          </div>

          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-200"
              style={{ width: `${metrics.total > 0 ? Math.round(((metrics.completed + metrics.errors) / metrics.total) * 100) : 0}%` }}
            />
          </div>

          {(writtenFolderCount > 0 || zipDownloadUrl) && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/35 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                {writtenFolderCount > 0
                  ? `✓ Wrote ${writtenFolderCount} processed files into "${folderLabel}/optimized_pdfpixels/"`
                  : `✓ Ready to save ${metrics.completed} processed file(s) inside optimized_pdfpixels/`}
              </p>
              {zipDownloadUrl && (
                <Button size="sm" onClick={handleDownloadZip} className="btn-premium gap-1.5 rounded-xl">
                  <Download className="w-4 h-4" />
                  Download optimized_pdfpixels.zip
                </Button>
              )}
            </div>
          )}

          <div className="max-h-72 overflow-y-auto border rounded-xl divide-y text-xs">
            {items.map((item) => (
              <div key={item.id} className="px-3.5 py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{item.outName || item.file.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatBytes(item.file.size)}
                    {item.processedSize ? ` → ${formatBytes(item.processedSize)}` : ''}
                    {item.note ? ` · ${item.note}` : ''}
                  </p>
                </div>
                <span className="shrink-0">
                  {item.status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  {item.status === 'working' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  {item.status === 'error' && <XCircle className="w-4 h-4 text-rose-500" />}
                  {item.status === 'pending' && <span className="text-[10px] text-muted-foreground uppercase">Queued</span>}
                </span>
              </div>
            ))}
          </div>

          {(writtenFolderCount > 0 || zipDownloadUrl) && (
            <ResultScreenAd
              refreshKey={zipDownloadUrl || `dir-${writtenFolderCount}`}
              originalSize={metrics.orig}
              processedSize={metrics.proc}
              savedPercent={metrics.pct}
              formatLabel="BATCH"
              fileName="optimized_pdfpixels.zip"
            />
          )}
        </div>
      )}
    </div>
  );
}
