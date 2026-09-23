'use client';

import { motion } from 'framer-motion';
import {
  Download, RotateCcw, Shield, Check, Archive, Award, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

export function PDFToPDFAWorkspace() {
  const { uploadedFile, isProcessing, setIsProcessing, setProgress, reset } = useAppStore();

  const [totalPages, setTotalPages] = useState<number>(1);
  const [conformance, setConformance] = useState<'2b' | '1b'>('2b');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFileName, setResultFileName] = useState<string>('');

  useEffect(() => {
    if (!uploadedFile) {
      setTotalPages(1);
      setResultUrl(null);
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
          toast.success(`PDF loaded (${pdf.getPageCount()} page${pdf.getPageCount() === 1 ? '' : 's'})`);
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
  }, [reset, resultUrl]);

  const handleConvertPdfa = async () => {
    if (!uploadedFile) {
      toast.error('Please upload a PDF document');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('conformance', conformance);

      const { fetchWithUploadProgress } = await import('@/lib/upload-with-progress');
      const res = await fetchWithUploadProgress('/api/pdf/to-pdfa', formData, setProgress);

      setProgress(90);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'PDF/A conversion failed' }));
        throw new Error(err.error || 'Failed to convert PDF to PDF/A');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultFileName(uploadedFile.name.replace(/\.pdf$/i, '-pdfa.pdf'));
      setProgress(100);
      toast.success(`Converted to ISO-compliant PDF/A-${conformance.toUpperCase()}!`);
    } catch (err: any) {
      toast.error(err.message || 'Conversion failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = resultFileName || 'archival-document-pdfa.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success('Download started');
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
      <ToolPageHeader
        title="PDF to PDF/A Converter (ISO Archival Standard)"
        description="Convert standard PDF files into ISO 19005 compliant PDF/A-1b and PDF/A-2b format for long-term document archiving, European e-Justice, and legal compliance."
        icon={<Archive className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'PDF only · max 50 MB',
          'Conforms to ISO 19005-1 (PDF/A-1b) and ISO 19005-2 (PDF/A-2b)',
          'Embeds all font glyphs and color ICC profiles for permanent archiving',
        ]}
      />

      {!uploadedFile ? (
        <div className="mt-8">
          <FileUpload accept=".pdf,application/pdf" />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <div className="grid md:grid-cols-12 gap-8 items-start">
            {/* Left: Summary & Conformance Profile (7 cols) */}
            <div className="md:col-span-7 bg-card border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-semibold text-lg">{uploadedFile.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB · {totalPages} Page{totalPages === 1 ? '' : 's'}
                  </p>
                </div>
                <Badge variant="default" className="font-mono text-xs">
                  ISO 19005
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label id="conformance" className="text-xs">Select PDF/A Archival Conformance Level:</Label>
                  <Select aria-labelledby="conformance" value={conformance} onValueChange={(v: any) => setConformance(v)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Profile" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2b">PDF/A-2b (Recommended · ISO 19005-2, sRGB color, modern)</SelectItem>
                      <SelectItem value="1b">PDF/A-1b (Legacy · ISO 19005-1, basic visual preservation)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border">
                  <Archive className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-foreground">Long-Term Archival Guarantee</p>
                    <p className="text-muted-foreground leading-relaxed">
                      PDF/A embeds all font glyphs, color profiles, and metadata within the file itself. This guarantees the document will render with 100% exact visual fidelity 50+ years into the future without relying on external system fonts.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl border bg-card/60 space-y-1">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-500" /> European e-Justice
                    </span>
                    <p className="text-muted-foreground">Meets German, Austrian & EU public administration filing mandates.</p>
                  </div>
                  <div className="p-3 rounded-xl border bg-card/60 space-y-1">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-primary" /> Self-Contained
                    </span>
                    <p className="text-muted-foreground">All fonts & device color spaces are fully embedded.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  type="button"
                  disabled={isProcessing}
                  size="lg"
                  className="w-full rounded-xl font-semibold gap-2"
                  onClick={handleConvertPdfa}
                >
                  <Shield className="w-5 h-5" /> {isProcessing ? 'Converting to PDF/A...' : 'Convert to PDF/A'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  onClick={handleReset}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Upload Different PDF
                </Button>
              </div>
            </div>

            {/* Right: Result or Requirements info (5 cols) */}
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
                    <h4 className="font-semibold text-base">PDF/A Conversion Complete!</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Document conforms to ISO 19005 archival standards.
                    </p>
                  </div>
                  <Button onClick={handleDownload} className="w-full font-semibold gap-2 rounded-xl">
                    <Download className="w-4 h-4" /> Download PDF/A File
                  </Button>
                </motion.div>
              ) : (
                <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Sparkles className="w-4 h-4 text-primary" /> Who Requires PDF/A?
                  </div>
                  <ul className="space-y-2 text-muted-foreground list-disc pl-4 leading-relaxed">
                    <li><strong className="text-foreground">German & EU Courts:</strong> German e-Justice (Elektronischer Rechtsverkehr) legally requires PDF/A for all digital submissions.</li>
                    <li><strong className="text-foreground">University Theses:</strong> Academic libraries mandate PDF/A to ensure doctoral dissertations remain readable decades later.</li>
                    <li><strong className="text-foreground">Tax & Accounting Records:</strong> Corporate compliance requires PDF/A for invoice storage under GDPR and financial retention laws.</li>
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

