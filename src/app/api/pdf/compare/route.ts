import { apiError } from '@/lib/api-response';
import { openEditablePdf } from '@/lib/pdf-api';
import { NextRequest, NextResponse } from 'next/server';
import { extractPdfLines } from '@/lib/pdf-text';

export const maxDuration = 60;
export const runtime = 'nodejs';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

/**
 * Computes line-by-line diff using longest common subsequence.
 */
function computeDiff(linesA: string[], linesB: string[]): DiffLine[] {
  const a = linesA;
  const b = linesB;
  const lenA = a.length;
  const lenB = b.length;

  const dp: number[][] = Array.from({ length: lenA + 1 }, () => new Array(lenB + 1).fill(0));

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      if (a[i - 1].trim() === b[j - 1].trim()) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const diff: DiffLine[] = [];
  let i = lenA;
  let j = lenB;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1].trim() === b[j - 1].trim()) {
      diff.push({ type: 'unchanged', text: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.push({ type: 'added', text: b[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      diff.push({ type: 'removed', text: a[i - 1] });
      i--;
    }
  }

  return diff.reverse();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const fileA = (formData.get('fileA') || formData.get('file1') || formData.get('original')) as File | null;
    const fileB = (formData.get('fileB') || formData.get('file2') || formData.get('modified')) as File | null;

    if (!fileA || !fileB) {
      return apiError('Please upload both an original PDF (fileA) and a revised PDF (fileB) to compare.', 400);
    }

    const openedA = await openEditablePdf(fileA);
    if (!openedA.ok) return openedA.response;
    const openedB = await openEditablePdf(fileB);
    if (!openedB.ok) return openedB.response;

    const linesA = await extractPdfLines(openedA.buffer);
    const linesB = await extractPdfLines(openedB.buffer);

    if (!linesA.length || !linesB.length) return apiError('Both PDFs must contain selectable text. Run OCR on scanned PDFs first.', 422);
    if (linesA.length * linesB.length > 4_000_000) return apiError('These documents contain too many lines to compare at once. Split them into smaller sections.', 422);

    const diff = computeDiff(linesA, linesB);

    const additions = diff.filter(d => d.type === 'added').length;
    const deletions = diff.filter(d => d.type === 'removed').length;
    const unchanged = diff.filter(d => d.type === 'unchanged').length;
    const totalDiffItems = diff.length;

    const similarity = totalDiffItems > 0
      ? Math.round((unchanged / (unchanged + additions + deletions)) * 100)
      : 100;

    return NextResponse.json({
      fileA: {
        name: fileA.name,
        pageCount: openedA.pdf.getPageCount(),
        totalLines: linesA.length,
      },
      fileB: {
        name: fileB.name,
        pageCount: openedB.pdf.getPageCount(),
        totalLines: linesB.length,
      },
      stats: {
        additions,
        deletions,
        unchanged,
        similarity,
      },
      diff,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('PDF compare error:', error);
    return apiError(error instanceof Error ? error.message : 'Failed to compare PDF documents', 500);
  }
}
