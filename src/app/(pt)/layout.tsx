import type { Metadata, Viewport } from 'next';
import { RootDocumentShell } from '@/components/layout/root-document-shell';
import { localeRootMetadata, rootViewport } from '@/lib/root-layout-config';

export const metadata: Metadata = localeRootMetadata('pt');
export const viewport: Viewport = rootViewport;

export default function PtRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootDocumentShell lang="pt">{children}</RootDocumentShell>;
}
