'use client';

import { motion } from 'framer-motion';
import { Download, RotateCcw, Eye, Trash2, Sparkles, Save, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface MetadataEntry {
  key: string;
  value: string;
  category: string;
}

interface EditableMeta {
  title: string;
  author: string;
  copyright: string;
  description: string;
  software: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function readAscii(data: Uint8Array, offset: number, length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    const code = data[offset + i];
    if (code === 0) break;
    if (code >= 32 && code <= 126) out += String.fromCharCode(code);
  }
  return out.trim();
}

function extractBasicExif(data: Uint8Array): MetadataEntry[] {
  const entries: MetadataEntry[] = [];

  // PNG signature
  if (data[0] === 0x89 && data[1] === 0x50) {
    entries.push({ key: 'Format', value: 'PNG', category: 'Format' });
    // Scan for tEXt chunks (keyword + null + text)
    let offset = 8;
    while (offset + 8 < data.length) {
      const length = (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
      const type = String.fromCharCode(data[offset + 4], data[offset + 5], data[offset + 6], data[offset + 7]);
      if (type === 'tEXt' && length > 1 && offset + 8 + length <= data.length) {
        const chunk = data.subarray(offset + 8, offset + 8 + length);
        const nullIdx = chunk.indexOf(0);
        if (nullIdx > 0) {
          const key = readAscii(chunk, 0, nullIdx);
          const value = readAscii(chunk, nullIdx + 1, chunk.length - nullIdx - 1);
          if (key && value) {
            entries.push({ key, value, category: 'PNG Text' });
          }
        }
      }
      if (type === 'IEND') break;
      offset += 12 + length;
    }
    return entries;
  }

  // JPEG
  if (data[0] !== 0xff || data[1] !== 0xd8) {
    entries.push({ key: 'Format', value: 'Unknown / non-JPEG binary', category: 'Format' });
    return entries;
  }

  entries.push({ key: 'Format', value: 'JPEG', category: 'Format' });

  let offset = 2;
  while (offset < data.length - 4) {
    if (data[offset] !== 0xff) break;
    const marker = data[offset + 1];

    // Standalone markers
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }

    const length = (data[offset + 2] << 8) | data[offset + 3];
    if (length < 2 || offset + 2 + length > data.length) break;

    // COM comment
    if (marker === 0xfe) {
      const comment = readAscii(data, offset + 4, length - 2);
      if (comment) {
        entries.push({ key: 'Comment', value: comment.slice(0, 240), category: 'Comment' });
      }
    }

    // APP1 EXIF
    if (marker === 0xe1 && length > 8) {
      const isExif =
        data[offset + 4] === 0x45 &&
        data[offset + 5] === 0x78 &&
        data[offset + 6] === 0x69 &&
        data[offset + 7] === 0x66;
      if (isExif) {
        entries.push({ key: 'EXIF Data', value: 'Present', category: 'EXIF' });
        entries.push({ key: 'EXIF Segment Size', value: `${length} bytes`, category: 'EXIF' });

        // Best-effort TIFF header parse for a few IFD0 ASCII tags
        const tiffStart = offset + 10;
        if (tiffStart + 8 < data.length) {
          const little = data[tiffStart] === 0x49 && data[tiffStart + 1] === 0x49;
          const read16 = (pos: number) =>
            little ? data[pos] | (data[pos + 1] << 8) : (data[pos] << 8) | data[pos + 1];
          const read32 = (pos: number) =>
            little
              ? data[pos] | (data[pos + 1] << 8) | (data[pos + 2] << 16) | (data[pos + 3] << 24)
              : (data[pos] << 24) | (data[pos + 1] << 16) | (data[pos + 2] << 8) | data[pos + 3];

          const ifd0Offset = read32(tiffStart + 4);
          const ifdPos = tiffStart + ifd0Offset;
          if (ifdPos + 2 < data.length) {
            const entryCount = read16(ifdPos);
            const tagNames: Record<number, string> = {
              0x010e: 'Image Description',
              0x010f: 'Make',
              0x0110: 'Model',
              0x0131: 'Software',
              0x0132: 'DateTime',
              0x013b: 'Artist',
              0x8298: 'Copyright',
            };

            for (let i = 0; i < entryCount; i += 1) {
              const entry = ifdPos + 2 + i * 12;
              if (entry + 12 > data.length) break;
              const tag = read16(entry);
              const type = read16(entry + 2);
              const count = read32(entry + 4);
              const name = tagNames[tag];
              if (!name || type !== 2 || count <= 0 || count > 512) continue;
              const valueOffset = count <= 4 ? entry + 8 : tiffStart + read32(entry + 8);
              if (valueOffset + count > data.length) continue;
              const value = readAscii(data, valueOffset, count);
              if (value) {
                entries.push({ key: name, value, category: 'EXIF' });
              }
            }
          }
        }
      }
    }

    // SOS = start of scan; no more APPn after this in practice for our purposes
    if (marker === 0xda) break;
    offset += 2 + length;
  }

  return entries;
}

function parseImageMetadata(file: File): Promise<MetadataEntry[]> {
  return new Promise((resolve) => {
    const entries: MetadataEntry[] = [
      { key: 'File Name', value: file.name, category: 'File' },
      { key: 'File Size', value: formatBytes(file.size), category: 'File' },
      { key: 'File Type', value: file.type || 'unknown', category: 'File' },
      { key: 'Last Modified', value: new Date(file.lastModified).toLocaleString(), category: 'File' },
    ];

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      entries.push(
        { key: 'Width', value: `${img.width} px`, category: 'Dimensions' },
        { key: 'Height', value: `${img.height} px`, category: 'Dimensions' },
        { key: 'Aspect Ratio', value: `${(img.width / Math.max(1, img.height)).toFixed(2)}`, category: 'Dimensions' },
        { key: 'Megapixels', value: `${((img.width * img.height) / 1_000_000).toFixed(2)} MP`, category: 'Dimensions' },
      );

      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        if (buffer) {
          entries.push(...extractBasicExif(new Uint8Array(buffer)));
        }
        resolve(entries);
      };
      reader.onerror = () => resolve(entries);
      reader.readAsArrayBuffer(file);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(entries);
    };
    img.src = objectUrl;
  });
}

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngTextChunk(keyword: string, text: string): Uint8Array {
  const enc = new TextEncoder();
  const keyBytes = enc.encode(keyword.slice(0, 79));
  const textBytes = enc.encode(text.slice(0, 2000));
  const data = new Uint8Array(keyBytes.length + 1 + textBytes.length);
  data.set(keyBytes, 0);
  data[keyBytes.length] = 0;
  data.set(textBytes, keyBytes.length + 1);

  const type = new TextEncoder().encode('tEXt');
  const length = data.length;
  const chunk = new Uint8Array(12 + length);
  chunk[0] = (length >>> 24) & 0xff;
  chunk[1] = (length >>> 16) & 0xff;
  chunk[2] = (length >>> 8) & 0xff;
  chunk[3] = length & 0xff;
  chunk.set(type, 4);
  chunk.set(data, 8);
  const crcBuf = new Uint8Array(4 + length);
  crcBuf.set(type, 0);
  crcBuf.set(data, 4);
  const crc = crc32(crcBuf);
  const crcOffset = 8 + length;
  chunk[crcOffset] = (crc >>> 24) & 0xff;
  chunk[crcOffset + 1] = (crc >>> 16) & 0xff;
  chunk[crcOffset + 2] = (crc >>> 8) & 0xff;
  chunk[crcOffset + 3] = crc & 0xff;
  return chunk;
}

