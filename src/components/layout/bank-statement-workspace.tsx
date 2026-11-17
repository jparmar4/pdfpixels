'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Download,
  RotateCcw,
  FileSpreadsheet,
  FileText,
  Loader2,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Copy,
  Search,
  ArrowUpDown,
  HelpCircle,
  Columns3,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { ReconciliationGrid, type ReconciliationRow } from './reconciliation-grid';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useActiveTool } from '@/hooks/use-active-tool';
import { useConsumeChainedFile } from '@/hooks/use-consume-chained-file';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { ResultScreenAd, SmartlinkButton } from '@/components/ads/ad-banner';
import { triggerDownloadWithSmartlink } from '@/lib/ads-config';
import { useAppStore } from '@/store/app-store';
import { toast } from 'sonner';

interface Transaction {
  date: string;
  description: string;
  debit: string;
  credit: string;
  balance: string;
}

type ExportFormatId = 'xlsx' | 'quickbooks-3col' | 'quickbooks-4col' | 'xero' | 'wave' | 'csv';

const EXPORT_PRESETS: Array<{ id: ExportFormatId; label: string; schema: string; badge?: string }> = [
  { id: 'xlsx', label: 'Standard Excel (.xlsx)', schema: 'Date | Description | Debit | Credit | Balance + =SUM()', badge: 'Excel' },
  { id: 'quickbooks-3col', label: 'QuickBooks Online (3-Col CSV)', schema: 'Date, Description, Amount (+/-)' },
  { id: 'quickbooks-4col', label: 'QuickBooks Desktop/Online (4-Col CSV)', schema: 'Date, Description, Credit, Debit' },
  { id: 'xero', label: 'Xero Accounting CSV', schema: '*Date, *Amount, Payee, Description' },
  { id: 'wave', label: 'Wave Accounting CSV', schema: 'Date, Description, Amount' },
  { id: 'csv', label: 'Universal 5-Column CSV', schema: 'Date, Description, Debit, Credit, Balance' },
];

