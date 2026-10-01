'use client';

import { useEffect } from 'react';

/**
 * Two-layer language patch for locale pages served under the root layout
 * (which hardcodes <html lang="en">):
 *  1. The inline script below is server-rendered and executes while the HTML
 *     is still parsing, so any crawler that runs JS (Googlebot, Bingbot)
 *     sees the correct document language before paint. It also records the
 *     original lang in data-orig-lang for restoration.
 *  2. The caller wraps page content in an SSR'd <main lang="…">, which gives
 *     non-JS consumers (LLM scrapers, social parsers) the content language.
 */
export function SetHtmlLang({ lang }: { lang: string }) {
  useEffect(() => {
    return () => {
      const original = document.documentElement.dataset.origLang;
      if (original) {
        document.documentElement.lang = original;
        delete document.documentElement.dataset.origLang;
      }
    };
  }, []);
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){var d=document.documentElement;if(!d.dataset.origLang){d.dataset.origLang=d.lang||'en';}d.lang=${JSON.stringify(lang)};})();`,
      }}
    />
  );
}
