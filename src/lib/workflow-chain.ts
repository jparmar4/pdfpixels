import { allImageTools, allPdfTools, getToolById, type Tool } from '@/lib/tools-data';

const WORKFLOW_CHAIN_MAP: Record<string, string[]> = {
  'pdf-merge': ['pdf-compress', 'pdf-sign', 'pdf-add-page-numbers'],
  'pdf-compress': ['pdf-sign', 'pdf-protect', 'pdf-merge'],
  'pdf-split': ['pdf-compress', 'pdf-sign', 'pdf-merge'],
  'pdf-extract': ['pdf-compress', 'pdf-sign', 'pdf-merge'],
  'pdf-sign': ['pdf-flatten', 'pdf-compress', 'pdf-protect'],
  'pdf-fill': ['pdf-sign', 'pdf-flatten', 'pdf-compress'],
  'pdf-redact': ['sanitize-pdf', 'bates-numbering-pdf', 'pdf-compress'],
  'sanitize-pdf': ['pdf-compress', 'pdf-sign', 'pdf-protect'],
  'bates-numbering-pdf': ['pdf-compress', 'pdf-sign', 'pdf-protect'],
  'bank-statement-to-excel': ['pdf-redact', 'pdf-merge', 'pdf-compress'],
  'qbo-ofx-qfx-to-excel-csv': ['bank-statement-to-excel', 'pdf-to-excel', 'pdf-compress'],
  'shipping-label-cropper': ['amazon-fba-thermal-label-converter', 'pdf-rotate', 'pdf-compress'],
  'amazon-fba-thermal-label-converter': ['shipping-label-cropper', 'pdf-split', 'pdf-merge'],
  'fill-sign-irs-w9-pdf': ['pdf-protect', 'pdf-compress', 'pdf-merge'],
  'uscis-pdf-packet-merger': ['pdf-compress', 'pdf-redact', 'pdf-sign'],
  'pdf-accessibility-checker': ['pdf-metadata', 'pdf-to-pdfa', 'pdf-compress'],
  'local-folder-batch-processor': ['pdf-compress', 'bates-numbering-pdf', 'pdf-watermark'],
  'private-ai-pdf-contract-auditor': ['pdf-sign', 'pdf-redact', 'compare-pdf'],
  'ecommerce-product-photo-pack': ['compress', 'resize', 'remove-background'],
  'c2pa-ai-content-credentials-checker': ['remove-metadata', 'compress', 'sanitize-pdf'],
  'word-to-pdf': ['pdf-compress', 'pdf-sign', 'pdf-merge'],
  'excel-to-pdf': ['pdf-compress', 'pdf-sign', 'pdf-merge'],
  'powerpoint-to-pdf': ['pdf-compress', 'pdf-sign', 'pdf-merge'],
  'image-to-pdf': ['pdf-compress', 'pdf-sign', 'pdf-add-page-numbers'],
  'heic-to-pdf': ['pdf-compress', 'pdf-sign', 'pdf-merge'],
  'tiff-to-pdf': ['pdf-compress', 'pdf-sign', 'pdf-merge'],
  'text-to-pdf': ['pdf-compress', 'pdf-sign', 'pdf-add-page-numbers'],
  'remove-background': ['resize', 'passport-photo', 'compress'],
  'blur-background': ['compress', 'resize', 'image-to-pdf'],
  'blur-face': ['compress', 'resize', 'image-to-pdf'],
  'enhance-image': ['compress', 'resize', 'image-to-pdf'],
  'beautify': ['compress', 'resize', 'passport-photo'],
  'retouch': ['compress', 'resize', 'passport-photo'],
  'upscale': ['compress', 'resize', 'image-to-pdf'],
  'compress': ['resize', 'watermark', 'image-to-pdf'],
  'increase-image-size': ['resize', 'watermark', 'image-to-pdf'],
  'resize': ['compress', 'passport-photo', 'image-to-pdf'],
  'passport-photo': ['compress', 'merge-photo-signature', 'image-to-pdf'],
  'dpi-converter': ['compress', 'passport-photo', 'image-to-pdf'],
  'crop': ['compress', 'resize', 'image-to-pdf'],
  'circle-crop': ['compress', 'resize', 'image-to-pdf'],
  'square-crop': ['compress', 'resize', 'image-to-pdf'],
  'freehand-crop': ['compress', 'resize', 'image-to-pdf'],
  'rotate': ['compress', 'resize', 'image-to-pdf'],
  'flip': ['compress', 'resize', 'image-to-pdf'],
};

