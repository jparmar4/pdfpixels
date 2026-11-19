'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PDFPage } from 'pdf-lib';
import { Download, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useActiveTool } from '@/hooks/use-active-tool';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { ResultScreenAd, SmartlinkButton } from '@/components/ads/ad-banner';
import { triggerDownloadWithSmartlink } from '@/lib/ads-config';
import { toast } from 'sonner';

type PageFormat = 'letter' | 'a4';
type Orientation = 'portrait' | 'landscape';

const PAGE_SIZES: Record<PageFormat, [number, number]> = {
  letter: [612, 792],
  a4: [595.28, 841.89],
};

// ── RFC 4180 state-machine parser ────────────────────────────────────────────
// Handles quoted fields with embedded commas/newlines and escaped quotes ("" ),
// CRLF / LF / CR row endings, and skips a UTF-8 BOM. Tolerant of Excel-style
// `""value""` double-quoted literals (a quote followed by content is literal,
// a quote followed by , \n \r or EOF closes the field).
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        const next = src[i + 1];
        const afterPair = src[i + 2];
        const isBoundary = (c: string | undefined) => c === ',' || c === '\n' || c === '\r' || c === undefined;
        if (next === '"') {
          // `""` pair: if a boundary follows, it's an escaped quote + closing
          // quote (Excel-style `""value""` literals); otherwise a plain escape.
          if (isBoundary(afterPair)) {
            field += '"';
            inQuotes = false;
            i += 2;
            continue;
          }
          field += '"';
          i += 2;
          continue;
        }
        // Only close when the quote is followed by a field/row boundary or EOF;
        // otherwise it's a literal quote inside the value (Excel tolerance).
        if (isBoundary(next)) {
          inQuotes = false;
          i++;
          continue;
        }
        field += '"';
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"' && field === '') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      i++;
      continue;
    }
    if (ch === '\r') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i++;
      if (src[i] === '\n') i++;
      continue;
    }
    if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  // Last field/row (only if the file doesn't end with a newline)
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Drop fully-empty trailing rows
  while (rows.length && rows[rows.length - 1].every((c) => c.trim() === '')) {
    rows.pop();
  }
  return rows;
}

