import path from 'node:path';
import { createRequire } from 'node:module';

export interface PdfTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

type PdfJsTask = {
  promise: Promise<{
    numPages: number;
    getPage: (page: number) => Promise<{
      getTextContent: () => Promise<{ items: unknown[] }>;
      cleanup: () => void;
    }>;
  }>;
  destroy: () => Promise<void>;
};

function sanitizeFragment(str: string): string {
  return str.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
}

async function openPdfJsDocument(buffer: Buffer): Promise<PdfJsTask> {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const require = createRequire(path.join(process.cwd(), 'package.json'));
  const root = path.dirname(require.resolve('pdfjs-dist/package.json'));
  return getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    useSystemFonts: false,
    standardFontDataUrl: path.join(root, 'standard_fonts').replace(/\\/g, '/') + '/',
    cMapUrl: path.join(root, 'cmaps').replace(/\\/g, '/') + '/',
    cMapPacked: true,
    verbosity: 0,
  }) as PdfJsTask;
}

/** Positioned glyphs so table tools can rebuild columns; never guess from raw PDF bytes. */
export async function extractPdfTextItems(buffer: Buffer): Promise<PdfTextItem[]> {
  const task = await openPdfJsDocument(buffer);
  try {
    const pdf = await task.promise;
    if (pdf.numPages > 500) throw new Error('Please split PDFs over 500 pages before extracting text.');
    const items: PdfTextItem[] = [];
    let characters = 0;
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      for (const raw of content.items) {
        if (!raw || typeof raw !== 'object' || !('str' in raw)) continue;
        const item = raw as { str: string; width?: number; height?: number; transform: number[] };
        const str = sanitizeFragment(item.str);
        if (!str) continue;
        const fontHeight = item.transform[3] || item.height || 10;
        const x = item.transform[4];
        const y = item.transform[5];
        const height = Math.abs(fontHeight) || 10;
        const width = item.width && item.width > 0 ? item.width : height * 0.5 * str.length;
        characters += str.length;
        if (characters > 2_000_000) throw new Error('Too much text to process at once. Please split this PDF.');
        items.push({ str, x, y, width, height, page: p });
      }
      page.cleanup();
    }
    return items;
  } finally {
    await task.destroy();
  }
}

/** Read real page text, including encoded fonts; never guess from raw PDF bytes. */
export async function extractPdfLines(buffer: Buffer): Promise<string[]> {
  return itemsToLines(await extractPdfTextItems(buffer));
}

export function itemsToLines(items: PdfTextItem[]): string[] {
  const byPage = new Map<number, PdfTextItem[]>();
  for (const item of items) {
    const list = byPage.get(item.page) || [];
    list.push(item);
    byPage.set(item.page, list);
  }

  const lines: string[] = [];
  for (const page of [...byPage.keys()].sort((a, b) => a - b)) {
    const pageItems = byPage.get(page) || [];
    const rowClusters = clusterByY(pageItems);

    for (const rowItems of rowClusters) {
      // Sort items within row visually from left to right
      const sorted = [...rowItems].sort((a, b) => a.x - b.x);
      let line = '';
      let lastEnd = 0;

      for (const item of sorted) {
        if (!line) {
          line = item.str;
          lastEnd = item.x + item.width;
          continue;
        }

        const gap = item.x - lastEnd;
        if (gap > Math.max(10, item.height * 1.1)) {
          line += '\t';
        } else if (gap > 1.2 && !/\s$/.test(line) && !/^\s/.test(item.str)) {
          line += ' ';
        }
        line += item.str;
        lastEnd = Math.max(lastEnd, item.x + item.width);
      }

      const trimmed = line.trim();
      if (trimmed) lines.push(trimmed);
    }
  }

  return lines;
}

