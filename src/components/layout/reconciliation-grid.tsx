'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  Scale,
  Table as TableIcon,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export interface ReconciliationRow {
  date: string;
  description: string;
  debit: string;
  credit: string;
  balance: string;
}

export function parseMoney(raw: string | undefined): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[^0-9.-]/g, '');
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function hasNumericValue(raw: string | undefined): boolean {
  if (!raw) return false;
  return /\d/.test(raw);
}

interface ReconciliationGridProps {
  transactions: ReconciliationRow[];
  onChangeTransactions: (next: ReconciliationRow[]) => void;
  presetLabel: string;
  visibleCols: {
    date: boolean;
    description: boolean;
    debit: boolean;
    credit: boolean;
    balance: boolean;
  };
  searchTerm: string;
  pageLimit: number;
  onToggleLimit?: () => void;
  onSwapRow?: (idx: number) => void;
  onDeleteRow?: (idx: number) => void;
  isLoading?: boolean;
  errorFallbackText?: string;
}

export function ReconciliationGrid({
  transactions,
  onChangeTransactions,
  presetLabel,
  visibleCols,
  searchTerm,
  pageLimit,
  onToggleLimit,
  onSwapRow,
  onDeleteRow,
  isLoading,
  errorFallbackText,
}: ReconciliationGridProps) {
  const [openingOverride, setOpeningOverride] = useState<string | null>(null);
  const [closingOverride, setClosingOverride] = useState<string | null>(null);

  const inferredOpening = useMemo(() => {
    const first = transactions[0];
    if (!first || !hasNumericValue(first.balance)) return 0;
    const b0 = parseMoney(first.balance);
    const c0 = parseMoney(first.credit);
    const d0 = parseMoney(first.debit);
    return Number((b0 + d0 - c0).toFixed(2));
  }, [transactions]);

  const inferredClosing = useMemo(() => {
    for (let i = transactions.length - 1; i >= 0; i -= 1) {
      if (hasNumericValue(transactions[i].balance)) {
        return Number(parseMoney(transactions[i].balance).toFixed(2));
      }
    }
    const sumCredits = transactions.reduce((s, r) => s + parseMoney(r.credit), 0);
    const sumDebits = transactions.reduce((s, r) => s + parseMoney(r.debit), 0);
    return Number((inferredOpening + sumCredits - sumDebits).toFixed(2));
  }, [transactions, inferredOpening]);

  const openingValue = openingOverride !== null ? parseMoney(openingOverride) : inferredOpening;
  const closingValue = closingOverride !== null ? parseMoney(closingOverride) : inferredClosing;

  const reconciliation = useMemo(() => {
    let running = openingValue;
    let totalCredits = 0;
    let totalDebits = 0;
    let discrepancyCount = 0;
    const rowChecks: Array<{
      expectedBalance: number;
      statedBalance: number | null;
      delta: number;
      mismatch: boolean;
    }> = [];

    for (const row of transactions) {
      const debit = parseMoney(row.debit);
      const credit = parseMoney(row.credit);
      totalCredits += credit;
      totalDebits += debit;
      running = Number((running + credit - debit).toFixed(2));
      const stated = hasNumericValue(row.balance) ? parseMoney(row.balance) : null;
      const delta = stated !== null ? Number((stated - running).toFixed(2)) : 0;
      const mismatch = stated !== null && Math.abs(delta) > 0.01;
      if (mismatch) discrepancyCount += 1;
      rowChecks.push({ expectedBalance: running, statedBalance: stated, delta, mismatch });
    }

    const expectedClosing = Number((openingValue + totalCredits - totalDebits).toFixed(2));
    const overallDiff = Number((closingValue - expectedClosing).toFixed(2));
    const isBalanced = Math.abs(overallDiff) <= 0.01 && discrepancyCount === 0;

    return {
      totalCredits: Number(totalCredits.toFixed(2)),
      totalDebits: Number(totalDebits.toFixed(2)),
      expectedClosing,
      overallDiff,
      discrepancyCount,
      isBalanced,
      rowChecks,
    };
  }, [transactions, openingValue, closingValue]);

  const indexedRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return transactions
      .map((row, idx) => ({ row, idx, check: reconciliation.rowChecks[idx] }))
      .filter(({ row }) => {
        if (!q) return true;
        return (
          row.description.toLowerCase().includes(q) ||
          row.date.toLowerCase().includes(q) ||
          row.debit.includes(q) ||
          row.credit.includes(q) ||
          row.balance.includes(q)
        );
      });
  }, [transactions, searchTerm, reconciliation.rowChecks]);

  const updateCell = (rowIndex: number, key: keyof ReconciliationRow, value: string) => {
    const next = transactions.map((r, i) => (i === rowIndex ? { ...r, [key]: value } : r));
    onChangeTransactions(next);
  };

  // Build SVG Sparkline coordinates for running balance across rows
  const sparkPoints = useMemo(() => {
    if (reconciliation.rowChecks.length === 0) return '';
    const values = [openingValue, ...reconciliation.rowChecks.map((c) => c.expectedBalance)];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const width = 260;
    const height = 54;
    return values
      .map((val, i) => {
        const x = values.length === 1 ? width / 2 : (i / (values.length - 1)) * width;
        const y = height - 6 - ((val - min) / span) * (height - 12);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [openingValue, reconciliation.rowChecks]);

  const cashMax = Math.max(1, reconciliation.totalCredits, reconciliation.totalDebits);
  const creditBarPct = Math.round((reconciliation.totalCredits / cashMax) * 100);
  const debitBarPct = Math.round((reconciliation.totalDebits / cashMax) * 100);

  return (
    <div className="space-y-4">
      {transactions.length > 0 && (
        <div
          data-testid="reconciliation-summary"
          className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] rounded-2xl border bg-card p-5 shadow-sm"
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Live Bank Reconciliation Equation</h3>
              </div>
              {reconciliation.isBalanced ? (
                <Badge className="bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Balanced ($0.00 variance)
                </Badge>
              ) : (
                <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  Discrepancy: Δ {reconciliation.overallDiff >= 0 ? '+' : ''}
                  {reconciliation.overallDiff.toFixed(2)} ({reconciliation.discrepancyCount} row flags)
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="rounded-xl border border-border/60 bg-background/70 p-2.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Opening Balance</span>
                <Input
                  aria-label="Opening Balance"
                  value={openingOverride ?? openingValue.toFixed(2)}
                  onChange={(e) => setOpeningOverride(e.target.value)}
                  className="mt-1 h-7 font-mono text-xs font-bold px-2"
                />
              </div>
              <div className="rounded-xl border border-border/60 bg-background/70 p-2.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">+ Sum(Credits)</span>
                <p className="mt-1.5 font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  +{reconciliation.totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/70 p-2.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">- Sum(Debits)</span>
                <p className="mt-1.5 font-mono text-sm font-bold text-rose-600 dark:text-rose-400">
                  -{reconciliation.totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/70 p-2.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Closing Balance</span>
                <Input
                  aria-label="Statement Closing Balance"
                  value={closingOverride ?? closingValue.toFixed(2)}
                  onChange={(e) => setClosingOverride(e.target.value)}
                  className="mt-1 h-7 font-mono text-xs font-bold px-2"
                />
              </div>
            </div>

            <p className="text-[11px] font-mono text-muted-foreground">
              Formula Check: {openingValue.toFixed(2)} + {reconciliation.totalCredits.toFixed(2)} − {reconciliation.totalDebits.toFixed(2)} ={' '}
              <strong className="text-foreground">{reconciliation.expectedClosing.toFixed(2)}</strong> vs Closing{' '}
              <strong className="text-foreground">{closingValue.toFixed(2)}</strong>
            </p>
          </div>

          {/* Inline SVG Cash-Flow Summary & Running Balance Sparkline */}
          <div className="rounded-xl border border-border/60 bg-background/70 p-3.5 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span>SVG Cash-Flow Summary</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                Net {(reconciliation.totalCredits - reconciliation.totalDebits).toFixed(2)}
              </span>
            </div>
            <svg
              viewBox="0 0 280 96"
              role="img"
              aria-label="Cash flow credits versus debits and running balance sparkline"
              className="w-full h-24 overflow-visible"
            >
              <title>Cash flow summary and running balance</title>
              <text x="0" y="12" className="fill-muted-foreground text-[9px]">Credits</text>
              <rect x="48" y="4" width={Math.max(4, creditBarPct * 2.1)} height="10" rx="4" fill="#10b981" />
              <text x="0" y="28" className="fill-muted-foreground text-[9px]">Debits</text>
              <rect x="48" y="20" width={Math.max(4, debitBarPct * 2.1)} height="10" rx="4" fill="#f43f5e" />
              <g transform="translate(10, 38)">
                <rect x="0" y="0" width="260" height="54" rx="8" fill="none" stroke="currentColor" strokeOpacity="0.12" />
                {sparkPoints && (
                  <polyline
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={sparkPoints}
                  />
                )}
              </g>
            </svg>
          </div>
        </div>
      )}

      {/* Editable Reconciliation Table */}
      <div className="border rounded-2xl bg-card shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-sm">
              Editable Reconciliation Table ({presetLabel})
            </span>
          </div>
          {indexedRows.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                Showing {Math.min(pageLimit, indexedRows.length)} of {indexedRows.length} rows
              </span>
              {indexedRows.length > 25 && onToggleLimit && (
                <button
                  type="button"
                  onClick={onToggleLimit}
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
                {visibleCols.date && <th className="p-3 font-semibold text-muted-foreground w-28">Date</th>}
                {visibleCols.description && <th className="p-3 font-semibold text-muted-foreground">Description / Payee</th>}
                {visibleCols.debit && <th className="p-3 font-semibold text-muted-foreground text-right w-28">Debit (-)</th>}
                {visibleCols.credit && <th className="p-3 font-semibold text-muted-foreground text-right w-28">Credit (+)</th>}
                {visibleCols.balance && <th className="p-3 font-semibold text-muted-foreground text-right w-32">Balance</th>}
                <th className="p-3 font-semibold text-muted-foreground text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {indexedRows.slice(0, pageLimit).map(({ row, idx, check }) => (
                <tr
                  key={idx}
                  data-discrepancy={check?.mismatch ? 'true' : 'false'}
                  className={`transition-colors group ${
                    check?.mismatch
                      ? 'bg-amber-500/12 hover:bg-amber-500/18'
                      : 'hover:bg-muted/20'
                  }`}
                >
                  {visibleCols.date && (
                    <td className="p-1.5">
                      <input
                        aria-label={`Row ${idx + 1} Date`}
                        value={row.date}
                        onChange={(e) => updateCell(idx, 'date', e.target.value)}
                        className="w-full rounded px-2 py-1 font-mono text-xs bg-transparent hover:bg-background focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                  )}
                  {visibleCols.description && (
                    <td className="p-1.5">
                      <input
                        aria-label={`Row ${idx + 1} Description`}
                        value={row.description}
                        onChange={(e) => updateCell(idx, 'description', e.target.value)}
                        className="w-full rounded px-2 py-1 text-xs font-medium text-foreground bg-transparent hover:bg-background focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                  )}
                  {visibleCols.debit && (
                    <td className="p-1.5">
                      <input
                        aria-label={`Row ${idx + 1} Debit`}
                        value={row.debit}
                        onChange={(e) => updateCell(idx, 'debit', e.target.value)}
                        className="w-full rounded px-2 py-1 text-right font-mono text-xs text-rose-600 dark:text-rose-400 bg-transparent hover:bg-background focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                  )}
                  {visibleCols.credit && (
                    <td className="p-1.5">
                      <input
                        aria-label={`Row ${idx + 1} Credit`}
                        value={row.credit}
                        onChange={(e) => updateCell(idx, 'credit', e.target.value)}
                        className="w-full rounded px-2 py-1 text-right font-mono text-xs text-emerald-600 dark:text-emerald-400 bg-transparent hover:bg-background focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                  )}
                  {visibleCols.balance && (
                    <td className="p-1.5">
                      <div className="flex flex-col items-end">
                        <input
                          aria-label={`Row ${idx + 1} Balance`}
                          value={row.balance}
                          onChange={(e) => updateCell(idx, 'balance', e.target.value)}
                          className="w-full rounded px-2 py-1 text-right font-mono text-xs font-semibold text-foreground bg-transparent hover:bg-background focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        {check?.mismatch && (
                          <span className="text-[10px] font-mono font-semibold text-amber-700 dark:text-amber-300 px-1">
                            Expected {check.expectedBalance.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                  <td className="p-2 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      {onSwapRow && (
                        <button
                          type="button"
                          onClick={() => onSwapRow(idx)}
                          title="Swap Debit <-> Credit"
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDeleteRow && (
                        <button
                          type="button"
                          onClick={() => onDeleteRow(idx)}
                          title="Remove row"
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-muted-foreground">
                    {isLoading
                      ? 'Analyzing and extracting statement transactions...'
                      : errorFallbackText || 'No transactions detected.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
