import type { ToolContent } from '@/lib/tool-content-data';

interface Tier1BankProfile {
  slug: string;
  bankName: string;
  region: string;
  currency: string;
  accounts: string;
  accountingStack: string;
  unlockHint: string;
  altRelated?: string[];
}

const TIER1_BANKS: Tier1BankProfile[] = [
  {
    slug: 'capital-one-statement-to-excel',
    bankName: 'Capital One',
    region: 'US & Canada',
    currency: 'USD / CAD',
    accounts: '360 Checking, 360 Performance Savings, Spark Business, Quicksilver & Venture credit cards',
    accountingStack: 'QuickBooks Online (3-Col & 4-Col CSV), Xero, Wave Accounting, and Microsoft Excel (.xlsx)',
    unlockHint: 'Capital One digital PDF e-statements downloaded via desktop online banking are unencrypted by default.',
  },
  {
    slug: 'amex-statement-to-excel',
    bankName: 'American Express (Amex)',
    region: 'US, UK, Canada, EU & Australia',
    currency: 'USD / GBP / CAD / AUD',
    accounts: 'Amex Business Platinum, Gold, Blue Business Plus, and personal charge/credit cards',
    accountingStack: 'QuickBooks Online, Xero, Wave, Concur expense workbooks, and Excel (.xlsx)',
    unlockHint: 'Amex multi-card consolidated corporate statements preserve cardholder sections; remove any PDF open password with Unlock PDF first.',
  },
  {
    slug: 'us-bank-statement-to-excel',
    bankName: 'U.S. Bank',
    region: 'United States',
    currency: 'USD',
    accounts: 'Smartly Checking, Business Essentials Checking, Platinum Credit Cards & commercial accounts',
    accountingStack: 'QuickBooks Online, QuickBooks Desktop, Wave Accounting, and Excel (.xlsx)',
    unlockHint: 'U.S. Bank statements downloaded from usbank.com use digital text tables that parse directly into Debit/Credit columns.',
  },
  {
    slug: 'pnc-bank-statement-to-excel',
    bankName: 'PNC Bank',
    region: 'United States',
    currency: 'USD',
    accounts: 'Virtual Wallet Checking/Reserve/Growth, PNC Business Checking, and Treasury Management statements',
    accountingStack: 'QuickBooks Online, Xero, Wave, and formatted Excel (.xlsx)',
    unlockHint: 'Virtual Wallet multi-tier statements combine Spend, Reserve, and Growth summaries cleanly into sortable ledger rows.',
  },
  {
    slug: 'navy-federal-statement-to-excel',
    bankName: 'Navy Federal Credit Union (NFCU)',
    region: 'United States & Overseas Military',
    currency: 'USD',
    accounts: 'Free Everyday Checking, Flagship Checking, Share Savings & nRewards/cashRewards cards',
    accountingStack: 'QuickBooks Online, Wave, Mint/Monarch spreadsheets, and Excel (.xlsx)',
    unlockHint: 'NFCU monthly eStatements maintain crisp column coordinates across deposits, ACH transfers, and ATM withdrawals.',
  },
  {
    slug: 'charles-schwab-statement-to-excel',
    bankName: 'Charles Schwab',
    region: 'United States & International',
    currency: 'USD',
    accounts: 'Schwab Bank Investor Checking, High Yield Savings, and Brokerage cash/trade activity summaries',
    accountingStack: 'Excel (.xlsx) workbooks, CPA tax preparation schedules, QuickBooks Online, and Xero CSV',
    unlockHint: 'Schwab combined bank & brokerage PDF statements often separate Bank Sweep and card activity — review columns interactively before download.',
  },
  {
    slug: 'lloyds-bank-statement-to-excel',
    bankName: 'Lloyds Bank',
    region: 'United Kingdom',
    currency: 'GBP (£)',
    accounts: 'Classic, Club Lloyds, Platinum, and Lloyds Business Bank Account PDF statements',
    accountingStack: 'Xero UK (*Date/*Amount CSV), QuickBooks UK, FreeAgent, Sage UK, and Excel (.xlsx)',
    unlockHint: 'Lloyds Bank statements use DD Mon YY / UK GBP notation; check the Debit/Credit swap toggle in our live preview if reversing card refunds.',
  },
  {
    slug: 'natwest-bank-statement-to-excel',
    bankName: 'NatWest',
    region: 'United Kingdom',
    currency: 'GBP (£)',
    accounts: 'Select, Premier, Foundation, and NatWest Business Banking digital statements',
    accountingStack: 'Xero UK, FreeAgent, QuickBooks Online UK, Sage Business Cloud, and Excel (.xlsx)',
    unlockHint: 'NatWest Faster Payments, BACS credits, and Direct Debit memos merge cleanly across multi-line UK narrative wraps.',
  },
  {
    slug: 'santander-uk-statement-to-excel',
    bankName: 'Santander UK',
    region: 'United Kingdom',
    currency: 'GBP (£)',
    accounts: 'Edge Current Account, Everyday Current, 1|2|3 Business Current & Credit Card PDFs',
    accountingStack: 'Xero UK, QuickBooks UK, Sage, FreeAgent, and Excel (.xlsx)',
    unlockHint: 'Santander UK cashback credits and card debits extract with two-decimal precision ready for HMRC Making Tax Digital (MTD) bookkeeping.',
  },
  {
    slug: 'revolut-statement-to-excel',
    bankName: 'Revolut',
    region: 'UK, EU, US & Australia',
    currency: 'GBP / EUR / USD / Multi-Currency',
    accounts: 'Revolut Personal & Revolut Business multi-currency pockets (USD, EUR, GBP, AUD)',
    accountingStack: 'Xero CSV, QuickBooks Online 3-Col/4-Col CSV, Wave, and Excel (.xlsx)',
    unlockHint: 'Revolut FX fee notes and counterparty descriptions join into single transaction lines with exact timestamps preserved.',
  },
  {
    slug: 'monzo-bank-statement-to-excel',
    bankName: 'Monzo Bank',
    region: 'United Kingdom',
    currency: 'GBP (£)',
    accounts: 'Monzo Personal Current, Joint Accounts, Monzo Business Pro & Tax Pots statements',
    accountingStack: 'Xero UK, FreeAgent, QuickBooks Online, Wave, and Excel (.xlsx)',
    unlockHint: 'Monzo PDF export statements list Pot transfers and merchant categories in clean tabular rows compatible with immediate Xero upload.',
  },
  {
    slug: 'rbc-bank-statement-to-excel',
    bankName: 'RBC Royal Bank',
    region: 'Canada',
    currency: 'CAD ($)',
    accounts: 'Day to Day Banking, Signature No Limit, RBC Business Chequing & Avion Visa statements',
    accountingStack: 'QuickBooks Online Canada, Xero Canada, Wave Accounting, and Excel (.xlsx)',
    unlockHint: 'RBC e-Statements format Interac e-Transfer details on second lines — our parser concatenates recipient notes onto the primary row.',
  },
  {
    slug: 'bmo-bank-statement-to-excel',
    bankName: 'BMO Bank of Montreal',
    region: 'Canada',
    currency: 'CAD / USD',
    accounts: 'Performance Chequing, eBusiness Plan, BMO Everyday Banking & Mastercard PDFs',
    accountingStack: 'QuickBooks Canada, Wave Accounting, Xero, Sage 50 Canada, and Excel (.xlsx)',
    unlockHint: 'BMO bilingual English/French headers and Interac memos are cleaned automatically before XLSX or 3-column CSV generation.',
  },
  {
    slug: 'scotiabank-statement-to-excel',
    bankName: 'Scotiabank',
    region: 'Canada',
    currency: 'CAD ($)',
    accounts: 'Ultimate Package Chequing, Preferred Chequing, Small Business & Scene+ Visa statements',
    accountingStack: 'QuickBooks Online Canada, Xero, Wave, FreshBooks CSV, and Excel (.xlsx)',
    unlockHint: 'Scotiabank debit/credit point-of-sale trails stay aligned cleanly across multi-page monthly statement downloads.',
  },
  {
    slug: 'commbank-statement-to-excel',
    bankName: 'CommBank (Commonwealth Bank of Australia)',
    region: 'Australia',
    currency: 'AUD ($)',
    accounts: 'Smart Access, Everyday Settlement, CommBank Business Transaction & Award Credit Card statements',
    accountingStack: 'Xero AU, MYOB Business, QuickBooks Online AU, and Excel (.xlsx)',
    unlockHint: 'CommBank NetBank PDFs list BPAY, EFTPOS, and Osko references in multi-line descriptions merged automatically for BAS / ATO prep.',
  },
  {
    slug: 'westpac-statement-to-excel',
    bankName: 'Westpac',
    region: 'Australia & New Zealand',
    currency: 'AUD / NZD',
    accounts: 'Westpac Choice, Business One, Altitude Credit Cards & Cash Management accounts',
    accountingStack: 'Xero AU/NZ, MYOB, QuickBooks Online, and Excel (.xlsx)',
    unlockHint: 'Westpac online statements exported from Live Banking convert directly into structured AUD/NZD debits, credits, and running balances.',
  },
  {
    slug: 'sparkasse-statement-to-excel',
    bankName: 'Sparkasse (Kontoauszug)',
    region: 'Germany & EU',
    currency: 'EUR (€)',
    accounts: 'Sparkasse Girokonto, Geschäftskonto, Tagesgeld & Kreditkartenabrechnung (SEPA / IBAN)',
    accountingStack: 'Microsoft Excel (.xlsx), DATEV / Lexoffice CSV, SevDesk, Xero & QuickBooks EU CSV',
    unlockHint: 'Sparkasse Kontoauszüge often wrap SEPA Mandatsreferenz / Verwendungszweck across multiple lines — review and verify amounts interactively before CSV export.',
  },
];

