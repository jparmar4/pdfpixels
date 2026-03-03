'use client';

import { useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, FileImage, CheckCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface FileUploadProps {
  accept?: string;
}

export function FileUpload({ accept = 'image/*' }: FileUploadProps) {
  const { uploadedFile, setUploadedFile, isProcessing, progress, processedImage } = useAppStore();
  const [dragOver, setDragOver] = useState(false);
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get preview URL and image info from uploaded file
  const previewUrl = uploadedFile ? URL.createObjectURL(uploadedFile) : null;
  const isPDF = uploadedFile?.type === 'application/pdf' || uploadedFile?.name.toLowerCase().endsWith('.pdf');

  // Get image dimensions when file changes
  const getImageInfo = useCallback((file: File) => {
    if (file.type.startsWith('image/')) {
      const img = new Image();
      img.onload = () => {
        setImageInfo({ width: img.width, height: img.height });
      };
      img.src = URL.createObjectURL(file);
    } else {
      setImageInfo(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Basic validation based on accept
      const acceptedTypes = accept.split(',').map(t => t.trim());
      const isAccepted = acceptedTypes.some(type => {
        if (type === 'image/*') return file.type.startsWith('image/');
        if (type.startsWith('.')) return file.name.toLowerCase().endsWith(type.toLowerCase());
        return file.type === type;
      });

      if (isAccepted) {
        setUploadedFile(file);
        getImageInfo(file);
      }
    }
  }, [setUploadedFile, getImageInfo, accept]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setUploadedFile(file);
      getImageInfo(file);
    }
  }, [setUploadedFile, getImageInfo]);

  const handleRemove = useCallback(() => {
    setUploadedFile(null);
    setImageInfo(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [setUploadedFile]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileType = (file: File) => {
    if (file.type === 'application/pdf') return 'PDF';
    const type = file.type.split('/')[1]?.toUpperCase();
    if (type === 'JPEG') return 'JPG';
    return type || file.name.split('.').pop()?.toUpperCase() || 'FILE';
  };

  const isImageAccept = accept.includes('image/');
  const isPDFAccept = accept.includes('.pdf') || accept.includes('pdf');

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {!uploadedFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center p-8 md:p-16 rounded-[2rem] cursor-pointer overflow-hidden border-2 border-dashed transition-all duration-300
              ${dragOver
                ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/20 scale-[1.02]'
                : 'border-border/60 hover:border-primary/50 bg-card/40 hover:bg-card/60 backdrop-blur-xl shadow-lg'}`}
          >
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
            />

            {/* Aurora Background Hint on Drag Over */}
            <motion.div
              animate={{
                opacity: dragOver ? 1 : 0,
              }}
              className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none"
            />

            <motion.div
              animate={{ y: dragOver ? -8 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex flex-col items-center gap-4 relative"
            >
              <motion.div
                animate={{
                  scale: dragOver ? 1.15 : 1,
                  rotate: dragOver ? [0, -5, 5, 0] : 0,
                  y: dragOver ? -10 : 0
                }}
                transition={{ duration: 0.4 }}
                className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl transition-colors duration-300
                  ${dragOver ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-card to-muted border border-border/50 shadow-sm'}`}
              >
                {isPDFAccept && !isImageAccept ? (
                  <FileText className={`w-10 h-10 ${dragOver ? 'text-white' : 'text-primary/70'}`} />
                ) : (
                  <Upload className={`w-10 h-10 ${dragOver ? 'text-white' : 'text-primary/70'}`} />
                )}
              </motion.div>

              <div className="text-center mt-2 z-10 pointer-events-none">
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {dragOver ? `Drop your ${isPDFAccept && !isImageAccept ? 'PDF' : 'file'} here` : `Drag & drop your ${isPDFAccept && !isImageAccept ? 'PDF' : 'file'}`}
                </p>
                <p className="text-base text-muted-foreground mt-2 font-medium">
                  or click to browse from your device
                </p>
              </div>

              <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground z-10 pointer-events-none mt-2">
                {isPDFAccept && <Badge variant="secondary" className="font-normal px-3 py-1 bg-background/50 backdrop-blur-sm">PDF</Badge>}
                {isImageAccept && (
                  <>
                    <Badge variant="secondary" className="font-normal px-3 py-1 bg-background/50 backdrop-blur-sm">JPG</Badge>
                    <Badge variant="secondary" className="font-normal px-3 py-1 bg-background/50 backdrop-blur-sm">PNG</Badge>
                    <Badge variant="secondary" className="font-normal px-3 py-1 bg-background/50 backdrop-blur-sm">WebP</Badge>
                  </>
                )}
              </div>

              <div className="text-center mt-3 text-xs text-muted-foreground/90 font-medium z-10 pointer-events-none">
                Private processing • No signup required • Temporary file handling
              </div>

              <Button size="lg" className="mt-6 gap-2 btn-premium rounded-xl px-10 py-6 font-bold z-10 pointer-events-none" type="button">
                <Upload className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Select {isPDFAccept && !isImageAccept ? 'PDF' : 'File'}</span>
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="relative w-full max-w-2xl mx-auto border-2 border-dashed border-primary/40 rounded-2xl p-4 md:p-8 flex items-center justify-center min-h-[300px] bg-card/30 backdrop-blur-sm"
          >
            {/* Image/File Preview */}
            <div className="relative inline-block max-w-full rounded-2xl shadow-lg border border-border/50 overflow-hidden bg-white dark:bg-card min-w-[200px]">
              {isPDF ? (
                <div className="flex flex-col items-center justify-center p-12 bg-muted/10">
                  <FileText className="w-16 h-16 text-red-500 mb-2" />
                  <div className="text-sm font-semibold max-w-[200px] truncate">{uploadedFile.name}</div>
                </div>
              ) : (
                <img
                  src={previewUrl || ''}
                  alt="Preview"
                  className="max-w-full max-h-[350px] object-contain"
                />
              )}

              {/* Close Button Top Right */}
              <button
                onClick={handleRemove}
                disabled={isProcessing}
                className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-card/90 hover:bg-destructive hover:text-white rounded-xl shadow-md border border-border/30 transition-all z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Change Button Top Left */}
              <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                <button
                  onClick={() => inputRef.current?.click()}
                  disabled={isProcessing}
                  className="px-2.5 py-1.5 bg-primary/90 hover:bg-primary text-white text-[10px] font-bold rounded-lg shadow-md flex items-center gap-1 transition-all backdrop-blur-sm"
                >
                  <Upload className="w-3 h-3" />
                  Change
                </button>
              </div>

              {/* Info Box Bottom — Premium Gradient */}
              <div className="bg-gradient-to-r from-primary/85 to-violet-600/85 backdrop-blur-md text-white text-xs p-3 w-full">
                <div className="font-bold truncate mb-1 text-[11px] tracking-wide">{uploadedFile.name}</div>
                <div className="opacity-90 leading-tight font-medium">Size: {formatFileSize(uploadedFile.size)}</div>
                {imageInfo && (
                  <>
                    <div className="opacity-90 leading-tight font-medium">Width: {imageInfo.width} PX</div>
                    <div className="opacity-90 leading-tight font-medium">Height: {imageInfo.height} PX</div>
                  </>
                )}
              </div>

              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-background/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 z-20"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full"
                  />
                  <div className="text-xs font-medium">Processing...</div>
                  <Progress value={progress} className="w-32 h-1.5" />
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
