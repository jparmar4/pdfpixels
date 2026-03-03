'use client';

import { motion } from 'framer-motion';
import { Download, RotateCcw, Crop, Circle, Square, Scissors, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

type CropMode = 'rect' | 'circle' | 'square' | 'freehand';

const ASPECT_PRESETS = [
    { label: 'Free', value: 'free' },
    { label: '1:1', value: '1:1' },
    { label: '4:3', value: '4:3' },
    { label: '16:9', value: '16:9' },
    { label: '3:2', value: '3:2' },
    { label: '2:3', value: '2:3' },
];

export function CropWorkspace() {
    const { activeTool, uploadedFile, processedImage, isProcessing, reset, setIsProcessing, setProcessedImage, setProgress } = useAppStore();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);

    const cropMode: CropMode =
        activeTool?.id === 'circle-crop' ? 'circle'
            : activeTool?.id === 'square-crop' ? 'square'
                : activeTool?.id === 'freehand-crop' ? 'freehand'
                    : 'rect';
    const [aspectRatio, setAspectRatio] = useState('free');
    const [cropX, setCropX] = useState(50);
    const [cropY, setCropY] = useState(50);
    const [cropW, setCropW] = useState(400);
    const [cropH, setCropH] = useState(300);
    const [imageLoaded, setImageLoaded] = useState(false);


    // Load image onto canvas
    useEffect(() => {
        if (!uploadedFile) return;
        const img = new Image();
        img.onload = () => {
            imageRef.current = img;
            const canvas = canvasRef.current;
            if (!canvas) return;
            const maxW = 800;
            const scale = Math.min(1, maxW / img.width);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Default crop area
            const w = Math.round(canvas.width * 0.6);
            const h = cropMode === 'circle' || cropMode === 'square' ? w : Math.round(canvas.height * 0.6);
            setCropX(Math.round((canvas.width - w) / 2));
            setCropY(Math.round((canvas.height - h) / 2));
            setCropW(w);
            setCropH(h);
            setImageLoaded(true);
        };
        img.src = URL.createObjectURL(uploadedFile);
    }, [uploadedFile, cropMode]);

    // Draw overlay
    useEffect(() => {
        if (!imageLoaded || !canvasRef.current || !imageRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const img = imageRef.current;
        const scale = canvas.width / img.width;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Darken outside crop
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Clear crop area
        ctx.save();
        if (cropMode === 'circle') {
            const r = Math.min(cropW, cropH) / 2;
            ctx.beginPath();
            ctx.arc(cropX + r, cropY + r, r, 0, Math.PI * 2);
            ctx.clip();
        } else {
            ctx.beginPath();
            ctx.rect(cropX, cropY, cropW, cropH);
            ctx.clip();
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        // Border
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        if (cropMode === 'circle') {
            const r = Math.min(cropW, cropH) / 2;
            ctx.beginPath();
            ctx.arc(cropX + r, cropY + r, r, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            ctx.strokeRect(cropX, cropY, cropW, cropH);
        }
        ctx.setLineDash([]);
    }, [imageLoaded, cropX, cropY, cropW, cropH, cropMode]);

    const handleCrop = useCallback(() => {
        if (!imageRef.current || !canvasRef.current) { toast.error('Please upload an image first'); return; }
        setIsProcessing(true);
        setProgress(0);

        const img = imageRef.current;
        const canvas = canvasRef.current;
        const scale = img.width / canvas.width;

        const sx = Math.round(cropX * scale);
        const sy = Math.round(cropY * scale);
        const sw = Math.round(cropW * scale);
        const sh = Math.round(cropH * scale);

        const outCanvas = document.createElement('canvas');
        const size = cropMode === 'circle' ? Math.min(sw, sh) : sw;
        outCanvas.width = cropMode === 'circle' ? size : sw;
        outCanvas.height = cropMode === 'circle' ? size : sh;
        const ctx = outCanvas.getContext('2d');
        if (!ctx) return;

        if (cropMode === 'circle') {
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
        } else {
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outCanvas.width, outCanvas.height);
        }

        setProgress(100);
        setProcessedImage(outCanvas.toDataURL('image/png'));
        setIsProcessing(false);
        toast.success('Image cropped!');
    }, [cropX, cropY, cropW, cropH, cropMode, setIsProcessing, setProcessedImage, setProgress]);

    const handleDownload = useCallback(() => {
        if (!processedImage) return;
        const link = document.createElement('a');
        link.href = processedImage;
        link.download = `cropped-${Date.now()}.png`;
        link.click();
    }, [processedImage]);

    const handleReset = useCallback(() => {
        setImageLoaded(false);
        reset();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [reset]);

    if (!activeTool) return null;

    const modeIcons: Record<CropMode, React.ReactNode> = {
        rect: <Crop className="w-4 h-4" />,
        circle: <Circle className="w-4 h-4" />,
        square: <Square className="w-4 h-4" />,
        freehand: <Scissors className="w-4 h-4" />,
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 lg:px-8 py-8">
            <ToolPageHeader
                title={activeTool.name}
                description={activeTool.description}
                icon={modeIcons[cropMode]}
                onReset={handleReset}
            >
                {processedImage && (
                    <Button onClick={handleDownload} className="gap-2 btn-premium rounded-xl">
                        <Download className="w-4 h-4" />Download
                    </Button>
                )}
            </ToolPageHeader>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {!uploadedFile ? <FileUpload /> : (
                        <div className="rounded-2xl border border-border/40 overflow-hidden bg-card/60 backdrop-blur-sm shadow-lg">
                            <div className="p-4 border-b border-border/40 bg-gradient-to-r from-primary/5 to-transparent"><h3 className="font-semibold">Adjust Crop Area</h3></div>
                            <div className="p-4 flex justify-center bg-muted/20 dark:bg-zinc-900">
                                <canvas ref={canvasRef} className="max-w-full cursor-crosshair rounded-lg" />
                            </div>
                        </div>
                    )}
                    {processedImage && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-primary/30 bg-primary/5 overflow-hidden shadow-lg">
                            <div className="p-4 border-b border-primary/20 flex items-center justify-between">
                                <h3 className="font-semibold text-foreground">Cropped Result</h3>
                                <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">Done</Badge>
                            </div>
                            <div className="p-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjBmMGYwIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMGYwZjAiLz48L3N2Zz4=')] dark:bg-zinc-900 flex items-center justify-center min-h-[200px]">
                                <img src={processedImage} alt="Cropped" className="max-w-full max-h-96 object-contain rounded-lg" />
                            </div>
                        </motion.div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden shadow-premium">
                        <div className="p-5 border-b border-border/40 bg-gradient-to-r from-primary/10 to-transparent">
                            <h3 className="font-bold flex items-center gap-2.5 tracking-tight text-foreground">
                                <Settings className="w-4 h-4 text-primary" />
                                Crop Settings
                            </h3>
                        </div>
                        <div className="p-5 space-y-4">
                            {cropMode === 'rect' && (
                                <div className="space-y-2">
                                    <Label>Aspect Ratio</Label>
                                    <Select value={aspectRatio} onValueChange={(v) => {
                                        setAspectRatio(v);
                                        if (v !== 'free' && canvasRef.current) {
                                            const [w, h] = v.split(':').map(Number);
                                            const newH = Math.round(cropW * (h / w));
                                            setCropH(newH);
                                        }
                                    }}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {ASPECT_PRESETS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">X Position</Label>
                                    <Input type="number" value={cropX} onChange={e => setCropX(Number(e.target.value))} min={0} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Y Position</Label>
                                    <Input type="number" value={cropY} onChange={e => setCropY(Number(e.target.value))} min={0} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Width</Label>
                                    <Input type="number" value={cropW} onChange={e => {
                                        const w = Number(e.target.value);
                                        setCropW(w);
                                        if (cropMode === 'square' || cropMode === 'circle') setCropH(w);
                                    }} min={10} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Height</Label>
                                    <Input type="number" value={cropH} onChange={e => setCropH(Number(e.target.value))} min={10} disabled={cropMode === 'square' || cropMode === 'circle'} />
                                </div>
                            </div>

                            <div className="pt-2 space-y-3">
                                <Button
                                    className="w-full btn-premium py-6 rounded-xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all"
                                    onClick={handleCrop}
                                    disabled={!uploadedFile || isProcessing}
                                    size="lg"
                                >
                                    {isProcessing ? 'Cropping...' : '✂️ Crop Image'}
                                </Button>
                                <Button variant="outline" className="w-full gap-2 rounded-xl py-6 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-colors bg-background/50" onClick={handleReset}>
                                    <RotateCcw className="w-4 h-4" />Start Over
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
