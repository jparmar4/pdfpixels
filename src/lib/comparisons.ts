export type ComparisonPage = {
  slug: string;
  title: string;
  description: string;
  primaryToolSlug: string;
  alternatives: string[];
  bestFor: string[];
  /** Unique editorial for quality/AdSense — avoid identical tables-only pages */
  overview: string;
  whenToChooseUs: string[];
  whenToChooseAlt: string[];
  keyDifferences: { topic: string; pdfpixels: string; alternative: string }[];
  verdict: string;
  faqs: { question: string; answer: string }[];
};

export const comparisonPages: ComparisonPage[] = [
  {
    slug: 'pdfpixels-vs-ilovepdf-merge-pdf',
    title: 'PdfPixels vs iLovePDF for Merge PDF',
    description: 'Feature-by-feature comparison for merging PDF files, speed, privacy, and workflow simplicity.',
    primaryToolSlug: 'merge-pdf',
    alternatives: ['iLovePDF'],
    bestFor: ['No-signup workflows', 'Quick merge tasks', 'Simple drag-and-drop operations'],
    overview:
      'iLovePDF is a well-known online PDF suite with merge among many other tools. PdfPixels focuses on a fast, lightweight merge path for users who want to combine a few files without exploring a large product catalog. If your priority is combine-and-download with minimal friction, both can work — differences show up in account prompts, surrounding tool set, and how much product surface you want around a simple merge.',
    whenToChooseUs: [
      'You want a straightforward merge without hunting through a large tool menu',
      'You prefer a modern single-site workflow alongside image tools',
      'You are combining a small set of everyday office or school PDFs',
    ],
    whenToChooseAlt: [
      'You already rely on iLovePDF for an entire PDF pipeline',
      'You need a specific iLovePDF feature not offered elsewhere in your stack',
      'Your team standardized on that brand for training reasons',
    ],
    keyDifferences: [
      {
        topic: 'Primary focus',
        pdfpixels: 'Utility-first merge inside a broader free PDF + image toolkit',
        alternative: 'Broad PDF suite with many specialized PDF utilities',
      },
      {
        topic: 'Learning curve',
        pdfpixels: 'Single-purpose page aimed at merge order → download',
        alternative: 'Familiar to existing iLovePDF users; larger overall product surface',
      },
      {
        topic: 'Best fit',
        pdfpixels: 'Quick browser merges and mixed image/PDF days',
        alternative: 'Users embedded in the iLovePDF ecosystem',
      },
    ],
    verdict:
      'Pick PdfPixels Merge PDF when you want a clean, no-drama combine step. Stick with iLovePDF if your organization already depends on its wider PDF suite day to day.',
    faqs: [
      {
        question: 'Can both tools merge without installing software?',
        answer: 'Yes. Both offer browser-based merging. Choose based on workflow comfort and the other tools you need nearby.',
      },
      {
        question: 'Does merge order matter?',
        answer: 'Yes. Always confirm page order before downloading — that matters more than brand choice.',
      },
    ],
  },
  {
    slug: 'pdfpixels-vs-smallpdf-compress-pdf',
    title: 'PdfPixels vs Smallpdf for Compress PDF',
    description: 'Compare PDF compression experience, output quality, and convenience for email-ready files.',
    primaryToolSlug: 'compress-pdf',
    alternatives: ['Smallpdf'],
    bestFor: ['Email attachment optimization', 'Fast online compression', 'Free usage'],
    overview:
      'Smallpdf is a popular commercial-friendly PDF platform; compression is one of its headline jobs. PdfPixels Compress PDF targets the same user problem — email and portal size limits — with a free-tool framing and adjacent image compression utilities. Quality after compression always depends on the source (text PDFs vs photo scans) more than marketing claims.',
    whenToChooseUs: [
      'You want free compression for occasional email-sized PDFs',
      'You also compress images and convert formats on the same site',
      'You need a simple compress → download loop',
    ],
    whenToChooseAlt: [
      'You already pay for Smallpdf and like its desktop/mobile apps',
      'Your team uses Smallpdf collaboration or other paid features',
    ],
    keyDifferences: [
      {
        topic: 'Positioning',
        pdfpixels: 'Free web utilities for everyday size problems',
        alternative: 'Established PDF brand with freemium/paid tiers and apps',
      },
      {
        topic: 'Adjacent tools',
        pdfpixels: 'Strong crossover with image KB targets and HEIC/JPG jobs',
        alternative: 'Deep PDF-centric product lineup',
      },
    ],
    verdict:
      'For occasional “make this PDF emailable” tasks, PdfPixels is a solid free path. If you live in Smallpdf’s paid ecosystem, staying there reduces tool switching.',
    faqs: [
      {
        question: 'Will either tool keep scanned text perfectly sharp at tiny sizes?',
        answer: 'Aggressive compression softens scan quality. Start moderate and only go harder if the size limit demands it.',
      },
    ],
  },
  {
    slug: 'pdfpixels-vs-tinypng-compress-image',
    title: 'PdfPixels vs TinyPNG for Image Compression',
    description: 'Detailed comparison for JPG/PNG/WebP compression controls, targeting size, and output workflow.',
    primaryToolSlug: 'compress-image',
    alternatives: ['TinyPNG'],
    bestFor: ['Target-size compression', 'Mixed image formats', 'No-login quick tasks'],
    overview:
      'TinyPNG (and TinyJPG) is famous for smart lossy compression of PNG and JPEG with excellent defaults. PdfPixels Compress Image emphasizes hitting explicit KB targets — the kind of requirement job portals and government forms print in bold. If you optimize website assets in bulk, TinyPNG’s model is beloved by developers; if you must land on “exactly 50KB,” target-based compression is often clearer.',
    whenToChooseUs: [
      'Forms demand an exact maximum KB size',
      'You bounce between resize, compress, and convert tools',
      'You want one place for PDF and image size fixes',
    ],
    whenToChooseAlt: [
      'You primarily shrink PNG/JPEG for websites with TinyPNG’s defaults',
      'You already automated TinyPNG in a build pipeline',
    ],
    keyDifferences: [
      {
        topic: 'Control style',
        pdfpixels: 'Target KB-oriented controls for form limits',
        alternative: 'Highly regarded automatic smart compression defaults',
      },
      {
        topic: 'Typical user',
        pdfpixels: 'Applicants, students, general users with size caps',
        alternative: 'Developers and designers optimizing site assets',
      },
    ],
    verdict:
      'Use PdfPixels when the number on the form matters. Use TinyPNG when you want proven web-asset compression with minimal thinking.',
    faqs: [
      {
        question: 'Can I use both?',
        answer: 'Yes. Many people use TinyPNG for site performance and a target-KB tool for application uploads.',
      },
    ],
  },
  {
    slug: 'pdfpixels-vs-removebg-background-removal',
    title: 'PdfPixels vs remove.bg for Background Removal',
    description: 'Compare AI background removal quality, convenience, and end-to-end editing flow.',
    primaryToolSlug: 'remove-image-background',
    alternatives: ['remove.bg'],
    bestFor: ['One-tool edit flow', 'Quick transparent PNG exports', 'Simple browser workflow'],
    overview:
      'remove.bg popularized one-click AI background removal and offers APIs and commercial plans. PdfPixels provides browser background removal as part of a wider free image toolkit. Edge quality varies by photo: hair, mesh, and low contrast scenes challenge every model. Evaluate with your real product or portrait images rather than marketing demos.',
    whenToChooseUs: [
      'You want a free browser try for occasional cutouts',
      'You will also resize, compress, or convert the result on the same site',
    ],
    whenToChooseAlt: [
      'You need remove.bg’s API, plugins, or high-volume commercial workflow',
      'Your brand already standardized on remove.bg output',
    ],
    keyDifferences: [
      {
        topic: 'Product depth',
        pdfpixels: 'General image/PDF utility site with AI remove as one tool',
        alternative: 'Specialist background-removal product with ecosystem features',
      },
      {
        topic: 'Volume needs',
        pdfpixels: 'Best for interactive, occasional jobs',
        alternative: 'Stronger fit for bulk/API commercial pipelines',
      },
    ],
    verdict:
      'Try PdfPixels for quick transparent PNGs in a broader toolkit. Choose remove.bg when you need specialist volume, API, or established enterprise integrations.',
    faqs: [
      {
        question: 'Which is better for hair detail?',
        answer: 'It depends on the photo. Test both on a sample with flyaway hair before committing a full catalog.',
      },
    ],
  },
  {
    slug: 'pdfpixels-vs-canva-resize-image',
    title: 'PdfPixels vs Canva for Image Resize Tasks',
    description: 'Compare pure utility image resizing vs design-suite workflow for pixel-accurate resizing jobs.',
    primaryToolSlug: 'resize-image',
    alternatives: ['Canva'],
    bestFor: ['Dimension-first jobs', 'Fast technical resizing', 'DPI-aware export flow'],
    overview:
      'Canva is a full design suite: templates, brand kits, and social presets inside a creative editor. PdfPixels Resize Image is a utility for people who already have an image and just need correct pixels, cm, or print-oriented sizing. If you are designing a poster from scratch, Canva wins. If a portal says “exactly 35×45 mm” or “1080×1080,” a focused resizer is often faster.',
    whenToChooseUs: [
      'You only need accurate dimensions or DPI-oriented resize',
      'You do not want to build a full Canva design to export one size',
    ],
    whenToChooseAlt: [
      'You need templates, text, brand kits, and multi-page designs',
      'Your team already collaborates inside Canva',
    ],
    keyDifferences: [
      {
        topic: 'Job type',
        pdfpixels: 'Technical resize and export',
        alternative: 'End-to-end graphic design and publishing',
      },
      {
        topic: 'Speed to one size',
        pdfpixels: 'Usually fewer steps for pure dimension changes',
        alternative: 'More power when design work is required',
      },
    ],
    verdict:
      'Use PdfPixels for surgical resizing. Use Canva when the image still needs design work, not just new dimensions.',
    faqs: [
      {
        question: 'Can Canva resize too?',
        answer: 'Yes. Canva can resize designs; PdfPixels is lighter when resize is the only task.',
      },
    ],
  },
  {
    slug: 'pdfpixels-vs-adobe-pdf-to-jpg',
    title: 'PdfPixels vs Adobe for PDF to JPG Conversion',
    description: 'Compare conversion speed, ease of use, and result handling for PDF-to-image tasks.',
    primaryToolSlug: 'pdf-to-jpg',
    alternatives: ['Adobe Acrobat Online'],
    bestFor: ['Quick conversion tasks', 'Simple download flow', 'No-account workflows'],
    overview:
      'Adobe’s PDF tools set the professional baseline, including online conversion features tied to the Acrobat ecosystem. PdfPixels PDF to JPG is for users who need page images quickly — chat sharing, slides, or simple previews — without entering a full Acrobat workflow. For archival, accessibility, or advanced PDF editing, Adobe remains the heavier-duty choice.',
    whenToChooseUs: [
      'You need a fast page-to-image export in the browser',
      'You do not need advanced Acrobat editing features today',
    ],
    whenToChooseAlt: [
      'You already subscribe to Adobe and work in Acrobat daily',
      'You need professional PDF standards, OCR workflows, or complex edits',
    ],
    keyDifferences: [
      {
        topic: 'Scope',
        pdfpixels: 'Focused conversion utility',
        alternative: 'Full PDF platform with conversion as one capability',
      },
      {
        topic: 'Cost posture',
        pdfpixels: 'Free-tool oriented for common tasks',
        alternative: 'Freemium/paid professional ecosystem',
      },
    ],
    verdict:
      'Choose PdfPixels for quick PDF page images. Choose Adobe when PDF is core professional infrastructure for your work.',
    faqs: [
      {
        question: 'Does conversion preserve fonts as text?',
        answer: 'JPG is a picture of the page. Text becomes pixels — fine for viewing, not for text editing.',
      },
    ],
  },
];
