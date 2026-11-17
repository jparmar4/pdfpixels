'use client';

import { PDFDocument, StandardFonts } from 'pdf-lib';

export type ClauseSeverity = 'high' | 'medium' | 'info';
export type ClauseCategory = 'date' | 'payment' | 'risk';

export interface ContractFinding {
  id: string;
  category: ClauseCategory;
  severity: ClauseSeverity;
  title: string;
  matchedValue: string;
  excerpt: string;
  pageNumber: number;
  guidance: string;
}

export interface ContractAuditReport {
  fileName: string;
  pageCount: number;
  wordCount: number;
  riskLevel: 'Low' | 'Moderate' | 'Elevated';
  dates: ContractFinding[];
  payments: ContractFinding[];
  risks: ContractFinding[];
  sha256: string;
}

async function computeSha256(buf: ArrayBuffer): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) return 'unavailable';
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function snippetAround(text: string, index: number, span = 140): string {
  const start = Math.max(0, index - 55);
  const end = Math.min(text.length, index + span);
  return text.slice(start, end).replace(/\s+/g, ' ').trim();
}

export async function auditPdfContractClient(file: File): Promise<ContractAuditReport> {
  const buffer = await file.arrayBuffer();
  const sha256 = await computeSha256(buffer.slice(0));

  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    cMapUrl: '/pdfjs/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: '/pdfjs/standard_fonts/',
  }).promise;

  const dates: ContractFinding[] = [];
  const payments: ContractFinding[] = [];
  const risks: ContractFinding[] = [];
  let totalWords = 0;

  try {
    const numPages = Math.min(doc.numPages, 100);
    for (let p = 1; p <= numPages; p += 1) {
      const page = await doc.getPage(p);
      const tc = await page.getTextContent();
      const pageText = tc.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (!pageText) continue;
      totalWords += pageText.split(/\s+/).filter(Boolean).length;

      // 1. Key Dates & Notice Windows
      const datePatterns: Array<{ re: RegExp; title: string; guidance: string }> = [
        {
          re: /(?:effective\s+date|commencing\s+on|dated\s+as\s+of|start\s+date)[^.;\n]{0,45}?\b(?:[A-Z][a-z]+\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})/gi,
          title: 'Effective / Start Date',
          guidance: 'Verify execution date aligns with service kickoff.',
        },
        {
          re: /(?:expir(?:es|ation)|term\s+end(?:ing|s)|initial\s+term|terminat(?:es|ion)\s+date)[^.;\n]{0,55}?\b(?:[A-Z][a-z]+\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\s+(?:months?|years?))/gi,
          title: 'Term / Expiration Date',
          guidance: 'Calendar renewal and contract end dates ahead of cutoff.',
        },
        {
          re: /\b\d+\s*(?:calendar|business)?\s*days['’]?\s*(?:prior\s+)?(?:written\s+)?notice\b/gi,
          title: 'Notice Window Deadline',
          guidance: 'Missing written notice before this window often triggers auto-renewal.',
        },
      ];

      for (const pat of datePatterns) {
        for (const m of pageText.matchAll(pat.re)) {
          dates.push({
            id: `date-${p}-${dates.length}`,
            category: 'date',
            severity: 'info',
            title: pat.title,
            matchedValue: m[0].trim(),
            excerpt: snippetAround(pageText, m.index ?? 0),
            pageNumber: p,
            guidance: pat.guidance,
          });
        }
      }

      // 2. Payment Terms
      const paymentPatterns: Array<{ re: RegExp; title: string; severity: ClauseSeverity; guidance: string }> = [
        {
          re: /\bnet\s*(?:7|10|14|15|30|45|60|90|120)\b/gi,
          title: 'Net Payment Terms',
          severity: 'medium',
          guidance: 'Confirm Net-60+ payment windows fit your cash-flow runway.',
        },
        {
          re: /(?:late\s+(?:fee|charge|interest)|overdue\s+balances?)[^.;\n]{0,65}/gi,
          title: 'Late Fee / Interest Penalty',
          severity: 'medium',
          guidance: 'Review compounding monthly interest caps.',
        },
        {
          re: /(?:retainer|upfront\s+deposit|milestone\s+payment|total\s+(?:fee|compensation|cap))[^.;\n]{0,60}/gi,
          title: 'Compensation / Deposit Clause',
          severity: 'info',
          guidance: 'Verify milestone deliverables match invoicing schedule.',
        },
      ];

      for (const pat of paymentPatterns) {
        for (const m of pageText.matchAll(pat.re)) {
          payments.push({
            id: `pay-${p}-${payments.length}`,
            category: 'payment',
            severity: pat.severity,
            title: pat.title,
            matchedValue: m[0].trim(),
            excerpt: snippetAround(pageText, m.index ?? 0),
            pageNumber: p,
            guidance: pat.guidance,
          });
        }
      }

      // 3. Risk Clauses
      const riskPatterns: Array<{ re: RegExp; title: string; severity: ClauseSeverity; guidance: string }> = [
        {
          re: /(?:unlimited\s+liability|no\s+cap\s+on\s+liability|shall\s+not\s+limit\s+liability|aggregate\s+liability[^.;\n]{0,40}uncapped)/gi,
          title: 'Unlimited Liability Exposure',
          severity: 'high',
          guidance: 'Negotiate a liability cap equal to fees paid over the prior 12 months.',
        },
        {
          re: /(?:auto[- ]?renew(?:al|s|ing)?|automatically\s+renew|evergreen\s+term)/gi,
          title: 'Automatic Renewal / Evergreen Clause',
          severity: 'high',
          guidance: 'Require opt-in renewal or shorten cancellation notice to 15-30 days.',
        },
        {
          re: /(?:non[- ]?compete|non[- ]?solicitation|exclusive\s+(?:services|engagement)|restricted\s+from\s+(?:working|providing))/gi,
          title: 'Non-Compete / Exclusivity Restriction',
          severity: 'high',
          guidance: 'Narrow restrictions to direct named competitors using confidential materials.',
        },
        {
          re: /(?:work\s+made\s+for\s+hire|assign(?:s|ment)?\s+all\s+right,?\s+title,?\s+and\s+interest|intellectual\s+property\s+ownership)/gi,
          title: 'IP Assignment / Work-for-Hire',
          severity: 'medium',
          guidance: 'Carve out pre-existing background tools, templates, and open-source libraries.',
        },
        {
          re: /(?:indemnify,?\s+defend,?\s+and\s+hold\s+harmless|broad\s+indemnification|sole\s+discretion\s+to\s+terminate)/gi,
          title: 'Indemnification / Unilateral Termination',
          severity: 'medium',
          guidance: 'Make indemnification mutual and ensure payment for work performed prior to termination.',
        },
        {
          re: /(?:binding\s+arbitration|governing\s+law|exclusive\s+jurisdiction\s+(?:of|in)\s+[A-Za-z\s]+)/gi,
          title: 'Governing Law / Arbitration Venue',
          severity: 'info',
          guidance: 'Check whether litigation or arbitration requires travel out of state/country.',
        },
      ];

      for (const pat of riskPatterns) {
        for (const m of pageText.matchAll(pat.re)) {
          risks.push({
            id: `risk-${p}-${risks.length}`,
            category: 'risk',
            severity: pat.severity,
            title: pat.title,
            matchedValue: m[0].trim(),
            excerpt: snippetAround(pageText, m.index ?? 0),
            pageNumber: p,
            guidance: pat.guidance,
          });
        }
      }
    }

    const highCount = risks.filter((r) => r.severity === 'high').length;
    const riskLevel: ContractAuditReport['riskLevel'] =
      highCount >= 2 ? 'Elevated' : highCount === 1 || risks.length >= 2 ? 'Moderate' : 'Low';

    return {
      fileName: file.name,
      pageCount: doc.numPages,
      wordCount: totalWords,
      riskLevel,
      dates,
      payments,
      risks,
      sha256,
    };
  } finally {
    await doc.destroy();
  }
}

