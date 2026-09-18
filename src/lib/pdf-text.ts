import path from 'node:path';
import { createRequire } from 'node:module';

/** Upper bound on a single pdfjs parse. Pathological inputs can stall
 *  parsing indefinitely; without this the request hangs until the platform
 *  maxDuration, billing the whole window for a file we will never read. */
const PDFJS_PARSE_TIMEOUT_MS = 20_000;

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

/** 2D affine matrix in DOMMatrix order: [a, b, c, d, e, f]. */
type Affine2D = [number, number, number, number, number, number];

const THREE_D_ONLY = [0, 0, 0, 0, 0, 0, 1, 0, 0, 1]; // m13,m14,m23,m24,m31,m32,m33,m34,m43,m44

/**
 * LAST-RESORT pure-JS DOMMatrix polyfill for runtimes where neither the browser
 * global nor `@napi-rs/canvas` is reachable (e.g. a standalone build that did
 * not trace the optional native package). pdfjs-dist 5.x evaluates
 * `new DOMMatrix()` at module top level (`SCALE_MATRIX`) even for text-only use,
 * so module init needs the global to exist at all. Implements the standard 2D
 * surface with real matrix math; 3D-only operations throw, because text
 * extraction never renders and this stub is never the primary implementation.
 */
class MinimalDomMatrix {
  #m: Affine2D;

  constructor(init?: unknown, ...rest: number[]) {
    if (init === undefined || init === null) {
      this.#m = [1, 0, 0, 1, 0, 0];
      return;
    }

    let values: number[];
    if (typeof init === 'number') {
      values = [init, ...rest];
    } else if (typeof init === 'string') {
      throw new TypeError('Fallback DOMMatrix cannot parse CSS string transforms.');
    } else if (Array.isArray(init) || ArrayBuffer.isView(init)) {
      values = Array.from(init as ArrayLike<number>);
    } else if (typeof init === 'object') {
      values = MinimalDomMatrix.read2DInit(init as Record<string, unknown>);
    } else {
      throw new TypeError('Unsupported DOMMatrix init.');
    }

    if (values.length === 6) {
      this.#m = [values[0], values[1], values[2], values[3], values[4], values[5]];
      return;
    }
    if (values.length === 16) {
      throw new Error('3D matrices are not supported by the fallback DOMMatrix.');
    }
    throw new TypeError(`DOMMatrix init expects 6 or 16 values, received ${values.length}.`);
  }

  /** Read a DOMMatrixInit ({a..f}); reject 3D-only members with non-default values. */
  private static read2DInit(init: Record<string, unknown>): number[] {
    if (init.is2D === false || MinimalDomMatrix.looksThreeD(init)) {
      throw new Error('3D matrices are not supported by the fallback DOMMatrix.');
    }
    const num = (value: unknown, fallback: number) => (typeof value === 'number' ? value : fallback);
    return [
      num(init.a, 1),
      num(init.b, 0),
      num(init.c, 0),
      num(init.d, 1),
      num(init.e, 0),
      num(init.f, 0),
    ];
  }

  private static looksThreeD(init: Record<string, unknown>): boolean {
    const keys = ['m13', 'm14', 'm23', 'm24', 'm31', 'm32', 'm33', 'm34', 'm43', 'm44'];
    return keys.some((key, index) => {
      const value = init[key];
      return value !== undefined && value !== THREE_D_ONLY[index];
    });
  }

  /** this × other with the column-vector convention. */
  private static compose(left: Affine2D, right: Affine2D): Affine2D {
    const [la, lb, lc, ld, le, lf] = left;
    const [ra, rb, rc, rd, re, rf] = right;
    return [
      la * ra + lc * rb,
      lb * ra + ld * rb,
      la * rc + lc * rd,
      lb * rc + ld * rd,
      la * re + lc * rf + le,
      lb * re + ld * rf + lf,
    ];
  }

