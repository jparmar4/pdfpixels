import { apiError, apiInternalError } from '@/lib/api-response';
import { openEditablePdf } from '@/lib/pdf-api';
import { extractPdfTextItems } from '@/lib/pdf-text';
import { createEmptyPiiSummary, PII_PATTERN_SPECS, type PiiCategory } from '@/lib/pii-patterns';
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
  type: PiiCategory;
  text: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const rawCats = formData.get('categories');
    let allowed: Set<PiiCategory> | null = null;
    if (typeof rawCats === 'string' && rawCats.trim()) {
      try {
        const parsed = JSON.parse(rawCats);
        if (Array.isArray(parsed) && parsed.length > 0) {
          allowed = new Set(parsed as PiiCategory[]);
        }
      } catch {
        // Ignore malformed filter and scan all categories
      }
    }

    const opened = await openEditablePdf(file);
    if (!opened.ok) return opened.response;
    const { pdf, buffer } = opened;

    const totalPages = pdf.getPageCount();
    if (totalPages > 50) {
      return apiError('Please split PDFs over 50 pages before auto-detecting PII.', 422);
    }

    const items = await extractPdfTextItems(buffer);
    const detected: DetectedPii[] = [];
    const summary = createEmptyPiiSummary();

    for (const item of items) {
      if (!item.str || !item.str.trim()) continue;

      const pageIdx = item.page - 1;
      if (pageIdx < 0 || pageIdx >= totalPages) continue;
      const page = pdf.getPage(pageIdx);
      const { height: pageHeight, width: pageWidth } = page.getCropBox();

      for (const pattern of PII_PATTERN_SPECS) {
        if (allowed && !allowed.has(pattern.type)) continue;
        pattern.regex.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = pattern.regex.exec(item.str)) !== null) {
          const matchedStr = match[0];
          if (pattern.type === 'ssn' && /^\d{2}-\d{7}$/.test(matchedStr)) continue;
          const startRatio = match.index / item.str.length;
          const matchLenRatio = matchedStr.length / item.str.length;

          const boxX = Math.max(0, item.x + item.width * startRatio - 2);
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
          summary[pattern.type] += 1;
          summary.total += 1;
        }
      }
    }

    return NextResponse.json({
      detected,
      summary,
      totalPages,
    });
  } catch (error) {
    return apiInternalError(error, 'Failed to detect PII', 'PII detection error');
  }
}
