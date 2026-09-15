'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Download,
  RotateCcw,
  FileSpreadsheet,
  FileText,
  Table as TableIcon,
  Loader2,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Copy,
  Search,
  ArrowUpDown,
  Trash2,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { toast } from 'sonner';

interface Transaction {
  date: string;
  description: string;
  debit: string;
  credit: string;
  balance: string;
}

interface StatementSummary {
  totalDebits: number;
  totalCredits: number;
  netChange: number;
  totalRows: number;
  openingBalance?: number;
  closingBalance?: number;
}

export function BankStatementWorkspace() {
  const { uploadedFile, isProcessing, setIsProcessing, setProgress, reset } = useAppStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [_summary, setSummary] = useState<StatementSummary | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<{ message: string; isScanned?: boolean } | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [pageLimit, setPageLimit] = useState<number>(25);
  const [copied, setCopied] = useState<boolean>(false);

  // When file is uploaded, auto-inspect financial rows
  useEffect(() => {
    if (!uploadedFile) {
      setTransactions([]);
      setSummary(null);
      setErrorState(null);
      setSearchTerm('');
      return;
    }

    let active = true;
    (async () => {
      setIsProcessing(true);
      setErrorState(null);
      setProgress(25);

      try {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('format', 'json');

        setProgress(50);
        const res = await fetch('/api/pdf/bank-statement-to-excel', {
          method: 'POST',
          body: formData,
        });

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
          setSummary(data.summary || null);
          setProgress(100);
          if (rows.length > 0) {
            toast.success(`Extracted ${rows.length} transaction rows from statement!`);
          } else {
            setErrorState({
              message: 'No reliable transaction rows found in this document.',
              isScanned: false,
            });
          }
        }
      } catch (err: any) {
        if (active) {
          const msg = err?.message || 'Could not parse bank statement';
          const isScanned = Boolean(err?.isScanned);
          setErrorState({ message: msg, isScanned });
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
    setSummary(null);
    setErrorState(null);
    setSearchTerm('');
    setPageLimit(25);
  }, [reset]);

  // Live financial totals based on current transactions
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

  // Filtered transactions for search
  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions;
    const q = searchTerm.toLowerCase();
    return transactions.filter(
      t =>
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.date && t.date.toLowerCase().includes(q)) ||
        (t.debit && t.debit.includes(q)) ||
        (t.credit && t.credit.includes(q)) ||
        (t.balance && t.balance.includes(q))
    );
  }, [transactions, searchTerm]);

  // Swap debit and credit for an individual row
  const handleSwapDebitCredit = (index: number) => {
    setTransactions(prev =>
      prev.map((row, i) =>
        i === index ? { ...row, debit: row.credit, credit: row.debit } : row,
      ),
    );
    toast.success('Swapped Debit ↔ Credit for selected transaction');
  };

  // Invert debit and credit for all rows
  const handleInvertAll = () => {
    setTransactions(prev =>
      prev.map(row => ({
        ...row,
        debit: row.credit,
        credit: row.debit,
      }))
    );
    toast.success('Swapped Debit ↔ Credit for all transactions');
  };

  // Delete an unwanted row (e.g., junk or subtotal)
  const handleDeleteRow = (index: number) => {
    setTransactions(prev => prev.filter((_, i) => i !== index));
    toast.info('Transaction removed from export');
  };

  // Copy table to clipboard as Tab-Separated Values (TSV)
  const handleCopyTsv = async () => {
    if (transactions.length === 0) return;
    const header = 'Date\tDescription\tWithdrawal (Debit)\tDeposit (Credit)\tBalance\n';
    const body = transactions
      .map(t => `${t.date}\t${t.description}\t${t.debit}\t${t.credit}\t${t.balance}`)
      .join('\n');

    try {
      await navigator.clipboard.writeText(header + body);
      setCopied(true);
      toast.success('Table copied to clipboard! Ready to paste into Excel or Google Sheets.');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Could not access clipboard');
    }
  };

  // Download XLSX or CSV with current verified/edited state
  const handleDownload = async (format: 'xlsx' | 'csv') => {
    if (!uploadedFile || transactions.length === 0) return;
    setIsExporting(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('format', format);
      // Pass the reviewed/edited transactions so user changes are saved
      formData.append('transactions', JSON.stringify(transactions));

      const res = await fetch('/api/pdf/bank-statement-to-excel', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`Export to ${format.toUpperCase()} failed`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = uploadedFile.name.replace(/\.pdf$/i, '');
      a.download = `${baseName}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${format.toUpperCase()} successfully!`);
    } catch (err: any) {
      toast.error(err.message || `Failed to download ${format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
      <ToolPageHeader
        title="Bank Statement to Excel Converter"
        description="Extract transaction dates, descriptions, debits, credits, and running balances from PDF bank statements into Microsoft Excel (.xlsx) and CSV."
        icon={<FileSpreadsheet className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'PDF bank statements · checking, savings, credit cards',
          'Formatted Excel (.xlsx) with SUM formulas & universal CSV export',
          '100% confidential · encrypted processing with immediate deletion',
        ]}
      />

      {!uploadedFile ? (
        <div className="mt-8">
          <FileUpload accept=".pdf,application/pdf" />
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {/* Error & Scanned PDF Notice Banner */}
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
                      ? 'This statement is an image or flattened scan. Standard text extraction cannot read pixel images. Convert this document with our OCR tool first to recognize characters, or upload an electronic digital PDF from your bank.'
                      : errorState.message}
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    {errorState.isScanned && (
                      <Link href="/tools/image-to-text">
                        <Button size="sm" className="gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs shadow-sm">
                          <Sparkles className="w-3.5 h-3.5" />
                          Open in OCR Tool
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

          {/* Action Header Card */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-base truncate max-w-[280px]">
                  {uploadedFile.name}
                </span>
                <Badge variant="outline" className="font-mono text-xs">
                  {transactions.length} Transactions
                </Badge>
                {transactions.length > 0 && (
                  <Badge variant="secondary" className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200">
                    Ready to Export
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Parsed columns: Date, Payee / Description, Withdrawals (Debit), Deposits (Credit), Balance.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                size="sm"
                onClick={() => handleDownload('xlsx')}
                disabled={isExporting || transactions.length === 0}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download Excel (.XLSX)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload('csv')}
                disabled={isExporting || transactions.length === 0}
                className="gap-2 disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                Download CSV
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleReset}
                className="text-xs text-muted-foreground"
              >
                <RotateCcw className="w-4 h-4 mr-1" /> Start Over
              </Button>
            </div>
          </div>

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
                    liveTotals.netChange >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {liveTotals.netChange >= 0 ? '+' : ''}
                  {liveTotals.netChange.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[11px] text-muted-foreground">Credits minus debits</span>
              </div>
            </div>
          )}

          {/* Table Controls & Search */}
          {transactions.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search payees, dates, amounts..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleInvertAll}
                  className="text-xs h-9 gap-1.5"
                  title="Invert all debits and credits across the table"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Invert Debits/Credits
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyTsv}
                  className="text-xs h-9 gap-1.5"
                  title="Copy table to clipboard for Excel / Google Sheets"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </Button>
              </div>
            </div>
          )}

          {/* Transactions Preview Table */}
          <div className="border rounded-2xl bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">Extracted Transactions Preview</span>
              </div>
              {filteredTransactions.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Showing {Math.min(pageLimit, filteredTransactions.length)} of {filteredTransactions.length} rows</span>
                  {filteredTransactions.length > 25 && (
                    <button
                      onClick={() => setPageLimit(prev => (prev === 25 ? filteredTransactions.length : 25))}
                      className="text-primary hover:underline font-medium ml-1"
                    >
                      {pageLimit === 25 ? 'Show All' : 'Show 25'}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="overflow-x-auto max-h-[520px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted/50 sticky top-0 border-b z-10">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground w-28">Date</th>
                    <th className="p-3 font-semibold text-muted-foreground">Description / Payee</th>
                    <th className="p-3 font-semibold text-muted-foreground text-right w-28">Withdrawal (-)</th>
                    <th className="p-3 font-semibold text-muted-foreground text-right w-28">Deposit (+)</th>
                    <th className="p-3 font-semibold text-muted-foreground text-right w-28">Balance</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTransactions.slice(0, pageLimit).map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/20 transition-colors group">
                      <td className="p-3 font-mono text-muted-foreground whitespace-nowrap">{row.date || '—'}</td>
                      <td className="p-3 font-medium text-foreground max-w-sm break-words">{row.description || '—'}</td>
                      <td className="p-3 text-right font-mono text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        {row.debit ? Number(row.debit).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {row.credit ? Number(row.credit).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}
                      </td>
                      <td className="p-3 text-right font-mono text-foreground font-semibold whitespace-nowrap">
                        {row.balance ? Number(row.balance).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}
                      </td>
                      <td className="p-2 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleSwapDebitCredit(idx)}
                            title="Swap Debit ↔ Credit"
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRow(idx)}
                            title="Remove row"
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-muted-foreground">
                        {isProcessing ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            <span>Analyzing and extracting statement transactions...</span>
                          </div>
                        ) : errorState ? (
                          <span>Could not extract transactions. See alert above for suggestions.</span>
                        ) : (
                          <span>No transactions detected.</span>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            Review every row against your original bank statement. You can search, swap debits and credits on any row, or invert all columns before downloading your formatted Excel file.
          </p>
        </div>
      )}
    </div>
  );
}

