'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Eraser, Highlighter, MousePointer2, PenTool, Type, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActiveTool } from '@/hooks/use-active-tool';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { ResultScreenAd, SmartlinkButton } from '@/components/ads/ad-banner';
import { triggerDownloadWithSmartlink } from '@/lib/ads-config';
import { toast } from 'sonner';

// ── Element model (page point coordinates, origin top-left, matching the
//    sign-workspace convention so export flips y once) ────────────────────────

type EditorTool = 'select' | 'text' | 'highlight' | 'whiteout' | 'pen';

interface BaseElement {
  id: number;
  page: number;
}

interface TextElement extends BaseElement {
  tool: 'text';
  x: number;
  y: number; // top of the first line
  lines: string[];
  size: number; // pt
  color: string; // hex
}

interface RectElement extends BaseElement {
  tool: 'highlight' | 'whiteout';
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

interface PenElement extends BaseElement {
  tool: 'pen';
  points: Array<[number, number]>; // page points
  width: number; // pt
  color: string;
}

type EditorElement = TextElement | RectElement | PenElement;

const TEXT_COLORS = ['#111111', '#ffffff', '#dc2626', '#2563eb'];
const HIGHLIGHT_COLORS = ['#facc15', '#86efac', '#f9a8d4', '#67e8f9'];
const PEN_COLORS = ['#111111', '#dc2626', '#2563eb', '#16a34a'];
const LINE_SPACING = 1.3;
const ASCENT = 0.8;

function hexToRgb01(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return { r: 0, g: 0, b: 0 };
  const n = parseInt(m[1], 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

// ── Component ────────────────────────────────────────────────────────────────

export function PdfEditorWorkspace() {
  const { activeTool, uploadedFile, isProcessing, setIsProcessing, setProgress, reset } = useActiveTool();

  const [pageCount, setPageCount] = useState(0);
  const [pageWidth, setPageWidth] = useState(612); // PDF points
  const [pageHeight, setPageHeight] = useState(792);
  const [currentPage, setCurrentPage] = useState(1);
  const [encrypted, setEncrypted] = useState(false);
  const [renderReady, setRenderReady] = useState(false);

  const [tool, setTool] = useState<EditorTool>('select');
  const [textColor, setTextColor] = useState(TEXT_COLORS[0]);
  const [highlightColor, setHighlightColor] = useState(HIGHLIGHT_COLORS[0]);
  const [penColor, setPenColor] = useState(PEN_COLORS[0]);
  const [fontSize, setFontSize] = useState(14);
  const [penWidth, setPenWidth] = useState(2);
  const [textDraft, setTextDraft] = useState('');
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState('edited.pdf');

  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<{ numPages: number; getPage: (n: number) => Promise<any>; destroy: () => Promise<void> | void } | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const nextIdRef = useRef(1);
  // Drag state lives in refs (not state) so pointermove doesn't re-render React.
  const dragRef = useRef<{
    mode: 'create-rect' | 'move' | 'resize';
    startPage: [number, number];
    element?: EditorElement;
    orig?: { x: number; y: number; w?: number; h?: number };
  } | null>(null);
  const penWipRef = useRef<PenElement | null>(null);
  const [, forceRedraw] = useState(0);

  // ── Load PDF document ──
  useEffect(() => {
    let cancelled = false;
    setEncrypted(false);
    setRenderReady(false);
    setElements([]);
    setSelectedId(null);
    setCurrentPage(1);
    setResultUrl(null);
    if (!uploadedFile) {
      pdfDocRef.current?.destroy();
      pdfDocRef.current = null;
      setPageCount(0);
      return;
    }
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const data = await uploadedFile.arrayBuffer();
        if (cancelled) return;
        const loaded = await pdfjs.getDocument({
          data: new Uint8Array(data),
          cMapUrl: '/pdfjs/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: '/pdfjs/standard_fonts/',
        }).promise;
        if (cancelled) {
          void loaded.destroy();
          return;
        }
        pdfDocRef.current?.destroy();
        pdfDocRef.current = loaded;
        setPageCount(loaded.numPages);
        const page = await loaded.getPage(1);
        const vp = page.getViewport({ scale: 1 });
        setPageWidth(vp.width);
        setPageHeight(vp.height);
        toast.success(`PDF loaded (${loaded.numPages} page${loaded.numPages === 1 ? '' : 's'})`);
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error && /password/i.test(err.message)
            ? err.message
            : 'Could not read this PDF — is it a valid document?';
          if (/password/i.test(message)) setEncrypted(true);
          toast.error(message);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uploadedFile]);

  // ── Render the base page canvas ──
  useEffect(() => {
    const doc = pdfDocRef.current;
    const canvas = baseCanvasRef.current;
    if (!doc || !canvas) return;
    let cancelled = false;
    setRenderReady(false);
    (async () => {
      try {
        const safePage = Math.min(Math.max(1, currentPage), doc.numPages || 1);
        const page = await doc.getPage(safePage);
        if (cancelled) return;
        const vp1 = page.getViewport({ scale: 1 });
        const targetScale = Math.min(2, Math.max(1.2, 900 / Math.max(1, vp1.width)));
        const viewport = page.getViewport({ scale: targetScale });
        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        renderTaskRef.current?.cancel();
        const task = page.render({ canvas, viewport });
        renderTaskRef.current = task as { cancel: () => void };
        await task.promise;
        if (!cancelled) setRenderReady(true);
      } catch {
        if (!cancelled) setRenderReady(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentPage, pageCount, uploadedFile]);

  // ── Measure text width in page points (uses overlay canvas metrics) ──
  const measureText = useCallback((lines: string[], size: number): { w: number; h: number } => {
    const canvas = overlayCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    const scale = canvas && pageWidth ? canvas.width / pageWidth : 1;
    let displayW = 0;
    if (ctx) {
      ctx.font = `${size * scale}px Helvetica, Arial, sans-serif`;
      for (const line of lines) {
        displayW = Math.max(displayW, ctx.measureText(line).width);
      }
    }
    const w = ctx ? displayW / (scale || 1) : size * 0.55 * Math.max(1, ...lines.map((l) => l.length || 1));
    return { w, h: lines.length * size * LINE_SPACING };
  }, [pageWidth]);

  // ── Draw overlay (committed elements + live pen stroke + drag preview) ──
  const drawOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    const base = baseCanvasRef.current;
    if (!canvas || !base || !pageWidth) return;
    canvas.width = base.width;
    canvas.height = base.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const scale = canvas.width / pageWidth;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawText = (el: TextElement) => {
      ctx.fillStyle = el.color;
      ctx.font = `${el.size * scale}px Helvetica, Arial, sans-serif`;
      ctx.textBaseline = 'top';
      el.lines.forEach((line, i) => {
        ctx.fillText(line, el.x * scale, el.y * scale + i * el.size * LINE_SPACING * scale);
      });
    };

    for (const el of elements) {
      if (el.page !== currentPage) continue;
      if (el.tool === 'highlight') {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = el.color;
        ctx.fillRect(el.x * scale, el.y * scale, el.w * scale, el.h * scale);
        ctx.restore();
      } else if (el.tool === 'whiteout') {
        ctx.fillStyle = el.color;
        ctx.fillRect(el.x * scale, el.y * scale, el.w * scale, el.h * scale);
      } else if (el.tool === 'pen') {
        ctx.strokeStyle = el.color;
        ctx.lineWidth = Math.max(1, el.width * scale);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        el.points.forEach(([px, py], i) => {
          if (i === 0) ctx.moveTo(px * scale, py * scale);
          else ctx.lineTo(px * scale, py * scale);
        });
        ctx.stroke();
      } else {
        drawText(el as TextElement);
      }
      if (el.id === selectedId) {
        const b = el.tool === 'text'
          ? { x: el.x, y: el.y, ...measureText(el.lines, el.size) }
          : el.tool === 'pen'
            ? boundsOfPen(el)
            : { x: el.x, y: el.y, w: el.w, h: el.h };
        ctx.save();
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(b.x * scale, b.y * scale, b.w * scale, b.h * scale);
        // resize handle at bottom-right for rects
        if (el.tool === 'highlight' || el.tool === 'whiteout') {
          ctx.setLineDash([]);
          ctx.fillStyle = '#4f46e5';
          const hs = 8;
          ctx.fillRect((b.x + b.w) * scale - hs / 2, (b.y + b.h) * scale - hs / 2, hs, hs);
        }
        ctx.restore();
      }
    }

    // Drag previews
    const drag = dragRef.current;
    if (drag && drag.mode === 'create-rect') {
      // start point vs current pointer (tracked on the native move listener)
      void drag;
    }
    const wip = penWipRef.current;
    if (wip && wip.page === currentPage && wip.points.length > 1) {
      ctx.strokeStyle = wip.color;
      ctx.lineWidth = Math.max(1, wip.width * scale);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      wip.points.forEach(([px, py], i) => {
        if (i === 0) ctx.moveTo(px * scale, py * scale);
        else ctx.lineTo(px * scale, py * scale);
      });
      ctx.stroke();
    }
  }, [elements, currentPage, selectedId, pageWidth, measureText]);

  useEffect(() => {
    if (renderReady) drawOverlay();
  }, [drawOverlay, renderReady]);

  function boundsOfPen(el: PenElement) {
    const xs = el.points.map((p) => p[0]);
    const ys = el.points.map((p) => p[1]);
    const pad = el.width;
    return {
      x: Math.min(...xs) - pad,
      y: Math.min(...ys) - pad,
      w: Math.max(...xs) - Math.min(...xs) + pad * 2,
      h: Math.max(...ys) - Math.min(...ys) + pad * 2,
    };
  }

  // ── Pointer helpers ──
  const hitTest = useCallback((px: number, py: number): EditorElement | null => {
    const pageEls = elements.filter((e) => e.page === currentPage);
    for (let i = pageEls.length - 1; i >= 0; i--) {
      const el = pageEls[i];
      const b = el.tool === 'text'
        ? { x: el.x, y: el.y, ...measureText(el.lines, el.size) }
        : el.tool === 'pen'
          ? boundsOfPen(el)
          : { x: el.x, y: el.y, w: el.w, h: el.h };
      if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) return el;
    }
    return null;
  }, [elements, currentPage, measureText]);

  const addElement = useCallback((el: Omit<TextElement, 'id'> | Omit<RectElement, 'id'> | Omit<PenElement, 'id'>) => {
    const withId = { ...el, id: nextIdRef.current++ } as EditorElement;
    setElements((prev) => [...prev, withId]);
    setSelectedId(withId.id);
  }, []);

  const undo = useCallback(() => {
    setElements((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      if (selectedId === last.id) setSelectedId(null);
      return prev.slice(0, -1);
    });
  }, [selectedId]);

  const deleteSelected = useCallback(() => {
    if (selectedId == null) return;
    setElements((prev) => prev.filter((e) => e.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  // ── Native pointer pipeline on the overlay canvas (works for mouse, touch,
  //    and pen; React handlers proved unreliable for pointer capture) ──
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || !renderReady || !uploadedFile) return;

    const getPoint = (ev: PointerEvent): [number, number] => {
      const rect = canvas.getBoundingClientRect();
      const scale = canvas.width / rect.width;
      const conv = pageWidth ? canvas.width / pageWidth : 1;
      return [((ev.clientX - rect.left) * scale) / conv, ((ev.clientY - rect.top) * scale) / conv];
    };

    const onDown = (ev: PointerEvent) => {
      ev.preventDefault();
      canvas.setPointerCapture(ev.pointerId);
      const [px, py] = getPoint(ev);

      if (tool === 'text') {
        addElement({
          tool: 'text', page: currentPage, x: px, y: py,
          lines: (textDraft || 'New text').split('\n'),
          size: fontSize, color: textColor,
        });
        setTool('select');
        return;
      }
      if (tool === 'pen') {
        penWipRef.current = { id: nextIdRef.current++, tool: 'pen', page: currentPage, points: [[px, py]], width: penWidth, color: penColor };
        forceRedraw((v) => v + 1);
        return;
      }
      if (tool === 'highlight' || tool === 'whiteout') {
        dragRef.current = {
          mode: 'create-rect',
          startPage: [px, py],
          element: { id: -1, page: currentPage, tool, x: px, y: py, w: 0, h: 0, color: tool === 'highlight' ? highlightColor : '#ffffff' },
        };
        return;
      }
      // select tool
      const pageEls = elements.filter((e) => e.page === currentPage);
      const selected = pageEls.find((e) => e.id === selectedId);
      if (selected && (selected.tool === 'highlight' || selected.tool === 'whiteout')) {
        const b = { x: selected.x, y: selected.y, w: selected.w, h: selected.h };
        const handleSize = 10 / (canvas.width / pageWidth);
        if (Math.abs(px - (b.x + b.w)) < handleSize && Math.abs(py - (b.y + b.h)) < handleSize) {
          dragRef.current = { mode: 'resize', startPage: [px, py], element: selected, orig: { x: selected.x, y: selected.y, w: selected.w, h: selected.h } };
          return;
        }
      }
      const hit = hitTest(px, py);
      if (hit) {
        setSelectedId(hit.id);
        const orig = hit.tool === 'text'
          ? { x: hit.x, y: hit.y }
          : hit.tool === 'pen'
            ? { x: 0, y: 0 }
            : { x: hit.x, y: hit.y, w: hit.w, h: hit.h };
        dragRef.current = { mode: 'move', startPage: [px, py], element: hit, orig };
      } else {
        setSelectedId(null);
      }
    };

    const onMove = (ev: PointerEvent) => {
      const drag = dragRef.current;
      const [px, py] = getPoint(ev);

      // live pen stroke
      const wip = penWipRef.current;
      if (wip) {
        const last = wip.points[wip.points.length - 1];
        if (!last || Math.hypot(px - last[0], py - last[1]) > 1.5) {
          wip.points.push([px, py]);
          forceRedraw((v) => v + 1);
        }
        return;
      }
      if (!drag) return;

      if (drag.mode === 'create-rect' && drag.element) {
        const rect = drag.element as RectElement;
        rect.w = Math.abs(px - drag.startPage[0]);
        rect.h = Math.abs(py - drag.startPage[1]);
        rect.x = Math.min(px, drag.startPage[0]);
        rect.y = Math.min(py, drag.startPage[1]);
        // draw preview directly on the overlay without committing state
        drawOverlay();
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const scale = canvas.width / pageWidth;
          ctx.save();
          ctx.globalAlpha = rect.tool === 'highlight' ? 0.35 : 1;
          ctx.fillStyle = rect.color;
          ctx.fillRect(rect.x * scale, rect.y * scale, rect.w * scale, rect.h * scale);
          ctx.restore();
        }
        return;
      }
      if (drag.mode === 'move' && drag.element && drag.orig) {
        const dx = px - drag.startPage[0];
        const dy = py - drag.startPage[1];
        const el = drag.element;
        setElements((prev) => prev.map((e) => {
          if (e.id !== el.id) return e;
          if (e.tool === 'text') return { ...e, x: drag.orig!.x + dx, y: drag.orig!.y + dy };
          if (e.tool === 'pen') return { ...e, points: e.points.map(([qx, qy]) => [qx + dx, qy + dy] as [number, number]) };
          return { ...e, x: drag.orig!.x + dx, y: drag.orig!.y + dy };
        }));
        return;
      }
      if (drag.mode === 'resize' && drag.element && drag.orig?.w !== undefined) {
        const dx = px - drag.startPage[0];
        const dy = py - drag.startPage[1];
        const el = drag.element as RectElement;
        setElements((prev) => prev.map((e) => (e.id === el.id
          ? { ...e, w: Math.max(8, drag.orig!.w! + dx), h: Math.max(8, drag.orig!.h! + dy) }
          : e)));
      }
    };

    const onUp = () => {
      const wip = penWipRef.current;
      if (wip) {
        penWipRef.current = null;
        if (wip.points.length > 1) {
          setElements((prev) => [...prev, wip]);
          setSelectedId(wip.id);
        }
        forceRedraw((v) => v + 1);
        return;
      }
      const drag = dragRef.current;
      dragRef.current = null;
      if (drag?.mode === 'create-rect' && drag.element) {
        const rect = drag.element as RectElement;
        if (rect.w > 4 && rect.h > 3) {
          const clean: Omit<RectElement, 'id'> = {
            tool: rect.tool, page: rect.page, x: rect.x, y: rect.y, w: rect.w, h: rect.h, color: rect.color,
          };
          addElement(clean);
        }
        forceRedraw((v) => v + 1);
      }
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
  }, [renderReady, uploadedFile, tool, currentPage, pageWidth, elements, selectedId, textDraft, fontSize, textColor, penWidth, penColor, highlightColor, addElement, hitTest, drawOverlay]);

  // Keyboard: Delete removes selection, Ctrl+Z undo
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const target = ev.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if ((ev.key === 'Delete' || ev.key === 'Backspace') && selectedId != null) {
        ev.preventDefault();
        deleteSelected();
      }
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z') {
        ev.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, deleteSelected, undo]);

  // ── Export with pdf-lib (vector overlay) ──
  const handleExport = useCallback(async () => {
    if (!uploadedFile) {
      toast.error('Please upload a PDF first');
      return;
    }
    setIsProcessing(true);
    setProgress(25);
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      const buffer = await uploadedFile.arrayBuffer();
      const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
      if (pdf.isEncrypted) throw new Error('This PDF is password-protected — unlock it before editing.');
      const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

      const sanitize = (value: string) => value
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ');

      let applied = 0;
      for (const el of elements) {
        const page = pdf.getPage(Math.min(Math.max(0, el.page - 1), pdf.getPageCount() - 1));
        const { width: pw, height: ph } = page.getSize();
        void pw;
        if (el.tool === 'text') {
          const lines = el.lines.map(sanitize).filter((l) => l.trim().length > 0);
          if (!lines.length) continue;
          lines.forEach((line, i) => {
            page.drawText(line, {
              x: el.x,
              y: ph - (el.y + i * el.size * LINE_SPACING) - el.size * ASCENT,
              size: el.size,
              font: boldFont,
              color: (() => { const c = hexToRgb01(el.color); return rgb(c.r, c.g, c.b); })(),
            });
          });
          applied++;
        } else if (el.tool === 'highlight') {
          const c = hexToRgb01(el.color);
          page.drawRectangle({
            x: el.x, y: ph - el.y - el.h, width: el.w, height: el.h,
            color: rgb(c.r, c.g, c.b), opacity: 0.35,
          });
          applied++;
        } else if (el.tool === 'whiteout') {
          page.drawRectangle({
            x: el.x, y: ph - el.y - el.h, width: el.w, height: el.h,
            color: rgb(1, 1, 1),
          });
          applied++;
        } else if (el.tool === 'pen') {
          const c = hexToRgb01(el.color);
          for (let i = 1; i < el.points.length; i++) {
            const [ax, ay] = el.points[i - 1];
            const [bx, by] = el.points[i];
            page.drawLine({
              start: { x: ax, y: ph - ay },
              end: { x: bx, y: ph - by },
              thickness: el.width,
              color: rgb(c.r, c.g, c.b),
              lineCap: 1,
            });
          }
          applied++;
        }
      }

      const bytes = await pdf.save();
      const copy = new Uint8Array(bytes.byteLength);
      copy.set(bytes);
      const blob = new Blob([copy.buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return url;
      });
      setResultName(uploadedFile.name.replace(/\.pdf$/i, '-edited.pdf'));
      setProgress(100);
      toast.success(applied ? `Edited PDF ready — ${applied} edit${applied === 1 ? '' : 's'} applied` : 'PDF exported (no edits were on the document)');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedFile, elements, setIsProcessing, setProgress]);

  const handleReset = useCallback(() => {
    reset();
    setElements([]);
    setSelectedId(null);
    setCurrentPage(1);
    setTool('select');
    setTextDraft('');
    setResultUrl(null);
  }, [reset]);

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

  const selected = elements.find((e) => e.id === selectedId && e.page === currentPage) ?? null;
  const pageEdits = elements.filter((e) => e.page === currentPage).length;

  const TOOL_BUTTONS: Array<{ id: EditorTool; label: string; icon: React.ReactNode }> = [
    { id: 'select', label: 'Select & move', icon: <MousePointer2 className="w-4 h-4" /> },
    { id: 'text', label: 'Add text', icon: <Type className="w-4 h-4" /> },
    { id: 'highlight', label: 'Highlight', icon: <Highlighter className="w-4 h-4" /> },
    { id: 'whiteout', label: 'Whiteout', icon: <Eraser className="w-4 h-4" /> },
    { id: 'pen', label: 'Pen', icon: <PenTool className="w-4 h-4" /> },
  ];

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl">
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        icon={<PenTool className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'Renders and exports 100% in your browser — documents never upload',
          'Edits export as a vector overlay; original text stays selectable',
          'Text · Highlight · Whiteout · Pen · Move/resize · Undo (Ctrl+Z)',
        ]}
      />

      {!uploadedFile ? (
        <div className="mt-8 max-w-xl mx-auto">
          <FileUpload accept="application/pdf,.pdf" />
        </div>
      ) : (
        <div className="mt-8 grid lg:grid-cols-[280px_1fr] gap-6 items-start">
          {/* ── Toolbar ── */}
          <div className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden shadow-premium">
              <div className="p-4 border-b border-border/40 bg-gradient-to-r from-primary/10 to-transparent flex items-center justify-between">
                <h3 className="font-bold tracking-tight text-foreground text-sm">Tools</h3>
                <span className="text-[11px] text-muted-foreground">Page {currentPage}/{pageCount || 1} · {pageEdits} edit{pageEdits === 1 ? '' : 's'}</span>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {TOOL_BUTTONS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTool(t.id)}
                      aria-pressed={tool === t.id}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${
                        tool === t.id
                          ? 'border-primary/50 bg-primary/10 text-primary'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground'
                      }`}
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </div>

                {tool === 'text' && (
                  <div className="space-y-3 rounded-xl border border-border/60 p-3">
                    <div className="space-y-2">
                      <Label htmlFor="pde-text" className="text-xs">Text to place (click page)</Label>
                      <textarea
                        id="pde-text"
                        value={textDraft}
                        onChange={(e) => setTextDraft(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm outline-none resize-y focus:border-primary/40 text-foreground/90"
                        placeholder="Type the text, then click where it should go…"
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {TEXT_COLORS.map((c) => (
                        <button key={c} type="button" aria-label={`Text color ${c}`} onClick={() => setTextColor(c)}
                          className={`w-6 h-6 rounded-full border-2 ${textColor === c ? 'border-primary' : 'border-border'}`}
                          style={{ background: c }} />
                      ))}
                      <span className="ml-auto flex items-center gap-1.5">
                        <Label htmlFor="pde-fs" className="text-xs">Size</Label>
                        <Input id="pde-fs" type="number" min={6} max={72} value={fontSize}
                          onChange={(e) => setFontSize(Math.max(6, Math.min(72, Number(e.target.value) || 14)))}
                          className="w-16 h-8 text-xs" />
                      </span>
                    </div>
                  </div>
                )}

                {tool === 'highlight' && (
                  <div className="rounded-xl border border-border/60 p-3">
                    <Label className="text-xs mb-2 block">Highlight color</Label>
                    <div className="flex gap-2">
                      {HIGHLIGHT_COLORS.map((c) => (
                        <button key={c} type="button" aria-label={`Highlight color ${c}`} onClick={() => setHighlightColor(c)}
                          className={`w-6 h-6 rounded-full border-2 ${highlightColor === c ? 'border-primary' : 'border-border'}`}
                          style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                )}

                {tool === 'pen' && (
                  <div className="rounded-xl border border-border/60 p-3 space-y-2">
                    <div className="flex gap-2">
                      {PEN_COLORS.map((c) => (
                        <button key={c} type="button" aria-label={`Pen color ${c}`} onClick={() => setPenColor(c)}
                          className={`w-6 h-6 rounded-full border-2 ${penColor === c ? 'border-primary' : 'border-border'}`}
                          style={{ background: c }} />
                      ))}
                    </div>
                    <Label htmlFor="pde-pw" className="text-xs">Stroke width: {penWidth}pt</Label>
                    <input id="pde-pw" type="range" min={1} max={8} step={1} value={penWidth}
                      onChange={(e) => setPenWidth(Number(e.target.value))} className="w-full accent-primary" />
                  </div>
                )}

                {selected && selected.tool === 'text' && (
                  <div className="space-y-2 rounded-xl border border-primary/40 bg-primary/5 p-3">
                    <Label htmlFor="pde-edit-text" className="text-xs">Edit selected text</Label>
                    <textarea
                      id="pde-edit-text"
                      value={selected.lines.join('\n')}
                      onChange={(e) => setElements((prev) => prev.map((el) => (el.id === selected.id && el.tool === 'text'
                        ? { ...el, lines: e.target.value.split('\n') }
                        : el)))}
                      rows={3}
                      className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm outline-none resize-y focus:border-primary/40"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={undo} disabled={!elements.length}>
                    <Undo2 className="w-3.5 h-3.5" /> Undo
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-destructive hover:text-destructive" onClick={deleteSelected} disabled={selectedId == null}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>

            {resultUrl && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-3 shadow-premium">
                <p className="font-semibold text-sm">Edited PDF ready</p>
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

          {/* ── Canvas ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>
                  ← Prev
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setCurrentPage((p) => Math.min(pageCount || 1, p + 1))} disabled={currentPage >= pageCount}>
                  Next →
                </Button>
              </div>
              <Button className="gap-2 btn-premium rounded-xl font-bold" onClick={handleExport} disabled={isProcessing || !pageCount || encrypted}>
                {isProcessing ? 'Exporting…' : 'Export edited PDF'}
              </Button>
            </div>

            {encrypted ? (
              <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-10 text-center text-sm text-muted-foreground">
                This PDF is password-protected. Unlock it first with the free Unlock PDF tool, then edit here.
              </div>
            ) : (
              <div
                className="relative rounded-2xl border border-border bg-muted/30 overflow-hidden shadow-premium"
                style={{ aspectRatio: `${pageWidth} / ${pageHeight}` }}
              >
                <canvas
                  ref={baseCanvasRef}
                  aria-label={`PDF page ${currentPage}`}
                  className="absolute inset-0 w-full h-full block select-none"
                />
                <canvas
                  ref={overlayCanvasRef}
                  aria-label="PDF editing layer"
                  className={`absolute inset-0 w-full h-full block touch-none ${
                    tool === 'select' ? 'cursor-default' : 'cursor-crosshair'
                  }`}
                />
                {!renderReady && (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm bg-background/60">
                    Rendering page…
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground text-center">
              {tool === 'text' && 'Click anywhere on the page to place the text from the side panel.'}
              {tool === 'highlight' && 'Drag to draw a highlight over the passage.'}
              {tool === 'whiteout' && 'Drag to cover a line or area with whiteout.'}
              {tool === 'pen' && 'Draw freehand with the pointer or finger.'}
              {tool === 'select' && 'Click an edit to select it — drag to move, drag its corner to resize, Delete to remove.'}
            </p>
          </div>
        </div>
      )}

      {uploadedFile && !resultUrl && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <SmartlinkButton />
        </div>
      )}
    </div>
  );
}
