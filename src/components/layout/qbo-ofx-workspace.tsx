'use client';

import { useCallback, useRef, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  FileSpreadsheet,
  RotateCcw,
  Search,
  Sparkles,
  Upload,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ResultScreenAd, SmartlinkButton } from '@/components/ads/ad-banner';
import { triggerDownloadWithSmartlink } from '@/lib/ads-config';
import { buildClientXlsxBlob } from '@/lib/client-pdf-ops';
import {
  formatOfxCsv,
  parseOfxQboQfx,
  SAMPLE_QBO_STATEMENT,
  type OfxExportPreset,
  type ParsedOfxStatement,
} from '@/lib/ofx-qbo-parser';
import { useConsumeChainedFile } from '@/hooks/use-consume-chained-file';
import { PrivateModeBadge } from './private-mode-badge';
import { ToolLimitNotice } from './tool-limit-notice';
import { ToolPageHeader } from './tool-page-header';
import { toast } from 'sonner';

export function QboOfxWorkspace() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [parsed, setParsed] = useState<ParsedOfxStatement | null>(null);
  const [preset, setPreset] = useState<OfxExportPreset>('xlsx');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadOfxContent = useCallback(async (name: string, size: number, text: string) => {
    try {
      const statement = parseOfxQboQfx(text);
      setFileName(name);
      setFileSize(size);
      setParsed(statement);
      setSearchTerm('');
      toast.success(`Parsed ${statement.transactions.length} transactions locally (Zero Upload)!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to read QBO/OFX/QFX file');
    }
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      const text = await file.text();
      await loadOfxContent(file.name, file.size, text);
    },
    [loadOfxContent],
  );

  useConsumeChainedFile(
    handleFile,
    (f) => /\.(qbo|qfx|ofx|xml)$/i.test(f.name),
  );

  const handleLoadSample = async () => {
    await loadOfxContent('sample-chase-business.qbo', SAMPLE_QBO_STATEMENT.length, SAMPLE_QBO_STATEMENT);
  };

  const handleDownload = async (selectedPreset: OfxExportPreset = preset) => {
    if (!parsed) return;
    setIsExporting(true);
    try {
      const base = (fileName || 'bank-statement').replace(/\.[^.]+$/, '');
      let blob: Blob;
      let outName: string;

      if (selectedPreset === 'xlsx') {
        const headers = ['Date', 'Payee', 'Memo', 'Type', 'Debit', 'Credit', 'Amount', 'Check #', 'FITID'];
        const rows = parsed.transactions.map((t) => [
          t.date,
          t.name,
          t.memo,
          t.type,
          t.debit ?? '',
          t.credit ?? '',
          t.amount,
          t.checkNum,
          t.fitid,
        ]);
        blob = await buildClientXlsxBlob(`${parsed.accountType} Export`, headers, rows, new Set([4, 5, 6]));
        outName = `${base}.xlsx`;
      } else {
        const csv = formatOfxCsv(parsed, selectedPreset);
        blob = new Blob([csv], { type: 'text/csv; charset=utf-8' });
        const suffix = selectedPreset === 'csv' ? '' : `-${selectedPreset}`;
        outName = `${base}${suffix}.csv`;
      }

      const url = URL.createObjectURL(blob);
      triggerDownloadWithSmartlink(
        () => {
          const a = document.createElement('a');
          a.href = url;
          a.download = outName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.setTimeout(() => URL.revokeObjectURL(url), 1000);
          toast.success(`Downloaded ${outName}`);
        },
        {
          originalSize: fileSize,
          processedSize: blob.size,
          formatLabel: selectedPreset === 'xlsx' ? 'XLSX' : 'CSV',
          fileName: outName,
        },
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setFileName(null);
    setFileSize(0);
    setParsed(null);
    setSearchTerm('');
  };

  const visibleRows = parsed
    ? parsed.transactions.filter((t) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.memo.toLowerCase().includes(q) ||
          t.date.includes(q) ||
          t.fitid.toLowerCase().includes(q)
        );
      })
    : [];

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
      <ToolPageHeader
        title="QBO, QFX & OFX to Excel / CSV Converter"
        description="Convert QuickBooks Web Connect (.qbo), Quicken (.qfx), and Open Financial Exchange (.ofx) files into formatted Excel (.xlsx), QuickBooks Online CSV, Xero CSV, or Wave CSV."
        icon={<FileSpreadsheet className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'Supports OFX 1.x SGML & OFX 2.x XML exports (.qbo, .qfx, .ofx)',
          'Preserves FITID unique IDs, Check Numbers, Payee Names, Memos & Ledger Balances',
          '100% browser-native financial parsing with zero server uploads',
        ]}
      />
      <PrivateModeBadge
        className="mt-4"
        description="Bank Web Connect files (.qbo / .qfx / .ofx) are parsed entirely inside your browser — financial account numbers never touch a server."
      />

      {!parsed ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) void handleFile(f);
          }}
          className="mt-8 rounded-[2rem] border-2 border-dashed border-border/70 bg-card/60 p-10 text-center space-y-4"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".qbo,.qfx,.ofx,.xml,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Upload className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Drop your .QBO, .QFX, or .OFX file here</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Supports Chase, Bank of America, Wells Fargo, Capital One, Amex, and Citi Web Connect exports.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button onClick={() => fileInputRef.current?.click()} className="gap-2 font-bold">
              <Upload className="w-4 h-4" />
              Choose .QBO / .QFX / .OFX File
            </Button>
            <Button variant="outline" onClick={() => void handleLoadSample()} className="gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Try Sample .QBO File
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="bg-card border rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-base">{fileName}</span>
                  <Badge variant="outline" className="font-mono text-xs">{parsed.accountType} · {parsed.accountId}</Badge>
                  <Badge variant="secondary" className="font-mono text-xs">{parsed.currency}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Bank ID: {parsed.bankId}
                  {parsed.startDate && parsed.endDate ? ` · Period: ${parsed.startDate} to ${parsed.endDate}` : ''}
                  {parsed.ledgerBalance !== null ? ` · Ledger Balance: ${parsed.ledgerBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void handleDownload(preset)} disabled={isExporting} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Download className="w-4 h-4" />
                  Export {preset.toUpperCase()}
                </Button>
                <SmartlinkButton className="min-h-9 text-xs" />
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-1" /> New File
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t pt-3">
              {(
                [
                  { id: 'xlsx' as const, label: 'Excel Workbook (.xlsx)' },
                  { id: 'quickbooks-3col' as const, label: 'QuickBooks 3-Col CSV' },
                  { id: 'xero' as const, label: 'Xero Accounting CSV' },
                  { id: 'wave' as const, label: 'Wave Accounting CSV' },
                  { id: 'csv' as const, label: 'Full CSV (with FITID)' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPreset(item.id)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                    preset === item.id ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <ResultScreenAd
            refreshKey={`${fileName}-${parsed.transactions.length}`}
            originalSize={fileSize}
            formatLabel={preset === 'xlsx' ? 'XLSX' : 'CSV'}
            fileName={fileName || 'export.xlsx'}
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-card border rounded-xl p-4">
              <span className="text-xs text-muted-foreground">Transactions</span>
              <p className="text-lg font-bold font-mono mt-1">{parsed.transactions.length}</p>
            </div>
            <div className="bg-card border rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Debits (-)</span>
                <ArrowDownRight className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-lg font-bold font-mono text-rose-600 mt-1">{parsed.totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-card border rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Credits (+)</span>
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-lg font-bold font-mono text-emerald-600 mt-1">{parsed.totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-card border rounded-xl p-4">
              <span className="text-xs text-muted-foreground">Net Activity</span>
              <p className={`text-lg font-bold font-mono mt-1 ${parsed.netChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {parsed.netChange >= 0 ? '+' : ''}
                {parsed.netChange.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter payee, memo, FITID, date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="border rounded-2xl bg-card overflow-hidden">
            <div className="overflow-x-auto max-h-[460px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted/50 sticky top-0 border-b">
                  <tr>
                    <th className="p-3 font-semibold">Date</th>
                    <th className="p-3 font-semibold">Payee / Description</th>
                    <th className="p-3 font-semibold">Type</th>
                    <th className="p-3 font-semibold text-right">Debit</th>
                    <th className="p-3 font-semibold text-right">Credit</th>
                    <th className="p-3 font-semibold">FITID</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {visibleRows.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/20">
                      <td className="p-3 font-mono whitespace-nowrap">{row.date}</td>
                      <td className="p-3">
                        <p className="font-medium text-foreground">{row.name}</p>
                        {row.memo && row.memo !== row.name && (
                          <p className="text-[11px] text-muted-foreground">{row.memo}</p>
                        )}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-muted-foreground">{row.type}</td>
                      <td className="p-3 text-right font-mono text-rose-600">
                        {row.debit !== null ? row.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-600">
                        {row.credit !== null ? row.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}
                      </td>
                      <td className="p-3 font-mono text-[10px] text-muted-foreground">{row.fitid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
