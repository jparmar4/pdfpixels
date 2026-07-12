'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
    Download, RotateCcw, RotateCw, Sparkles, ChevronRight,
    Stamp, Shield, FileLock, Layers, Trash2, GripVertical, Check, Zap, Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { InContentAd } from '@/components/ads/ad-banner';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PDFResult {
    pdfUrl: string;
    fileName: string;
    pageCount?: number;
}

// ─── Tool-specific settings panels ────────────────────────────────────────────

function RotateSettings({
    angle, setAngle, pages, setPages, totalPages
}: {
    angle: number; setAngle: (a: number) => void;
    pages: string; setPages: (p: string) => void;
    totalPages: number;
}) {
    return (
        <div className="space-y-5">
            <div className="space-y-2">
                <Label>Rotation Angle</Label>
                <div className="grid grid-cols-4 gap-2">
                    {[90, 180, 270, -90].map(a => (
                        <Button
                            key={a}
                            variant={angle === a ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setAngle(a)}
                            className="gap-1"
                        >
                            {a === -90 ? '-90°' : `${a}°`}
                        </Button>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">Rotates pages clockwise</p>
            </div>

            {totalPages > 0 && (
                <div className="space-y-2">
                    <Label>Pages to Rotate</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant={pages === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setPages('all')}>
                            All Pages
                        </Button>
                        <Button variant={pages !== 'all' ? 'default' : 'outline'} size="sm" onClick={() => setPages('1')}>
                            Specific
                        </Button>
                    </div>
                    {pages !== 'all' && (
                        <Input
                            value={pages}
                            onChange={e => setPages(e.target.value)}
                            placeholder="e.g. 1,2,4-6"
                            className="font-mono text-sm"
                        />
                    )}
                    <p className="text-xs text-muted-foreground">
                        {totalPages > 0 ? `PDF has ${totalPages} pages` : 'Upload a PDF to see page count'}
                    </p>
                </div>
            )}
        </div>
    );
}

function WatermarkSettings({
    text, setText, opacity, setOpacity,
    color, setColor, fontSize, setFontSize,
    position, setPosition, rotation, setRotation
}: {
    text: string; setText: (v: string) => void;
    opacity: number; setOpacity: (v: number) => void;
    color: string; setColor: (v: string) => void;
    fontSize: number; setFontSize: (v: number) => void;
    position: string; setPosition: (v: string) => void;
    rotation: number; setRotation: (v: number) => void;
}) {
    return (
        <div className="space-y-5">
            <div className="space-y-2">
                <Label>Watermark Text</Label>
                <Input value={text} onChange={e => setText(e.target.value)} placeholder="e.g. CONFIDENTIAL" />
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>Opacity</Label>
                    <span className="text-sm font-mono text-primary">{Math.round(opacity * 100)}%</span>
                </div>
                <Slider value={[opacity * 100]} onValueChange={([v]) => setOpacity(v / 100)} min={5} max={100} step={5} />
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>Font Size</Label>
                    <span className="text-sm font-mono text-primary">{fontSize}pt</span>
                </div>
                <Slider value={[fontSize]} onValueChange={([v]) => setFontSize(v)} min={12} max={120} step={4} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex items-center gap-2">
                        <input type="color" value={color} onChange={e => setColor(e.target.value)} aria-label="Pick a color" className="w-8 h-8 rounded cursor-pointer border border-border" />
                        <span className="text-sm font-mono text-muted-foreground">{color}</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Rotation</Label>
                    <Select value={rotation.toString()} onValueChange={v => setRotation(parseInt(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">Horizontal</SelectItem>
                            <SelectItem value="45">45° Diagonal</SelectItem>
                            <SelectItem value="90">Vertical</SelectItem>
                            <SelectItem value="-45">-45° Diagonal</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Position</Label>
                <Select value={position} onValueChange={setPosition}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="center">Center (with rotation)</SelectItem>
                        <SelectItem value="diagonal">Diagonal Repeat</SelectItem>
                        <SelectItem value="top-left">Top Left</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

function ProtectSettings({ password, setPassword, confirmPassword, setConfirmPassword }: {
    password: string; setPassword: (v: string) => void;
    confirmPassword: string; setConfirmPassword: (v: string) => void;
}) {
    return (
        <div className="space-y-5">
            <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" />
            </div>
            <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" />
                {password && confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500">Passwords do not match</p>
                )}
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                    <strong>Tip:</strong> Use a strong password you can safely store. You will need the same password later to unlock the PDF.
                </p>
            </div>
        </div>
    );
}

function UnlockSettings({ password, setPassword }: { password: string; setPassword: (v: string) => void }) {
    return (
        <div className="space-y-5">
            <div className="space-y-2">
                <Label>PDF Password</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter the current PDF password" />
                <p className="text-xs text-muted-foreground">
                    Enter the existing password to remove encryption and download an unlocked copy.
                </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                    The original PDF is not modified. A separate unlocked file is generated for download after processing.
                </p>
            </div>
        </div>
    );
}

function DeletePagesSettings({ pages, setPages, totalPages }: {
    pages: string; setPages: (v: string) => void; totalPages: number;
}) {
    const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());

    useEffect(() => {
        const arr = Array.from(selectedPages).sort((a, b) => a - b);
        setPages(arr.join(','));
    }, [selectedPages, setPages]);

    const togglePage = (p: number) => {
        setSelectedPages(prev => {
            const next = new Set(prev);
            if (next.has(p)) next.delete(p);
            else next.add(p);
            return next;
        });
    };

    return (
        <div className="space-y-5">
            {totalPages > 0 ? (
                <>
                    <div className="space-y-2">
                        <Label>Select Pages to Delete</Label>
                        <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <Button
                                    key={p}
                                    variant={selectedPages.has(p) ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => togglePage(p)}
                                    className="aspect-square relative"
                                >
                                    {p}
                                    {selectedPages.has(p) && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                                    )}
                                </Button>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {selectedPages.size > 0
                                ? `Deleting ${selectedPages.size} page(s): ${Array.from(selectedPages).sort((a, b) => a - b).join(', ')}`
                                : 'No pages selected'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Or enter page numbers manually</Label>
                        <Input
                            value={pages}
                            onChange={e => setPages(e.target.value)}
                            placeholder="e.g. 1,3,5-7"
                        />
                    </div>
                </>
            ) : (
                <p className="text-sm text-muted-foreground">Upload a PDF to select pages to delete.</p>
            )}
        </div>
    );
}

function ReorderSettings({ order, setOrder, totalPages }: {
    order: number[]; setOrder: (o: number[]) => void; totalPages: number;
}) {
    useEffect(() => {
        if (totalPages > 0 && order.length !== totalPages) {
            setOrder(Array.from({ length: totalPages }, (_, i) => i + 1));
        }
    }, [totalPages, order.length, setOrder]);

    const moveUp = (idx: number) => {
        if (idx === 0) return;
        const next = [...order];
        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
        setOrder(next);
    };

    const moveDown = (idx: number) => {
        if (idx === order.length - 1) return;
        const next = [...order];
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
        setOrder(next);
    };

    if (totalPages === 0) {
        return <p className="text-sm text-muted-foreground">Upload a PDF to reorder its pages.</p>;
    }

    return (
        <div className="space-y-3">
            <Label>Page Order (drag or use arrows)</Label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {order.map((pageNum, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card">
                        <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm flex-1">
                            <span className="font-medium text-primary">Page {pageNum}</span>
                            {pageNum !== idx + 1 && (
                                <span className="text-muted-foreground text-xs ml-1">(was page {pageNum})</span>
                            )}
                        </span>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => moveUp(idx)} disabled={idx === 0} className="h-6 w-6 p-0">
                                <ChevronRight className="w-3 h-3 rotate-[-90deg]" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => moveDown(idx)} disabled={idx === order.length - 1} className="h-6 w-6 p-0">
                                <ChevronRight className="w-3 h-3 rotate-90" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function LinearizeSettings() {
    return (
        <div className="space-y-4 text-sm text-muted-foreground p-2">
            <p>
                <strong>Fast Web View</strong> restructures your PDF so that it can be displayed page-by-page as it downloads over the internet, rather than requiring the entire file to download first.
            </p>
            <p className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary dark:text-primary-foreground font-medium">
                Ideal for large PDFs hosted on websites. Simply click process below.
            </p>
        </div>
    );
}

function PageNumberSettings({
    position, setPosition, format, setFormat,
    margin, setMargin, fontSize, setFontSize
}: {
    position: string; setPosition: (v: string) => void;
    format: string; setFormat: (v: string) => void;
    margin: number; setMargin: (v: number) => void;
    fontSize: number; setFontSize: (v: number) => void;
}) {
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Position</Label>
                    <Select value={position} onValueChange={setPosition}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="bottom-left">Bottom Left</SelectItem>
                            <SelectItem value="bottom-center">Bottom Center</SelectItem>
                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                            <SelectItem value="top-left">Top Left</SelectItem>
                            <SelectItem value="top-center">Top Center</SelectItem>
                            <SelectItem value="top-right">Top Right</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Format</Label>
                    <Select value={format} onValueChange={setFormat}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="{n}">1, 2, 3...</SelectItem>
                            <SelectItem value="Page {n}">Page 1, Page 2...</SelectItem>
                            <SelectItem value="{n} of {total}">1 of 5...</SelectItem>
                            <SelectItem value="Page {n} of {total}">Page 1 of 5...</SelectItem>
                            <SelectItem value="- {n} -">- 1 -</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>Margin (px)</Label>
                    <span className="text-sm font-mono text-primary">{margin}px</span>
                </div>
                <Slider value={[margin]} onValueChange={([v]) => setMargin(v)} min={10} max={100} step={5} />
            </div>
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>Font Size</Label>
                    <span className="text-sm font-mono text-primary">{fontSize}pt</span>
                </div>
                <Slider value={[fontSize]} onValueChange={([v]) => setFontSize(v)} min={8} max={72} step={2} />
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function PDFToolsWorkspace() {
    const { activeTool, uploadedFile, isProcessing, reset, setIsProcessing, setProgress } = useAppStore();

    const [result, setResult] = useState<PDFResult | null>(null);
    const [totalPages, setTotalPages] = useState(0);

    // Rotate
    const [angle, setAngle] = useState(90);
    const [rotatePages, setRotatePages] = useState('all');

    // Watermark
    const [wmText, setWmText] = useState('CONFIDENTIAL');
    const [wmOpacity, setWmOpacity] = useState(0.3);
    const [wmColor, setWmColor] = useState('#808080');
    const [wmFontSize, setWmFontSize] = useState(48);
    const [wmPosition, setWmPosition] = useState('center');
    const [wmRotation, setWmRotation] = useState(45);

    // Protect / Unlock
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Delete pages
    const [deletePages, setDeletePages] = useState('');

    // Reorder
    const [pageOrder, setPageOrder] = useState<number[]>([]);

    // Page Numbers
    const [pnPosition, setPnPosition] = useState('bottom-center');
    const [pnFormat, setPnFormat] = useState('{n}');
    const [pnMargin, setPnMargin] = useState(30);
    const [pnFontSize, setPnFontSize] = useState(12);

    // Get page count from uploaded PDF
    useEffect(() => {
        if (!uploadedFile || !uploadedFile.name.toLowerCase().endsWith('.pdf')) {
            setTotalPages(0);
            return;
        }
        // Read PDF page count using pdf-lib on client
        (async () => {
            try {
                const { PDFDocument } = await import('pdf-lib');
                const ab = await uploadedFile.arrayBuffer();
                const pdf = await PDFDocument.load(new Uint8Array(ab), { ignoreEncryption: true });
                setTotalPages(pdf.getPageCount());
            } catch {
                setTotalPages(0);
            }
        })();
    }, [uploadedFile]);

    const handleProcess = useCallback(async () => {
        const getEndpoint = () => {
            const tid = activeTool?.id || '';
            if (tid === 'pdf-rotate') return '/api/pdf/rotate';
            if (tid === 'pdf-watermark') return '/api/pdf/watermark';
            if (tid === 'pdf-protect') return '/api/pdf/protect';
            if (tid === 'pdf-unlock') return '/api/pdf/protect';
            if (tid === 'pdf-delete-pages') return '/api/pdf/delete-pages';
            if (tid === 'pdf-reorder') return '/api/pdf/reorder';
            if (tid === 'pdf-linearize') return '/api/pdf/linearize';
            if (tid === 'pdf-add-page-numbers') return '/api/pdf/add-page-numbers';
            return '/api/pdf/rotate';
        };

        const buildForm = (): FormData | null => {
            if (!uploadedFile) return null;
            const tid = activeTool?.id || '';
            const fd = new FormData();
            fd.append('file', uploadedFile);

            if (tid === 'pdf-rotate') {
                fd.append('angle', angle.toString());
                fd.append('pages', rotatePages);
            } else if (tid === 'pdf-watermark') {
                if (!wmText.trim()) { toast.error('Please enter watermark text'); return null; }
                fd.append('text', wmText);
                fd.append('opacity', wmOpacity.toString());
                fd.append('color', wmColor);
                fd.append('fontSize', wmFontSize.toString());
                fd.append('position', wmPosition);
                fd.append('rotation', wmRotation.toString());
            } else if (tid === 'pdf-protect') {
                if (!password) { toast.error('Please enter a password'); return null; }
                if (password !== confirmPassword) { toast.error('Passwords do not match'); return null; }
                fd.append('password', password);
                fd.append('action', 'protect');
            } else if (tid === 'pdf-unlock') {
                fd.append('password', password);
                fd.append('action', 'unlock');
            } else if (tid === 'pdf-delete-pages') {
                if (!deletePages.trim()) { toast.error('Please select pages to delete'); return null; }
                fd.append('pages', deletePages);
            } else if (tid === 'pdf-reorder') {
                if (pageOrder.length === 0) { toast.error('No page order set'); return null; }
                fd.append('order', JSON.stringify(pageOrder));
            } else if (tid === 'pdf-add-page-numbers') {
                fd.append('position', pnPosition);
                fd.append('format', pnFormat);
                fd.append('margin', pnMargin.toString());
                fd.append('fontSize', pnFontSize.toString());
            }

            return fd;
        };

        if (!uploadedFile) { toast.error('Please upload a PDF file'); return; }

        const formData = buildForm();
        if (!formData) return;

        setIsProcessing(true);
        setProgress(0);
        setResult(null);

        try {
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 8, 90));
            }, 200);

            const response = await fetch(getEndpoint(), { method: 'POST', body: formData });
            clearInterval(progressInterval);
            setProgress(100);

            if (!response.ok) {
                let message = 'Processing failed';
                try {
                    const errText = await response.text();
                    try { const err = JSON.parse(errText); message = err.error || message; } catch { message = errText || message; }
                } catch { /* ignore parse error */ }
                throw new Error(message);
            }

            const contentType = response.headers.get('content-type') || '';

            if (contentType.includes('application/json')) {
                const data = await response.json();
                setResult({ pdfUrl: data.pdfUrl, fileName: data.fileName, pageCount: data.pageCount });
            } else {
                const blob = await response.blob();
                const pdfUrl = URL.createObjectURL(blob);
                const disposition = response.headers.get('content-disposition') || '';
                const fileNameMatch = disposition.match(/filename=["\x27]?([^";\r\n]+)["\x27]?/i);
                const fileName = fileNameMatch?.[1]?.trim() || `processed-${Date.now()}.pdf`;
                const pageCount = Number(response.headers.get('x-page-count') || response.headers.get('x-total-pages') || 0);
                setResult({ pdfUrl, fileName, pageCount: pageCount || undefined });
            }

            toast.success('PDF processed successfully!');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to process PDF');
        } finally {
            setIsProcessing(false);
        }

    }, [uploadedFile, activeTool, angle, rotatePages, wmText, wmOpacity, wmColor, wmFontSize, wmPosition, wmRotation, password, confirmPassword, deletePages, pageOrder, pnPosition, pnFormat, pnMargin, pnFontSize, setIsProcessing, setProgress]);

    const handleDownload = useCallback(() => {
        if (!result) return;
        const link = document.createElement('a');
        link.href = result.pdfUrl;
        link.download = result.fileName;
        link.click();
    }, [result]);

    const handleReset = useCallback(() => {
        reset();
        setResult(null);
        setPassword('');
        setConfirmPassword('');
        setDeletePages('');
        setPageOrder([]);
    }, [reset]);

    const getToolIcon = () => {
        const toolId = activeTool?.id || '';
        if (toolId === 'pdf-rotate') return RotateCw;
        if (toolId === 'pdf-watermark') return Stamp;
        if (toolId === 'pdf-protect') return Shield;
        if (toolId === 'pdf-unlock') return FileLock;
        if (toolId === 'pdf-reorder') return Layers;
        if (toolId === 'pdf-delete-pages') return Trash2;
        if (toolId === 'pdf-linearize') return Zap;
        if (toolId === 'pdf-add-page-numbers') return Hash;
    return Sparkles;
};

const renderSettings = () => {
    const toolId = activeTool?.id || '';
    if (toolId === 'pdf-rotate') return <RotateSettings angle={angle} setAngle={setAngle} pages={rotatePages} setPages={setRotatePages} totalPages={totalPages} />;
    if (toolId === 'pdf-watermark') return <WatermarkSettings text={wmText} setText={setWmText} opacity={wmOpacity} setOpacity={setWmOpacity} color={wmColor} setColor={setWmColor} fontSize={wmFontSize} setFontSize={setWmFontSize} position={wmPosition} setPosition={setWmPosition} rotation={wmRotation} setRotation={setWmRotation} />;
    if (toolId === 'pdf-protect') return <ProtectSettings password={password} setPassword={setPassword} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword} />;
    if (toolId === 'pdf-unlock') return <UnlockSettings password={password} setPassword={setPassword} />;
    if (toolId === 'pdf-delete-pages') return <DeletePagesSettings pages={deletePages} setPages={setDeletePages} totalPages={totalPages} />;
    if (toolId === 'pdf-reorder') return <ReorderSettings order={pageOrder} setOrder={setPageOrder} totalPages={totalPages} />;
    if (toolId === 'pdf-linearize') return <LinearizeSettings />;
    if (toolId === 'pdf-add-page-numbers') return <PageNumberSettings position={pnPosition} setPosition={setPnPosition} format={pnFormat} setFormat={setPnFormat} margin={pnMargin} setMargin={setPnMargin} fontSize={pnFontSize} setFontSize={setPnFontSize} />;
    return null;
};


const getProcessLabel = () => {
    const toolId = activeTool?.id || '';
    if (toolId === 'pdf-rotate') return 'Rotate PDF';
    if (toolId === 'pdf-watermark') return 'Add Watermark';
    if (toolId === 'pdf-protect') return 'Protect PDF';
    if (toolId === 'pdf-unlock') return 'Unlock PDF';
    if (toolId === 'pdf-delete-pages') return 'Delete Pages';
    if (toolId === 'pdf-reorder') return 'Reorder Pages';
    if (toolId === 'pdf-linearize') return 'Optimize PDF';
    if (toolId === 'pdf-add-page-numbers') return 'Add Page Numbers';
    return 'Process PDF';
};

const ToolIcon = getToolIcon();

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
            icon={ToolIcon}
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
            {/* Left Panel */}
            <div className="lg:col-span-2 space-y-6">
                <FileUpload accept=".pdf" />

                {/* Page Count Info */}
                {totalPages > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card"
                    >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Layers className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">PDF Loaded</p>
                            <p className="text-sm text-muted-foreground">{totalPages} page{totalPages !== 1 ? 's' : ''}</p>
                        </div>
                        <Badge variant="secondary" className="ml-auto">Ready</Badge>
                    </motion.div>
                )}

                {/* Result */}
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="rounded-2xl border border-primary/30 bg-primary/5 p-6"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    <Check className="w-5 h-5 text-green-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-green-700 dark:text-green-400">Processing Complete!</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {result.pageCount} page{result.pageCount !== 1 ? 's' : ''} · {result.fileName}
                                    </p>
                                </div>
                            </div>
                            <Button onClick={handleDownload} className="w-full gap-2 btn-premium py-6 rounded-xl font-bold" size="lg">
                                <Download className="w-4 h-4" />
                                Download Processed PDF
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Right Panel */}
            <div className="space-y-6">
                <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden shadow-premium">
                    <div className="p-5 border-b border-border/40 bg-gradient-to-r from-primary/10 to-transparent">
                        <h3 className="font-bold flex items-center gap-2.5 tracking-tight text-foreground">
                            <ToolIcon className="w-4 h-4 text-primary" />
                            {activeTool.name} Settings
                        </h3>
                    </div>

                    <div className="p-5 space-y-6">
                        {renderSettings()}
                        <div className="pt-4 space-y-3">
                            <Button
                                className="w-full btn-premium py-6 rounded-xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all"
                                onClick={handleProcess}
                                disabled={!uploadedFile || isProcessing}
                                size="lg"
                            >
                                {isProcessing ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full mr-3"
                                        />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5 mr-3" />
                                        {getProcessLabel()}
                                    </>
                                )}
                            </Button>

                            <Button variant="outline" className="w-full gap-2 rounded-xl py-6 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-colors bg-background/50" onClick={handleReset}>
                                <RotateCcw className="w-4 h-4" />
                                Start Over
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden shadow-premium p-4">
                    <InContentAd />
                </div>

                <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 to-transparent p-5 space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Tips
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li className="flex items-start gap-2">
                            <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>Rotate, watermark, protect, unlock, reorder, and delete pages run in one workspace</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>Supports PDFs up to 25MB</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </motion.div>
);
}


