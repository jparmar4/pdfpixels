'use client';

import { motion } from 'framer-motion';
import {
  RotateCcw, FileText, Check, Sparkles, FileEdit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { ToolResultBar } from './tool-result-bar';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export function PDFToWordWorkspace() {
  const { uploadedFile, isProcessing, progress, setIsProcessing, setProgress, reset } = useAppStore();
  const [convertError, setConvertError] = useState<string | null>(null);

  const [totalPages, setTotalPages] = useState<number>(1);
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

  const handleConvert = async () => {
    if (!uploadedFile) {
      toast.error('Please upload a PDF document');
      return;
    }

    setIsProcessing(true);
    setConvertError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const { fetchWithUploadProgress } = await import('@/lib/upload-with-progress');
      const res = await fetchWithUploadProgress('/api/pdf/to-word', formData, setProgress);

      setProgress(90);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Conversion failed' }));
        throw new Error(err.error || 'Failed to convert PDF to Word');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultFileName(uploadedFile.name.replace(/\.pdf$/i, '.docx'));
      setProgress(100);
      toast.success('PDF converted to editable Word document successfully!');
    } catch (err: any) {
      const message = err?.message || 'Conversion failed';
      setConvertError(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = resultFileName || 'converted-document.docx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success('Download started');
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
      <ToolPageHeader
        title="PDF to Word Converter Online Free"
        description="Convert PDF files into editable Microsoft Word documents (.docx). Extract text paragraphs, headings, and formatting for effortless editing in Word or Google Docs."
        icon={<FileText className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'PDF only · max 50 MB',
          'Converts PDF text streams into editable Microsoft Word (.docx) format',
          'Maintains paragraph divisions and text formatting',
        ]}
      />

      {!uploadedFile ? (
        <div className="mt-8">
          <FileUpload accept=".pdf,application/pdf" />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <div className="grid md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-7 bg-card border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-semibold text-lg">{uploadedFile.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB · {totalPages} Page{totalPages === 1 ? '' : 's'}
                  </p>
                </div>
                <Badge variant="default" className="font-mono text-xs">
                  Output: .DOCX
                </Badge>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-muted/40 border space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-primary">
                    <FileEdit className="w-4 h-4" /> Editable Word document
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    LibreOffice keeps layout when it is installed. Otherwise the file is rebuilt from selectable text, and scans are OCR’d first. Opens in Word, Google Docs, and LibreOffice Writer.
                  </p>
                </div>
              </div>

              <ToolResultBar error={convertError} />
              <div className="pt-2 flex flex-col gap-2">
                <Button
                  type="button"
                  disabled={isProcessing}
                  size="lg"
                  className="w-full rounded-xl font-semibold gap-2"
                  onClick={handleConvert}
                >
                  <FileText className="w-5 h-5" /> {isProcessing ? `Converting… ${Math.round(progress)}%` : 'Convert to Word (.docx)'}
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
                    <h4 className="font-semibold text-base">Conversion Completed!</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your editable Word document (.docx) is ready to download.
                    </p>
                  </div>
                  <ToolResultBar
                    downloadUrl={resultUrl}
                    downloadName={resultFileName || 'converted-document.docx'}
                    summary="Your editable Word document (.docx) is ready."
                    onDownload={handleDownload}
                  />
                </motion.div>
              ) : (
                <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Sparkles className="w-4 h-4 text-primary" /> Key Benefits
                  </div>
                  <ul className="space-y-2 text-muted-foreground list-disc pl-4 leading-relaxed">
                    <li><strong className="text-foreground">Full Text Editability:</strong> Fix typos, change wording, and add paragraphs to locked PDF documents.</li>
                    <li><strong className="text-foreground">No Software Required:</strong> Convert instantly online without needing Adobe Acrobat Pro subscriptions.</li>
                    <li><strong className="text-foreground">Total Privacy:</strong> Secure, fast processing with instant automated file purging.</li>
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
