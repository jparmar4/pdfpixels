# International search growth — 1 October 2026

The immediate priority is consistent indexing and useful, reliable tools. Country names in metadata do not guarantee country traffic. No Search Console, GA4, country-level performance data, or keyword-volume data was available for this audit; the market groups below are planning hypotheses, not measured demand or standardized tiers.

## Changes in this pass

- Keep the AdSense review freeze enabled, as requested. Remove hreflang references to noindexed regional and translated pages and exclude the noindexed comparison hub from the sitemap.
- Preserve translated titles, canonicals, and noindex metadata during the freeze.
- Use one language-alternate map for English pages, translated pages, and sitemap entries. When indexing is enabled later, generic German, French, and Japanese annotations also cover speakers outside Germany, France, and Japan. Language targeting does not imply a ranking boost.
- Add server-rendered homepage links to six existing practical guides, with a responsive layout and no additional client-side JavaScript.
- Add `npm run test:seo` to check rendered sitemap/indexing/canonical consistency and reciprocal hreflang after a production build.

## Prioritize existing pages before expanding

| Planning audience | Existing content to improve and measure | Next evidence needed |
| --- | --- | --- |
| US, UK, Canada, Australia, Ireland, New Zealand | HEIC on Windows, merging PDFs, signatures, email attachments | Search Console impressions, clicks and queries by country and landing page |
| Germany, Austria, Switzerland; France and French-speaking Canada | German/French compressor, merge and conversion pages | Native-speaker review of instructions, errors, controls and privacy copy before indexing |
| Spain, Brazil, Portugal, Spanish-speaking Latin America | Spanish/Portuguese compressor and conversion pages | Local query vocabulary and translation review; prioritize countries with observed demand |
| India, Philippines, South Africa, Malaysia | Upload limits, mobile compression, job/application documents | Mobile completion rate and real query/landing-page data; verify portal requirements against official sources |

Do not produce dozens of near-identical country pages. Expand a page only when there is a distinct user task, verified local requirement, or complete translation. Avoid automatic IP/language redirects; keep user-selectable URLs accessible to crawlers.

## Review and release sequence

1. While AdSense is pending, improve the indexable English tools and guides. Verify actual output for common and difficult inputs; do not describe compression as lossless or OCR output as a searchable PDF unless the tool provides it.
2. After approval, separately review the existing regional, comparison, and translation pages for quality. The current single flag releases all three groups together, so approval alone is not a content-quality check. Full translation of workspace controls remains outstanding.
3. When that review is complete, change `ADSENSE_REVIEW_MODE` in `src/lib/seo.ts`, build, run the SEO check, and verify deployment. Inspect sample English and localized URLs in Search Console and submit the production sitemap.
4. Validate live HTML, redirects, sitemap, robots and noindex status after deployment. This pass does not deploy or submit URLs to search engines.

## Measurement over the next 90 days

- Establish a 28-day baseline in Search Console: non-brand clicks, impressions, CTR, query and landing page grouped by country and device. Compare equivalent 28-day windows and account for seasonality.
- In consented analytics, measure tool starts, successful results and downloads by tool, country and device. Never send file names, document text, passwords or uploaded content. Audit existing event coverage before adding events; GA4 country data needs no browser geolocation prompt.
- Use mobile field data at the 75th percentile: LCP ≤ 2.5 seconds, INP ≤ 200 ms and CLS ≤ 0.1. Lab scores alone do not demonstrate a field improvement. Investigate hosting latency from priority regions, oversized bundles and third-party scripts with measurements.
- Every two weeks, prioritize pages that already receive relevant impressions: improve the title when intent is unclear, guidance when users cannot finish, and tool reliability when completion is low. Check the effect before expanding the same template.
- Pursue relevant editorial links and genuine demonstrations from document-workflow communities. Avoid purchased traffic and bulk doorway content. Track revenue per successful session alongside organic acquisition so monetization does not hide usability losses.

Success is an observed increase in relevant organic clicks and successful tool usage from selected countries, not a larger page count. Set numeric acquisition targets only after the baseline is available.

## References

- [Google: managing multi-regional and multilingual sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)
- [Google: localized versions and reciprocal hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Google: people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [web.dev: Core Web Vitals thresholds and field measurement](https://web.dev/articles/vitals)
