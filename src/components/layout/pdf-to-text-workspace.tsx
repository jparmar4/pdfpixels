'use client';

import {
  Download, RotateCcw, FileText, Check, Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export function PDFToTextWorkspace() {
  const { uploadedFile, isProcessing, setIsProcessing, setProgress, reset } = useAppStore();

  const [extractedText, setExtractedText] = useState<string>('');
  const [charCount, setCharCount] = useState<number>(0);
  const [wordCount, setWordCount] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!uploadedFile) {
      setExtractedText('');
      setCharCount(0);
      setWordCount(0);
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
        formData.append('format', 'json');

        const { fetchWithUploadProgress } = await import('@/lib/upload-with-progress');
        const res = await fetchWithUploadProgress('/api/pdf/to-text', formData, setProgress);

        setProgress(90);

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Text extraction failed' }));
          throw new Error(err.error || 'Failed to extract text from PDF');
        }

        const data = await res.json();
        if (active) {
          setExtractedText(data.text || '');
          setCharCount(data.charCount || 0);
          setWordCount(data.wordCount || 0);
          setProgress(100);
          toast.success(`Extracted text (${data.wordCount} words) successfully!`);
        }
      } catch (err: any) {
        if (active) {
          toast.error(err.message || 'Text extraction failed');
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
    setExtractedText('');
    setCharCount(0);
    setWordCount(0);
    setCopied(false);
  }, [reset]);

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    toast.success('Text copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = uploadedFile ? uploadedFile.name.replace(/\.pdf$/i, '.txt') : 'extracted-text.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Downloaded .txt file');
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
      <ToolPageHeader
        title="PDF to Text Converter Online"
        description="Extract selectable text from PDF documents instantly. Copy to clipboard or download as a clean plain text (.txt) file."
        icon={<FileText className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'PDF only · max 25 MB',
          'Extracts raw character text streams and UTF-8 glyph mappings',
          'Instant clipboard copy or plain text (.txt) download',
        ]}
      />

      {!uploadedFile ? (
        <div className="mt-8">
          <FileUpload accept=".pdf,application/pdf" />
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {/* Top Bar with document info & action buttons */}
          <div className="bg-card border rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-sm truncate max-w-[250px]">
                {uploadedFile.name}
              </span>
              <Badge variant="outline" className="font-mono text-xs">
                {wordCount} Words
              </Badge>
              <Badge variant="secondary" className="font-mono text-xs">
                {charCount} Characters
              </Badge>
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

          {/* Text Content Area */}
          <div className="relative border rounded-2xl bg-card shadow-sm p-6 overflow-hidden">
            <textarea
              readOnly
              value={extractedText}
              rows={18}
              className="w-full bg-transparent font-mono text-xs md:text-sm leading-relaxed outline-none resize-y text-foreground/90 select-text"
              placeholder={isProcessing ? 'Extracting text from PDF...' : 'No text extracted'}
            />
          </div>
        </div>
      )}
    </div>
  );
}
