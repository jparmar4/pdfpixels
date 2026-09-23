import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ToolPageClient } from '@/components/layout/tool-page-client';
import { SetHtmlLang } from '@/components/seo/set-html-lang';
import {
  getLocalePack,
  getLocalizedTool,
  LOCALIZED_TOOL_SLUGS,
  toolLanguageAlternates,
  type LocaleCode,
} from '@/lib/localized-tools';
import { getToolBySlug } from '@/lib/tools-data';

export function localizedMetadata(locale: LocaleCode, slug: string): Metadata {
  const copy = getLocalizedTool(locale, slug);
  const languages = toolLanguageAlternates(slug);
  if (!copy || !languages) return {};
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
  };
}

export function LocalizedToolPage({ locale, slug }: { locale: LocaleCode; slug: string }) {
  const copy = getLocalizedTool(locale, slug);
  const tool = getToolBySlug(slug);
  if (!copy || !tool) notFound();
  const pack = getLocalePack(locale);
  const siblings = LOCALIZED_TOOL_SLUGS.filter((item) => item !== slug);

  return (
    <main id="main-content" className={locale === 'jp' ? "[font-family:'Noto Sans JP',var(--font-dm-sans),sans-serif]" : undefined}>
      <SetHtmlLang lang={pack.htmlLang} />
      {locale === 'jp' ? (
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap"
        />
      ) : null}
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
          {(['de', 'fr', 'jp'] as const)
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
