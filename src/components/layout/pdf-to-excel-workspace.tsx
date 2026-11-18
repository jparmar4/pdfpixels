'use client';

import { motion } from 'framer-motion';
import {
  RotateCcw, FileSpreadsheet, Check, Sparkles, Table, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useActiveTool } from '@/hooks/use-active-tool';
import { ToolResultBar } from './tool-result-bar';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { ReconciliationGrid, type ReconciliationRow } from './reconciliation-grid';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur.trim());
  return cells;
}

function csvTextToReconciliationRows(csvText: string): ReconciliationRow[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  const firstCols = parseCsvLine(lines[0]).map((c) => c.toLowerCase());
  const hasHeader =
    firstCols.some((c) => /date|desc|debit|credit|balance|amount|item|particular/.test(c));
  const dataLines = hasHeader ? lines.slice(1) : lines;
  return dataLines.slice(0, 500).map((line) => {
    const cols = parseCsvLine(line);
    if (cols.length >= 5) {
      return { date: cols[0], description: cols[1], debit: cols[2], credit: cols[3], balance: cols[4] };
    }
    if (cols.length === 4) {
      return { date: cols[0], description: cols[1], debit: cols[2], credit: '', balance: cols[3] };
    }
    if (cols.length === 3) {
      const n = Number.parseFloat(cols[2].replace(/[^0-9.-]/g, ''));
      return {
        date: cols[0],
        description: cols[1],
        debit: Number.isFinite(n) && n < 0 ? Math.abs(n).toFixed(2) : '',
        credit: Number.isFinite(n) && n >= 0 ? n.toFixed(2) : '',
        balance: '',
      };
    }
    return { date: cols[0] || '', description: cols[1] || '', debit: '', credit: '', balance: '' };
  });
}

function rowsToCsvBlob(rows: ReconciliationRow[]): Blob {
  const esc = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
  const lines = ['Date,Description,Debit,Credit,Balance'];
  for (const r of rows) {
    lines.push([esc(r.date), esc(r.description), esc(r.debit), esc(r.credit), esc(r.balance)].join(','));
  }
  return new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
}

