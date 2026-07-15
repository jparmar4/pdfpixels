# SEO/AE0/Geo/AdSense Traffic Plan - TODO

## Step 1: Confirm current SEO baseline (indexing, canonical, sitemap, robots)
- [x] Inspect dynamic routes (tools/blog/compare) for canonical + metadata consistency.
- [x] Inspect dynamic routes (use-cases) for canonical + metadata consistency.
- [ ] Validate src/app/sitemap.ts and src/app/robots.ts behavior.

## Step 2: Ensure JSON-LD coverage on all key pages
- [x] Verify tool pages inject rich JSON-LD (WebPage/SoftwareApplication/HowTo/FAQ/Breadcrumb).
- [x] Verify blog post pages inject Article/Breadcrumb/FAQ JSON-LD.
- [x] Add missing JSON-LD on collection/list pages: /tools, /use-cases, /compare (ItemList/CollectionPage).
- [x] (Hardening) Normalize canonical URLs (prefer absoluteUrl) across metadata + JSON-LD.

## Step 3: Strengthen AEO content blocks
- [x] Add �direct answer + steps + common problems� sections to each tool page.
- [x] Ensure AEO blocks are server-rendered or otherwise indexable (not only client-rendered).

## Step 4: Implement real geo strategy
- [x] Add geo hub pages (e.g., /us/, /uk/, /ca/, /au/, /in/, etc.).
- [x] Add geo-localized copy + region-specific internal linking + country-specific FAQ where accurate.

## Step 5: Improve internal linking and scalable programmatic SEO
- [x] Ensure home ? category ? tool ? related tools is fully indexable.
- [x] Add �Related tools / Next steps / Also try� to tool pages.

## Step 6: AdSense approval readiness
- [x] Confirm required pages are present and indexable: Privacy, Terms, Contact, DMCA.
- [x] Review ad script loading strategy to ensure no layout shift (CLS).

## Step 7: Validate and iterate
- [x] **Step 7 (Validation):** Perform Lighthouse audits for Core Web Vitals and iterate based on Search Console data. (Home page CLS fixed to 0.0)

# Phase 6: Launch & Growth - TODO
- [ ] Implement Analytics & Tracking (Google Analytics / Search Console).
- [ ] Submit XML sitemap to Google Search Console.
- [ ] Review social sharing (Open Graph images) for all tools and blog posts.

# Tool reliability (2026-07 follow-up)
- [x] Add Logo to Image (client canvas overlay: position, scale, opacity, padding)
- [x] Edit Metadata (Title/Author/Copyright/Description + PNG tEXt / JPEG COM export)
- [x] Page-range parsing for rotate/delete/split
- [x] Resize enlargement + DPI density
- [x] Increase image size (target KB pad path)
- [x] Protect/Unlock binary PDF download
- [x] Convert workspace PDF format lock + blob cleanup
- [x] AEO answer cards expanded + geo in llms-full.txt