function buildBankContent(bank: Tier1BankProfile): ToolContent {
  return {
    about: `${bank.bankName} Statement to Excel converts digital PDF statements from ${bank.bankName} (${bank.region}) into clean, structured Microsoft Excel (.xlsx) workbooks and ready-to-import accounting CSV files. Reconciling ${bank.bankName} monthly records manually for tax preparation, mortgage underwriting, or client bookkeeping wastes hours and introduces manual typing errors. Our specialized financial parser recognizes ${bank.bankName} layouts across ${bank.accounts}, separating Transaction Date, Payee/Description, Debit (-), Credit (+), and Running Balance into structured numeric columns. Review your parsed rows interactively in the browser table preview, verify debits and credits, and download directly in ${bank.accountingStack} format.`,
    directAnswer: `${bank.bankName} Statement to Excel extracts dates, merchant descriptions, debits, credits, and running balances (${bank.currency}) from ${bank.bankName} PDF statements into clean Excel (.xlsx), QuickBooks 3-Col/4-Col CSV, Xero CSV, and Wave CSV with interactive pre-download table verification.`,
    steps: [
      {
        title: `Upload your ${bank.bankName} PDF statement`,
        description: `Download the official monthly eStatement PDF from ${bank.bankName} online banking (${bank.accounts}) and drop it into the converter.`,
      },
      {
        title: 'Inspect detected columns interactively',
        description: 'Verify Date, Description, Debit, Credit, and Balance alignment inside the live table preview — search transactions, delete subtotals, or swap columns if needed.',
      },
      {
        title: 'Select accounting export schema',
        description: `Choose Standard Excel (.xlsx), QuickBooks Online 3-Column CSV, QuickBooks 4-Column CSV, Xero CSV, or Wave CSV (${bank.currency}).`,
      },
      {
        title: 'Download & import with zero reformatting',
        description: 'Export your clean spreadsheet and import directly into your accounting software or tax workbook.',
      },
    ],
    commonProblems: [
      {
        problem: `Multi-line payee narratives or SEPA/ACH memos wrapping below the date row`,
        solution: `Our ${bank.bankName} statement parser stitches wrapped memo lines cleanly into the parent transaction row. ${bank.unlockHint}`,
      },
      {
        problem: 'Credits and debits inverted on credit card vs checking PDFs',
        solution: 'Use the 1-click "Invert Debits/Credits" button in the interactive preview table before clicking Download.',
      },
    ],
    features: [
      `Engineered for ${bank.bankName} (${bank.region}) digital PDF statements in ${bank.currency}`,
      'Interactive client table preview: inspect Date, Description, Debit, Credit & Balance before export',
      `Direct presets for ${bank.accountingStack}`,
      'Native floating-point Excel numbers supporting immediate =SUM() and pivot tables',
      'Transient in-memory processing with automatic file purge upon completion',
    ],
    useCases: [
      `Bookkeepers & CPAs preparing ${bank.region} business taxes, BAS/VAT/GST returns, and client reconciliations`,
      `Small business owners importing ${bank.bankName} statements into QuickBooks, Xero, or Wave`,
      'Mortgage applicants & loan underwriters verifying income deposits and average monthly balances',
      'Auditors and personal finance analysts building annual cash-flow Excel workbooks',
    ],
    faqs: [
      {
        question: `Does this work with all ${bank.bankName} account types?`,
        answer: `Yes. It supports ${bank.accounts}. Multi-page monthly and annual statement PDFs are merged cleanly into one continuous transaction table.`,
      },
      {
        question: 'Which QuickBooks and Xero formats are supported?',
        answer: 'You can export formatted Microsoft Excel (.xlsx), QuickBooks Online 3-Column CSV (Date, Description, Amount), QuickBooks 4-Column CSV (Date, Description, Credit, Debit), Xero (*Date, *Amount, Payee, Description), and Wave Accounting CSV.',
      },
      {
        question: `What if my ${bank.bankName} PDF is scanned or password-protected?`,
        answer: 'If your bank PDF requires a password, remove it first using our Unlock PDF tool. If your statement was printed and scanned as a flat image, convert it with our OCR PDF tool before table extraction.',
      },
      {
        question: 'Can I preview transactions before downloading Excel?',
        answer: 'Yes. Every transaction displays in an interactive preview table showing summary totals, debits, credits, net change, and column filters prior to export.',
      },
    ],
    supportedFormats: 'Input: PDF (.pdf) | Output: XLSX, QBO CSV, Xero CSV, Wave CSV',
    relatedTools: bank.altRelated ?? ['bank-statement-to-excel', 'qbo-ofx-qfx-to-excel-csv', 'pdf-to-excel', 'unlock-pdf'],
  };
}