function injectPngText(pngBytes: Uint8Array, fields: EditableMeta): Uint8Array {
  // Insert tEXt chunks before IEND
  let iend = -1;
  let offset = 8;
  while (offset + 8 < pngBytes.length) {
    const length = (pngBytes[offset] << 24) | (pngBytes[offset + 1] << 16) | (pngBytes[offset + 2] << 8) | pngBytes[offset + 3];
    const type = String.fromCharCode(pngBytes[offset + 4], pngBytes[offset + 5], pngBytes[offset + 6], pngBytes[offset + 7]);
    if (type === 'IEND') {
      iend = offset;
      break;
    }
    offset += 12 + length;
  }
  if (iend < 0) return pngBytes;

  const pairs: Array<[string, string]> = [
    ['Title', fields.title],
    ['Author', fields.author],
    ['Copyright', fields.copyright],
    ['Description', fields.description],
    ['Software', fields.software || 'PdfPixels'],
  ].filter(([, v]) => Boolean(v.trim())) as Array<[string, string]>;

  const chunks = pairs.map(([k, v]) => pngTextChunk(k, v));
  const totalExtra = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(pngBytes.length + totalExtra);
  out.set(pngBytes.subarray(0, iend), 0);
  let pos = iend;
  for (const chunk of chunks) {
    out.set(chunk, pos);
    pos += chunk.length;
  }
  out.set(pngBytes.subarray(iend), pos);
  return out;
}

