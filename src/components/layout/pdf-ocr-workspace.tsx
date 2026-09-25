'use client';

import {
  Download, RotateCcw, ScanText, Check, Copy
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useActiveTool } from '@/hooks/use-active-tool';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

type OcrResult = {
  text: string;
  usedOcr: boolean;
  pagesProcessed: number;
  totalPages: number;
  truncated: boolean;
  wordCount: number;
  charCount: number;
};

export function PDFOcrWorkspace() {
  const { uploadedFile, isProcessing, setIsProcessing, setProgress, reset } = useActiveTool();

  const [result, setResult] = useState<OcrResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!uploadedFile) {
      setResult(null);
      setCopied(false);
      return;
    }

    let active = true;
    (async () => {
      setIsProcessing(true);
      setProgress(0);

      try {
        const formData = new FormData();
        formData.append('file', uploadedFile);

        const { fetchWithUploadProgress } = await import('@/lib/upload-with-progress');
        const res = await fetchWithUploadProgress('/api/pdf/ocr', formData, setProgress);

        setProgress(90);

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'OCR failed' }));
          throw new Error(err.error || 'Failed to recognize text in PDF');
        }

        const data: OcrResult = await res.json();
        if (active) {
          setResult(data);
          setProgress(100);
          if (data.usedOcr) {
            toast.success(`Recognized text on ${data.pagesProcessed} page${data.pagesProcessed === 1 ? '' : 's'} (${data.wordCount} words)`);
            if (data.truncated) {
              toast.info('Run capped at 10 pages — split the PDF to process the rest.');
            }
          } else {
            toast.success('This PDF already has selectable text — extracted it directly.');
          }
        }
      } catch (err: any) {
        if (active) {
          toast.error(err.message || 'OCR failed');
        }
      } finally {
        if (active) {
          setIsProcessing(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [uploadedFile, setIsProcessing, setProgress]);

  const handleReset = useCallback(() => {
    reset();
    setResult(null);
    setCopied(false);
  }, [reset]);

  const handleCopy = () => {
    if (!result?.text) return;
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    toast.success('Text copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!result?.text) return;
    const blob = new Blob([result.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = uploadedFile ? uploadedFile.name.replace(/\.pdf$/i, '-ocr.txt') : 'ocr-text.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Downloaded .txt file');
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
      <ToolPageHeader
        title="OCR PDF — Scanned Pages to Text"
        description="Recognize text in scanned, image-only PDFs. Each page is rendered at high resolution and read by our OCR engine, then returned as clean, copyable text."
        icon={<ScanText className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'PDF only · max 50 MB · OCR capped at 10 pages per run',
          'PDFs with a real text layer are extracted instantly instead',
          'Best accuracy on clean 300 DPI prints — proofread handwriting',
        ]}
      />

      {!uploadedFile ? (
        <div className="mt-8">
          <FileUpload accept=".pdf,application/pdf" />
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="bg-card border rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-sm truncate max-w-[250px]">
                {uploadedFile.name}
              </span>
              {result && (
                <>
                  <Badge variant="outline" className="font-mono text-xs">
                    {result.usedOcr ? `OCR · ${result.pagesProcessed}/${result.totalPages} pages` : 'Text layer found'}
                  </Badge>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {result.wordCount} Words
                  </Badge>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5 text-xs">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Text'}
              </Button>
              <Button size="sm" onClick={handleDownloadTxt} className="gap-1.5 text-xs">
                <Download className="w-3.5 h-3.5" /> Download .TXT
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleReset}
                className="text-xs text-muted-foreground"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Start Over
              </Button>
            </div>
          </div>

          <div className="relative border rounded-2xl bg-card shadow-sm p-6 overflow-hidden">
            <textarea
              readOnly
              value={result?.text || ''}
              rows={18}
              className="w-full bg-transparent font-mono text-xs md:text-sm leading-relaxed outline-none resize-y text-foreground/90 select-text"
              placeholder={isProcessing ? 'Running OCR — this takes a few seconds per page…' : 'No text recognized'}
              aria-label="Recognized text"
            />
          </div>

          {result?.truncated && (
            <p className="text-xs text-muted-foreground">
              Processed the first {result.pagesProcessed} of {result.totalPages} pages per run limits. Use{' '}
              <Link href="/tools/split-pdf" className="text-primary underline underline-offset-2">Split PDF</Link> to process longer documents in ranges.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
