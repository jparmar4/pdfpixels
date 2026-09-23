'use client';

import { motion } from 'framer-motion';
import {
  Download, RotateCcw, Pencil, Check, Trash2, ArrowLeft, ArrowRight,
  Calendar, CheckSquare, Type
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface FormEntry {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  text: string;
  fontSize: number;
}

export function PDFFillWorkspace() {
  const { uploadedFile, isProcessing, setIsProcessing, setProgress, reset } = useAppStore();

  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageWidth, setPageWidth] = useState<number>(595);
  const [pageHeight, setPageHeight] = useState<number>(842);

  // AcroForm detected fields
  const [detectedFields, setDetectedFields] = useState<Array<{ name: string; type: string }>>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string | boolean>>({});

  // Freeform text annotations on pages
  const [entries, setEntries] = useState<FormEntry[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFileName, setResultFileName] = useState<string>('');

  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!uploadedFile) {
      setTotalPages(1);
      setResultUrl(null);
      setEntries([]);
      setDetectedFields([]);
      setFieldValues({});
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

          try {
            const form = pdf.getForm();
            if (form) {
              const fields = form.getFields();
              const list = fields.map(f => ({
                name: f.getName(),
                type: f.constructor.name || 'TextField',
              }));
              setDetectedFields(list);
              if (list.length > 0) {
                toast.success(`Detected ${list.length} interactive form fields.`);
              } else {
                toast.success('PDF document loaded (click Text/Check/Date to place entries).');
              }
            }
          } catch {
            toast.success('PDF document loaded');
          }
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
    if (resultUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(resultUrl);
    }
    reset();
    setResultUrl(null);
    setEntries([]);
    setFieldValues({});
  }, [reset, resultUrl]);

  const addTextEntry = (initialText = 'Type text here') => {
    const newEntry: FormEntry = {
      id: Math.random().toString(36).substring(2, 9),
      pageNumber: currentPage,
      x: 80,
      y: 180 + (entries.length * 40) % 300,
      text: initialText,
      fontSize: 12,
    };
    setEntries(prev => [...prev, newEntry]);
    toast.success('Text field added. Drag to place anywhere on the page.');
  };

  const addCheckmark = () => {
    addTextEntry('✓');
  };

  const addDateStamp = () => {
    const today = new Date().toISOString().split('T')[0];
    addTextEntry(today);
  };

  const removeEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, updates: Partial<FormEntry>) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const handleFillPdf = async () => {
    if (!uploadedFile) {
      toast.error('Please upload a PDF document');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      if (Object.keys(fieldValues).length > 0) {
        formData.append('fields', JSON.stringify(fieldValues));
      }
      if (entries.length > 0) {
        formData.append('textEntries', JSON.stringify(entries));
      }

      const { fetchWithUploadProgress } = await import('@/lib/upload-with-progress');
      const res = await fetchWithUploadProgress('/api/pdf/fill', formData, setProgress);

      setProgress(90);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Form fill failed' }));
        throw new Error(err.error || 'Failed to fill PDF');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultFileName(uploadedFile.name.replace(/\.pdf$/i, '-filled.pdf'));
      setProgress(100);
      toast.success('PDF form filled and saved!');
    } catch (err: any) {
      toast.error(err.message || 'Form filling failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = resultFileName || 'filled-document.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success('Download started');
  };

  const currentPageEntries = entries.filter(e => e.pageNumber === currentPage);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl">
      <ToolPageHeader
        title="Fill PDF Forms Online Free"
        description="Complete and edit PDF forms without printing. Fill in standard AcroForm fields or click anywhere to type text, check checkboxes, and insert dates."
        icon={<Pencil className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'PDF only · max 25 MB',
          'Supports interactive fillable forms and flat non-interactive scans',
          'Freeform placement for custom text, checkmarks (✓), and date stamps',
        ]}
      />

      {!uploadedFile ? (
        <div className="mt-8">
          <FileUpload accept=".pdf,application/pdf" />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left: Document Mockup & Placed Entries (7 cols) */}
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

              {/* PDF Preview Page with Interactive Text Elements */}
              <div
                ref={previewRef}
                className="relative bg-white dark:bg-zinc-900 border-2 rounded-2xl aspect-[1/1.414] shadow-sm overflow-hidden p-8 flex flex-col justify-between"
              >
                {/* Mock Form Header Lines */}
                <div className="space-y-4 opacity-30 select-none">
                  <div className="h-5 bg-muted-foreground/30 rounded w-1/3" />
                  <div className="h-3 bg-muted-foreground/20 rounded w-full" />
                  <div className="h-3 bg-muted-foreground/20 rounded w-5/6" />
                  <div className="h-3 bg-muted-foreground/20 rounded w-full" />
                </div>

                {/* Freeform Placed Entries for Current Page */}
                {currentPageEntries.map((entry) => (
                  <motion.div
                    key={entry.id}
                    drag
                    dragConstraints={previewRef}
                    className="absolute bg-blue-50/90 dark:bg-blue-950/90 border border-blue-400/80 rounded px-2 py-1 shadow-sm group cursor-move select-none"
                    style={{
                      left: `${(entry.x / pageWidth) * 100}%`,
                      top: `${(entry.y / pageHeight) * 100}%`,
                    }}
                    onDragEnd={(_, info) => {
                      const container = previewRef.current;
                      if (!container) return;
                      const rect = container.getBoundingClientRect();
                      const xPercent = (info.point.x - rect.left) / rect.width;
                      const yPercent = (info.point.y - rect.top) / rect.height;
                      updateEntry(entry.id, {
                        x: Math.max(0, Math.min(pageWidth - 80, Math.round(xPercent * pageWidth))),
                        y: Math.max(0, Math.min(pageHeight - 30, Math.round(yPercent * pageHeight))),
                      });
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={entry.text}
                        onChange={(e) => updateEntry(entry.id, { text: e.target.value })}
                        className="bg-transparent text-foreground text-xs font-medium border-b border-transparent focus:border-primary outline-none min-w-[60px]"
                        style={{ fontSize: `${entry.fontSize}px` }}
                      />
                      <button
                        type="button"
                        onClick={() => removeEntry(entry.id)}
                        className="text-muted-foreground hover:text-red-500 opacity-60"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}

                <div className="space-y-3 opacity-30 select-none">
                  <div className="h-3 bg-muted-foreground/20 rounded w-full" />
                  <div className="h-3 bg-muted-foreground/20 rounded w-2/3" />
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="text-[10px] text-muted-foreground">APPLICATION FORM</span>
                    <span className="text-[10px] text-muted-foreground">Page {currentPage}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Tools & Interactive Form Fields (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pencil className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-base">Fill Form Fields</h3>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {entries.length} Entr{entries.length === 1 ? 'y' : 'ies'}
                  </Badge>
                </div>

                {/* Quick Addition Controls */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1"
                    onClick={() => addTextEntry('Sample Text')}
                  >
                    <Type className="w-3.5 h-3.5" /> Text
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1"
                    onClick={addCheckmark}
                  >
                    <CheckSquare className="w-3.5 h-3.5" /> Check (✓)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1"
                    onClick={addDateStamp}
                  >
                    <Calendar className="w-3.5 h-3.5" /> Date
                  </Button>
                </div>

                {/* Detected AcroForm Fields if available */}
                {detectedFields.length > 0 && (
                  <div className="space-y-3 border-t pt-4 max-h-60 overflow-y-auto">
                    <Label htmlFor="detected-acroform-fields" className="text-xs font-semibold">Detected AcroForm Fields:</Label>
                    {detectedFields.slice(0, 10).map((field) => (
                      <div key={field.name} className="space-y-1">
                        <span className="text-[11px] text-muted-foreground font-mono">{field.name}</span>
                        <Input id="detected-acroform-fields"
                          placeholder={`Enter ${field.name}...`}
                          value={String(fieldValues[field.name] || '')}
                          onChange={(e) => setFieldValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                          className="h-8 text-xs font-medium"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <Button
                    type="button"
                    disabled={isProcessing}
                    className="w-full rounded-xl font-semibold gap-2"
                    onClick={handleFillPdf}
                  >
                    <Check className="w-4 h-4" /> {isProcessing ? 'Saving Filled PDF...' : 'Save & Download Filled PDF'}
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
                    <h4 className="font-semibold text-base">PDF Form Filled!</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      All inputs, checkmarks, and annotations have been embedded.
                    </p>
                  </div>
                  <Button onClick={handleDownload} className="w-full font-semibold gap-2 rounded-xl">
                    <Download className="w-4 h-4" /> Download Completed PDF
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

