import { SetHtmlLang } from '@/components/seo/set-html-lang';
import { JpShell } from './jp-shell';

const htmlLang: Record<string, string> = {
  us: 'en-US',
  uk: 'en-GB',
  ca: 'en-CA',
  au: 'en-AU',
  in: 'en-IN',
  de: 'de',
  fr: 'fr',
  jp: 'ja',
};

export default async function RegionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ region: string }>;
}) {
  const { region } = await params;
  const body = (
    <>
      <SetHtmlLang lang={htmlLang[region] ?? 'en'} />
      {children}
    </>
  );
  if (region === 'jp') return <JpShell>{body}</JpShell>;
  return body;
}