export const TIER1_TOOL_CONTENT_MAP: Record<string, ToolContent> = {
  'shipping-label-cropper': {
    about: 'Shipping Label Cropper transforms standard 8.5×11" US Letter and A4 carrier sheets into ready-to-print 4×6 inch (100×150 mm) thermal labels. E-commerce sellers shipping via USPS Click-N-Ship, UPS, FedEx, eBay, Etsy, Poshmark, Mercari, Shopify, Amazon FBA, Royal Mail (UK), and DHL (DE/EU) commonly receive half-sheet or full-page PDFs with wasted white space or attached packing slips. Our vector PDF cropper trims barcode areas accurately without rasterizing, preserving crisp 300+ DPI barcodes calibrated for Rollo, Zebra, Munbyn, and DYMO LabelWriter 4XL printers—while also keeping Flipkart, Meesho, Amazon India, and India Post available under the India Marketplace Presets tab.',
    directAnswer: 'Crop 8.5×11" and A4 shipping sheets into exact 4×6" (100×150mm) thermal labels for USPS Click-N-Ship, UPS, FedEx, eBay, Etsy, Poshmark, Mercari, Shopify, Amazon FBA, Royal Mail, and DHL on Rollo, Zebra, Munbyn, and DYMO 4XL printers.',
    steps: [
      { title: 'Upload your carrier or marketplace PDF', description: 'Drop single-order or multi-page batch PDFs from USPS, UPS, FedEx, eBay, Etsy, Poshmark, Royal Mail, DHL, or India marketplaces.' },
      { title: 'Select your carrier preset & printer profile', description: 'Pick a Tier-1 carrier preset (or switch to India Marketplace Presets) and select Rollo, Zebra, Munbyn, DYMO 4XL, or 100×150mm.' },
      { title: 'Toggle packing slip separation & orientation', description: 'Optionally split lower packing slips onto separate pages and rotate labels 90° or 180° for thermal feeder alignment.' },
      { title: 'Download your crisp 4×6" thermal PDF', description: 'Export vector-sharp barcode labels ready for immediate 100%-scale printing.' },
    ],
    features: [
      'US/UK/EU Tier-1 presets: USPS Click-N-Ship, UPS, FedEx, eBay, Etsy, Poshmark, Mercari, Shopify, Amazon FBA, Royal Mail & DHL',
      'Dedicated India Marketplace Presets tab for Flipkart, Meesho, Amazon Easy Ship & India Post',
      'Calibrated thermal profiles for Rollo, Zebra GK420d/ZP450, Munbyn & DYMO LabelWriter 4XL (4×6 in / 100×150 mm)',
      'Auto-detects landscape 2-up carrier sheets vs top-half portrait shipping labels',
      'Vector pdf-lib cropping keeps QR codes and USPS/UPS barcodes razor-sharp with zero re-compression',
    ],
    useCases: [
      'Poshmark, eBay, Etsy & Mercari sellers printing daily orders on Rollo or Munbyn 4×6" thermal rolls without scissors and tape',
      'Shopify & WooCommerce merchants batch-cropping USPS Click-N-Ship, UPS, and FedEx multi-page order queues',
      'UK & EU sellers formatting Royal Mail Click & Drop and DHL Paketschein A4 PDFs onto 100×150 mm thermal rolls',
      'Indian sellers quickly switching to the India Marketplace tab for Flipkart & Meesho GST invoice separation',
    ],
    faqs: [
      { question: 'Does it work with USPS Click-N-Ship, Poshmark, eBay, and Etsy labels?', answer: 'Yes. Select the matching Tier-1 carrier preset to automatically crop half-sheet 8.5×11" portrait or landscape shipping labels directly onto 4×6" thermal pages.' },
      { question: 'Which thermal printers are supported?', answer: 'It outputs exact 288×432 pt (4×6 inch) or 100×150 mm pages compatible with Rollo, Zebra, Munbyn, DYMO LabelWriter 4XL, Brother QL, and TSC/TVS thermal printers.' },
      { question: 'Will barcodes become blurry after cropping?', answer: 'No. We embed and transform vector PDF objects directly via pdf-lib without bitmap screenshots, keeping every barcode 100% vector sharp.' },
      { question: 'Where are Flipkart and Meesho presets?', answer: 'Click the "India Marketplace Presets" tab above the carrier grid to access Flipkart, Meesho, Amazon India, and India Post presets.' },
    ],
    commonProblems: [
      { problem: 'Label prints too small on 4×6 paper', solution: 'Ensure your browser/OS print dialog is set to Scale: 100% (Actual Size) and Page Size: 4×6 in (100×150mm).' },
      { problem: 'Sideways landscape PDF (11×8.5") clips half the barcode', solution: 'Our updated engine automatically detects landscape 2-up sheets and crops left/right halves cleanly onto 4×6 portrait.' },
    ],
    supportedFormats: 'Input: PDF (.pdf) | Output: 4×6" / 100×150mm Thermal PDF',
    relatedTools: ['amazon-fba-thermal-label-converter', 'crop-pdf', 'split-pdf', 'rotate-pdf'],
  },

  'fill-sign-irs-w9-pdf': {
    about: 'Fill & Sign IRS Form W-9 & W-8BEN PDF lets US freelancers, LLCs, contractors, agencies, and international vendors complete, electronically sign, and flatten IRS tax forms inside their browser with zero server uploads. Sensitive Taxpayer Identification Numbers (SSNs, EINs, and FTINs) and handwritten e-signatures remain strictly inside local client memory. Upload any official Form W-9 / W-8BEN PDF from IRS.gov to populate its AcroForm fields automatically, or generate a clean, structured tax PDF on the fly, complete with AcroForm field flattening (preventing recipient modification) and an optional SHA-256 ESIGN Audit Trail Certificate.',
    directAnswer: 'Complete, e-sign, and flatten IRS Form W-9 and Form W-8BEN PDFs 100% privately inside your browser — sensitive SSN and EIN numbers never leave your device.',
    steps: [
      { title: 'Select Form W-9 or Form W-8BEN', description: 'Choose US Form W-9 or non-US Form W-8BEN, or click Upload Blank IRS PDF to load an existing AcroForm file.' },
      { title: 'Enter taxpayer & classification details', description: 'Fill Legal Name, DBA, Tax Classification (Sole Proprietor, LLC, S-Corp, C-Corp, Partnership), Address, and SSN/EIN/FTIN.' },
      { title: 'Draw or type Part II signature', description: 'Sign cleanly inside the certification pad, select date, and toggle AcroForm flattening + SHA-256 Audit Certificate.' },
      { title: 'Download flattened signed PDF', description: 'Export your tamper-resistant W-9/W-8BEN PDF ready for client AP departments and 1099 onboarding.' },
    ],
    features: [
      '100% Client-Side Private Mode: SSNs, EINs, and signatures never touch any remote server',
      'Automatic AcroForm detection when loading official IRS.gov fw9.pdf / fw8ben.pdf templates',
      'Built-in instant template generator if you do not have a blank IRS PDF handy',
      'Supports Federal Tax Classifications including LLC codes (C, S, P), Exempt Codes & W-8BEN FTIN',
      '1-click form flattening + optional SHA-256 ESIGN Verification Certificate page',
    ],
    useCases: [
      'US freelance contractors & 1099 LLCs sending flattened signed W-9 forms to new B2B clients safely',
      'International contractors & SaaS agencies providing signed Form W-8BEN certificates to US payers',
      'Bookkeepers & vendor onboarding teams standardizing flattened tax forms for audit archives',
      'Real estate investors & landlords collecting W-9 certifications securely without Adobe Acrobat Pro',
    ],
    faqs: [
      { question: 'Is it safe to enter my SSN or EIN into this W-9 PDF tool?', answer: 'Yes. This workspace runs 100% client-side inside browser memory using pdf-lib and Web Crypto. Zero bytes of your SSN, EIN, or signed PDF are ever transmitted to a server.' },
      { question: 'Why should I flatten my completed Form W-9?', answer: 'Flattening converts interactive form text and signature images into fixed page graphics so clients cannot accidentally or maliciously alter your tax ID or signature.' },
      { question: 'Can I upload an official PDF downloaded from IRS.gov?', answer: 'Yes. Upload fw9.pdf or fw8ben.pdf and our parser inspects AcroForm fields automatically, or falls back to clean coordinate placement.' },
      { question: 'Does it support IRS Form W-8BEN for non-US residents?', answer: 'Yes. Toggle Form W-8BEN at the top to capture Country of Citizenship and Foreign Tax Identifying Number (FTIN).' },
    ],
    supportedFormats: 'Input: Blank IRS W-9/W-8BEN PDF (optional) | Output: Flattened Signed PDF',
    relatedTools: ['sign-pdf', 'protect-pdf', 'redact-pdf', 'compress-pdf'],
  },

  'amazon-fba-thermal-label-converter': {
    about: 'Amazon FBA 30-Up FNSKU & Box Label Thermal Converter turns Amazon Seller Central multi-label PDFs into individual thermal printer rolls in seconds. Seller Central typically exports 30-up Avery 5160 (3×10) FNSKU sheets on 8.5×11" US Letter paper or dual 2-up box shipment & partner carrier sheets—forcing FBA sellers to waste inkjet sheet labels or manually snapshot barcodes. Our client-side pdf-lib vector splitter cleanly slices each grid cell onto DYMO 30334 (2.25"×1.25"), DYMO 30252, Rollo 2"×1", or 4"×6" thermal labels, detects empty trailing cells via pdfjs-dist so blank sticker paper is skipped, and preserves sharp vector FNSKU/UPC barcodes.',
    directAnswer: 'Convert Seller Central 30-up Avery 5160 FNSKU sheets and 8.5×11" FBA box shipment PDFs into crisp individual DYMO, Rollo, Munbyn, and Zebra thermal barcode labels locally in browser.',
    steps: [
      { title: 'Upload your Seller Central PDF', description: 'Drop a 30-up FNSKU item label sheet or an 8.5×11" / A4 FBA Box Shipment & UPS carrier PDF.' },
      { title: 'Choose FNSKU 30-up or 8.5×11" Box Split mode', description: 'Pick Avery 5160 (3×10), Dual FBA Box Split (4×6"), or enter custom UK/EU A4 grid dimensions (21-up, 24-up, 40-up).' },
      { title: 'Select thermal barcode stock', description: 'Choose DYMO 30334 (2.25×1.25"), DYMO 30252, Rollo 2×1", Rollo 3×1", or 4×6" and enable Auto-Skip Blank Cells.' },
      { title: 'Download thermal roll PDF', description: 'Print sharp, scan-ready FNSKU & Box ID barcodes directly on your thermal printer.' },
    ],
    features: [
      'Splits 30-up FNSKU Letter sheets (Avery 5160) into sequential 1-per-page thermal barcode files',
      'Automatically detects & skips blank trailing cells on partial FNSKU sheets',
      'Splits 8.5×11" FBA Box Label + UPS/FedEx Partner Carrier 2-up sheets cleanly onto 4×6" thermal rolls',
      'Supports custom EU/UK A4 sticker grids (21-up, 24-up, 40-up) with 0°/90°/180°/270° rotation',
      '100% browser-native vector pdf-lib processing ensures zero barcode pixelation',
    ],
    useCases: [
      'Amazon FBA private-label and wholesale sellers prepping FNSKU units with DYMO 30334 or Rollo printers',
      '3PL prep centers converting client Seller Central PDFs without buying desktop subscription tools',
      'Multi-box FBA inbound shipments separating partner UPS labels and Amazon Box ID labels onto 4×6" rolls',
      'UK & EU Amazon sellers formatting A4 multi-up FNSKU exports onto thermal rolls',
    ],
    faqs: [
      { question: 'What label size should I use for Amazon FBA FNSKU barcodes?', answer: 'Most FBA sellers use DYMO 30334 (2.25" × 1.25" / 57×32mm) or 2" × 1" Rollo/Zebra thermal labels. Both presets are built in.' },
      { question: 'How does Auto-Skip Blank Trailing Cells work?', answer: 'Using pdfjs-dist text detection directly in your browser, we check which grid cells actually contain FNSKU barcode text/titles and exclude empty trailing positions.' },
      { question: 'Will FBA warehouse scanners read these barcodes reliably?', answer: 'Yes. We embed vector PDF coordinates rather than low-res screenshots, keeping thin barcode bars crisp at your printer native resolution.' },
      { question: 'Can I split Amazon FBA 8.5×11" box shipment sheets too?', answer: 'Yes — select "8.5×11 FBA Box Split" mode to output both the carrier label and FBA box label onto consecutive 4×6" thermal pages.' },
    ],
    supportedFormats: 'Input: Amazon FNSKU / Box PDF | Output: DYMO / Rollo / 4×6 Thermal PDF',
    relatedTools: ['shipping-label-cropper', 'split-pdf', 'crop-pdf', 'rotate-pdf'],
  },

  'qbo-ofx-qfx-to-excel-csv': {
    about: 'QBO / QFX / OFX to Excel & CSV Converter turns QuickBooks Web Connect (.qbo), Quicken (.qfx), and Open Financial Exchange (.ofx) bank downloads into human-readable Excel (.xlsx) workbooks and clean accounting CSV files locally inside your browser. Many US, UK, Canadian, and Australian banks let business owners download older Web Connect files that fail to import when Intuits 3-year Web Connect cutoff hits, or when accountants simply need to inspect `<STMTTRN>` records, FITIDs, check numbers, and running balances inside Microsoft Excel. Our pure client-side SGML/XML parser reads OFX 1.x and 2.x files instantly with zero server uploads.',
    directAnswer: 'Convert QuickBooks (.qbo), Quicken (.qfx), and .ofx bank files into styled Excel (.xlsx), QuickBooks Online 3-Col CSV, Xero CSV, or Wave CSV 100% client-side in your browser.',
    steps: [
      { title: 'Drop your .QBO, .QFX, or .OFX file', description: 'Select any Web Connect or Open Financial Exchange file (or click Try Sample .QBO File to inspect).' },
      { title: 'Review parsed ledger & FITIDs', description: 'Verify Bank ID, masked Account ID, Total Debits, Total Credits, Net Activity, and Ledger Balance.' },
      { title: 'Select Excel or accounting CSV preset', description: 'Pick formatted Excel (.xlsx), QuickBooks Online 3-Column CSV, Xero CSV (*Date/*Amount), or Wave CSV.' },
      { title: 'Download instantly with zero upload', description: 'Your workbook builds locally in browser memory via JSZip and downloads immediately.' },
    ],
    features: [
      'Parses both OFX 1.x SGML (.qbo / .qfx) and OFX 2.x XML bank & credit card exports',
      'Preserves FITID transaction keys, CHECKNUM check numbers, TRNTYPE, Payee NAME & MEMO notes',
      'Interactive searchable transaction grid with debit/credit totals and Ledger Balance header',
      'Exports true Microsoft Excel (.xlsx) workbooks or QuickBooks 3-Col / Xero / Wave CSVs',
      '100% client-side execution — sensitive banking files never leave your browser',
    ],
    useCases: [
      'QuickBooks Desktop users hit by Web Connect expiration converting legacy .QBO files to CSV for QuickBooks Online import',
      'Quicken users migrating .QFX checking/credit-card histories into Microsoft Excel, Xero, or Wave',
      'CPAs & bookkeepers auditing raw FITID transaction logs across US, Canadian & UK banks',
      'Small business owners opening unreadable .QBO bank downloads without installing desktop software',
    ],
    faqs: [
      { question: 'Why does QuickBooks sometimes reject .QBO files and require CSV instead?', answer: 'When older QuickBooks Desktop Web Connect services sunset or a bank BID changes, converting the .QBO to a QuickBooks 3-Column CSV bypasses the Web Connect restriction cleanly.' },
      { question: 'Are my .QBO or .OFX bank files uploaded to PdfPixels servers?', answer: 'No. Parsing and .XLSX/.CSV generation happen 100% locally inside your browser using JavaScript and JSZip.' },
      { question: 'Does it preserve Check Numbers and Memos?', answer: 'Yes. Both <CHECKNUM>, <FITID>, <NAME>, and <MEMO> tags are extracted into dedicated columns.' },
      { question: 'Can I import the CSV output into Xero or Wave?', answer: 'Yes. Select either the Xero Accounting CSV (*Date, *Amount, Payee, Description, Reference) or Wave Accounting CSV preset before exporting.' },
    ],
    supportedFormats: 'Input: .QBO, .QFX, .OFX, .XML | Output: Excel (.xlsx), CSV',
    relatedTools: ['bank-statement-to-excel', 'pdf-to-excel', 'pdf-to-csv', 'chase-bank-statement-to-excel'],
  },

  'uscis-pdf-packet-merger': {
    about: 'USCIS & Visa Evidence Packet Merger streamlines assembling marriage-based green cards (I-130 / I-485), employment petitions (I-140 EB-1/EB-2 NIW, H-1B, O-1), and naturalization (N-400) evidence binders directly in your browser. USCIS Lockbox and ELIS online portals have strict formatting norms: inconsistent scanned paper sizes (A4 mixed with 8.5×11" photos), missing exhibit labels, unindexed evidence bundles, and hard 12 MB or 24 MB online upload size caps. Our client-side builder normalizes every page onto 8.5×11" US Letter Portrait, generates a crisp Table of Contents cover page with exact Exhibit page numbers, stamps top-right Exhibit tags & Page X of Y footers, and automatically splits oversized packets under 24 MB or 12 MB into compliant PDF volumes.',
    directAnswer: 'Combine immigration evidence PDFs locally in browser with US Letter normalization, an automatic Table of Contents, Exhibit A/B/C stamps, and <24MB / <12MB splitting for USCIS online filing.',
    steps: [
      { title: 'Add supporting evidence PDFs', description: 'Upload forms, passports, birth/marriage certificates, I-94s, leases, bank statements, and W-2 transcripts locally.' },
      { title: 'Label exhibits & drag to order', description: 'Rename each file into clean exhibit titles (Exhibit A, Exhibit B...) and reorder sections sequentially.' },
      { title: 'Configure USCIS Lockbox / ELIS formatting', description: 'Enable US Letter (8.5×11") normalization, Auto Table of Contents cover page, Exhibit headers, and <24MB or <12MB size splitting.' },
      { title: 'Build & download packet privately', description: 'Your assembled packet (or compliant split ZIP) generates locally with zero server upload.' },
    ],
    features: [
      '100% Client-Side Private Mode: sensitive passports, SSNs & immigration evidence stay in browser memory',
      'Automatic Table of Contents cover page with accurate starting page numbers & exhibit page counts',
      'Normalizes mixed A4 / photo / receipt scans onto standard US Letter (8.5×11 in, 612×792 pt)',
      'Stamps clean "Exhibit X: Title" page headers and "Page X of Y" bottom footers',
      'Binary-searched <24 MB / <12 MB automatic splitter for USCIS online myUSCIS / ELIS upload limits',
    ],
    useCases: [
      'Families preparing Form I-130 & I-485 bona-fide marriage green card evidence packets',
      'EB-2 NIW, EB-1A, and O-1 self-petitioners assembling citations, letters of recommendation & degrees into indexed binders',
      'Immigration paralegals packaging H-1B RFEs cleanly under USCIS 12 MB / 24 MB online portal upload ceilings',
      'N-400 applicants compiling 3–5 years of IRS tax transcripts and travel history cleanly',
    ],
    faqs: [
      { question: 'Why does USCIS enforce 12 MB or 24 MB PDF file size limits?', answer: 'Online myUSCIS forms reject individual PDF uploads larger than the portal ceiling (commonly 12 MB for older forms or 24 MB). Our splitter automatically segments oversized packets cleanly along whole-page boundaries into a ZIP.' },
      { question: 'Are my passports and tax transcripts uploaded to PdfPixels?', answer: 'Never. Every pdf-lib operation, Table of Contents layout, stamping, and splitting runs 100% inside your local browser memory.' },
      { question: 'Why normalize mixed pages to US Letter (8.5×11")?', answer: 'USCIS Lockbox scanning equipment and adjudicators strongly recommend uniform US Letter Portrait sheets so exhibits do not clip during automated batch scanning.' },
      { question: 'Do I still need to compress scanned PDFs first?', answer: 'If a single scanned exhibit is huge (>20MB by itself), run it through our Compress PDF tool before assembling the final USCIS binder.' },
    ],
    supportedFormats: 'Input: Multiple PDFs (.pdf) | Output: Single PDF or Split Parts (.zip)',
    relatedTools: ['compress-pdf', 'merge-pdf', 'redact-pdf', 'sign-pdf'],
  },

  'pdf-accessibility-checker': {
    about: 'PDF Accessibility Checker & Auto-Fixer inspects PDF documents against WCAG 2.1, ADA Section 508, and PDF/UA (Matterhorn Protocol) structural metadata rules and repairs common compliance gaps locally in one click. Government agencies, US/UK/EU universities, healthcare providers, and corporate HR portals increasingly reject PDFs missing Document Title metadata, ViewerPreferences DisplayDocTitle flags, primary Language tags (/Lang), /MarkInfo Marked flags, or logical Tab Order (/Tabs /S), or scanned PDFs lacking an accessible text layer. Our browser-native analyzer checks 7 core compliance rules and outputs both a remediated PDF and a machine-readable JSON audit report.',
    directAnswer: 'Audit any PDF against PDF/UA, ADA Section 508, and WCAG 2.1 rules locally, score compliance, and 1-click auto-fix missing Document Title, /Lang tag, DisplayDocTitle, /MarkInfo, and /Tabs /S order.',
    steps: [
      { title: 'Upload your PDF for instant inspection', description: 'Your file is analyzed locally using pdf-lib catalog inspection and pdfjs-dist selectable text verification.' },
      { title: 'Review your WCAG / ADA 508 scorecard', description: 'Check Pass/Warn/Fail status across Title, DisplayDocTitle, /Lang, /Tabs /S, /MarkInfo, Outlines, and Text Layer.' },
      { title: 'Configure 1-Click Auto-Fix metadata', description: 'Set clean Document Title, Author, Primary Language (e.g. en-US, en-GB, de-DE), and enable accessibility flags.' },
      { title: 'Download fixed PDF & JSON audit log', description: 'Save the remediated *-ada-fixed.pdf along with a downloadable JSON WCAG audit report.' },
    ],
    features: [
      'Checks 7 core ADA Section 508, WCAG 2.1, and PDF/UA Matterhorn metadata & structural rules',
      'Uses pdfjs-dist to detect image-only scans lacking selectable text (recommending OCR when needed)',
      '1-Click Auto-Fixer writes /Title, /Author, /Lang, DisplayDocTitle=true, /MarkInfo, and Page /Tabs /S',
      'Exports downloadable JSON compliance scorecard alongside remediated PDF',
      '100% browser-native execution keeps legal, university, and HIPAA files completely private',
    ],
    useCases: [
      'State & federal agencies preparing ADA Title II / Section 508 compliant public PDF postings',
      'University faculty and administrators remediating course syllabi and campus handbooks',
      'Compliance teams auditing vendor brochures and financial disclosures prior to web publishing',
      'Consultants quickly checking whether client PDFs are tagged vs image-only scans needing OCR',
    ],
    faqs: [
      { question: 'What accessibility issues can the 1-Click Auto-Fixer repair automatically?', answer: 'It fixes Document Title (/Title), DisplayDocTitle viewer preference (critical for WCAG 2.4.2), Primary Document Language (/Lang, WCAG 3.1.1), /MarkInfo Marked flag, and Page /Tabs /S structure traversal order.' },
      { question: 'Can this tool add semantic reading tags to a flat image scan?', answer: 'If your PDF fails the "Selectable Text Layer" check, it is an image scan without text characters. Run it through our OCR PDF tool first, then inspect and fix metadata here.' },
      { question: 'Does it verify my PDF without uploading it to external servers?', answer: 'Yes. Inspection and remediation happen 100% inside your browser using pdf-lib and pdfjs-dist.' },
      { question: 'Can I download an accessibility compliance report for recordkeeping?', answer: 'Yes. Click the Report button to export a structured JSON audit summary showing every tested standard and timestamp.' },
    ],
    supportedFormats: 'Input: PDF (.pdf) | Output: Remediated PDF + JSON Audit Report',
    relatedTools: ['pdf-metadata', 'ocr-pdf', 'compress-pdf', 'redact-pdf'],
  },

  'local-folder-batch-processor': {
    about: 'Local Folder Batch Studio brings true desktop-class folder automation directly into the browser without cloud uploads or size gates. Powered by the HTML5 File System Access API (with a clean webkitdirectory fallback for Firefox/Safari) and a dedicated background WebWorker thread, you can point directly to a local directory containing up to 500 PDFs or images, run batch compression, format conversion (WebP/JPG/PNG/PDF), watermarking, or sequential Bates stamping, and save results directly into an optimized_pdfpixels/ subfolder on your own drive.',
    directAnswer: 'Batch-process up to 500 local PDFs and images in parallel via WebWorkers and the HTML5 File System Access API, writing compressed/converted/watermarked/Bates-stamped files straight into an optimized_pdfpixels/ subfolder without uploading anything.',
    steps: [
      { title: 'Pick your local folder (up to 500 files)', description: 'Click Pick Local Folder to grant temporary browser read/write access to your folder (or use the Sample Folder generator).' },
      { title: 'Select Compress, Convert, Watermark, or Bates', description: 'Tune quality, output format (WebP/JPG/PNG/PDF), watermark stamp, or sequential Bates prefix.' },
      { title: 'Monitor live WebWorker progress dashboard', description: 'Track file-by-file completion, byte savings %, and elapsed time while keeping the browser responsive.' },
      { title: 'Inspect outputs inside optimized_pdfpixels/', description: 'Open the auto-created optimized_pdfpixels/ subfolder on your drive or download optimized_pdfpixels.zip in fallback mode.' },
    ],
    features: [
      'HTML5 showDirectoryPicker() direct write into optimized_pdfpixels/ subfolder',
      'Automatic webkitdirectory + JSZip fallback on browsers without File System Write access',
      'Dedicated WebWorker thread keeps UI smooth across batches up to 500 PDFs/images',
      'Live per-file telemetry dashboard showing byte reduction and elapsed processing time',
      '100% air-gapped local execution — even works with Wi-Fi turned off',
    ],
    useCases: [
      'Litigation & real estate teams batch-Bates-stamping hundreds of folder exhibits locally',
      'Photographers & agencies shrinking entire project folders to WebP/JPG in one pass',
      'Finance departments watermarking hundreds of client PDFs confidentially offline',
    ],
    faqs: [
      { question: 'Does Local Folder Batch Studio ever upload my folder files?', answer: 'Never. All reading, WebWorker transformations, and writing to optimized_pdfpixels/ execute inside your own computer RAM and disk.' },
      { question: 'What happens in browsers without showDirectoryPicker support?', answer: 'The studio automatically falls back to standard folder selection (webkitdirectory) and packages all output files inside optimized_pdfpixels.zip.' },
    ],
    supportedFormats: 'Input: Local Folders of PDF, JPG, PNG, WebP, AVIF, BMP | Output: optimized_pdfpixels/ Folder or .ZIP',
    relatedTools: ['compress-pdf', 'compress-image', 'bates-numbering-pdf', 'add-watermark-pdf'],
  },

  'ecommerce-product-photo-pack': {
    about: 'E-Commerce 6-Marketplace Product Photo Pack automates multi-channel product listing photography from one studio shot. Upload a single raw product photo and PdfPixels chains ONNX/AI background removal with precision canvas framing to build all 6 required storefront assets — Amazon (2000×2000 #FFFFFF), Shopify (2048×2048 WebP), Etsy (2700×2025), eBay (1600×1600), Poshmark (1080×1350), and Walmart Marketplace (2200×2200) — bundled into a ready-to-upload ZIP package.',
    directAnswer: 'Convert one product photo into all 6 ecommerce marketplace sizes (Amazon 2000×2000, Shopify 2048×2048 WebP, Etsy 2700×2025, eBay 1600×1600, Poshmark 1080×1350, Walmart 2200×2200) with pure #FFFFFF background removal in 1 ZIP.',
    steps: [
      { title: 'Upload your raw product shot', description: 'Drop a JPG, PNG, WebP, or HEIC product image (or load our Sample Studio Item).' },
      { title: 'Generate the 6-marketplace pack', description: 'Background removal runs automatically before rendering each storefront resolution.' },
      { title: 'Inspect all 6 visual previews', description: 'Verify centering and framing across Amazon, Shopify, Etsy, eBay, Poshmark, and Walmart.' },
      { title: 'Download the single .ZIP bundle', description: 'Grab all 6 marketplace files at once (or save individual variants).' },
    ],
    features: [
      'Pure #FFFFFF backdrop meeting strict Amazon & Walmart main-image guidelines',
      'Dedicated 2048×2048 WebP storefront export for fast Shopify Core Web Vitals',
      'Full 2700×2025 Etsy, 1600×1600 eBay, and 1080×1350 Poshmark aspect presets',
      'Live 6-panel visual preview before downloading ZIP archive',
    ],
    useCases: [
      'Multichannel Shopify, Amazon FBA, Walmart, and Etsy sellers launching new SKUs',
      'Poshmark and eBay resellers standardizing smartphone photography cleanly',
    ],
    faqs: [
      { question: 'Does it preserve product aspect ratios without stretching?', answer: 'Yes. Each marketplace frame scales your product cutout proportionally inside a centered 86% safe margin over a #FFFFFF backdrop.' },
      { question: 'Which formats are inside the downloaded ZIP?', answer: 'All 6 properly sized files: JPEG for Amazon/Etsy/eBay/Poshmark/Walmart and crisp WebP for Shopify.' },
    ],
    supportedFormats: 'Input: JPG, PNG, WebP, HEIC | Output: 6-Marketplace .ZIP Pack',
    relatedTools: ['remove-image-background', 'resize-image', 'compress-image', 'shipping-label-cropper'],
  },

  'c2pa-ai-content-credentials-checker': {
    about: 'C2PA & AI Content Credentials Checker inspects digital media headers completely inside your browser to surface cryptographic provenance manifests, IPTC Digital Source Type assertions, and generative AI metadata signatures. Check images and PDFs for JPEG APP11 / ISO BMFF JUMBF boxes (`jumb`, `c2pa`, `caBX`), `trainedAlgorithmicMedia` tags, Adobe Firefly, Google SynthID, OpenAI DALL-E, Midjourney, and Stable Diffusion/ComfyUI embedded generation parameters — zero file upload required.',
    directAnswer: 'Inspect photos and PDFs client-side for C2PA Content Credentials (JUMBF boxes), IPTC DigitalSourceType AI flags, and SynthID, Adobe Firefly, DALL-E, or Midjourney origin metadata offline.',
    steps: [
      { title: 'Select any image or PDF file', description: 'Drop a JPEG, PNG, WebP, AVIF, HEIC, or PDF (or click Load Sample C2PA + IPTC Asset).' },
      { title: 'Automatic client-side binary scan', description: 'Header boxes (APP11 JUMBF, PNG caBX, XMP XML, IPTC tags) are inspected locally in RAM.' },
      { title: 'Review Content Credentials verdict', description: 'See JUMBF C2PA boxes, IPTC DigitalSourceType flags, AI generator signatures, and SHA-256 hash.' },
      { title: 'Export JSON Provenance Report', description: 'Save a timestamped JSON provenance report for editorial or compliance verification.' },
    ],
    features: [
      'Scans raw JPEG APP11 JUMBF, ISO BMFF jumb/c2pa, PNG caBX/iTXt, and XMP packets',
      'Detects IPTC trainedAlgorithmicMedia, compositeWithTrainedAlgorithmicMedia, and digitalCapture tags',
      'Flags Adobe Firefly, OpenAI DALL-E, Google SynthID/Imagen, Midjourney & Stable Diffusion signatures',
      '100% offline client-side inspector computes file SHA-256 without uploading media',
    ],
    useCases: [
      'Newsrooms, journalists, and fact-checkers verifying digital image provenance before publication',
      'Marketing and legal teams confirming AI disclosure tags on vendor-supplied creative assets',
    ],
    faqs: [
      { question: 'Why might an AI-generated photo show "No Provenance Found"?', answer: 'Many social platforms and messaging apps strip APP11/XMP segments during re-compression. Original downloads directly from Firefly, ChatGPT, or C2PA cameras retain full headers.' },
      { question: 'Is any photo uploaded to inspect C2PA metadata?', answer: 'No. Every byte scan runs inside your local browser JavaScript memory.' },
    ],
    supportedFormats: 'Input: JPG, PNG, WebP, AVIF, HEIC, PDF | Output: On-Screen Manifest & JSON Report',
    relatedTools: ['photo-metadata-viewer', 'remove-image-metadata', 'sanitize-pdf', 'remove-image-background'],
  },

  'private-ai-pdf-contract-auditor': {
    about: 'Private Local PDF Contract Auditor analyzes NDAs, MSAs, SaaS subscriptions, employment offers, and freelancer SOWs strictly inside browser memory using `pdfjs-dist` text layer parsing — never uploading sensitive contracts to any external LLM or cloud API. The auditor automatically identifies Effective/Expiration dates and written notice deadlines, flags Net payment and late-fee clauses, and highlights high-risk traps such as Unlimited Liability, Automatic Evergreen Renewals, Non-Compete Lockouts, and Broad IP Assignments alongside actionable negotiation guidance.',
    directAnswer: 'Audit PDF contracts, NDAs, and MSAs 100% client-side (zero server upload) to extract Key Dates, Payment Terms, and High-Risk Clauses (unlimited liability, auto-renewal, non-compete, IP assignment) with exportable Markdown audit summaries.',
    steps: [
      { title: 'Upload your contract or load Sample MSA', description: 'Select any PDF contract up to 100 pages — parsed strictly inside browser memory.' },
      { title: 'Filter Dates, Payment Terms, and Risk Clauses', description: 'Inspect extracted clauses ranked by High, Medium, and Info severity with exact page numbers.' },
      { title: 'Review reviewer negotiation guidance', description: 'See clear action notes for uncapped liability, evergreen notice traps, or broad IP assignments.' },
      { title: 'Export Markdown Audit Report', description: 'Download a portable .MD summary checklist for legal counsel or client redlines.' },
    ],
    features: [
      '100% browser-native pdfjs-dist extraction — works offline in Airplane Mode',
      'Detects Effective Date, Expiration, and 15-60 Day Written Notice Deadlines',
      'Extracts Net-15/30/45/60 payment terms, retainers, and late-fee interest clauses',
      'Flags High-Risk Unlimited Liability, Auto-Renewal, Non-Compete & Work-for-Hire terms',
    ],
    useCases: [
      'Freelancers & agencies vetting client MSAs and NDAs before signing',
      'Founders & finance teams catching evergreen cancellation windows and payment delays',
    ],
    faqs: [
      { question: 'Does my confidential NDA text ever leave my browser?', answer: 'No. Contract parsing, regex/clause matching, and SHA-256 verification occur 100% inside your local browser memory without external API calls.' },
      { question: 'Does this replace licensed legal advice?', answer: 'No — it is an automated clause-discovery and risk-triage tool to help you spot key dates, payment windows, and common commercial traps before legal review.' },
    ],
    supportedFormats: 'Input: Selectable-Text PDF Contracts | Output: Clause Scorecard & Markdown Report',
    relatedTools: ['sign-pdf', 'compare-pdf', 'redact-pdf', 'protect-pdf'],
  },

  ...Object.fromEntries(TIER1_BANKS.map((bank) => [bank.slug, buildBankContent(bank)])),
};
