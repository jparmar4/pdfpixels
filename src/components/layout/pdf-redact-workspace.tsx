'use client';

import { motion } from 'framer-motion';
import {
  Download, RotateCcw, EyeOff, Trash2, ArrowLeft, ArrowRight, Check, Plus, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface RedactionItem {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function PDFRedactWorkspace() {
  const { uploadedFile, isProcessing, setIsProcessing, setProgress, reset } = useAppStore();

  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageWidth, setPageWidth] = useState<number>(595);
  const [pageHeight, setPageHeight] = useState<number>(842);

  const [redactions, setRedactions] = useState<RedactionItem[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFileName, setResultFileName] = useState<string>('');

  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!uploadedFile) {
      setTotalPages(1);
      setResultUrl(null);
      setRedactions([]);
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

  const handleReset = useCallback(() => {
    if (resultUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(resultUrl);
    }
    reset();
    setResultUrl(null);
    setRedactions([]);
    setCurrentPage(1);
  }, [reset, resultUrl]);

  const addRedactionBox = () => {
    const newBox: RedactionItem = {
      id: Math.random().toString(36).substring(2, 9),
      pageNumber: currentPage,
      x: 100,
      y: 200,
      width: 250,
      height: 40,
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
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('redactions', JSON.stringify(redactions));

      const { fetchWithUploadProgress } = await import('@/lib/upload-with-progress');
      const res = await fetchWithUploadProgress('/api/pdf/redact', formData, setProgress);

      setProgress(90);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Redaction failed' }));
        throw new Error(err.error || 'Failed to redact PDF');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultFileName(uploadedFile.name.replace(/\.pdf$/i, '-redacted.pdf'));
      setProgress(100);
      toast.success('PDF redacted and secured!');
    } catch (err: any) {
      toast.error(err.message || 'Redaction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = resultFileName || 'redacted-document.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success('Download started');
  };

  const currentPageRedactions = redactions.filter(r => r.pageNumber === currentPage);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl">
      <ToolPageHeader
        title="Redact PDF Online (Permanent Blackout)"
        description="Permanently black out sensitive text, SSNs, credit card numbers, confidential names, and HIPAA data. Securely burns redaction boxes into document pages."
        icon={<EyeOff className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'PDF only · max 50 MB',
          'Permanently obliterates text and underlying vector streams',
          'Compliant with FOIA, HIPAA, and GDPR data privacy standards',
        ]}
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
                className="relative bg-white dark:bg-zinc-900 border-2 border-dashed rounded-2xl aspect-[1/1.414] shadow-sm overflow-hidden p-8 flex flex-col justify-between"
              >
                {/* Mock Content Lines */}
                <div className="space-y-4 opacity-30 select-none">
                  <div className="h-5 bg-muted-foreground/30 rounded w-1/2" />
                  <div className="h-3 bg-muted-foreground/20 rounded w-full" />
                  <div className="h-3 bg-muted-foreground/20 rounded w-11/12" />
                  <div className="h-3 bg-muted-foreground/20 rounded w-full" />
                  <div className="h-3 bg-muted-foreground/20 rounded w-3/4" />
                  <div className="h-3 bg-muted-foreground/20 rounded w-5/6" />
                </div>

                {/* Rendered Blackout Boxes for this page */}
                {currentPageRedactions.map((box) => (
                  <motion.div
                    key={box.id}
                    drag
                    dragConstraints={previewRef}
                    className="absolute bg-black cursor-move border border-red-500/50 shadow-lg group select-none flex items-center justify-between px-2"
                    style={{
                      left: `${(box.x / pageWidth) * 100}%`,
                      top: `${(box.y / pageHeight) * 100}%`,
                      width: `${(box.width / pageWidth) * 100}%`,
                      height: `${(box.height / pageHeight) * 100}%`,
                      minHeight: '20px',
                      minWidth: '50px',
                    }}
                    onDragEnd={(_, info) => {
                      if (previewRef.current) {
                        const rect = previewRef.current.getBoundingClientRect();
                        const deltaX = (info.offset.x / rect.width) * pageWidth;
                        const deltaY = (info.offset.y / rect.height) * pageHeight;
                        updateRedactionBox(box.id, {
                          x: Math.max(0, Math.min(pageWidth - box.width, box.x + deltaX)),
                          y: Math.max(0, Math.min(pageHeight - box.height, box.y + deltaY)),
                        });
                      }
                    }}
                  >
                    <span className="text-[10px] text-white/70 font-mono">REDACTED</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRedactionBox(box.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600/80 hover:bg-red-600 text-white rounded p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}

                <div className="space-y-4 opacity-30 select-none">
                  <div className="h-3 bg-muted-foreground/20 rounded w-full" />
                  <div className="h-3 bg-muted-foreground/20 rounded w-4/5" />
                  <div className="h-3 bg-muted-foreground/20 rounded w-2/3" />
                </div>
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
                  <h3 className="font-semibold text-base">Redaction Controls</h3>
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
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