export function BankStatementWorkspace() {
  const { activeTool, uploadedFile, isProcessing, setIsProcessing, setProgress, reset } = useActiveTool();
  const setUploadedFile = useAppStore((s) => s.setUploadedFile);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [exportFormat, setExportFormat] = useState<ExportFormatId>('xlsx');
  const [visibleCols, setVisibleCols] = useState({
    date: true,
    description: true,
    debit: true,
    credit: true,
    balance: true,
  });
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<{ message: string; isScanned?: boolean } | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [pageLimit, setPageLimit] = useState<number>(25);
  const [copied, setCopied] = useState<boolean>(false);

  useConsumeChainedFile(
    (chained) => {
      setUploadedFile(chained);
    },
    (chained) => Boolean(chained.type === 'application/pdf' || chained.name.toLowerCase().endsWith('.pdf')),
  );

  // When file is uploaded, auto-inspect financial rows cleanly in client preview
  useEffect(() => {
    if (!uploadedFile) {
      const t = window.setTimeout(() => {
        setTransactions([]);
        setErrorState(null);
        setSearchTerm('');
      }, 0);
      return () => window.clearTimeout(t);
    }

    let active = true;
    (async () => {
      setIsProcessing(true);
      setErrorState(null);
      setProgress(0);

      try {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('format', 'json');

        const { fetchWithUploadProgress } = await import('@/lib/upload-with-progress');
        const res = await fetchWithUploadProgress('/api/pdf/bank-statement-to-excel', formData, setProgress);

        setProgress(85);
        const data = await res.json().catch(() => ({ error: 'Failed to read statement' }));

        if (!res.ok) {
          throw {
            message: data.error || 'Failed to parse financial transactions',
            isScanned: Boolean(data.isScannedPdf || data.failure === 'empty' || data.failure === 'scanned_pdf'),
          };
        }

        if (active) {
          const rows: Transaction[] = data.transactions || [];
          setTransactions(rows);
          setProgress(100);
          if (rows.length > 0) {
            toast.success(`Extracted ${rows.length} transaction rows ready for inspection!`);
          } else {
            setErrorState({
              message: 'No reliable transaction rows found in this document.',
              isScanned: false,
            });
          }
        }
      } catch (err) {
        if (active) {
          const typedErr = err as { message?: string; isScanned?: boolean };
          const msg = typedErr?.message || 'Could not parse bank statement';
          setErrorState({ message: msg, isScanned: Boolean(typedErr?.isScanned) });
          toast.error(msg);
        }
      } finally {
        if (active) setIsProcessing(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [uploadedFile, setIsProcessing, setProgress]);

  const handleReset = useCallback(() => {
    reset();
    setTransactions([]);
    setErrorState(null);
    setSearchTerm('');
    setPageLimit(25);
  }, [reset]);

  const liveTotals = useMemo(() => {
    let debits = 0;
    let credits = 0;
    for (const t of transactions) {
      if (t.debit) debits += Number(t.debit) || 0;
      if (t.credit) credits += Number(t.credit) || 0;
    }
    return {
      totalDebits: Number(debits.toFixed(2)),
      totalCredits: Number(credits.toFixed(2)),
      netChange: Number((credits - debits).toFixed(2)),
      totalRows: transactions.length,
    };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions;
    const q = searchTerm.toLowerCase();
    return transactions.filter(
      (t) =>
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.date && t.date.toLowerCase().includes(q)) ||
        (t.debit && t.debit.includes(q)) ||
        (t.credit && t.credit.includes(q)) ||
        (t.balance && t.balance.includes(q)),
    );
  }, [transactions, searchTerm]);

  const handleSwapDebitCredit = (index: number) => {
    setTransactions((prev) =>
      prev.map((row, i) => (i === index ? { ...row, debit: row.credit, credit: row.debit } : row)),
    );
    toast.success('Swapped Debit <-> Credit for selected transaction');
  };

  const handleInvertAll = () => {
    setTransactions((prev) =>
      prev.map((row) => ({
        ...row,
        debit: row.credit,
        credit: row.debit,
      })),
    );
    toast.success('Swapped Debit <-> Credit across all transactions');
  };

  const handleDeleteRow = (index: number) => {
    setTransactions((prev) => prev.filter((_, i) => i !== index));
    toast.info('Transaction removed from export preview');
  };

  const handleCopyTsv = async () => {
    if (transactions.length === 0) return;
    const header = 'Date\tDescription\tWithdrawal (Debit)\tDeposit (Credit)\tBalance\n';
    const body = transactions
      .map((t) => `${t.date}\t${t.description}\t${t.debit}\t${t.credit}\t${t.balance}`)
      .join('\n');

    try {
      await navigator.clipboard.writeText(header + body);
      setCopied(true);
      toast.success('Table copied to clipboard! Ready to paste into Excel or Google Sheets.');
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Could not access clipboard');
    }
  };

  const handleDownload = async (format: ExportFormatId = exportFormat) => {
    if (!uploadedFile || transactions.length === 0) return;
    setIsExporting(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('format', format);
      formData.append('transactions', JSON.stringify(transactions));

      const { fetchWithUploadProgress } = await import('@/lib/upload-with-progress');
      const res = await fetchWithUploadProgress('/api/pdf/bank-statement-to-excel', formData, setProgress);

      if (!res.ok) throw new Error(`Export to ${format.toUpperCase()} failed`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const baseName = uploadedFile.name.replace(/\.pdf$/i, '');
      const ext = format === 'xlsx' ? 'xlsx' : 'csv';
      const suffixMap: Record<ExportFormatId, string> = {
        xlsx: '',
        'quickbooks-3col': '-quickbooks-3col',
        'quickbooks-4col': '-quickbooks-4col',
        xero: '-xero',
        wave: '-wave',
        csv: '',
      };
      const fileName = `${baseName}${suffixMap[format]}.${ext}`;
      const presetInfo = EXPORT_PRESETS.find((p) => p.id === format);

      triggerDownloadWithSmartlink(
        () => {
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.setTimeout(() => URL.revokeObjectURL(url), 1000);
          toast.success(`Downloaded ${presetInfo?.label || format.toUpperCase()}!`);
        },
        {
          originalSize: uploadedFile.size,
          processedSize: blob.size,
          formatLabel: format === 'xlsx' ? 'XLSX' : 'CSV',
          fileName,
        },
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to download ${format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  const activePreset = EXPORT_PRESETS.find((p) => p.id === exportFormat) ?? EXPORT_PRESETS[0];

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
      <ToolPageHeader
        title={activeTool?.name || 'Bank Statement to Excel & QuickBooks Converter'}
        description={
          activeTool?.description ||
          'Inspect extracted Date, Description, Debit, Credit, and Balance columns interactively before exporting clean Excel (.xlsx), QuickBooks 3-Col/4-Col CSV, Xero CSV, or Wave CSV.'
        }
        icon={<FileSpreadsheet className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'PDF bank statements · checking, savings, business & credit cards (Chase, BofA, Capital One, Amex, Barclays, RBC & more)',
          'Interactive pre-download column preview + instant row edit/swap before export',
          'Exports to Excel (.xlsx), QuickBooks Online 3-Col & 4-Col CSV, Xero CSV, and Wave CSV',
        ]}
      />

      {!uploadedFile ? (
        <div className="mt-8">
          <FileUpload accept=".pdf,application/pdf" />
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {errorState && (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-5">
              <div className="flex items-start gap-3.5">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div className="space-y-2 flex-1">
                  <h4 className="font-semibold text-sm text-foreground">
                    {errorState.isScanned
                      ? 'Scanned PDF Detected (No Selectable Text)'
                      : 'Unable to Extract Transactions Automatically'}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {errorState.isScanned
                      ? 'This statement is an image scan without embedded text. Run OCR PDF first to make rows selectable, or upload an electronic PDF downloaded from online banking.'
                      : errorState.message}
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    {errorState.isScanned && (
                      <Link href="/tools/ocr-pdf">
                        <Button size="sm" className="gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs shadow-sm">
                          <Sparkles className="w-3.5 h-3.5" />
                          Open in OCR PDF
                        </Button>
                      </Link>
                    )}
                    <Button size="sm" variant="outline" onClick={handleReset} className="text-xs gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Upload Different File
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Export Preset Selector & Primary CTA */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-semibold text-base truncate max-w-[280px]">
                    {uploadedFile.name}
                  </span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {transactions.length} Rows
                  </Badge>
                  {transactions.length > 0 && (
                    <Badge variant="secondary" className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Ready to Export
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose your target accounting schema below, inspect detected columns, and download in 1 click.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  size="sm"
                  onClick={() => void handleDownload(exportFormat)}
                  disabled={isExporting || transactions.length === 0}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50"
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Download {activePreset.label}
                </Button>
                <SmartlinkButton className="min-h-9 py-1.5 text-xs rounded-xl" />
                <Button size="sm" variant="ghost" onClick={handleReset} className="text-xs text-muted-foreground">
                  <RotateCcw className="w-4 h-4 mr-1" /> Start Over
                </Button>
              </div>
            </div>

            {transactions.length > 0 && (
              <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-border/50">
                {EXPORT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setExportFormat(preset.id)}
                    className={`rounded-xl border p-2.5 text-left transition-all ${
                      exportFormat === preset.id
                        ? 'border-primary bg-primary/8 ring-1 ring-primary'
                        : 'border-border/60 bg-background/60 hover:border-border'
                    }`}
                  >
                    <p className="text-xs font-bold text-foreground truncate">{preset.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{preset.schema}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {transactions.length > 0 && (
            <ResultScreenAd
              refreshKey={`${uploadedFile.name}-${transactions.length}`}
              originalSize={uploadedFile.size}
              formatLabel={exportFormat === 'xlsx' ? 'XLSX' : 'CSV'}
              fileName={`${uploadedFile.name.replace(/\.pdf$/i, '')}.${exportFormat === 'xlsx' ? 'xlsx' : 'csv'}`}
            />
          )}

          {/* Financial Summary Cards */}
          {transactions.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="bg-card border rounded-xl p-4 shadow-sm">
                <span className="text-xs font-medium text-muted-foreground">Total Rows</span>
                <div className="text-lg font-bold font-mono text-foreground mt-1">
                  {transactions.length}
                </div>
                <span className="text-[11px] text-muted-foreground">Extracted entries</span>
              </div>

              <div className="bg-card border rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Total Withdrawals</span>
                  <ArrowDownRight className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
                  {liveTotals.totalDebits > 0 ? liveTotals.totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}
                </div>
                <span className="text-[11px] text-muted-foreground">Debits (-)</span>
              </div>

              <div className="bg-card border rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Total Deposits</span>
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  {liveTotals.totalCredits > 0 ? liveTotals.totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}
                </div>
                <span className="text-[11px] text-muted-foreground">Credits (+)</span>
              </div>

              <div className="bg-card border rounded-xl p-4 shadow-sm">
                <span className="text-xs font-medium text-muted-foreground">Net Activity</span>
                <div
                  className={`text-lg font-bold font-mono mt-1 ${
                    liveTotals.netChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {liveTotals.netChange >= 0 ? '+' : ''}
                  {liveTotals.netChange.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[11px] text-muted-foreground">Credits minus debits</span>
              </div>
            </div>
          )}

          {/* Interactive Column Inspector & Search Controls */}
          {transactions.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search payees, dates, amounts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border/60 bg-card px-2 py-1 text-[11px]">
                  <Columns3 className="w-3.5 h-3.5 text-muted-foreground mr-1" />
                  {(['date', 'description', 'debit', 'credit', 'balance'] as const).map((colKey) => (
                    <button
                      key={colKey}
                      type="button"
                      onClick={() => setVisibleCols((prev) => ({ ...prev, [colKey]: !prev[colKey] }))}
                      className={`px-2 py-0.5 rounded-md font-medium capitalize transition-colors ${
                        visibleCols[colKey] ? 'bg-primary/12 text-primary' : 'text-muted-foreground line-through'
                      }`}
                    >
                      {colKey}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleInvertAll} className="text-xs h-9 gap-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Invert Debits/Credits
                </Button>
                <Button size="sm" variant="outline" onClick={handleCopyTsv} className="text-xs h-9 gap-1.5">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy TSV'}
                </Button>
              </div>
            </div>
          )}

          {/* Editable Reconciliation Grid & SVG Cash-Flow Summary */}
          <ReconciliationGrid
            transactions={transactions as ReconciliationRow[]}
            onChangeTransactions={(next) => setTransactions(next)}
            presetLabel={activePreset.label}
            visibleCols={visibleCols}
            searchTerm={searchTerm}
            pageLimit={pageLimit}
            onToggleLimit={() => setPageLimit((prev) => (prev === 25 ? filteredTransactions.length : 25))}
            onSwapRow={handleSwapDebitCredit}
            onDeleteRow={handleDeleteRow}
            isLoading={isProcessing}
            errorFallbackText={errorState ? 'Could not extract transactions. See alert above for suggestions.' : undefined}
          />

          {/* Quick Individual Format Strip */}
          {transactions.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                Inspect detected columns, toggle/swap Debit &amp; Credit rows above, or export a quick format:
              </span>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => void handleDownload('xlsx')}>
                  <FileSpreadsheet className="w-3 h-3 mr-1" /> Excel (.xlsx)
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => void handleDownload('quickbooks-3col')}>
                  <FileText className="w-3 h-3 mr-1" /> QBO 3-Col
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => void handleDownload('quickbooks-4col')}>
                  QBO 4-Col
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => void handleDownload('xero')}>
                  Xero CSV
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => void handleDownload('wave')}>
                  Wave CSV
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
