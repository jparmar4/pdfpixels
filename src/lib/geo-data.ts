export interface GeoRegion {
  code: string;
  name: string;
  adjective: string;
  locale: string;
  localCopy: string;
  /** Unique regional editorial — avoids thin homepage clones for AdSense quality */
  headline: string;
  intro: string;
  commonTasks: { title: string; detail: string; href: string }[];
  localNotes: string[];
  faqs: { question: string; answer: string }[];
}

export const geoRegions: GeoRegion[] = [
  {
    code: 'us',
    name: 'United States',
    adjective: 'US',
    locale: 'en-US',
    localCopy: 'trusted across the USA',
    headline: 'Free PDF & image tools for US forms, email, and everyday work',
    intro:
      'In the United States, people often need 2×2 inch passport photos, PDFs small enough for email or college portals, and iPhone HEIC files converted for Windows coworkers. PdfPixels gives US users browser tools for those jobs without installing desktop software — compress, merge, resize, convert, and clean up files on any modern device.',
    commonTasks: [
      {
        title: 'US passport-style photos',
        detail: 'Prepare 2×2 inch portrait crops for passport and many ID-style applications.',
        href: '/tools/passport-size-photo',
      },
      {
        title: 'Email-ready PDFs',
        detail: 'Shrink scanned packets for Gmail, Outlook, and university systems.',
        href: '/tools/compress-pdf',
      },
      {
        title: 'HEIC for Windows teams',
        detail: 'Convert iPhone photos to JPG when colleagues cannot open HEIC.',
        href: '/tools/heic-to-jpg',
      },
    ],
    localNotes: [
      'US passport photos are commonly 2×2 inches; always confirm current State Department guidance before submitting.',
      'Email providers and school portals set their own attachment caps — compress when a send fails.',
      'Many workplaces run Windows while phones shoot HEIC; conversion is a frequent US office fix.',
    ],
    faqs: [
      {
        question: 'Are PdfPixels tools free to use in the United States?',
        answer:
          'Yes. Core PDF and image tools are free for standard browser use with no account required for everyday workflows.',
      },
      {
        question: 'Can I make a 2×2 passport photo online?',
        answer:
          'Yes. Use the passport photo tool to crop to 2×2 inches, then verify lighting and background against official US rules.',
      },
    ],
  },
  {
    code: 'uk',
    name: 'United Kingdom',
    adjective: 'UK',
    locale: 'en-GB',
    localCopy: 'trusted across the UK',
    headline: 'Free PDF & image tools for UK applications, email, and photo sizes',
    intro:
      'UK users often deal with specific photo sizes for passports and visas, PDF uploads for councils or universities, and sharing files across mixed phone and laptop setups. PdfPixels provides free browser tools to compress documents, merge packets, resize photos in mm/cm, and convert formats without a heavyweight desktop suite.',
    commonTasks: [
      {
        title: 'UK-style ID photo sizing',
        detail: 'Resize portraits toward common 35×45 mm style requirements used in many applications.',
        href: '/tools/passport-size-photo',
      },
      {
        title: 'Compress PDFs for uploads',
        detail: 'Reduce scan sizes for university, HR, and council portals.',
        href: '/tools/compress-pdf',
      },
      {
        title: 'Merge supporting documents',
        detail: 'Combine multiple PDFs into one file for applications.',
        href: '/tools/merge-pdf',
      },
    ],
    localNotes: [
      'UK passport photo rules are detailed (size, expression, background). Tools help with dimensions; official guidance still rules acceptance.',
      'Portal file limits vary — if an upload fails, compress or split the PDF.',
      'Works in Chrome, Edge, Safari, and Firefox on UK desktop and mobile networks.',
    ],
    faqs: [
      {
        question: 'Do these tools work on UK mobile data and Wi‑Fi?',
        answer: 'Yes. PdfPixels runs in modern mobile and desktop browsers used across the UK.',
      },
      {
        question: 'Can I prepare photos in millimetres?',
        answer: 'Yes. Resize tools support metric units for print-oriented sizes common in UK forms.',
      },
    ],
  },
  {
    code: 'ca',
    name: 'Canada',
    adjective: 'Canadian',
    locale: 'en-CA',
    localCopy: 'trusted across Canada',
    headline: 'Free PDF & image tools for Canadian forms, email, and photo prep',
    intro:
      'Canadians frequently upload PDFs for school, immigration-related paperwork, and workplace sharing — often with strict size limits — and need images that open for both iPhone and Windows users. PdfPixels helps compress PDFs, convert HEIC, resize photos, and merge documents in the browser.',
    commonTasks: [
      {
        title: 'Shrink PDFs for portals',
        detail: 'Compress large scans so application uploads succeed.',
        href: '/tools/compress-pdf',
      },
      {
        title: 'Convert iPhone photos',
        detail: 'Turn HEIC into JPG for broader compatibility.',
        href: '/tools/heic-to-jpg',
      },
      {
        title: 'Combine PDF packages',
        detail: 'Merge supporting pages into a single attachment.',
        href: '/tools/merge-pdf',
      },
    ],
    localNotes: [
      'Always follow the file type and size rules printed on the specific Canadian portal or form you are using.',
      'Bilingual workplaces still need widely compatible formats like PDF and JPG for sharing.',
      'Browser tools help when you cannot install software on a managed work laptop.',
    ],
    faqs: [
      {
        question: 'Is PdfPixels free in Canada?',
        answer: 'Yes. Standard tools are free to use in the browser for common PDF and image tasks.',
      },
      {
        question: 'Can I compress a PDF for email in Canada?',
        answer: 'Yes. Use Compress PDF, then attach the smaller file in Gmail, Outlook, or other clients.',
      },
    ],
  },
  {
    code: 'au',
    name: 'Australia',
    adjective: 'Australian',
    locale: 'en-AU',
    localCopy: 'trusted across Australia',
    headline: 'Free PDF & image tools for Australian uploads, email, and photo sizes',
    intro:
      'Australian users deal with university and government uploads, email attachment limits, and passport-style photos with clear size rules. PdfPixels offers free online compression, conversion, and photo utilities that work on phone or desktop without installing extra apps.',
    commonTasks: [
      {
        title: 'Passport-oriented photo crops',
        detail: 'Prepare correctly sized portraits before checking official Australian photo rules.',
        href: '/tools/passport-size-photo',
      },
      {
        title: 'Reduce PDF size',
        detail: 'Make scanned documents small enough for email and portals.',
        href: '/tools/compress-pdf',
      },
      {
        title: 'Image KB limits',
        detail: 'Hit exact image size targets for forms that specify kilobytes.',
        href: '/tools/compress-image',
      },
    ],
    localNotes: [
      'Confirm current Australian passport photo requirements on official government sites before printing or uploading.',
      'Large phone scans of multi-page forms are the usual reason PDFs fail email limits — compress or split.',
      'Tools work across Australian mobile and broadband connections in modern browsers.',
    ],
    faqs: [
      {
        question: 'Can I use PdfPixels on mobile in Australia?',
        answer: 'Yes. The site is built for modern mobile browsers as well as desktop.',
      },
      {
        question: 'How do I make a PDF smaller for email?',
        answer: 'Open Compress PDF, upload the file, choose a suitable compression level, and download the result.',
      },
    ],
  },
  {
    code: 'in',
    name: 'India',
    adjective: 'Indian',
    locale: 'en-IN',
    localCopy: 'trusted across India',
    headline: 'Free PDF & image tools for Indian exam forms, job portals, and government uploads',
    intro:
      'In India, applicants constantly hit exact photo size rules — 20KB, 50KB, 100KB — plus signature sizes, PDF caps for job and exam portals, and passport photo dimensions like 3.5×4.5 cm. PdfPixels is built for those high-intent tasks: compress images to a target KB, prepare passport-size photos, compress PDFs, and convert formats without paid desktop software.',
    commonTasks: [
      {
        title: 'Photo to exact KB',
        detail: 'Hit 20KB / 50KB / 100KB style limits used by many Indian portals.',
        href: '/tools/compress-image',
      },
      {
        title: 'Passport size photos',
        detail: 'Crop toward common 3.5×4.5 cm style requirements used in many applications.',
        href: '/tools/passport-size-photo',
      },
      {
        title: 'Compress PDF for uploads',
        detail: 'Reduce PDF size for email and online application systems.',
        href: '/tools/compress-pdf',
      },
    ],
    localNotes: [
      'Always read the exact KB, dimension, and format rules on the specific exam or recruitment notice — they vary by organisation.',
      'Start from a clear original photo; extreme compression of a huge group photo rarely meets face-clarity checks.',
      'If a portal wants a minimum size as well as a maximum, use increase-size tools carefully after checking format rules.',
    ],
    faqs: [
      {
        question: 'Can I compress a photo to 20KB or 50KB for Indian forms?',
        answer:
          'Yes. Use Compress Image, set the target KB, and preview clarity before uploading to the portal.',
      },
      {
        question: 'Are PdfPixels tools free in India?',
        answer: 'Yes. Core tools are free in the browser with no signup required for standard use.',
      },
    ],
  },
  {
    code: 'ph',
    name: 'Philippines',
    adjective: 'Philippine',
    locale: 'en-PH',
    localCopy: 'trusted across the Philippines',
    headline: 'Free PDF & image tools for Philippine government uploads, applications, and school forms',
    intro:
      'Filipino applicants juggle upload requirements across SSS, PhilHealth, BIR, Civil Service, PRC, and school systems — each with its own PDF size cap, photo dimension, or format rule. Mobile data makes re-uploading a 40MB scan painful, and many forms want images under 100KB. PdfPixels covers those jobs in the browser: compress to an exact KB, merge requirements into one PDF, crop passport-style photos, and convert HEIC from iPhone shots before a portal rejects them.',
    commonTasks: [
      {
        title: 'Government portal PDFs',
        detail: 'Shrink scanned requirements so SSS, PhilHealth, or BIR uploads go through first try.',
        href: '/tools/compress-pdf',
      },
      {
        title: 'Photos under 100KB',
        detail: 'Hit the tight photo limits many Philippine application systems set.',
        href: '/tools/compress-image',
      },
      {
        title: 'Passport-style photos',
        detail: 'Crop toward the 35×45 mm style portraits commonly requested by DFA-type forms.',
        href: '/tools/passport-size-photo',
      },
    ],
    localNotes: [
      'Philippine agencies each publish their own photo size and file-size rules — the form you are filling is the final authority.',
      'Slow or metered mobile data is the norm for many users; compressing a scan before uploading saves real money.',
      'iPhone photos arrive as HEIC; convert to JPG when a government portal or school system refuses the format.',
    ],
    faqs: [
      {
        question: 'Are these tools free to use in the Philippines?',
        answer: 'Yes. The core PDF and image tools run free in your browser with no account needed for everyday tasks.',
      },
      {
        question: 'Can I merge my requirements into one PDF?',
        answer: 'Yes. Scan or photograph each document, convert them to PDF, then use Merge PDF to combine them in order.',
      },
    ],
  },
  {
    code: 'ng',
    name: 'Nigeria',
    adjective: 'Nigerian',
    locale: 'en-NG',
    localCopy: 'trusted across Nigeria',
    headline: 'Free PDF & image tools for Nigerian exam forms, NYSC uploads, and job applications',
    intro:
      'Nigerian applicants face some of the strictest file rules anywhere: JAMB and WAEC registrations, NYSC mobilization uploads, scholastic applications, and recruitment portals that reject anything over a strict KB cap or demand a white-background passport photograph at an exact size. PdfPixels is built for that moment — compress images to an exact KB, crop passport-style photos, compress or split PDFs, and fix formats in the browser without buying software or paying a business-centre every time.',
    commonTasks: [
      {
        title: 'Photos to exact KB',
        detail: 'Meet the tight photo caps on exam and recruitment forms.',
        href: '/tools/compress-image',
      },
      {
        title: 'Passport-style photos',
        detail: 'Crop white-background portraits toward the 2×2 inch style many Nigerian forms quote.',
        href: '/tools/passport-size-photo',
      },
      {
        title: 'Split oversize PDFs',
        detail: 'Break a large scan into parts a strict portal will accept.',
        href: '/tools/split-pdf-by-size',
      },
    ],
    localNotes: [
      'Nigerian portals vary widely on photo size and format — read the specific notice before uploading.',
      'Business centres charge per task; these browser tools handle the same jobs free when you have a phone or PC.',
      'Unstable connections punish large uploads — compress before you submit, not after a failure.',
    ],
    faqs: [
      {
        question: 'Can I compress my photo to the exact size a Nigerian form asks for?',
        answer: 'Yes. Use Compress Image, set the KB target from the form instructions, and preview the result before uploading.',
      },
      {
        question: 'Is PdfPixels free in Nigeria?',
        answer: 'Yes. Core tools are free in the browser with no signup for standard use.',
      },
    ],
  },
  {
    code: 'pk',
    name: 'Pakistan',
    adjective: 'Pakistani',
    locale: 'en-PK',
    localCopy: 'trusted across Pakistan',
    headline: 'Free PDF & image tools for Pakistani admissions, government forms, and job uploads',
    intro:
      'Pakistani students and job-seekers upload documents constantly — university admissions, FPSC/PPSC and other recruitment tests, NADRA-related paperwork, and visa applications — and the forms are unforgiving about file size and format. Photographs commonly need exact dimensions under a strict KB cap, and scanned degrees or CNIC copies must arrive as small, single PDFs. PdfPixels handles the whole chain in the browser: compress to a KB target, merge documents in order, crop ID-style photos, and convert phone formats for older portal systems.',
    commonTasks: [
      {
        title: 'Photo to exact KB',
        detail: 'Match the tight photo caps on admission and recruitment forms.',
        href: '/tools/compress-image',
      },
      {
        title: 'Merge attested documents',
        detail: 'Combine CNIC copies, degrees, and certificates into one ordered PDF.',
        href: '/tools/merge-pdf',
      },
      {
        title: 'Compress document scans',
        detail: 'Shrink multi-page scans for slow connections and strict portals.',
        href: '/tools/compress-pdf',
      },
    ],
    localNotes: [
      'Admission and recruitment notices state their own photo dimensions and KB caps — the specific notice wins.',
      'Scanning via phone is normal; convert each page to PDF and merge rather than sending loose images.',
      'Power and connectivity interruptions are a real constraint — smaller files upload faster and fail less.',
    ],
    faqs: [
      {
        question: 'Can I prepare my documents for Pakistani university admissions?',
        answer: 'Yes. Compress each scan, merge them in the order the form requests, and upload the single PDF.',
      },
      {
        question: 'Are PdfPixels tools free in Pakistan?',
        answer: 'Yes. Core tools run free in the browser with no signup for standard use.',
      },
    ],
  },
  {
    code: 'bd',
    name: 'Bangladesh',
    adjective: 'Bangladeshi',
    locale: 'en-BD',
    localCopy: 'trusted across Bangladesh',
    headline: 'Free PDF & image tools for Bangladeshi exam forms, govt applications, and admissions',
    intro:
      'Bangladeshi application systems — government job circulars, university admissions, and board-related uploads — are famous for exact pixel-and-kilobyte specs: a photo at a fixed resolution under a strict size, a signature strip at another, everything in one PDF. PdfPixels exists for exactly those constraints. Hit the KB target with Compress Image, resize to the stated pixel dimensions, crop passport-style photos, and combine or shrink PDFs in the browser — no paid software, no photo-studio queue.',
    commonTasks: [
      {
        title: 'Photo & signature sizing',
        detail: 'Resize portraits and signature strips to the pixel dimensions the form states.',
        href: '/tools/resize-image',
      },
      {
        title: 'Photos to exact KB',
        detail: 'Stay under the tight caps typical of Teletalk-style application forms.',
        href: '/tools/compress-image',
      },
      {
        title: 'Combine documents',
        detail: 'Merge certificates and transcripts into a single PDF in order.',
        href: '/tools/merge-pdf',
      },
    ],
    localNotes: [
      'Bangladeshi forms print exact pixel dimensions and KB ceilings for photo and signature — follow the circular, not general advice.',
      'Start from a clear original; extreme compression of a blurry photo rarely passes face-clarity checks.',
      'Load-shedding and slow data make small files practical: compress before uploading, not after a timeout.',
    ],
    faqs: [
      {
        question: 'Can I resize a photo to the exact pixels my form requires?',
        answer: 'Yes. Use Resize Image, enter the width and height from the circular, and download the result.',
      },
      {
        question: 'Are PdfPixels tools free in Bangladesh?',
        answer: 'Yes. Core tools are free in the browser with no signup for standard use.',
      },
    ],
  },
  {
    code: 'ke',
    name: 'Kenya',
    adjective: 'Kenyan',
    locale: 'en-KE',
    localCopy: 'trusted across Kenya',
    headline: 'Free PDF & image tools for Kenyan eCitizen uploads, applications, and everyday documents',
    intro:
      'Kenyans upload documents to eCitizen services, KRA and HELB systems, university portals, and employer HR platforms — usually from a phone, usually on metered data. Scans run large, portals set firm size caps, and photographs must hit specific dimensions. PdfPixels keeps those submissions moving: compress PDFs and images to a target size, merge supporting documents into one file, crop ID-style photos, and convert phone formats in the browser without installing anything.',
    commonTasks: [
      {
        title: 'Compress scans for portals',
        detail: 'Get eCitizen- and HR-sized PDFs from phone scans.',
        href: '/tools/compress-pdf',
      },
      {
        title: 'Photos to target KB',
        detail: 'Meet strict image caps on application forms.',
        href: '/tools/compress-image',
      },
      {
        title: 'Merge supporting documents',
        detail: 'Combine IDs, certificates, and letters into one ordered PDF.',
        href: '/tools/merge-pdf',
      },
    ],
    localNotes: [
      'Each Kenyan portal states its own file-size and format rules — the form you are completing is authoritative.',
      'Mobile data bundles make small uploads genuinely cheaper; compress before submitting.',
      'Documents photographed with a phone convert cleanly to PDF — flatten pages with Image to PDF, then compress.',
    ],
    faqs: [
      {
        question: 'Do these tools work on a phone in Kenya?',
        answer: 'Yes. Everything runs in the mobile browser — no app install needed.',
      },
      {
        question: 'Can I turn photographed documents into one PDF?',
        answer: 'Yes. Convert each photo to PDF with Image to PDF, then Merge PDF to combine them in order.',
      },
    ],
  },
  {
    code: 'ae',
    name: 'United Arab Emirates',
    adjective: 'UAE',
    locale: 'en-AE',
    localCopy: 'trusted across the UAE',
    headline: 'Free PDF & image tools for UAE visa paperwork, tenancy files, and workplace uploads',
    intro:
      'UAE residents process documents for ICP and GDRFA appointments, Emirates ID applications, tenancy registrations, HR onboarding, and attested certificates — and the portals are strict about size and format while demanding speed. Scans of passports, Ejari contracts, and salary certificates routinely arrive oversized; photographs must match official dimension rules. PdfPixels compresses, merges, splits, and converts the paperwork in the browser, which suits a workforce that moves between laptop and phone all day.',
    commonTasks: [
      {
        title: 'Compress visa & tenancy scans',
        detail: 'Shrink passport, Ejari, and contract scans under portal caps.',
        href: '/tools/compress-pdf',
      },
      {
        title: 'ID-style photo crops',
        detail: 'Resize portraits toward official application dimensions before checking current guidance.',
        href: '/tools/passport-size-photo',
      },
      {
        title: 'Merge attested documents',
        detail: 'Combine certificates and translations into one submission PDF.',
        href: '/tools/merge-pdf',
      },
    ],
    localNotes: [
      'UAE application systems and typing centres each publish their own specs — confirm current ICP/GDRFA guidance before submitting.',
      'English and Arabic documents often travel together; keep both in one merged PDF so nothing is lost mid-process.',
      'Work devices are often locked down — browser tools avoid installs entirely.',
    ],
    faqs: [
      {
        question: 'Are PdfPixels tools free to use in the UAE?',
        answer: 'Yes. Core tools run free in the browser with no account required for standard tasks.',
      },
      {
        question: 'Can I compress a scanned tenancy contract for upload?',
        answer: 'Yes. Use Compress PDF and pick a level that keeps the text readable for the reviewing authority.',
      },
    ],
  },
  {
    code: 'za',
    name: 'South Africa',
    adjective: 'South African',
    locale: 'en-ZA',
    localCopy: 'trusted across South Africa',
    headline: 'Free PDF & image tools for South African applications, HR uploads, and university forms',
    intro:
      'South Africans upload documents for university applications, bursaries, Home Affairs-style paperwork, company HR systems, and SARS-related submissions — often as scanned bundles with firm size limits. Photos must be cropped to the dimensions a form states, and multi-page proof-of-residence-plus-ID packs are easier to send merged than loose. PdfPixels covers the practical side in the browser: compress to a target size, merge in order, split what is too big, and crop ID-style photos, free on any device.',
    commonTasks: [
      {
        title: 'Shrink application bundles',
        detail: 'Compress scanned ID and proof packs under portal limits.',
        href: '/tools/compress-pdf',
      },
      {
        title: 'Merge ID + proof documents',
        detail: 'Combine pages into one ordered PDF before uploading.',
        href: '/tools/merge-pdf',
      },
      {
        title: 'Photos to exact KB',
        detail: 'Hit the image caps bursary and application forms set.',
        href: '/tools/compress-image',
      },
    ],
    localNotes: [
      'South African institutions each set their own upload rules — check the specific form for size and format.',
      'Load-shedding interruptions make short, small uploads smart: compress first so a retry is cheap.',
      'Photographed documents work: convert phone shots to PDF, then compress for the portal.',
    ],
    faqs: [
      {
        question: 'Can I use these tools on mobile data in South Africa?',
        answer: 'Yes — and compressing before uploading meaningfully reduces the data a submission consumes.',
      },
      {
        question: 'Is PdfPixels free in South Africa?',
        answer: 'Yes. Core tools are free in the browser with no signup for standard use.',
      },
    ],
  },
  {
    code: 'sg',
    name: 'Singapore',
    adjective: 'Singaporean',
    locale: 'en-SG',
    localCopy: 'trusted across Singapore',
    headline: 'Free PDF & image tools for Singapore applications, corporate uploads, and IC-style photos',
    intro:
      'Singaporean users upload documents for university admissions, MOM-style employment paperwork, HDB and bank processes, and corporate compliance — systems that are digital-first and unforgiving about format. Passports and many applications expect 35×45 mm style photos, scans of certificates must arrive compact, and workplace files cross between iPhones (HEIC) and Windows machines daily. PdfPixels handles the crops, KB targets, merges, and conversions in the browser, fast on the island’s networks and free for any resident.',
    commonTasks: [
      {
        title: 'IC/passport-style photos',
        detail: 'Crop portraits toward the 35×45 mm style Singapore systems commonly request.',
        href: '/tools/passport-size-photo',
      },
      {
        title: 'HEIC for Windows offices',
        detail: 'Convert iPhone photos to JPG before corporate systems reject them.',
        href: '/tools/heic-to-jpg',
      },
      {
        title: 'Compact certificate scans',
        detail: 'Compress certificates and transcripts for strict upload forms.',
        href: '/tools/compress-pdf',
      },
    ],
    localNotes: [
      'Singapore agencies and banks publish precise specs per application — the form is the authority, not general size guides.',
      'Offices run Windows while phones shoot HEIC; conversion is a daily fix before uploads.',
      'Everything runs in the browser, which suits locked-down corporate laptops with no install rights.',
    ],
    faqs: [
      {
        question: 'Are these tools free to use in Singapore?',
        answer: 'Yes. Core PDF and image tools are free with no signup for standard use.',
      },
      {
        question: 'Can I prepare photos for official Singapore applications?',
        answer: 'Yes — crop to the size the form states, then verify against the issuing agency’s current official guidance before submitting.',
      },
    ],
  },
  {
    code: 'ie',
    name: 'Ireland',
    adjective: 'Irish',
    locale: 'en-IE',
    localCopy: 'trusted across Ireland',
    headline: 'Free PDF & image tools for Irish applications, Revenue-style uploads, and photo sizing',
    intro:
      'Irish users upload documents for SUSI grants, CAO and university applications, tenancy and HR paperwork, and passports — forms that want compact PDFs and correctly sized 35×45 mm style photographs. Scanned utility bills and bank statements pile up as oversized attachments, and portal rejections waste the exact evening you had set aside. PdfPixels compresses scans to size, merges supporting documents in order, crops ID-style photos, and converts phone formats in the browser — free, with no installs.',
    commonTasks: [
      {
        title: 'Shrink scanned support documents',
        detail: 'Compress utility bills and statements under portal caps.',
        href: '/tools/compress-pdf',
      },
      {
        title: 'Merge supporting documents',
        detail: 'Combine proofs into one ordered PDF for grant or CAO uploads.',
        href: '/tools/merge-pdf',
      },
      {
        title: 'ID-style photo crops',
        detail: 'Prepare 35×45 mm style portraits before checking official guidance.',
        href: '/tools/passport-size-photo',
      },
    ],
    localNotes: [
      'Each Irish body sets its own upload specs — confirm on the specific form or official site.',
      'A scanned utility bill is often the biggest file in an application; compress it first.',
      'Browser tools avoid desktop installs — handy on shared or family computers.',
    ],
    faqs: [
      {
        question: 'Is PdfPixels free to use in Ireland?',
        answer: 'Yes. Core tools are free in the browser with no account required for standard tasks.',
      },
      {
        question: 'Can I make my scanned utility bill smaller for an upload?',
        answer: 'Yes. Use Compress PDF, pick a level that keeps addresses legible, and download the smaller file.',
      },
    ],
  },
  {
    code: 'nz',
    name: 'New Zealand',
    adjective: 'New Zealand',
    locale: 'en-NZ',
    localCopy: 'trusted across New Zealand',
    headline: 'Free PDF & image tools for New Zealand applications, StudyLink-style uploads, and photo prep',
    intro:
      'New Zealanders upload documents for study loans and allowances, tenancy applications, immigration-style paperwork, and workplace HR — usually with strict size caps and 35×45 mm style photo requirements. Scans of ID and proof-of-address run large straight off the printer, and iPhone HEIC files puzzle older upload forms. PdfPixels compresses PDFs and images to a target, merges supporting documents, crops ID-style photos, and converts formats in the browser on any device, free.',
    commonTasks: [
      {
        title: 'Compress scans for uploads',
        detail: 'Shrink ID and proof-of-address scans under portal caps.',
        href: '/tools/compress-pdf',
      },
      {
        title: 'ID-style photo crops',
        detail: 'Prepare 35×45 mm style portraits before verifying official requirements.',
        href: '/tools/passport-size-photo',
      },
      {
        title: 'HEIC for older forms',
        detail: 'Convert iPhone photos to JPG when an upload field refuses them.',
        href: '/tools/heic-to-jpg',
      },
    ],
    localNotes: [
      'NZ agencies and landlords each publish their own specs — the specific application is the authority.',
      'Photos for passports and many IDs are commonly 35×45 mm; always confirm current official guidance.',
      'Rural connections make small uploads matter — compress before submitting, especially for multi-page scans.',
    ],
    faqs: [
      {
        question: 'Are PdfPixels tools free in New Zealand?',
        answer: 'Yes. Core tools run free in the browser with no signup for standard use.',
      },
      {
        question: 'Can I combine several scanned pages into one PDF?',
        answer: 'Yes — convert each scan with Image to PDF, then use Merge PDF to combine them in order.',
      },
    ],
  },
];

export function getRegionByCode(code: string): GeoRegion | undefined {
  return geoRegions.find((r) => r.code === code.toLowerCase());
}
