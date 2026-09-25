'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Minus, Plus, RotateCcw, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActiveTool } from '@/hooks/use-active-tool';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { toast } from 'sonner';

const PDFJS_VERSION = '5.4.624';
const MIN_SCALE = 0.5;
const MAX_SCALE = 4;

export function PDFReaderWorkspace() {
  const { activeTool, reset } = useActiveTool();
  const [doc, setDoc] = useState<{ numPages: number; destroy: () => void } | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [scale, setScale] = useState(1.25);
  const [rendering, setRendering] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Bump to re-render the current page at the same page/scale.

  // Render the current page whenever doc/page/scale changes.
  useEffect(() => {
    if (!doc) return;
    let cancelled = false;

    (async () => {
      const pdfjs = await import('pdfjs-dist');
      // Worker + CJK cmaps; standard fonts come from the matching CDN version.
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      const currentDoc = doc as unknown as import('pdfjs-dist').PDFDocumentProxy;
      const page = await currentDoc.getPage(Math.min(Math.max(1, pageNumber), currentDoc.numPages));
      if (cancelled) return;

      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ratio = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;

      renderTaskRef.current?.cancel();
      const task = page.render({
        canvas,
        viewport,
        transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined,
      });
      renderTaskRef.current = task as unknown as { cancel: () => void };
      try {
        await task.promise;
      } catch (error) {
        if (!cancelled && !(error instanceof Error && error.name === 'RenderingCancelledException')) {
          toast.error('This page could not be rendered.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [doc, pageNumber, scale]);

  // Clean up the loaded document when it changes or the workspace unmounts.
  useEffect(() => {
    return () => {
      renderTaskRef.current?.cancel();
      doc?.destroy();
    };
  }, [doc]);

  const loadFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      toast.error('Please choose a PDF file');
      return;
    }
    try {
      setRendering(true);
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      const data = await file.arrayBuffer();
      const loaded = await pdfjs.getDocument({
        data: new Uint8Array(data),
        cMapUrl: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/standard_fonts/`,
      }).promise;

      setDoc(loaded as unknown as { numPages: number; destroy: () => void });
      setFileName(file.name);
      setPageNumber(1);
      setPageInput('1');
      toast.success(`Opened ${file.name} · ${loaded.numPages} page${loaded.numPages === 1 ? '' : 's'}`);
    } catch {
      toast.error('Could not open this PDF. It may be corrupt or password-protected.');
    } finally {
      setRendering(false);
    }
  }, []);

  const goToPage = useCallback((target: number) => {
    if (!doc) return;
    const clamped = Math.min(Math.max(1, target), doc.numPages);
    setPageNumber(clamped);
    setPageInput(String(clamped));
  }, [doc]);

  const handleReset = useCallback(() => {
    setDoc(null);
    setFileName(null);
    setPageNumber(1);
    setPageInput('1');
    setScale(1.25);
    reset();
  }, [reset]);

  if (!activeTool) return null;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl">
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        icon={<Eye className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'Runs locally in your browser — the file is never uploaded',
          'PDF only · large image-heavy documents render page by page',
          'Encrypted PDFs must be unlocked before they can be opened',
        ]}
      />

      {!doc ? (
        <div className="mt-8">
          <div
            role="button"
            tabIndex={0}
            aria-label="Choose a PDF to read"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) void loadFile(file);
            }}
            className="drop-zone flex flex-col items-center justify-center p-12 rounded-2xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void loadFile(file);
              }}
            />
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
              <Eye className="w-10 h-10 text-primary" />
            </div>
            <p className="text-lg font-semibold">Open a PDF</p>
            <p className="text-sm text-muted-foreground mt-1">Drag, drop, or click — read it right here, nothing is uploaded</p>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <div className="bg-card border rounded-2xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-sm truncate max-w-[220px]">{fileName}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {rendering ? 'Opening…' : `Page ${pageNumber} of ${doc.numPages}`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                aria-label="Previous page"
                disabled={pageNumber <= 1}
                onClick={() => goToPage(pageNumber - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Input
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') goToPage(parseInt(pageInput, 10) || 1);
                }}
                onBlur={() => goToPage(parseInt(pageInput, 10) || pageNumber)}
                className="w-14 h-8 text-center text-xs"
                inputMode="numeric"
                aria-label="Page number"
              />
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                aria-label="Next page"
                disabled={pageNumber >= doc.numPages}
                onClick={() => goToPage(pageNumber + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                aria-label="Zoom out"
                disabled={scale <= MIN_SCALE}
                onClick={() => setScale((s) => Math.max(MIN_SCALE, Math.round((s - 0.25) * 100) / 100))}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground w-10 text-center" aria-live="polite">
                {Math.round(scale * 100)}%
              </span>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                aria-label="Zoom in"
                disabled={scale >= MAX_SCALE}
                onClick={() => setScale((s) => Math.min(MAX_SCALE, Math.round((s + 0.25) * 100) / 100))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setScale(1.25)}
                className="text-xs text-muted-foreground gap-1"
                aria-label="Reset zoom"
              >
                <Plus className="w-3 h-3 rotate-45" /> Fit
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-muted/40 overflow-auto p-4 flex justify-center min-h-[420px] max-h-[75vh]">
            <canvas
              ref={canvasRef}
              role="img"
              aria-label={`PDF page ${pageNumber} preview`}
              className="rounded-lg shadow-lg bg-white max-w-none"
            />
          </div>

          <div className="flex justify-center">
            <Button size="sm" variant="ghost" onClick={handleReset} className="text-xs text-muted-foreground">
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Close document
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
