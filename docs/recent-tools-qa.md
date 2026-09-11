# Recent document tools: reliability review

Reviewed the tools introduced in commits `4372564` and `8d1d7ab`.

## Changes

- Shared PDF.js text extraction replaces raw-stream regular expressions in text, Word, Excel, bank-statement, and comparison routes. Scans return an actionable error rather than fake content or a misleading identical comparison.
- Comparison processes complete inputs within an explicit work limit instead of silently dropping lines after 500.
- Bank exports preserve comma-separated monetary values and ISO dates. Empty extraction fails visibly. Preview no longer assumes US dollars. Generic Excel retains leading-zero identifiers and long numeric strings.
- Redaction rebuilds all pages from 150-DPI pixels after covering selected regions. Original text streams, attachments, and metadata are absent. Form appearances are flattened before covering; annotations are removed. Unsupported rotated/offset pages and excessive dimensions fail explicitly.
- Sanitization removes the Info dictionary, custom properties, and PDF XMP objects, including their saved bytes. It is not a comprehensive anonymizer; page content, attachments, comments, layers, and embedded image metadata need separate review.
- Crop rejects invalid selections and empty crop areas, respects an existing crop origin, and retains the MediaBox. Signing/filling/flattening stop on failures instead of returning partially modified files as successes.
- Bates numbering accepts zero, validates sequence bounds, and fits labels within page width. HEIC uploads enforce limits and preserve auto-mode image proportions with margins.
- PDF/A includes an sRGB output intent and aborts on Ghostscript conformance incompatibilities. Removed an unsupported KDP-ready certification header from CMYK output.
- Compression never returns a larger file. Target-size pages report whether the requested limit was met; a quality preset cannot guarantee a particular size.
- Basic Word-to-PDF preserves supported accented characters and reports unsupported characters rather than substituting question marks. Product copy describes its layout limitations.

## Verification

`npm run test:tools` requires Node 22.15+ (Node 24 used here) and Ghostscript. It generates fixtures in ignored `tmp/pdfs/recent-tools/` and exercises real route handlers, PDF reopening, extraction, spreadsheet/document XML, form values, metadata bytes, comparisons beyond 500 lines, signature/compression output, and invalid inputs.

Additional checks: production build and TypeScript, ESLint on changed files, rendered redaction/Bates/HEIC samples, and HTTP requests to the standalone production server for text extraction and a real HEIC photo. The HEIC sample came from the heic-convert project's published test fixture list and is not committed.

## Deployment and remaining limits

- Install the updated lockfile and rebuild standalone output so PDF.js, its worker, fonts, and CMaps are included.
- Ghostscript is required for redaction, grayscale, CMYK, and PDF/A. Set `GHOSTSCRIPT_PATH` when it is not discoverable. PDF/A needs an sRGB ICC profile; set `PDFA_ICC_PROFILE` if the standard installation paths are unavailable.
- PDF/A structure and rendering were checked, but independent veraPDF certification was not performed. CMYK conversion does not certify print-provider requirements.
- Bank parsing is heuristic: unsigned single amounts are treated as credits. Review debit/credit direction against the original statement. Complex tables, scanned documents, and exact Word layout preservation remain outside the basic converters' capabilities.
- Local checks do not establish production-server binary availability or cover every PDF/HEIC variant. No deployment was performed.

Suggested commit message: `fix(pdf): improve recent tool output reliability and secure redaction`
