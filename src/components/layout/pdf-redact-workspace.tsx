'use client';

import { motion } from 'framer-motion';
import {
  Download, RotateCcw, EyeOff, Trash2, ArrowLeft, ArrowRight, Check, Plus, Shield,
  Sparkles, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useActiveTool } from '@/hooks/use-active-tool';
import { useConsumeChainedFile } from '@/hooks/use-consume-chained-file';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { PrivateModeBadge } from './private-mode-badge';
import { ResultScreenAd, SmartlinkButton } from '@/components/ads/ad-banner';
import { triggerDownloadWithSmartlink } from '@/lib/ads-config';
import { redactPdfCanvasClient, scanPdfPiiClient } from '@/lib/client-pdf-redact';
import type { PiiCategory, PiiSummary } from '@/lib/pii-patterns';
import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { PdfPagePreview } from './pdf-page-preview';

interface RedactionItem {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const TIER1_SCAN_ACTIONS: Array<{ id: PiiCategory; label: string }> = [
  { id: 'ssn', label: 'US SSN' },
  { id: 'ein', label: 'EIN' },
  { id: 'card', label: 'Credit Card' },
  { id: 'phone', label: 'Phone' },
  { id: 'email', label: 'Email' },
  { id: 'iban', label: 'IBAN' },
];

export function PDFRedactWorkspace() {
  const { activeTool, uploadedFile, setUploadedFile, isProcessing, setIsProcessing, setProgress, reset } = useActiveTool();

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

  const [redactions, setRedactions] = useState<RedactionItem[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFileName, setResultFileName] = useState<string>('');
  const [redactedSize, setRedactedSize] = useState<number>(0);
  const [isScanningPii, setIsScanningPii] = useState<boolean>(false);
  const [piiStats, setPiiStats] = useState<PiiSummary | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!uploadedFile) {
      setTotalPages(1);
      setResultUrl(null);
      setRedactions([]);
    setPiiStats(null);
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
            toast.warning('This PDF is password-protected — please unlock it before redacting.');
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

  const handleReset = useCallback(() => {
    if (resultUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(resultUrl);
    }
    reset();
    setResultUrl(null);
    setRedactedSize(0);
    setRedactions([]);
    setPiiStats(null);
    setCurrentPage(1);
  }, [reset, resultUrl]);

  const handleAutoDetectPii = async (categories?: PiiCategory[]) => {
    if (!uploadedFile) {
      toast.error('Please upload a PDF document first');
      return;
    }
    setIsScanningPii(true);
    try {
      const scanResult = await scanPdfPiiClient(uploadedFile, categories);
      const detectedItems: RedactionItem[] = scanResult.detected.map((d) => ({
        id: d.id,
        pageNumber: d.pageNumber,
        x: d.x,
        y: d.y,
        width: d.width,
        height: d.height,
      }));

      if (detectedItems.length === 0) {
        toast.info(
          categories?.length === 1
            ? `No ${categories[0].toUpperCase()} patterns detected. You can add manual blackout boxes anytime.`
            : 'No SSN, EIN, Card, Phone, Email, or IBAN patterns detected.',
        );
        setPiiStats((prev) => prev ?? scanResult.summary);
      } else {
        setRedactions((prev) => {
          const existingKeys = new Set(prev.map((p) => `${p.pageNumber}-${p.x}-${p.y}`));
          const newUnique = detectedItems.filter((d) => !existingKeys.has(`${d.pageNumber}-${d.x}-${d.y}`));
          return [...prev, ...newUnique];
        });
        setPiiStats(scanResult.summary);
        toast.success(`Auto-boxed ${detectedItems.length} sensitive item(s) locally in browser memory!`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to scan PDF patterns');
    } finally {
      setIsScanningPii(false);
    }
  };

  const addRedactionBox = () => {
    const width = Math.min(250, Math.max(80, Math.round(pageWidth * 0.42)));
    const height = Math.min(40, Math.max(20, Math.round(pageHeight * 0.05)));
    const x = Math.max(0, Math.min(pageWidth - width, Math.round((pageWidth - width) / 2)));
    const y = Math.max(0, Math.min(pageHeight - height, Math.round(pageHeight * 0.25)));
    const newBox: RedactionItem = {
      id: Math.random().toString(36).substring(2, 9),
      pageNumber: currentPage,
      x,
      y,
      width,
      height,
    };
    setRedactions(prev => [...prev, newBox]);
    toast.success('Blackout box added. Drag and resize over sensitive content.');
  };

  const removeRedactionBox = (id: string) => {
    setRedactions(prev => prev.filter(b => b.id !== id));
  };

  const updateRedactionBox = (id: string, updates: Partial<RedactionItem>) => {
    setRedactions(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const startBoxDrag = (e: React.PointerEvent<HTMLDivElement>, box: RedactionItem) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = box.x;
    const origY = box.y;
    const onMove = (ev: PointerEvent) => {
      const container = previewRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const dx = ((ev.clientX - startX) / rect.width) * pageWidth;
      const dy = ((ev.clientY - startY) / rect.height) * pageHeight;
      updateRedactionBox(box.id, {
        x: Math.round(Math.max(0, Math.min(Math.max(0, pageWidth - box.width), origX + dx))),
        y: Math.round(Math.max(0, Math.min(Math.max(0, pageHeight - box.height), origY + dy))),
      });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleApplyRedactions = async () => {
    if (!uploadedFile) {
      toast.error('Please upload a PDF document');
      return;
    }
    if (redactions.length === 0) {
      toast.error('Please add at least one blackout redaction box');
      return;
    }

    setIsProcessing(true);
    setProgress(25);

    try {
      const scrubbed = await redactPdfCanvasClient(uploadedFile, redactions);
      setProgress(100);
      const copy = new Uint8Array(scrubbed.bytes.byteLength);
      copy.set(scrubbed.bytes);
      const blob = new Blob([copy.buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return url;
      });
      setRedactedSize(blob.size);
      setResultFileName(uploadedFile.name.replace(/\.pdf$/i, '-redacted.pdf'));
      toast.success('PDF raster-scrubbed and metadata purged locally (Zero Server Upload)!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Redaction failed');
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
        a.download = resultFileName || 'redacted-document.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Download started');
      },
      {
        originalSize: uploadedFile?.size,
        processedSize: redactedSize,
        formatLabel: 'PDF',
        dpiLabel: '150 DPI Raster',
        fileName: resultFileName,
      },
    );
  };

  const currentPageRedactions = redactions.filter(r => r.pageNumber === currentPage);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl">
      <ToolPageHeader
        title={activeTool?.name || 'Redact PDF Online (Permanent Blackout & Raster-Scrub)'}
        description={activeTool?.description || 'Permanently scrub US SSN, EIN, Credit Cards, Phones, Emails, IBANs, and sensitive clauses via 150 DPI canvas rasterization + full EXIF/XMP metadata removal.'}
        icon={<EyeOff className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          '1-click Regex Redaction: US SSN, EIN, Credit Card, Phone, Email & IBAN',
          'True Canvas Raster-Scrubbing: rebuilds pages at 150 DPI with zero selectable text bytes',
          'Compliant with FOIA, HIPAA, GDPR & SOC2 confidentiality standards',
        ]}
      />
      <PrivateModeBadge
        className="mt-4"
        description="PII pattern scanning and 150 DPI pixel redaction execute 100% inside your browser — unredacted files never touch a server."
      />

      {!uploadedFile ? (
        <div className="mt-8">
          <FileUpload accept=".pdf,application/pdf" />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left: Document View & Redaction Canvas (7 cols) */}
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

              {/* PDF Preview Page with Interactive Blackout Boxes */}
              <div
                ref={previewRef}
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
                    }}
                  />
                </div>

                {/* Rendered Blackout Boxes for this page */}
                {currentPageRedactions.map((box) => (
                  <div
                    key={box.id}
                    role="presentation"
                    onPointerDown={(e) => startBoxDrag(e, box)}
                    className="absolute z-10 bg-black cursor-move touch-none border border-red-500/70 shadow-lg group select-none flex items-center justify-between px-1.5"
                    style={{
                      left: `${(box.x / pageWidth) * 100}%`,
                      top: `${(box.y / pageHeight) * 100}%`,
                      width: `${(box.width / pageWidth) * 100}%`,
                      height: `${(box.height / pageHeight) * 100}%`,
                      minHeight: '14px',
                      minWidth: '28px',
                    }}
                  >
                    <span className="text-[9px] text-white/80 font-mono truncate">REDACTED</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRedactionBox(box.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600/80 hover:bg-red-600 text-white rounded p-0.5 shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRedactionBox}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Blackout Box on Page {currentPage}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {redactions.length} blackout box{redactions.length === 1 ? '' : 'es'} total
                </p>
              </div>
            </div>

            {/* Right: Controls & Redaction Queue (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-base">Manual Redaction Boxes</h3>
                </div>

                {/* Smart PII Auto-Detection Banner */}
                <div className="bg-gradient-to-br from-violet-50/80 via-primary/5 to-card dark:from-violet-950/20 dark:via-primary/5 dark:to-card border border-violet-200 dark:border-violet-900/60 rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-violet-600/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-foreground">1-Click Tier-1 Pattern Redactor</h4>
                        <p className="text-[10px] text-muted-foreground">US SSN, EIN, Credit Card, Phone, Email &amp; IBAN</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300 font-bold">
                      Canvas Scrub
                    </Badge>
                  </div>

                  <Button
                    type="button"
                    onClick={() => void handleAutoDetectPii()}
                    disabled={isScanningPii}
                    className="w-full h-9 text-xs font-bold gap-2 bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isScanningPii ? 'Scanning Document Locally...' : 'Auto-Detect All Sensitive Data (PII)'}
                  </Button>

                  <div className="grid grid-cols-3 gap-1.5">
                    {TIER1_SCAN_ACTIONS.map((item) => (
                      <Button
                        key={item.id}
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isScanningPii}
                        onClick={() => void handleAutoDetectPii([item.id])}
                        className="h-7 px-2 text-[10px] font-semibold justify-center hover:border-violet-500/50 hover:text-violet-600"
                      >
                        + {item.label}
                      </Button>
                    ))}
                  </div>

                  {piiStats && (
                    <div className="rounded-lg border bg-card/80 p-2.5 space-y-1.5 text-xs">
                      <span className="font-semibold text-foreground block text-[10px]">
                        Detected Sensitive Entities ({piiStats.total}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {piiStats.ssn > 0 && <Badge variant="outline" className="text-[10px]">SSN: {piiStats.ssn}</Badge>}
                        {piiStats.ein > 0 && <Badge variant="outline" className="text-[10px]">EIN: {piiStats.ein}</Badge>}
                        {piiStats.card > 0 && <Badge variant="outline" className="text-[10px]">Cards: {piiStats.card}</Badge>}
                        {piiStats.iban > 0 && <Badge variant="outline" className="text-[10px]">IBAN: {piiStats.iban}</Badge>}
                        {piiStats.email > 0 && <Badge variant="outline" className="text-[10px]">Emails: {piiStats.email}</Badge>}
                        {piiStats.phone > 0 && <Badge variant="outline" className="text-[10px]">Phones: {piiStats.phone}</Badge>}
                        {piiStats.aadhaar > 0 && <Badge variant="outline" className="text-[10px]">Aadhaar: {piiStats.aadhaar}</Badge>}
                        {piiStats.pan > 0 && <Badge variant="outline" className="text-[10px]">PAN: {piiStats.pan}</Badge>}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Auto-strips all EXIF, XMP, Title & Author metadata.</span>
                  </div>
                </div>

                <div className="p-3 bg-muted/40 rounded-xl text-xs text-muted-foreground space-y-1.5 border">
                  <p className="font-semibold text-foreground">How PDFPixels Redaction Works:</p>
                  <p>
                    Redacted PDFs are rebuilt as image pages at 150 DPI. Covered text, interactive fields, and original hidden data are removed. Text in the output is no longer selectable.
                  </p>
                </div>

                {/* Active Page Redaction List */}
                {currentPageRedactions.length === 0 ? (
                  <div className="text-center py-6 border border-dashed rounded-xl space-y-2">
                    <EyeOff className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                    <p className="text-xs text-muted-foreground">No redactions on Page {currentPage}</p>
                    <Button size="sm" variant="secondary" onClick={addRedactionBox} className="text-xs gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Place Redaction Box
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                    {currentPageRedactions.map((box, idx) => (
                      <div key={box.id} className="p-3 border rounded-xl bg-card space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Redaction #{idx + 1}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => removeRedactionBox(box.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div>
                            <span className="text-[10px] text-muted-foreground">Width: {box.width}pt</span>
                            <Slider
                              value={[box.width]}
                              min={30}
                              max={pageWidth}
                              step={10}
                              onValueChange={([v]) => updateRedactionBox(box.id, { width: v })}
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground">Height: {box.height}pt</span>
                            <Slider
                              value={[box.height]}
                              min={15}
                              max={150}
                              step={5}
                              onValueChange={([v]) => updateRedactionBox(box.id, { height: v })}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <Button
                    type="button"
                    disabled={isProcessing || redactions.length === 0}
                    className="w-full rounded-xl font-semibold gap-2"
                    onClick={handleApplyRedactions}
                  >
                    <EyeOff className="w-4 h-4" /> {isProcessing ? 'Securing & Redacting...' : 'Apply Redactions & Download'}
                  </Button>
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
                    <h4 className="font-semibold text-base">Redaction Completed!</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Blackout boxes are permanently applied. All pages become images with no selectable text.
                    </p>
                  </div>
                  <Button onClick={handleDownload} className="w-full font-semibold gap-2 rounded-xl">
                    <Download className="w-4 h-4" /> Download Redacted PDF
                  </Button>
                  <SmartlinkButton className="w-full justify-center" />
                  <ResultScreenAd
                    refreshKey={resultUrl}
                    originalSize={uploadedFile?.size}
                    processedSize={redactedSize}
                    formatLabel="PDF"
                    dpiLabel="150 DPI Raster"
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
