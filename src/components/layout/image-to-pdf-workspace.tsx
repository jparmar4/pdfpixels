'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Download, RotateCcw, FilePlus, Image as ImageIcon, FileText, Plus, X, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/app-store';
import { ToolPageHeader } from './tool-page-header';
import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
interface ImageFile {
  file: File;
  name: string;
  size: number;
  preview: string;
  dimensions?: { width: number; height: number };
}

export function ImageToPDFWorkspace() {
  const { activeTool, isProcessing, setIsProcessing, setProgress, reset } = useAppStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [result, setResult] = useState<{ pdfUrl: string; fileName: string; pageCount: number } | null>(null);
  const [pageSize, setPageSize] = useState('a4');
  const [orientation, setOrientation] = useState('auto');
  const [fitMode, setFitMode] = useState('contain');
  const margin = 20;

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const newFiles: ImageFile[] = Array.from(selectedFiles)
        .filter(f => f.type.startsWith('image/'))
        .map(f => ({
          file: f,
          name: f.name,
          size: f.size,
          preview: URL.createObjectURL(f),
        }));

      setFiles(prev => [...prev, ...newFiles]);
      toast.success(`Added ${newFiles.length} image(s)`);

      // Get dimensions for each image
      newFiles.forEach((imgFile, index) => {
        const img = new Image();
        img.onload = () => {
          setFiles(prev => prev.map((f, i) =>
            i === prev.length - newFiles.length + index
              ? { ...f, dimensions: { width: img.width, height: img.height } }
              : f
          ));
        };
        img.src = imgFile.preview;
      });
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    const newFiles: ImageFile[] = Array.from(droppedFiles)
      .filter(f => f.type.startsWith('image/'))
      .map(f => ({
        file: f,
        name: f.name,
        size: f.size,
        preview: URL.createObjectURL(f),
      }));

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      toast.success(`Added ${newFiles.length} image(s)`);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const moveFile = useCallback((index: number, direction: 'up' | 'down') => {
    setFiles(prev => {
      const newFiles = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= newFiles.length) return prev;
      [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
      return newFiles;
    });
  }, []);

  const handleProcess = useCallback(async () => {
    if (files.length === 0) {
      toast.error('Please add at least one image');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    const formData = new FormData();
    files.forEach((f) => {
      formData.append('files', f.file);
    });
    formData.append('pageSize', pageSize);
    formData.append('orientation', orientation);
    formData.append('fitMode', fitMode);
    formData.append('margin', margin.toString());

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 8, 90));
      }, 150);

      const response = await fetch('/api/pdf/from-image', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      const blob = await response.blob();
      const pdfUrl = URL.createObjectURL(blob);
      const disposition = response.headers.get('content-disposition') || '';
      const fileNameMatch = disposition.match(/filename="?([^";]+)"?/i);
      const fileName = fileNameMatch?.[1] || `images-to-pdf-${Date.now()}.pdf`;
      const pageCount = Number(response.headers.get('x-page-count') || files.length);

      setResult({
        pdfUrl,
        fileName,
        pageCount,
      });
      toast.success(`Created PDF with ${pageCount} pages!`);
    } catch {
      toast.error('Failed to create PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [files, pageSize, orientation, fitMode, margin, setIsProcessing, setProgress]);

  const handleDownload = useCallback(() => {
    if (result) {
      const link = document.createElement('a');
      link.href = result.pdfUrl;
      link.download = result.fileName;
      link.click();
    }
  }, [result]);

  const handleReset = useCallback(() => {
    reset();
    window.history.pushState({}, '', window.location.pathname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    files.forEach(f => URL.revokeObjectURL(f.preview));
    if (result?.pdfUrl) {
      URL.revokeObjectURL(result.pdfUrl);
    }
    setFiles([]);
    setResult(null);
  }, [reset, files, result]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (!activeTool) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 lg:px-8 py-8"
    >
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        icon={FilePlus}
        onReset={handleReset}
      >
        {result && (
          <Button onClick={handleDownload} className="gap-2 btn-premium rounded-xl">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        )}
      </ToolPageHeader>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Panel - Upload & File List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Drop Zone */}
          <motion.div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
            className="drop-zone relative flex flex-col items-center justify-center p-8 rounded-2xl cursor-pointer"
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              aria-label="Upload images"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-primary" />
            </div>

            <p className="text-lg font-semibold">Add Images</p>
            <p className="text-sm text-muted-foreground mt-1">
              Drag & drop or click to select images
            </p>

            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3">
              <Badge variant="secondary" className="font-normal">JPG</Badge>
              <Badge variant="secondary" className="font-normal">PNG</Badge>
              <Badge variant="secondary" className="font-normal">WebP</Badge>
            </div>
          </motion.div>

          {/* Image Grid */}
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              <div className="p-4 border-b border-border">
                <h3 className="font-medium flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Images ({files.length})
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
                {files.map((file, index) => (
                  <motion.div
                    key={`${file.name}-${index}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="group relative rounded-xl border border-border overflow-hidden bg-muted/50"
                  >
                    <div className="aspect-[4/3] relative">
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveFile(index, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronRight className="w-4 h-4 rotate-[-90deg]" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveFile(index, 'down')}
                          disabled={index === files.length - 1}
                        >
                          <ChevronRight className="w-4 h-4 rotate-90" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeFile(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="text-xs bg-black/50">
                          #{index + 1}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-xs truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.dimensions && `${file.dimensions.width}×${file.dimensions.height}`}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-600 dark:text-green-400">
                      PDF Created Successfully!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {result.pageCount} pages • Ready for download
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Panel - Settings */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden shadow-premium">
            <div className="p-5 border-b border-border/40 bg-gradient-to-r from-primary/10 to-transparent">
              <h3 className="font-bold flex items-center gap-2.5 tracking-tight text-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                PDF Settings
              </h3>
            </div>

            <div className="p-5 space-y-5">
              {/* Page Size */}
              <div className="space-y-2">
                <Label>Page Size</Label>
                <Select value={pageSize} onValueChange={setPageSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a4">A4 (210 × 297 mm)</SelectItem>
                    <SelectItem value="letter">Letter (8.5 × 11 in)</SelectItem>
                    <SelectItem value="legal">Legal (8.5 × 14 in)</SelectItem>
                    <SelectItem value="a3">A3 (297 × 420 mm)</SelectItem>
                    <SelectItem value="a5">A5 (148 × 210 mm)</SelectItem>
                    <SelectItem value="fit">Fit to Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Orientation */}
              <div className="space-y-2">
                <Label>Orientation</Label>
                <Select value={orientation} onValueChange={setOrientation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto Detect</SelectItem>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fit Mode */}
              <div className="space-y-2">
                <Label>Image Fit</Label>
                <Select value={fitMode} onValueChange={setFitMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contain">Contain (No Crop)</SelectItem>
                    <SelectItem value="fill">Fill (May Crop)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Stats */}
              <div className="p-4 rounded-xl bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Total Images</span>
                  <span className="text-lg font-bold text-primary">{files.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Size</span>
                  <span className="text-sm text-muted-foreground">
                    {formatSize(files.reduce((acc, f) => acc + f.size, 0))}
                  </span>
                </div>
              </div>
              <div className="pt-4 space-y-3">
                <Button
                  className="w-full btn-premium py-6 rounded-xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all"
                  onClick={handleProcess}
                  disabled={files.length === 0 || isProcessing}
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full mr-3"
                      />
                      Creating PDF...
                    </>
                  ) : (
                    <>
                      <FilePlus className="w-5 h-5 mr-3" />
                      Create PDF
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full gap-2 rounded-xl py-6 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-colors bg-background/50"
                  onClick={handleReset}
                >
                  <RotateCcw className="w-4 h-4" />
                  Start Over
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 to-transparent p-5 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Tips
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Drag images to reorder them</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Use &quot;Fit to Image&quot; for custom sizes</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Auto orientation detects image shape</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
