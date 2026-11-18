import type { Metadata } from 'next';
import { LocalizedToolPage, localizedMetadata } from '@/components/seo/localized-tool-page';
import { LOCALIZED_TOOL_SLUGS } from '@/lib/localized-tools';

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALIZED_TOOL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return localizedMetadata('jp', slug);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <LocalizedToolPage locale="jp" slug={slug} />;
}
