'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface FileUploadProps {
  accept?: string;
  maxSizeMb?: number;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileType(file: File) {
  if (file.type === 'application/pdf') return 'PDF';
  const type = file.type.split('/')[1]?.toUpperCase();
  if (type === 'JPEG') return 'JPG';
  return type || file.name.split('.').pop()?.toUpperCase() || 'FILE';
}

export function FileUpload({ accept = 'image/*', maxSizeMb = 25 }: FileUploadProps) {
  const { uploadedFile, setUploadedFile, isProcessing, progress } = useAppStore();
  const [dragOver, setDragOver] = useState(false);
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const acceptTokens = useMemo(() => accept.split(',').map((token) => token.trim()).filter(Boolean), [accept]);
  const isImageAccept = acceptTokens.some((token) => token.includes('image/'));
  const isPDFAccept = acceptTokens.some((token) => token.includes('pdf') || token === '.pdf');
  const isPDF = uploadedFile?.type === 'application/pdf' || uploadedFile?.name.toLowerCase().endsWith('.pdf');
  const maxBytes = maxSizeMb * 1024 * 1024;

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!uploadedFile && previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, [uploadedFile]);

  const getImageInfo = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageInfo(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      setImageInfo({ width: image.width, height: image.height });
      URL.revokeObjectURL(objectUrl);
    };

    image.onerror = () => {
      setImageInfo(null);
      URL.revokeObjectURL(objectUrl);
    };

    image.src = objectUrl;
  }, []);

  const matchesAccept = useCallback(
    (file: File) => acceptTokens.some((token) => {
      if (token === 'image/*') return file.type.startsWith('image/');
      if (token.startsWith('.')) return file.name.toLowerCase().endsWith(token.toLowerCase());
      return file.type === token;
    }),
    [acceptTokens],
  );

  const acceptedLabels = [
    isPDFAccept ? 'PDF' : null,
    isImageAccept ? 'JPG' : null,
    isImageAccept ? 'PNG' : null,
    isImageAccept ? 'WebP' : null,
  ].filter(Boolean) as string[];

  const handleSelectedFile = useCallback((file: File | null) => {
    if (!file) return;

    if (!matchesAccept(file)) {
      toast.error(`Unsupported file type. Accepted: ${acceptedLabels.join(', ') || accept}.`);
      return;
    }

    if (file.size > maxBytes) {
      toast.error(`File too large. Maximum size is ${maxSizeMb} MB.`);
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    previewUrlRef.current = nextPreviewUrl;
    setPreviewUrl(nextPreviewUrl);
    setUploadedFile(file);
    getImageInfo(file);
  }, [accept, acceptedLabels, getImageInfo, matchesAccept, maxBytes, maxSizeMb, setUploadedFile]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    handleSelectedFile(event.dataTransfer.files?.[0] ?? null);
  }, [handleSelectedFile]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleSelectedFile(event.target.files?.[0] ?? null);
  }, [handleSelectedFile]);

  const handleRemove = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setPreviewUrl(null);
    setUploadedFile(null);
    setImageInfo(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [setUploadedFile]);

  const uploadLabel = isPDFAccept && !isImageAccept ? 'Upload PDF' : 'Upload file';
  const uploadHeading = isPDFAccept && !isImageAccept ? 'Drop your PDF here' : 'Drop your file here';

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {!uploadedFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.985 }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative overflow-hidden rounded-[2rem] border-2 border-dashed transition-all duration-300 ${dragOver
              ? 'border-primary bg-primary/6 shadow-[0_18px_60px_-30px_rgba(59,130,246,0.45)]'
              : 'border-border/60 bg-card/65 shadow-premium backdrop-blur-xl hover:border-primary/35 hover:bg-card/80'
              }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
            />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,76,181,0.1),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,165,170,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(184,134,39,0.08),transparent_24%)] pointer-events-none" />
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            <div className="relative z-10 flex flex-col items-center px-6 py-10 text-center md:px-10 md:py-14">
              <motion.div
                animate={dragOver ? { y: -6, scale: 1.03 } : { y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className={`mb-6 flex h-24 w-24 items-center justify-center rounded-[1.75rem] border shadow-lg ${dragOver
                  ? 'border-primary/20 bg-gradient-to-br from-primary to-sky-500 text-white'
                  : 'border-border/60 bg-background/80 text-primary'
                  }`}
              >
                {isPDFAccept && !isImageAccept ? <FileText className="h-10 w-10" /> : <Upload className="h-10 w-10" />}
              </motion.div>

              <div className="space-y-3">
                <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  {dragOver ? uploadHeading : uploadLabel}
                </h2>
                <p className="max-w-2xl text-sm font-medium leading-6 text-muted-foreground md:text-base">
                  Drag and drop from your device or click anywhere in this panel. The workflow is optimized for fast uploads, clean previews, and reliable output.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                {acceptedLabels.map((label) => (
                  <Badge key={label} variant="secondary" className="rounded-full border border-border/60 bg-background/80 px-3 py-1 font-medium">
                    {label}
                  </Badge>
                ))}
                <Badge variant="secondary" className="rounded-full border border-border/60 bg-background/80 px-3 py-1 font-medium">
                  Max {maxSizeMb} MB
                </Badge>
                <Badge variant="secondary" className="rounded-full border border-border/60 bg-background/80 px-3 py-1 font-medium">
                  Single file
                </Badge>
              </div>

              <div className="mt-6 grid gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:grid-cols-3">
                <span className="inline-flex items-center justify-center gap-2 rounded-full border border-border/60 bg-background/75 px-3 py-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Private processing
                </span>
                <span className="inline-flex items-center justify-center gap-2 rounded-full border border-border/60 bg-background/75 px-3 py-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  No signup required
                </span>
                <span className="inline-flex items-center justify-center gap-2 rounded-full border border-border/60 bg-background/75 px-3 py-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-500" />
                  Preview before export
                </span>
              </div>

              <Button size="lg" className="btn-premium mt-8 h-12 rounded-2xl px-8 font-bold pointer-events-none" type="button">
                <Upload className="h-4 w-4" />
                {uploadLabel}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.985 }}
            className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/75 p-4 shadow-premium backdrop-blur-xl md:p-5"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,76,181,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(14,165,170,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(184,134,39,0.06),transparent_24%)] pointer-events-none" />
            <div className="relative z-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-[1.5rem] border border-border/50 bg-background/70 px-4 py-6">
                {isPDF ? (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[1.4rem] bg-red-500/10 text-red-500">
                      <FileText className="h-10 w-10" />
                    </div>
                    <div>
                      <p className="max-w-xs truncate text-base font-semibold text-foreground">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">PDF ready for processing</p>
                    </div>
                  </div>
                ) : previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-[360px] max-w-full rounded-2xl object-contain shadow-sm"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-10 w-10" />
                    <p className="text-sm font-medium">Preview unavailable</p>
                  </div>
                )}

                {isProcessing ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background/84 backdrop-blur-sm"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="h-10 w-10 rounded-full border-2 border-primary/25 border-t-primary"
                    />
                    <div className="space-y-1 text-center">
                      <p className="text-sm font-semibold text-foreground">Processing file</p>
                      <p className="text-xs text-muted-foreground">Preparing a high-quality result</p>
                    </div>
                    <Progress value={progress} className="h-1.5 w-40" />
                  </motion.div>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 rounded-[1.5rem] border border-border/50 bg-background/75 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Selected file</p>
                    <p className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">{uploadedFile.name}</p>
                  </div>
                  <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/15">{getFileType(uploadedFile)}</Badge>
                </div>

                <div className="grid gap-3 rounded-2xl border border-border/50 bg-card/75 p-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between gap-3">
                    <span>Size</span>
                    <span className="font-semibold text-foreground">{formatFileSize(uploadedFile.size)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Limit</span>
                    <span className="font-semibold text-foreground">{maxSizeMb} MB</span>
                  </div>
                  {imageInfo ? (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <span>Width</span>
                        <span className="font-semibold text-foreground">{imageInfo.width}px</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Height</span>
                        <span className="font-semibold text-foreground">{imageInfo.height}px</span>
                      </div>
                    </>
                  ) : null}
                </div>

                <div className="space-y-2 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Ready for processing
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    You can replace this file, keep editing settings, or start processing immediately.
                  </p>
                </div>

                <div className="mt-auto flex flex-col gap-2 sm:flex-row lg:flex-col">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => inputRef.current?.click()}
                    disabled={isProcessing}
                    className="h-11 flex-1 rounded-2xl"
                  >
                    <Upload className="h-4 w-4" />
                    Replace file
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleRemove}
                    disabled={isProcessing}
                    className="h-11 flex-1 rounded-2xl text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
