import type { Metadata, Viewport } from 'next';
import { RootDocumentShell } from '@/components/layout/root-document-shell';
import { rootMetadata, rootViewport } from '@/lib/root-layout-config';

export const metadata: Metadata = rootMetadata;
export const viewport: Viewport = rootViewport;

export default function FrRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootDocumentShell lang="fr">{children}</RootDocumentShell>;
}
