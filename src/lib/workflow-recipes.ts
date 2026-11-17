export interface WorkflowStepSpec {
  id: string;
  title: string;
  subtitle: string;
  execution: 'client' | 'hybrid' | 'server';
  toolSlug: string;
}

export interface WorkflowRecipe {
  slug: string;
  title: string;
  shortTitle: string;
  category: string;
  badge: string;
  description: string;
  heroSummary: string;
  accept: string;
  multiple: boolean;
  maxFiles: number;
  fileHint: string;
  outputLabel: string;
  outputExt: 'pdf' | 'csv' | 'webp' | 'jpg';
  steps: WorkflowStepSpec[];
  highlights: string[];
  faqs: Array<{ question: string; answer: string }>;
  relatedWorkflows: string[];
}

export const WORKFLOW_RECIPES: WorkflowRecipe[] = [
  {
    slug: 'federal-court-pacer-pdf-prep',
    title: 'Federal Court PACER PDF Prep Pipeline',
    shortTitle: 'PACER Court PDF Prep',
    category: 'Legal & Litigation',
    badge: 'CM/ECF & PACER',
    description:
      'Combine court exhibits in your browser, convert scans to crisp 300 DPI monochrome, stamp sequential Bates numbers, and flatten into archival PDF/A.',
    heroSummary:
      'Upload exhibits once to run an end-to-end litigation filing pipeline: browser-native Merge, Grayscale conversion, Bates stamping, and PDF flattening/archival.',
    accept: '.pdf,application/pdf',
    multiple: true,
    maxFiles: 25,
    fileHint: 'Select 1 or more PDF filings/exhibits (.pdf)',
    outputLabel: 'Download PACER-Ready PDF/A',
    outputExt: 'pdf',
    steps: [
      {
        id: 'merge',
        title: 'Merge Exhibits & Filings',
        subtitle: 'Combines uploaded PDFs locally in browser memory',
        execution: 'client',
        toolSlug: 'merge-pdf',
      },
      {
        id: 'grayscale',
        title: 'Grayscale 300 DPI Normalize',
        subtitle: 'Converts color pages to compact monochrome court stream',
        execution: 'hybrid',
        toolSlug: 'grayscale-pdf',
      },
      {
        id: 'bates',
        title: 'Sequential Bates Numbering',
        subtitle: 'Stamps configurable prefix & zero-padded exhibit IDs',
        execution: 'server',
        toolSlug: 'bates-numbering-pdf',
      },
      {
        id: 'pdfa',
        title: 'Flatten & PDF/A Archival',
        subtitle: 'Flattens annotations and applies archival PDF/A-2b profile',
        execution: 'hybrid',
        toolSlug: 'pdf-to-pdfa',
      },
    ],
    highlights: [
      'Sequential Bates stamping across merged multi-exhibit packets',
      'Grayscale stream optimization trims CM/ECF filing payload size',
      'Flattens active annotations & embedded form widgets before submission',
    ],
    faqs: [
      {
        question: 'Does the PACER pipeline keep page order across merged exhibits?',
        answer:
          'Yes. Files are merged in your exact staged sequence before sequential Bates numbering starts on Page 1.',
      },
      {
        question: 'Can I customize the Bates prefix and starting index?',
        answer:
          'Yes. Set any case prefix (such as PLF- or EXH-) and starting Bates number right in the pipeline options before clicking Run.',
      },
    ],
    relatedWorkflows: ['gdpr-hipaa-document-sanitization', 'freelance-contract-sign-and-lock'],
  },
  {
    slug: 'freelance-contract-sign-and-lock',
    title: 'Freelance Contract Fill, Sign & Lock Pipeline',
    shortTitle: 'Contract Fill, Sign & Lock',
    category: 'Freelance & Contracts',
    badge: 'ESIGN + SHA-256',
    description:
      'Auto-fill contract AcroForm fields, append your electronic signature plus a SHA-256 Audit Verification Certificate page, flatten, and lock the final PDF.',
    heroSummary:
      'Execute client SOWs and NDAs cleanly in one pass: populate fillable fields, embed your signature + cryptographic SHA-256 certificate, and lock against post-signature edits.',
    accept: '.pdf,application/pdf',
    multiple: false,
    maxFiles: 1,
    fileHint: 'Upload a contract, SOW, or NDA PDF (.pdf)',
    outputLabel: 'Download Signed & Locked PDF',
    outputExt: 'pdf',
    steps: [
      {
        id: 'fill',
        title: 'Fill Contract Form Fields',
        subtitle: 'Populates client/contractor details in browser memory',
        execution: 'client',
        toolSlug: 'fill-pdf',
      },
      {
        id: 'sign',
        title: 'Sign PDF + SHA-256 Audit Certificate',
        subtitle: 'Places signature and appends timestamped SHA-256 verification page',
        execution: 'client',
        toolSlug: 'sign-pdf',
      },
      {
        id: 'lock',
        title: 'Flatten & Protect PDF',
        subtitle: 'Locks fillable fields and applies optional AES encryption password',
        execution: 'hybrid',
        toolSlug: 'protect-pdf',
      },
    ],
    highlights: [
      'Client-side SHA-256 document digest computed via Web Crypto',
      'Appends US ESIGN / EU eIDAS Verification Certificate page automatically',
      'Optional owner/open password protection prevents post-execution tampering',
    ],
    faqs: [
      {
        question: 'What happens if my contract PDF has no AcroForm fields?',
        answer:
          'If no interactive fields exist, the runner cleanly stamps your typed party name onto the top margin or skips empty fields cleanly and proceeds straight to signature placement and Audit Trail generation.',
      },
      {
        question: 'Is password encryption required to complete the pipeline?',
        answer:
          'No. Enter a password if you want full file encryption, or leave it blank to flatten and lock the signed PDF in read-only mode inside your browser.',
      },
    ],
    relatedWorkflows: ['gdpr-hipaa-document-sanitization', 'federal-court-pacer-pdf-prep'],
  },
  {
    slug: 'uscis-immigration-packet-builder',
    title: 'USCIS & Visa Immigration Packet Builder',
    shortTitle: 'USCIS Packet Builder',
    category: 'Immigration & Visas',
    badge: 'USCIS ELIS <24MB',
    description:
      'Convert iPhone HEIC and JPG scans to Letter PDFs, merge exhibits with a Table of Contents and stamped Exhibit tabs, and compress strictly under USCIS upload caps.',
    heroSummary:
      'Turn scattered phone photos and PDFs into an adjudicator-ready USCIS evidence bundle complete with Table of Contents, Exhibit labels, and size verification under 24 MB.',
    accept: '.pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,application/pdf,image/*',
    multiple: true,
    maxFiles: 30,
    fileHint: 'Upload mixed HEIC/JPG/PNG evidence photos and PDFs',
    outputLabel: 'Download USCIS Evidence Packet',
    outputExt: 'pdf',
    steps: [
      {
        id: 'photos-to-pdf',
        title: 'Convert HEIC / JPG Evidence to PDF',
        subtitle: 'Decodes photos and normalizes pages to US Letter',
        execution: 'hybrid',
        toolSlug: 'image-to-pdf',
      },
      {
        id: 'merge-toc',
        title: 'Merge Packet + Exhibit TOC',
        subtitle: 'Stamps Exhibit A/B/C headers and builds Table of Contents',
        execution: 'client',
        toolSlug: 'uscis-pdf-packet-merger',
      },
      {
        id: 'compress-24mb',
        title: 'Verify & Compress Under 24 MB',
        subtitle: 'Ensures total packet meets strict USCIS ELIS portal upload caps',
        execution: 'hybrid',
        toolSlug: 'compress-pdf',
      },
    ],
    highlights: [
      'Accepts mixed HEIC iPhone photos, JPG scans, and existing PDFs in one queue',
      'Generates a structured Exhibit Table of Contents on Page 1',
      'Automatically compresses oversized evidence bundles to fit under 24 MB',
    ],
    faqs: [
      {
        question: 'Can I mix HEIC photos from iPhone with tax transcript PDFs?',
        answer:
          'Yes. HEIC/JPG/PNG uploads are automatically normalized into clean US Letter PDF pages before merging with your uploaded PDFs.',
      },
      {
        question: 'What if the merged packet is already under 24 MB?',
        answer:
          'We verify the byte budget automatically and still run smart optimization when helpful without inflating text-only PDFs.',
      },
    ],
    relatedWorkflows: ['federal-court-pacer-pdf-prep', 'us-passport-photo-print-sheet'],
  },
  {
    slug: 'bookkeeper-bank-statement-cleanse',
    title: 'Bookkeeper Bank Statement to Clean QBO CSV',
    shortTitle: 'Bank Statement Cleanse',
    category: 'Bookkeeping & Finance',
    badge: 'QuickBooks 3-Col CSV',
    description:
      'Unlock password-protected bank PDFs if needed, extract transactions into QuickBooks Online 3-Column CSV, and mask sensitive account numbers & PII in one pass.',
    heroSummary:
      'Built for CPAs and bookkeepers: handle encrypted monthly e-statements, normalize signed inflows/outflows for QuickBooks Online, and output a redacted statement archive.',
    accept: '.pdf,application/pdf',
    multiple: false,
    maxFiles: 1,
    fileHint: 'Upload a monthly bank or credit card statement (.pdf)',
    outputLabel: 'Download QuickBooks CSV',
    outputExt: 'csv',
    steps: [
      {
        id: 'unlock',
        title: 'Unlock Encrypted Statement PDF',
        subtitle: 'Removes password protection automatically when a password is supplied',
        execution: 'hybrid',
        toolSlug: 'unlock-pdf',
      },
      {
        id: 'extract-qbo',
        title: 'Extract QuickBooks Online CSV',
        subtitle: 'Parses Date, Description & signed Amount (+/-) into QBO 3-Col schema',
        execution: 'server',
        toolSlug: 'bank-statement-to-excel',
      },
      {
        id: 'redact-acct',
        title: 'Mask Account Digits & Generate Safe PDF',
        subtitle: 'Masks SSN/IBAN/account digits in memos + builds 150 DPI redacted archive copy',
        execution: 'hybrid',
        toolSlug: 'redact-pdf',
      },
    ],
    highlights: [
      'Scrubs long account numbers (****XXXX) before ledger import',
      'Produces import-ready QuickBooks Online 3-Column CSV directly',
      'Generates a companion redacted PDF audit copy inside your browser',
    ],
    faqs: [
      {
        question: 'What if my bank PDF is not password-protected?',
        answer:
          'Step 1 detects encryption automatically, passes unlocked statements straight through without friction, and only prompts decryption when encrypted.',
      },
      {
        question: 'Can I download both the QuickBooks CSV and the redacted PDF?',
        answer:
          'Yes. The pipeline downloads your masked QuickBooks 3-Column CSV as the primary output and provides a companion button for the scrubbed Redacted PDF copy.',
      },
    ],
    relatedWorkflows: ['gdpr-hipaa-document-sanitization', 'freelance-contract-sign-and-lock'],
  },
  {
    slug: 'ecommerce-product-photo-studio',
    title: 'E-Commerce Product Photo Studio Pipeline',
    shortTitle: 'Product Photo Studio',
    category: 'E-Commerce & Marketplaces',
    badge: '2000×2000 WebP <150KB',
    description:
      'Cut out product backgrounds automatically, center items on a pure #FFFFFF 2000×2000 studio square canvas, and compress to fast-loading WebP under 150 KB.',
    heroSummary:
      'Turn smartphone product shots into Amazon/Shopify main-image ready assets: AI subject cutout, 2000×2000 pure-white canvas padding, and <150 KB WebP compression.',
    accept: '.jpg,.jpeg,.png,.webp,.heic,.heif,image/*',
    multiple: false,
    maxFiles: 1,
    fileHint: 'Upload a product photo (.jpg, .png, .webp, .heic)',
    outputLabel: 'Download 2000×2000 WebP (<150KB)',
    outputExt: 'webp',
    steps: [
      {
        id: 'remove-bg',
        title: 'Remove Background (AI / ONNX)',
        subtitle: 'Isolates foreground product cutout with clean transparency',
        execution: 'server',
        toolSlug: 'remove-image-background',
      },
      {
        id: 'square-white',
        title: 'Center on 2000×2000 White Canvas',
        subtitle: 'Places subject cleanly with 85% studio margin on #FFFFFF',
        execution: 'client',
        toolSlug: 'resize-image',
      },
      {
        id: 'compress-webp',
        title: 'Compress WebP Under 150 KB',
        subtitle: 'Encodes high-clarity WebP strictly within 150 KB storefront budget',
        execution: 'hybrid',
        toolSlug: 'compress-image',
      },
    ],
    highlights: [
      'Pure #FFFFFF backdrop compliant with Amazon & Google Shopping feeds',
      'Exact 2000×2000 px square output preserves zoom capability',
      'Adaptive WebP compression meets <150 KB Core Web Vitals targets',
    ],
    faqs: [
      {
        question: 'Does the 2000×2000 studio step crop or stretch the product?',
        answer:
          'Neither. It preserves your subject aspect ratio cleanly inside an 86% centered safe frame over a pure white 2000×2000 canvas.',
      },
      {
        question: 'Why export WebP under 150 KB?',
        answer:
          'Modern storefronts like Shopify and WooCommerce prioritize <150 KB WebP assets for fast LCP scores while maintaining crisp detail at 2000×2000 pixels.',
      },
    ],
    relatedWorkflows: ['us-passport-photo-print-sheet', 'thermal-shipping-label-batch-prep'],
  },
  {
    slug: 'us-passport-photo-print-sheet',
    title: 'US Passport Photo 4×6 Walgreens Print Sheet',
    shortTitle: 'Passport 4×6 Print Sheet',
    category: 'Passport & Identity',
    badge: '6-Up 300 DPI Sheet',
    description:
      'Remove cluttered backgrounds to biometric white, crop precisely to 2×2 inch (600×600 px), and arrange a 6-photo 4×6 inch Walgreens/CVS print sheet.',
    heroSummary:
      'Skip $16 pharmacy photo fees: run one selfie through background whitening, 2×2 inch (600×600 px) scaling, and 6-up 4×6 inch (1800×1200 px @ 300 DPI) print layout.',
    accept: '.jpg,.jpeg,.png,.webp,.heic,.heif,image/*',
    multiple: false,
    maxFiles: 1,
    fileHint: 'Upload a well-lit front portrait photo',
    outputLabel: 'Download 4×6 Print Sheet (JPG)',
    outputExt: 'jpg',
    steps: [
      {
        id: 'remove-bg-white',
        title: 'Remove Background to Biometric White',
        subtitle: 'Replaces background with uniform pure white studio backdrop',
        execution: 'hybrid',
        toolSlug: 'remove-image-background',
      },
      {
        id: 'crop-2x2',
        title: 'Crop to 2×2 Inch (600×600 px)',
        subtitle: 'Frames head & shoulders into exact 1:1 US State Dept proportions',
        execution: 'client',
        toolSlug: 'passport-size-photo',
      },
      {
        id: 'print-sheet',
        title: 'Generate 4×6 Inch 6-Photo Print Sheet',
        subtitle: 'Tiles 6 identical 600×600 photos onto an 1800×1200 px 300 DPI canvas',
        execution: 'client',
        toolSlug: 'passport-size-photo',
      },
    ],
    highlights: [
      'Exact 1800×1200 px @ 300 DPI matches 6×4 inch Walgreens / CVS / Walmart kiosks',
      'Zero border cropping distortion — includes light cut-guide hairlines',
      'Also provides single 2×2" (600×600 px) digital DS-160 download in checkpoint preview',
    ],
    faqs: [
      {
        question: 'How do I print the 4×6 sheet at Walgreens, CVS, or Walmart?',
        answer:
          'Upload the downloaded 1800×1200 JPG as a standard 4×6 inch photo print (~$0.35), pick it up in-store, and trim neatly along the 2×2 inch guide lines.',
      },
      {
        question: 'Can I download the single 600×600 px digital passport photo too?',
        answer:
          'Yes. Step 2 outputs the single 600×600 px image in the intermediate checkpoint preview so you can grab both digital and print versions.',
      },
    ],
    relatedWorkflows: ['ecommerce-product-photo-studio', 'uscis-immigration-packet-builder'],
  },
  {
    slug: 'thermal-shipping-label-batch-prep',
    title: 'Thermal Shipping Label Batch Prep Pipeline',
    shortTitle: 'Thermal Label Batch Prep',
    category: 'Fulfillment & Logistics',
    badge: '4×6" Rollo / Zebra',
    description:
      'Merge multi-order marketplace shipping PDFs, crop A4/Letter sheets (USPS, UPS, FedEx, eBay, Etsy, Poshmark, Amazon FBA, Royal Mail, DHL) to 4×6 thermal, and optimize contrast.',
    heroSummary:
      'Streamline daily warehouse dispatch: batch-merge label PDFs, auto-crop full-page carrier PDFs into exact 4×6 inch thermal labels, and convert to crisp monochrome.',
    accept: '.pdf,application/pdf',
    multiple: true,
    maxFiles: 30,
    fileHint: 'Upload 1 or more carrier label PDFs (.pdf)',
    outputLabel: 'Download 4×6" Batch Thermal PDF',
    outputExt: 'pdf',
    steps: [
      {
        id: 'merge-labels',
        title: 'Merge Marketplace Label PDFs',
        subtitle: 'Combines carrier PDFs into a single dispatch queue locally',
        execution: 'client',
        toolSlug: 'merge-pdf',
      },
      {
        id: 'crop-thermal',
        title: 'Crop A4 / Letter to 4×6" Thermal',
        subtitle: 'Extracts barcode region for Rollo, Zebra, Munbyn & DYMO 4XL',
        execution: 'server',
        toolSlug: 'shipping-label-cropper',
      },
      {
        id: 'contrast-gray',
        title: 'High-Contrast Monochrome Optimize',
        subtitle: 'Eliminates fuzzy halftone gray for sharp thermal barcode scans',
        execution: 'hybrid',
        toolSlug: 'grayscale-pdf',
      },
    ],
    highlights: [
      'Supports USPS, UPS, FedEx, eBay, Etsy, Poshmark, Amazon FBA, Royal Mail & DHL',
      'Outputs exact 288×432 pt (4×6 in) pages ready for thermal rolls',
      'Monochrome optimization improves barcode scanner read rates on thermal media',
    ],
    faqs: [
      {
        question: 'Which thermal printers are supported?',
        answer:
          'Outputs standard 4×6 inch (288×432 pt) pages compatible with Rollo, Zebra GX/ZP/ZD series, Munbyn, Nelko, and DYMO 4XL.',
      },
      {
        question: 'Can I batch multiple eBay or Etsy label PDFs at once?',
        answer:
          'Yes. Select up to 30 PDFs and Step 1 merges them before cropping every label uniformly to 4×6 thermal size.',
      },
    ],
    relatedWorkflows: ['federal-court-pacer-pdf-prep', 'ecommerce-product-photo-studio'],
  },
  {
    slug: 'gdpr-hipaa-document-sanitization',
    title: 'GDPR & HIPAA Document Sanitization Pipeline',
    shortTitle: 'GDPR & HIPAA Sanitization',
    category: 'Privacy & Compliance',
    badge: 'Zero Text Leak',
    description:
      'Auto-detect and permanently raster-scrub SSN, EIN, IBAN, credit card, email, and phone PII, wipe XMP/EXIF/Info metadata, and flatten to a read-only PDF.',
    heroSummary:
      'True defense-in-depth document redaction: combines pattern detection + 150 DPI canvas rasterization + deep XMP/trailer sanitization + read-only flattening.',
    accept: '.pdf,application/pdf',
    multiple: false,
    maxFiles: 1,
    fileHint: 'Upload a sensitive contract, medical, HR, or compliance PDF (.pdf)',
    outputLabel: 'Download Sanitized Read-Only PDF',
    outputExt: 'pdf',
    steps: [
      {
        id: 'redact-pii',
        title: 'Auto-Detect & Raster-Scrub SSN / IBAN / PII',
        subtitle: 'Detects sensitive patterns and permanently burns redaction boxes at 150 DPI',
        execution: 'client',
        toolSlug: 'redact-pdf',
      },
      {
        id: 'sanitize-meta',
        title: 'Purge XMP, EXIF & Info Metadata',
        subtitle: 'Deletes Author, Creator, Producer, timestamps, and orphan XMP streams',
        execution: 'hybrid',
        toolSlug: 'sanitize-pdf',
      },
      {
        id: 'flatten-ro',
        title: 'Flatten to Read-Only PDF',
        subtitle: 'Flattens annotations/forms and computes SHA-256 verification digest',
        execution: 'client',
        toolSlug: 'flatten-pdf',
      },
    ],
    highlights: [
      'Rasterizes redacted pages in-browser so copy-paste never recovers masked SSNs or IBANs',
      'Strips hidden catalog XMP XML packets and Document Info properties',
      'Outputs a clean, un-editable read-only PDF with SHA-256 audit hash',
    ],
    faqs: [
      {
        question: 'Can anyone copy-paste masked text underneath the black bars?',
        answer:
          'No. Step 1 renders each page to an isolated HTML5 canvas bitmap with solid black redaction masks before rebuilding the PDF, permanently destroying underlying text vectors.',
      },
      {
        question: 'What metadata is removed during sanitization?',
        answer:
          'Author, Title, Subject, Keywords, Creator software tags, timestamps, and catalog-level XMP metadata objects are wiped from the PDF structure.',
      },
    ],
    relatedWorkflows: ['bookkeeper-bank-statement-cleanse', 'freelance-contract-sign-and-lock'],
  },
];

export function getWorkflowRecipe(slug: string): WorkflowRecipe | undefined {
  return WORKFLOW_RECIPES.find((r) => r.slug === slug);
}
