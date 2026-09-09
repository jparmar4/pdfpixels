'use client';

import { useState, useCallback, useEffect } from 'react';
import { Download, RotateCcw, Shield, ShieldCheck, ShieldAlert, CheckCircle2, Lock, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/app-store';
import { FileUpload } from './file-upload';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { toast } from 'sonner';

interface MetadataInfo {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  hasXmpMetadata?: boolean;
}

export function SanitizePdfWorkspace() {
  const { uploadedFile, isProcessing, setIsProcessing, setProgress, reset } = useAppStore();

  const [metadata, setMetadata] = useState<MetadataInfo | null>(null);
  const [hasAnyMetadata, setHasAnyMetadata] = useState<boolean>(false);
  const [flattenForms, setFlattenForms] = useState<boolean>(true);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [sanitizedFileName, setSanitizedFileName] = useState<string>('');

  useEffect(() => {
    return () => {
      if (downloadUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  // Inspect metadata on file upload
  useEffect(() => {
    if (!uploadedFile) {
      setMetadata(null);
      setHasAnyMetadata(false);
      setDownloadUrl(null);
      return;
    }

    let active = true;
    (async () => {
      setIsProcessing(true);
      setProgress(25);

      try {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('action', 'inspect');

        setProgress(65);
        const res = await fetch('/api/pdf/sanitize', {
          method: 'POST',
          body: formData,
        });

        setProgress(90);
        if (!res.ok) throw new Error('Could not inspect document metadata');

        const data = await res.json();
        if (active) {
          setMetadata(data.metadata || {});
          setHasAnyMetadata(data.hasAnyMetadata || false);
          setProgress(100);
        }
      } catch (err: any) {
        if (active) toast.error(err.message || 'Metadata inspection failed');
      } finally {
        if (active) setIsProcessing(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [uploadedFile, setIsProcessing, setProgress]);

  const handleReset = useCallback(() => {
    reset();
    setMetadata(null);
    setHasAnyMetadata(false);
    setDownloadUrl(null);
    setSanitizedFileName('');
  }, [reset]);

  const handleSanitize = async () => {
    if (!uploadedFile) return;
    setIsProcessing(true);
    setProgress(30);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('action', 'sanitize');
      if (flattenForms) formData.append('flatten', '1');

      setProgress(70);
      const res = await fetch('/api/pdf/sanitize', {
        method: 'POST',
        body: formData,
      });

      setProgress(95);
      if (!res.ok) throw new Error('Failed to sanitize PDF');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      const baseName = uploadedFile.name.replace(/\.pdf$/i, '');
      setSanitizedFileName(`${baseName}-sanitized.pdf`);
      setProgress(100);
      toast.success('All metadata, tracking streams, and software fingerprints removed!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to sanitize document');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = sanitizedFileName || 'sanitized-document.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success('Downloaded sanitized document!');
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-4xl">
      <ToolPageHeader
        title="Sanitize PDF — Remove Hidden Metadata"
        description="Permanently delete author details, creation dates, software fingerprints, and XMP tracking streams from confidential documents."
        icon={<Shield className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'PDF only · contracts, legal briefs, leaked documents',
          'Wipes Document Info Dictionary (Author, Creator, Timestamps)',
          'Permanently purges XMP XML streams & flattens interactive layers',
        ]}
      />

      {!uploadedFile ? (
        <div className="mt-8">
          <FileUpload accept=".pdf,application/pdf" />
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {/* Metadata Audit Card */}
          <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Eye className="w-4 h-4 text-primary" />
                Security & Metadata Audit
              </div>
              <Badge variant={hasAnyMetadata ? 'destructive' : 'outline'} className="text-xs">
                {hasAnyMetadata ? 'Metadata Detected' : 'Clean Document'}
              </Badge>
            </div>

            {isProcessing && !metadata ? (
              <p className="text-sm text-muted-foreground animate-pulse py-4">
                Scanning document properties, XMP streams, and author signatures...
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-muted/40 border">
                  <span className="text-muted-foreground block text-[11px]">Author / User</span>
                  <span className="font-semibold text-foreground font-mono">{metadata?.author || 'None'}</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border">
                  <span className="text-muted-foreground block text-[11px]">Creation Software</span>
                  <span className="font-semibold text-foreground font-mono truncate block">{metadata?.creator || 'None'}</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border">
                  <span className="text-muted-foreground block text-[11px]">Document Title</span>
                  <span className="font-semibold text-foreground font-mono">{metadata?.title || 'None'}</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border">
                  <span className="text-muted-foreground block text-[11px]">Producer / Engine</span>
                  <span className="font-semibold text-foreground font-mono truncate block">{metadata?.producer || 'None'}</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border">
                  <span className="text-muted-foreground block text-[11px]">Creation Date</span>
                  <span className="font-semibold text-foreground font-mono">{metadata?.creationDate ? new Date(metadata.creationDate).toLocaleString() : 'None'}</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border">
                  <span className="text-muted-foreground block text-[11px]">Embedded XMP Stream</span>
                  <span className="font-semibold text-foreground font-mono">{metadata?.hasXmpMetadata ? 'Active (Present)' : 'None'}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="flatten-check"
                checked={flattenForms}
                onChange={(e) => setFlattenForms(e.target.checked)}
                className="rounded accent-primary w-4 h-4 cursor-pointer"
              />
              <label htmlFor="flatten-check" className="text-xs text-muted-foreground cursor-pointer select-none">
                Flatten form fields & comments (prevents recovery of hidden draft inputs)
              </label>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {!downloadUrl ? (
                <Button
                  onClick={handleSanitize}
                  disabled={isProcessing}
                  className="gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm font-semibold"
                >
                  <Trash2 className="w-4 h-4" />
                  {isProcessing ? 'Purging Metadata...' : 'Purge All Metadata & Sanitize'}
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <Button onClick={handleDownload} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm">
                    <Download className="w-4 h-4" /> Download Sanitized PDF
                  </Button>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <ShieldCheck className="w-4 h-4" /> 100% Sanitized & Anonymized
                  </div>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-xs text-muted-foreground ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Start Over
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
