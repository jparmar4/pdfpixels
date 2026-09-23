'use client';

import { motion } from 'framer-motion';
import {
  Download, RotateCcw, Layers, Check, ShieldCheck, FileCheck, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export function PDFFlattenWorkspace() {
  const { uploadedFile, isProcessing, setIsProcessing, setProgress, reset } = useAppStore();

  const [totalPages, setTotalPages] = useState<number>(1);
  const [fieldCount, setFieldCount] = useState<number>(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFileName, setResultFileName] = useState<string>('');

  useEffect(() => {
    if (!uploadedFile) {
      setTotalPages(1);
      setFieldCount(0);
      setResultUrl(null);
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
          let fieldsFound = 0;
          try {
            const form = pdf.getForm();
            if (form) {
              fieldsFound = form.getFields().length;
            }
          } catch { /* no interactive form — fieldsFound stays 0 */ }
          setFieldCount(fieldsFound);
          toast.success(`PDF analyzed: ${fieldsFound} interactive form field${fieldsFound === 1 ? '' : 's'} detected.`);
        }
      } catch {
        if (active) {
          setTotalPages(1);
          setFieldCount(0);
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
  }, [reset, resultUrl]);

  const handleFlatten = async () => {
    if (!uploadedFile) {
      toast.error('Please upload a PDF document');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const { fetchWithUploadProgress } = await import('@/lib/upload-with-progress');
      const res = await fetchWithUploadProgress('/api/pdf/flatten', formData, setProgress);

      setProgress(90);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Flatten failed' }));
        throw new Error(err.error || 'Failed to flatten PDF');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultFileName(uploadedFile.name.replace(/\.pdf$/i, '-flattened.pdf'));
      setProgress(100);
      toast.success('PDF flattened successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Flattening failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = resultFileName || 'flattened-document.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success('Download started');
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
      <ToolPageHeader
        title="Flatten PDF Online Free"
        description="Lock all fillable AcroForm text fields, checkmarks, radio buttons, and digital signatures into permanent page graphics. Compliant with US Courts (PACER), tax filing, and university admissions."
        icon={<Layers className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'PDF only · max 50 MB',
          'Converts all form inputs into uneditable vector paths',
          'Compliant with PACER, IRS, USCIS, and court e-filing systems',
        ]}
      />

      {!uploadedFile ? (
        <div className="mt-8">
          <FileUpload accept=".pdf,application/pdf" />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <div className="grid md:grid-cols-12 gap-8 items-start">
            {/* Left: Summary Card (7 cols) */}
            <div className="md:col-span-7 bg-card border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-semibold text-lg">{uploadedFile.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB · {totalPages} Page{totalPages === 1 ? '' : 's'}
                  </p>
                </div>
                <Badge variant={fieldCount > 0 ? 'default' : 'secondary'} className="font-mono text-xs">
                  {fieldCount} Field{fieldCount === 1 ? '' : 's'} Detected
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-foreground">Court & Government Filing Standard</p>
                    <p className="text-muted-foreground leading-relaxed">
                      Federal Court ECF/PACER systems and municipal licensing portals strictly require flattened PDFs. Flattening prevents form data from disappearing or rendering incorrectly across different viewer software.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border bg-card/60 text-xs space-y-1">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-500" /> Interactive Fields
                    </span>
                    <p className="text-muted-foreground">Locks editable text inputs into static vector curves.</p>
                  </div>
                  <div className="p-3 rounded-xl border bg-card/60 text-xs space-y-1">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-500" /> Signatures & Stamps
                    </span>
                    <p className="text-muted-foreground">Permanently burns e-signatures so they cannot be extracted.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  type="button"
                  disabled={isProcessing}
                  size="lg"
                  className="w-full rounded-xl font-semibold gap-2"
                  onClick={handleFlatten}
                >
                  <Layers className="w-5 h-5" /> {isProcessing ? 'Flattening Document...' : 'Flatten PDF Form Fields'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  onClick={handleReset}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Upload Different File
                </Button>
              </div>
            </div>

            {/* Right: Result or Compliance Overview (5 cols) */}
            <div className="md:col-span-5 space-y-6">
              {resultUrl ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center space-y-4"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-base">PDF Successfully Flattened!</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      All form inputs and layers have been merged into read-only document pages.
                    </p>
                  </div>
                  <Button onClick={handleDownload} className="w-full font-semibold gap-2 rounded-xl">
                    <Download className="w-4 h-4" /> Download Flattened PDF
                  </Button>
                </motion.div>
              ) : (
                <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Sparkles className="w-4 h-4 text-primary" /> Why Flatten a PDF?
                  </div>
                  <ul className="space-y-2 text-muted-foreground list-disc pl-4 leading-relaxed">
                    <li><strong className="text-foreground">Eliminates Form Tampering:</strong> Form values cannot be modified or altered by recipients.</li>
                    <li><strong className="text-foreground">Prevents Blank Prints:</strong> Mobile printers often fail to print unfilled AcroForm text layers. Flattening ensures 100% print accuracy.</li>
                    <li><strong className="text-foreground">Smaller File Weight:</strong> Strips unnecessary interactive widget metadata, optimizing transfer speeds.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
