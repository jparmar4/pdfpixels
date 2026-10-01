import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ToolPageClient } from '@/components/layout/tool-page-client';
import { SetHtmlLang } from '@/components/seo/set-html-lang';
import {
  getLocalePack,
  getLocalizedTool,
  LOCALIZED_TOOL_SLUGS,
  LOCALIZED_LOCALES,
  toolLanguageAlternates,
  type LocaleCode,
} from '@/lib/localized-tools';
import { getToolBySlug } from '@/lib/tools-data';
import { ADSENSE_REVIEW_MODE } from '@/lib/seo';

export function localizedMetadata(locale: LocaleCode, slug: string): Metadata {
  const copy = getLocalizedTool(locale, slug);
  const languages = toolLanguageAlternates(slug);
  if (!copy) return {};
  const pack = getLocalePack(locale);
  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: `/${locale}/tools/${slug}`,
      languages,
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: `/${locale}/tools/${slug}`,
      locale: pack.ogLocale,
      type: 'website',
    },
    robots: {
      // AdSense-review freeze — see ADSENSE_REVIEW_MODE in src/lib/seo.ts.
      index: !ADSENSE_REVIEW_MODE,
      follow: true,
      googleBot: {
        index: !ADSENSE_REVIEW_MODE,
        follow: true,
      },
    },
  };
}

export function LocalizedToolPage({ locale, slug }: { locale: LocaleCode; slug: string }) {
  const copy = getLocalizedTool(locale, slug);
  const tool = getToolBySlug(slug);
  if (!copy || !tool) notFound();
  const pack = getLocalePack(locale);
  const siblings = LOCALIZED_TOOL_SLUGS.filter((item) => item !== slug);

  return (
    // The lang attribute is SSR'd so non-JS crawlers (LLM scrapers, social
    // parsers) still read the correct content language; <html lang> itself is
    // patched by SetHtmlLang below.
    <main
      id="main-content"
      lang={pack.htmlLang}
      className={locale === 'jp' ? "[font-family:var(--font-inter),'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP','Yu Gothic',Meiryo,sans-serif]" : undefined}
    >
      <SetHtmlLang lang={pack.htmlLang} />
      <ToolPageClient toolId={tool.id} toolName={copy.name} toolDescription={copy.description} />
      <section className="container mx-auto max-w-3xl px-4 py-10">
        <h2 className="text-2xl font-bold text-foreground">{copy.howTitle}</h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">{copy.intro}</p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-foreground">
          {copy.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">{pack.limitNote}</p>
        <nav className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link className="font-semibold text-primary" href={`/tools/${slug}`}>
            {pack.englishLabel}
          </Link>
          {LOCALIZED_LOCALES
            .filter((item) => item !== locale)
            .map((item) => (
              <Link key={item} className="font-semibold text-primary" href={`/${item}/tools/${slug}`}>
                {item.toUpperCase()}
              </Link>
            ))}
          {siblings.map((item) => (
            <Link key={item} className="text-muted-foreground" href={`/${locale}/tools/${item}`}>
              {getLocalizedTool(locale, item)?.name}
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}
