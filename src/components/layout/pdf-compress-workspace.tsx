'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Download, Minimize2, Sparkles, RefreshCw, Zap, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { ToolPageHeader } from './tool-page-header';

interface CompressionResult {
    pdfUrl: string;
}

export function CompressPDFWorkspace() {
    const { activeTool, uploadedFile, isProcessing, reset, setIsProcessing, setProgress } = useAppStore();
    const [result, setResult] = useState<CompressionResult | null>(null);

    const handleProcess = useCallback(async () => {
        if (!uploadedFile) {
            toast.error('Please upload a PDF first');
            return;
        }

        setIsProcessing(true);
        setProgress(0);

        const formData = new FormData();
        formData.append('file', uploadedFile);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 8, 90));
            }, 150);

            // Call the correct PDF compression route
            const response = await fetch('/api/pdf/compress', {
                method: 'POST',
                body: formData,
            });

            clearInterval(progressInterval);
            setProgress(100);

            if (!response.ok) {
                throw new Error('Processing failed');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            setResult({ pdfUrl: url });
            toast.success('PDF successfully compressed!');
        } catch {
            toast.error('Failed to compress PDF. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    }, [uploadedFile, setIsProcessing, setProgress]);

    const handleDownload = useCallback(() => {
        if (result && uploadedFile) {
            const link = document.createElement('a');
            link.href = result.pdfUrl;
            const originalName = uploadedFile.name;
            const baseName = originalName.includes('.') ? originalName.substring(0, originalName.lastIndexOf('.')) : originalName;
            link.download = `${baseName}-compressed.pdf`;
            link.click();
        }
    }, [result, uploadedFile]);

    const handleReset = useCallback(() => {
        reset();
        setResult(null);
    }, [reset]);

    if (!activeTool) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="container mx-auto px-4 lg:px-8 py-8 md:py-12 max-w-4xl"
        >
            <ToolPageHeader
                title={activeTool.name}
                description={activeTool.description}
                icon={Minimize2}
                onReset={handleReset}
            />

            {/* Main Content */}
            <div className="space-y-6">
                <FileUpload accept=".pdf" />

                {/* Action Row — shown when file is uploaded */}
                {uploadedFile && !result && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="flex flex-col items-center gap-5 mt-8 mb-2 max-w-2xl mx-auto"
                    >
                        <div className="w-full bg-card/60 backdrop-blur-xl border border-border/60 shadow-xl shadow-red-500/5 rounded-2xl p-6 text-center text-sm font-medium text-muted-foreground">
                            <FileText className="w-8 h-8 mx-auto mb-3 text-red-500/70" />
                            <p>Your PDF will be compressed using advanced Ghostscript compression.</p>
                            <p>This process reduces file size while maintaining readability.</p>
                        </div>

                        {/* Compress button */}
                        <Button
                            className="btn-premium h-14 px-12 rounded-2xl font-bold text-base shadow-lg shadow-red-500/25 transition-all group w-full max-w-xs"
                            onClick={handleProcess}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                                />
                            ) : (
                                <>
                                    <Zap className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                                    Compress PDF
                                </>
                            )}
                        </Button>
                    </motion.div>
                )}

                {/* Result */}
                <AnimatePresence>
                    {result && uploadedFile && (
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6 pt-2 text-center"
                        >
                            <div className="inline-flex flex-col items-center gap-4 bg-green-500/10 border border-green-500/20 p-8 rounded-3xl w-full">
                                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-xl font-bold text-green-700 dark:text-green-400">PDF Compression Complete!</h3>
                                <p className="text-muted-foreground font-medium">Your file has been optimized for web and email sharing.</p>

                                {/* Download + Reset row */}
                                <div className="flex flex-col sm:flex-row items-center gap-3 pt-6 w-full max-w-md">
                                    <Button
                                        onClick={handleDownload}
                                        className="btn-premium w-full gap-2 h-13 px-8 rounded-2xl font-bold text-base shadow-lg shadow-green-500/25 flex-1"
                                        size="lg"
                                    >
                                        <Download className="w-5 h-5" />
                                        Download PDF
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={handleReset}
                                        className="w-full sm:w-auto gap-2 h-13 px-6 rounded-2xl font-medium text-muted-foreground hover:text-foreground border border-border/50 hover:bg-card bg-background/50"
                                        size="lg"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Compress Another
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
