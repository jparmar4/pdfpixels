import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ToolPageClient } from '@/components/layout/tool-page-client';
import { HeaderAd, InContentAd, NativeAd, FooterAd } from '@/components/ads/ad-banner';
import { ToolSidebarAd } from '@/components/ads/tool-sidebar-ad';
import { adsConfig, adsenseConfig } from '@/lib/ads-config';
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
import { ADSENSE_REVIEW_MODE, DEFAULT_OG_IMAGE_URL, absoluteUrl, getRobotsMetadata, organizationId, websiteId } from '@/lib/seo';

export function localizedMetadata(locale: LocaleCode, slug: string): Metadata {
  const copy = getLocalizedTool(locale, slug);
  const languages = toolLanguageAlternates(slug);
  if (!copy) return {};
  const pack = getLocalePack(locale);
  const canonicalUrl = absoluteUrl(`/${locale}/tools/${slug}`);
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
      url: canonicalUrl,
      locale: pack.ogLocale,
      type: 'website',
      images: [
        {
          url: DEFAULT_OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: copy.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.title,
      description: copy.description,
      images: [DEFAULT_OG_IMAGE_URL],
    },
    robots: getRobotsMetadata(!ADSENSE_REVIEW_MODE),
  };
}

export function LocalizedToolPage({ locale, slug }: { locale: LocaleCode; slug: string }) {
  const copy = getLocalizedTool(locale, slug);
  const tool = getToolBySlug(slug);
  if (!copy || !tool) notFound();
  const pack = getLocalePack(locale);
  const siblings = LOCALIZED_TOOL_SLUGS.filter((item) => item !== slug);
  const pageUrl = absoluteUrl(`/${locale}/tools/${slug}`);
  const hubUrl = absoluteUrl(`/${locale}`);
  const faqs = copy.faqs?.length ? copy.faqs : pack.buildFaqs(copy);
  const localeDisplayNames: Record<LocaleCode, string> = {
    de: 'Deutsch',
    fr: 'Français',
    jp: '日本語',
    es: 'Español',
    pt: 'Português',
  };
  const hasActiveSidebarAd =
    (adsenseConfig.enabled && Boolean(adsenseConfig.slots.sidebar)) ||
    Boolean(adsConfig.slots.sidebar) ||
    adsConfig.testMode;

  const localizedSchemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: copy.title,
      description: copy.description,
      inLanguage: pack.htmlLang,
      isPartOf: { '@id': websiteId() },
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['h1', 'h2', 'p', 'ol'],
      },
      mainEntity: {
        '@id': `${pageUrl}#software`,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      '@id': `${pageUrl}#software`,
      name: copy.name,
      description: copy.description,
      url: pageUrl,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      isAccessibleForFree: true,
      inLanguage: pack.htmlLang,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
      provider: {
        '@id': organizationId(),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: copy.howTitle,
      description: copy.intro,
      inLanguage: pack.htmlLang,
      step: copy.steps.map((step, idx) => ({
        '@type': 'HowToStep',
        position: idx + 1,
        name: `${pack.stepPrefix} ${idx + 1}`,
        text: step,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: pack.htmlLang,
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: pack.homeLabel, item: absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: pack.hubLabel, item: hubUrl },
        { '@type': 'ListItem', position: 3, name: copy.name, item: pageUrl },
      ],
    },
  ];

  return (
    <main
      id="main-content"
      lang={pack.htmlLang}
      className={[
        locale === 'jp' ? "[font-family:var(--font-inter),'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP','Yu Gothic',Meiryo,sans-serif]" : '',
        hasActiveSidebarAd ? 'xl:pr-[196px]' : '',
      ].filter(Boolean).join(' ') || undefined}
    >
      <SetHtmlLang lang={pack.htmlLang} />
      {localizedSchemas.map((schema, index) => (
        <script
          key={`loc-schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <div className="container mx-auto max-w-5xl px-4 pt-5 lg:px-8 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-foreground transition-colors">{pack.homeLabel}</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/${locale}`} className="hover:text-foreground transition-colors">{pack.hubLabel}</Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-foreground">{copy.name}</span>
        </nav>
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href={`/tools/${slug}`}
            hrefLang="en"
            className="rounded-full border border-border/60 bg-background/80 px-2.5 py-0.5 text-[11px] font-medium hover:border-primary/40 hover:text-primary transition-colors"
          >
            {pack.englishLabel}
          </Link>
          {LOCALIZED_LOCALES.map((item) => (
            <Link
              key={item}
              href={`/${item}/tools/${slug}`}
              hrefLang={getLocalePack(item).hreflang}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                item === locale
                  ? 'border-primary/50 bg-primary/10 text-primary font-semibold'
                  : 'border-border/60 bg-background/80 hover:border-primary/40 hover:text-primary'
              }`}
            >
              {localeDisplayNames[item]}
            </Link>
          ))}
        </div>
      </div>

      <HeaderAd className="my-4" />
      <ToolPageClient toolId={tool.id} toolName={copy.name} toolDescription={copy.description} locale={locale} />
      <InContentAd variant="dual-rectangle" eager instanceId="loc-top" className="my-8" />
      <ToolSidebarAd />

      <article className="container mx-auto max-w-5xl px-4 lg:px-8 py-10 space-y-12">
        <section className="rounded-[2rem] border border-border/60 bg-card/75 p-6 md:p-8 shadow-soft space-y-5">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{copy.howTitle}</h2>
          <p className="text-sm md:text-base leading-7 text-muted-foreground">{copy.intro}</p>
          <ol className="grid gap-3 md:grid-cols-3 pt-2">
            {copy.steps.map((step, idx) => (
              <li key={step} className="rounded-2xl border border-border/50 bg-background/80 p-4 text-sm leading-6 text-foreground">
                <span className="mb-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary mr-2">
                  {idx + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <p className="rounded-xl border border-border/50 bg-muted/35 px-4 py-3 text-xs md:text-sm leading-6 text-muted-foreground">
            {pack.limitNote}
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-foreground">{pack.featuresTitle}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pack.featureCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-soft">
                <h3 className="text-sm font-bold text-foreground">{card.title}</h3>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{card.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <InContentAd variant="rectangle" instanceId="loc-mid" className="my-4" />

        <section className="grid gap-8 lg:grid-cols-12 items-start">
          <div className="lg:col-span-5 rounded-2xl border border-border/60 bg-card/75 p-6 shadow-soft space-y-4">
            <h2 className="text-lg font-bold text-foreground">{pack.specsTitle}</h2>
            <dl className="divide-y divide-border/50 text-xs">
              {pack.specsRows.map((row) => (
                <div key={row.label} className="py-3 flex flex-col gap-1">
                  <dt className="font-semibold text-foreground">{row.label}</dt>
                  <dd className="text-muted-foreground">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:col-span-7 rounded-2xl border border-border/60 bg-card/75 p-6 shadow-soft space-y-4">
            <h2 className="text-lg font-bold text-foreground">{pack.faqTitle}</h2>
            <div className="divide-y divide-border/50">
              {faqs.map((faq) => (
                <details key={faq.question} open className="group py-3">
                  <summary className="cursor-pointer list-none font-semibold text-sm text-foreground flex items-center justify-between gap-3">
                    <span>{faq.question}</span>
                    <span className="text-primary text-xs shrink-0">+</span>
                  </summary>
                  <p className="mt-2 text-xs md:text-sm leading-6 text-muted-foreground">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-background/80 p-6 space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{pack.relatedHeading}</p>
            <nav className="flex flex-wrap gap-2 text-xs">
              {siblings.map((item) => (
                <Link
                  key={item}
                  className="rounded-full border border-border/60 bg-card/80 px-3 py-1.5 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                  href={`/${locale}/tools/${item}`}
                >
                  {getLocalizedTool(locale, item)?.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-2 border-t border-border/40 pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{pack.languagesHeading}</p>
            <nav className="flex flex-wrap gap-3 text-xs">
              <Link className="font-semibold text-primary hover:underline" href={`/tools/${slug}`}>
                {pack.englishLabel}
              </Link>
              {LOCALIZED_LOCALES
                .filter((item) => item !== locale)
                .map((item) => (
                  <Link key={item} className="font-semibold text-primary hover:underline" href={`/${item}/tools/${slug}`}>
                    {localeDisplayNames[item]}
                  </Link>
                ))}
            </nav>
          </div>
        </section>
      </article>
      <NativeAd className="my-8 max-w-5xl mx-auto px-4" />
      <FooterAd className="my-6" />
    </main>
  );
}
