# SEO/AE0/Geo/AdSense Traffic Plan - TODO

## Step 1: Confirm current SEO baseline (indexing, canonical, sitemap, robots)
- [x] Inspect dynamic routes (tools/blog/compare) for canonical + metadata consistency.
- [x] Inspect dynamic routes (use-cases) for canonical + metadata consistency.
- [x] Validate src/app/sitemap.ts and src/app/robots.ts behavior.

## Step 2: Ensure JSON-LD coverage on all key pages
- [x] Verify tool pages inject rich JSON-LD (WebPage/SoftwareApplication/HowTo/FAQ/Breadcrumb).
- [x] Verify blog post pages inject Article/Breadcrumb/FAQ JSON-LD.
- [x] Add missing JSON-LD on collection/list pages: /tools, /use-cases, /compare (ItemList/CollectionPage).
- [x] (Hardening) Normalize canonical URLs (prefer absoluteUrl) across metadata + JSON-LD.

## Step 3: Strengthen AEO content blocks
- [x] Add direct answer + steps + common problems sections to each tool page.
- [x] Ensure AEO blocks are server-rendered or otherwise indexable (not only client-rendered).

## Step 4: Implement real geo strategy
- [x] Add geo hub pages (e.g., /us/, /uk/, /ca/, /au/, /in/, etc.).
- [x] Add geo-localized copy + region-specific internal linking + country-specific FAQ where accurate.
- [x] Geo hubs now indexable: self-canonical, `index,follow`, full hreflang cluster on home + hubs, and included in sitemap.xml (was previously noindex + canonical-to-root, which made GEO search-invisible).

## Step 5: Improve internal linking and scalable programmatic SEO
- [x] Ensure home → category → tool → related tools is fully indexable.
- [x] Add "Related tools / Next steps / Also try" to tool pages.

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

