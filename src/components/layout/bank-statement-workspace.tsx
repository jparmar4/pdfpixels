'use client';

import { useState, useCallback, useEffect } from 'react';
import { Download, RotateCcw, FileSpreadsheet, FileText, Table as TableIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

export function BankStatementWorkspace() {
  const { uploadedFile, isProcessing, setIsProcessing, setProgress, reset } = useAppStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      if (downloadUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  // When file is uploaded, auto-inspect financial rows
  useEffect(() => {
    if (!uploadedFile) {
      setTransactions([]);
      setTotalRows(0);
      setDownloadUrl(null);
      return;
    }

    let active = true;
    (async () => {
      setIsProcessing(true);
      setProgress(25);

      try {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('format', 'json');

        setProgress(60);
        const res = await fetch('/api/pdf/bank-statement-to-excel', {
          method: 'POST',
          body: formData,
        });

        setProgress(90);
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Failed to parse statement' }));
          throw new Error(err.error || 'Failed to parse financial transactions');
        }

        const data = await res.json();
        if (active) {
          setTransactions(data.transactions || []);
          setTotalRows(data.totalRows || 0);
          setProgress(100);
          toast.success(`Identified ${data.totalRows || 0} transaction rows in statement!`);
        }
      } catch (err: any) {
        if (active) {
          toast.error(err.message || 'Could not parse bank statement');
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
    setTotalRows(0);
    setDownloadUrl(null);
  }, [reset]);

  const handleDownload = async (format: 'xlsx' | 'csv') => {
    if (!uploadedFile) return;
    setIsExporting(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('format', format);

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
        description="Extract transaction dates, descriptions, debits, credits, and balances from PDF bank statements into Microsoft Excel (.xlsx) and CSV."
        icon={<FileSpreadsheet className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'PDF bank statements · checking, savings, credit cards',
          'Formatted Excel (.xlsx) and universal CSV export',
          '100% confidential · encrypted processing with immediate deletion',
        ]}
      />

      {!uploadedFile ? (
        <div className="mt-8">
          <FileUpload accept=".pdf,application/pdf" />
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {/* Action Header Card */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-base truncate max-w-[280px]">
                  {uploadedFile.name}
                </span>
                <Badge variant="outline" className="font-mono text-xs">
                  {totalRows} Transactions
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Ready to Export
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Parsed columns: Date, Payee / Description, Debit, Credit, and Running Balance.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                size="sm"
                onClick={() => handleDownload('xlsx')}
                disabled={isExporting}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download Excel (.XLSX)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload('csv')}
                disabled={isExporting}
                className="gap-2"
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

          <p className="text-sm text-muted-foreground">Review every row against the original statement. Debit and credit direction is inferred from signed amounts; unsigned amounts are treated as credits. Amounts are shown without currency conversion.</p>
          {/* Transactions Preview Table */}
          <div className="border rounded-2xl bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">Extracted Transactions Preview</span>
              </div>
              <span className="text-xs text-muted-foreground">Showing up to first 25 rows</span>
            </div>

            <div className="overflow-x-auto max-h-[480px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted/50 sticky top-0 border-b">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground w-28">Date</th>
                    <th className="p-3 font-semibold text-muted-foreground">Description / Payee</th>
                    <th className="p-3 font-semibold text-muted-foreground text-right w-28">Withdrawal (-)</th>
                    <th className="p-3 font-semibold text-muted-foreground text-right w-28">Deposit (+)</th>
                    <th className="p-3 font-semibold text-muted-foreground text-right w-28">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.slice(0, 25).map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-mono text-muted-foreground whitespace-nowrap">{row.date || '—'}</td>
                      <td className="p-3 font-medium text-foreground">{row.description || '—'}</td>
                      <td className="p-3 text-right font-mono text-rose-600 dark:text-rose-400">
                        {row.debit ? row.debit : '—'}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                        {row.credit ? row.credit : '—'}
                      </td>
                      <td className="p-3 text-right font-mono text-foreground font-semibold">
                        {row.balance ? row.balance : '—'}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        {isProcessing ? 'Analyzing financial statement structure...' : 'No transactions detected.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
