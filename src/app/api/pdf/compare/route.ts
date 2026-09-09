import { apiError } from '@/lib/api-response';
import { openEditablePdf } from '@/lib/pdf-api';
import { NextRequest, NextResponse } from 'next/server';
import { inflateSync } from 'zlib';

export const maxDuration = 60;
export const runtime = 'nodejs';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

function extractTextLines(buffer: Buffer): string[] {
  const content = buffer.toString('latin1');
  const allStreams: string[] = [];
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let sMatch: RegExpExecArray | null;

  while ((sMatch = streamRegex.exec(content)) !== null) {
    const rawBytes = Buffer.from(sMatch[1], 'latin1');
    let decoded: string;
    try {
      decoded = inflateSync(rawBytes).toString('latin1');
    } catch {
      decoded = sMatch[1];
    }
    allStreams.push(decoded);
  }

  const fullContent = allStreams.join('\n');
  const lines: string[] = [];
  const btEtRegex = /BT[\s\S]*?ET/g;
  let match: RegExpExecArray | null;

  while ((match = btEtRegex.exec(fullContent)) !== null) {
    const stream = match[0];
    const tjRegex = /\((.*?)\)\s*(?:Tj|'|")/g;
    let tjMatch: RegExpExecArray | null;
    while ((tjMatch = tjRegex.exec(stream)) !== null) {
      const decoded = decodePdfString(tjMatch[1]);
      if (decoded.trim()) lines.push(decoded.trim());
    }

    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    let arrayMatch: RegExpExecArray | null;
    while ((arrayMatch = tjArrayRegex.exec(stream)) !== null) {
      const inner = arrayMatch[1];
      const strRegex = /\((.*?)\)/g;
      let innerMatch: RegExpExecArray | null;
      let line = '';
      while ((innerMatch = strRegex.exec(inner)) !== null) {
        line += decodePdfString(innerMatch[1]);
      }
      if (line.trim()) lines.push(line.trim());
    }
  }

  if (lines.length === 0) {
    const rawParenRegex = /\(([A-Za-z0-9 .,;:!?'"/\-_#@$%&*+=<>()]{3,})\)/g;
    let rawMatch: RegExpExecArray | null;
    while ((rawMatch = rawParenRegex.exec(fullContent)) !== null) {
      const decoded = decodePdfString(rawMatch[1]);
      if (decoded.length > 2 && !/^Font|ColorSpace|Metadata|Encoding|ProcSet/i.test(decoded)) {
        lines.push(decoded.trim());
      }
    }
  }

  return lines;
}

function decodePdfString(str: string): string {
  let decoded = str.replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
  decoded = decoded
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');

  if (decoded.startsWith('\xFE\xFF')) {
    let utf16 = '';
    for (let i = 2; i < decoded.length; i += 2) {
      utf16 += String.fromCharCode((decoded.charCodeAt(i) << 8) | decoded.charCodeAt(i + 1));
    }
    return utf16;
  }
  return decoded;
}

/**
 * Computes line-by-line diff using longest common subsequence.
 */
function computeDiff(linesA: string[], linesB: string[]): DiffLine[] {
  const m = linesA.length;
  const n = linesB.length;

  // Build LCS matrix (limit to 500 lines for high performance)
  const maxLines = 500;
  const a = linesA.slice(0, maxLines);
  const b = linesB.slice(0, maxLines);
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
      diff.unshift({ type: 'unchanged', text: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.unshift({ type: 'added', text: b[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      diff.unshift({ type: 'removed', text: a[i - 1] });
      i--;
    }
  }

  return diff;
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

    const linesA = extractTextLines(openedA.buffer);
    const linesB = extractTextLines(openedB.buffer);

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
    });
  } catch (error) {
    console.error('PDF compare error:', error);
    return apiError(error instanceof Error ? error.message : 'Failed to compare PDF documents', 500);
  }
}
