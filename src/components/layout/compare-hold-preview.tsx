'use client';

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { useSpaceCompareHold } from '@/hooks/use-pro-tool-shortcuts';
import { cn } from '@/lib/utils';

interface CompareHoldPreviewProps {
  processedSrc: string;
  originalSrc?: string | null;
  originalFile?: File | null;
  alt: string;
  containerClassName?: string;
  imgClassName?: string;
}

/**
 * Reusable result preview supporting Pro Spacebar hold (`Hold Space to compare original`)
 * and pointer press comparison with automatic object-URL lifecycle cleanup.
 */
export function CompareHoldPreview({
  processedSrc,
  originalSrc,
  originalFile,
  alt,
  containerClassName,
  imgClassName,
}: CompareHoldPreviewProps) {
  const spaceHeld = useSpaceCompareHold();
  const [pointerHeld, setPointerHeld] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (originalSrc || !originalFile || !originalFile.type.startsWith('image/')) {
      setFileUrl(null);
      return;
    }
    const created = URL.createObjectURL(originalFile);
    setFileUrl(created);
    return () => URL.revokeObjectURL(created);
  }, [originalSrc, originalFile]);

  const resolvedOriginal = originalSrc || fileUrl;
  const showingOriginal = Boolean(resolvedOriginal && (spaceHeld || pointerHeld));

  return (
    <div className={cn('relative flex items-center justify-center overflow-hidden rounded-[1.35rem]', containerClassName)}>
      <img
        src={showingOriginal && resolvedOriginal ? resolvedOriginal : processedSrc}
        alt={showingOriginal ? 'Original source preview' : alt}
        loading="lazy"
        decoding="async"
        className={cn('max-h-full max-w-full object-contain transition-opacity duration-75', imgClassName)}
      />

      {resolvedOriginal && (
        <button
          type="button"
          onPointerDown={() => setPointerHeld(true)}
          onPointerUp={() => setPointerHeld(false)}
          onPointerLeave={() => setPointerHeld(false)}
          onPointerCancel={() => setPointerHeld(false)}
          className={cn(
            'absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold backdrop-blur-md transition-colors select-none',
            showingOriginal
              ? 'border-amber-400 bg-amber-500/90 text-white'
              : 'border-border/70 bg-background/85 text-foreground hover:bg-background',
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          {showingOriginal ? 'Original Preview' : 'Hold Space / Press to Compare'}
        </button>
      )}
    </div>
  );
}