function injectJpegComment(jpegBytes: Uint8Array, comment: string): Uint8Array {
  // Insert COM marker after SOI
  if (jpegBytes[0] !== 0xff || jpegBytes[1] !== 0xd8) return jpegBytes;
  const text = new TextEncoder().encode(comment.slice(0, 65000));
  const com = new Uint8Array(4 + text.length);
  com[0] = 0xff;
  com[1] = 0xfe;
  const len = text.length + 2;
  com[2] = (len >> 8) & 0xff;
  com[3] = len & 0xff;
  com.set(text, 4);
  const out = new Uint8Array(jpegBytes.length + com.length);
  out[0] = 0xff;
  out[1] = 0xd8;
  out.set(com, 2);
  out.set(jpegBytes.subarray(2), 2 + com.length);
  return out;
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function uint8ToDataUrl(bytes: Uint8Array, mime: string): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

export function MetadataWorkspace() {
  const { activeTool, uploadedFile, reset } = useAppStore();
  const [metadata, setMetadata] = useState<MetadataEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [outputName, setOutputName] = useState('clean-image.png');
  const [fields, setFields] = useState<EditableMeta>({
    title: '',
    author: '',
    copyright: '',
    description: '',
    software: 'PdfPixels',
  });

  const isEdit = activeTool?.id === 'edit-metadata';
  const isRemove = activeTool?.id === 'remove-metadata';

  useEffect(() => {
    setMetadata([]);
    setProcessedImage(null);
  }, [uploadedFile, activeTool?.id]);

  const handleAnalyze = useCallback(async () => {
    if (!uploadedFile) {
      toast.error('Please upload an image first');
      return;
    }
    setIsLoading(true);
    try {
      const data = await parseImageMetadata(uploadedFile);
      setMetadata(data);

      // Prefill editable fields from parsed EXIF/PNG text when present
      const find = (keys: string[]) =>
        data.find((entry) => keys.some((k) => entry.key.toLowerCase() === k.toLowerCase()))?.value || '';

      setFields((prev) => ({
        title: find(['Title', 'Image Description']) || prev.title,
        author: find(['Author', 'Artist']) || prev.author,
        copyright: find(['Copyright']) || prev.copyright,
        description: find(['Description', 'Image Description', 'Comment']) || prev.description,
        software: find(['Software']) || prev.software || 'PdfPixels',
      }));

      toast.success(`Found ${data.length} metadata entries`);
    } catch {
      toast.error('Failed to read metadata');
    }
    setIsLoading(false);
  }, [uploadedFile]);

  const renderCleanCanvas = useCallback(async (file: File, format: 'image/png' | 'image/jpeg' = 'image/png') => {
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Failed to load image'));
        image.src = objectUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      return canvas.toDataURL(format, 0.92);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }, []);

  const handleRemoveMetadata = useCallback(async () => {
    if (!uploadedFile) return;
    try {
      const cleanData = await renderCleanCanvas(uploadedFile, 'image/png');
      setProcessedImage(cleanData);
      setOutputName(`clean-${Date.now()}.png`);
      toast.success('All metadata removed!');
    } catch {
      toast.error('Failed to strip metadata');
    }
  }, [renderCleanCanvas, uploadedFile]);

  const handleSaveEditedMetadata = useCallback(async () => {
    if (!uploadedFile) {
      toast.error('Please upload an image first');
      return;
    }

    setIsLoading(true);
    try {
      // Prefer PNG so we can embed structured tEXt fields; fall back to JPEG COM for pure JPEG preference
      const preferJpeg = uploadedFile.type === 'image/jpeg' || uploadedFile.type === 'image/jpg';
      const mime = preferJpeg ? 'image/jpeg' : 'image/png';
      const cleanDataUrl = await renderCleanCanvas(uploadedFile, mime);
      let bytes = dataUrlToUint8Array(cleanDataUrl);

      if (mime === 'image/png') {
        bytes = injectPngText(bytes, fields);
      } else {
        const comment = [
          fields.title && `Title: ${fields.title}`,
          fields.author && `Author: ${fields.author}`,
          fields.copyright && `Copyright: ${fields.copyright}`,
          fields.description && `Description: ${fields.description}`,
          fields.software && `Software: ${fields.software}`,
        ]
          .filter(Boolean)
          .join(' | ');
        bytes = injectJpegComment(bytes, comment || 'Edited with PdfPixels');
      }

      const dataUrl = uint8ToDataUrl(bytes, mime);
      setProcessedImage(dataUrl);
      setOutputName(`metadata-${Date.now()}.${mime === 'image/png' ? 'png' : 'jpg'}`);

      // Refresh table to show new metadata
      const refreshed: MetadataEntry[] = [
        { key: 'File Name', value: outputName, category: 'File' },
        { key: 'Output Format', value: mime, category: 'File' },
        { key: 'Title', value: fields.title || '—', category: 'Edited' },
        { key: 'Author', value: fields.author || '—', category: 'Edited' },
        { key: 'Copyright', value: fields.copyright || '—', category: 'Edited' },
        { key: 'Description', value: fields.description || '—', category: 'Edited' },
        { key: 'Software', value: fields.software || '—', category: 'Edited' },
      ];
      setMetadata(refreshed);
      toast.success('Metadata saved into a new image file.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save metadata');
    } finally {
      setIsLoading(false);
    }
  }, [fields, outputName, renderCleanCanvas, uploadedFile]);

  const handleDownload = useCallback(() => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = outputName;
    link.click();
  }, [outputName, processedImage]);

  const handleReset = useCallback(() => {
    setMetadata([]);
    setProcessedImage(null);
    setFields({
      title: '',
      author: '',
      copyright: '',
      description: '',
      software: 'PdfPixels',
    });
    reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [reset]);

  if (!activeTool) return null;

  const toolIcon = isRemove ? '🗑️' : isEdit ? '✏️' : '🔍';
  const categories = [...new Set(metadata.map((m) => m.category))];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 lg:px-8 py-8">
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        emoji={toolIcon}
        icon={null}
        onReset={handleReset}
      >
        {processedImage && (
          <Button onClick={handleDownload} className="gap-2 btn-premium rounded-xl">
            <Download className="w-4 h-4" />
            {isEdit ? 'Download Updated Image' : 'Download Clean Image'}
          </Button>
        )}
      </ToolPageHeader>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <FileUpload accept="image/*" />

          {isEdit && (
            <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 shadow-lg space-y-4">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">Editable metadata fields</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Values are embedded into a new export (PNG text chunks or JPEG comment). Original camera EXIF is stripped for privacy unless you re-enter it here.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meta-title">Title</Label>
                  <Input
                    id="meta-title"
                    value={fields.title}
                    onChange={(e) => setFields((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Image title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta-author">Author / Artist</Label>
                  <Input
                    id="meta-author"
                    value={fields.author}
                    onChange={(e) => setFields((f) => ({ ...f, author: e.target.value }))}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta-copyright">Copyright</Label>
                  <Input
                    id="meta-copyright"
                    value={fields.copyright}
                    onChange={(e) => setFields((f) => ({ ...f, copyright: e.target.value }))}
                    placeholder="© 2026 Your Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta-software">Software</Label>
                  <Input
                    id="meta-software"
                    value={fields.software}
                    onChange={(e) => setFields((f) => ({ ...f, software: e.target.value }))}
                    placeholder="PdfPixels"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="meta-description">Description</Label>
                  <Textarea
                    id="meta-description"
                    value={fields.description}
                    onChange={(e) => setFields((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Short description of this image"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {metadata.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden shadow-lg"
            >
              <div className="p-4 border-b border-border/40 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                <h3 className="font-semibold">Image Metadata</h3>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  {metadata.length} entries
                </Badge>
              </div>
              <div className="divide-y divide-border">
                {categories.map((cat) => (
                  <div key={cat}>
                    <div className="px-4 py-2 bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {cat}
                    </div>
                    {metadata
                      .filter((m) => m.category === cat)
                      .map((m) => (
                        <div key={`${cat}-${m.key}`} className="px-4 py-3 flex justify-between items-start gap-4">
                          <span className="text-sm text-muted-foreground shrink-0">{m.key}</span>
                          <span className="text-sm font-medium font-mono text-right break-all">{m.value}</span>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {processedImage && (
            <div className="rounded-2xl border border-border overflow-hidden bg-card">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-medium">Output preview</h3>
                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">Ready</Badge>
              </div>
              <div className="aspect-video bg-muted/50 flex items-center justify-center p-4">
                <img src={processedImage} alt="Processed metadata output" className="max-w-full max-h-full object-contain" />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden shadow-premium">
            <div className="p-5 border-b border-border/40 bg-gradient-to-r from-primary/10 to-transparent">
              <h3 className="font-bold flex items-center gap-2.5 tracking-tight text-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                Actions
              </h3>
            </div>
            <div className="p-5 space-y-3">
              <Button
                className="w-full btn-premium py-6 rounded-xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all"
                onClick={handleAnalyze}
                disabled={!uploadedFile || isLoading}
                size="lg"
              >
                <Eye className="w-5 h-5 mr-3" />
                {isLoading ? 'Analyzing...' : 'View Metadata'}
              </Button>

              {isEdit && (
                <Button
                  className="w-full gap-2 rounded-xl py-5"
                  onClick={handleSaveEditedMetadata}
                  disabled={!uploadedFile || isLoading}
                >
                  <Save className="w-4 h-4" />
                  Save Metadata to New Image
                </Button>
              )}

              {(isRemove || isEdit) && (
                <Button
                  variant="secondary"
                  className="w-full gap-2 rounded-xl py-5"
                  onClick={handleRemoveMetadata}
                  disabled={!uploadedFile}
                >
                  <Trash2 className="w-4 h-4" />
                  Remove All Metadata
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full gap-2 rounded-xl py-5 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-colors bg-background/50"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4" />
                Start Over
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 to-transparent p-5 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              About Metadata
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isEdit
                ? 'Edit title, author, copyright, and description, then export a new file with those fields embedded. Sensitive camera/GPS EXIF is not recreated unless you type it in.'
                : 'Image metadata (EXIF) can include camera model, timestamps, and sometimes location. View it for diagnostics or strip it before sharing online.'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
