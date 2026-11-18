import { SetHtmlLang } from '@/components/seo/set-html-lang';
import { JpShell } from './jp-shell';
import { getRegionByCode } from '@/lib/geo-data';

export default async function RegionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ region: string }>;
}) {
  const { region } = await params;
  // The region's own locale (en-US, de-DE, es-ES, pt-BR, ja-JP, …) is the
  // single source of truth so localized hubs never declare lang="en".
  const htmlLang = getRegionByCode(region)?.locale ?? 'en';
  const body = (
    <>
      <SetHtmlLang lang={htmlLang} />
      {children}
    </>
  );
  if (region === 'jp') return <JpShell>{body}</JpShell>;
  return body;
}
