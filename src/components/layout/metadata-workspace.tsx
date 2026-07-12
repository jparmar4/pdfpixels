'use client';

import { motion } from 'framer-motion';
import { Download, RotateCcw, Eye, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface MetadataEntry {
    key: string;
    value: string;
    category: string;
}

function parseImageMetadata(file: File): Promise<MetadataEntry[]> {
    return new Promise((resolve) => {
        const entries: MetadataEntry[] = [
            { key: 'File Name', value: file.name, category: 'File' },
            { key: 'File Size', value: formatBytes(file.size), category: 'File' },
            { key: 'File Type', value: file.type, category: 'File' },
            { key: 'Last Modified', value: new Date(file.lastModified).toLocaleString(), category: 'File' },
        ];

        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(objectUrl); // Free memory after load
            entries.push(
                { key: 'Width', value: `${img.width} px`, category: 'Dimensions' },
                { key: 'Height', value: `${img.height} px`, category: 'Dimensions' },
                { key: 'Aspect Ratio', value: `${(img.width / img.height).toFixed(2)}`, category: 'Dimensions' },
                { key: 'Megapixels', value: `${((img.width * img.height) / 1000000).toFixed(2)} MP`, category: 'Dimensions' },
            );

            // Try reading EXIF from ArrayBuffer
            const reader = new FileReader();
            reader.onload = (e) => {
                const buffer = e.target?.result as ArrayBuffer;
                if (buffer) {
                    const exif = extractBasicExif(new Uint8Array(buffer));
                    entries.push(...exif);
                }
                resolve(entries);
            };
            reader.onerror = () => resolve(entries);
            reader.readAsArrayBuffer(file);
        };
        img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(entries); };
        img.src = objectUrl;
    });
}

function extractBasicExif(data: Uint8Array): MetadataEntry[] {
    const entries: MetadataEntry[] = [];

    // Check for PNG
    if (data[0] === 0x89 && data[1] === 0x50) {
        entries.push({ key: 'Format', value: 'PNG', category: 'Format' });
        return entries;
    }

    // Check for JPEG with EXIF
    if (data[0] !== 0xFF || data[1] !== 0xD8) return entries;

    let offset = 2;
    while (offset < data.length - 1) {
        if (data[offset] !== 0xFF) break;
        const marker = data[offset + 1];
        if (marker === 0xE1) { // APP1 = EXIF
            const length = (data[offset + 2] << 8) | data[offset + 3];
            // Check for "Exif\0\0"
            if (data[offset + 4] === 0x45 && data[offset + 5] === 0x78) {
                entries.push({ key: 'EXIF Data', value: 'Present', category: 'EXIF' });
                entries.push({ key: 'EXIF Size', value: `${length} bytes`, category: 'EXIF' });
            }
            break;
        }
        const len = (data[offset + 2] << 8) | data[offset + 3];
        offset += 2 + len;
    }

    return entries;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function MetadataWorkspace() {
    const { activeTool, uploadedFile, reset } = useAppStore();
    const [metadata, setMetadata] = useState<MetadataEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [processedImage, setProcessedImage] = useState<string | null>(null);

    const handleAnalyze = useCallback(async () => {
        if (!uploadedFile) { toast.error('Please upload an image first'); return; }
        setIsLoading(true);
        try {
            const data = await parseImageMetadata(uploadedFile);
            setMetadata(data);
            toast.success(`Found ${data.length} metadata entries`);
        } catch {
            toast.error('Failed to read metadata');
        }
        setIsLoading(false);
    }, [uploadedFile]);

    const handleRemoveMetadata = useCallback(() => {
        if (!uploadedFile) return;
        const objectUrl = URL.createObjectURL(uploadedFile);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(objectUrl); // Free memory
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(img, 0, 0);
            const cleanData = canvas.toDataURL('image/png');
            setProcessedImage(cleanData);
            toast.success('All metadata removed!');
        };
        img.onerror = () => { URL.revokeObjectURL(objectUrl); toast.error('Failed to load image'); };
        img.src = objectUrl;
    }, [uploadedFile]);

    const handleDownload = useCallback(() => {
        if (!processedImage) return;
        const link = document.createElement('a');
        link.href = processedImage;
        link.download = `clean-${Date.now()}.png`;
        link.click();
    }, [processedImage]);

    const handleReset = useCallback(() => {
        setMetadata([]);
        setProcessedImage(null);
        reset();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [reset]);

    if (!activeTool) return null;

    const toolIcon = activeTool.id === 'remove-metadata' ? '🗑️' : activeTool.id === 'edit-metadata' ? '✏️' : '🔍';
    const categories = [...new Set(metadata.map(m => m.category))];

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
                        <Download className="w-4 h-4" />Download Clean Image
                    </Button>
                )}
            </ToolPageHeader>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <FileUpload />
                    {metadata.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden shadow-lg">
                            <div className="p-4 border-b border-border/40 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                                <h3 className="font-semibold">Image Metadata</h3>
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">{metadata.length} entries</Badge>
                            </div>
                            <div className="divide-y divide-border">
                                {categories.map(cat => (
                                    <div key={cat}>
                                        <div className="px-4 py-2 bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{cat}</div>
                                        {metadata.filter(m => m.category === cat).map(m => (
                                            <div key={m.key} className="px-4 py-3 flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">{m.key}</span>
                                                <span className="text-sm font-medium font-mono">{m.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
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
                                <Eye className="w-5 h-5 mr-3" />{isLoading ? 'Analyzing...' : 'View Metadata'}
                            </Button>
                            {activeTool.id !== 'view-metadata' && (
                                <Button variant="secondary" className="w-full gap-2 rounded-xl py-5" onClick={handleRemoveMetadata} disabled={!uploadedFile}>
                                    <Trash2 className="w-4 h-4" />Remove All Metadata
                                </Button>
                            )}
                            <Button variant="outline" className="w-full gap-2 rounded-xl py-5 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-colors bg-background/50" onClick={handleReset}>
                                <RotateCcw className="w-4 h-4" />Start Over
                            </Button>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 to-transparent p-5 space-y-3">
                        <h4 className="font-semibold flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />About Metadata
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">Image metadata (EXIF) contains information about your camera, location, date, and more. Remove it to protect your privacy before sharing images online.</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