export async function generateSampleContractPdf(): Promise<File> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pg = doc.addPage([612, 792]);
  const lines = [
    'MASTER SERVICES AGREEMENT (MSA) — SAMPLE FOR AUDIT',
    '1. Effective Date: This Agreement is entered into as of January 15, 2026.',
    '2. Term & Renewal: Initial Term is 12 months ending January 14, 2027. This contract',
    '   shall automatically renew for successive 12-month periods unless Contractor sends',
    '   60 calendar days prior written notice before expiration.',
    '3. Payment Terms: Invoices are payable Net 45 days. Total retainer cap is $18,000.',
    '   Overdue balances accrue a late fee of 1.5% per month.',
    '4. Intellectual Property: All deliverables constitute work made for hire and Contractor',
    '   assigns all right, title, and interest to Client upon creation.',
    '5. Liability & Non-Compete: Contractor assumes unlimited liability for data claims and',
    '   agrees to a 24-month non-compete restriction across North America.',
    '6. Indemnity & Law: Contractor agrees to indemnify, defend, and hold harmless Client.',
    '   Governed by the exclusive jurisdiction of Delaware courts with binding arbitration.',
  ];
  let y = 740;
  for (const line of lines) {
    pg.drawText(line, { x: 42, y, size: 10.5, font });
    y -= 24;
  }
  const bytes = await doc.save();
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new File([copy.buffer], 'sample-msa-contract.pdf', { type: 'application/pdf' });
}
