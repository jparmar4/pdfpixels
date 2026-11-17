'use client';

import { useCallback, useEffect, useState } from 'react';
import { PDFDocument, PDFName, PDFString } from 'pdf-lib';
import {
  Accessibility,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileJson,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ResultScreenAd, SmartlinkButton } from '@/components/ads/ad-banner';
import { triggerDownloadWithSmartlink } from '@/lib/ads-config';
import { useAppStore } from '@/store/app-store';
import { useConsumeChainedFile } from '@/hooks/use-consume-chained-file';
import { FileUpload } from './file-upload';
import { PrivateModeBadge } from './private-mode-badge';
import { ToolLimitNotice } from './tool-limit-notice';
import { ToolPageHeader } from './tool-page-header';
import { toast } from 'sonner';

interface AccessibilityCheckItem {
  id: string;
  standard: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
  autoFixable: boolean;
}

interface AuditReport {
  fileName: string;
  pageCount: number;
  score: number;
  checks: AccessibilityCheckItem[];
  detectedTitle: string;
  detectedAuthor: string;
  detectedLang: string;
}

const LANG_OPTIONS = [
  { code: 'en-US', label: 'English (US · en-US)' },
  { code: 'en-GB', label: 'English (UK · en-GB)' },
  { code: 'de-DE', label: 'German (de-DE)' },
  { code: 'fr-FR', label: 'French (fr-FR)' },
  { code: 'es-ES', label: 'Spanish (es-ES)' },
  { code: 'ja-JP', label: 'Japanese (ja-JP)' },
];

