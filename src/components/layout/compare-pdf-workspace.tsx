'use client';

import { useState, useCallback } from 'react';
import { RotateCcw, ArrowLeftRight, FileText, Plus, Minus, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { toast } from 'sonner';

interface DiffItem {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

interface CompareStats {
  additions: number;
  deletions: number;
  unchanged: number;
  similarity: number;
}

export function ComparePdfWorkspace() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [diffItems, setDiffItems] = useState<DiffItem[]>([]);
  const [stats, setStats] = useState<CompareStats | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleReset = useCallback(() => {
    setFileA(null);
    setFileB(null);
    setDiffItems([]);
    setStats(null);
    setCopied(false);
  }, []);

  const runCompare = async () => {
    if (!fileA || !fileB) {
      toast.error('Please select both the Original PDF and the Revised PDF to compare');
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('fileA', fileA);
      formData.append('fileB', fileB);

      const res = await fetch('/api/pdf/compare', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Comparison failed' }));
        throw new Error(err.error || 'Failed to compare documents');
      }

      const data = await res.json();
      setDiffItems(data.diff || []);
      setStats(data.stats || null);
      toast.success(`Comparison complete! Found ${data.stats?.additions || 0} additions and ${data.stats?.deletions || 0} deletions.`);
    } catch (err: any) {
      toast.error(err.message || 'Comparison failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyDiff = () => {
    if (diffItems.length === 0) return;
    const text = diffItems
      .map((d) => {
        if (d.type === 'added') return `+ ${d.text}`;
        if (d.type === 'removed') return `- ${d.text}`;
        return `  ${d.text}`;
      })
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Redline diff copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
      <ToolPageHeader
        title="Compare PDF Documents Online"
        description="Compare two versions of a contract or PDF side-by-side to highlight text differences, clause additions, and deletions with redline diff."
        icon={<ArrowLeftRight className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'Upload 2 PDF documents · Original (Baseline) vs. Revised',
          'Word-level and sentence-level redline highlighting (Green/Red)',
          '100% private in-memory document comparison',
        ]}
      />

      <div className="mt-8 space-y-6">
        {/* Upload Dual Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* File A: Original */}
          <div className="bg-card border-2 border-dashed rounded-2xl p-6 text-center space-y-3 hover:border-primary/50 transition-colors">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              1. Original PDF (Baseline)
            </span>
            {fileA ? (
              <div className="p-4 bg-muted/40 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-5 h-5 text-primary shrink-0" />
                  <span className="font-medium text-xs truncate">{fileA.name}</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => { setFileA(null); setStats(null); setDiffItems([]); }} className="text-xs text-muted-foreground h-7">
                  Change
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer block py-4">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFileA(f);
                  }}
                />
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2 text-muted-foreground">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-foreground block">Select Original Document</span>
                <span className="text-[11px] text-muted-foreground">PDF up to 25 MB</span>
              </label>
            )}
          </div>

          {/* File B: Revised */}
          <div className="bg-card border-2 border-dashed rounded-2xl p-6 text-center space-y-3 hover:border-primary/50 transition-colors">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              2. Revised PDF (Modified Version)
            </span>
            {fileB ? (
              <div className="p-4 bg-muted/40 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="font-medium text-xs truncate">{fileB.name}</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => { setFileB(null); setStats(null); setDiffItems([]); }} className="text-xs text-muted-foreground h-7">
                  Change
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer block py-4">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFileB(f);
                  }}
                />
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2 text-muted-foreground">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-foreground block">Select Revised Document</span>
                <span className="text-[11px] text-muted-foreground">PDF up to 25 MB</span>
              </label>
            )}
          </div>
        </div>

        {/* Action Button */}
        {fileA && fileB && diffItems.length === 0 && (
          <div className="text-center pt-2">
            <Button
              size="lg"
              onClick={runCompare}
              disabled={isProcessing}
              className="gap-2 px-8 font-semibold shadow-sm"
            >
              <ArrowLeftRight className="w-4 h-4" />
              {isProcessing ? 'Auditing & Comparing Text...' : 'Compare PDF Documents'}
            </Button>
          </div>
        )}

        {/* Results & Redline Diff Display */}
        {stats && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">Compares selectable text line by line. Image, layout, and formatting changes are not included in the similarity score.</p>
            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-card border rounded-xl p-4 text-center">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">Similarity</span>
                <span className="text-2xl font-bold text-foreground font-mono">{stats.similarity}%</span>
              </div>
              <div className="bg-card border rounded-xl p-4 text-center">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">Additions</span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">+{stats.additions}</span>
              </div>
              <div className="bg-card border rounded-xl p-4 text-center">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">Deletions</span>
                <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">-{stats.deletions}</span>
              </div>
              <div className="bg-card border rounded-xl p-4 text-center">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">Unchanged</span>
                <span className="text-2xl font-bold text-muted-foreground font-mono">{stats.unchanged}</span>
              </div>
            </div>

            {/* Redline Content Area */}
            <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                <span className="font-semibold text-xs">Redline Text Comparison View</span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopyDiff} className="h-8 gap-1.5 text-xs">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy Redline'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleReset} className="h-8 text-xs text-muted-foreground">
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Clear
                  </Button>
                </div>
              </div>

              <div className="p-6 max-h-[500px] overflow-y-auto font-mono text-xs space-y-1.5 bg-background select-text">
                {diffItems.map((item, idx) => {
                  if (item.type === 'added') {
                    return (
                      <div key={idx} className="p-2 rounded bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-l-4 border-emerald-500 flex items-start gap-2">
                        <Plus className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{item.text}</span>
                      </div>
                    );
                  }
                  if (item.type === 'removed') {
                    return (
                      <div key={idx} className="p-2 rounded bg-rose-500/10 text-rose-800 dark:text-rose-300 border-l-4 border-rose-500 line-through opacity-80 flex items-start gap-2">
                        <Minus className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{item.text}</span>
                      </div>
                    );
                  }
                  return (
                    <div key={idx} className="px-2 py-1 text-muted-foreground leading-relaxed">
                      {item.text}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
