'use client';

import { motion } from 'framer-motion';
import { Download, RotateCcw, PenTool, Type, Trash2, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/app-store';
import { ToolPageHeader } from './tool-page-header';
import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

export function SignatureWorkspace() {
    const { activeTool, reset } = useAppStore();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [signatureData, setSignatureData] = useState<string | null>(null);
    const [penColor, setPenColor] = useState('#000000');
    const [penSize, setPenSize] = useState(3);
    const [typedText, setTypedText] = useState('');
    const [selectedFont, setSelectedFont] = useState('Dancing Script');
    const [fontSize, setFontSize] = useState(48);
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    // Initialize canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = 600;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = 'transparent';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    }, []);

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        if ('touches' in e) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY,
            };
        }
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setIsDrawing(true);
        lastPos.current = getPos(e);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !lastPos.current) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        const pos = getPos(e);
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penSize;
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastPos.current = pos;
    };

    const stopDraw = () => {
        setIsDrawing(false);
        lastPos.current = null;
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        setSignatureData(null);
    };

    const generateFromText = () => {
        if (!typedText.trim()) { toast.error('Please type your signature'); return; }
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = penColor;
        ctx.font = `${fontSize}px '${selectedFont}', cursive`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedText, canvas.width / 2, canvas.height / 2);
    };

    const saveSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const data = canvas.toDataURL('image/png');
        setSignatureData(data);
        toast.success('Signature saved!');
    };

    const handleDownload = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `signature-${Date.now()}.png`;
        link.click();
        toast.success('Signature downloaded!');
    }, []);

    const handleReset = useCallback(() => {
        clearCanvas();
        setTypedText('');
        reset();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [reset]);

    if (!activeTool) return null;

    const fonts = [
        'Dancing Script', 'Great Vibes', 'Pacifico', 'Sacramento',
        'Satisfy', 'Alex Brush', 'Allura', 'Caveat',
    ];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 lg:px-8 py-8">
            <ToolPageHeader
                title={activeTool.name}
                description={activeTool.description}
                icon={PenTool}
                onReset={handleReset}
            >
                {signatureData && (
                    <Button onClick={handleDownload} className="gap-2 btn-premium rounded-xl">
                        <Download className="w-4 h-4" />Download PNG
                    </Button>
                )}
            </ToolPageHeader>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Canvas */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-2xl border border-border/40 overflow-hidden bg-card/60 backdrop-blur-sm shadow-lg">
                        <div className="p-4 border-b border-border/40 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                            <h3 className="font-semibold">Draw Your Signature</h3>
                            <Button variant="ghost" size="sm" onClick={clearCanvas} className="hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-4 h-4 mr-1" />Clear</Button>
                        </div>
                        <div className="bg-white dark:bg-gray-50 p-3">
                            <canvas
                                ref={canvasRef}
                                className="w-full cursor-crosshair border-2 border-dashed border-gray-200 dark:border-gray-300 rounded-xl"
                                style={{ touchAction: 'none', aspectRatio: '3/1' }}
                                onMouseDown={startDraw}
                                onMouseMove={draw}
                                onMouseUp={stopDraw}
                                onMouseLeave={stopDraw}
                                onTouchStart={startDraw}
                                onTouchMove={draw}
                                onTouchEnd={stopDraw}
                            />
                        </div>
                        <div className="p-3 border-t border-border/40 flex justify-center">
                            <Button onClick={saveSignature} className="gap-2 btn-premium rounded-xl"><PenTool className="w-4 h-4" />Save Signature</Button>
                        </div>
                    </div>

                    {signatureData && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-primary/30 bg-primary/5 overflow-hidden shadow-lg">
                            <div className="p-4 border-b border-primary/20 flex items-center justify-between">
                                <h3 className="font-semibold text-foreground">Preview</h3>
                                <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">Ready</Badge>
                            </div>
                            <div className="p-6 bg-white dark:bg-gray-50 flex items-center justify-center">
                                <img src={signatureData} alt="Signature" className="max-w-full max-h-32 object-contain" />
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Settings */}
                <div className="space-y-6">
                    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden shadow-premium">
                        <Tabs defaultValue="draw">
                            <div className="p-4 border-b border-border/40">
                                <TabsList className="w-full">
                                    <TabsTrigger value="draw" className="flex-1"><PenTool className="w-3 h-3 mr-1" />Draw</TabsTrigger>
                                    <TabsTrigger value="type" className="flex-1"><Type className="w-3 h-3 mr-1" />Type</TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="draw" className="p-5 space-y-4">
                                <div className="space-y-2">
                                    <Label>Pen Color</Label>
                                    <div className="flex gap-2">
                                        {[{ hex: '#000000', name: 'Black' }, { hex: '#1e40af', name: 'Blue' }, { hex: '#dc2626', name: 'Red' }, { hex: '#059669', name: 'Green' }, { hex: '#7c3aed', name: 'Purple' }].map(c => (
                                            <button key={c.hex} onClick={() => setPenColor(c.hex)} aria-label={c.name} className={`w-8 h-8 rounded-full border-2 transition-all ${penColor === c.hex ? 'border-primary ring-2 ring-primary/30 scale-110' : 'border-gray-200 hover:scale-105'}`} style={{ backgroundColor: c.hex }} />
                                        ))}
                                        <input type="color" value={penColor} onChange={(e) => setPenColor(e.target.value)} aria-label="Custom pen color" className="w-8 h-8 rounded-full cursor-pointer" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>Pen Size</Label><span className="text-sm font-mono font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg">{penSize}px</span></div>
                                    <Slider value={[penSize]} onValueChange={([v]) => setPenSize(v)} min={1} max={10} step={1} />
                                </div>
                            </TabsContent>

                            <TabsContent value="type" className="p-5 space-y-4">
                                <div className="space-y-2">
                                    <Label>Your Name</Label>
                                    <Input value={typedText} onChange={(e) => setTypedText(e.target.value)} placeholder="Type your name..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Font Style</Label>
                                    <Select value={selectedFont} onValueChange={setSelectedFont}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {fonts.map(f => (<SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>Font Size</Label><span className="text-sm font-mono font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg">{fontSize}px</span></div>
                                    <Slider value={[fontSize]} onValueChange={([v]) => setFontSize(v)} min={20} max={80} step={2} />
                                </div>
                                <Button onClick={generateFromText} className="w-full btn-premium rounded-xl"><Type className="w-4 h-4 mr-2" />Generate Signature</Button>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <Button variant="outline" className="w-full gap-2 rounded-xl py-6 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-colors bg-background/50" onClick={handleReset}>
                        <RotateCcw className="w-4 h-4" />Start Over
                    </Button>

                    <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 to-transparent p-5 space-y-3">
                        <h4 className="font-semibold flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />How to use
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-2">
                            <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" /><span>Draw or type your signature</span></li>
                            <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" /><span>Customize color and style</span></li>
                            <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" /><span>Click Save Signature</span></li>
                            <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" /><span>Download as transparent PNG</span></li>
                        </ul>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