  private static to2D(value: unknown): Affine2D {
    if (value instanceof MinimalDomMatrix) return [...value.#m];
    return MinimalDomMatrix.read2DInit((value ?? {}) as Record<string, unknown>) as Affine2D;
  }

  // a–f are writable in the DOMMatrix spec, and pdfjs mutates them directly
  // (e.g. `SCALE_MATRIX.a = 1 / scaleX` in its canvas path), so the fallback
  // must expose setters or strict-mode assignment throws.
  get a() { return this.#m[0]; }
  set a(value: number) { this.#m[0] = value; }
  get b() { return this.#m[1]; }
  set b(value: number) { this.#m[1] = value; }
  get c() { return this.#m[2]; }
  set c(value: number) { this.#m[2] = value; }
  get d() { return this.#m[3]; }
  set d(value: number) { this.#m[3] = value; }
  get e() { return this.#m[4]; }
  set e(value: number) { this.#m[4] = value; }
  get f() { return this.#m[5]; }
  set f(value: number) { this.#m[5] = value; }

  get m11() { return this.#m[0]; }
  set m11(value: number) { this.#m[0] = value; }
  get m12() { return this.#m[1]; }
  set m12(value: number) { this.#m[1] = value; }
  get m13() { return 0; }
  get m14() { return 0; }
  get m21() { return this.#m[2]; }
  set m21(value: number) { this.#m[2] = value; }
  get m22() { return this.#m[3]; }
  set m22(value: number) { this.#m[3] = value; }
  get m23() { return 0; }
  get m24() { return 0; }
  get m31() { return 0; }
  get m32() { return 0; }
  get m33() { return 1; }
  get m34() { return 0; }
  get m41() { return this.#m[4]; }
  set m41(value: number) { this.#m[4] = value; }
  get m42() { return this.#m[5]; }
  set m42(value: number) { this.#m[5] = value; }
  get m43() { return 0; }
  get m44() { return 1; }

  get is2D() { return true; }

  get isIdentity() {
    const [a, b, c, d, e, f] = this.#m;
    return a === 1 && b === 0 && c === 0 && d === 1 && e === 0 && f === 0;
  }

  translate(tx = 0, ty = 0, tz = 0): MinimalDomMatrix {
    if (tz) throw new Error('3D translate is not supported by the fallback DOMMatrix.');
    return new MinimalDomMatrix(MinimalDomMatrix.compose(this.#m, [1, 0, 0, 1, tx, ty]));
  }

  scale(scaleX = 1, scaleY = scaleX, originX = 0, originY = 0, originZ = 0): MinimalDomMatrix {
    if (originZ) throw new Error('3D scale is not supported by the fallback DOMMatrix.');
    const op: Affine2D = [scaleX, 0, 0, scaleY, originX * (1 - scaleX), originY * (1 - scaleY)];
    return new MinimalDomMatrix(MinimalDomMatrix.compose(this.#m, op));
  }

  rotate(rotX = 0, rotY = 0, rotZ = 0): MinimalDomMatrix {
    if (rotY || rotZ) throw new Error('3D rotate is not supported by the fallback DOMMatrix.');
    const radians = (rotX * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return new MinimalDomMatrix(MinimalDomMatrix.compose(this.#m, [cos, sin, -sin, cos, 0, 0]));
  }

  skewX(angle = 0): MinimalDomMatrix {
    return new MinimalDomMatrix(MinimalDomMatrix.compose(this.#m, [1, 0, Math.tan((angle * Math.PI) / 180), 1, 0, 0]));
  }

  skewY(angle = 0): MinimalDomMatrix {
    return new MinimalDomMatrix(MinimalDomMatrix.compose(this.#m, [1, Math.tan((angle * Math.PI) / 180), 0, 1, 0, 0]));
  }

  multiply(other: unknown): MinimalDomMatrix {
    return new MinimalDomMatrix(MinimalDomMatrix.compose(this.#m, MinimalDomMatrix.to2D(other)));
  }

  flipX(): MinimalDomMatrix {
    return new MinimalDomMatrix(MinimalDomMatrix.compose(this.#m, [-1, 0, 0, 1, 0, 0]));
  }

  flipY(): MinimalDomMatrix {
    return new MinimalDomMatrix(MinimalDomMatrix.compose(this.#m, [1, 0, 0, -1, 0, 0]));
  }

  /** Spec name (non-mutating). */
  inverse(): MinimalDomMatrix {
    return this.invert();
  }

  /** Spec name (mutating in place). */
  invertSelf(): MinimalDomMatrix {
    this.#m = this.invert().#m;
    return this;
  }

  invert(): MinimalDomMatrix {
    const [a, b, c, d, e, f] = this.#m;
    const determinant = a * d - b * c;
    if (determinant === 0) throw new Error('The matrix is not invertible.');
    return new MinimalDomMatrix([
      d / determinant,
      -b / determinant,
      -c / determinant,
      a / determinant,
      (c * f - d * e) / determinant,
      (b * e - a * f) / determinant,
    ]);
  }

  transformPoint(point?: { x?: number; y?: number; z?: number; w?: number }) {
    const x = point?.x ?? 0;
    const y = point?.y ?? 0;
    if (point?.z || (point?.w !== undefined && point.w !== 1)) {
      throw new Error('3D points are not supported by the fallback DOMMatrix.');
    }
    const [a, b, c, d, e, f] = this.#m;
    return { x: a * x + c * y + e, y: b * x + d * y + f, z: 0, w: 1 };
  }

  toString(): string {
    return `matrix(${this.#m.join(', ')})`;
  }

  static fromMatrix(other: unknown): MinimalDomMatrix {
    return new MinimalDomMatrix(other);
  }

  static fromFloat32Array(values: ArrayLike<number>): MinimalDomMatrix {
    return new MinimalDomMatrix(Array.from(values));
  }

  static fromFloat64Array(values: ArrayLike<number>): MinimalDomMatrix {
    return new MinimalDomMatrix(Array.from(values));
  }
}

let canvasGlobalsTask: Promise<void> | null = null;

/**
 * Ensure the canvas globals pdfjs-dist touches during module init exist before
 * the legacy build is imported. Prefers the real native implementations from
 * @napi-rs/canvas (making the optional dependency explicit for tracing) and
 * falls back to the pure-JS stub above. Never overwrites an existing global.
 */
async function ensurePdfJsCanvasGlobals(): Promise<void> {
  canvasGlobalsTask ??= (async () => {
    const globals = globalThis as unknown as {
      DOMMatrix?: unknown;
      ImageData?: unknown;
      Path2D?: unknown;
    };
    if (globals.DOMMatrix && globals.ImageData && globals.Path2D) return;

    try {
      const canvas = await import('@napi-rs/canvas');
      globals.DOMMatrix ??= canvas.DOMMatrix;
      globals.ImageData ??= canvas.ImageData;
      globals.Path2D ??= canvas.Path2D;
    } catch {
      // Native canvas is not installed/traced here; the stub below keeps
      // pdfjs module init working for non-rendering (text) paths.
    }

    if (!globals.DOMMatrix) globals.DOMMatrix = MinimalDomMatrix;
  })();

  return canvasGlobalsTask;
}

async function openPdfJsDocument(buffer: Buffer): Promise<PdfJsTask> {
  await ensurePdfJsCanvasGlobals();
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const require = createRequire(path.join(process.cwd(), 'package.json'));
  const root = path.dirname(require.resolve('pdfjs-dist/package.json'));
  const task = getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    useSystemFonts: false,
    standardFontDataUrl: path.join(root, 'standard_fonts').replace(/\\/g, '/') + '/',
    cMapUrl: path.join(root, 'cmaps').replace(/\\/g, '/') + '/',
    cMapPacked: true,
    verbosity: 0,
  }) as PdfJsTask;

  return task;
}

/** Race a pdfjs promise against a timeout. A crafted or pathological PDF can
 *  stall parsing indefinitely, which would otherwise hang the request until
 *  the platform maxDuration (billing the full window). Bound it so the
 *  request fails fast instead. NOTE: the task object itself is never mutated
 *  (its `promise` is getter-only); the race happens at each await site. */
function awaitPdfJs<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  }) as Promise<T>;
}

/** Positioned glyphs so table tools can rebuild columns; never guess from raw PDF bytes. */
export async function extractPdfTextItems(buffer: Buffer): Promise<PdfTextItem[]> {
  const task = await openPdfJsDocument(buffer);
  try {
    const pdf = await awaitPdfJs(
      task.promise,
      PDFJS_PARSE_TIMEOUT_MS,
      'PDF parsing timed out. Please try a smaller or simpler file.',
    );
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

    const left = i === 0 ? Number.NEGATIVE_INFINITY : bounds[i - 1].right;

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
