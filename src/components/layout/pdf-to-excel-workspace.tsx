'use client';

import { motion } from 'framer-motion';
import {
  RotateCcw, FileSpreadsheet, Check, Sparkles, Table
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/app-store';
import { ToolResultBar } from './tool-result-bar';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

export function PDFToExcelWorkspace() {
  const { uploadedFile, isProcessing, progress, setIsProcessing, setProgress, reset } = useAppStore();
  const [convertError, setConvertError] = useState<string | null>(null);

  const [totalPages, setTotalPages] = useState<number>(1);
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
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
      formData.append('format', format);

      const { fetchWithUploadProgress } = await import('@/lib/upload-with-progress');
      const res = await fetchWithUploadProgress('/api/pdf/to-excel', formData, setProgress);

      setProgress(90);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Conversion failed' }));
        throw new Error(err.error || 'Failed to convert PDF to Excel');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultFileName(uploadedFile.name.replace(/\.pdf$/i, `.${format}`));
      setProgress(100);
      toast.success(`PDF converted to ${format.toUpperCase()} spreadsheet successfully!`);
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
    a.download = resultFileName || `spreadsheet.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success('Download started');
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
      <ToolPageHeader
        title="PDF to Excel Converter Online Free"
        description="Extract tables, rows, columns, and financial data from PDF invoices, bank statements, and spreadsheets into Microsoft Excel (.xlsx) or CSV."
        icon={<FileSpreadsheet className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'PDF only · max 25 MB',
          'Extracts tables into Microsoft Excel (.xlsx) or CSV format',
          'Preserves numerical formatting, column alignments, and text values',
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
                  Output: {format.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label id="format" className="text-xs">Select Output Format:</Label>
                  <Select aria-labelledby="format" value={format} onValueChange={(v: any) => setFormat(v)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xlsx">Microsoft Excel Workbook (.xlsx)</SelectItem>
                      <SelectItem value="csv">Comma-Separated Values (.csv)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 rounded-xl bg-muted/40 border space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-primary">
                    <Table className="w-4 h-4" /> Spreadsheet export
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    LibreOffice writes the workbook when it is installed. CSV and the fallback path split selectable text into cells. Scans are OCR’d when no text layer exists.
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
                  <FileSpreadsheet className="w-5 h-5" /> {isProcessing ? `Extracting… ${Math.round(progress)}%` : `Convert to ${format.toUpperCase()}`}
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
                    <h4 className="font-semibold text-base">Extraction Completed!</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your spreadsheet is ready for analysis in Excel or Google Sheets.
                    </p>
                  </div>
                  <ToolResultBar
                    error={convertError}
                    downloadUrl={resultUrl}
                    downloadName={resultFileName || `spreadsheet.${format}`}
                    summary="Your spreadsheet is ready."
                    onDownload={handleDownload}
                  />
                </motion.div>
              ) : (
                <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Sparkles className="w-4 h-4 text-primary" /> Popular Workflows
                  </div>
                  <ul className="space-y-2 text-muted-foreground list-disc pl-4 leading-relaxed">
                    <li><strong className="text-foreground">Bank & Credit Card Statements:</strong> Extract transaction tables for budgeting and accounting software.</li>
                    <li><strong className="text-foreground">Invoices & Receipts:</strong> Pull line items, SKU codes, and amounts directly into spreadsheets.</li>
                    <li><strong className="text-foreground">Statistical Reports:</strong> Move census, research, and financial reports from PDF into manipulable data tables.</li>
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

