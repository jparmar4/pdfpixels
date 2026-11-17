'use client';

import { useEffect, useRef, useState } from 'react';

interface PdfPagePreviewProps {
  file: File;
  pageNumber: number;
  onPageDimensions?: (dims: { width: number; height: number }) => void;
  className?: string;
}

export function PdfPagePreview({
  file,
  pageNumber,
  onPageDimensions,
  className = '',
}: PdfPagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<{ numPages: number; getPage: (n: number) => Promise<any>; destroy: () => Promise<void> | void } | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const [docVersion, setDocVersion] = useState(0);
  const [rendered, setRendered] = useState(false);

  // Load PDFDocumentProxy once per uploaded File
  useEffect(() => {
    let cancelled = false;
    setRendered(false);

    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const data = await file.arrayBuffer();
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

        docRef.current?.destroy();
        docRef.current = loaded;
        setDocVersion((v) => v + 1);
      } catch {
        if (!cancelled) {
          docRef.current = null;
          setRendered(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
      if (docRef.current) {
        void docRef.current.destroy();
        docRef.current = null;
      }
    };
  }, [file]);

  // Render active page whenever doc loads or pageNumber changes
  useEffect(() => {
    const doc = docRef.current;
    if (!doc) return;
    let cancelled = false;

    (async () => {
      try {
        const safePage = Math.min(Math.max(1, pageNumber), doc.numPages || 1);
        const page = await doc.getPage(safePage);
        if (cancelled) return;

        const vp1 = page.getViewport({ scale: 1 });
        onPageDimensions?.({ width: vp1.width, height: vp1.height });

        const targetScale = Math.min(2, Math.max(1.2, 960 / Math.max(1, vp1.width)));
        const viewport = page.getViewport({ scale: targetScale });
        const canvas = canvasRef.current;
        if (!canvas) return;

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
        if (!cancelled) setRendered(true);
      } catch {
        if (!cancelled) setRendered(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [docVersion, pageNumber, onPageDimensions]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={`PDF page ${pageNumber} preview`}
      className={`pointer-events-none select-none block w-full h-full bg-white transition-opacity duration-150 ${rendered ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  );
}
