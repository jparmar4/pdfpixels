/**
 * Single source of truth for platform processing limits.
 *
 * Every number here mirrors an enforced constant in the API routes
 * (see the `Source` comment on each entry). Tool copy, llms.txt,
 * ai-plugin.json, and openapi.yaml must import or quote THESE values —
 * never hard-code competing numbers. Divergent numbers across surfaces
 * is exactly what makes answer engines distrust and stop citing us.
 *
 * Update this file AND the linked route constant together, then bump
 * LIMITS_LAST_REVIEWED.
 */

/** Date these limits were last verified against the route code (YYYY-MM-DD). */
export const LIMITS_LAST_REVIEWED = '2026-09-20';

export const platformLimits = {
  pdf: {
    /** src/lib/pdf-api.ts → PDF_MAX_FILE_SIZE; merge route MAX_FILE_SIZE */
    maxFileMb: 25,
    merge: {
      /** src/app/api/pdf/merge/route.ts */
      maxFiles: 20,
      maxFileMb: 25,
      maxTotalMb: 100,
      maxTotalPages: 1000,
    },
    split: {
      /** src/app/api/pdf/split/route.ts */
      splitAllTruncatedAtPages: 20,
      extractMaxPages: 50,
      maxSelectionChars: 2000,
    },
    imageToPdf: {
      /** src/app/api/pdf/from-image/route.ts */
      maxFiles: 30,
      maxFileMb: 15,
      maxTotalMb: 120,
    },
    pdfToImage: {
      /** src/app/api/pdf/to-image/route.ts */
      maxPagesPerRun: 10,
    },
    pdfToText: {
      /** src/lib/pdf-text.ts */
      maxPages: 500,
      maxChars: 2_000_000,
    },
    protectPassword: {
      /** src/app/api/pdf/protect/route.ts */
      minChars: 4,
      maxChars: 128,
      cannotStartWithDash: true,
    },
    encryptedNote:
      'Password-protected PDFs must be unlocked first (except via the Unlock tool).',
  },
  image: {
    /** src/app/api/image/process/route.ts */
    maxFileMb: 25,
    maxMegapixels: 50,
    maxDimensionPx: 20_000,
    /** targetSize param cap: Math.min(n, 10 * 1024) KB */
    targetSizeCapMb: 10,
    ocr: {
      /** src/app/api/image/ocr/route.ts */
      maxFileMb: 10,
    },
    heic: {
      /** src/app/api/image/heic/route.ts */
      maxFileMb: 25,
    },
  },
  ai: {
    /** src/app/api/ai/route.ts */
    maxFileMb: 20,
    maxEdgePx: 4096,
  },
  rateLimits: {
    /** src/proxy.ts — POST/PUT/DELETE on /api/* */
    processingPerRoutePerMinute: 20,
    globalPerMinute: 100,
    /** src/app/api/contact/route.ts, newsletter/route.ts */
    contactPerMinute: 3,
    newsletterPerMinute: 5,
  },
  retention: {
    /** Privacy policy + tool copy: server temp files auto-purged */
    serverTempFilesNote: 'Server-side files are processed ephemerally and purged automatically within 60 minutes.',
  },
} as const;

/** One-line human summary for llms.txt–style surfaces. */
export function limitsSummaryLines(): string[] {
  const l = platformLimits;
  return [
    `PDF uploads: ${l.pdf.maxFileMb} MB per file on most tools; merging allows up to ${l.pdf.merge.maxFiles} files / ${l.pdf.merge.maxTotalMb} MB total / ${l.pdf.merge.maxTotalPages} pages.`,
    `Split: "all pages" mode returns a ZIP truncated at ${l.pdf.split.splitAllTruncatedAtPages} pages; range/single extract caps at ${l.pdf.split.extractMaxPages} pages.`,
    `Image to PDF: up to ${l.pdf.imageToPdf.maxFiles} images, ${l.pdf.imageToPdf.maxFileMb} MB each, ${l.pdf.imageToPdf.maxTotalMb} MB combined. PDF to JPG: ${l.pdf.pdfToImage.maxPagesPerRun} pages per run. PDF to Text: ${l.pdf.pdfToText.maxPages} pages max.`,
    `Image uploads: ${l.image.maxFileMb} MB per file, ${l.image.maxMegapixels} megapixels max, ${l.image.maxDimensionPx.toLocaleString('en-US')} px per side; OCR accepts up to ${l.image.ocr.maxFileMb} MB; AI tools up to ${l.ai.maxFileMb} MB (${l.ai.maxEdgePx.toLocaleString('en-US')} px longest edge).`,
    `${l.pdf.encryptedNote} Protection passwords need ${l.pdf.protectPassword.minChars}+ characters (max ${l.pdf.protectPassword.maxChars}).`,
    `Rate limits: ${l.rateLimits.processingPerRoutePerMinute}/min per processing route per IP (pdf/*, image/*, ai), ${l.rateLimits.globalPerMinute}/min global; contact/newsletter are stricter.`,
    l.retention.serverTempFilesNote,
  ];
}
