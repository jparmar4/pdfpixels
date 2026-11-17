'use client';

import { create } from 'zustand';
import {
  clearChainedFileFromIdb,
  loadChainedFileFromIdb,
  prefersSourceFileForChain,
  saveChainedFileToIdb,
} from '@/lib/workflow-chain';
import { useAppStore } from '@/store/app-store';

export interface OutputTelemetry {
  toolId?: string;
  toolName?: string;
  url?: string | null;
  blob?: Blob | null;
  file?: File | null;
  fileName?: string;
  mimeType?: string;
  originalSize?: number;
  processedSize?: number;
  savedPercent?: number;
  formatLabel?: string;
  dpiLabel?: string;
  privacyStatus?: string;
  completedAt?: number;
}

export interface PendingChainedFile {
  file: File;
  sourceToolId: string;
  sourceToolName: string;
  createdAt: number;
}

interface WorkflowState {
  hasDownloadedOnce: boolean;
  downloadCount: number;
  lastDownloadedUrl: string | null;
  lastDownloadedAt: number;
  latestOutput: OutputTelemetry | null;
  pendingChainedFile: PendingChainedFile | null;

  hydrateFromSession: () => void;
  setLatestOutput: (meta: OutputTelemetry | null) => void;
  markDownloadSuccess: (override?: Partial<OutputTelemetry>) => void;
  queueChainedFile: (file: File, sourceToolId: string, sourceToolName: string) => void;
  consumePendingChainedFile: (canAccept?: (file: File) => boolean) => Promise<File | null>;
}

const SESSION_DOWNLOAD_KEY = 'pp_dl_ok';
const MAX_CHAIN_AGE_MS = 15 * 60 * 1000;

function readSessionDownloadFlag(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(SESSION_DOWNLOAD_KEY) === '1';
  } catch {
    return false;
  }
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  hasDownloadedOnce: false,
  downloadCount: 0,
  lastDownloadedUrl: null,
  lastDownloadedAt: 0,
  latestOutput: null,
  pendingChainedFile: null,

  hydrateFromSession: () => {
    if (get().hasDownloadedOnce) return;
    if (readSessionDownloadFlag()) {
      set({ hasDownloadedOnce: true });
    }
  },

  setLatestOutput: (meta) => {
    if (!meta) {
      set({ latestOutput: null });
      return;
    }
    const prev = get().latestOutput;
    const merged: OutputTelemetry = {
      ...prev,
      ...meta,
      completedAt: meta.completedAt ?? prev?.completedAt ?? Date.now(),
    };
    set({ latestOutput: merged });
  },

  markDownloadSuccess: (override) => {
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem(SESSION_DOWNLOAD_KEY, '1');
      } catch {
        // Ignore storage restriction
      }
    }

    const appState = useAppStore.getState();
    const prev = get().latestOutput;
    const merged: OutputTelemetry | null =
      override || prev
        ? {
            ...prev,
            ...override,
            toolId: override?.toolId || prev?.toolId || appState.activeTool?.id,
            toolName: override?.toolName || prev?.toolName || appState.activeTool?.name,
            originalSize: override?.originalSize ?? prev?.originalSize ?? appState.uploadedFile?.size,
            url: override?.url ?? prev?.url ?? appState.processedImage,
          }
        : null;

    set((state) => ({
      hasDownloadedOnce: true,
      downloadCount: state.downloadCount + 1,
      lastDownloadedUrl: merged?.url || appState.processedImage || state.lastDownloadedUrl || 'downloaded',
      lastDownloadedAt: Date.now(),
      latestOutput: merged ?? state.latestOutput,
    }));
  },

  queueChainedFile: (file, sourceToolId, sourceToolName) => {
    const entry: PendingChainedFile = {
      file,
      sourceToolId,
      sourceToolName,
      createdAt: Date.now(),
    };
    set({ pendingChainedFile: entry });
    void saveChainedFileToIdb({
      blob: file,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sourceToolId,
      sourceToolName,
      createdAt: entry.createdAt,
    });
  },

  consumePendingChainedFile: async (canAccept) => {
    const mem = get().pendingChainedFile;
    if (mem) {
      if (Date.now() - mem.createdAt > MAX_CHAIN_AGE_MS) {
        set({ pendingChainedFile: null });
        void clearChainedFileFromIdb();
      } else if (!canAccept || canAccept(mem.file)) {
        set({ pendingChainedFile: null });
        void clearChainedFileFromIdb();
        return mem.file;
      } else {
        return null;
      }
    }

    const stored = await loadChainedFileFromIdb();
    if (!stored) return null;

    const restored = new File([stored.blob], stored.fileName, {
      type: stored.mimeType || stored.blob.type || 'application/octet-stream',
      lastModified: stored.createdAt,
    });

    if (canAccept && !canAccept(restored)) {
      return null;
    }

    set({ pendingChainedFile: null });
    void clearChainedFileFromIdb();
    return restored;
  },
}));

/**
 * Resolves the File to carry into the next chained workflow step without re-uploading.
 */
export async function resolveFileForWorkflowChain(
  sourceToolId: string,
  overrideOutput?: Partial<OutputTelemetry> | null,
): Promise<File | null> {
  const appState = useAppStore.getState();
  const wfState = useWorkflowStore.getState();
  const output = { ...wfState.latestOutput, ...overrideOutput };

  if (prefersSourceFileForChain(sourceToolId) && appState.uploadedFile) {
    return appState.uploadedFile;
  }

  if (output.file instanceof File) {
    return output.file;
  }

  const baseName = appState.uploadedFile?.name?.replace(/\.[^.]+$/, '') || 'pdfpixels-output';

  if (output.blob instanceof Blob) {
    const mime = output.mimeType || output.blob.type || 'application/octet-stream';
    const ext = inferExtensionFromMime(mime, output.fileName);
    const fileName = output.fileName || `${baseName}-processed.${ext}`;
    return new File([output.blob], fileName, { type: mime, lastModified: Date.now() });
  }

  const candidateUrl = output.url || appState.processedImage;
  if (candidateUrl && (candidateUrl.startsWith('blob:') || candidateUrl.startsWith('data:'))) {
    try {
      const response = await fetch(candidateUrl);
      const blob = await response.blob();
      const mime = output.mimeType || blob.type || 'application/octet-stream';
      const ext = inferExtensionFromMime(mime, output.fileName);
      const fileName = output.fileName || `${baseName}-processed.${ext}`;
      return new File([blob], fileName, { type: mime, lastModified: Date.now() });
    } catch {
      // Fallback to source file below if blob URL was already revoked
    }
  }

  return appState.uploadedFile ?? null;
}

function inferExtensionFromMime(mime: string, fallbackName?: string): string {
  const lower = mime.toLowerCase();
  if (lower.includes('pdf')) return 'pdf';
  if (lower.includes('png')) return 'png';
  if (lower.includes('webp')) return 'webp';
  if (lower.includes('avif')) return 'avif';
  if (lower.includes('jpeg') || lower.includes('jpg')) return 'jpg';
  if (lower.includes('gif')) return 'gif';
  if (lower.includes('tiff')) return 'tiff';
  const fromName = fallbackName?.split('.').pop();
  return fromName || 'bin';
}
