import { apiError, apiInternalError } from '@/lib/api-response';
import { openEditablePdf } from '@/lib/pdf-api';
import { extractPdfTextItems, itemsToLines } from '@/lib/pdf-text';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
export const runtime = 'nodejs';

interface DetectedPii {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'ssn' | 'aadhaar' | 'pan' | 'card' | 'phone' | 'email';
  text: string;
}

const PII_PATTERNS = [
  { type: 'ssn' as const, regex: /\b\d{3}-\d{2}-\d{4}\b/g },
  { type: 'aadhaar' as const, regex: /\b\d{4}\s\d{4}\s\d{4}\b/g },
  { type: 'pan' as const, regex: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g },
  { type: 'card' as const, regex: /\b(?:\d{4}[ -]?){3}\d{4}\b/g },
  { type: 'email' as const, regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  { type: 'phone' as const, regex: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g },
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    const opened = await openEditablePdf(file);
    if (!opened.ok) return opened.response;
    const { pdf, buffer } = opened;

    const totalPages = pdf.getPageCount();
    if (totalPages > 50) {
      return apiError('Please split PDFs over 50 pages before auto-detecting PII.', 422);
    }

    const items = await extractPdfTextItems(buffer);
    const detected: DetectedPii[] = [];

    for (const item of items) {
      if (!item.str || !item.str.trim()) continue;

      const pageIdx = item.page - 1;
      if (pageIdx < 0 || pageIdx >= totalPages) continue;
      const page = pdf.getPage(pageIdx);
      const { height: pageHeight, width: pageWidth } = page.getCropBox();

      for (const pattern of PII_PATTERNS) {
        pattern.regex.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = pattern.regex.exec(item.str)) !== null) {
          const matchedStr = match[0];
          // Calculate proportional width/offset of matched substring
          const startRatio = match.index / item.str.length;
          const matchLenRatio = matchedStr.length / item.str.length;

          const boxX = Math.max(0, item.x + item.width * startRatio - 2);
          // Convert from bottom-origin PDF coords to top-origin editor coords
          const boxY = Math.max(0, pageHeight - item.y - item.height - 2);
          const boxW = Math.min(pageWidth - boxX, Math.max(20, item.width * matchLenRatio + 4));
          const boxH = Math.max(12, item.height + 4);

          detected.push({
            id: `pii-${Math.random().toString(36).substring(2, 9)}`,
            pageNumber: item.page,
            x: Math.round(boxX),
            y: Math.round(boxY),
            width: Math.round(boxW),
            height: Math.round(boxH),
            type: pattern.type,
            text: matchedStr,
          });
        }
      }
    }

    const summary = {
      ssn: detected.filter(d => d.type === 'ssn').length,
      aadhaar: detected.filter(d => d.type === 'aadhaar').length,
      pan: detected.filter(d => d.type === 'pan').length,
      card: detected.filter(d => d.type === 'card').length,
      phone: detected.filter(d => d.type === 'phone').length,
      email: detected.filter(d => d.type === 'email').length,
      total: detected.length,
    };

    return NextResponse.json({
      detected,
      summary,
      totalPages,
    });
  } catch (error) {
    return apiInternalError(error, 'Failed to detect PII', 'PII detection error');
  }
}