export function CsvToPdfWorkspace() {
  const { activeTool, uploadedFile, isProcessing, setIsProcessing, setProgress, reset } = useActiveTool();

  const [csvText, setCsvText] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [pageFormat, setPageFormat] = useState<PageFormat>('letter');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState('table.pdf');
  const resultUrlRef = useRef<string | null>(null);

  const rows = useMemo(() => (csvText.trim() ? parseCsv(csvText) : []), [csvText]);
  const header = rows[0] ?? [];
  const dataRows = rows.slice(1);

  const revokeResult = useCallback(() => {
    if (resultUrlRef.current?.startsWith('blob:')) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
  }, []);

  useEffect(() => revokeResult, [revokeResult]);

  // Read uploaded CSV text
  useEffect(() => {
    if (!uploadedFile) {
      setCsvText('');
      return;
    }
    let cancelled = false;
    (async () => {
      const text = await uploadedFile.text();
      if (!cancelled) {
        setCsvText(text);
        setResultName(uploadedFile.name.replace(/\.csv$/i, '') + '.pdf');
        toast.success(`CSV loaded — parsing now`);
      }
    })();
    return () => { cancelled = true; };
  }, [uploadedFile]);

  // ── Export ──
  const handleExport = useCallback(async () => {
    if (!rows.length) {
      toast.error('Load a CSV file first');
      return;
    }
    setIsProcessing(true);
    setProgress(35);
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const bold = await doc.embedFont(StandardFonts.HelveticaBold);
      const sanitize = (value: string) => value
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ');

      const base = PAGE_SIZES[pageFormat];
      const [PW, PH] = orientation === 'landscape' ? [base[1], base[0]] : base;
      const M = 40;
      const contentW = PW - M * 2;
      const fs = 8.5;
      const pad = 4;
      const lineH = 11;
      const headerH = 20;

      // Column widths: proportional to max content width, clamped
      const colCount = Math.max(...rows.map((r) => r.length));
      const rawWidths = Array.from({ length: colCount }, (_, c) => {
        let w = 0;
        for (const row of rows.slice(0, 200)) {
          const cell = sanitize(row[c] ?? '');
          w = Math.max(w, bold.widthOfTextAtSize(cell, fs), font.widthOfTextAtSize(cell, fs));
        }
        return Math.min(w + pad * 2, contentW * 0.42);
      });
      const minColW = contentW / colCount * 0.55;
      const widths = rawWidths.map((w) => Math.max(w, minColW));
      const sum2 = widths.reduce((a, b) => a + b, 0);
      const colWidths = sum2 > contentW
        ? widths.map((w) => (w / sum2) * contentW)
        : widths.map((w) => w + ((contentW - sum2) / colCount));

      const wrapCell = (cell: string, col: number, f = font): string[] => {
        const words = sanitize(cell).split(/\s+/).filter(Boolean);
        const lines: string[] = [];
        let current = '';
        for (const word of words) {
          const candidate = current ? `${current} ${word}` : word;
          if (f.widthOfTextAtSize(candidate, fs) > colWidths[col] - pad * 2 && current) {
            lines.push(current);
            current = word;
          } else {
            current = candidate;
          }
        }
        if (current) lines.push(current);
        return lines.length ? lines : [''];
      };

      const rowHeightFor = (row: string[], isHeader = false) => {
        let maxLines = 1;
        for (let c = 0; c < colCount; c++) {
          maxLines = Math.max(maxLines, wrapCell(row[c] ?? '', c, isHeader ? bold : font).length);
        }
        return Math.max(isHeader ? headerH : 0, maxLines * lineH + pad * 2);
      };

      type PdfPageLike = Pick<PDFPage, 'drawRectangle' | 'drawText' | 'drawLine'>;
      const drawRow = (page: PdfPageLike, row: string[], x: number, yTop: number, height: number, isHeader: boolean) => {
        if (isHeader) {
          page.drawRectangle({ x, y: yTop - height, width: contentW, height, color: rgb(0.955, 0.96, 0.985) });
        }
        // Cumulative column x positions (last = right table edge)
        const colX: number[] = [x];
        for (let c = 0; c < colCount; c++) {
          colX.push(colX[c] + (colWidths[c] ?? 0));
        }
        colX[colCount] = x + contentW;
        for (let c = 0; c < colCount; c++) {
          const lines = wrapCell(row[c] ?? '', c, isHeader ? bold : font);
          const f = isHeader ? bold : font;
          let ly = yTop - pad - fs;
          for (const line of lines) {
            page.drawText(line, { x: colX[c] + pad, y: ly, size: fs, font: f, color: rgb(0.12, 0.13, 0.18) });
            ly -= lineH;
          }
        }
        // Row borders
        page.drawLine({ start: { x, y: yTop - height }, end: { x: x + contentW, y: yTop - height }, thickness: 0.6, color: rgb(0.85, 0.86, 0.9) });
        for (let c = 0; c <= colCount; c++) {
          page.drawLine({ start: { x: colX[c], y: yTop }, end: { x: colX[c], y: yTop - height }, thickness: 0.6, color: rgb(0.88, 0.89, 0.92) });
        }
      };

      let page = doc.addPage([PW, PH]);
      let yTop = PH - M;
      if (reportTitle.trim()) {
        page.drawText(reportTitle.slice(0, 120), { x: M, y: yTop - 16, size: 14, font: bold, color: rgb(0.12, 0.13, 0.18) });
        yTop -= 34;
      }

      // Header row (repeats on every page)
      const drawTableHeader = () => {
        const h = rowHeightFor(header, true);
        drawRow(page, header, M, yTop, h, true);
        yTop -= h;
      };
      drawTableHeader();

      for (const row of dataRows) {
        const h = rowHeightFor(row);
        if (yTop - h < M) {
          page = doc.addPage([PW, PH]);
          yTop = PH - M;
          drawTableHeader();
        }
        drawRow(page, row, M, yTop, h, false);
        yTop -= h;
      }

      const bytes = await doc.save();
      const copy = new Uint8Array(bytes.byteLength);
      copy.set(bytes);
      const blob = new Blob([copy.buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      revokeResult();
      resultUrlRef.current = url;
      setResultUrl(url);
      setProgress(100);
      toast.success('Table PDF ready — download it below');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Conversion failed');
    } finally {
      setIsProcessing(false);
    }
  }, [rows, header, dataRows, reportTitle, pageFormat, orientation, setIsProcessing, setProgress, revokeResult]);

  const handleReset = useCallback(() => {
    reset();
    setCsvText('');
    setReportTitle('');
    setResultUrl(null);
    revokeResult();
  }, [reset, revokeResult]);

  const download = () => {
    if (!resultUrl) return;
    triggerDownloadWithSmartlink(() => {
      const link = document.createElement('a');
      link.href = resultUrl;
      link.download = resultName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Download started');
    });
  };

  if (!activeTool) return null;

  const PREVIEW_ROWS = 8;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl">
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        icon={<FileSpreadsheet className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'RFC 4180 parsing — quoted commas, escaped quotes, multiline cells',
          'Header row repeats on every page · auto-fitted columns · wrapped cells',
          'Parsing and PDF assembly run 100% in your browser — nothing uploads',
        ]}
      />

      {!uploadedFile ? (
        <div className="mt-8 max-w-xl mx-auto">
          <FileUpload accept=".csv,text/csv" />
        </div>
      ) : (
        <div className="mt-8 grid lg:grid-cols-[1fr_300px] gap-6 items-start">
          {/* ── Preview ── */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden shadow-premium">
              <div className="p-4 border-b border-border/40 bg-gradient-to-r from-primary/10 to-transparent flex items-center justify-between">
                <h3 className="font-bold tracking-tight text-foreground text-sm">Parsed table</h3>
                <span className="text-[11px] text-muted-foreground">
                  {colCountLabel(rows)} · {dataRows.length.toLocaleString()} data row{dataRows.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="overflow-auto max-h-[520px]">
                {rows.length ? (
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        {header.map((cell: string, i: number) => (
                          <th key={i} className="border border-border/60 bg-muted/60 px-2 py-1.5 text-left font-bold whitespace-nowrap max-w-[180px] truncate" title={cell}>
                            {cell}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dataRows.slice(0, PREVIEW_ROWS).map((row: string[], r: number) => (
                        <tr key={r}>
                          {header.map((_col: string, c: number) => (
                            <td key={c} className="border border-border/40 px-2 py-1.5 max-w-[180px] truncate" title={row[c] ?? ''}>
                              {row[c] ?? ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No rows detected in this file.</p>
                )}
              </div>
              {dataRows.length > PREVIEW_ROWS && (
                <p className="px-4 py-2 border-t border-border/40 text-[11px] text-muted-foreground">
                  Showing first {PREVIEW_ROWS} of {dataRows.length.toLocaleString()} rows — the PDF includes everything.
                </p>
              )}
            </div>
          </div>

          {/* ── Options ── */}
          <div className="space-y-5 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden shadow-premium">
              <div className="p-4 border-b border-border/40 bg-gradient-to-r from-primary/10 to-transparent">
                <h3 className="font-bold tracking-tight text-foreground text-sm">Layout</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ctp-title">Report title (optional)</Label>
                  <Input id="ctp-title" className="bg-background" value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} placeholder="Q3 Transactions Report" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctp-format">Page size</Label>
                  <Select value={pageFormat} onValueChange={(v) => setPageFormat(v as PageFormat)}>
                    <SelectTrigger id="ctp-format" aria-label="Page size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="letter">US Letter</SelectItem>
                      <SelectItem value="a4">A4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctp-orientation">Orientation</Label>
                  <Select value={orientation} onValueChange={(v) => setOrientation(v as Orientation)}>
                    <SelectTrigger id="ctp-orientation" aria-label="Orientation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Landscape (wide tables)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full btn-premium py-6 rounded-xl font-bold shadow-xl shadow-primary/20"
                  onClick={handleExport}
                  disabled={isProcessing || !rows.length}
                  size="lg"
                >
                  {isProcessing ? 'Converting…' : 'Convert to PDF'}
                </Button>
                <Button variant="outline" className="w-full gap-2 rounded-xl" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4" /> Start Over
                </Button>
              </div>
            </div>

            {resultUrl && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-3 shadow-premium">
                <p className="font-semibold text-sm">Table PDF ready</p>
                <Button onClick={download} className="w-full gap-2 btn-premium rounded-xl">
                  <Download className="w-4 h-4" /> Download PDF
                </Button>
                <div className="flex flex-col items-center gap-3 pt-1">
                  <SmartlinkButton />
                  <ResultScreenAd refreshKey={resultUrl} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function colCountLabel(rows: string[][]): string {
  if (!rows.length) return '0 columns';
  const count = Math.max(...rows.map((r) => r.length));
  return `${count} column${count === 1 ? '' : 's'}`;
}
