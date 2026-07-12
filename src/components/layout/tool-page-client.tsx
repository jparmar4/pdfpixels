'use client';

import dynamic from 'next/dynamic';
import { useAppStore } from '@/store/app-store';
import { useEffect } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Dynamically import workspace components
const CompressWorkspace = dynamic(
  () => import('@/components/layout/compress-workspace').then(mod => ({ default: mod.CompressWorkspace })),
  { loading: () => <WorkspaceLoading />, ssr: false }
);

const ResizeWorkspace = dynamic(
  () => import('@/components/layout/resize-workspace').then(mod => ({ default: mod.ResizeWorkspace })),
  { loading: () => <WorkspaceLoading />, ssr: false }
);

const ConvertWorkspace = dynamic(
  () => import('@/components/layout/convert-workspace').then(mod => ({ default: mod.ConvertWorkspace })),
  { loading: () => <WorkspaceLoading />, ssr: false }
);

const EffectWorkspace = dynamic(
  () => import('@/components/layout/effect-workspace').then(mod => ({ default: mod.EffectWorkspace })),
  { loading: () => <WorkspaceLoading />, ssr: false }
);

const ToolWorkspace = dynamic(
  () => import('@/components/layout/tool-workspace').then(mod => ({ default: mod.ToolWorkspace })),
  { loading: () => <WorkspaceLoading />, ssr: false }
);

const PDFMergeWorkspace = dynamic(
  () => import('@/components/layout/pdf-merge-workspace').then(mod => ({ default: mod.PDFMergeWorkspace })),
  { loading: () => <WorkspaceLoading />, ssr: false }
);

const PDFSplitWorkspace = dynamic(
  () => import('@/components/layout/pdf-split-workspace').then(mod => ({ default: mod.PDFSplitWorkspace })),
  { loading: () => <WorkspaceLoading />, ssr: false }
);

const ImageToPDFWorkspace = dynamic(
  () => import('@/components/layout/image-to-pdf-workspace').then(mod => ({ default: mod.ImageToPDFWorkspace })),
  { loading: () => <WorkspaceLoading />, ssr: false }
);

const PDFCompressWorkspace = dynamic(
  () => import('@/components/layout/pdf-compress-workspace').then(mod => ({ default: mod.CompressPDFWorkspace })),
  { loading: () => <WorkspaceLoading />, ssr: false }
);

const PDFToolsWorkspace = dynamic(
  () => import('@/components/layout/pdf-tools-workspace').then(mod => ({ default: mod.PDFToolsWorkspace })),
  { loading: () => <WorkspaceLoading />, ssr: false }
);

const OCRWorkspace = dynamic(
  () => import('@/components/layout/ocr-workspace').then(mod => ({ default: mod.OCRWorkspace })),
  { loading: () => <WorkspaceLoading />, ssr: false }
);

const SignatureWorkspace = dynamic(
  () => import('@/components/layout/signature-workspace').then(mod => ({ default: mod.SignatureWorkspace })),
  { loading: () => <WorkspaceLoading />, ssr: false }
);

const MetadataWorkspace = dynamic(
  () => import('@/components/layout/metadata-workspace').then(mod => ({ default: mod.MetadataWorkspace })),
  { loading: () => <WorkspaceLoading />, ssr: false }
);

const CropWorkspace = dynamic(
  () => import('@/components/layout/crop-workspace').then(mod => ({ default: mod.CropWorkspace })),
  { loading: () => <WorkspaceLoading />, ssr: false }
);

const AIWorkspace = dynamic(
  () => import('@/components/layout/ai-workspace').then(mod => ({ default: mod.AIWorkspace })),
  { loading: () => <WorkspaceLoading />, ssr: false }
);

function WorkspaceLoading() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
        <div className="space-y-2">
          <div className="w-40 h-5 rounded bg-muted animate-pulse" />
          <div className="w-56 h-3 rounded bg-muted animate-pulse" />
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="aspect-video rounded-xl bg-muted animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-56 rounded-xl bg-muted animate-pulse" />
          <div className="h-28 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}

type ToolPageClientProps = {
  toolId: string;
  toolName: string;
  toolDescription: string;
};

// Map tool IDs to workspace components
function getWorkspaceComponent(toolId: string) {
  // ── PDF tools ──
  if (toolId === 'pdf-merge') return <PDFMergeWorkspace />;
  if (toolId === 'pdf-split') return <PDFSplitWorkspace />;
  if (toolId === 'image-to-pdf') return <ImageToPDFWorkspace />;
  if (toolId === 'pdf-compress') return <PDFCompressWorkspace />;
  if (toolId === 'pdf-to-image') return <ConvertWorkspace />;
  if (['pdf-rotate', 'pdf-watermark', 'pdf-protect', 'pdf-unlock', 'pdf-delete-pages', 'pdf-reorder', 'pdf-linearize', 'pdf-add-page-numbers'].includes(toolId)) {
    return <PDFToolsWorkspace />;
  }

  // ── AI-powered tools ──
  if (['remove-background', 'enhance-image', 'blur-background', 'blur-face', 'beautify', 'retouch', 'upscale'].includes(toolId)) {
    return <AIWorkspace />;
  }

  // ── OCR ──
  if (toolId === 'image-to-text') return <OCRWorkspace />;

  // ── Signature tools ──
  if (['generate-signature', 'resize-signature', 'merge-photo-signature'].includes(toolId)) {
    return <SignatureWorkspace />;
  }

  // ── Metadata tools ──
  if (['view-metadata', 'edit-metadata', 'remove-metadata'].includes(toolId)) {
    return <MetadataWorkspace />;
  }

  // ── Crop tools ──
  if (['crop', 'circle-crop', 'square-crop', 'freehand-crop'].includes(toolId)) {
    return <CropWorkspace />;
  }

  // ── Compression tools ──
  if (toolId === 'compress' || toolId === 'increase-image-size') return <CompressWorkspace />;

  // ── Resize + Passport ──
  if (toolId === 'resize' || toolId === 'passport-photo' || toolId === 'dpi-converter') return <ResizeWorkspace />;

  // ── Format conversion ──
  if (['png-to-jpg', 'jpg-to-png', 'webp-to-jpg', 'heic-to-jpg'].includes(toolId)) return <ConvertWorkspace />;

  // ── Effects & Filters (client-side Canvas) ──
  const effectTools = ['blur-image', 'pixelate', 'grayscale', 'black-white', 'sepia', 'invert', 'motion-blur', 'censor-photo', 'pixel-art'];
  if (effectTools.includes(toolId)) return <EffectWorkspace />;

  // ── Basic editing (client-side) ──
  const editTools = ['rotate', 'flip', 'watermark', 'add-text', 'add-logo', 'merge-images', 'split-image', 'color-picker'];
  if (editTools.includes(toolId)) return <ToolWorkspace />;

  // Fallback
  return <ToolWorkspace />;
}

export function ToolPageClient({ toolId, toolName, toolDescription }: ToolPageClientProps) {
  const setActiveTool = useAppStore((state) => state.setActiveTool);

  useEffect(() => {
    setActiveTool({
      id: toolId,
      name: toolName,
      description: toolDescription,
    });
  }, [toolId, toolName, toolDescription, setActiveTool]);

  return (
    <ErrorBoundary>
      {getWorkspaceComponent(toolId)}
    </ErrorBoundary>
  );
}
