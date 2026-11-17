'use client';

import { useCallback, useRef, useState } from 'react';
import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  ChevronRight,
  FileText,
  FolderKanban,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { triggerDownloadWithSmartlink } from '@/lib/ads-config';
import { useActiveTool } from '@/hooks/use-active-tool';
import { useConsumeChainedFile } from '@/hooks/use-consume-chained-file';
import { PrivateModeBadge } from './private-mode-badge';
import { ResultCard } from './result-card';
import { ToolLimitNotice } from './tool-limit-notice';
import { ToolPageHeader } from './tool-page-header';
import { toast } from 'sonner';

interface ExhibitItem {
  id: string;
  file: File;
  exhibitCode: string;
  title: string;
  pageCount: number;
}

function defaultExhibitLetter(index: number): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (index < letters.length) return `Exhibit ${letters[index]}`;
  return `Exhibit ${index + 1}`;
}

function sanitizeText(str: string): string {
  return str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ');
}

export function UscisPacketWorkspace() {
  const { isProcessing, setIsProcessing, setProgress, reset } = useActiveTool();
  const [exhibits, setExhibits] = useState<ExhibitItem[]>([]);
  const [formCategory, setFormCategory] = useState('Form I-130 / I-485 Adjustment Packet');
  const [applicantName, setApplicantName] = useState('');
  const [includeToc, setIncludeToc] = useState(true);
  const [normalizeLetter, setNormalizeLetter] = useState(true);
  const [stampExhibits, setStampExhibits] = useState(true);
  const [splitLimitMb, setSplitLimitMb] = useState<'none' | '24' | '12'>('24');

  const [result, setResult] = useState<{
    url: string;
    fileName: string;
    isZip: boolean;
    partCount: number;
    totalPages: number;
    originalSize: number;
    processedSize: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addPdfFiles = useCallback(async (fileList: FileList | File[]) => {
    const pdfs = Array.from(fileList).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
    );
    if (pdfs.length === 0) {
      toast.error('Please upload PDF files only.');
      return;
    }

    const prepared: ExhibitItem[] = [];
    for (let i = 0; i < pdfs.length; i += 1) {
      const f = pdfs[i];
      let pageCount = 1;
      try {
        const buf = await f.arrayBuffer();
        const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
        if (doc.isEncrypted) {
          toast.warning(`"${f.name}" is encrypted — unlock it before adding.`);
          continue;
        }
        pageCount = doc.getPageCount();
      } catch {
        toast.warning(`Could not read "${f.name}" cleanly.`);
        continue;
      }

      prepared.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file: f,
        exhibitCode: '',
        title: f.name.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' '),
        pageCount,
      });
    }

    if (prepared.length === 0) return;
    setExhibits((prev) =>
      [...prev, ...prepared].map((item, idx) => ({
        ...item,
        exhibitCode: item.exhibitCode || defaultExhibitLetter(idx),
      })),
    );
    setResult(null);
    toast.success(`Added ${prepared.length} exhibit document(s) locally!`);
  }, []);

  useConsumeChainedFile(
    (f) => addPdfFiles([f]),
    (f) => Boolean(f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')),
  );

  const moveExhibit = (idx: number, dir: -1 | 1) => {
    setExhibits((prev) => {
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next.map((item, i) => ({ ...item, exhibitCode: defaultExhibitLetter(i) }));
    });
  };

  const removeExhibit = (idx: number) => {
    setExhibits((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((item, i) => ({ ...item, exhibitCode: defaultExhibitLetter(i) })),
    );
  };

  const buildPacket = async () => {
    if (exhibits.length === 0) {
      toast.error('Please add at least one evidence PDF.');
      return;
    }

    setIsProcessing(true);
    setProgress(10);

    try {
      const packetPdf = await PDFDocument.create();
      const fontBold = await packetPdf.embedFont(StandardFonts.HelveticaBold);
      const fontReg = await packetPdf.embedFont(StandardFonts.Helvetica);

      // Reserve Table of Contents Cover Page first so page numbers align accurately
      const tocPage = includeToc ? packetPdf.addPage([612, 792]) : null;
      const tocEntries: Array<{ code: string; title: string; startPage: number; pages: number }> = [];
      let runningPage = includeToc ? 2 : 1;

      for (let i = 0; i < exhibits.length; i += 1) {
        const item = exhibits[i];
        const buf = await item.file.arrayBuffer();
        const srcDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
        const pageIndices = srcDoc.getPageIndices();
        const startPage = runningPage;

        if (normalizeLetter) {
          const embeddedPages = await packetPdf.embedPdf(srcDoc, pageIndices);
          for (const emb of embeddedPages) {
            const outPage = packetPdf.addPage([612, 792]);
            const pad = 24;
            const scale = Math.min((612 - pad * 2) / emb.width, (792 - pad * 2) / emb.height);
            outPage.drawPage(emb, {
              x: (612 - emb.width * scale) / 2,
              y: (792 - emb.height * scale) / 2,
              xScale: scale,
              yScale: scale,
            });
          }
        } else {
          const copied = await packetPdf.copyPages(srcDoc, pageIndices);
          copied.forEach((p) => packetPdf.addPage(p));
        }

        tocEntries.push({
          code: item.exhibitCode || defaultExhibitLetter(i),
          title: item.title || item.file.name,
          startPage,
          pages: pageIndices.length,
        });
        runningPage += pageIndices.length;
        setProgress(Math.round(((i + 1) / exhibits.length) * 65));
      }

      const totalPages = packetPdf.getPageCount();

      // Draw Exhibit Header & Bottom Page Number across non-TOC pages
      if (stampExhibits) {
        let cursor = includeToc ? 1 : 0;
        for (const entry of tocEntries) {
          for (let offset = 0; offset < entry.pages; offset += 1) {
            const p = packetPdf.getPage(cursor + offset);
            const { width, height } = p.getSize();
            const label = sanitizeText(`${entry.code}: ${entry.title.slice(0, 42)}`);
            p.drawText(label, {
              x: Math.max(24, width - fontBold.widthOfTextAtSize(label, 8.5) - 24),
              y: height - 18,
              size: 8.5,
              font: fontBold,
              color: rgb(0.15, 0.25, 0.52),
            });
            const footerText = `Page ${cursor + offset + 1} of ${totalPages}`;
            p.drawText(footerText, {
              x: (width - fontReg.widthOfTextAtSize(footerText, 8.5)) / 2,
              y: 12,
              size: 8.5,
              font: fontReg,
              color: rgb(0.35, 0.4, 0.48),
            });
          }
          cursor += entry.pages;
        }
      }

      // Draw Table of Contents cover page
      if (tocPage) {
        const { width, height } = tocPage.getSize();
        tocPage.drawRectangle({
          x: 42,
          y: height - 135,
          width: width - 84,
          height: 85,
          color: rgb(0.95, 0.97, 1),
          borderColor: rgb(0.2, 0.35, 0.72),
          borderWidth: 1,
        });
        tocPage.drawText('USCIS EVIDENCE PACKET - TABLE OF CONTENTS', {
          x: 56,
          y: height - 78,
          size: 14,
          font: fontBold,
          color: rgb(0.1, 0.2, 0.45),
        });
        tocPage.drawText(sanitizeText(formCategory), {
          x: 56,
          y: height - 98,
          size: 10.5,
          font: fontReg,
          color: rgb(0.25, 0.32, 0.42),
        });
        if (applicantName.trim()) {
          tocPage.drawText(sanitizeText(`Petitioner / Applicant: ${applicantName}`), {
            x: 56,
            y: height - 116,
            size: 10,
            font: fontBold,
            color: rgb(0.12, 0.16, 0.22),
          });
        }

        let yPos = height - 170;
        for (const entry of tocEntries) {
          if (yPos < 72) break;
          tocPage.drawText(sanitizeText(entry.code), { x: 46, y: yPos, size: 10, font: fontBold, color: rgb(0.15, 0.25, 0.55) });
          tocPage.drawText(sanitizeText(entry.title.slice(0, 52)), { x: 125, y: yPos, size: 10, font: fontReg, color: rgb(0.12, 0.14, 0.2) });
          const pgLabel = `p. ${entry.startPage} (${entry.pages} pg${entry.pages === 1 ? '' : 's'})`;
          tocPage.drawText(pgLabel, {
            x: width - fontReg.widthOfTextAtSize(pgLabel, 9.5) - 46,
            y: yPos,
            size: 9.5,
            font: fontReg,
            color: rgb(0.35, 0.4, 0.48),
          });
          tocPage.drawLine({ start: { x: 46, y: yPos - 7 }, end: { x: width - 46, y: yPos - 7 }, thickness: 0.4, color: rgb(0.86, 0.88, 0.92) });
          yPos -= 24;
        }
      }

      const fullBytes = await packetPdf.save();
      const inputTotalBytes = exhibits.reduce((s, e) => s + e.file.size, 0);
      setProgress(85);

      const thresholdBytes =
        splitLimitMb === 'none'
          ? Number.POSITIVE_INFINITY
          : Number(splitLimitMb) * 1024 * 1024;

      // If output exceeds USCIS portal threshold (e.g., 24 MB / 12 MB), auto-split into ZIP volumes
      if (fullBytes.byteLength > thresholdBytes && totalPages > 1) {
        const zip = new JSZip();
        let partNum = 1;
        let currentStart = 0;

        while (currentStart < totalPages) {
          let low = 1;
          let high = totalPages - currentStart;
          let bestCount = 1;
          let bestBytes: Uint8Array | null = null;

          // Binary search largest page slice that fits safely below thresholdBytes
          while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const slicePdf = await PDFDocument.create();
            const indices = Array.from({ length: mid }, (_, k) => currentStart + k);
            const copied = await slicePdf.copyPages(packetPdf, indices);
            copied.forEach((p) => slicePdf.addPage(p));
            const candidateBytes = await slicePdf.save();

            if (candidateBytes.byteLength <= thresholdBytes || mid === 1) {
              bestCount = mid;
              bestBytes = candidateBytes;
              low = mid + 1;
            } else {
              high = mid - 1;
            }
          }

          if (bestBytes) {
            zip.file(`USCIS-Packet-Part-${String(partNum).padStart(2, '0')}.pdf`, bestBytes);
            partNum += 1;
          }
          currentStart += bestCount;
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        setProgress(100);
        setResult((prev) => {
          if (prev?.url?.startsWith('blob:')) URL.revokeObjectURL(prev.url);
          return {
            url,
            fileName: `uscis-evidence-packet-${splitLimitMb}mb-parts.zip`,
            isZip: true,
            partCount: partNum - 1,
            totalPages,
            originalSize: inputTotalBytes,
            processedSize: zipBlob.size,
          };
        });
        toast.success(`Packet exceeded ${splitLimitMb}MB — auto-split into ${partNum - 1} compliant PDF parts!`);
        return;
      }

      const copy = new Uint8Array(fullBytes.byteLength);
      copy.set(fullBytes);
      const blob = new Blob([copy.buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setProgress(100);
      setResult((prev) => {
        if (prev?.url?.startsWith('blob:')) URL.revokeObjectURL(prev.url);
        return {
          url,
          fileName: `uscis-evidence-packet-${totalPages}pages.pdf`,
          isZip: false,
          partCount: 1,
          totalPages,
          originalSize: inputTotalBytes,
          processedSize: blob.size,
        };
      });
      toast.success(`USCIS Evidence Packet ready (${totalPages} pages) locally in browser!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to build USCIS evidence packet');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    triggerDownloadWithSmartlink(
      () => {
        const a = document.createElement('a');
        a.href = result.url;
        a.download = result.fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Download started');
      },
      {
        originalSize: result.originalSize,
        processedSize: result.processedSize,
        formatLabel: result.isZip ? 'ZIP' : 'PDF',
        fileName: result.fileName,
      },
    );
  };

  const handleReset = () => {
    if (result?.url?.startsWith('blob:')) URL.revokeObjectURL(result.url);
    reset();
    setExhibits([]);
    setResult(null);
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl">
      <ToolPageHeader
        title="USCIS & Visa Evidence Packet Merger"
        description="Assemble USCIS Form I-130, I-485, I-140, H-1B, and N-400 evidence packets with automatic Table of Contents, Exhibit A/B/C stamping, US Letter normalization, and <24MB portal splitting."
        icon={FolderKanban}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'USCIS Lockbox US Letter (8.5×11 in) normalization + Auto Table of Contents cover page',
          'Auto-stamps Exhibit codes & Page X of Y footer across every supporting document',
          'Optional <24 MB or <12 MB automatic splitter for USCIS online ELIS filing portals',
        ]}
      />
      <PrivateModeBadge
        className="mt-4"
        description="Passports, birth/marriage certificates, I-94s, and tax transcripts are assembled 100% inside browser memory — zero server uploads."
      />

      <div className="mt-6 grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.length) void addPdfFiles(e.dataTransfer.files);
            }}
            className="drop-zone relative rounded-2xl p-8 text-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) void addPdfFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6" />
            </div>
            <p className="font-bold text-sm">Add Exhibit PDFs to Packet</p>
            <p className="text-xs text-muted-foreground mt-1">Drop multiple PDF files or click to select forms, IDs, transcripts &amp; leases</p>
          </div>

          {exhibits.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
                <span>Ordered Evidence Exhibits ({exhibits.length} files · {exhibits.reduce((s, e) => s + e.pageCount, 0)} pages)</span>
                <button type="button" onClick={handleReset} className="text-destructive hover:underline">Clear all</button>
              </div>
              {exhibits.map((item, idx) => (
                <div key={item.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 rounded-xl border bg-card p-3">
                  <Badge className="shrink-0 font-mono text-[11px]">{item.exhibitCode}</Badge>
                  <Input
                    value={item.title}
                    onChange={(e) =>
                      setExhibits((prev) => prev.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)))
                    }
                    className="h-8 text-xs flex-1 min-w-[160px]"
                    aria-label="Exhibit title"
                  />
                  <span className="text-[11px] font-mono text-muted-foreground shrink-0">{item.pageCount}p</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" disabled={idx === 0} onClick={() => moveExhibit(idx, -1)}>
                      <ChevronRight className="w-3.5 h-3.5 -rotate-90" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" disabled={idx === exhibits.length - 1} onClick={() => moveExhibit(idx, 1)}>
                      <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => removeExhibit(idx)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {result && (
            <ResultCard
              title="USCIS Evidence Packet Ready"
              description={
                result.isZip
                  ? `Split automatically into ${result.partCount} portal-compliant PDF parts inside a ZIP archive.`
                  : 'Complete packet assembled with Table of Contents and Exhibit stamping.'
              }
              primaryMeta={`${result.totalPages} total pages · ${result.fileName}`}
              onDownload={handleDownload}
              downloadLabel={result.isZip ? 'Download Split Packet (.ZIP)' : 'Download USCIS Packet (.PDF)'}
              originalSize={result.originalSize}
              processedSize={result.processedSize}
              formatLabel={result.isZip ? 'ZIP' : 'PDF'}
              resultUrl={result.url}
              resultFileName={result.fileName}
            />
          )}
        </div>

        <div className="lg:col-span-5 space-y-5">
          <div className="bg-card border rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Packet Formatting Options
            </h3>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Filing Category / Cover Header</Label>
              <Input value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="h-9 text-xs" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Petitioner / Beneficiary Name (Optional)</Label>
              <Input value={applicantName} onChange={(e) => setApplicantName(e.target.value)} placeholder="Alex Morgan" className="h-9 text-xs" />
            </div>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between rounded-xl border p-3 text-xs">
                <span className="font-medium">Generate Table of Contents Cover Page</span>
                <Switch checked={includeToc} onCheckedChange={setIncludeToc} />
              </div>
              <div className="flex items-center justify-between rounded-xl border p-3 text-xs">
                <span className="font-medium">Stamp Exhibit Labels &amp; Page Numbers</span>
                <Switch checked={stampExhibits} onCheckedChange={setStampExhibits} />
              </div>
              <div className="flex items-center justify-between rounded-xl border p-3 text-xs">
                <span className="font-medium">Normalize All Pages to US Letter (8.5×11&quot;)</span>
                <Switch checked={normalizeLetter} onCheckedChange={setNormalizeLetter} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Online Portal Max File Size Auto-Split</Label>
              <Select value={splitLimitMb} onValueChange={(v) => setSplitLimitMb(v as 'none' | '24' | '12')}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">Auto-Split Under 24 MB (USCIS ELIS Online)</SelectItem>
                  <SelectItem value="12">Auto-Split Under 12 MB (Strict Upload Forms)</SelectItem>
                  <SelectItem value="none">No Size Split (Single Combined PDF)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={buildPacket} disabled={exhibits.length === 0 || isProcessing} className="flex-1 h-11 font-bold text-xs">
                {isProcessing ? 'Assembling Evidence Packet...' : 'Build USCIS Evidence Packet'}
              </Button>
              <Button variant="outline" onClick={handleReset} className="h-11 px-3">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
