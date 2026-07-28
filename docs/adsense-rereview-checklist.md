# AdSense re-review checklist (PdfPixels)

Use this after deploying content-quality fixes. Do **not** request review the same day as deploy.

## 1. Deploy

- [ ] Commit all content/SEO changes on `main`
- [ ] Push to origin and confirm production build succeeds (Railway/hosting)
- [ ] Hard-refresh production and confirm new UI (no fake star testimonials on home)
- [ ] Spot-check one use-case, one compare page, one geo page (`/in` or `/us`)
- [ ] Confirm new blog posts load:
  - `/blog/password-protect-pdf-online-free`
  - `/blog/add-page-numbers-to-pdf-online`
  - `/blog/remove-exif-gps-data-from-photos`
  - `/blog/image-dpi-for-print-vs-web-explained`
- [ ] Confirm `/pricing` is honest free messaging (no fake Pro checkout)
- [ ] Confirm `/api-docs` is `noindex` if still not a primary product surface

## 2. Quality smoke test (reviewer perspective)

Visit these cold (incognito):

| URL | What should look good |
|-----|------------------------|
| `/` | Real workflows + guides section; no fake reviews |
| `/about` | Clear product story + contact path |
| `/contact` | Working form |
| `/privacy` | Ads/cookies disclosed accurately |
| `/blog` + 1 long article | Substantial original writing |
| `/tools/compress-pdf` | Tool + unique editorial sections |
| `/use-cases/...` | Unique steps/tips (not empty template) |
| `/compare/...` | Balanced overview + differences |

Avoid clicking only tool empty states — scroll to editorial content.

## 3. Search Console (optional but useful)

- [ ] Submit/refresh sitemap: `https://www.pdfpixels.com/sitemap.xml`
- [ ] Request indexing for homepage + 2–3 strong blog posts after deploy
- [ ] Confirm noindex pages you expect (404, api-docs) are not prioritized

## 4. Wait before review

- [ ] Wait **7–14 days** after production is stable
- [ ] Prefer some real organic visits if possible (share useful blog posts)
- [ ] Fix any broken tools discovered in the wait window

## 5. Request AdSense review

In AdSense: **Sites → your site → Request review**

Notes to yourself (not a form field):

- Low-value content addressed: unique guides, honest pricing, removed fabricated testimonials/ratings
- Primary content: free tools + how-to articles for real file tasks

## 6. If rejected again

- Add 2 more unique guides outside PDF-compression
- Improve thinnest tool pages still on fallback-only content
- Reduce ad-like density / ensure content above ad slots
- Check for broken links, empty categories, or “under construction” feel
- Do **not** spam review requests; fix, wait, then retry