export function PdfAccessibilityWorkspace() {
  const { uploadedFile, setUploadedFile, isProcessing, setIsProcessing, setProgress, reset } = useAppStore();
  const [audit, setAudit] = useState<AuditReport | null>(null);

  // Auto-Fixer controls
  const [fixTitle, setFixTitle] = useState('');
  const [fixAuthor, setFixAuthor] = useState('');
  const [fixLang, setFixLang] = useState('en-US');
  const [fixDisplayDocTitle, setFixDisplayDocTitle] = useState(true);
  const [fixMarkInfo, setFixMarkInfo] = useState(true);
  const [fixTabOrder, setFixTabOrder] = useState(true);

  const [fixedUrl, setFixedUrl] = useState<string | null>(null);
  const [fixedSize, setFixedSize] = useState(0);
  const [fixedFileName, setFixedFileName] = useState('');

  useConsumeChainedFile(
    (f) => setUploadedFile(f),
    (f) => Boolean(f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')),
  );

  const runAccessibilityAudit = useCallback(async (file: File) => {
    setIsProcessing(true);
    setProgress(15);

    try {
      const buf = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buf, { ignoreEncryption: true });
      const pageCount = pdf.getPageCount();
      const catalog = pdf.catalog;

      const title = pdf.getTitle()?.trim() || '';
      const author = pdf.getAuthor()?.trim() || '';
      const langObj = catalog.lookupMaybe(PDFName.of('Lang'), PDFString);
      const langVal = langObj ? langObj.decodeText() : '';
      const viewerPrefs = catalog.get(PDFName.of('ViewerPreferences'));
      const displayTitleSet = Boolean(
        viewerPrefs && String(viewerPrefs).includes('DisplayDocTitle'),
      );
      const hasMarkInfo = catalog.has(PDFName.of('MarkInfo'));
      const hasStructTree = catalog.has(PDFName.of('StructTreeRoot'));
      const hasOutlines = catalog.has(PDFName.of('Outlines'));

      // Check Tab Order on Page 1
      let hasTabStructure = false;
      if (pageCount > 0) {
        const tabsVal = pdf.getPage(0).node.get(PDFName.of('Tabs'));
        hasTabStructure = Boolean(tabsVal && String(tabsVal).includes('/S'));
      }

      // Check real selectable text via pdfjs-dist across up to first 3 pages
      let extractedChars = 0;
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const jsDoc = await pdfjs.getDocument({
          data: new Uint8Array(buf),
          cMapUrl: '/pdfjs/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: '/pdfjs/standard_fonts/',
        }).promise;
        for (let p = 1; p <= Math.min(3, jsDoc.numPages); p += 1) {
          const pg = await jsDoc.getPage(p);
          const tc = await pg.getTextContent();
          extractedChars += tc.items
            .map((it) => ('str' in it ? it.str : ''))
            .join('').length;
        }
        void jsDoc.destroy();
      } catch {
        // Ignore if pdfjs text probe fails
      }

      const checks: AccessibilityCheckItem[] = [
        {
          id: 'doc-title',
          standard: 'WCAG 2.4.2 / PDF/UA 7.1',
          label: 'Document Title Metadata Present',
          status: title ? 'pass' : 'fail',
          detail: title ? `Title: "${title}"` : 'Missing /Title property in Document Info dictionary.',
          autoFixable: true,
        },
        {
          id: 'display-doc-title',
          standard: 'Matterhorn 06-002',
          label: 'ViewerPreferences DisplayDocTitle Enabled',
          status: displayTitleSet ? 'pass' : 'fail',
          detail: displayTitleSet
            ? 'Screen readers announce Document Title instead of raw filename.'
            : 'ViewerPreferences DisplayDocTitle flag is missing or false.',
          autoFixable: true,
        },
        {
          id: 'doc-lang',
          standard: 'WCAG 3.1.1 / ADA 508',
          label: 'Primary Document Language Tag (/Lang)',
          status: langVal ? 'pass' : 'fail',
          detail: langVal
            ? `Language tag declared as "${langVal}".`
            : 'No /Lang locale declared on Catalog — assistive tech guesses pronunciation.',
          autoFixable: true,
        },
        {
          id: 'tab-order',
          standard: 'WCAG 2.4.3',
          label: 'Logical Tab Order Follows Document Structure (/Tabs /S)',
          status: hasTabStructure ? 'pass' : 'warn',
          detail: hasTabStructure
            ? 'Pages declare /Tabs /S structure traversal.'
            : 'Missing /Tabs /S on pages; keyboard tab focus may jump out of reading order.',
          autoFixable: true,
        },
        {
          id: 'mark-info',
          standard: 'PDF/UA Matterhorn 01-005',
          label: 'Tagged PDF / MarkInfo Flag',
          status: hasMarkInfo && hasStructTree ? 'pass' : hasMarkInfo ? 'warn' : 'fail',
          detail:
            hasMarkInfo && hasStructTree
              ? 'Tagged PDF /MarkInfo and /StructTreeRoot are present.'
              : 'Document lacks full semantic /StructTreeRoot tags (use Author source export or Acrobat Auto-Tag for complex tables).',
          autoFixable: true,
        },
        {
          id: 'selectable-text',
          standard: 'ADA Section 508 1194.22',
          label: 'Selectable Text Layer (Not Image-Only Scan)',
          status: extractedChars > 15 ? 'pass' : 'fail',
          detail:
            extractedChars > 15
              ? `Verified ${extractedChars} characters in sampled pages.`
              : 'Almost zero selectable text found — run OCR PDF to add accessible text before tagging.',
          autoFixable: false,
        },
        {
          id: 'bookmarks',
          standard: 'PDF/UA Navigation',
          label: 'Document Outlines / Bookmarks',
          status: hasOutlines || pageCount <= 3 ? 'pass' : 'warn',
          detail:
            pageCount <= 3
              ? 'Short document (<=3 pages) does not strictly require bookmarks.'
              : hasOutlines
                ? 'Outline bookmark tree detected.'
                : 'Multi-page PDF (>3 pages) lacks an /Outlines bookmark navigation tree.',
          autoFixable: false,
        },
      ];

      const passedWeight = checks.reduce(
        (sum, c) => sum + (c.status === 'pass' ? 1 : c.status === 'warn' ? 0.5 : 0),
        0,
      );
      const score = Math.round((passedWeight / checks.length) * 100);

      setAudit({
        fileName: file.name,
        pageCount,
        score,
        checks,
        detectedTitle: title || file.name.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' '),
        detectedAuthor: author,
        detectedLang: langVal || 'en-US',
      });
      setFixTitle(title || file.name.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' '));
      setFixAuthor(author);
      setFixLang(langVal || 'en-US');
      setProgress(100);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to analyze PDF accessibility');
    } finally {
      setIsProcessing(false);
    }
  }, [setIsProcessing, setProgress]);

  useEffect(() => {
    if (!uploadedFile) {
      const t = window.setTimeout(() => {
        setAudit(null);
        setFixedUrl(null);
      }, 0);
      return () => window.clearTimeout(t);
    }
    void runAccessibilityAudit(uploadedFile);
  }, [uploadedFile, runAccessibilityAudit]);

  const handleApplyAutoFixes = async () => {
    if (!uploadedFile) return;
    setIsProcessing(true);
    try {
      const buf = await uploadedFile.arrayBuffer();
      const pdf = await PDFDocument.load(buf, { ignoreEncryption: true });

      if (fixTitle.trim()) pdf.setTitle(fixTitle.trim(), { showInWindowTitleBar: fixDisplayDocTitle });
      if (fixAuthor.trim()) pdf.setAuthor(fixAuthor.trim());
      if (fixLang) pdf.setLanguage(fixLang);

      if (fixDisplayDocTitle) {
        const vpDict = pdf.context.obj({ DisplayDocTitle: true });
        pdf.catalog.set(PDFName.of('ViewerPreferences'), vpDict);
      }

      if (fixMarkInfo) {
        pdf.catalog.set(PDFName.of('MarkInfo'), pdf.context.obj({ Marked: true }));
      }

      if (fixTabOrder) {
        for (const page of pdf.getPages()) {
          page.node.set(PDFName.of('Tabs'), PDFName.of('S'));
        }
      }

      const saved = await pdf.save();
      const copy = new Uint8Array(saved.byteLength);
      copy.set(saved);
      const blob = new Blob([copy.buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const outName = `${uploadedFile.name.replace(/\.pdf$/i, '')}-ada-fixed.pdf`;

      setFixedUrl((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return url;
      });
      setFixedSize(blob.size);
      setFixedFileName(outName);
      toast.success('ADA / WCAG metadata & PDF structure flags remediated locally!');

      // Refresh audit preview against newly generated File
      const fixedFile = new File([blob], outName, { type: 'application/pdf' });
      await runAccessibilityAudit(fixedFile);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Auto-fix failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadReportJson = () => {
    if (!audit) return;
    const blob = new Blob([JSON.stringify(audit, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${audit.fileName.replace(/\.pdf$/i, '')}-wcag-audit.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Downloaded JSON accessibility report');
  };

  const handleDownloadFixedPdf = () => {
    if (!fixedUrl) return;
    triggerDownloadWithSmartlink(
      () => {
        const a = document.createElement('a');
        a.href = fixedUrl;
        a.download = fixedFileName || 'ada-compliant.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Downloaded remediated PDF');
      },
      {
        originalSize: uploadedFile?.size,
        processedSize: fixedSize,
        formatLabel: 'PDF/UA',
        fileName: fixedFileName,
      },
    );
  };

  const handleReset = () => {
    if (fixedUrl?.startsWith('blob:')) URL.revokeObjectURL(fixedUrl);
    reset();
    setAudit(null);
    setFixedUrl(null);
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl">
      <ToolPageHeader
        title="PDF Accessibility Checker & Auto-Fixer (PDF/UA & ADA 508)"
        description="Audit PDFs against WCAG 2.1, ADA Section 508, and PDF/UA rules (Document Title, DisplayDocTitle, /Lang, MarkInfo, /Tabs /S, and text layer), and auto-fix missing compliance flags 100% locally."
        icon={Accessibility}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'Inspects PDF/UA, ADA Section 508 & WCAG 2.1 document catalog tags & reading text layer',
          '1-Click Auto-Fixer repairs Title, Language Tag, DisplayDocTitle, MarkInfo & Page Tab Order',
          'Downloads remediated PDF + machine-readable JSON compliance audit report',
        ]}
      />
      <PrivateModeBadge
        className="mt-4"
        description="Legal, government, healthcare, and university PDFs are audited and remediated 100% inside browser memory."
      />

      {!uploadedFile ? (
        <div className="mt-8">
          <FileUpload accept=".pdf,application/pdf" />
        </div>
      ) : (
        <div className="mt-8 grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            {audit && (
              <div className="bg-card border rounded-2xl p-6 space-y-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                  <div>
                    <h2 className="text-base font-bold">{audit.fileName}</h2>
                    <p className="text-xs text-muted-foreground">{audit.pageCount} page(s) audited locally</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`text-sm font-mono px-3 py-1 ${
                        audit.score >= 85
                          ? 'bg-emerald-500/15 text-emerald-700'
                          : audit.score >= 55
                            ? 'bg-amber-500/15 text-amber-700'
                            : 'bg-rose-500/15 text-rose-700'
                      }`}
                    >
                      Compliance Score: {audit.score}%
                    </Badge>
                    <Button size="sm" variant="outline" onClick={handleDownloadReportJson} className="text-xs gap-1.5">
                      <FileJson className="w-3.5 h-3.5" /> Report
                    </Button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {audit.checks.map((c) => (
                    <div key={c.id} className="flex items-start gap-3 rounded-xl border p-3.5 bg-background/60">
                      {c.status === 'pass' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : c.status === 'warn' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-xs text-foreground">{c.label}</span>
                          <Badge variant="outline" className="text-[10px] font-mono">{c.standard}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{c.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {fixedUrl && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-5 space-y-3">
                <Button onClick={handleDownloadFixedPdf} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                  <Download className="w-4 h-4" />
                  Download ADA / WCAG Fixed PDF
                </Button>
                <SmartlinkButton className="w-full justify-center" />
                <ResultScreenAd
                  refreshKey={fixedUrl}
                  originalSize={uploadedFile.size}
                  processedSize={fixedSize}
                  formatLabel="PDF/UA"
                  fileName={fixedFileName}
                />
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div className="bg-card border rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                1-Click Accessibility Auto-Fixer
              </h3>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Document Title (Required for WCAG 2.4.2)</Label>
                <Input value={fixTitle} onChange={(e) => setFixTitle(e.target.value)} className="h-9 text-xs" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Primary Language (/Lang)</Label>
                <Select value={fixLang} onValueChange={setFixLang}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANG_OPTIONS.map((l) => (
                      <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Organization / Author</Label>
                <Input value={fixAuthor} onChange={(e) => setFixAuthor(e.target.value)} placeholder="Optional organization name" className="h-9 text-xs" />
              </div>

              <div className="space-y-2.5 pt-1 text-xs">
                <div className="flex items-center justify-between rounded-xl border p-3">
                  <span>Enable ViewerPreferences DisplayDocTitle</span>
                  <Switch checked={fixDisplayDocTitle} onCheckedChange={setFixDisplayDocTitle} />
                </div>
                <div className="flex items-center justify-between rounded-xl border p-3">
                  <span>Inject /MarkInfo Marked Tag Flag</span>
                  <Switch checked={fixMarkInfo} onCheckedChange={setFixMarkInfo} />
                </div>
                <div className="flex items-center justify-between rounded-xl border p-3">
                  <span>Set Page Tab Order (/Tabs /S)</span>
                  <Switch checked={fixTabOrder} onCheckedChange={setFixTabOrder} />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleApplyAutoFixes} disabled={isProcessing} className="flex-1 h-11 font-bold text-xs gap-2">
                  <Sparkles className="w-4 h-4" />
                  {isProcessing ? 'Remediating PDF...' : 'Auto-Fix & Generate Compliant PDF'}
                </Button>
                <Button variant="outline" onClick={handleReset} className="h-11 px-3">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
