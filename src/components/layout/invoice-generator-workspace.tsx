'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileText, Plus, Trash2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useActiveTool } from '@/hooks/use-active-tool';
import { ToolPageHeader } from './tool-page-header';
import { ToolLimitNotice } from './tool-limit-notice';
import { ResultScreenAd, SmartlinkButton } from '@/components/ads/ad-banner';
import { triggerDownloadWithSmartlink } from '@/lib/ads-config';
import { toast } from 'sonner';

// ── Invoice data model ───────────────────────────────────────────────────────

interface InvoiceItem {
  description: string;
  quantity: string;
  unitPrice: string;
}

const CURRENCIES: Record<string, { symbol: string; decimals: number }> = {
  USD: { symbol: '$', decimals: 2 },
  EUR: { symbol: '\u20AC', decimals: 2 },
  GBP: { symbol: '\u00A3', decimals: 2 },
  CAD: { symbol: 'CA$', decimals: 2 },
  AUD: { symbol: 'A$', decimals: 2 },
  INR: { symbol: 'Rs. ', decimals: 2 },
  JPY: { symbol: '\u00A5', decimals: 0 },
};

function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function parseAmount(value: string): number {
  const n = parseFloat(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(amount: number, currencyCode: string): string {
  const { symbol, decimals } = CURRENCIES[currencyCode] ?? CURRENCIES.USD;
  const fixed = Math.abs(amount).toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = amount < 0 ? '-' : '';
  const body = decPart ? `${withCommas}.${decPart}` : withCommas;
  return `${sign}${symbol}${body}`;
}

function formatDateShort(iso: string): string {
  if (!iso) return '\u2014';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Component ────────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden shadow-premium">
      <div className="p-4 border-b border-border/40 bg-gradient-to-r from-primary/10 to-transparent">
        <h3 className="font-bold tracking-tight text-foreground text-sm">{title}</h3>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

export function InvoiceGeneratorWorkspace() {
  const { activeTool, isProcessing, setIsProcessing, setProgress, reset } = useActiveTool();

  const [businessName, setBusinessName] = useState('');
  const [businessDetails, setBusinessDetails] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientDetails, setClientDetails] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('INV-001');
  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(todayISO(14));
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [pageSize, setPageSize] = useState<'letter' | 'a4'>('letter');
  const [taxRate, setTaxRate] = useState('');
  const [discount, setDiscount] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: '1', unitPrice: '' },
  ]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const generateTimer = useRef<number | null>(null);

  // ── Derived totals ──
  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + parseAmount(item.quantity) * parseAmount(item.unitPrice),
      0,
    );
    const taxPercent = parseAmount(taxRate);
    const taxAmount = (subtotal * taxPercent) / 100;
    const discountAmount = parseAmount(discount);
    const total = subtotal + taxAmount - discountAmount;
    return { subtotal, taxPercent, taxAmount, discountAmount, total };
  }, [items, taxRate, discount]);

  const filledItemCount = items.filter(
    (i) => i.description.trim() || parseAmount(i.unitPrice) !== 0,
  ).length;

  const revokeBlob = useCallback(() => {
    if (blobUrlRef.current?.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  useEffect(() => revokeBlob, [revokeBlob]);

  // ── PDF rendering (100% client-side, pdf-lib) ──
  const renderInvoicePdf = useCallback(async (): Promise<Blob> => {
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const size = pageSize === 'a4' ? [595.28, 841.89] : [612, 792];
    const page = doc.addPage(size as [number, number]);
    const W = size[0];
    const M = 48; // margin
    const accent = rgb(0.31, 0.27, 0.9); // indigo
    const ink = rgb(0.1, 0.1, 0.14);
    const muted = rgb(0.42, 0.45, 0.5);
    const line = rgb(0.87, 0.88, 0.92);

    const wrap = (text: string, maxWidth: number, f = font, fs = 9.5): string[] => {
      const words = text.split(/\s+/).filter(Boolean);
      const lines: string[] = [];
      let current = '';
      for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (f.widthOfTextAtSize(candidate, fs) > maxWidth && current) {
          lines.push(current);
          current = word;
        } else {
          current = candidate;
        }
      }
      if (current) lines.push(current);
      return lines.length ? lines : [''];
    };

    let y = size[1] - M;

    // Header band
    page.drawRectangle({ x: 0, y: size[1] - 86, width: W, height: 86, color: accent });
    page.drawText('INVOICE', { x: M, y: size[1] - 56, size: 26, font: bold, color: rgb(1, 1, 1) });
    const invLabel = `#${invoiceNumber || 'INV-001'}`;
    page.drawText(invLabel, {
      x: W - M - bold.widthOfTextAtSize(invLabel, 13),
      y: size[1] - 56,
      size: 13,
      font: bold,
      color: rgb(1, 1, 1),
    });
    y = size[1] - 112;

    // From / Bill To blocks
    const colW = (W - M * 2 - 24) / 2;
    const drawBlock = (x: number, label: string, name: string, details: string) => {
      let by = y;
      page.drawText(label.toUpperCase(), { x, y: by, size: 8, font: bold, color: muted });
      by -= 15;
      const nameLines = wrap(name || '\u2014', colW, bold, 11.5);
      for (const l of nameLines) {
        page.drawText(l, { x, y: by, size: 11.5, font: bold, color: ink });
        by -= 14;
      }
      for (const raw of details.split('\n')) {
        for (const l of wrap(raw, colW)) {
          page.drawText(l, { x, y: by, size: 9.5, font, color: muted });
          by -= 13;
        }
      }
      return by;
    };
    const leftBottom = drawBlock(M, 'From', businessName, businessDetails);
    const rightBottom = drawBlock(M + colW + 24, 'Bill To', clientName, clientDetails);
    y = Math.min(leftBottom, rightBottom) - 10;

    // Dates row
    page.drawText(`Issue date: ${formatDateShort(issueDate)}`, { x: M, y, size: 9.5, font, color: ink });
    page.drawText(`Due date: ${formatDateShort(dueDate)}`, {
      x: M + colW + 24,
      y,
      size: 9.5,
      font,
      color: ink,
    });
    y -= 24;

    // Items table
    const qtyW = 40;
    const priceW = 85;
    const amountW = 85;
    const descW = W - M * 2 - qtyW - priceW - amountW;
    const colX = {
      desc: M,
      qty: M + descW,
      price: M + descW + qtyW,
      amount: M + descW + qtyW + priceW,
    };

    page.drawRectangle({ x: M, y: y - 6, width: W - M * 2, height: 22, color: rgb(0.955, 0.96, 0.985) });
    page.drawText('DESCRIPTION', { x: colX.desc + 8, y, size: 8, font: bold, color: muted });
    page.drawText('QTY', { x: colX.qty + qtyW / 2 - bold.widthOfTextAtSize('QTY', 8) / 2, y, size: 8, font: bold, color: muted });
    page.drawText('UNIT PRICE', { x: colX.price + priceW - bold.widthOfTextAtSize('UNIT PRICE', 8) - 4, y, size: 8, font: bold, color: muted });
    page.drawText('AMOUNT', { x: colX.amount + amountW - bold.widthOfTextAtSize('AMOUNT', 8) - 4, y, size: 8, font: bold, color: muted });
    y -= 28;

    const tableBottom = size[1] - 300;
    const visibleItems = items.filter((i) => i.description.trim() || parseAmount(i.unitPrice) !== 0);
    for (const item of visibleItems.length ? visibleItems : items.slice(0, 1)) {
      const descLines = wrap(item.description || '\u2014', descW - 16);
      const rowH = Math.max(descLines.length * 13 + 10, 24);

      if (y - rowH < tableBottom - 160) {
        // grow page content area: extend table by continuing below totals is not
        // needed for typical invoices; stop rendering beyond safe area
        page.drawText('See attached line-item continuation…', {
          x: M, y: y - 14, size: 9, font, color: muted,
        });
        break;
      }

      let ry = y;
      for (let i = 0; i < descLines.length; i++) {
        page.drawText(descLines[i], { x: colX.desc + 8, y: ry, size: 9.5, font, color: ink });
        if (i === 0) {
          const qty = parseAmount(item.quantity);
          page.drawText(String(Number.isInteger(qty) ? qty : qty.toFixed(2)), {
            x: colX.qty + qtyW / 2 - font.widthOfTextAtSize(String(qty), 9.5) / 2,
            y: ry, size: 9.5, font, color: ink,
          });
          const up = formatMoney(parseAmount(item.unitPrice), currencyCode);
          page.drawText(up, { x: colX.price + priceW - font.widthOfTextAtSize(up, 9.5) - 4, y: ry, size: 9.5, font, color: ink });
          const amt = formatMoney(qty * parseAmount(item.unitPrice), currencyCode);
          page.drawText(amt, { x: colX.amount + amountW - font.widthOfTextAtSize(amt, 9.5) - 4, y: ry, size: 9.5, font, color: ink });
        }
        ry -= 13;
      }
      y -= rowH;
      page.drawLine({
        start: { x: M, y: y + 6 },
        end: { x: W - M, y: y + 6 },
        thickness: 0.6,
        color: line,
      });
    }

    y -= 16;

    // Totals
    const totalX = W - M - 230;
    const drawTotalRow = (label: string, value: string, isBold = false, isAccent = false) => {
      const f = isBold ? bold : font;
      page.drawText(label, { x: totalX, y, size: isBold ? 12 : 10, font: f, color: isAccent ? accent : ink });
      const v = value;
      page.drawText(v, {
        x: W - M - f.widthOfTextAtSize(v, isBold ? 12 : 10),
        y,
        size: isBold ? 12 : 10,
        font: f,
        color: isAccent ? accent : ink,
      });
      y -= isBold ? 24 : 17;
    };

    drawTotalRow('Subtotal', formatMoney(totals.subtotal, currencyCode));
    if (totals.taxPercent > 0) {
      drawTotalRow(`Tax (${totals.taxPercent}%)`, formatMoney(totals.taxAmount, currencyCode));
    }
    if (totals.discountAmount > 0) {
      drawTotalRow('Discount', `-${formatMoney(totals.discountAmount, currencyCode)}`);
    }
    page.drawLine({
      start: { x: totalX, y: y + 6 },
      end: { x: W - M, y: y + 6 },
      thickness: 0.8,
      color: line,
    });
    y -= 10;
    drawTotalRow('TOTAL DUE', formatMoney(totals.total, currencyCode), true, true);

    // Notes
    if (notes.trim()) {
      y -= 12;
      page.drawText('NOTES / PAYMENT TERMS', { x: M, y, size: 8, font: bold, color: muted });
      y -= 14;
      for (const raw of notes.split('\n')) {
        for (const l of wrap(raw, W - M * 2)) {
          page.drawText(l, { x: M, y, size: 9.5, font, color: ink });
          y -= 13;
        }
      }
    }

    // Footer
    page.drawText('Thank you for your business.', {
      x: M,
      y: M - 16,
      size: 8.5,
      font,
      color: muted,
    });

    const bytes = await doc.save();
    // Copy into a fresh Uint8Array (same pattern as the W-9 workspace) so the
    // Blob holds a plain ArrayBuffer regardless of pdf-lib's internal view.
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    return new Blob([copy.buffer], { type: 'application/pdf' });
  }, [
    businessName, businessDetails, clientName, clientDetails, invoiceNumber,
    issueDate, dueDate, currencyCode, pageSize, notes, items,
    totals.subtotal, totals.taxPercent, totals.taxAmount, totals.discountAmount, totals.total,
  ]);

  // Debounced live preview
  useEffect(() => {
    if (generateTimer.current) window.clearTimeout(generateTimer.current);
    generateTimer.current = window.setTimeout(async () => {
      try {
        const blob = await renderInvoicePdf();
        revokeBlob();
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setResultUrl(url);
      } catch {
        // Preview failures are non-fatal; the Generate button reports errors
      }
    }, 700);
    return () => {
      if (generateTimer.current) window.clearTimeout(generateTimer.current);
    };
  }, [renderInvoicePdf, revokeBlob]);

  const hasContent = Boolean(
    businessName.trim() || clientName.trim() || filledItemCount > 0,
  );

  const handleGenerate = useCallback(async () => {
    if (!hasContent) {
      toast.error('Add your business or client name and at least one line item');
      return;
    }
    setIsProcessing(true);
    setProgress(40);
    try {
      const blob = await renderInvoicePdf();
      revokeBlob();
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setResultUrl(url);
      setProgress(100);
      toast.success('Invoice PDF ready — download it below');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invoice generation failed');
    } finally {
      setIsProcessing(false);
    }
  }, [hasContent, renderInvoicePdf, revokeBlob, setIsProcessing, setProgress]);

  const handleReset = useCallback(() => {
    reset();
    setBusinessName('');
    setBusinessDetails('');
    setClientName('');
    setClientDetails('');
    setInvoiceNumber('INV-001');
    setIssueDate(todayISO());
    setDueDate(todayISO(14));
    setCurrencyCode('USD');
    setPageSize('letter');
    setTaxRate('');
    setDiscount('');
    setNotes('');
    setItems([{ description: '', quantity: '1', unitPrice: '' }]);
    revokeBlob();
    setResultUrl(null);
  }, [reset, revokeBlob]);

  const loadSample = useCallback(() => {
    setBusinessName('Pixel Studio LLC');
    setBusinessDetails('123 Design Avenue, Suite 400\nAustin, TX 78701\nbilling@pixelstudio.example · (512) 555-0147');
    setClientName('Northwind Trading Co.');
    setClientDetails('88 Commerce Street\nSeattle, WA 98104\naccounts@northwind.example');
    setInvoiceNumber(`INV-${new Date().getFullYear()}-014`);
    setIssueDate(todayISO());
    setDueDate(todayISO(14));
    setCurrencyCode('USD');
    setTaxRate('8.25');
    setDiscount('');
    setNotes('Payment due within 14 days. Late payments accrue 1.5% monthly interest.\nBank transfer details available on request.');
    setItems([
      { description: 'Brand identity design — logo, palette, typography', quantity: '1', unitPrice: '2400' },
      { description: 'Website landing page design & build', quantity: '2', unitPrice: '850' },
      { description: 'Monthly design support retainer', quantity: '3', unitPrice: '450' },
    ]);
  }, []);

  const download = () => {
    if (!resultUrl) return;
    const safeClient = (clientName || 'client').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    triggerDownloadWithSmartlink(() => {
      const link = document.createElement('a');
      link.href = resultUrl;
      link.download = `${invoiceNumber || 'invoice'}-${safeClient}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Download started');
    });
  };

  if (!activeTool) return null;

  const updateItem = (index: number, patch: Partial<InvoiceItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };
  const addItem = () => setItems((prev) => [...prev, { description: '', quantity: '1', unitPrice: '' }]);
  const removeItem = (index: number) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  const inputClass = 'bg-background';

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl">
      <ToolPageHeader
        title={activeTool.name}
        description={activeTool.description}
        icon={<FileText className="h-7 w-7 text-white" />}
        onReset={handleReset}
      />
      <ToolLimitNotice
        limits={[
          'Renders 100% in your browser — billing data never uploads',
          'No watermark, no account, unlimited invoices',
          'US Letter & A4 · 7 currencies · automatic totals, tax & discounts',
        ]}
      />

      <div className="mt-8 grid lg:grid-cols-2 gap-8">
        {/* ── Form column ── */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Invoice details</h2>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={loadSample}>
              <Wand2 className="w-3.5 h-3.5" /> Load sample
            </Button>
          </div>

          <SectionCard title="From (your business)">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="inv-biz-name">Business name</Label>
                <Input id="inv-biz-name" className={inputClass} value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Acme Studio LLC" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-biz-contact">Address · email · phone</Label>
                <Input id="inv-biz-contact" className={inputClass} value={businessDetails} onChange={(e) => setBusinessDetails(e.target.value)} placeholder="123 Main St, City — billing@acme.com" />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Bill to (client)">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="inv-client-name">Client name</Label>
                <Input id="inv-client-name" className={inputClass} value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Northwind Trading Co." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-client-contact">Address · email</Label>
                <Input id="inv-client-contact" className={inputClass} value={clientDetails} onChange={(e) => setClientDetails(e.target.value)} placeholder="88 Commerce St — accounts@client.com" />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Invoice & items">
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="inv-number">Invoice #</Label>
                <Input id="inv-number" className={inputClass} value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-issue-date">Issue date</Label>
                <Input id="inv-issue-date" type="date" className={inputClass} value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-due-date">Due date</Label>
                <Input id="inv-due-date" type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-[1fr_64px_96px_32px] sm:grid-cols-[1fr_72px_110px_36px] gap-2 items-start">
                  <div className="space-y-1">
                    {index === 0 && <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Description</Label>}
                    <Input className={inputClass} value={item.description} onChange={(e) => updateItem(index, { description: e.target.value })} placeholder="Service or product" aria-label={`Item ${index + 1} description`} />
                  </div>
                  <div className="space-y-1">
                    {index === 0 && <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Qty</Label>}
                    <Input className={inputClass} inputMode="decimal" value={item.quantity} onChange={(e) => updateItem(index, { quantity: e.target.value })} aria-label={`Item ${index + 1} quantity`} />
                  </div>
                  <div className="space-y-1">
                    {index === 0 && <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Unit price</Label>}
                    <Input className={inputClass} inputMode="decimal" value={item.unitPrice} onChange={(e) => updateItem(index, { unitPrice: e.target.value })} placeholder="0.00" aria-label={`Item ${index + 1} unit price`} />
                  </div>
                  <div className={index === 0 ? 'mt-[22px]' : ''}>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => removeItem(index)} disabled={items.length === 1} aria-label={`Remove item ${index + 1}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={addItem}>
                <Plus className="w-3.5 h-3.5" /> Add line item
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="Tax, discount & notes">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="inv-tax">Tax rate (%)</Label>
                <Input id="inv-tax" className={inputClass} inputMode="decimal" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} placeholder="e.g. 8.25" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-discount">Discount (flat, {CURRENCIES[currencyCode]?.symbol ?? '$'})</Label>
                <Input id="inv-discount" className={inputClass} inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-notes">Notes / payment terms</Label>
              <textarea
                id="inv-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none resize-y focus-within:border-primary/40 text-foreground/90"
                placeholder="Payment due within 14 days. Bank details, late fees, thank-you note…"
              />
            </div>
          </SectionCard>
        </div>

        {/* ── Preview column ── */}
        <div className="space-y-5 lg:sticky lg:top-24 self-start">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Live preview</h2>
            <span className="text-xs text-muted-foreground">updates as you type</span>
          </div>

          <div className="rounded-2xl border border-border bg-muted/30 overflow-hidden shadow-premium">
            {resultUrl ? (
              <iframe
                title="Invoice PDF preview"
                src={resultUrl}
                className="w-full h-[560px] bg-white"
              />
            ) : (
              <div className="h-[560px] flex flex-col items-center justify-center text-muted-foreground gap-3 p-8 text-center">
                <FileText className="w-10 h-10 opacity-40" />
                <p className="text-sm font-medium">Your invoice preview appears here.</p>
                <p className="text-xs">Start typing on the left, or click “Load sample”.</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-5 space-y-3 shadow-premium">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="inv-currency">Currency</Label>
                <Select value={currencyCode} onValueChange={setCurrencyCode}>
                  <SelectTrigger id="inv-currency" aria-label="Currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(CURRENCIES).map((code) => (
                      <SelectItem key={code} value={code}>{code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-page-size">Page size</Label>
                <Select value={pageSize} onValueChange={(v) => setPageSize(v as 'letter' | 'a4')}>
                  <SelectTrigger id="inv-page-size" aria-label="Page size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="letter">US Letter</SelectItem>
                    <SelectItem value="a4">A4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Subtotal{totals.taxPercent > 0 ? ` + ${totals.taxPercent}% tax` : ''}
                {totals.discountAmount > 0 ? ' − discount' : ''}
              </span>
              <span className="font-bold text-foreground text-lg">
                {formatMoney(totals.total, currencyCode)}
              </span>
            </div>

            <Button
              className="w-full btn-premium py-6 rounded-xl font-bold shadow-xl shadow-primary/20"
              onClick={handleGenerate}
              disabled={isProcessing || !hasContent}
              size="lg"
            >
              {isProcessing ? 'Generating…' : 'Generate Invoice PDF'}
            </Button>
            {resultUrl && (
              <Button onClick={download} variant="outline" className="w-full gap-2 rounded-xl font-semibold">
                <Download className="w-4 h-4" /> Download invoice PDF
              </Button>
            )}
          </div>

          {resultUrl && (
            <div className="flex flex-col items-center gap-3">
              <SmartlinkButton />
              <ResultScreenAd refreshKey={resultUrl} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
