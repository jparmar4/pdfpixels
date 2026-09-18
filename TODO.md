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
- [x] Add �direct answer + steps + common problems� sections to each tool page.
- [x] Ensure AEO blocks are server-rendered or otherwise indexable (not only client-rendered).

## Step 4: Implement real geo strategy
- [x] Add geo hub pages (e.g., /us/, /uk/, /ca/, /au/, /in/, etc.).
- [x] Add geo-localized copy + region-specific internal linking + country-specific FAQ where accurate.
- [x] Geo hubs now indexable: self-canonical, `index,follow`, full hreflang cluster on home + hubs, and included in sitemap.xml (was previously noindex + canonical-to-root, which made GEO search-invisible).

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
- [x] Dead code removed: 5 duplicate layout/ components (hero/trust/features/how-it-works/faq), ui/sidebar, ui/chart, ToolSchema export, apiSuccess export, MultiplexAd, ~10 unused performance.ts exports, dead CSS (.drop-zone/.testimonial-card/.avatar-ring + --sidebar-* tokens), date-fns + recharts deps.
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
- [x] Gated 3 continuous GPU-heavy animations on ≤1024px viewports (mesh-gradient-blobs, badge-gradient, connector-flow join the existing kill-switch; gradients still render statically). Unused animation classes cost zero runtime and were left alone.
- [x] Tool-page skeleton now matches each workspace family's container width (max-w-4xl/5xl/6xl mapping for 24 constrained tools; full-width default otherwise) — eliminates the desktop skeleton→workspace width shift. Verified in served HTML.
- [x] ssr:false evaluation complete (see note below). No code change: simply removing ssr:false would make served HTML EMPTIER (workspaces render null without activeTool), and render-phase store init would leak across SSR requests (module singleton). Workspaces themselves are render-safe (no module-scope or render-time browser APIs; all access is in handlers/effects).

# ssr:false → SSR content: designed follow-up (not started)
- Prerequisite: per-request Zustand store isolation (createStore + React context provider, initialized with activeTool from page props) so concurrent SSRs cannot cross-pollinate tool headers.
- Then: pass toolId/toolName/toolDescription as workspace props for the initial gate (keep the store for post-mount interactivity), drop ssr:false, and let `next build` self-validate (any render-time browser API fails that page's prerender loudly).
- Expected payoff: real dropzone UI in served HTML on all 83 tool pages (LCP + no-JS + AEO), at the cost of a careful 35-file migration with build-validated testing.

# Audit follow-ups — verification & remaining fixes (2026-09-16)
- [x] JPEG EOI truncation claim VERIFIED FALSE — `result.subarray(0, Math.max(targetBytes, result.length))` always returns the full buffer (loop guarantees length ≥ target). No change; audit reasoning was backwards (Math.max, not min).
- [x] ai-plugin.json AVIF/batch claims VERIFIED ACCURATE — sharp AVIF encode+decode, AVIF in convert UI + category blurb, multi-file tools take 20–30 files. No change.
- [x] 8 PDF tools (sign/redact/flatten/crop/extract/fill/grayscale/pdf-to-text) flipped processing:'client'→'server' — all 8 workspaces POST to server APIs, and OG images, content sections, headers, badges, and llms.txt were falsely claiming browser processing.
- [x] Extracted shared src/lib/qpdf.ts (candidates + runner + unavailable detection); protect + linearize rewired with preserved per-route timeout messages. Verified live: linearize→200 via GS fallback.
- [x] Verified: tsc clean, eslint 0 errors, build green (211 pages), test:tools exit 0, live smoke (protect/unlock/rotate/to-text/linearize) all 200 with valid PDFs.
