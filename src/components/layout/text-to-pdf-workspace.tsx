'use client';

import { useCallback, useState } from 'react';
import { Download, FileText, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useActiveTool } from '@/hooks/use-active-tool';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { toast } from 'sonner';

export function TextToPDFWorkspace() {
  const { activeTool, isProcessing, setIsProcessing, setProgress, reset } = useActiveTool();
  const [text, setText] = useState('');
  const [pageSize, setPageSize] = useState('a4');
  const [font, setFont] = useState('times');
  const [fontSize, setFontSize] = useState('11');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState<string>('text.pdf');

  const handleGenerate = useCallback(async () => {
    if (!text.trim()) {
      toast.error('Enter or paste some text first');
      return;
    }
    setIsProcessing(true);
    setProgress(15);
    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('pageSize', pageSize);
      formData.append('font', font);
      formData.append('fontSize', fontSize);
      setProgress(60);

      const res = await fetch('/api/pdf/from-text', { method: 'POST', body: formData });
      setProgress(90);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'PDF generation failed' }));
        throw new Error(err.error || 'PDF generation failed');
      }
      const blob = await res.blob();
      setResultUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return URL.createObjectURL(blob);
      });
      setResultName('text.pdf');
      setProgress(100);
      toast.success('PDF created â€” download it below');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'PDF generation failed');
    } finally {
      setIsProcessing(false);
    }
  }, [text, pageSize, font, fontSize, setIsProcessing, setProgress]);

  const handleReset = useCallback(() => {
    reset();
    setText('');
    setResultUrl(null);
  }, [reset]);

  const download = () => {
    if (!resultUrl) return;
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = resultName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Download started');
  };

  if (!activeTool) return null;

  const charCount = text.length;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        icon={<FileText className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'Paste up to 400K characters Â· output up to 500 pages',
          'Standard PDF fonts: Times (serif), Helvetica, Courier (monospace)',
          'Line breaks and spacing are preserved; rich formatting is not',
        ]}
      />

      <div className="mt-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-border bg-card overflow-hidden focus-within:border-primary/40 transition-colors">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={18}
              placeholder="Type or paste your text here â€” notes, transcripts, lists, codeâ€¦"
              aria-label="Text to convert to PDF"
              className="w-full bg-transparent font-mono text-sm leading-relaxed outline-none resize-y p-5 text-foreground/90"
            />
            <div className="px-5 py-2.5 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>{charCount.toLocaleString('en-US')} characters Â· ~{Math.max(1, Math.ceil(charCount / 3000)) || 0} page(s)</span>
              {text && (
                <button
                  type="button"
                  onClick={() => setText('')}
                  className="inline-flex items-center gap-1 hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Clear text
                </button>
              )}
            </div>
          </div>

          {resultUrl && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">PDF ready</p>
                <p className="text-sm text-muted-foreground">Paginated with your page and font settings.</p>
              </div>
              <Button onClick={download} className="gap-2 btn-premium rounded-xl">
                <Download className="w-4 h-4" /> Download PDF
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden shadow-premium">
            <div className="p-5 border-b border-border/40 bg-gradient-to-r from-primary/10 to-transparent">
              <h3 className="font-bold tracking-tight text-foreground">Page settings</h3>
            </div>
            <div className="p-5 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="ttp-page-size">Page size</Label>
                <Select value={pageSize} onValueChange={setPageSize}>
                  <SelectTrigger id="ttp-page-size" aria-label="Page size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a4">A4</SelectItem>
                    <SelectItem value="letter">Letter</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ttp-font">Font</Label>
                <Select value={font} onValueChange={setFont}>
                  <SelectTrigger id="ttp-font" aria-label="Font">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="times">Times (serif)</SelectItem>
                    <SelectItem value="helvetica">Helvetica (sans)</SelectItem>
                    <SelectItem value="courier">Courier (mono)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ttp-font-size">Text size: {fontSize}pt</Label>
                <input
                  id="ttp-font-size"
                  type="range"
                  min={8}
                  max={20}
                  step={1}
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className="w-full accent-primary"
                  aria-label="Font size in points"
                />
              </div>

              <Button
                className="w-full btn-premium py-6 rounded-xl font-bold shadow-xl shadow-primary/20"
                onClick={handleGenerate}
                disabled={isProcessing || !text.trim()}
                size="lg"
              >
                {isProcessing ? 'Generatingâ€¦' : 'Create PDF'}
              </Button>
              <Button variant="outline" className="w-full gap-2 rounded-xl" onClick={handleReset}>
                <RotateCcw className="w-4 h-4" /> Start Over
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
