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

  'invoice-generator': {
    about: 'Invoice Generator creates clean, professional PDF invoices directly in your browser — freelancers, consultants, agencies, contractors, and small businesses type in their business details, client details, and line items, and the tool renders a structured invoice PDF with subtotals, tax, discounts, and totals calculated automatically. Unlike signup-walled invoicing SaaS platforms that store your client lists and billing history on their servers, generation runs 100% client-side with pdf-lib: invoice data never leaves your device, there is no watermark, no saved account, and no limit on how many invoices you create. Supported currencies span USD, EUR, GBP, CAD, AUD, INR, and JPY, with US Letter and A4 page sizes for domestic and international billing.',
    directAnswer: 'Generate a professional PDF invoice free in your browser — add line items with automatic totals, tax, and discounts, choose your currency and page size, and download a watermark-free invoice PDF in seconds. 100% client-side: your billing data never uploads.',
    steps: [
      { title: 'Enter your business and client details', description: 'Fill in your business name and contact line, then the client (bill-to) name and address for the invoice header.' },
      { title: 'Add invoice number, dates, and line items', description: 'Set the invoice number, issue and due dates, then add items with quantity and unit price — amounts calculate as you type.' },
      { title: 'Apply tax, discount, and currency', description: 'Choose the currency symbol, add a tax percentage or flat discount if needed, and pick US Letter or A4.' },
      { title: 'Generate and download the invoice PDF', description: 'Click Generate Invoice to render the PDF locally in your browser and download it — ready to email or print.' },
    ],
    features: [
      'Automatic math: per-line amounts, subtotal, tax, discount, and grand total computed live',
      '7 currencies (USD, EUR, GBP, CAD, AUD, INR, JPY) with correct symbol placement',
      'US Letter and A4 page sizes for domestic and international clients',
      'Notes and payment-terms block for late fees, bank details, and thank-you lines',
      '100% client-side pdf-lib rendering — no watermark, no account, no upload',
    ],
    useCases: [
      'Freelancers and consultants billing clients with professional itemized invoices and payment terms',
      'Agencies and contractors issuing numbered invoices with tax lines for bookkeeping',
      'Small businesses creating quick one-off invoices without subscribing to invoicing SaaS',
      'Landlords and service providers producing receipts and due-dated invoices for tenants and customers',
    ],
    faqs: [
      { question: 'Is the invoice PDF free and watermark-free?', answer: 'Yes. Every generated invoice is free, unwatermarked, and unbranded — a clean document you can send to any client without tool advertising.' },
      { question: 'Does my client or billing data get uploaded anywhere?', answer: 'No. The invoice is rendered 100% inside your browser with pdf-lib. Your business details, client details, and pricing never touch a server.' },
      { question: 'Can I add sales tax or VAT to an invoice?', answer: 'Yes. Enter a tax percentage and it applies to the subtotal, with the tax line shown separately above the grand total — suitable for both US sales tax and EU/UK VAT display.' },
      { question: 'Which currency should I choose?', answer: 'Pick the currency you bill in — USD, EUR, GBP, CAD, AUD, INR, or JPY. The symbol is placed correctly for each, and you can type any amount format.' },
      { question: 'Can I use this instead of accounting software?', answer: 'For issuing individual invoices, yes — the PDF is a standard invoice your client can pay from and your bookkeeper can file. For ledger tracking, reconciliation, and reports, pair it with accounting software and our bank statement to Excel converter.' },
    ],
    supportedFormats: 'Output: Invoice PDF (US Letter or A4)',
    relatedTools: ['pdf-to-excel', 'bank-statement-to-excel', 'sign-pdf', 'compress-pdf'],
  },

  'pdf-editor': {
    about: 'PDF Editor lets you make real edits to any PDF directly in your browser: place new text anywhere on the page, highlight passages, whiteout over mistakes or sensitive lines, and draw freehand annotations. Every edit exports as a vector overlay with pdf-lib — the original page text, images, and selectable content stay untouched and sharp, and only your additions are written in. Nothing uploads: the document renders locally with pdf.js and is re-assembled locally with pdf-lib, making it safe for contracts, medical records, financial documents, and ID scans. It covers the everyday "I just need to fix one line" jobs that used to demand an Acrobat subscription: correcting a date on a contract, filling a blank line on a printed form scan, striking out a clause, or marking up a draft for review.',
    directAnswer: 'Edit a PDF free in your browser — add text, highlight passages, whiteout mistakes, and draw annotations, then export a watermark-free PDF. Original content stays vector-sharp; your edits are added as a vector overlay; 100% of processing stays on your device.',
    steps: [
      { title: 'Upload the PDF you want to edit', description: 'Drop any text or scanned PDF (up to 50 MB) — pages render locally in your browser with pdf.js.' },
      { title: 'Pick a tool and edit the page', description: 'Add text boxes, drag highlights over passages, whiteout lines you want hidden, or draw freehand annotations with the pen.' },
      { title: 'Move, resize, or remove edits', description: 'Switch to the select tool to drag any edit to a new spot, or remove it — an undo stack protects every step.' },
      { title: 'Export the edited PDF', description: 'Download a watermark-free PDF where your edits are baked in as a vector overlay and the original content stays selectable.' },
    ],
    features: [
      'Four editing tools: text placement, highlighter, whiteout boxes, and freehand pen',
      'Vector overlay export — original text stays selectable, only additions are written in',
      'Per-edit move, delete, and undo history for mistake-free markup',
      'Color and size controls for text, highlights, and pen strokes',
      '100% browser-native (pdf.js render + pdf-lib export) — no upload, no watermark',
    ],
    useCases: [
      'Correcting a wrong date, name, or amount on a contract before resending it',
      'Filling blank lines on scanned forms and applications without a printer',
      'Highlighting key clauses and adding review notes for clients and colleagues',
      'Whiting out sensitive or outdated lines on scans before sharing documents',
    ],
    faqs: [
      { question: 'Can I edit the existing text in a PDF?', answer: 'You can cover existing text with a whiteout box and type replacement text on top — the standard approach for scanned and flat documents. True in-place text reflow requires the source document (e.g. the Word file), which no faithful PDF editor can recreate.' },
      { question: 'Will my edits survive as selectable text?', answer: 'Your added text is written as a real vector text object with pdf-lib, so it stays selectable and sharp when zoomed or printed. The original page content is untouched.' },
      { question: 'Is it safe to edit confidential documents here?', answer: 'Yes — rendering (pdf.js) and export (pdf-lib) both run entirely in your browser. The document never leaves your device, and there is no account or server storage involved.' },
      { question: 'Does it work on scanned documents?', answer: 'Yes. Scanned pages are just images, and the editor places text, highlights, whiteout, and drawings right on top — the typical way people fill and correct paper forms digitally.' },
      { question: 'How is this different from Fill PDF Forms?', answer: 'Fill PDF targets interactive AcroForm fields and flat scanned forms with typed lines. The PDF Editor is freeform markup: any text anywhere, highlights, whiteout, and drawing for documents without form structure.' },
    ],
    supportedFormats: 'Input: PDF (.pdf) up to 50 MB | Output: Edited PDF with vector overlay',
    relatedTools: ['pdf-fill', 'sign-pdf', 'redact-pdf', 'fill-sign-irs-w9-pdf'],
  },

  'scan-to-pdf': {
    about: 'Scan to PDF turns any phone or laptop camera into a document scanner that runs entirely in your browser: point the camera at a paper page, capture it, apply a readability enhancement (original color, document gray, boosted document look, or crisp black & white), stack as many pages as you need, and export one clean multi-page PDF. It is the private, free alternative to CamScanner and paid scanner apps — no app install, no watermark, no account, and no server upload: the camera feed, the enhancement processing, and the PDF assembly all happen locally on your device via getUserMedia, HTML5 Canvas, and pdf-lib. You can also import existing photos instead of using the camera, making it equally useful for digitizing receipts, contracts, ID documents, homework, and handwritten notes.',
    directAnswer: 'Scan paper to PDF free with your phone camera — capture pages, enhance them for readability (gray, boosted, or black & white), reorder pages, and export a clean multi-page PDF in seconds. 100% in-browser with no watermark and no upload.',
    steps: [
      { title: 'Start the camera or import photos', description: 'Allow camera access and point it at the document, or drop in existing photos of the pages.' },
      { title: 'Capture each page', description: 'Frame the page and tap Capture — each shot becomes a page thumbnail you can review instantly.' },
      { title: 'Pick an enhancement for readability', description: 'Choose Original, Document Gray, Boosted (contrast-stretched), or Black & White — applied to every capture.' },
      { title: 'Reorder and export the PDF', description: 'Drag pages into the right order, choose Fit-to-Image, Letter, or A4, and download the finished PDF.' },
    ],
    features: [
      'Live camera capture (rear camera preferred) with instant retake — no app install',
      'Four enhancement modes: Original, Document Gray, Boosted contrast, and Black & White',
      'Unlimited pages with drag-to-reorder, per-page delete, and import from photo library',
      'Three page sizes: Fit-to-Image, US Letter, and A4 with centered placement',
      '100% local processing — camera feed and PDF assembly never leave your device',
    ],
    useCases: [
      'Digitizing signed contracts, tax forms, and HR paperwork without a flatbed scanner',
      'Students and parents scanning homework, permission slips, and application documents',
      'Accountants and freelancers archiving receipts and invoices as clean multi-page PDFs',
      'Field workers capturing ID documents and certificates for remote onboarding',
    ],
    faqs: [
      { question: 'Is this a free CamScanner alternative?', answer: 'Yes — and a private one. There is no app to install, no watermark, no page limit, and no account. Everything runs in your browser, and your scans never upload to any server.' },
      { question: 'Why do scanned documents come out gray or hard to read?', answer: 'Paper photographed under uneven lighting lacks contrast. The Boosted mode stretches contrast and brightens the background so text pops — it is the closest look to a real flatbed scan.' },
      { question: 'Can I scan multi-page documents?', answer: 'Yes. Capture as many pages as you need, review each thumbnail, reorder them by dragging, and delete retakes — the export is one single multi-page PDF in your chosen order.' },
      { question: 'Does the camera work on iPhone and Android?', answer: 'Yes. It uses the standard browser camera API on both, preferring the rear camera. On desktops it uses the webcam. If your browser blocks the camera, you can import photos instead.' },
      { question: 'Is it safe to scan ID documents and passports here?', answer: 'Yes — scanning runs entirely on your device. The camera feed and captured images never leave the browser, unlike app-based scanners that upload documents to cloud storage.' },
    ],
    supportedFormats: 'Input: Camera (rear preferred) or JPG/PNG photos | Output: Multi-page PDF (Fit/Letter/A4)',
    relatedTools: ['image-to-pdf', 'compress-pdf', 'ocr-pdf', 'sign-pdf'],
  },

  'resume-builder': {
    about: 'Resume Builder produces a clean, ATS-friendly resume PDF entirely in your browser: fill in your contact details, professional summary, work experience with bullet points, education, and skills, and the builder lays everything out in a single-column format that applicant tracking systems parse reliably. There are no accounts, no templates behind a paywall, and no watermark — and unlike resume SaaS platforms that store your career history and personal data on their servers, this builder renders locally with pdf-lib, so your resume never leaves your device. US Letter and A4 page sizes cover applications in the US, UK, EU, and beyond, and the structured sections keep formatting consistent no matter how many jobs you list.',
    directAnswer: 'Create a professional, ATS-friendly resume PDF free — add your summary, experience, education, and skills, and download a cleanly formatted resume in minutes. No sign-up, no watermark, and 100% browser-side: your personal data never uploads.',
    steps: [
      { title: 'Fill in your contact header', description: 'Add your full name, professional title, phone, email, location, and links (LinkedIn, portfolio).' },
      { title: 'Write your summary and experience', description: 'Add a 2–3 sentence summary, then list roles with company, dates, and 2–4 achievement bullets each — add or remove roles freely.' },
      { title: 'Add education and skills', description: 'List degrees and certifications, then add a comma-separated skills line — both parse cleanly in ATS systems.' },
      { title: 'Preview live and download', description: 'Watch the resume render as you type, pick Letter or A4, and download the finished PDF.' },
    ],
    features: [
      'ATS-friendly single-column layout that parses reliably in applicant tracking systems',
      'Live preview — the resume re-renders in a PDF viewer as you type',
      'Unlimited experience and education entries with add/remove controls',
      'Professional serif typography with consistent section rules — no template paywalls',
      '100% browser-side rendering with pdf-lib — personal data never uploads, no watermark',
    ],
    useCases: [
      'Job seekers applying through ATS portals (Workday, Greenhouse, Lever, Taleo) that parse resumes',
      'Career changers rebuilding a resume quickly between applications without paying for template sites',
      'Students and graduates creating a first professional resume for internships and campus placements',
      'Contractors and freelancers maintaining a current CV to send with proposals',
    ],
    faqs: [
      { question: 'What does ATS-friendly actually mean?', answer: 'Applicant tracking systems parse resume files into structured data. Single-column layouts, standard section headings (Experience, Education, Skills), and real text — no tables, text boxes, or graphics — parse most reliably. This builder outputs exactly that structure.' },
      { question: 'Is the resume really free with no watermark?', answer: 'Yes. The PDF is clean, unbranded, and unlimited — there is no free-tier paywall, no account, and no template upsell.' },
      { question: 'Is my personal data (phone, email, work history) uploaded anywhere?', answer: 'No. The resume renders locally in your browser with pdf-lib. Nothing you type ever leaves your device — safer than web resume builders that store your career data on their servers.' },
      { question: 'Should I choose Letter or A4?', answer: 'Use US Letter for applications in the United States and Canada, and A4 for the UK, Europe, India, and most other regions. The layout adapts automatically.' },
      { question: 'Can I add or remove jobs and keep the formatting consistent?', answer: 'Yes — experience and education entries are structured blocks. Add, remove, or reorder them and the layout stays consistent, unlike editing a static template.' },
    ],
    supportedFormats: 'Output: Resume PDF (US Letter or A4)',
    relatedTools: ['scan-to-pdf', 'sign-pdf', 'compress-pdf', 'invoice-generator'],
  },

  'csv-to-pdf': {
    about: 'CSV to PDF converts comma-separated spreadsheet exports into clean, paginated PDF tables entirely in your browser. Product exports, bank transaction dumps, inventory sheets, survey results, and CRM reports usually land as raw .csv files that are miserable to read and impossible to present. This converter parses the file with a proper RFC 4180 parser (quoted fields, embedded commas, escaped quotes, and CRLF row endings all handled), auto-fits column widths to the content, wraps long cells intelligently, styles the header row, repeats the header on every page for long tables, and lays everything out on US Letter or A4 in portrait or landscape. There is no upload, no account, and no watermark: parsing and PDF assembly run locally with pdf-lib, keeping sensitive financial and customer data on your device.',
    directAnswer: 'Convert a CSV file to a clean PDF table free — upload or drop the .csv, preview the parsed rows, pick page size and orientation, and download a paginated PDF with styled headers, auto-fitted columns, and repeated header rows. 100% in-browser, no upload, no watermark.',
    steps: [
      { title: 'Drop in your CSV file', description: 'Upload or drag any .csv export — quoted fields, embedded commas, and newlines inside cells are parsed correctly.' },
      { title: 'Preview the parsed table', description: 'Check the detected columns and rows in the live preview before converting.' },
      { title: 'Choose layout options', description: 'Pick US Letter or A4, portrait or landscape, and optionally add a report title; long tables repeat the header row on every page.' },
      { title: 'Download the PDF report', description: 'Export a clean, paginated table PDF — auto-fitted columns, wrapped cells, styled headers, no watermark.' },
    ],
    features: [
      'Proper RFC 4180 parsing — quoted commas, escaped quotes, and multiline cells handled correctly',
      'Auto-fitted column widths proportional to content, with smart cell text wrapping',
      'Styled header row repeated on every page of long tables',
      'US Letter and A4 in portrait or landscape, optional report title',
      '100% local parsing and pdf-lib rendering — data never uploads, no watermark',
    ],
    useCases: [
      'Turning product or inventory CSV exports into presentable PDF reports for clients',
      'Printing transaction and statement data from systems that only export CSV',
      'Sharing survey results and CRM reports as read-only PDFs that cannot be edited',
      'Attaching spreadsheet data to emails as a paginated PDF instead of a raw CSV file',
    ],
    faqs: [
      { question: 'How does the converter handle commas inside my data?', answer: 'It uses a proper RFC 4180 CSV parser: fields wrapped in double quotes can contain commas, escaped double quotes, and even line breaks — exactly how Excel and Google Sheets export them.' },
      { question: 'What happens with very wide tables?', answer: 'Column widths are distributed proportionally to content, long cell values wrap onto multiple lines instead of overflowing, and landscape orientation is recommended for tables with 6+ columns.' },
      { question: 'Does the header row repeat on every page?', answer: 'Yes. For multi-page tables the styled header row repeats at the top of each page, so printed reports stay readable.' },
      { question: 'Is my CSV data uploaded to a server?', answer: 'No. Parsing and PDF generation run entirely in your browser with pdf-lib. Customer lists, transactions, and financial data never leave your device.' },
      { question: 'Can I convert an Excel file instead?', answer: 'For .xlsx workbooks, use the Excel to PDF tool which renders the actual spreadsheet layout. CSV to PDF is optimized for raw comma-separated exports with clean tabular output.' },
    ],
    supportedFormats: 'Input: CSV (.csv), RFC 4180 | Output: Paginated table PDF (Letter/A4, portrait/landscape)',
    relatedTools: ['pdf-to-csv', 'excel-to-pdf', 'pdf-to-excel', 'bank-statement-to-excel'],
  },

  ...Object.fromEntries(TIER1_BANKS.map((bank) => [bank.slug, buildBankContent(bank)])),
};
