'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Hash, Clock, BookOpen, Copy, Download, RotateCcw, Check, Sparkles, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActiveTool } from '@/hooks/use-active-tool';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { toast } from 'sonner';

interface TextStats {
  text: string;
  words: number;
  characters: number;
  charactersNoSpaces: number;
  pages: number;
  paragraphs: number;
  readingTimeMin: number;
  speakingTimeMin: number;
  fileName: string;
}

export function PDFWordCounterWorkspace() {
  const { uploadedFile, isProcessing, setIsProcessing, reset } = useActiveTool();
  const [stats, setStats] = useState<TextStats | null>(null);
  const [copied, setCopied] = useState(false);

  const analyzeFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setStats(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', 'json');

      const res = await fetch('/api/pdf/to-text', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to analyze PDF' }));
        throw new Error(err.error || 'Failed to read PDF text');
      }

      const data = await res.json();
      const rawText: string = data.text || '';
      const words = data.wordCount || (rawText.trim() ? rawText.trim().split(/\s+/).length : 0);
      const characters = data.charCount || rawText.length;
      const charactersNoSpaces = rawText.replace(/\s+/g, '').length;
      const pages = data.pageCount || 1;
      const paragraphs = rawText.split(/\n\s*\n/).filter((p: string) => p.trim().length > 0).length || 1;
      const readingTimeMin = Math.max(1, Math.ceil(words / 225));
      const speakingTimeMin = Math.max(1, Math.ceil(words / 130));

      setStats({
        text: rawText,
        words,
        characters,
        charactersNoSpaces,
        pages,
        paragraphs,
        readingTimeMin,
        speakingTimeMin,
        fileName: file.name,
      });

      toast.success(`Counted ${words.toLocaleString()} words across ${pages} page${pages === 1 ? '' : 's'}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to analyze PDF text';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  }, [setIsProcessing]);

  useEffect(() => {
    if (uploadedFile) {
      analyzeFile(uploadedFile);
    } else {
      setStats(null);
    }
  }, [uploadedFile, analyzeFile]);

  const handleCopy = useCallback(() => {
    if (!stats?.text) return;
    navigator.clipboard.writeText(stats.text);
    setCopied(true);
    toast.success('Text copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }, [stats]);

  const handleDownloadTxt = useCallback(() => {
    if (!stats?.text) return;
    const blob = new Blob([stats.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = stats.fileName.replace(/\.pdf$/i, '-text.txt');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Text file downloaded');
  }, [stats]);

  const handleReset = useCallback(() => {
    reset();
    setStats(null);
    setCopied(false);
  }, [reset]);

  return (
    <div className="container mx-auto px-4 lg:px-8 max-w-5xl py-8">
      <ToolPageHeader
        title="PDF Word Counter"
        description="Count words, characters, pages, reading time, and speaking time in any PDF document with instant statistics."
        icon={<FileText className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'PDF only · max 50 MB · 100% private in-browser analysis',
          'Calculates words, characters, pages, reading & speaking time',
          'Instant text preview with copy and .txt export',
        ]}
      />

      {!uploadedFile ? (
        <div className="mt-8">
          <FileUpload accept=".pdf,application/pdf" />
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="section-panel rounded-[2rem] p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/40 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base sm:text-lg">{uploadedFile.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB · {stats ? `${stats.words.toLocaleString()} words` : 'Analyzing document...'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-border/50 text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Analyze Another PDF
                </Button>
                {!stats && !isProcessing && (
                  <Button
                    onClick={() => analyzeFile(uploadedFile)}
                    className="btn-premium rounded-xl text-xs font-bold"
                    size="sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Count Words
                  </Button>
                )}
              </div>
            </div>

            {isProcessing && (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-sm font-semibold text-foreground">Reading PDF text layer...</p>
                <p className="text-xs text-muted-foreground">Extracting words and calculating document statistics</p>
              </div>
            )}

            {/* Results Dashboard */}
            {stats && !isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 space-y-6"
              >
                {/* 6 Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-border/60 bg-background/80 p-5 shadow-soft">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Words</span>
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="mt-2 text-3xl font-extrabold text-foreground">
                      {stats.words.toLocaleString()}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      ~{Math.round(stats.words / Math.max(1, stats.pages))} words per page
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/80 p-5 shadow-soft">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Characters</span>
                      <Hash className="w-4 h-4 text-sky-500" />
                    </div>
                    <div className="mt-2 text-3xl font-extrabold text-foreground">
                      {stats.characters.toLocaleString()}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {stats.charactersNoSpaces.toLocaleString()} excluding spaces
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/80 p-5 shadow-soft">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pages</span>
                      <Layers className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="mt-2 text-3xl font-extrabold text-foreground">
                      {stats.pages}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {stats.paragraphs.toLocaleString()} paragraph blocks
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/80 p-5 shadow-soft">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reading Time</span>
                      <BookOpen className="w-4 h-4 text-violet-500" />
                    </div>
                    <div className="mt-2 text-3xl font-extrabold text-foreground">
                      {stats.readingTimeMin} <span className="text-base font-normal text-muted-foreground">min</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Based on 225 wpm average
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/80 p-5 shadow-soft">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Speaking Time</span>
                      <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="mt-2 text-3xl font-extrabold text-foreground">
                      {stats.speakingTimeMin} <span className="text-base font-normal text-muted-foreground">min</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Based on 130 wpm speech rate
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/80 p-5 shadow-soft flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</span>
                      <p className="mt-1 text-xs text-muted-foreground">Export or copy text</p>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        onClick={handleCopy}
                        variant="outline"
                        size="sm"
                        className="rounded-xl flex-1 text-xs border-border/60"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                      <Button
                        onClick={handleDownloadTxt}
                        size="sm"
                        className="btn-premium rounded-xl flex-1 text-xs"
                      >
                        <Download className="w-3.5 h-3.5 mr-1" />
                        TXT
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Text Preview Box */}
                {stats.text && (
                  <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Extracted Text Preview</span>
                      <span className="text-xs text-muted-foreground">{stats.words.toLocaleString()} words</span>
                    </div>
                    <div className="max-h-60 overflow-y-auto rounded-xl bg-background/90 p-4 text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap select-all">
                      {stats.text.slice(0, 5000)}
                      {stats.text.length > 5000 && '\n\n[... Text truncated in preview, click "Download TXT" to read the complete document ...]'}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
