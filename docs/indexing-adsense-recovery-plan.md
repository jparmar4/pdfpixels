# Indexing + AdSense Recovery Plan (Aug 2026)

Fixes shipped in commit `e38be24`. This doc covers what changed, what YOU must do
after deploying, and how to re-apply to AdSense with the best odds.

## What was fixed (code side)

| Problem | Fix |
|---|---|
| `pdfpixels.com` and `www.pdfpixels.com` both returned 200 — duplicate site in Google's eyes | 308 redirect non-www → www at the app level (`next.config.ts`) |
| HTML pages cached for 1 year at CDN (`s-maxage=31536000`, homepage measured ~46h stale) | HTML now `s-maxage=3600, stale-while-revalidate=604800`; static assets unchanged |
| Sitemap ping script used non-www URL + retired Google `/ping` endpoint | Script now submits all sitemap URLs to IndexNow (Bing/Yandex) with hosted key file; Google is handled via GSC (see below) |
| 3 near-duplicate blog posts (2× HEIC, 2× email-size, 2× 200KB targets) | Merged into canonical posts, 301 redirects added, 6+ internal links rewired; 28 → 25 posts |
| 4 thin posts (352–547 words) | Expanded to 850–1100+ words; shortest post site-wide is now 616 words |
| Non-www URLs in `openapi.yaml` | Normalized to www |

## After you deploy — do these in order

### 1. Verify the host redirect works (2 minutes)

```
curl -sI https://pdfpixels.com/tools/compress-pdf
```

Expect: `HTTP/1.1 301/308` with `location: https://www.pdfpixels.com/tools/compress-pdf`.
If it still returns 200, **purge the Hostinger CDN cache** (hPanel → CDN/Cache → Purge All)
and re-test. This redirect must work before anything else matters.

Also purge CDN after deploy so old 1-year-cached HTML is evicted.

### 2. Google Search Console (the indexing fix — the part code can't do)

1. **Use a Domain property** (`pdfpixels.com`, verified via DNS TXT record) if you
   haven't. A Domain property covers www + non-www + https in one place. If you only
   have a URL-prefix property for `https://pdfpixels.com` (non-www), add the Domain
   property now — this mismatch is a classic cause of "everything shows excluded".
2. **Sitemaps → submit** `https://www.pdfpixels.com/sitemap.xml`.
3. **URL Inspection** → check `https://www.pdfpixels.com/`, `https://www.pdfpixels.com/tools/compress-pdf`,
   and 2–3 blog posts → **Request Indexing** for each (daily quota is limited; do the
   homepage + top tools first).
4. Watch **Indexing → Pages** over the next 2–4 weeks. Expect "Discovered/Crawled –
   currently not indexed" to shrink gradually as recrawls happen. 25 blog + 60 tool +
   25 use-case + 6 compare pages should move to Indexed progressively.
5. `npm run submit-sitemap` after each content release (IndexNow for Bing/Yandex).

### 3. AdSense re-application

- **Wait 2–3 weeks after indexing improves** before requesting re-review. AdSense
  reviewers see the same "low value" signals Google's indexer sees; a site whose
  pages are actually in Google's index reviews far better. The existing rule of thumb
  in `adsense-rereview-checklist.md` (wait ~14 days between requests) still applies.
- In AdSense, the site is listed as `pdfpixels.com`. The non-www → www redirect is
  fine for AdSense (same root domain). If the "Needs attention" state blocks edits,
  add `www.pdfpixels.com` as the site instead.
- Do NOT add more programmatic pages (more tool variants, more geo hubs) before
  approval — the current ~145 pages are enough surface. Depth and indexing are the
  levers now, not breadth.

## Content strategy going forward (what "low value content" still means for this site)

1. **One page per query.** Before publishing, search your own blog for the topic —
   the Feb 2026 cluster created 3 posts each for "email PDF size" and "200KB" targets,
   which Google read as duplicate mass. Merge (with redirects) rather than multiply.
2. **Publish on a cadence** (1–2 posts/week beats 13 posts in one week then silence —
   the Feb 21–Mar 3 cluster pattern).
3. **Tool pages (~322 words avg) are the next quality tier to improve** if a future
   review fails again: deepen the top 10 revenue-tool pages to 700+ words each with
   genuinely tool-specific detail, not more template scaffolding.
4. Blog word floor: **600 words** (enforced informally by `scripts/wordcount-check.cjs`
   — run it before content releases).

## Handy scripts

- `npm run submit-sitemap` — ping IndexNow with all sitemap URLs (run AFTER deploy)
- `node scripts/wordcount-check.cjs` — blog word-count audit
- `node scripts/remove-posts.cjs <slug>...` — remove a post from `blog.ts` (add a
  301 redirect in `next.config.ts` yourself)