interface TableCell {
  text: string;
  x: number;
  width: number;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function clusterByY(pageItems: PdfTextItem[]): PdfTextItem[][] {
  if (pageItems.length === 0) return [];
  const sorted = [...pageItems].sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: PdfTextItem[][] = [];
  let current: PdfTextItem[] = [];
  let rowY = 0;
  for (const item of sorted) {
    const slop = Math.max(3.5, Math.max(item.height, current[0]?.height || item.height) * 0.55);
    if (current.length && Math.abs(item.y - rowY) > slop) {
      rows.push(current);
      current = [];
    }
    if (current.length === 0) rowY = item.y;
    current.push(item);
  }
  if (current.length) rows.push(current);
  return rows;
}

function mergeRowCells(rowItems: PdfTextItem[]): TableCell[] {
  const sorted = [...rowItems].sort((a, b) => a.x - b.x);
  const cells: TableCell[] = [];
  for (const item of sorted) {
    const prev = cells[cells.length - 1];
    const gap = prev ? item.x - (prev.x + prev.width) : 0;
    const mergeGap = Math.max(3.5, item.height * 0.45);
    // Allow natural word gaps to merge within the same column cell, but avoid merging large column gaps
    if (prev && gap <= Math.max(14, item.height * 1.5) && gap < 26) {
      const space = gap > 1.2 && !/\s$/.test(prev.text) && !/^\s/.test(item.str) ? ' ' : '';
      prev.text += space + item.str;
      prev.width = Math.max(prev.width, item.x + item.width - prev.x);
    } else {
      cells.push({ text: item.str.trim(), x: item.x, width: item.width });
    }
  }
  return cells.filter(cell => cell.text);
}

function isHeaderRow(cells: TableCell[]): boolean {
  const joined = cells.map(cell => cell.text.toLowerCase()).join(' ');
  const hasDate = /\b(dates?|posted|posting|txn|trans|value\s*dt)\b/i.test(joined);
  const hasDesc = /\b(desc|particular|narrative|details|payee|merchant|remark|description|memo)\b/i.test(joined);
  const hasMoney = /\b(debit|credit|withdraw|deposit|balance|amount|paid out|paid in)\b/i.test(joined);
  if (hasDate && (hasDesc || hasMoney)) return true;
  if (hasDesc && hasMoney) return true;
  const keys = ['date', 'description', 'debit', 'credit', 'balance', 'withdrawal', 'deposit', 'particulars', 'amount', 'details', 'narrative', 'payee'];
  return keys.filter(key => joined.includes(key)).length >= 2;
}

interface ColumnBoundary {
  left: number;
  right: number;
}

function computeColumnBoundariesFromHeader(header: TableCell[]): ColumnBoundary[] {
  const sorted = [...header].sort((a, b) => a.x - b.x);
  const bounds: ColumnBoundary[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i];
    const curRight = cur.x + cur.width;
    const next = sorted[i + 1];
    const prev = sorted[i - 1];

    let left = i === 0 ? Number.NEGATIVE_INFINITY : bounds[i - 1].right;

    let right: number;
    if (!next) {
      right = Number.POSITIVE_INFINITY;
    } else {
      const isCurText = /\b(desc|particular|narrative|details|payee|memo)\b/i.test(cur.text);
      const isNextMoney = /\b(debit|credit|withdraw|deposit|balance|amount)\b/i.test(next.text);

      if (isCurText && isNextMoney) {
        // Allow text descriptions to extend close to the next numeric column
        right = Math.max(curRight + 8, next.x - 12);
      } else if (curRight < next.x) {
        // Place divider cleanly in the gap between columns
        right = (curRight + next.x) / 2;
      } else {
        right = (cur.x + next.x) / 2;
      }
    }

    bounds.push({ left, right });
  }

  return bounds;
}

function computeColumnBoundariesFromStops(stops: number[]): ColumnBoundary[] {
  if (stops.length === 0) return [];
  return stops.map((stop, i) => {
    const left = i === 0 ? Number.NEGATIVE_INFINITY : (stops[i - 1] + stop) / 2;
    const right = i === stops.length - 1 ? Number.POSITIVE_INFINITY : (stop + stops[i + 1]) / 2;
    return { left, right };
  });
}

function clusterColumnStops(cells: TableCell[]): number[] {
  const xs = cells.map(cell => cell.x).sort((a, b) => a - b);
  if (xs.length === 0) return [];
  const gaps: number[] = [];
  for (let i = 1; i < xs.length; i++) {
    const gap = xs[i] - xs[i - 1];
    if (gap > 8) gaps.push(gap);
  }
  const slop = Math.min(42, Math.max(16, (median(gaps) || 36) * 0.38));
  const groups: number[][] = [[xs[0]]];
  for (let i = 1; i < xs.length; i++) {
    const group = groups[groups.length - 1];
    if (xs[i] - group[group.length - 1] <= slop) group.push(xs[i]);
    else groups.push([xs[i]]);
  }
  return groups.map(median).slice(0, 12);
}

function assignCellsToBounds(cells: TableCell[], bounds: ColumnBoundary[]): string[] {
  if (bounds.length === 0) return cells.map(cell => cell.text);
  const grid = Array.from({ length: bounds.length }, () => '');

  for (const cell of cells) {
    // For monetary amounts, center or right edge represents alignment best
    const center = cell.x + cell.width * 0.5;
    let index = -1;

    for (let i = 0; i < bounds.length; i++) {
      if (center >= bounds[i].left && center < bounds[i].right) {
        index = i;
        break;
      }
    }

    if (index === -1) {
      // Fallback to closest boundary
      if (center < bounds[0].left) index = 0;
      else index = bounds.length - 1;
    }

    grid[index] = grid[index] ? `${grid[index]} ${cell.text}` : cell.text;
  }

  return grid;
}

/** Rebuild visual rows/columns, preserving empty debit/credit cells. */
export function itemsToTableRows(items: PdfTextItem[]): string[][] {
  const byPage = new Map<number, PdfTextItem[]>();
  for (const item of items) {
    const list = byPage.get(item.page) || [];
    list.push(item);
    byPage.set(item.page, list);
  }

  const visualRows: TableCell[][] = [];
  for (const page of [...byPage.keys()].sort((a, b) => a - b)) {
    for (const rowItems of clusterByY(byPage.get(page) || [])) {
      const cells = mergeRowCells(rowItems);
      if (cells.length) visualRows.push(cells);
    }
  }
  if (visualRows.length === 0) return [];

  // Find the primary table header
  const header = visualRows.find(isHeaderRow);
  const typical = visualRows.reduce((best, row) => (row.length > best.length ? row : best), visualRows[0]);

  const bounds: ColumnBoundary[] = header && header.length >= 3
    ? computeColumnBoundariesFromHeader(header)
    : computeColumnBoundariesFromStops(clusterColumnStops(typical));

  return visualRows.map(row => {
    if (row.length === 1 && (!header || row === header)) return [row[0].text];
    return assignCellsToBounds(row, bounds);
  });
}
