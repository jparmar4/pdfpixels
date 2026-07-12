'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Download, FileText, RotateCcw, Sparkles, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const LANGUAGES = [
    { value: 'eng', label: 'English' },
    { value: 'fra', label: 'French' },
    { value: 'deu', label: 'German' },
    { value: 'spa', label: 'Spanish' },
    { value: 'ita', label: 'Italian' },
    { value: 'por', label: 'Portuguese' },
    { value: 'chi_sim', label: 'Chinese (Simplified)' },
    { value: 'jpn', label: 'Japanese' },
    { value: 'kor', label: 'Korean' },
    { value: 'ara', label: 'Arabic' },
    { value: 'hin', label: 'Hindi' },
    { value: 'rus', label: 'Russian' },
];

export function OCRWorkspace() {
    const { activeTool, uploadedFile, isProcessing, reset, setIsProcessing, setProgress } = useAppStore();

    const [extractedText, setExtractedText] = useState('');
    const [language, setLanguage] = useState('eng');
    const [copied, setCopied] = useState(false);
    const [charCount, setCharCount] = useState(0);
    const [highAccuracy, setHighAccuracy] = useState(true);

    const handleProcess = useCallback(async () => {
        if (!uploadedFile) {
            toast.error('Please upload an image first');
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setExtractedText('');

        try {
            let processUrl = URL.createObjectURL(uploadedFile);

            if (highAccuracy) {
                setProgress(5);
                toast.info('Preprocessing image for accuracy...', { duration: 1500 });

                const formData = new FormData();
                formData.append('image', uploadedFile);
                formData.append('format', 'png');
                formData.append('contrast', '1.5'); // High contrast for text
                formData.append('sharpen', '1.0');  // Sharpen edges
                formData.append('grayscale', 'true'); // Best for OCR

                const processRes = await fetch('/api/image/process', {
                    method: 'POST',
                    body: formData
                });

                if (processRes.ok) {
                    const data = await processRes.json();
                    processUrl = data.imageUrl;
                }
            }

            // Load Tesseract.js dynamically (client-side only)
            const Tesseract = (await import('tesseract.js'));

            setProgress(20);
            toast.info('Running OCR engine...', { duration: 2000 });

            const result = await Tesseract.recognize(
                processUrl,
                language,
                {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            setProgress(Math.round(m.progress * 70) + 25);
                        }
                    },
                }
            );

            if (highAccuracy && processUrl.startsWith('data:')) {
                // No need to revoke if it's base64, but if we opened a URL we should
            } else {
                URL.revokeObjectURL(processUrl);
            }
            setProgress(100);

            const text = result.data.text.trim();
            setExtractedText(text);
            setCharCount(text.length);

            if (text) {
                toast.success(`Extracted ${text.length} characters successfully!`);
            } else {
                toast.warning('No text found in the image. Try a clearer image.');
            }
        } catch (error) {
            console.error('OCR error:', error);
            toast.error('OCR failed. Please try again with a clearer image.');
        } finally {
            setIsProcessing(false);
        }
    }, [uploadedFile, language, highAccuracy, setIsProcessing, setProgress]);

    const handleCopy = useCallback(async () => {
        if (!extractedText) return;
        await navigator.clipboard.writeText(extractedText);
        setCopied(true);
        toast.success('Text copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    }, [extractedText]);

    const handleDownloadText = useCallback(() => {
        if (!extractedText) return;
        const blob = new Blob([extractedText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `extracted-text-${Date.now()}.txt`;
        link.click();
        URL.revokeObjectURL(url);
    }, [extractedText]);

    const handleReset = useCallback(() => {
        reset();
        setExtractedText('');
        setCharCount(0);
    }, [reset]);

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
                icon={FileText}
                onReset={handleReset}
            >
                {extractedText && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleCopy} className="gap-2 rounded-xl">
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied!' : 'Copy Text'}
                        </Button>
                        <Button onClick={handleDownloadText} className="gap-2 btn-premium rounded-xl">
                            <Download className="w-4 h-4" />
                            Download .txt
                        </Button>
                    </div>
                )}
            </ToolPageHeader>

            {/* Main Content */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Panel */}
                <div className="lg:col-span-2 space-y-6">
                    <FileUpload accept="image/*" />

                    {/* Extracted Text */}
                    <AnimatePresence>
                        {extractedText && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="rounded-2xl border border-primary/30 bg-primary/5 overflow-hidden shadow-lg"
                            >
                                <div className="p-4 border-b border-primary/20 flex items-center justify-between">
                                    <h3 className="font-semibold flex items-center gap-2 text-foreground">
                                        <FileText className="w-4 h-4 text-primary" />
                                        Extracted Text
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">{charCount.toLocaleString()} chars</Badge>
                                        <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/20">
                                            Complete
                                        </Badge>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <textarea
                                        value={extractedText}
                                        onChange={(e) => {
                                            setExtractedText(e.target.value);
                                            setCharCount(e.target.value.length);
                                        }}
                                        className="w-full min-h-64 p-3 rounded-lg border border-border bg-muted/30 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        placeholder="Extracted text will appear here..."
                                        aria-label="Extracted text"
                                    />
                                    <div className="flex justify-end mt-2">
                                        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            {copied ? 'Copied!' : 'Copy All'}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Panel */}
                <div className="space-y-6">
                    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden shadow-premium">
                        <div className="p-5 border-b border-border/40 bg-gradient-to-r from-primary/10 to-transparent">
                            <h3 className="font-bold flex items-center gap-2.5 tracking-tight text-foreground">
                                <Sparkles className="w-4 h-4 text-primary" />
                                OCR Settings
                            </h3>
                        </div>

                        <div className="p-5 space-y-6">
                            <div className="space-y-2">
                                <Label>Document Language</Label>
                                <Select value={language} onValueChange={setLanguage}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {LANGUAGES.map(lang => (
                                            <SelectItem key={lang.value} value={lang.value}>
                                                {lang.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Select the primary language in your image for best results
                                </p>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                <div className="space-y-0.5">
                                    <Label className="text-sm">High Accuracy Mode</Label>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">AI Preprocessing</p>
                                </div>
                                <Button
                                    variant={highAccuracy ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setHighAccuracy(!highAccuracy)}
                                    className="h-8"
                                >
                                    {highAccuracy ? 'Enabled' : 'Disabled'}
                                </Button>
                            </div>

                            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                    <strong>Best results:</strong> Use clear images with good lighting and sharp text at 300+ DPI.
                                </p>
                            </div>

                            <div className="pt-2 space-y-3">
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
                                            Extracting Text...
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="w-5 h-5 mr-3" />
                                            Extract Text (OCR)
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

                    <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 to-transparent p-5 space-y-3">
                        <h4 className="font-semibold flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            Tips for Best Results
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-2">
                            <li className="flex items-start gap-2">
                                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <span>Use high-resolution images (300 DPI+)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <span>Ensure good contrast between text and background</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <span>Avoid skewed or rotated text when possible</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <span>Supports JPG, PNG, WebP formats</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