const PDF_FALLBACK_CHAIN = ['pdf-compress', 'pdf-sign', 'pdf-protect'];
const IMAGE_FALLBACK_CHAIN = ['compress', 'resize', 'image-to-pdf'];

const PDF_TOOL_IDS = new Set(allPdfTools.map((t) => t.id));
const IMAGE_TOOL_IDS = new Set(allImageTools.map((t) => t.id));

/**
 * Returns 3 contextually relevant next tools for post-download 1-click chaining.
 */
export function getChainedNextTools(sourceToolId: string): Tool[] {
  let candidateIds = WORKFLOW_CHAIN_MAP[sourceToolId];

  if (!candidateIds) {
    if (sourceToolId.includes('statement-to-excel')) {
      candidateIds = WORKFLOW_CHAIN_MAP['bank-statement-to-excel'];
    } else if (sourceToolId.startsWith('compress-pdf-')) {
      candidateIds = WORKFLOW_CHAIN_MAP['pdf-compress'];
    } else if (PDF_TOOL_IDS.has(sourceToolId)) {
      candidateIds = PDF_FALLBACK_CHAIN;
    } else if (IMAGE_TOOL_IDS.has(sourceToolId)) {
      candidateIds = IMAGE_FALLBACK_CHAIN;
    } else {
      candidateIds = PDF_FALLBACK_CHAIN;
    }
  }

  const seen = new Set<string>([sourceToolId]);
  const resolved: Tool[] = [];

  for (const id of [...candidateIds, ...PDF_FALLBACK_CHAIN, ...IMAGE_FALLBACK_CHAIN]) {
    if (seen.has(id)) continue;
    const tool = getToolById(id);
    if (!tool) continue;
    seen.add(id);
    resolved.push(tool);
    if (resolved.length >= 3) break;
  }

  return resolved;
}

/**
 * Tools whose download output is non-visual tabular/text data (CSV/XLSX/DOCX/TXT/ZIP).
 * When chaining into PDF/Image tools (e.g. Bank Statement to Excel -> Redact PDF),
 * forward the original uploaded PDF/Image rather than the exported spreadsheet.
 */
export function prefersSourceFileForChain(toolId: string): boolean {
  return (
    toolId.includes('statement-to-excel') ||
    toolId === 'pdf-to-excel' ||
    toolId === 'pdf-to-csv' ||
    toolId === 'pdf-to-word' ||
    toolId === 'pdf-to-pptx' ||
    toolId === 'pdf-to-text' ||
    toolId === 'pdf-word-counter' ||
    toolId === 'extract-pdf-images' ||
    toolId === 'image-to-base64' ||
    toolId === 'image-to-text' ||
    toolId === 'pdf-ocr'
  );
}

const IDB_NAME = 'pdfpixels-workflow-db';
const IDB_STORE = 'chained-files';
const IDB_KEY = 'latest';
const CHAINED_FILE_TTL_MS = 15 * 60 * 1000;

export interface StoredChainedRecord {
  blob: Blob;
  fileName: string;
  mimeType: string;
  sourceToolId: string;
  sourceToolName: string;
  createdAt: number;
}

function openWorkflowDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
  });
}

export async function saveChainedFileToIdb(record: StoredChainedRecord): Promise<void> {
  try {
    const db = await openWorkflowDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(record, IDB_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    // In-memory Zustand singleton handles active SPA sessions even if IndexedDB is blocked.
  }
}

export async function loadChainedFileFromIdb(): Promise<StoredChainedRecord | null> {
  try {
    const db = await openWorkflowDb();
    return await new Promise<StoredChainedRecord | null>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => {
        db.close();
        const value = req.result as StoredChainedRecord | undefined;
        if (!value || Date.now() - value.createdAt > CHAINED_FILE_TTL_MS) {
          resolve(null);
          return;
        }
        resolve(value);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

export async function clearChainedFileFromIdb(): Promise<void> {
  try {
    const db = await openWorkflowDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(IDB_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    });
  } catch {
    // Ignore storage cleanup errors
  }
}
