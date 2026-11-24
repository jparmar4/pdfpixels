'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FilePlus2,
  Fingerprint,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { buildSampleC2paJpegFile, inspectC2paProvenanceClient, type C2paReport } from '@/lib/c2pa-inspector';
import { PrivateModeBadge } from './private-mode-badge';
import { FileUpload } from './file-upload';
import { ToolLimitNotice } from './tool-limit-notice';
import { ToolPageHeader } from './tool-page-header';
import { ResultScreenAd, SmartlinkButton } from '@/components/ads/ad-banner';
import { triggerDownloadWithSmartlink } from '@/lib/ads-config';
import { WorkflowChainBar } from './workflow-chain-bar';
import { useActiveTool } from '@/hooks/use-active-tool';

export function C2paCheckerWorkspace() {
  const { activeTool, uploadedFile, reset } = useActiveTool();
  const [report, setReport] = useState<C2paReport | null>(null);
  const [exportedReportUrl, setExportedReportUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const lastScannedFileRef = useRef<File | null>(null);

  const runInspection = useCallback(async (file: File) => {
    lastScannedFileRef.current = file;
    setIsScanning(true);
    try {
      const inspected = await inspectC2paProvenanceClient(file);
      setReport(inspected);
      toast.success(`Scanned ${file.name} locally`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to inspect media bytes');
    } finally {
      setIsScanning(false);
    }
  }, []);

  useEffect(() => {
    if (uploadedFile && uploadedFile !== lastScannedFileRef.current) {
      void runInspection(uploadedFile);
    }
  }, [uploadedFile, runInspection]);

  const handleLoadSample = async () => {
    const sample = await buildSampleC2paJpegFile();
    await runInspection(sample);
  };

  const handleReset = () => {
    lastScannedFileRef.current = null;
    if (exportedReportUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(exportedReportUrl);
    }
    setExportedReportUrl(null);
    setReport(null);
    reset();
  };

  const handleDownloadReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    setExportedReportUrl(url);
    const outName = `${report.fileName.replace(/\.[^.]+$/, '')}-c2pa-report.json`;
    triggerDownloadWithSmartlink(
      () => {
        const a = document.createElement('a');
        a.href = url;
        a.download = outName;
        a.click();
      },
      { url, fileName: outName },
    );
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl space-y-6">
      <ToolPageHeader
        title={activeTool?.name || 'C2PA & AI Content Credentials Checker'}
        description={
          activeTool?.description ||
          'Inspect JUMBF C2PA Content Credentials manifests, IPTC Digital Source Type AI flags, and SynthID / Adobe Firefly / Midjourney / DALL-E origin metadata 100% locally in your browser.'
        }
        icon={<Fingerprint className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />

      <PrivateModeBadge description="Zero-Upload Provenance Audit: Binary JPEG APP11 JUMBF, PNG caBX, XMP/IPTC, and AI watermark inspection runs directly on local memory bytes." />

      <ToolLimitNotice
        limits={[
          'Supports JPG, PNG, WebP, AVIF, HEIC, and PDF up to 50 MB',
          'Parses JUMBF (jumb/c2pa), IPTC DigitalSourceType & AI generator signatures',
          '100% client-side byte inspection — works completely offline',
        ]}
      />

      {!report ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={handleLoadSample} className="gap-1.5 text-xs">
              <FilePlus2 className="w-3.5 h-3.5" />
              Load Sample C2PA + IPTC Asset
            </Button>
          </div>
          <FileUpload accept="image/*,.pdf,.heic,.heif,.avif" />
          {isScanning && (
            <p className="text-center text-xs text-muted-foreground">Scanning binary JUMBF &amp; XMP segments...</p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Verdict Summary */}
          <div className="bg-card border rounded-[1.75rem] p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {report.hasJumbf || report.hasC2paClaim ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  ) : report.hasIptcAiTag || report.hasGeneratorMarker ? (
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                  )}
                  <h2 className="text-lg font-bold text-foreground">{report.verdict}</h2>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {report.fileName} · {(report.fileSize / 1024).toFixed(1)} KB · {report.container} · SHA-256: {report.sha256.slice(0, 18)}...
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={handleDownloadReport} className="gap-1.5 text-xs">
                  <Download className="w-3.5 h-3.5" />
                  Export JSON Report
                </Button>
                <SmartlinkButton className="min-h-8 px-3 py-1.5 text-xs" />
                <Button size="sm" variant="ghost" onClick={handleReset} className="gap-1.5 text-xs">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Scan Another File
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl border bg-background/70 p-3">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">JUMBF C2PA Box</span>
                <span className={`font-bold mt-1 block ${report.hasJumbf ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                  {report.hasJumbf ? 'Detected' : 'Not Found'}
                </span>
              </div>
              <div className="rounded-xl border bg-background/70 p-3">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">C2PA Assertions</span>
                <span className={`font-bold mt-1 block ${report.hasC2paClaim ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                  {report.hasC2paClaim ? 'Present' : 'Absent'}
                </span>
              </div>
              <div className="rounded-xl border bg-background/70 p-3">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">IPTC AI Source Tag</span>
                <span className={`font-bold mt-1 block ${report.hasIptcAiTag ? 'text-amber-600' : 'text-muted-foreground'}`}>
                  {report.hasIptcAiTag ? 'Tagged' : 'Not Tagged'}
                </span>
              </div>
              <div className="rounded-xl border bg-background/70 p-3">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">SynthID / Firefly / AI</span>
                <span className={`font-bold mt-1 block ${report.hasGeneratorMarker ? 'text-amber-600' : 'text-muted-foreground'}`}>
                  {report.hasGeneratorMarker ? 'Signature Matched' : 'None Matched'}
                </span>
              </div>
            </div>
          </div>

          {/* Findings List */}
          <div className="bg-card border rounded-[1.75rem] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground">Extracted Provenance &amp; Metadata Manifests</h3>
            {report.findings.length > 0 ? (
              <div className="space-y-3">
                {report.findings.map((item, idx) => (
                  <div key={idx} className="rounded-xl border border-border/60 bg-background/70 p-4 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                        <span className="text-sm font-semibold text-foreground">{item.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        item.severity === 'verified'
                          ? 'text-emerald-600'
                          : item.severity === 'ai-flagged'
                            ? 'text-amber-600'
                            : 'text-sky-600'
                      }`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No C2PA JUMBF boxes, IPTC DigitalSourceType tags, or generative AI software markers were detected in this file. Note that social media platforms often strip EXIF/C2PA segments upon re-encoding.
              </p>
            )}

            {report.extractedStrings.length > 0 && (
              <div className="pt-2 border-t border-border/40">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Matched Raw Tokens</p>
                <div className="flex flex-wrap gap-1.5">
                  {report.extractedStrings.map((tok) => (
                    <code key={tok} className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-foreground">
                      {tok}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </div>

          <ResultScreenAd
            suppressChainBar
            originalSize={report.fileSize}
            processedSize={report.fileSize}
            fileName={report.fileName}
            formatLabel={report.container.toUpperCase()}
          />

          <WorkflowChainBar visible={Boolean(report)} />
        </div>
      )}
    </div>
  );
}
