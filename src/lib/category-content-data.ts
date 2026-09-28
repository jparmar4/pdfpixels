import { platformLimits } from '@/lib/limits';

export interface CategoryContent {
  headline: string;
  longDescription: string;
  benefits: { title: string; description: string }[];
  technicalGuide: {
    title: string;
    description: string;
    points: string[];
  };
  useCases: { title: string; description: string }[];
  faqs: { question: string; answer: string }[];
  proTips: string[];
}

export const categoryContentData: Record<string, CategoryContent> = {
  'most-used': {
    headline: 'Essential Daily Utilities for High-Performance Document and Image Workflows',
    longDescription:
      'Our most popular tools bring together the core utilities people rely on every single day — from lightning-fast image compression and precision resizing to instant AI background removal and multi-file PDF merges. Whether you are submitting a government job application with strict 50KB constraints, preparing product catalog photography for an online store, or bundling scanned invoices into a single organized PDF document, these high-intent workflows run directly in your browser or on dedicated high-speed server nodes with zero software installation required.',
    benefits: [
      {
        title: 'Zero Account Friction',
        description: 'Every tool in this category is free to use with no account creation, no email barriers, and no trial paywalls.',
      },
      {
        title: 'Lossless & Lossy Precision',
        description: 'Optimized compression pipelines intelligently balance visual fidelity against aggressive byte-reduction targets.',
      },
      {
        title: 'Multi-Device Compatibility',
        description: 'Engineered with responsive touch controls that function seamlessly across iOS, Android, macOS, and Windows browsers.',
      },
      {
        title: 'Ephemeral Security',
        description: 'Files processed server-side are processed in memory and purged automatically, while client tools run strictly on your machine.',
      },
    ],
    technicalGuide: {
      title: 'How our core optimization engine works',
      description:
        'When you upload files to PdfPixels, the platform automatically detects whether the job can be executed via client-side WebAssembly / HTML5 Canvas or requires server-side Sharp/Ghostscript acceleration.',
      points: [
        'JPEG processing uses discrete cosine transform (DCT) quantization to trim imperceptible high-frequency visual details.',
        'PDF operations preserve vector paths, embedded fonts, and layer hierarchies without rasterizing crisp text elements.',
        'AI neural models run segmentation pipelines with sub-pixel edge matting for precise hair and product boundary isolation.',
        'Metadata and color profile chunks (sRGB, Adobe RGB, Display P3) are preserved or stripped based on your exact compression settings.',
      ],
    },
    useCases: [
      {
        title: 'Online Application Portals & KYC',
        description: 'Instantly hit exact photo and document size thresholds (e.g. 20KB, 50KB, 100KB) required by universities and public agencies.',
      },
      {
        title: 'E-Commerce & Digital Marketplaces',
        description: 'Batch process product images, remove distracting studio backgrounds, and compress thumbnails to accelerate page load times.',
      },
      {
        title: 'Legal & Corporate Documentation',
        description: 'Combine multiple signed contracts, exhibits, and ID scans into a unified, linearized PDF ready for email distribution.',
      },
    ],
    faqs: [
      {
        question: 'Are these tools completely free for commercial and personal use?',
        answer:
          'Yes. All core tools in the Most Popular collection are 100% free for both individual and commercial projects with no hidden checkout or watermarks added to your outputs.',
      },
      {
        question: 'What is the difference between client-side and server-side tools?',
        answer:
          'Client-side tools (like cropping, rotation, and basic filters) process your data entirely within your browser using JavaScript and HTML5 Canvas — your file never leaves your device. Server-side tools (like complex PDF compression or OCR) leverage high-performance backend libraries to handle heavy computation securely before delivering the result.',
      },
      {
        question: 'How does PdfPixels maintain file quality during aggressive compression?',
        answer:
          'Our algorithms analyze image histograms and structural similarity (SSIM) indexes to determine the optimal quantization level, preventing banding and artifacting while maximizing file size reduction.',
      },
    ],
    proTips: [
      'For photographs, convert PNG files to JPG or WebP before compressing to achieve up to 80% greater file size savings.',
      'When merging PDFs, ensure all documents have consistent orientation before finalizing the merge to avoid rotated pages.',
      'Use the target KB input on our compression tools to let the engine calculate the exact optimal quality setting automatically.',
    ],
  },

  'pdf-organize': {
    headline: 'Organize PDF Pages: Merge, Split, Rotate, Reorder & Extract in Seconds',
    longDescription:
      'A well-organized PDF is the backbone of professional document handling. The PdfPixels Organize suite gives you complete control over page structure: combine contracts, invoices, and statements into a single merged file; split bulky reports into clean individual documents; rotate sideways scans; drag pages into the right order; delete blank or confidential pages; and extract just the pages you need. Every operation is page-perfect — no quality loss, no reflowed text, no watermarks — and runs in your browser or on secure server nodes without installing anything.',
    benefits: [
      {
        title: 'Truly Lossless Operations',
        description: 'Merging, splitting, and reordering never re-encode your content — text stays sharp, images stay untouched, and file integrity is preserved.',
      },
      {
        title: 'Precision Page Ranges',
        description: 'Target single pages, ranges (3-7), or custom selections like "1,3,5-9" for surgical extraction and deletion.',
      },
      {
        title: 'Batch-Friendly Workflows',
        description: 'Merge up to dozens of files in one pass, or split one document into many with fixed ranges or size-based chunks.',
      },
      {
        title: 'Bates & Page Numbering',
        description: 'Stamp sequential Bates numbers for legal discovery or clean page numbers for reports, with full control over position and format.',
      },
    ],
    technicalGuide: {
      title: 'How PDF page organization works under the hood',
      description:
        'A PDF stores pages as objects in a page tree referenced by a cross-reference table. Organize operations rewrite that tree — they never touch the content streams that hold your text and images.',
      points: [
        'PDF Merge reindexes page objects, references, and outlines into a clean, unified document root without re-encoding streams.',
        'Split and Extract clone the selected page objects into new documents, preserving fonts, vectors, and annotations on those pages.',
        'Rotate applies the /Rotate attribute to the page dictionary, so the original content remains untouched and reversible.',
        'Split-by-size estimates per-page object weights and chunks documents into parts that each stay under your target size.',
      ],
    },
    useCases: [
      {
        title: 'Business & Accounting Packets',
        description: 'Combine invoices, receipts, and bank statements into one ordered packet, then stamp page numbers for reference.',
      },
      {
        title: 'Legal & Compliance Filing',
        description: 'Apply Bates numbering across exhibits, extract specific pages for discovery, and delete privileged material before filing.',
      },
      {
        title: 'Academic Submission',
        description: 'Merge thesis chapters, declarations, and appendix scans into a single correctly-ordered document for portal upload.',
      },
    ],
    faqs: [
      {
        question: 'Does merging or splitting PDFs reduce quality?',
        answer:
          'No. Organize operations copy existing page objects as-is — text remains vector-sharp and images keep their original compression. Only tools like Compress or Flatten re-encode content.',
      },
      {
        question: 'What is the maximum PDF file size supported on PdfPixels?',
        answer:
          `Most PDF tools accept ${platformLimits.pdf.maxFileMb} MB per file. Merge allows ${platformLimits.pdf.merge.maxFiles} files, ${platformLimits.pdf.merge.maxFileMb} MB each, and ${platformLimits.pdf.merge.maxTotalMb} MB combined.`,
      },
      {
        question: 'How do I split a PDF that is too large to email?',
        answer:
          'Use the Split PDF by Size tool, enter your email attachment limit (e.g. 10 MB), and it will automatically divide the document into parts that each stay under the limit.',
      },
      {
        question: 'Can I reorder pages and add page numbers in one workflow?',
        answer:
          'Yes. Reorder or delete pages first, then open the Add Page Numbers tool — numbering is stamped based on the final page order, so the sequence is always clean.',
      },
      {
        question: 'Are my documents safe?',
        answer:
          'Yes. Data travels over TLS 1.3, server-side files are processed in memory or ephemeral storage and purged after the job, and browser-native tools never upload your file at all.',
      },
    ],
    proTips: [
      'Delete blank cover sheets and scanned-in dust pages before merging — it keeps the combined file lean and easier to navigate.',
      'Rotate scanned pages before running OCR so the text recognition engine sees upright characters and accuracy improves.',
      'Use Extract PDF Images instead of screenshots to pull original-resolution figures out of a PDF for reuse in slides.',
    ],
  },

  'pdf-optimize': {
    headline: 'Compress & Optimize PDFs to Exact Target Sizes Without Losing Readability',
    longDescription:
      'Oversized PDFs bounce from email servers, fail portal uploads, and crawl on slow connections. The PdfPixels Optimize suite shrinks documents to the exact size you need — 50KB, 100KB, 200KB, 300KB, 500KB, or under 1MB — while keeping text selectable and pages readable. Beyond compression, you can linearize PDFs for instant web viewing, repair corrupted files, flatten layers and form fields, convert to archival PDF/A, grayscale heavy color scans, and strip hidden metadata with a full sanitize pass.',
    benefits: [
      {
        title: 'Exact Target Sizes',
        description: 'Enter a KB target and the engine iterates quality and image resolution until your document lands under the limit.',
      },
      {
        title: 'Text Stays Vector-Sharp',
        description: 'Text layers and image layers are optimized independently — paper scans shrink while selectable text remains crisp.',
      },
      {
        title: 'Fast Web View Ready',
        description: 'Linearized output supports byte-serving, so page 1 renders immediately while the rest of the file streams in.',
      },
      {
        title: 'Archival & Compliance',
        description: 'Convert to PDF/A for long-term archiving, or sanitize away metadata, embedded scripts, and sensitive attachments.',
      },
    ],
    technicalGuide: {
      title: 'What actually makes a PDF large — and how we fix it',
      description:
        'A PDF file consists of a cross-reference table, content streams, embedded fonts, and raster images. Oversized PDFs are almost always bloated by high-DPI uncompressed scans, duplicate font subsets, and unused objects.',
      points: [
        'The compressor downsamples 300-600 DPI embedded scans to a clean screen-resolution target chosen for your size goal.',
        'JPEG/JPX image streams are re-quantized with quality stepping informed by structural similarity, avoiding visible banding.',
        'Unused metadata objects, orphaned font glyphs, and duplicate thumbnails are garbage-collected from the object table.',
        'Flattening merges annotations, form fields, and layers into static page content — required by many print and filing systems.',
      ],
    },
    useCases: [
      {
        title: 'Email Attachment Limits',
        description: 'Shrink scanned packets from 30MB+ to under 25MB for Gmail and Outlook, or to a few hundred KB for strict corporate gateways.',
      },
      {
        title: 'Government & Job Portals',
        description: 'Hit exact upload caps — 100KB, 200KB, 500KB — required by application forms, exam portals, and visa systems.',
      },
      {
        title: 'Web & Archive Performance',
        description: 'Linearize downloadable brochures and grayscale archival scans so websites stay fast and storage costs stay low.',
      },
    ],
    faqs: [
      {
        question: 'Can I compress a scanned PDF without making the text unreadable?',
        answer:
          'Yes. The compressor isolates text layers and raster image layers independently. Embedded text remains vector-sharp, while only the underlying scan images are downsampled.',
      },
      {
        question: 'How small can my PDF get — is 100KB realistic?',
        answer:
          'It depends on page count and content. Text-only documents often compress dramatically; image-heavy scans trade resolution for size. Target-size tools iterate automatically until your limit is met or quality would suffer.',
      },
      {
        question: 'Why is my PDF still large after compression?',
        answer:
          'Flatten the PDF first — layered annotations, form fields, and unembedded interactive elements resist compression. Then run the compressor again for the best result.',
      },
      {
        question: 'What is the maximum PDF file size supported on PdfPixels?',
        answer:
          `Most PDF tools accept ${platformLimits.pdf.maxFileMb} MB per file. Merge allows ${platformLimits.pdf.merge.maxFiles} files, ${platformLimits.pdf.merge.maxFileMb} MB each, and ${platformLimits.pdf.merge.maxTotalMb} MB combined.`,
      },
    ],
    proTips: [
      'Convert color scans to grayscale before compressing — monochrome encoding routinely saves 30-50% on paper documents.',
      'Use Compress PDF to 100KB-style presets for portals with hard caps instead of guessing a generic quality level.',
      'Linearize any PDF you host on your own website so visitors see page 1 instantly over slow connections.',
    ],
  },

  'pdf-convert': {
    headline: 'Convert PDF to Word, Excel, JPG & More — and Back Again, Faithfully',
    longDescription:
      'PDF is a universal delivery format, but work rarely ends there. The PdfPixels Convert suite moves documents in both directions: export PDF pages as high-resolution JPG images, reconstruct PDFs into editable Word documents and Excel/CSV spreadsheets, pull text with OCR, and build PDFs from Word, Excel, PowerPoint, TIFF, HEIC photos, or plain text. Whether you need to edit a contract in Word, analyze table data in Excel, or turn iPhone photos into a single PDF, conversion preserves layout, order, and fidelity.',
    benefits: [
      {
        title: 'Editable Output, Real Layout',
        description: 'PDF to Word reconstructs paragraphs, headings, and lists instead of dumping a flat image you cannot edit.',
      },
      {
        title: 'Table-Aware Extraction',
        description: 'PDF to Excel and CSV detect tabular structures so rows and columns land where they belong in your spreadsheet.',
      },
      {
        title: 'High-DPI Image Export',
        description: 'Render PDF pages to JPG at crisp resolutions for slides, previews, and print proofs.',
      },
      {
        title: 'Scanned PDFs Welcome',
        description: 'OCR pipelines recognize text in scanned pages so conversion produces selectable, searchable content.',
      },
    ],
    technicalGuide: {
      title: 'How PDF conversion engines extract your content',
      description:
        'Conversion quality depends on whether the source PDF holds real text or page images. Native PDFs expose character and position data directly; scanned PDFs require optical character recognition first.',
      points: [
        'PDF to Word maps glyph positions to paragraph and heading structures, producing a genuinely editable DOCX.',
        'PDF to Excel/CSV clusters positioned text cells into row/column grids, then writes typed values into the sheet.',
        'OCR runs detection and recognition passes over rasterized pages, embedding the recognized text layer into the output.',
        'Office-to-PDF pipelines render DOCX/XLSX/PPTX through a layout engine so fonts, tables, and slides appear as authored.',
      ],
    },
    useCases: [
      {
        title: 'Contract Editing',
        description: 'Turn a received PDF agreement into an editable Word document, revise the terms, then rebuild a clean PDF to send back.',
      },
      {
        title: 'Financial Data Analysis',
        description: 'Extract transaction tables from PDF statements into Excel or CSV for reconciliation and reporting.',
      },
      {
        title: 'Images & Slides',
        description: 'Export PDF report pages as JPGs for presentations, or combine HEIC iPhone photos into one shareable PDF.',
      },
    ],
    faqs: [
      {
        question: 'Is the Word file from PDF to Word really editable?',
        answer:
          'Yes. The converter reconstructs paragraphs, headings, and lists from the PDF text layer, producing a normal DOCX you can edit in Microsoft Word, Google Docs, or LibreOffice.',
      },
      {
        question: 'Can I convert a scanned PDF to Excel?',
        answer:
          'Yes. OCR first recognizes the text on each scanned page, then the table-detection stage groups values into spreadsheet rows and columns. Very low-quality scans may need a cleaner source for best accuracy.',
      },
      {
        question: 'Which image formats can I convert to PDF?',
        answer:
          'JPG, PNG, HEIC (iPhone photos), and TIFF all convert directly to PDF, and multiple images can be combined into one multi-page document.',
      },
      {
        question: 'Does converting change my original file?',
        answer:
          'Never. Your uploaded file is only read; conversion writes a brand-new output file and the original is untouched and unmodified.',
      },
    ],
    proTips: [
      'For pure data work, PDF to CSV gives the cleanest spreadsheet import — use Excel output when you need multiple sheets.',
      'Rotate and deskew scans before OCR so the recognition engine sees upright text and accuracy jumps.',
      'When building a PDF from images, use the Image to PDF tool to control page size and orientation per image.',
    ],
  },

  'pdf-edit': {
    headline: 'Edit & Sign PDFs: Fill Forms, Sign, Redact, Watermark & Compare',
    longDescription:
      'Most "PDF editing" needs are practical: fill in a government form, sign a contract, black out sensitive data before sharing, stamp a watermark on a draft, or check what changed between two versions. The PdfPixels Edit & Sign suite covers all of it in the browser — type or draw your signature, complete interactive and flat forms, apply true redaction that removes content instead of just covering it, edit document metadata, and compare two revisions side by side.',
    benefits: [
      {
        title: 'Sign Anywhere',
        description: 'Draw with a finger or mouse, type a styled signature, or place a saved signature image — then position it precisely on any page.',
      },
      {
        title: 'True Redaction',
        description: 'Redaction removes the underlying text and image data from the file, unlike a black rectangle that anyone can lift off.',
      },
      {
        title: 'Form Filling That Sticks',
        description: 'Complete interactive AcroForm fields or write on flat scanned forms, then flatten so entries cannot be altered downstream.',
      },
      {
        title: 'Metadata Control',
        description: 'View and edit author, title, keyword, and creation metadata before you publish or file a document.',
      },
    ],
    technicalGuide: {
      title: 'What happens when you edit a PDF here',
      description:
        'PDF pages are immutable content streams; editing tools compose new objects — annotations, form values, redaction graphics — on top and then optionally bake them into the page.',
      points: [
        'Signatures and stamps are placed as positioned overlays that can be flattened into the page for a tamper-evident final copy.',
        'Fill & Sign writes standard AcroForm field values, compatible with Adobe Reader and every mainstream viewer.',
        'Redaction deletes the selected content objects and draws opaque boxes, so removed text is genuinely gone from the file.',
        'Compare parses both documents and highlights textual differences page by page, independent of layout drift.',
      ],
    },
    useCases: [
      {
        title: 'Contracts & Agreements',
        description: 'Sign NDAs, offers, and vendor agreements in seconds and return a flattened, finalized PDF.',
      },
      {
        title: 'Government & HR Forms',
        description: 'Complete tax, visa, and onboarding forms — including flat scans — without printing a single page.',
      },
      {
        title: 'Confidential Sharing',
        description: 'Redact personal data, stamp DRAFT or CONFIDENTIAL watermarks, and clean metadata before external distribution.',
      },
    ],
    faqs: [
      {
        question: 'Does redaction really remove the hidden text?',
        answer:
          'Yes. Unlike drawing a black box over content, the redaction tool deletes the underlying text and image objects from the PDF itself, so nothing recoverable remains in the file.',
      },
      {
        question: 'Is my typed or drawn signature legally valid?',
        answer:
          'For most everyday agreements, an electronic signature is accepted the same way a handwritten one is. For transactions with specific statutory requirements (notarization, certain filings), use a certified digital-signature workflow.',
      },
      {
        question: 'Can I change the existing text of a PDF?',
        answer:
          'PDF text is embedded in fixed content streams, so direct word-editing is not supported. The standard workflow is: redact the passage you need gone, then add new text in the same spot.',
      },
      {
        question: 'How do I stop others from editing my filled form?',
        answer:
          'Flatten the PDF after filling — this bakes your entries into the page content. For stronger control, follow up with Protect PDF to set an owner password with editing restrictions.',
      },
    ],
    proTips: [
      'Flatten after signing or filling so every viewer shows exactly what you approved, with no editable leftovers.',
      'Run PDF Metadata cleanup before submitting applications — author and software fields are hidden in plain sight.',
      'Use Compare PDF on contract revisions to catch quietly changed clauses before you sign.',
    ],
  },

  'pdf-security': {
    headline: 'Password-Protect & Unlock PDFs with Industry-Standard Encryption',
    longDescription:
      'Sensitive documents deserve real protection. PdfPixels Security tools apply standard PDF encryption with strong user and owner passwords so only the right people can open, print, or copy your files — and when you legitimately need a password removed from a document you own, the Unlock tool strips protection cleanly. Everything runs over TLS 1.3 with files purged after processing, so confidential stays confidential.',
    benefits: [
      {
        title: 'Two-Layer Passwords',
        description: 'Set a user password to control opening the file and an owner password to control printing, copying, and editing permissions.',
      },
      {
        title: 'Standards-Based Encryption',
        description: 'Protection uses the PDF standard security handler with strong encryption that works in Adobe Reader, Preview, and every mainstream viewer.',
      },
      {
        title: 'Clean Password Removal',
        description: 'Unlock removes protection from PDFs whose password you know, producing an unencrypted copy with content intact.',
      },
      {
        title: 'Ephemeral by Design',
        description: 'Uploaded files are processed in isolated memory and deleted automatically — we never store, index, or share documents.',
      },
    ],
    technicalGuide: {
      title: 'How PDF encryption actually works',
      description:
        'PDF security attaches an encryption dictionary to the document and encrypts strings and streams with keys derived from the user and owner passwords, plus permission flags that viewers enforce.',
      points: [
        'A user password gates opening the document; without it, content cannot be decrypted by any reader.',
        'An owner password unlocks permission flags — printing, copying text, editing, and annotation rights.',
        'Encryption keys wrap the document streams, so protected files stay protected on any device or cloud folder.',
        'Unlock decrypts streams with the password you supply and rewrites the file without the security dictionary.',
      ],
    },
    useCases: [
      {
        title: 'Financial & Legal Documents',
        description: 'Encrypt bank statements, tax returns, and contracts before emailing them or storing them in shared drives.',
      },
      {
        title: 'Controlled Distribution',
        description: 'Allow reading but block copying and printing for course material, proposals, and confidential reports.',
      },
      {
        title: 'Regaining Access',
        description: 'Remove a password you set years ago from your own archive files so the team can search and process them again.',
      },
    ],
    faqs: [
      {
        question: 'Can PdfPixels crack or remove an unknown password?',
        answer:
          'No. Strong PDF encryption cannot be bypassed by our tools, and we will not attempt it. Unlock requires the correct password to the document you own.',
      },
      {
        question: 'What is the difference between the user password and the owner password?',
        answer:
          'The user password is required to open and read the file. The owner password controls permission restrictions like printing and copying. You can set both, or use an owner password alone to restrict actions while keeping the file readable.',
      },
      {
        question: 'Is it safe to upload confidential documents?',
        answer:
          'Yes. Transfer is TLS 1.3 encrypted, processing happens in isolated memory, and files are purged automatically after the job. We never index, share, or retain your documents.',
      },
      {
        question: 'Will protected PDFs still open in Adobe Reader and on mobile?',
        answer:
          'Yes. Protection uses the PDF standard security handler, supported by Adobe Reader, macOS Preview, Chrome, Edge, and every mainstream mobile viewer.',
      },
    ],
    proTips: [
      'Use a long passphrase rather than a short password — encryption strength only helps if the password resists guessing.',
      'Keep a copy of the password in your password manager before you protect the file; there is no recovery path.',
      'If a filing portal rejects encrypted PDFs, unlock your copy first, then submit the decrypted version.',
    ],
  },

  'convert': {
    headline: 'High-Fidelity Multi-Format Converter for Web, Mobile, and Print Assets',
    longDescription:
      'Image and document format mismatches are among the most common digital frustrations. Whether you are dealing with Apple iPhone HEIC photos that refuse to open on Windows, vector SVG icons that need rasterization for social media, or high-res PNG graphics that must be transformed into lightweight JPGs or modern WebP images, PdfPixels provides instantaneous format transcoding. Our conversion engine preserves color accuracy, handles transparency flattening gracefully, and provides clean, compliant files for every operating system.',
    benefits: [
      {
        title: 'Cross-Platform Compatibility',
        description: 'Bridge format incompatibilities between iOS/macOS (HEIC, TIFF) and Windows/Android (JPG, PNG, WebP).',
      },
      {
        title: 'Intelligent Alpha Channel Handling',
        description: 'Convert transparent PNG or WebP graphics to JPG with clean white background fills instead of black artifact boxes.',
      },
      {
        title: 'Optical Character Recognition (OCR)',
        description: 'Extract editable text from scanned documents and photo screenshots into plain text in seconds.',
      },
      {
        title: 'Modern Web Formats',
        description: 'Convert legacy image formats to next-generation WebP to boost Google PageSpeed and Core Web Vitals.',
      },
    ],
    technicalGuide: {
      title: 'Comparing Modern Image Formats',
      description:
        'Selecting the correct image format depends on the visual characteristics of your asset and where it will be displayed.',
      points: [
        'JPEG / JPG: Best for photographic content with rich color gradients. Uses lossy DCT compression.',
        'PNG: Ideal for line art, logos, text screenshots, and graphics requiring true 8-bit alpha transparency.',
        'WebP: Modern format developed by Google offering 25-35% smaller file sizes than comparable JPG/PNG files.',
        'HEIC / HEIF: High-efficiency container used by iOS devices offering excellent compression but limited native Windows support.',
        'SVG: Scalable Vector Graphics based on XML; infinitely scalable without pixelation, ideal for icons and UI elements.',
      ],
    },
    useCases: [
      {
        title: 'iPhone Photo Conversion for PC Users',
        description: 'Transform camera roll .HEIC files into universally compatible .JPG photos that open instantly in any Windows app.',
      },
      {
        title: 'Web Performance Optimization',
        description: 'Convert PNG hero banners and blog illustrations into lightweight WebP images to reduce bandwidth and speed up page load.',
      },
      {
        title: 'Document Digitization via OCR',
        description: 'Scan receipts, book pages, and printed forms to extract editable text without manual retyping.',
      },
    ],
    faqs: [
      {
        question: 'Why do transparent PNGs sometimes turn black when converted to JPG?',
        answer:
          'JPG does not support an alpha (transparency) channel. Inferior converters map transparent pixels to black (RGB 0,0,0). PdfPixels automatically detects transparency and composites it cleanly over a solid white background.',
      },
      {
        question: 'Is HEIC to JPG conversion lossless?',
        answer:
          'Because JPG is a lossy format, conversion re-encodes the image. However, PdfPixels applies a high-fidelity 92%+ quality setting, ensuring the visual difference is imperceptible to human vision.',
      },
      {
        question: 'Can I convert vector SVG files to high-resolution PNGs?',
        answer:
          'Yes. Our SVG to PNG converter renders your vector XML at crisp high-DPI raster resolutions with full transparency support.',
      },
    ],
    proTips: [
      'Use WebP for your website images to reduce page weight by an average of 30% compared to JPG without visible quality drop.',
      'When extracting text using OCR, ensure the source image is well-lit and oriented upright for maximum character recognition accuracy.',
      'Always keep original master copies of transparent PNG logos before batch-converting them to JPG for specific forms.',
    ],
  },

  'basic-editing': {
    headline: 'Precision Canvas Editing: Crop, Rotate, Flip, Watermark, and Composite Images',
    longDescription:
      'Quick image adjustments shouldn’t require installing complex desktop graphics software. PdfPixels Basic Editing suite provides a clean, responsive workspace for essential photo tweaks: crop to standard aspect ratios (1:1 square, 4:5 vertical, 16:9 widescreen, circular avatar crops), rotate skewed scans, flip mirror orientations, stamp custom text or logo watermarks, and combine multiple images side-by-side or stacked vertically. All basic editing operations execute natively in your browser with real-time interactive canvas previews.',
    benefits: [
      {
        title: '100% Browser-Native Execution',
        description: 'Edits occur directly within your device’s browser via HTML5 Canvas. Your photos never leave your computer.',
      },
      {
        title: 'Aspect Ratio Locking',
        description: 'Constrain crop boxes to popular presets for Instagram, LinkedIn, YouTube, and official passport photo dimensions.',
      },
      {
        title: 'Branding & Protection',
        description: 'Apply semi-transparent copyright watermarks, company logos, and text stamps with full opacity control.',
      },
      {
        title: 'Lossless Geometry Changes',
        description: '90-degree rotations and horizontal/vertical flips execute with zero pixel degradation.',
      },
    ],
    technicalGuide: {
      title: 'Canvas-Based Image Manipulation Principles',
      description:
        'Browser-based editing relies on the HTML5 2D Canvas rendering context to manipulate raw pixel buffers directly on the client machine.',
      points: [
        'Cropping performs coordinate sub-sampling: `ctx.drawImage(src, sx, sy, sWidth, sHeight, 0, 0, dWidth, dHeight)`.',
        'Rotations translate the canvas origin to the image center, apply trigonometric rotation matrices, and recalculate bounding boxes.',
        'Watermarking uses alpha compositing modes to blend overlay typography and logo png files seamlessly over background photography.',
        'Final outputs are serialized directly to Blob objects using native `toBlob(type, quality)` browser methods.',
      ],
    },
    useCases: [
      {
        title: 'Social Media Profile & Banner Prep',
        description: 'Crop circular avatars for Discord and Slack or generate exact 16:9 landscape headers for YouTube and Twitter.',
      },
      {
        title: 'Document Straightening & Orientation Fixes',
        description: 'Rotate scanned receipts, certificates, and ID cards that were captured upside down or sideways.',
      },
      {
        title: 'Photography Copyright & Proofing',
        description: 'Add subtle watermark logos across photo previews before sharing client galleries or public proofs.',
      },
    ],
    faqs: [
      {
        question: 'Does cropping or rotating an image reduce its sharpness?',
        answer:
          'Rotating at 90, 180, or 270 degrees is mathematically exact and preserves full pixel integrity. Cropping removes outer pixels but leaves the cropped area at 100% native resolution.',
      },
      {
        question: 'Can I crop images into perfect circles for social avatars?',
        answer:
          'Yes. Our Circle Crop tool applies a radial clipping mask and exports the resulting image as a transparent PNG ready for profile upload.',
      },
      {
        question: 'Are there file size limits for client-side editing tools?',
        answer:
          `Image tools accept up to ${platformLimits.image.maxFileMb} MB per file (${platformLimits.image.maxMegapixels} megapixels). Client-side editing still depends on the device's available memory.`,
      },
    ],
    proTips: [
      'Hold Shift while dragging crop handles to maintain the original aspect ratio automatically.',
      'When adding text watermarks, choose a contrasting color with 40-60% opacity so it remains readable without obscuring key visual details.',
      'Use the Color Picker tool to extract exact hex color codes from any uploaded design or photograph.',
    ],
  },

  'effects': {
    headline: 'Creative Filters, Privacy Blurs, and AI-Powered Visual Enhancements',
    longDescription:
      'From creative color grading to essential privacy censoring, PdfPixels Effects & Filters give you instant visual control over your photography. Apply vintage sepia tones, dramatic monochrome black & white conversions, retro pixel art styling, and artistic motion blurs. For privacy and compliance, use our precision Face Blur and Background Blur utilities to obscure sensitive personal identifiers, license plates, and confidential background details before publishing images online.',
    benefits: [
      {
        title: 'Privacy & Identity Protection',
        description: 'Automatically or manually blur faces, license plates, and sensitive documents before public sharing.',
      },
      {
        title: 'AI Neural Enhancements',
        description: 'Leverage intelligent portrait smoothing, noise reduction, and detail restoration models.',
      },
      {
        title: 'Real-Time Adjustment Sliders',
        description: 'Fine-tune blur radii, pixelation block sizes, and color grading intensities with immediate live preview.',
      },
      {
        title: 'Clean Non-Destructive Export',
        description: 'Download full-resolution processed assets without intrusive branding or compression artifacts.',
      },
    ],
    technicalGuide: {
      title: 'Digital Filtering & Convolution Matrix Algorithms',
      description:
        'Visual effects apply mathematical kernel matrices and color transformation equations across the image pixel array.',
      points: [
        'Gaussian Blur applies a 2D convolution kernel with normal distribution weights to soften high-frequency luminance spikes.',
        'Pixelation subdivides the pixel buffer into N×N grids, replacing all interior pixels with the calculated arithmetic mean color.',
        'Grayscale transformation utilizes standard ITU-R BT.709 luma coefficients: `Y = 0.2126 R + 0.7152 G + 0.0722 B`.',
        'Face Detection leverages lightweight ONNX neural network runtimes executing client-side or server-side inference.',
      ],
    },
    useCases: [
      {
        title: 'GDPR & Privacy Compliance for Photos',
        description: 'Censor bystander faces, credit card numbers, and house addresses before publishing imagery on public blogs.',
      },
      {
        title: 'Professional Headshot Background Softening',
        description: 'Simulate wide-aperture shallow depth-of-field (bokeh) to isolate subjects from busy office or outdoor backgrounds.',
      },
      {
        title: 'Creative Social Media Styling',
        description: 'Create nostalgic retro pixel art, high-contrast monochrome portraits, or aesthetic sepia prints for creative portfolios.',
      },
    ],
    faqs: [
      {
        question: 'Can blurred or pixelated information be reversed or unblurred?',
        answer:
          'No. When you apply a blur or pixelate effect in PdfPixels and download the image, the underlying pixel data is permanently replaced with calculated averages. The original data cannot be reconstructed.',
      },
      {
        question: 'How does the AI face blurring tool detect multiple people?',
        answer:
          'The AI model scans the visual canvas for facial landmarks (eyes, nose, mouth geometry) and generates bounding boxes around all detected faces, applying the blur mask automatically.',
      },
      {
        question: 'Do artistic filters lower the resolution of my photo?',
        answer:
          'No. All filters and effects process the image at its full native pixel dimensions unless you explicitly choose to resize the file.',
      },
    ],
    proTips: [
      'For maximum privacy when censoring sensitive data like passwords or account numbers, use a high pixelation block size (20px+) or solid blackout censor box.',
      'Combine Grayscale with a slight Contrast boost to create striking fine-art black and white photography.',
      'Use Portrait Retouch to gently soften skin blemishes while preserving natural eye and hair sharpness.',
    ],
  },

  'dpi-quality': {
    headline: 'Resolution, Density & Print Preparation: Convert DPI, Upscale & Enhance',
    longDescription:
      'DPI (Dots Per Inch) and PPI (Pixels Per Inch) dictate how digital pixel dimensions translate into physical print output. If a print shop or submission portal demands strict 300 DPI compliance, changing a file name or re-saving won’t fix the embedded EXIF metadata. PdfPixels DPI & Quality tools enable you to reconfigure embedded DPI density headers (72, 150, 300, 600 DPI) for print presses, upscale low-resolution photos using AI super-resolution algorithms, and restore sharpness to blurry legacy snapshots.',
    benefits: [
      {
        title: 'Print-Ready Standardization',
        description: 'Update image density headers to 300 DPI for standard photo printing or 600 DPI for high-end archival publishing.',
      },
      {
        title: 'AI Super-Resolution Upscaling',
        description: 'Enlarge small images 2x or 4x without pixelation using deep learning hallucination and edge reconstruction.',
      },
      {
        title: 'Deblur & Texture Recovery',
        description: 'Sharpen soft edges, clean up digital noise, and enhance micro-contrast on legacy camera captures.',
      },
      {
        title: 'Exact Physical Sizing',
        description: 'Calculate millimeter and inch print measurements accurately based on target DPI specifications.',
      },
    ],
    technicalGuide: {
      title: 'The Math of DPI vs Pixel Dimensions',
      description:
        'A digital image only possesses pixel width and height. DPI is a metadata instruction telling printers how many pixels to fit into each physical linear inch.',
      points: [
        'Print Size Formula: `Physical Inches = Pixel Dimension / DPI`. (e.g. 1800×1200px at 300 DPI = 6×4 inch print).',
        'Screen Display: Computer screens render at native hardware pixel density (typically 96-220 PPI); DPI metadata does not affect website display size.',
        'JFIF & EXIF Headers: PdfPixels modifies density tags inside the APP0 marker for JPEG and the pHYs chunk for PNG without altering raw pixel arrays.',
        'AI Upscaling: Neural super-resolution models predict missing high-frequency textures rather than applying basic bilinear interpolation.',
      ],
    },
    useCases: [
      {
        title: 'Commercial Print Submissions',
        description: 'Prepare business cards, posters, flyers, and merchandise artwork to meet strict 300 DPI printer requirements.',
      },
      {
        title: 'Passport & Visa Photo Compliance',
        description: 'Set exact 300 DPI metadata on 35×45mm or 2×2 inch ID photos required by official government portals.',
      },
      {
        title: 'Restoring Old or Low-Res Graphics',
        description: 'Upscale vintage family scans or small website logos into high-resolution assets suitable for modern displays.',
      },
    ],
    faqs: [
      {
        question: 'Does changing DPI from 72 to 300 make a web image clearer on screen?',
        answer:
          'No. Changing DPI only alters the embedded print density metadata. To make a low-resolution image clearer on screens, use our AI Upscale or AI Image Enhancer tools to add pixel detail.',
      },
      {
        question: 'Why do printers require 300 DPI?',
        answer:
          'Human eyes cannot distinguish individual ink droplets at standard reading distances when printed at 300 dots per inch, producing continuous-tone, photorealistic prints.',
      },
      {
        question: 'Can I convert DPI on PNG images as well as JPG?',
        answer:
          'Yes. Our DPI converter writes physical pixel density into both JFIF headers (for JPG) and pHYs chunks (for PNG).',
      },
    ],
    proTips: [
      'For standard photo printing, aim for 300 DPI. For large outdoor banners viewed from a distance, 100-150 DPI is usually sufficient.',
      'When preparing artwork for print, calculate required pixel dimensions: multiply target inches by 300 (e.g. 8×10 inch = 2400×3000 pixels).',
      'Use AI Upscale before applying DPI conversion if your original photo has fewer pixels than required for the physical print size.',
    ],
  },

  'signature': {
    headline: 'Digital Signature Preparation: Create, Clean, Resize & Merge for Forms',
    longDescription:
      'Online applications, financial documents, job contracts, and government portals constantly require digital signatures. The PdfPixels Signature toolkit helps you generate clean handwritten digital signatures, resize signature scans to strict portal dimensions and KB limits, remove muddy paper backgrounds to create transparent PNG signatures, and merge your passport photo and signature side-by-side on a single unified canvas for official recruitment and entrance exams.',
    benefits: [
      {
        title: 'Clean Transparent Backgrounds',
        description: 'Eliminate gray paper backgrounds, shadows, and scanner noise, leaving crisp ink strokes on transparent PNG.',
      },
      {
        title: 'Exam & Recruitment Form Presets',
        description: 'Pre-configured dimensions for major recruitment, banking, and university portal submission guidelines.',
      },
      {
        title: 'Draw, Type, or Upload',
        description: 'Create signatures with your mouse or stylus, type with stylish script typography, or enhance a photo of your paper signature.',
      },
      {
        title: 'Privacy Protected',
        description: 'Your handwritten signature data is processed securely without archiving or persistent cloud retention.',
      },
    ],
    technicalGuide: {
      title: 'Processing Handwritten Signatures for Digital Use',
      description:
        'Capturing a signature with a phone camera produces uneven lighting, yellow paper tint, and JPEG compression noise around ink lines.',
      points: [
        'Adaptive Thresholding: Analyzes local illumination gradients to separate dark ink strokes from paper background variations.',
        'Chroma Key & Alpha Generation: Converts white/gray background pixels into 100% transparent alpha channels.',
        'Vector Stroke Smoothing: Applies Bezier curve smoothing when drawing signatures on touch screens to prevent jitter.',
        'Composite Alignment: Places photo and signature bounding boxes with calibrated margin offsets for exam form requirements.',
      ],
    },
    useCases: [
      {
        title: 'Government Exam & Job Applications',
        description: 'Create perfectly formatted 10KB-20KB signatures and photo-signature joint cards for official recruitment portals.',
      },
      {
        title: 'Electronic Contract & Document Signing',
        description: 'Generate transparent PNG signatures to stamp directly into PDF contracts, NDAs, and agreements.',
      },
      {
        title: 'Banking & Financial KYC Forms',
        description: 'Clean up phone snapshots of paper signatures for bank account verification and loan documentation.',
      },
    ],
    faqs: [
      {
        question: 'How do I turn a phone photo of my paper signature into a clean transparent signature?',
        answer:
          'Take a photo of your signature on plain white paper with good lighting. Upload it to our signature cleaning tool to strip the background and export a crisp, transparent PNG signature.',
      },
      {
        question: 'What is the standard size for signatures on online application forms?',
        answer:
          'Most portals require signatures between 140×60 pixels and 300×150 pixels, weighing between 10KB and 20KB in JPG or PNG format. Our signature resizing tool includes presets for these exact constraints.',
      },
      {
        question: 'Is my digital signature stored on your servers?',
        answer:
          'No. Signature workflows operate with strict privacy controls — drawing and basic cleaning run directly in your browser without transmitting your signature to any remote database.',
      },
    ],
    proTips: [
      'When signing on paper to photograph, use a bold black or dark blue gel pen rather than a light ballpoint pen for sharper digital extraction.',
      'Ensure no shadows fall across the paper when capturing your signature photo with a smartphone camera.',
      'Save your finished transparent signature as a PNG file so you can reuse it across Word, PDF, and Google Docs documents.',
    ],
  },

  'metadata': {
    headline: 'Image EXIF & Metadata Suite: Inspect, Clean, and Protect Digital Privacy',
    longDescription:
      'Modern smartphone and digital camera photos contain extensive hidden metadata known as EXIF (Exchangeable Image File Format) data. This hidden information often includes your exact GPS latitude/longitude coordinates, camera make and model, serial numbers, date and timestamps, and editing history. PdfPixels Image Metadata tools allow you to inspect every hidden metadata tag, modify copyright and author credits, or completely purge all EXIF, IPTC, and XMP tags to protect your location privacy before sharing photos online.',
    benefits: [
      {
        title: 'GPS Location Privacy',
        description: 'Remove precise geotagging coordinates to prevent strangers from identifying where a photo was captured.',
      },
      {
        title: 'Complete Tag Inspection',
        description: 'View full camera exposure settings (shutter speed, ISO, aperture, focal length) and hardware details.',
      },
      {
        title: 'File Weight Reduction',
        description: 'Stripping extensive thumbnail caches and XML metadata blocks reduces image file size by up to 10-15%.',
      },
      {
        title: 'Author & Copyright Editing',
        description: 'Embed your legal photographer copyright notice and creator attribution into your image files.',
      },
    ],
    technicalGuide: {
      title: 'Understanding EXIF, IPTC, and XMP Metadata Structure',
      description:
        'Digital images store metadata in dedicated binary marker segments preceding the compressed pixel stream.',
      points: [
        'EXIF (APP1 Segment): Contains camera hardware parameters, exposure data, lens metadata, and GPS IFD blocks.',
        'IPTC (APP13 Segment): Contains press and editorial information including captions, keywords, credit lines, and copyright notices.',
        'XMP (XML Packet): Extensible metadata platform created by Adobe that stores editing steps, color adjustments, and licensing data.',
        'Sanitization: PdfPixels strips all non-essential APP marker segments while keeping the Start of Scan (SOS) image payload intact.',
      ],
    },
    useCases: [
      {
        title: 'Social Media & Classified Listing Privacy',
        description: 'Strip GPS location data before posting marketplace items or personal photos online.',
      },
      {
        title: 'Professional Photography Attribution',
        description: 'Add copyright notices, contact details, and license terms to your portfolio images before client delivery.',
      },
      {
        title: 'Photography Learning & Analysis',
        description: 'Inspect camera settings (f-stop, shutter speed, ISO) from photos to understand photographic techniques.',
      },
    ],
    faqs: [
      {
        question: 'Does removing EXIF metadata reduce the visual quality of my photo?',
        answer:
          'No. EXIF data is purely descriptive text and numbers stored in separate header blocks. Stripping metadata has zero effect on pixel colors, resolution, or visual sharpness.',
      },
      {
        question: 'What GPS information is commonly stored in smartphone photos?',
        answer:
          'Smartphones typically record exact latitude, longitude, altitude, and heading (direction the camera was pointed), which can pinpoint your home or work location down to a few feet.',
      },
      {
        question: 'Can social networks see my EXIF data when I upload photos?',
        answer:
          'While major social networks strip EXIF data when displaying photos publicly, the platform’s servers often read the location data during the initial upload. Cleaning EXIF data before uploading guarantees privacy.',
      },
    ],
    proTips: [
      'Always strip EXIF metadata from photos of items you are selling on peer-to-peer marketplaces to avoid revealing your home address.',
      'Check the date and time metadata if you need to verify when an event occurred or when an invoice scan was generated.',
      'Use the View Metadata tool to verify that an image has been successfully cleaned before sharing it publicly.',
    ],
  },
};
