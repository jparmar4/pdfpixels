# AdSense re-review checklist (PdfPixels)

Google has already rejected this site multiple times. Do **not** request another review the same day you deploy. Fix, publish, wait, then retry.

Typical reason for a tools site: **Valuable Inventory — low value / not enough unique content**. Reviewers also flag fake social proof, broken numbers, and “Pro” claims on a free site.

## What we just fixed in code

- Crawlers no longer see **0+ tools** / **0.9% uptime** (counters start at the real number).
- Removed **“Join 1,250+ happy users”** fake avatars.
- Removed **“New Pro Tool”** wording (there is no paid Pro checkout).
- Removed unverifiable **99.9% uptime**.
- Removed fabricated blog star ratings and fictional author names.
- Privacy policy now includes Google’s required **partner-sites** disclosure.
- About page names the operator and how ads will fund the site.
- Tool copy no longer promises batch/in-browser behavior the UI does not have.

## 1. Deploy

- [ ] Commit and deploy to production (the live homepage is what AdSense reviews).
- [ ] Hard-refresh `https://www.pdfpixels.com/` in incognito.
- [ ] Confirm the hero does **not** say “Pro Tool”.
- [ ] Confirm stats are **not** “0+” / “0.9%”.
- [ ] Confirm the bottom CTA does **not** say “happy users” with fake initials.
- [ ] Open `/about` and confirm operator + “how the site stays free”.
- [ ] Open `/privacy` and confirm the Google partner-sites link.
- [ ] Open `/contact` and submit a test message (or at least confirm the form posts).
- [ ] Open `/blog` and one long guide. Scroll the whole article.
- [ ] Confirm new unique guides load:
  - `/blog/add-confidential-watermark-to-pdf`
  - `/blog/webp-vs-jpg-vs-png-which-format`
- [ ] Open `/tools/compress-pdf` and scroll past the tool to the editorial sections.

## 2. Wait (this is the part people skip)

- [ ] Wait **14 days** after production is stable.
- [ ] Get some real visits if you can (share 2–3 useful blog posts). Empty brand-new traffic still looks weak.
- [ ] Do **not** request review three days in a row.

## 3. Request review

AdSense → **Sites** → pdfpixels.com → **Request review**

You usually cannot write a long appeal. The site has to speak for itself.

## 4. If it is rejected again

Ask yourself which email reason they used:

| Reason | What to do next |
|---|---|
| Low value / not enough content | Add 2 more **unique** guides that are not PDF-compression clones. Make the thinnest tool pages longer and more specific. |
| Site not ready / under construction | Fix any “0+”, Coming soon, empty categories, or broken tools. |
| Navigation | Check every footer and menu link. |
| Privacy | Confirm `/privacy` is linked in the footer and mentions AdSense + partner-sites. |

Do **not** invent user counts, star ratings, or fake authors again. That will keep you rejected.