# Full-codebase audit — Wave 1 (2026-09-16)
- [x] Deduplicate `<title>` on 13 pages (pricing, api-docs, all /compare/*, all geo hubs) that rendered "X | PdfPixels | PdfPixels".
- [x] GEO: geo hubs flipped to indexable + self-canonical; hreflang cluster wired on homepage + hubs; 5 geo URLs added to sitemap.xml (162 -> 167).
- [x] Add og:image to all 25 use-case pages (previously zero social previews).
- [x] Fix 8 broken `relatedTools` refs (id-vs-slug): pdf-compress->compress-pdf (x4), pdf-merge->merge-pdf (x2), pdf-split->split-pdf, jpg-to-pdf->heic-to-jpg. All 308 entries now resolve.
- [x] content-processor: read true image dimensions (new src/lib/image-dims.ts) instead of force-cropping vertical infographics into 800x450.
- [x] Pricing: tool count now computed from allTools.length (was hardcoded "50+", actual 83).

# Full-codebase audit — Wave 2 (2026-09-16)
- [x] A11y: associated ~106 Labels with their controls (htmlFor+id, aria-labelledby for Radix Select / button groups / toggles); fixed dead dropzone button (tabIndex/aria-hidden); focus trap on search dialog; role="menu"->group; breadcrumb "Tools" -> /tools.
- [x] Hydration: AdBanner/MultiplexAd/CookieSettingsButton read browser-only state in useEffect (was rendering different markup server vs client for consented visitors).
- [x] Monetization: ads added to blog list, blog post, and all 6 compare pages (previously zero).
- [x] SEO: BreadcrumbList JSON-LD on compare detail pages.
- [x] AEO: homepage FAQ converted to a server component with native <details>/<summary> so all 10 Q&A pairs are in served HTML (was client-only + answers removed from DOM).

# Full-codebase audit — Wave 3 (2026-09-16)
- [x] Mobile: fixed bottom CTA bar no longer overlaps content — conditional pb-24 on compress/merge/split workspaces, applied only while the bar is visible.
- [x] Perf: ScrollToTop no longer runs an 800ms setInterval forever; replaced with a ResizeObserver that fires only on content-height change.
- [x] Dead code removed: 5 duplicate layout/ components (hero/trust/features/how-it-works/faq), ui/sidebar, ui/chart, ToolSchema export, apiSuccess export, MultiplexAd, ~10 unused performance.ts exports, drop-zone/.testimonial-card/.avatar-ring + --sidebar-* tokens), date-fns + recharts deps.
- [ ] Deferred: real upload progress (XHR.upload.onprogress) — fetch-based uploads are scattered across 15+ workspaces with per-route response handling; convert incrementally to limit regression risk.

# Full-codebase audit — Reliability wave (2026-09-16)
- [x] pdfjs parse bounded by a 20s timeout (was unbounded; crafted PDFs could hang to the 60s maxDuration). Timeout surfaces as HTTP 408 via pdfTextErrorStatus.
- [x] ONNX face-detect session cached per model (was re-created per request) with in-flight dedupe + 20s load / 15s inference timeouts.
- [x] Remote compressor response streamed with a 50MB cap (was unbounded arrayBuffer); 422/error bodies capped at 32KB; 500s now generic.
- [x] qpdf encrypt passwords passed via `@file` response file (mode 0600) instead of process argv; legacy argv retry only for pre-@file qpdf builds; GS fallback preserved.
- [x] ~17 routes stopped echoing raw engine errors on HTTP 500 (Ghostscript stderr, temp paths). New shared `apiInternalError` helper: logs server-side, returns timeout→408, oversize→413, else a generic 500.
- [x] Newsletter concurrent-duplicate race handled (P2002 → "already subscribed" 200 instead of 500).
- [x] `maxDuration = 60` added to ai, image/process, image/ocr, protect, from-image.
- [x] Verified live against the production bundle: protect→200 (25KB encrypted PDF), unlock→200, wrong password→401 INVALID_PASSWORD, rotate→200, bad angle→400 BAD_REQUEST.

# Full-codebase audit — Polish wave (2026-09-16)
- [x] Gated 3 continuous GPU-heavy animations on ≤1024px viewports (mesh-gradient-blobs, badge-gradient, connector-flow join the existing kill-switch; gradients still render statically). Unused cost zero and were left alone.
- [x] Tool-page skeleton now matches each workspace family's container width (max-w-4xl/5xl/6xl mapping for 24 constrained tools; full-width default otherwise) — eliminates the desktop skeleton→workspace width shift. Verified in served HTML.
- [x] ssr:false evaluation complete (see note below). No code change: simply removing ssr:false would make served HTML EMPTIER (workspaces render null without activeTool), and render-phase store init would leak across SSR requests (module singleton). Workspaces themselves are render-safe (no module-scope or render-time browser APIs; all access is in handlers/effects).

# SEO/AEO/GEO distribution audit (2026-09-24)
- [x] Verified already in place: IndexNow (key file + batch submitter to Bing endpoint covering Bing/Yandex/Naver/Seznam), Google/Bing/Yandex verification (meta tags via .env + files in public/), llms.txt + llms-full.txt (limits pulled from src/lib/limits.ts, reviewed 2026-09-23), .well-known/ai-plugin.json, RSS /feed with media namespace, image sitemap (blog covers + all tool OG images), BlogPosting/Breadcrumb/FAQ schemas with dateModified, max-image-preview:large, robots Host directive, hreflang clusters (geo hubs + de-DE/fr-FR/ja-JP tool packs), blog freshness (newest post Sep 20, 2026).
- [x] robots.ts: allow 9 more AI answer-engine crawlers — Perplexity-User (live-fetch agent; blocking it loses Perplexity citations), CCBot, YouBot, Amazonbot, Google-CloudVertexBot, Meta-WebIndexer, Diffbot, Cohere-ai, iaskspider. 23 agent rules total.
- [x] Google Discover: 11 blog hero covers upscaled from 640x640/1024x1024 to >=1280px wide (Google guidance: at least 1200px wide; small images rarely surface). coverImageDimensions synced in blog.ts. Verified og:image:width=1280 in prerendered post HTML.
- [x] ai-plugin.json: max_pdf_size_mb 25 -> 50 (stale vs description_for_model + actual 50MB limit from e1940ca).
- [ ] Operator actions (cannot be done from code): keep publishing fresh posts on a steady cadence (Discover is heavily freshness-driven), resubmit sitemap in GSC after deploys when many URLs change, run npm run submit-sitemap after content waves (IndexNow), and submit to Bing Webmaster Tools + Yandex Webmaster if not yet done.

# ssr:false → SSR content: DONE (2026-09-24)
- Approach: per-request initial tool via React context (new `src/hooks/use-active-tool.ts`: `ToolContext` + `useActiveTool()` merge hook) provided by ToolPageClient from page props. Prerender reads the context value; the global Zustand singleton is never written during SSR, so concurrent SSRs cannot cross-pollinate. Store still hydrated post-mount via the existing useLayoutEffect for selector-based consumers.
- Removed `ssr: false` from all 37 dynamic workspace imports in `tool-page-client.tsx`.
- Swapped `useAppStore()` → `useActiveTool()` in the 19 workspaces that destructure `activeTool` (+ tool-page-header badge lookup). Other store consumers (nav/footer/tool-card/tools-client) untouched.
- Payoff shipped: real tool header (H1), dropzone, controls, and limits now in served HTML on all 83 tool pages (in the streamed resolved boundary + inline $RC swap; skeleton only as transient fallback).
- Verified: tsc clean, eslint 0 errors, `next build` 232/232 pages, prerender sweep (83/83 tool pages contain tool-hero-title H1 + workspace markup, 0 skeletons), live `next start` smoke on /tools/merge-pdf → 200 with dropzone + limits in served HTML.
- Windows-only note: `next build` intermittently fails in the standalone-copy step with `EBUSY` on a freshly-written file (Defender real-time scan race; failed file differs per run). Core build output is complete; rerunning `postbuild.mjs` and/or manual copy completes `.next/standalone`. Does not affect Linux/CI builds.

# Audit follow-ups — verification & remaining fixes (2026-09-16)
- [x] JPEG EOI truncation claim VERIFIED FALSE — `result.subarray(0, Math.max(targetBytes, result.length))` always returns the full buffer (loop guarantees length ≥ target). No change; audit reasoning was backwards (Math.max, not min).
- [x] ai-plugin.json AVIF/batch claims VERIFIED ACCURATE — sharp AVIF encode+decode, AVIF in convert UI + category blurb, multi-file tools take 20–30 files. No change.
- [x] 8 PDF tools (sign/redact/flatten/crop/extract/fill/grayscale/pdf-to-text) flipped processing:'client'→'server' — all 8 workspaces POST to server APIs, and OG images, content sections, headers, badges, and llms.txt were falsely claiming browser processing.
- [x] Extracted shared src/lib/qpdf.ts (candidates + runner + unavailable detection); protect + linearize rewired with preserved per-route timeout messages. Verified live: linearize→200 via GS fallback.
- [x] Verified: tsc clean, eslint 0 errors, build green (211 pages), test:tools exit 0, live smoke (protect/unlock/rotate/to-text/linearize) all 200 with valid PDFs.

# Tool suite expansion to iLovePDF parity (2026-09-24)
- [x] 7 new tools (87 -> 90 total, all working end-to-end):
  - Excel to PDF (`excel-to-pdf`) -- LibreOffice conversion (xlsx/xls/csv), CSV-table fallback via headers when LibreOffice is missing; own workspace file.
  - PowerPoint to PDF (`powerpoint-to-pdf`) -- LibreOffice conversion (pptx/ppt); own workspace file.
  - PDF to PowerPoint (`pdf-to-pptx`) -- Ghostscript 150-DPI page render -> pptxgenjs slides (new server-only dep, capped at 300 pages).
  - Repair PDF (`repair-pdf`) -- progressive pdf-lib tolerant load (standard -> lenient flags -> trimmed byte windows), honest 422 when unrecoverable.
  - Resize PDF (`resize-pdf`) -- A4/A3/A5/Letter/Legal page boxes, auto/forced orientation.
  - N-up PDF (`pdf-n-up`) -- 2-up / 4-up / 6-up layouts with margins and LTR order.
  - PDF Metadata (`pdf-metadata`) -- view current Title/Author/Subject/Keywords, edit all four.
- [x] Professional organization: single 38-tool `pdf-tools` category split into 5 focused hubs (iLovePDF-style mental model) placed right after `most-used`:
  - `pdf-organize` (merge/split/reorder/delete-pages/extract/rotate/page-numbers/bates/crop/n-up/resize)
  - `pdf-optimize` (compress + KB presets/linearize/grayscale/flatten/to-pdfa/sanitize/cmyk/repair)
  - `pdf-convert` (to-image/to-word/to-excel/to-pptx/to-text/word/excel/powerpoint/image/heic conversions)
  - `pdf-edit` (sign/redact/fill/watermark/compare/metadata)
  - `pdf-security` (protect/unlock)
- [x] Permanent redirect `/tools/category/pdf-tools` -> `/tools/category/pdf-organize` in `next.config.ts`; sitemap/llms.txt/llms-full.txt/AI plugin regenerate automatically from `toolCategories`.
- [x] AEO content (`tool-content-data.ts`): direct answers/steps/common problems/FAQs for all 7 new tools (drives AEO cards + HowTo/FAQ JSON-LD).
- [x] Bug fixes found during verification:
  - ByteString ByteString crash: `x-compress-note` response header contained an em dash (U+2014) -- headers must be latin1-safe, so any user uploading an already-optimized PDF got a 500 instead of their PDF. Replaced with a plain hyphen (both occurrences); repo-wide scanner confirmed all headers latin1-safe.
  - Corrupt-file 500s on PDF edit routes: pdf-lib silently "loads" garbage-after-magic files yielding an undefined catalog; hardened the shared `openEditablePdf` helper to probe page count and return 400 mapped errors -- fixes all edit routes at once.
  - Minor: unused import in metadata route, missing NextResponse import in repair route, variable fixes in to-pptx route.
- [x] Verification (all green): tsc clean, eslint 0 errors, `next build` green at 250 pages, all 7 prerendered tool pages contain tool-hero-title H1, all 5 category hubs prerender, old category URL 308 -> new URL, `npm run test:tools` passes, fixture smoke test (generated xlsx/pptx/csv fixtures) passed for all 7 new APIs including corrupt-input 4xx handling, prerender sweep clean.
- [ ] Operator notes: new hub pages will need a GSC sitemap refresh on next deploy; run npm run submit-sitemap after deploying this wave.
