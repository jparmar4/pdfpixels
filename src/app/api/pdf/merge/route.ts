import { apiError, apiInternalError } from '@/lib/api-response';
import {
  isPdfFile,
  loadPdfWithTimeout,
  pdfBinaryResponse,
  validatePdfBuffer,
} from '@/lib/pdf-api';

export const maxDuration = 60;
export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import { PDFDocument } from 'pdf-lib';

const MAX_FILES = 20;
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_TOTAL_SIZE = 100 * 1024 * 1024;
const MAX_TOTAL_PAGES = 1000;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    // Accept both `files` (primary) and `file` (API convenience) keys.
    const rawFiles = [...formData.getAll('files'), ...formData.getAll('file')];
    const files = rawFiles.filter(
      (entry): entry is File => typeof entry !== 'string' && typeof (entry as File).arrayBuffer === 'function',
    );

    if (rawFiles.length !== files.length) {
      return apiError('Invalid upload: expected PDF files only.', 400);
    }

    if (!files || files.length === 0) {
      return apiError('No PDF files provided. Add at least 2 PDFs to merge.', 400);
    }

    if (files.length > MAX_FILES) {
      return apiError(`Too many files. Maximum ${MAX_FILES} PDFs allowed per request.`, 400);
    }

    for (const file of files) {
      if (!file.name || file.size === 0) {
        return apiError(`File "${file.name || 'unnamed'}" is empty. Please choose a valid PDF.`, 400);
      }
      if (!Number.isFinite(file.size)) {
        return apiError(`File "${file.name || 'unnamed'}" is invalid. Please re-upload it.`, 400);
      }
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (!Number.isFinite(totalSize)) {
      return apiError('Invalid upload sizes. Please re-upload your PDFs.', 400);
    }
    if (totalSize > MAX_TOTAL_SIZE) {
      return apiError('Total upload size too large (100MB max). Remove some files or compress them first.', 400);
    }

    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();

    let addedPages = 0;
    const skipped: Array<{ name: string; reason: string }> = [];
    const merged: string[] = [];
    let hasForms = false;

    for (const file of files) {
      const displayName = file.name || 'unnamed';
      if (file.size > MAX_FILE_SIZE) {
        skipped.push({ name: displayName, reason: 'File exceeds 50MB per-file limit' });
        continue;
      }

      if (!isPdfFile(file)) {
        skipped.push({ name: displayName, reason: 'Not a PDF file — only .pdf uploads are supported' });
        continue;
      }

      let pdfBytes: Uint8Array;
      try {
        const arrayBuffer = await file.arrayBuffer();
        pdfBytes = new Uint8Array(arrayBuffer);
      } catch {
        skipped.push({ name: displayName, reason: 'Could not read upload. Please re-upload the file.' });
        continue;
      }
      const magic = validatePdfBuffer(pdfBytes);
      if (!magic.ok) {
        skipped.push({ name: displayName, reason: magic.error });
        continue;
      }

      try {
        // Scale timeout with file size: large scans need more headroom than tiny text PDFs.
        const timeoutMs = file.size > 25 * 1024 * 1024 ? 30000 : 15000;
        const pdf = await loadPdfWithTimeout(
          pdfBytes,
          { ignoreEncryption: true, updateMetadata: false },
          timeoutMs,
        );
        if (pdf.isEncrypted) {
          skipped.push({
            name: displayName,
            reason: 'Password-protected. Unlock it first (Unlock PDF tool), then merge.',
          });
          continue;
        }
        let pageIndices: number[];
        try {
          // Probe the page tree early so damaged files surface per-file (400)
          // instead of crashing the whole merge (500).
          const totalPages = pdf.getPageCount();
          if (!Number.isFinite(totalPages) || totalPages === 0) {
            skipped.push({ name: displayName, reason: 'No readable pages found. The file may be damaged.' });
            continue;
          }
          pageIndices = pdf.getPageIndices();
        } catch {
          skipped.push({ name: displayName, reason: 'Could not read pages. The file may be damaged.' });
          continue;
        }
        if (pageIndices.length === 0) {
          skipped.push({ name: displayName, reason: 'No readable pages found. The file may be damaged.' });
          continue;
        }
        if (addedPages + pageIndices.length > MAX_TOTAL_PAGES) {
          return apiError(
            `Merged PDF would exceed ${MAX_TOTAL_PAGES} pages (already merged ${merged.length} file(s), ${addedPages} pages). Split your files into smaller merges.`,
            413,
          );
        }
        // Preserve filled form values visually: pdf-lib copyPages drops
        // AcroForm fields, so flatten appearances into page content first.
        // If flatten fails (XFA/dynamic forms), continue with plain pages.
        try {
          const form = pdf.getForm();
          if (form.getFields().length > 0) {
            hasForms = true;
            form.updateFieldAppearances();
            form.flatten();
          }
        } catch {
          hasForms = true;
        }
        const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);

        for (const page of copiedPages) {
          mergedPdf.addPage(page);
          addedPages += 1;
        }
        merged.push(displayName);
      } catch (e) {
        console.error(`Error loading PDF ${displayName}:`, e);
        const raw = e instanceof Error ? e.message : 'Failed to load PDF';
        const friendly = /timed out/i.test(raw)
          ? 'Took too long to read. Try a smaller file or compress it first.'
          : /encrypt|password/i.test(raw)
            ? 'Password-protected. Unlock it first, then merge.'
            : raw.length > 160
              ? 'Could not read this PDF. The file may be damaged.'
              : raw;
        skipped.push({ name: displayName, reason: friendly });
      }
    }

    if (addedPages === 0) {
      const detail = skipped.length
        ? ` Skipped: ${skipped.map((s) => `${s.name} (${s.reason})`).join('; ')}`
        : '';
      return apiError(`No valid PDF pages found to merge.${detail}`, 400);
    }

    const mergedPdfBytes = await mergedPdf.save({ useObjectStreams: true });
    const fileName = `merged-${Date.now()}.pdf`;
    const pageCount = mergedPdf.getPageCount();

    // Lenient by design: return the merged output for all valid files and
    // surface per-file problems via headers + console, instead of failing
    // the whole job when a single upload is bad. Frontend toasts the warning.
    const skippedSummary = skipped.length
      ? skipped.map((s) => `${s.name}: ${s.reason}`).join(' | ').slice(0, 900)
      : '';
    return pdfBinaryResponse(mergedPdfBytes, fileName, {
      'X-Page-Count': String(pageCount),
      'X-Merged-Files': String(merged.length),
      ...(skipped.length
        ? {
            'X-Skipped-Count': String(skipped.length),
            'X-Skipped-Details': skippedSummary,
          }
        : {}),
      ...(hasForms
        ? { 'X-Forms-Flattened': 'true' }
        : {}),
    });
  } catch (error) {
    return apiInternalError(error, 'Failed to merge PDFs', 'PDF merge error');
  }
}
