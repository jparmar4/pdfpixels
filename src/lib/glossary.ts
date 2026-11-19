// Glossary data — PDF/image terminology for topical authority and long-tail search.
// Each entry links to the tools that put the concept into practice.

export interface GlossaryTerm {
  slug: string;
  term: string;
  category: 'formats' | 'processing' | 'security' | 'business';
  shortDef: string;
  body: string[]; // paragraphs
  relatedTools: string[];
  relatedTerms: string[];
}

export const glossaryTerms: GlossaryTerm[] = [
  {
    slug: 'what-is-pdf-a',
    term: 'PDF/A',
    category: 'formats',
    shortDef: 'An ISO-standardized PDF variant for long-term archiving that embeds fonts, forbids external dependencies, and guarantees identical rendering decades later.',
    body: [
      'PDF/A (ISO 19005) is a strict subset of the PDF format designed for archiving. A PDF/A file must be fully self-contained: every font it uses is embedded, colors are specified unambiguously, and features that depend on external state — JavaScript, audio/video, external file references — are forbidden. The point is durability: a PDF/A document opened in twenty years renders exactly as it does today, on any conforming viewer.',
      'There are conformance levels: PDF/A-1 (basic), PDF/A-2 (adds JPEG 2000 compression, transparency, and optional Unicode text requirements), and PDF/A-3 (which bizarrely allows embedding any file type, commonly used for embedded source data in e-invoicing). Courts, government portals, libraries, and e-invoicing mandates across the EU increasingly require PDF/A because archives only stay trustworthy if the format cannot silently degrade.',
      'Converting a regular PDF to PDF/A (via the pdfa tool) embeds missing fonts and normalizes color — which is also why a converted file can grow in size: self-containment has a cost.',
    ],
    relatedTools: ['pdf-to-pdfa'],
    relatedTerms: ['what-is-acroform', 'what-is-ghostscript'],
  },
  {
    slug: 'what-is-ocr',
    term: 'OCR',
    category: 'processing',
    shortDef: 'Optical Character Recognition — software that reads the shapes of characters in images (scans, photos) and converts them into machine-encoded text.',
    body: [
      'OCR (Optical Character Recognition) is the bridge between pixels and text. A scanned page is just a photograph: selectable "characters" do not exist until OCR analyzes the shapes, matches them against trained models (modern engines like Tesseract use LSTM neural networks), and writes recognized text back onto the page as an invisible, searchable layer.',
      'OCR accuracy depends on the source: straight, clean, 300 DPI laser-printed pages convert near-perfectly; handwriting, stamps, faxes, and skewed photos degrade quickly. OCR output is therefore always a proofreading step, not a guaranteed transcription.',
      'For PDF workflows, OCR is the necessary detour before any meaningful conversion: a "PDF to Word" conversion of a scanned file without OCR just wraps images in a .docx. Run OCR first, then convert — and check numbers character by character, because a transposed digit is more expensive than a missed letter.',
    ],
    relatedTools: ['ocr-pdf', 'pdf-to-word', 'scan-to-pdf'],
    relatedTerms: ['what-is-dpi', 'what-is-rasterize'],
  },
  {
    slug: 'what-is-acroform',
    term: 'AcroForm',
    category: 'formats',
    shortDef: 'The standard PDF technology for interactive form fields — text boxes, checkboxes, and dropdowns that a user can fill inside a PDF viewer.',
    body: [
      'AcroForm is the PDF specification\u2019s native form technology: fields defined as dictionary objects (text fields, checkboxes, radio groups, dropdowns, signature fields) overlaid on page content. When you open a form from the IRS or a vendor portal and see highlighted boxes you can tab through, that is an AcroForm.',
      'Filled AcroForm values live in a separate layer from the page content until the form is flattened. That is why some portals reject "unflattened" PDFs: the viewer that renders your file must support form fields to display your answers. Flattening bakes the field values into the page itself, making them visible everywhere and unchangeable.',
      'Older XFA forms (an Adobe-proprietary XML technology) look similar but are deprecated; most viewers other than Acrobat cannot render them. Modern fillable PDFs are AcroForm-based.',
    ],
    relatedTools: ['fill-pdf', 'flatten-pdf', 'fill-sign-irs-w9-pdf'],
    relatedTerms: ['what-is-flatten-pdf'],
  },
  {
    slug: 'what-is-flatten-pdf',
    term: 'Flatten PDF',
    category: 'processing',
    shortDef: 'Baking interactive form fields, annotations, and layers into the page content so they render identically everywhere and cannot be altered.',
    body: [
      'Flattening converts dynamic PDF objects into fixed page content. Filled form fields become printed text, signature images become page graphics, and optional content groups collapse. After flattening, the file looks identical in every viewer — including ones with poor form support — and nobody can accidentally change what you filled in.',
      'The operation exists because PDF form values are stored separately from the visible page. A filled form sent unflattened can appear empty in viewers that ignore form data, and values remain editable by whoever receives them. Government portals, HR systems, and court filing services commonly require flattened files for exactly these reasons.',
      'Flattening is one-way: interactive fields are gone afterward, so keep your fillable original if you expect to revise the document.',
    ],
    relatedTools: ['flatten-pdf', 'fill-pdf', 'fill-sign-irs-w9-pdf'],
    relatedTerms: ['what-is-acroform', 'what-is-incremental-save'],
  },
  {
    slug: 'what-is-rasterize',
    term: 'Rasterize',
    category: 'processing',
    shortDef: 'Converting vector content (text, shapes) into a grid of pixels — a snapshot of the page rather than the page itself.',
    body: [
      'Rasterizing renders a PDF page into a fixed-resolution image (150 DPI, 300 DPI, etc.). Everything becomes pixels: text stops being selectable, file sizes balloon at high resolutions, and zooming reveals blur instead of crisp glyphs.',
      'It is sometimes exactly the right operation. Security redaction rasterizes pages so hidden text layers can never leak, image-to-PDF conversions rasterize by nature, and print pipelines rasterize exotic effects for consistency. The professional rule: rasterize when you need certainty or images, keep vector when you need selectable text and small files.',
      'Resolution choice matters: 150 DPI is the sweet spot for screen-readable rasterized pages; 300 DPI is print quality; anything higher mostly grows the file without visible benefit.',
    ],
    relatedTools: ['redact-pdf', 'pdf-to-jpg', 'ocr-pdf'],
    relatedTerms: ['what-is-dpi', 'what-is-vector-vs-raster'],
  },
  {
    slug: 'what-is-vector-vs-raster',
    term: 'Vector vs Raster',
    category: 'processing',
    shortDef: 'Vector graphics are mathematical descriptions (lines, curves, glyphs) that stay sharp at any zoom; raster graphics are fixed pixel grids that blur when enlarged.',
    body: [
      'A PDF can contain both. Text, lines, and geometric shapes are vector objects — drawn from mathematical descriptions, so a 10× zoom renders them perfectly and they print razor-sharp. Photos and scans are raster images — grids of colored pixels with a fixed resolution.',
      'The distinction drives everyday PDF outcomes: compressing a text-heavy page barely shrinks it (vector text recompresses losslessly), while photo-heavy pages shrink dramatically (images are resampled). Converting a PDF to JPG rasterizes everything — fine for sharing, fatal for future text editing.',
      'When a tool claims "vector cropping" or "vector output," it means the operation preserves the mathematical objects instead of taking a pixel snapshot — which is why barcodes stay scannable and text stays selectable.',
    ],
    relatedTools: ['compress-pdf', 'pdf-to-jpg', 'extract-pdf-images'],
    relatedTerms: ['what-is-dpi', 'what-is-rasterize'],
  },
  {
    slug: 'what-is-dpi',
    term: 'DPI',
    category: 'processing',
    shortDef: 'Dots per inch — the density of pixels or printed dots. Higher DPI means more detail and larger files; 300 DPI is the print standard.',
    body: [
      'DPI (dots per inch) measures resolution: how many individual dots fit into one inch. A 2550×3300 pixel image printed at 300 DPI fills a Letter page crisply; the same image at 72 DPI spans nearly five feet and looks soft up close.',
      'The practical thresholds: 72–96 DPI for screens, 150 DPI for readable scanned documents and internal printing, 300 DPI for professional print, 600+ for fine detail like line art. Government photo specs (passports, exams) are quoted in DPI because identity photos fail at low resolution.',
      'DPI only has meaning relative to physical size — a 1200×1800 pixel image is 300 DPI at 4×6 inches and 150 DPI at 8×12. Tools that quote DPI without pixel dimensions are telling you half the story.',
    ],
    relatedTools: ['resize-image', 'convert-dpi', 'passport-size-photo'],
    relatedTerms: ['what-is-rasterize'],
  },
  {
    slug: 'what-is-ghostscript',
    term: 'Ghostscript',
    category: 'processing',
    shortDef: 'The open-source PostScript and PDF interpreter that powers much of the world\u2019s PDF processing — rendering, conversion, and compression backends alike.',
    body: [
      'Ghostscript is a decades-old open-source interpreter for PostScript and PDF. It renders PDF pages to images, converts between formats, applies compression, and enforces PDF/A structure. Most "PDF engine" claims in software — including many commercial tools — end up calling Ghostscript or reimplementing parts of it.',
      'For compression, its power is selective reprocessing: resampling only the images inside a PDF while leaving vector text untouched, downsampling at controlled quality steps. That is why a Ghostscript-backed compressor can hit aggressive size targets without visibly damaging text.',
      'Running Ghostscript server-side (as PdfPixels does for heavy operations) keeps the browser light for everyday tasks while reserving the heavy interpreter for jobs that need it.',
    ],
    relatedTools: ['compress-pdf', 'pdf-to-pdfa', 'pdf-to-jpg'],
    relatedTerms: ['what-is-pdf-a', 'what-is-lossless-vs-lossy'],
  },
  {
    slug: 'what-is-lossless-vs-lossy',
    term: 'Lossless vs Lossy',
    category: 'processing',
    shortDef: 'Lossless compression reconstructs the exact original data; lossy compression discards detail the viewer is least likely to miss in exchange for much smaller files.',
    body: [
      'Lossless compression (ZIP-style algorithms, PNG, FLAC) is reversible: decompress and you get bit-identical data. Lossy compression (JPEG, most video) permanently discards information — arranged to discard what human perception misses first — achieving 5–20× better ratios.',
      'In PDF terms: text is always compressed losslessly (nobody accepts altered letters), images can go either way. JPEG quality 80 typically halves file size versus quality 95 with little visible change; below ~60, artifacts appear around high-contrast edges — the classic "JPEG fuzz".',
      'The compression decision is really a purpose decision: an archival master stays lossless; an email attachment goes lossy until it fits under the limit. Smart compressors iterate the lossy knob (image quality) until the file lands on target — which is how exact-KB compression presets work.',
    ],
    relatedTools: ['compress-pdf', 'compress-image', 'compress-pdf-to-200kb'],
    relatedTerms: ['what-is-ghostscript'],
  },
  {
    slug: 'what-is-pdf-ua',
    term: 'PDF/UA',
    category: 'formats',
    shortDef: 'The PDF Universal Accessibility standard (ISO 14289) — tagged PDF structure that screen readers can navigate reliably.',
    body: [
      'PDF/UA (Universal Accessibility, ISO 14289) defines how a PDF must be structured for assistive technology: a complete tag tree marking headings, lists, tables, and reading order; alternative text for images; document language and title metadata; and reliable tab order for forms.',
      'Accessibility tags are separate from the visual content — a beautifully designed PDF can be invisible chaos to a screen reader if its tag structure is missing or wrong. Regulations increasingly assume tagged documents: ADA-related requirements in the US, EN 301 549 procurement in the EU.',
      'A checker inspects the structural requirements (title, language tag, display doc title flag, tab order) and can auto-fix the metadata-level items; content-level fixes like alternative text need a human who knows what each image means.',
    ],
    relatedTools: ['pdf-accessibility-checker'],
    relatedTerms: ['what-is-acroform'],
  },
  {
    slug: 'what-is-bates-numbering',
    term: 'Bates Numbering',
    category: 'business',
    shortDef: 'The legal-industry convention of stamping unique sequential identifiers (PAGE 0001, DEP_0042) across every page of a document set for citation and integrity.',
    body: [
      'Bates numbering stamps a unique, sequential identifier on every page of a document collection — traditionally via a mechanical wheel ("Bates stamper"), now digitally. Litigation support, discovery productions, medical records, and regulatory filings rely on it because "see page 000347 of the production" only works if every page is uniquely and immutably labeled.',
      'Professional Bates stamps include more than page numbers: prefixes and suffixes encode case and exhibit identifiers (ABC_000123_DEF), and dates or confidentiality legends ride along in the stamp area.',
      'Digital Bates numbering must survive re-production: the stamp becomes part of the page (usually in a margin), applied in a defined order, so page references cannot shift when documents are combined or split later.',
    ],
    relatedTools: ['bates-numbering-pdf', 'merge-pdf'],
    relatedTerms: ['what-is-flatten-pdf'],
  },
  {
    slug: 'what-is-digital-signature',
    term: 'Digital vs Electronic Signature',
    category: 'security',
    shortDef: 'An electronic signature is any digital mark showing intent (typed, drawn); a digital signature is cryptographic, certificate-bound, and tamper-evident.',
    body: [
      'The terms are not synonyms. An electronic signature is the broad legal concept — under the US ESIGN Act and EU eIDAS, a typed name, drawn signature, or clicked "I agree" all qualify as e-signatures with legal force. A digital signature is a specific technology: a cryptographic hash of the document encrypted with a certificate-backed private key, making any later alteration detectable.',
      'Most everyday contracts need only a simple electronic signature — which is why free browser signing is legally sufficient for leases, NDAs, and vendor forms. Advanced/qualified electronic signatures (the eIDAS tiers) and court-filing contexts may require certificate-based digital signatures with identity verification.',
      'Practical test: does anyone need to verify the signer\u2019s identity cryptographically years later, or is mutual assent enough? The first needs digital signatures (Acrobat/AATL certificates); the second is served by e-signature placement with an audit trail.',
    ],
    relatedTools: ['sign-pdf', 'generate-signature', 'fill-sign-irs-w9-pdf'],
    relatedTerms: ['what-is-eidas-esign'],
  },
  {
    slug: 'what-is-eidas-esign',
    term: 'eIDAS & ESIGN Act',
    category: 'business',
    shortDef: 'The two legal frameworks that make electronic signatures enforceable: eIDAS in the EU (Regulation 910/2014) and the ESIGN Act in the United States.',
    body: [
      'eIDAS (EU Regulation 910/2014) defines three electronic signature tiers — simple, advanced, and qualified — and requires EU member states to accept them, with qualified signatures (certificate-based, from a trusted provider) carrying the equivalent status of handwritten ones. The ESIGN Act (2000) does the same job federally in the US: no document can be denied legal effect solely because it is electronic, with intent-to-sign and consent requirements.',
      'Together they are why browser-based signing is legally routine: a drawn or typed signature on a contract is enforceable in both jurisdictions for the overwhelming majority of commercial agreements.',
      'The edge cases that need more: qualified eIDAS signatures for specific regulated filings, and notarized documents in jurisdictions requiring physical presence or special remote-notarization platforms.',
    ],
    relatedTools: ['sign-pdf', 'enterprise-esignature-pdf-security-compared'],
    relatedTerms: ['what-is-digital-signature'],
  },
  {
    slug: 'what-is-redaction',
    term: 'Redaction',
    category: 'security',
    shortDef: 'Permanently and irrevocably removing sensitive content from a document — not covering it, removing it, including the underlying text data.',
    body: [
      'True redaction removes content — the text objects, image regions, and metadata referencing the sensitive material are deleted from the file. Drawing black rectangles over text accomplishes nothing: the "redacted" words remain in the file, selectable with a drag or extractable with any text tool. Court filings and government releases have leaked secrets this way for decades.',
      'Professional redaction (like canvas-raster redaction) takes the nuclear option: render pages to images after locating the sensitive text, so no text layer survives at all — combined with metadata scrubbing, the leak surface disappears entirely.',
      'Verify any redaction by trying to select or search the covered area. If you can copy the "removed" text, it was never removed.',
    ],
    relatedTools: ['redact-pdf', 'sanitize-pdf'],
    relatedTerms: ['what-is-pdf-metadata', 'what-is-rasterize'],
  },
  {
    slug: 'what-is-pdf-metadata',
    term: 'PDF Metadata',
    category: 'security',
    shortDef: 'The document information dictionary — title, author, creation tool, timestamps — plus hidden structural data like edit history and location tags in images.',
    body: [
      'Every PDF carries a metadata dictionary: title, author, subject, keywords, creation and modification dates, and the producing application. It powers search and file organization — and quietly tells recipients who created the document, with what software, and when.',
      'Deeper in the file, more history hides: XMP streams, incremental-save remnants of previous versions, and (in images) EXIF data including GPS coordinates for phone photos. A resume exported from a corporate template can carry an internal author name; a photo PDF can carry the exact location it was taken.',
      'Two legitimate moves: edit metadata deliberately for professional naming and searchability, or sanitize it away entirely before sending documents outside your organization.',
    ],
    relatedTools: ['pdf-metadata', 'sanitize-pdf', 'redact-pdf'],
    relatedTerms: ['what-is-incremental-save'],
  },
  {
    slug: 'what-is-incremental-save',
    term: 'Incremental Save',
    category: 'security',
    shortDef: 'A PDF update mechanism that appends changes instead of rewriting the file — meaning "deleted" content often remains recoverable inside the file.',
    body: [
      'PDFs can be updated two ways: full rewrite, or incremental update — appending a new revision block at the end that supersedes earlier content. Incremental saves are fast and preserve digital signatures (rewriting would invalidate them), which is why Acrobat uses them constantly.',
      'The privacy consequence: appended deletions do not delete. Text "removed" in a later incremental revision still exists in earlier blocks of the file, recoverable with text extraction tools. This is how "cleaned" documents leak prior versions.',
      'The fix is a full rewrite or sanitization: rebuild the file from current state, dropping historical objects. Any tool promising to "remove deleted content" is really forcing a full rewrite — a sanitization pass should do this by default.',
    ],
    relatedTools: ['sanitize-pdf', 'redact-pdf', 'linearize-pdf'],
    relatedTerms: ['what-is-pdf-metadata'],
  },
  {
    slug: 'what-is-linearize-pdf',
    term: 'Linearized PDF (Fast Web View)',
    category: 'processing',
    shortDef: 'A PDF reorganized so the first page displays before the whole file downloads — objects arranged in the order a web viewer needs them.',
    body: [
      'Linearization ("Fast Web View") restructures a PDF\u2019s internal objects so a viewer streaming the file from a web server can render page one after receiving only a small prefix of the data. The rest loads in the background as the user reads.',
      'The benefit applies when PDFs are served over the web, especially large ones on slow connections: perceived load time drops from "download 40 MB, then open" to "first page in a second". It changes nothing visually — the content is identical, just ordered differently inside the file.',
      'How to verify: a linearized file\u2019s first internal object references the linearization dictionary; various tools report the flag. Editing a linearized PDF with a tool that rewrites it fully will drop the linearization unless the tool preserves it.',
    ],
    relatedTools: ['linearize-pdf'],
    relatedTerms: ['what-is-incremental-save'],
  },
  {
    slug: 'what-is-crop-box',
    term: 'Crop Box & Page Boxes',
    category: 'processing',
    shortDef: 'PDF pages carry multiple boundary definitions (MediaBox, CropBox, BleedBox, TrimBox) that describe what to display, what to print, and where to cut.',
    body: [
      'A PDF page has up to five nested boundary boxes. MediaBox is the full page canvas. CropBox is the region actually displayed and printed — the "visible page". BleedBox extends past trim for printing bleed; TrimBox marks the final cut size; ArtBox bounds meaningful content. Print pipelines use the specific boxes; casual viewers use CropBox.',
      'Practical consequences: content outside the CropBox still exists in the file (selectable, extractable, visible in some editors), which surprises people whose "hidden" material is not actually removed. Shipping-label croppers and presentation tools work by adjusting the CropBox — vector content stays intact, only the window changes.',
      'When a document prints with unexpected margins or cut-off marks, a mismatch between CropBox and TrimBox is the usual suspect.',
    ],
    relatedTools: ['crop-pdf', 'shipping-label-cropper'],
    relatedTerms: ['what-is-vector-vs-raster'],
  },
  {
    slug: 'what-is-cmyk-rgb',
    term: 'CMYK vs RGB',
    category: 'processing',
    shortDef: 'RGB describes color with light (screens); CMYK describes color with ink (print). Converting between them always shifts some hues.',
    body: [
      'RGB builds color from emitted light (red, green, blue) — how screens work, with a gamut wider than any printer. CMYK builds color from absorbed ink layers (cyan, magenta, yellow, black) — how presses work. Every RGB-to-CMYK conversion maps screen colors onto ink colors, and vivid screen hues (electric blues, saturated oranges) shift because ink cannot reproduce them.',
      'For PDFs: documents destined for professional print should carry CMYK colors and often PDF/X conformance; documents for screens and office printers are fine as RGB. Converting a screen PDF to CMYK for print (via a CMYK converter) is how you see the true printable result before the press does.',
      'The classic surprise: a blue that looks perfect on screen prints muted purple. Checking the CMYK conversion first costs nothing; reprinting costs plenty.',
    ],
    relatedTools: ['cmyk-pdf-converter'],
    relatedTerms: ['what-is-pdf-a'],
  },
  {
    slug: 'what-is-pdf-encryption',
    term: 'PDF Encryption',
    category: 'security',
    shortDef: 'AES encryption built into the PDF format — two passwords (user/open and owner/permissions) control reading and editing rights respectively.',
    body: [
      'PDF encryption is part of the file format itself: the document body is encrypted with AES, and two passwords govern it. The user password (open password) is required to view the file. The owner password controls permissions — printing, copying text, editing, commenting — that viewers honor.',
      'Important nuance: permission passwords are advisory in spirit but cryptographically enforced in practice — viewers decrypt the file regardless and simply hide the restricted actions. Removing an owner password you legitimately own (your own file, restricted by accident) requires no password. Removing an open password requires knowing it; tools that "crack" open passwords are brute-forcing, not decrypting.',
      'The everyday use: encrypt contracts and records before emailing, share the open password over a different channel (phone call, text), and the mailbox-compromise scenario is defeated.',
    ],
    relatedTools: ['protect-pdf', 'unlock-pdf'],
    relatedTerms: ['what-is-digital-signature'],
  },
  {
    slug: 'what-is-pdf-portfolio',
    term: 'PDF Portfolio',
    category: 'formats',
    shortDef: 'A container PDF that bundles multiple files (PDFs, Office docs, images) as attachments with a navigator — one file, many documents.',
    body: [
      'A PDF Portfolio is a wrapper: one PDF containing embedded attachments of any type with a shell for browsing them. Courts and agencies use portfolios to submit "exhibit sets" as a single file; businesses use them to send a proposal plus spreadsheets plus supporting images in one attachment.',
      'Portfolios differ from merged PDFs: merging flattens documents into sequential pages, while a portfolio keeps the files separate and editable inside the container. Viewers vary, though — some mobile and web viewers show only the cover PDF, not the attachments, which is why mission-critical submissions often ask for merged PDFs instead.',
      'When an agency says "one PDF file", they almost always mean merged pages, not a portfolio. Merge first, verify in a plain viewer, then submit.',
    ],
    relatedTools: ['merge-pdf', 'uscis-pdf-packet-merger'],
    relatedTerms: ['what-is-flatten-pdf'],
  },
  {
    slug: 'what-is-watermark',
    term: 'Watermark',
    category: 'business',
    shortDef: 'A text or image overlay (DRAFT, CONFIDENTIAL, a logo) applied across document pages to communicate status, ownership, or confidentiality.',
    body: [
      'Watermarks communicate state without altering content: DRAFT marks review versions, CONFIDENTIAL flags sensitive circulation, company logos mark provenance, and diagonal overlays make unauthorized resale of templates awkward. They are applied either as real content (text and images drawn onto pages) or as viewer-only layers.',
      'Design matters more than intensity: a watermark at 10–20% opacity reads as professional; a dark diagonal across body text reads as spam and hurts the document\u2019s actual use. Position, size, and angle should identify without obstructing.',
      'Legally, a watermark is not protection — anyone with an editor can remove or cover it. For enforcement, encryption and digital signatures do the real work; watermarks are communication, not security.',
    ],
    relatedTools: ['add-watermark-pdf', 'protect-pdf'],
    relatedTerms: ['what-is-digital-signature'],
  },
  {
    slug: 'what-is-exif-data',
    term: 'EXIF Data',
    category: 'security',
    shortDef: 'Metadata embedded in photos by cameras and phones: timestamps, camera model, GPS coordinates, and editing software — often more revealing than the image itself.',
    body: [
      'EXIF (Exchangeable Image File Format) metadata rides inside JPEG, PNG, HEIC, and TIFF files: exact capture timestamp, device model, lens settings, editing-software fingerprints, and — for phone photos with location services on — precise GPS coordinates.',
      'It is useful (organizing photo libraries, proving capture time) and dangerous (publishing a photo can publish your home location). Marketplace sellers, journalists, and activists strip EXIF before publishing as standard practice.',
      'EXIF survives some format changes and vanishes in others: converting HEIC to JPG typically carries metadata forward, while re-saving through a canvas pipeline usually drops it. When privacy matters, strip it deliberately — do not assume the pipeline did it for you.',
    ],
    relatedTools: ['remove-exif-gps-data', 'remove-image-metadata', 'heic-to-jpg'],
    relatedTerms: ['what-is-pdf-metadata'],
  },
  {
    slug: 'what-is-pdf-x',
    term: 'PDF/X',
    category: 'formats',
    shortDef: 'The ISO PDF subset for professional print production — CMYK colors, embedded fonts and images, defined bleed/trim boxes, no RGB surprises.',
    body: [
      'PDF/X (ISO 15930) is the print-industry PDF dialect. It exists because print shops received endlessly broken files: missing fonts, RGB images, undefined trim boxes. A PDF/X file guarantees the press-ready baseline — all fonts and images embedded, colors in CMYK or spot, bleed and trim boxes defined, and output intent (the printing condition) declared.',
      'PDF/X-1a is the conservative classic (CMYK only, no transparency); PDF/X-4 adds transparency and layers with modern handling. Print vendors specifying "send us a PDF/X-1a" are asking for the least-surprise variant.',
      'The workflow value is predictability: conforming to PDF/X before submission surfaces the problems (RGB images, missing bleed) that would otherwise become expensive proof rounds.',
    ],
    relatedTools: ['cmyk-pdf-converter', 'pdf-to-pdfa'],
    relatedTerms: ['what-is-cmyk-rgb', 'what-is-crop-box'],
  },
  {
    slug: 'what-is-zip-vs-tar',
    term: 'ZIP (and why scanners emit it)',
    category: 'processing',
    shortDef: 'ZIP bundles multiple files into one compressed archive — the standard output when a tool produces many results at once (split pages, converted images).',
    body: [
      'ZIP archives combine any number of files with per-file compression into one container. When a PDF tool produces many outputs — 40 pages split into 40 single-page PDFs, a PDF converted to 20 images — delivering them as a ZIP is the only sane UX: one download, orderly extraction, original filenames preserved.',
      'ZIP compression is lossless and per-file, so contents arrive exactly as created. Modern Windows, macOS, iOS, and Android all open ZIP natively; no extra app is needed.',
      'Security note: an archive from a tool you trust is safe to open, but ZIPs from unknown senders are a classic malware wrapper — the compression format is neutral, the source is what matters.',
    ],
    relatedTools: ['split-pdf', 'pdf-to-jpg', 'split-pdf-by-size'],
    relatedTerms: ['what-is-lossless-vs-lossy'],
  },
];

export function getGlossaryTerm(slug: string): GlossaryTerm | undefined {
  return glossaryTerms.find((t) => t.slug === slug);
}

export function getGlossaryCategories() {
  const labels: Record<GlossaryTerm['category'], string> = {
    formats: 'Formats & Standards',
    processing: 'Processing & Quality',
    security: 'Security & Privacy',
    business: 'Business & Legal',
  };
  return (Object.keys(labels) as GlossaryTerm['category'][]).map((category) => ({
    category,
    label: labels[category],
    terms: glossaryTerms.filter((t) => t.category === category),
  }));
}

export function getRelatedGlossaryTerms(term: GlossaryTerm): GlossaryTerm[] {
  return term.relatedTerms
    .map((slug) => getGlossaryTerm(slug))
    .filter((t): t is GlossaryTerm => Boolean(t));
}
