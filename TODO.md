# SEO/AE0/Geo/AdSense Traffic Plan - TODO

## Step 1: Confirm current SEO baseline (indexing, canonical, sitemap, robots)
- [x] Inspect dynamic routes (tools/blog/compare) for canonical + metadata consistency.
- [x] Inspect dynamic routes (use-cases) for canonical + metadata consistency.
- [ ] Validate `src/app/sitemap.ts` and `src/app/robots.ts` behavior.



## Step 2: Ensure JSON-LD coverage on all key pages
- [ ] Verify tool pages inject `ToolSchema` and tool-specific FAQ JSON-LD.
- [ ] Add missing JSON-LD on category pages, compare pages, and use-case pages.

## Step 3: Strengthen AEO content blocks
- [ ] Add “direct answer + steps + common problems” sections to each tool page.
- [ ] Ensure AEO blocks are server-rendered or otherwise indexable (not only client-rendered).

## Step 4: Implement real geo strategy
- [ ] Add geo hub pages (e.g., `/us/`, `/uk/`, `/ca/`, `/au/`, `/in/`, etc.).
- [ ] Add geo-localized copy + region-specific internal linking + country-specific FAQ where accurate.

## Step 5: Improve internal linking and scalable programmatic SEO
- [ ] Ensure home → category → tool → related tools is fully indexable.
- [ ] Add “Related tools / Next steps / Also try” to tool pages.

## Step 6: AdSense approval readiness
- [ ] Confirm required pages are present and indexable: Privacy, Terms, Contact, DMCA.
- [ ] Review ad script loading so it doesn’t block main content.

## Step 7: Validate and iterate
- [ ] Run Lighthouse + ensure Core Web Vitals are strong.
- [ ] Use Search Console data to iterate titles/meta/sections.