export function PDFToExcelWorkspace({ initialFormat = 'xlsx' }: { initialFormat?: 'xlsx' | 'csv' } = {}) {
  const { activeTool, uploadedFile, isProcessing, progress, setIsProcessing, setProgress, reset } = useActiveTool();
  const [convertError, setConvertError] = useState<string | null>(null);

  const [totalPages, setTotalPages] = useState<number>(1);
  const [format, setFormat] = useState<'xlsx' | 'csv'>(initialFormat);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFileName, setResultFileName] = useState<string>('');
  const [reconRows, setReconRows] = useState<ReconciliationRow[]>([]);
  const [pageLimit, setPageLimit] = useState<number>(25);

  useEffect(() => {
    if (!uploadedFile) {
      setTotalPages(1);
      setResultUrl(null);
      setReconRows([]);
      return;
    }

    let active = true;
    (async () => {
      try {
        const { PDFDocument } = await import('pdf-lib');
        const buffer = await uploadedFile.arrayBuffer();
        const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
        if (active) {
          setTotalPages(pdf.getPageCount());
          toast.success(`PDF loaded (${pdf.getPageCount()} page${pdf.getPageCount() === 1 ? '' : 's'})`);
        }
      } catch {
        if (active) {
          setTotalPages(1);
          toast.success('PDF document loaded');
        }
      }

      if (format === 'csv') {
        try {
          const fd = new FormData();
          fd.append('file', uploadedFile);
          fd.append('format', 'json');
          const { apiFetch } = await import('@/lib/api-client');
          const res = await apiFetch('/api/pdf/bank-statement-to-excel', { method: 'POST', body: fd });
          const data = await res.json().catch(() => null);
          if (active && res.ok && Array.isArray(data?.transactions) && data.transactions.length > 0) {
            setReconRows(data.transactions);
          }
        } catch {
          // Will populate from CSV export on convert
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [uploadedFile, format]);

  const handleReset = useCallback(() => {
    if (resultUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(resultUrl);
    }
    reset();
    setResultUrl(null);
    setReconRows([]);
  }, [reset, resultUrl]);

  const handleConvert = async () => {
    if (!uploadedFile) {
      toast.error('Please upload a PDF document');
      return;
    }

    setIsProcessing(true);
    setConvertError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('format', format);

      const { fetchWithUploadProgress } = await import('@/lib/upload-with-progress');
      const res = await fetchWithUploadProgress('/api/pdf/to-excel', formData, setProgress);

      setProgress(90);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Conversion failed' }));
        throw new Error(err.error || 'Failed to convert PDF to Excel');
      }

      const blob = await res.blob();
      if (format === 'csv' && reconRows.length === 0) {
        const parsed = csvTextToReconciliationRows(await blob.text());
        if (parsed.length > 0) setReconRows(parsed);
      }

      const url = URL.createObjectURL(blob);
      setResultUrl((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return url;
      });
      setResultFileName(uploadedFile.name.replace(/\.pdf$/i, `.${format}`));
      setProgress(100);
      toast.success(`PDF converted to ${format.toUpperCase()} spreadsheet successfully!`);
    } catch (err: any) {
      const message = err?.message || 'Conversion failed';
      setConvertError(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (format === 'csv' && reconRows.length > 0) {
      const editedBlob = rowsToCsvBlob(reconRows);
      const editedUrl = URL.createObjectURL(editedBlob);
      const a = document.createElement('a');
      a.href = editedUrl;
      a.download = resultFileName || 'reconciled-table.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(editedUrl), 1000);
      toast.success('Exported edited reconciliation CSV!');
      return;
    }
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = resultFileName || `spreadsheet.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success('Download started');
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
      <ToolPageHeader
        title={activeTool?.name || 'PDF to Excel Converter Online Free'}
        description={activeTool?.description || 'Extract tables, rows, columns, and financial data from PDF invoices, bank statements, and spreadsheets into Microsoft Excel (.xlsx) or CSV.'}
        icon={<FileSpreadsheet className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'PDF only · max 50 MB',
          'Extracts tables into Microsoft Excel (.xlsx) or editable reconciliation CSV format',
          'Preserves numerical formatting, column alignments, and running-balance validation',
        ]}
      />

      {!uploadedFile ? (
        <div className="mt-8">
          <FileUpload accept=".pdf,application/pdf" />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <div className="grid md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-7 bg-card border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-semibold text-lg">{uploadedFile.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB · {totalPages} Page{totalPages === 1 ? '' : 's'}
                  </p>
                </div>
                <Badge variant="default" className="font-mono text-xs">
                  Output: {format.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label id="format" className="text-xs">Select Output Format:</Label>
                  <Select aria-labelledby="format" value={format} onValueChange={(v: any) => setFormat(v)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xlsx">Microsoft Excel Workbook (.xlsx)</SelectItem>
                      <SelectItem value="csv">Comma-Separated Values (.csv)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 rounded-xl bg-muted/40 border space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-primary">
                    <Table className="w-4 h-4" /> Spreadsheet export
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    LibreOffice writes the workbook when it is installed. CSV mode includes an inline editable Reconciliation Grid and SVG Cash-Flow Summary before download.
                  </p>
                </div>
              </div>

              <ToolResultBar error={convertError} />
              <div className="pt-2 flex flex-col gap-2">
                <Button
                  type="button"
                  disabled={isProcessing}
                  size="lg"
                  className="w-full rounded-xl font-semibold gap-2"
                  onClick={handleConvert}
                >
                  <FileSpreadsheet className="w-5 h-5" /> {isProcessing ? `Extracting… ${Math.round(progress)}%` : `Convert to ${format.toUpperCase()}`}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  onClick={handleReset}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Upload Different PDF
                </Button>
              </div>
            </div>

            <div className="md:col-span-5 space-y-6">
              {resultUrl ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center space-y-4"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-base">Extraction Completed!</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your spreadsheet is ready for analysis in Excel or Google Sheets.
                    </p>
                  </div>
                  <ToolResultBar
                    error={convertError}
                    downloadUrl={resultUrl}
                    downloadName={resultFileName || `spreadsheet.${format}`}
                    summary="Your spreadsheet is ready."
                    onDownload={handleDownload}
                  />
                </motion.div>
              ) : (
                <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Sparkles className="w-4 h-4 text-primary" /> Popular Workflows
                  </div>
                  <ul className="space-y-2 text-muted-foreground list-disc pl-4 leading-relaxed">
                    <li><strong className="text-foreground">Bank &amp; Credit Card Statements:</strong> Extract transaction tables and reconcile balances in-browser.</li>
                    <li><strong className="text-foreground">Invoices &amp; Receipts:</strong> Pull line items, SKU codes, and amounts directly into CSV/Excel.</li>
                    <li><strong className="text-foreground">Statistical Reports:</strong> Move research and financial tables from PDF into manipulable data grids.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {format === 'csv' && reconRows.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Edit any cell inline below to verify Opening + Credits − Debits = Closing Balance before CSV export:
                </p>
                <Button size="sm" onClick={handleDownload} className="gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Download className="w-4 h-4" />
                  Export Reconciled CSV
                </Button>
              </div>
              <ReconciliationGrid
                transactions={reconRows}
                onChangeTransactions={setReconRows}
                presetLabel="PDF to CSV Interactive Grid"
                visibleCols={{ date: true, description: true, debit: true, credit: true, balance: true }}
                searchTerm=""
                pageLimit={pageLimit}
                onToggleLimit={() => setPageLimit((p) => (p === 25 ? reconRows.length : 25))}
                onSwapRow={(idx) =>
                  setReconRows((prev) => prev.map((r, i) => (i === idx ? { ...r, debit: r.credit, credit: r.debit } : r)))
                }
                onDeleteRow={(idx) => setReconRows((prev) => prev.filter((_, i) => i !== idx))}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
