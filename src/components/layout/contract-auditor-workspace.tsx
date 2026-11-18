'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CreditCard,
  Download,
  FilePlus2,
  FileSearch,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { ResultScreenAd, SmartlinkButton } from '@/components/ads/ad-banner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { triggerDownloadWithSmartlink } from '@/lib/ads-config';
import {
  auditPdfContractClient,
  generateSampleContractPdf,
  type ContractAuditReport,
  type ContractFinding,
} from '@/lib/contract-auditor';
import { FileUpload } from './file-upload';
import { PrivateModeBadge } from './private-mode-badge';
import { ToolLimitNotice } from './tool-limit-notice';
import { ToolPageHeader } from './tool-page-header';
import { useActiveTool } from '@/hooks/use-active-tool';

export function ContractAuditorWorkspace() {
  const { activeTool, uploadedFile, reset } = useActiveTool();
  const [report, setReport] = useState<ContractAuditReport | null>(null);
  const [filter, setFilter] = useState<'all' | 'risk' | 'payment' | 'date'>('all');
  const [isScanning, setIsScanning] = useState(false);
  const lastAuditedFileRef = useRef<File | null>(null);

  const runAudit = useCallback(async (file: File) => {
    lastAuditedFileRef.current = file;
    setIsScanning(true);
    try {
      const audited = await auditPdfContractClient(file);
      setReport(audited);
      toast.success(`Audited ${audited.pageCount} page(s) completely inside your browser`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to audit PDF contract');
    } finally {
      setIsScanning(false);
    }
  }, []);

  useEffect(() => {
    if (uploadedFile && uploadedFile !== lastAuditedFileRef.current) {
      void runAudit(uploadedFile);
    }
  }, [uploadedFile, runAudit]);

  const handleLoadSample = async () => {
    const sample = await generateSampleContractPdf();
    await runAudit(sample);
  };

  const handleReset = () => {
    lastAuditedFileRef.current = null;
    setReport(null);
    setFilter('all');
    reset();
  };

  const handleDownloadMarkdown = () => {
    if (!report) return;
    const allFindings = [...report.risks, ...report.payments, ...report.dates];
    const md = [
      `# Contract Audit Report — ${report.fileName}`,
      `- Risk Level: **${report.riskLevel}**`,
      `- Pages: ${report.pageCount} · Words: ${report.wordCount} · SHA-256: \`${report.sha256}\``,
      '',
      '## Key Findings',
      ...allFindings.map(
        (f) => `- **[${f.severity.toUpperCase()} · ${f.title}] (Page ${f.pageNumber})**: "${f.matchedValue}" — _${f.guidance}_`,
      ),
    ].join('\n');
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    triggerDownloadWithSmartlink(
      () => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.fileName.replace(/\.pdf$/i, '')}-audit-report.md`;
        a.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      {
        processedSize: blob.size,
        formatLabel: 'Audit MD',
        fileName: `${report.fileName.replace(/\.pdf$/i, '')}-audit-report.md`,
      },
    );
  };

  const visibleFindings: ContractFinding[] = report
    ? filter === 'all'
      ? [...report.risks, ...report.payments, ...report.dates]
      : filter === 'risk'
        ? report.risks
        : filter === 'payment'
          ? report.payments
          : report.dates
    : [];

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl space-y-6">
      <ToolPageHeader
        title={activeTool?.name || 'Private Local PDF Contract Auditor'}
        description={activeTool?.description || 'Extract key contract dates, Net payment terms, and high-risk legal clauses (unlimited liability, auto-renewal, non-compete, IP assignment) 100% locally inside browser memory.'}
        icon={<FileSearch className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />

      <PrivateModeBadge description="Client-Side Attorney Confidentiality: Full multi-page PDF contract parsing and clause risk scoring execute inside your browser with zero server transmission." />

      <ToolLimitNotice
        limits={[
          'PDF contracts, NDAs, MSAs, leases & SOWs up to 100 pages',
          'Extracts Dates, Payment Terms & Risk Clauses locally via pdfjs-dist',
          'Works completely offline — never sends NDA text to third-party APIs',
        ]}
      />

      {!report ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={handleLoadSample} className="gap-1.5 text-xs">
              <FilePlus2 className="w-3.5 h-3.5" />
              Load Sample MSA Contract
            </Button>
          </div>
          <FileUpload accept=".pdf,application/pdf" />
          {isScanning && <p className="text-center text-xs text-muted-foreground">Scanning contract clauses locally...</p>}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-card border rounded-[1.75rem] p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {report.riskLevel === 'Elevated' ? (
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                  ) : report.riskLevel === 'Moderate' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  )}
                  <h2 className="text-lg font-bold text-foreground">
                    Overall Contract Risk: {report.riskLevel}
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  {report.fileName} · {report.pageCount} page(s) · {report.wordCount} words · SHA-256: {report.sha256.slice(0, 16)}...
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={handleDownloadMarkdown} className="btn-premium gap-1.5 text-xs">
                  <Download className="w-3.5 h-3.5" />
                  Export Audit Report (.MD)
                </Button>
                <SmartlinkButton className="min-h-8 py-1 text-xs rounded-xl" />
                <Button size="sm" variant="ghost" onClick={handleReset} className="text-xs gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Audit Another PDF
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`rounded-xl border p-3 text-left transition-all ${filter === 'all' ? 'border-primary bg-primary/10' : 'bg-background/70'}`}
              >
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">All Findings</span>
                <span className="font-mono text-lg font-bold text-foreground">
                  {report.risks.length + report.payments.length + report.dates.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setFilter('risk')}
                className={`rounded-xl border p-3 text-left transition-all ${filter === 'risk' ? 'border-primary bg-primary/10' : 'bg-background/70'}`}
              >
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-rose-500" /> Risk Clauses
                </span>
                <span className="font-mono text-lg font-bold text-rose-600">{report.risks.length}</span>
              </button>
              <button
                type="button"
                onClick={() => setFilter('payment')}
                className={`rounded-xl border p-3 text-left transition-all ${filter === 'payment' ? 'border-primary bg-primary/10' : 'bg-background/70'}`}
              >
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-amber-500" /> Payment Terms
                </span>
                <span className="font-mono text-lg font-bold text-amber-600">{report.payments.length}</span>
              </button>
              <button
                type="button"
                onClick={() => setFilter('date')}
                className={`rounded-xl border p-3 text-left transition-all ${filter === 'date' ? 'border-primary bg-primary/10' : 'bg-background/70'}`}
              >
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-sky-500" /> Key Dates
                </span>
                <span className="font-mono text-lg font-bold text-sky-600">{report.dates.length}</span>
              </button>
            </div>
          </div>

          <div className="bg-card border rounded-[1.75rem] p-6 shadow-sm space-y-3">
            {visibleFindings.length > 0 ? (
              visibleFindings.map((item) => (
                <div key={item.id} className="rounded-xl border border-border/60 bg-background/70 p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        className={`text-[10px] uppercase ${
                          item.severity === 'high'
                            ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                            : item.severity === 'medium'
                              ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
                              : 'bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/30'
                        }`}
                      >
                        {item.severity} · {item.category}
                      </Badge>
                      <span className="text-sm font-bold text-foreground">{item.title}</span>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground">Page {item.pageNumber}</span>
                  </div>
                  <p className="text-xs font-mono text-foreground bg-muted/40 rounded-lg px-3 py-2">
                    &ldquo;{item.excerpt}&rdquo;
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Reviewer Note:</strong> {item.guidance}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No clauses matched in this category. Note scanned PDFs without a text layer should run through OCR PDF first.</p>
            )}
          </div>

          <ResultScreenAd
            refreshKey={report.sha256}
            originalSize={report.wordCount * 6}
            formatLabel="Audit MD"
            fileName={`${report.fileName.replace(/\.pdf$/i, '')}-audit-report.md`}
          />
        </div>
      )}
    </div>
  );
}
