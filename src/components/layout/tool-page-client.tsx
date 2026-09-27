'use client';

import dynamic from 'next/dynamic';
import { useAppStore } from '@/store/app-store';
import { ToolContext } from '@/hooks/use-active-tool';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Dynamically import workspace components
const CompressWorkspace = dynamic(
  () => import('@/components/layout/compress-workspace').then(mod => ({ default: mod.CompressWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const ResizeWorkspace = dynamic(
  () => import('@/components/layout/resize-workspace').then(mod => ({ default: mod.ResizeWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const ConvertWorkspace = dynamic(
  () => import('@/components/layout/convert-workspace').then(mod => ({ default: mod.ConvertWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const EffectWorkspace = dynamic(
  () => import('@/components/layout/effect-workspace').then(mod => ({ default: mod.EffectWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const ToolWorkspace = dynamic(
  () => import('@/components/layout/tool-workspace').then(mod => ({ default: mod.ToolWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const PDFMergeWorkspace = dynamic(
  () => import('@/components/layout/pdf-merge-workspace').then(mod => ({ default: mod.PDFMergeWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const PDFSplitWorkspace = dynamic(
  () => import('@/components/layout/pdf-split-workspace').then(mod => ({ default: mod.PDFSplitWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const ImageToPDFWorkspace = dynamic(
  () => import('@/components/layout/image-to-pdf-workspace').then(mod => ({ default: mod.ImageToPDFWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const PDFCompressWorkspace = dynamic(
  () => import('@/components/layout/pdf-compress-workspace').then(mod => ({ default: mod.CompressPDFWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const PDFToolsWorkspace = dynamic(
  () => import('@/components/layout/pdf-tools-workspace').then(mod => ({ default: mod.PDFToolsWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const PDFSignWorkspace = dynamic(
  () => import('@/components/layout/pdf-sign-workspace').then(mod => ({ default: mod.PDFSignWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const PDFRedactWorkspace = dynamic(
  () => import('@/components/layout/pdf-redact-workspace').then(mod => ({ default: mod.PDFRedactWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const PDFFlattenWorkspace = dynamic(
  () => import('@/components/layout/pdf-flatten-workspace').then(mod => ({ default: mod.PDFFlattenWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const PDFCropWorkspace = dynamic(
  () => import('@/components/layout/pdf-crop-workspace').then(mod => ({ default: mod.PDFCropWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const PDFExtractWorkspace = dynamic(
  () => import('@/components/layout/pdf-extract-workspace').then(mod => ({ default: mod.PDFExtractWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const PDFFillWorkspace = dynamic(
  () => import('@/components/layout/pdf-fill-workspace').then(mod => ({ default: mod.PDFFillWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const PDFGrayscaleWorkspace = dynamic(
  () => import('@/components/layout/pdf-grayscale-workspace').then(mod => ({ default: mod.PDFGrayscaleWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const PDFToTextWorkspace = dynamic(
  () => import('@/components/layout/pdf-to-text-workspace').then(mod => ({ default: mod.PDFToTextWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const PDFToPDFAWorkspace = dynamic(
  () => import('@/components/layout/pdf-to-pdfa-workspace').then(mod => ({ default: mod.PDFToPDFAWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const WordToPDFWorkspace = dynamic(
  () => import('@/components/layout/word-to-pdf-workspace').then(mod => ({ default: mod.WordToPDFWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const ExcelToPDFWorkspace = dynamic(
  () => import('@/components/layout/excel-to-pdf-workspace').then(mod => ({ default: mod.ExcelToPDFWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const PowerPointToPDFWorkspace = dynamic(
  () => import('@/components/layout/powerpoint-to-pdf-workspace').then(mod => ({ default: mod.PowerPointToPDFWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const PDFToWordWorkspace = dynamic(
  () => import('@/components/layout/pdf-to-word-workspace').then(mod => ({ default: mod.PDFToWordWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const PDFToExcelWorkspace = dynamic(
  () => import('@/components/layout/pdf-to-excel-workspace').then(mod => ({ default: mod.PDFToExcelWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const BankStatementWorkspace = dynamic(
  () => import('@/components/layout/bank-statement-workspace').then(mod => ({ default: mod.BankStatementWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const BatesNumberingWorkspace = dynamic(
  () => import('@/components/layout/bates-numbering-workspace').then(mod => ({ default: mod.BatesNumberingWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const SanitizePdfWorkspace = dynamic(
  () => import('@/components/layout/sanitize-pdf-workspace').then(mod => ({ default: mod.SanitizePdfWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const ComparePdfWorkspace = dynamic(
  () => import('@/components/layout/compare-pdf-workspace').then(mod => ({ default: mod.ComparePdfWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const CmykPdfWorkspace = dynamic(
  () => import('@/components/layout/cmyk-pdf-workspace').then(mod => ({ default: mod.CmykPdfWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const HeicToPdfWorkspace = dynamic(
  () => import('@/components/layout/heic-to-pdf-workspace').then(mod => ({ default: mod.HeicToPdfWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const OCRWorkspace = dynamic(
  () => import('@/components/layout/ocr-workspace').then(mod => ({ default: mod.OCRWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const SignatureWorkspace = dynamic(
  () => import('@/components/layout/signature-workspace').then(mod => ({ default: mod.SignatureWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const MetadataWorkspace = dynamic(
  () => import('@/components/layout/metadata-workspace').then(mod => ({ default: mod.MetadataWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const PDFOcrWorkspace = dynamic(
  () => import('@/components/layout/pdf-ocr-workspace').then(mod => ({ default: mod.PDFOcrWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const PDFReaderWorkspace = dynamic(
  () => import('@/components/layout/pdf-reader-workspace').then(mod => ({ default: mod.PDFReaderWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const PDFExtractImagesWorkspace = dynamic(
  () => import('@/components/layout/pdf-extract-images-workspace').then(mod => ({ default: mod.PDFExtractImagesWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const TextToPDFWorkspace = dynamic(
  () => import('@/components/layout/text-to-pdf-workspace').then(mod => ({ default: mod.TextToPDFWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const PNGToIcoWorkspace = dynamic(
  () => import('@/components/layout/png-to-ico-workspace').then(mod => ({ default: mod.PNGToIcoWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const ImageToBase64Workspace = dynamic(
  () => import('@/components/layout/image-to-base64-workspace').then(mod => ({ default: mod.ImageToBase64Workspace })),
  { loading: () => <WorkspaceLoading /> }
);

const PDFToPptxWorkspace = dynamic(
  () => import('@/components/layout/pdf-to-pptx-workspace').then(mod => ({ default: mod.PDFToPptxWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const PhotoCollageWorkspace = dynamic(
  () => import('@/components/layout/photo-collage-workspace').then(mod => ({ default: mod.PhotoCollageWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const PDFWordCounterWorkspace = dynamic(
  () => import('@/components/layout/pdf-word-counter-workspace').then(mod => ({ default: mod.PDFWordCounterWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const CropWorkspace = dynamic(
  () => import('@/components/layout/crop-workspace').then(mod => ({ default: mod.CropWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const RotateWorkspace = dynamic(
  () => import('@/components/layout/rotate-workspace').then(mod => ({ default: mod.RotateWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const FlipWorkspace = dynamic(
  () => import('@/components/layout/flip-workspace').then(mod => ({ default: mod.FlipWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const BlurBackgroundWorkspace = dynamic(
  () => import('@/components/layout/blur-background-workspace').then(mod => ({ default: mod.BlurBackgroundWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const BlurFaceWorkspace = dynamic(
  () => import('@/components/layout/blur-face-workspace').then(mod => ({ default: mod.BlurFaceWorkspace })),
  { loading: () => <WorkspaceLoading /> }
);

const AIWorkspace = dynamic(
  () => import('@/components/layout/ai-workspace').then(mod => ({ default: mod.AIWorkspace })),
  { loading: () => <WorkspaceLoading /> }
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
  if (toolId === 'pdf-sign') return <PDFSignWorkspace />;
  if (toolId === 'pdf-redact') return <PDFRedactWorkspace />;
  if (toolId === 'pdf-flatten') return <PDFFlattenWorkspace />;
  if (toolId === 'pdf-crop') return <PDFCropWorkspace />;
  if (toolId === 'pdf-extract') return <PDFExtractWorkspace />;
  if (toolId === 'pdf-fill') return <PDFFillWorkspace />;
  if (toolId === 'pdf-grayscale') return <PDFGrayscaleWorkspace />;
  if (toolId === 'pdf-to-text') return <PDFToTextWorkspace />;
  if (toolId === 'pdf-to-pdfa') return <PDFToPDFAWorkspace />;
  if (toolId === 'word-to-pdf') return <WordToPDFWorkspace />;
  if (toolId === 'excel-to-pdf') return <ExcelToPDFWorkspace />;
  if (toolId === 'powerpoint-to-pdf') return <PowerPointToPDFWorkspace />;
  if (toolId === 'pdf-to-word') return <PDFToWordWorkspace />;
  if (toolId === 'pdf-to-excel') return <PDFToExcelWorkspace initialFormat="xlsx" />;
  if (toolId === 'pdf-to-csv') return <PDFToExcelWorkspace initialFormat="csv" />;
  if (toolId === 'pdf-word-counter') return <PDFWordCounterWorkspace />;
  if (toolId === 'bank-statement-to-excel') return <BankStatementWorkspace />;
  if (toolId === 'bates-numbering-pdf') return <BatesNumberingWorkspace />;
  if (toolId === 'sanitize-pdf') return <SanitizePdfWorkspace />;
  if (toolId === 'compare-pdf') return <ComparePdfWorkspace />;
  if (toolId === 'cmyk-pdf-converter') return <CmykPdfWorkspace />;
  if (toolId === 'heic-to-pdf') return <HeicToPdfWorkspace />;
  if (toolId === 'compress-pdf-to-100kb') return <PDFCompressWorkspace targetPreset="100kb" />;
  if (toolId === 'compress-pdf-to-200kb') return <PDFCompressWorkspace targetPreset="200kb" />;
  if (toolId === 'compress-pdf-to-300kb') return <PDFCompressWorkspace targetPreset="300kb" />;
  if (toolId === 'compress-pdf-to-500kb') return <PDFCompressWorkspace targetPreset="500kb" />;
  if (toolId === 'compress-pdf-under-1mb') return <PDFCompressWorkspace targetPreset="1mb" />;
  if (toolId === 'compress-pdf-to-50kb') return <PDFCompressWorkspace targetPreset="50kb" />;
  if (['pdf-rotate', 'pdf-watermark', 'pdf-protect', 'pdf-unlock', 'pdf-delete-pages', 'pdf-reorder', 'pdf-linearize', 'pdf-add-page-numbers', 'repair-pdf', 'resize-pdf', 'pdf-n-up', 'pdf-metadata'].includes(toolId)) {
    return <PDFToolsWorkspace />;
  }
  if (toolId === 'split-pdf-by-size' || toolId === 'pdf-split') return <PDFSplitWorkspace />;
  if (toolId === 'pdf-ocr') return <PDFOcrWorkspace />;
  if (toolId === 'pdf-reader') return <PDFReaderWorkspace />;
  if (toolId === 'extract-pdf-images') return <PDFExtractImagesWorkspace />;
  if (toolId === 'text-to-pdf') return <TextToPDFWorkspace />;
  if (toolId === 'tiff-to-pdf') return <ImageToPDFWorkspace />;
  if (toolId === 'pdf-to-pptx') return <PDFToPptxWorkspace />;

  // ── Dev / format utilities ──
  if (toolId === 'png-to-ico') return <PNGToIcoWorkspace />;
  if (toolId === 'image-to-base64') return <ImageToBase64Workspace />;

  // ── Collage ──
  if (toolId === 'photo-collage') return <PhotoCollageWorkspace />;

  // ── AI-powered tools ──
  if (toolId === 'blur-background') return <BlurBackgroundWorkspace />;
  if (toolId === 'blur-face') return <BlurFaceWorkspace />;
  if (['remove-background', 'enhance-image', 'beautify', 'retouch', 'upscale'].includes(toolId)) {
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

  // ── Rotate / Flip ──
  if (toolId === 'rotate') return <RotateWorkspace />;
  if (toolId === 'flip') return <FlipWorkspace />;

  // ── Compression tools ──
  if (toolId === 'compress' || toolId === 'increase-image-size') return <CompressWorkspace />;

  // ── Resize + Passport ──
  if (toolId === 'resize' || toolId === 'passport-photo' || toolId === 'dpi-converter') return <ResizeWorkspace />;

  // ── Format conversion ──
  if (['png-to-jpg', 'jpg-to-png', 'webp-to-jpg', 'heic-to-jpg', 'svg-to-png', 'svg-to-jpg', 'webp-to-png', 'avif-to-jpg', 'avif-to-png', 'jpg-to-avif'].includes(toolId)) {
    return <ConvertWorkspace />;
  }

  // ── Effects & Filters (client-side Canvas) ──
  const effectTools = ['blur-image', 'pixelate', 'grayscale', 'black-white', 'sepia', 'invert', 'motion-blur', 'censor-photo', 'pixel-art'];
  if (effectTools.includes(toolId)) return <EffectWorkspace />;

  // ── Basic editing (client-side) ──
  const editTools = ['watermark', 'add-text', 'add-logo', 'merge-images', 'split-image', 'color-picker'];
  if (editTools.includes(toolId)) return <ToolWorkspace />;

  // Fallback — still use ToolWorkspace so unknown tools never blank the page
  console.warn(`[PdfPixels] No dedicated workspace for tool "${toolId}", using ToolWorkspace fallback.`);
  return <ToolWorkspace />;
}

export function ToolPageClient({ toolId, toolName, toolDescription }: ToolPageClientProps) {
  const setActiveTool = useAppStore((state) => state.setActiveTool);
  const reset = useAppStore((state) => state.reset);
  const prevToolId = useRef<string | null>(null);

  // useLayoutEffect so activeTool is set before paint — workspaces return null without it
  useLayoutEffect(() => {
    if (prevToolId.current !== toolId) {
      reset();
    }
    prevToolId.current = toolId;
    setActiveTool({
      id: toolId,
      name: toolName,
      description: toolDescription,
    });
  }, [toolId, toolName, toolDescription, setActiveTool, reset]);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  // Per-request initial tool: workspaces SSR their full UI from this context
  // (prerender-safe, no global-store writes during render). The useLayoutEffect
  // above then hydrates the global store for selector-based consumers post-mount.
  const initialTool = { id: toolId, name: toolName, description: toolDescription };

  return (
    <ErrorBoundary>
      <ToolContext.Provider value={initialTool}>
        {getWorkspaceComponent(toolId)}
      </ToolContext.Provider>
    </ErrorBoundary>
  );
}
