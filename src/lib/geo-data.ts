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
  {
    code: 'de',
    name: 'Germany',
    adjective: 'German',
    locale: 'de-DE',
    localCopy: 'in Deutschland bewährt',
    headline: 'Kostenlose PDF- & Bild-Tools für deutsche Bewerbungen, Behörden und Alltag',
    intro:
      'In Deutschland fordern Arbeitgeber und Portale oft eine einzige PDF für alle Bewerbungsunterlagen, Scans unter 5 MB für behördliche Uploads (Finanzamt, BAföG, Universitäten) und das Umwandeln von iPhone-HEIC-Fotos für Windows-Büros. PdfPixels bietet kostenlose, datenschutzkonforme Browser-Tools für diese Aufgaben — ohne Software-Installation und ohne Registrierungszwang.',
    commonTasks: [
      {
        title: 'Bewerbungsunterlagen zusammenführen',
        detail: 'Lebenslauf, Zeugnisse und Anschreiben in eine geordnete PDF verbinden.',
        href: '/de/tools/merge-pdf',
      },
      {
        title: 'PDF verkleinern für Portale',
        detail: 'Scans auf unter 2 MB oder 5 MB für Upload-Formulare komprimieren.',
        href: '/de/tools/compress-pdf',
      },
      {
        title: 'Texterkennung (OCR) für Scans',
        detail: 'Gescannten Text aus Dokumenten durchsuchbar und kopierbar machen.',
        href: '/de/tools/ocr-pdf',
      },
    ],
    localNotes: [
      'Deutsche Behörden und Firmen verlangen meist eine einzige PDF mit logischer Seitenreihenfolge.',
      'DSGVO-konforme Verarbeitung: Browser-native Tools verarbeiten Daten direkt auf Ihrem Gerät; serverseitige Dateien werden nach 60 Minuten gelöscht.',
      'Smartphone-Fotos im HEIC-Format vor dem Versand in kompatibles JPG umwandeln.',
    ],
    faqs: [
      {
        question: 'Sind die PdfPixels-Tools in Deutschland kostenlos?',
        answer: 'Ja. Alle Standard-PDF- und Bild-Werkzeuge können ohne Kosten und ohne Registrierung genutzt werden.',
      },
      {
        question: 'Werden Dokumente datenschutzkonform nach DSGVO verarbeitet?',
        answer: 'Ja. Werkzeuge laufen entweder direkt in Ihrem Browser oder verarbeiten Dateien flüchtig mit automatischer Löschung binnen 60 Minuten.',
      },
    ],
  },
  {
    code: 'fr',
    name: 'France',
    adjective: 'French',
    locale: 'fr-FR',
    localCopy: 'adopté en France',
    headline: 'Outils PDF et image gratuits pour démarches administratives, CV et envois par email',
    intro:
      'En France, les usagers font face à des limites strictes de poids de fichier pour les démarches en ligne (Parcoursup, CAF, impôts, titres de séjour, candidatures). Les photos iPhone en HEIC bloquent souvent les ordinateurs de bureau. PdfPixels permet de fusionner vos justificatifs, compresser des scans volumineux et convertir des formats directement dans le navigateur, gratuitement et sans inscription.',
    commonTasks: [
      {
        title: 'Fusionner vos pièces justificatives',
        detail: 'Combiner CV, lettre de motivation et diplômes en un seul PDF ordonné.',
        href: '/fr/tools/merge-pdf',
      },
      {
        title: 'Compresser un PDF pour les téléservices',
        detail: 'Réduire le poids de vos scans pour respecter les plafonds de 2 Mo ou 5 Mo.',
        href: '/fr/tools/compress-pdf',
      },
      {
        title: 'Convertir photos HEIC en JPG',
        detail: 'Rendre vos photos d’iPhone lisibles sur tous les systèmes Windows et portails.',
        href: '/fr/tools/heic-to-jpg',
      },
    ],
    localNotes: [
      'Les téléservices publics français exigent souvent des fichiers de moins de 2 Mo ou 5 Mo par document.',
      'Conformité RGPD : traitement local dans le navigateur ou suppression automatique sous 60 minutes sur serveur.',
      'Convertissez les photos de documents en PDF propre pour faciliter la lecture par les instructeurs.',
    ],
    faqs: [
      {
        question: 'Les outils PdfPixels sont-ils gratuits en France ?',
        answer: 'Oui. L’ensemble des fonctionnalités courantes est accessible gratuitement, sans création de compte.',
      },
      {
        question: 'Comment réunir plusieurs documents en un seul PDF ?',
        answer: 'Utilisez l’outil Fusionner PDF, déposez vos fichiers, ajustez leur ordre puis téléchargez le fichier combiné.',
      },
    ],
  },
  {
    code: 'jp',
    name: 'Japan',
    adjective: 'Japanese',
    locale: 'ja-JP',
    localCopy: '日本国内で安心・無料',
    headline: '就活・確定申告・ビジネス文書のための無料PDF＆画像変換ツール',
    intro:
      '日本のユーザーに向けて、履歴書や職務経歴書のPDF結合、確定申告（e-Tax）やマイナポータル用の容量圧縮、iPhoneの写真（HEIC）をWindowsで開けるJPGへ変換するなど、日本の実務に即したブラウザ完結ツールを提供しています。面倒な会員登録やインストールは不要です。',
    commonTasks: [
      {
        title: '応募書類のPDFを1つに結合',
        detail: '履歴書、職務経歴書、ポートフォリオを指定の順序で単一PDFにまとめます。',
        href: '/jp/tools/merge-pdf',
      },
      {
        title: 'PDFの容量をメール・申請用に圧縮',
        detail: 'スキャンした書類のファイルサイズを品質を保ったまま軽量化します。',
        href: '/jp/tools/compress-pdf',
      },
      {
        title: 'スキャンPDFの文字をOCR認識',
        detail: '紙のスキャンデータから文字を抽出してテキスト化・検索可能にします。',
        href: '/jp/tools/ocr-pdf',
      },
    ],
    localNotes: [
      '就職活動や公的申請では、複数書類を1つのPDFにまとめる指定が一般的です。',
      'プライバシー保護：ブラウザ内処理と60分以内のサーバー自動消去で安全に処理されます。',
      'iPhoneで撮影したHEIC形式の書類は、事前にJPGやPDFへ変換しておくと互換性が高まります。',
    ],
    faqs: [
      {
        question: '日本国内から無料で利用できますか？',
        answer: 'はい。会員登録やクレジットカード登録なしで、すべての主要ツールを無料で使用できます。',
      },
      {
        question: 'アップロードしたファイルは安全ですか？',
        answer: 'ブラウザ内処理ツールはサーバーへ送信されません。サーバー処理を伴うツールも60分以内に完全消去されます。',
      },
    ],
  },
  {
    code: 'es',
    name: 'Spain',
    adjective: 'Spanish',
    locale: 'es-ES',
    localCopy: 'de confianza en España y Latinoamérica',
    headline: 'Herramientas PDF e imagen gratis para trámites oficiales, oposiciones y empleo',
    intro:
      'En España y países hispanohablantes, las sedes electrónicas (Seguridad Social, SEPE, Agencia Tributaria, extranjería u oposiciones) exigen PDFs comprimidos a menos de 2 MB o 5 MB y fotos en formatos estándar. PdfPixels permite unir expedientes, reducir el peso de documentos y transformar fotos de iPhone al instante sin coste ni registro.',
    commonTasks: [
      {
        title: 'Unir expedientes en un solo PDF',
        detail: 'Juntar solicitudes, DNI y certificados en un único archivo ordenado.',
        href: '/es/tools/merge-pdf',
      },
      {
        title: 'Comprimir PDF para sedes electrónicas',
        detail: 'Bajar de 2 MB o 5 MB manteniendo el texto legible para evitar rechazos.',
        href: '/es/tools/compress-pdf',
      },
      {
        title: 'Extraer texto de PDFs escaneados con OCR',
        detail: 'Reconocer texto en imágenes y documentos escaneados fácilmente.',
        href: '/es/tools/ocr-pdf',
      },
    ],
    localNotes: [
      'Las sedes electrónicas rechazan frecuentemente archivos que superan los límites de tamaño permitidos.',
      'Privacidad y RGPD: procesado en el navegador o borrado automático seguro del servidor en menos de 60 minutos.',
      'Para trámites con firmas digitales, une los documentos antes de estampar los certificados.',
    ],
    faqs: [
      {
        question: '¿Es PdfPixels gratuito en España y Latinoamérica?',
        answer: 'Sí. Todas las herramientas centrales son gratuitas y no requieren registro de cuenta.',
      },
      {
        question: '¿Cómo reduzco el tamaño de mi PDF para subirlo a la sede electrónica?',
        answer: 'Entra en Comprimir PDF, sube tu archivo, selecciona el nivel de compresión deseado y descarga el PDF optimizado.',
      },
    ],
  },
  {
    code: 'pt',
    name: 'Brazil',
    adjective: 'Brazilian',
    locale: 'pt-BR',
    localCopy: 'utilizado no Brasil e Portugal',
    headline: 'Ferramentas gratuitas de PDF e imagem para concursos, vestibulares e trabalho',
    intro:
      'Usuários no Brasil e em países lusófonos enfrentam exigências constantes de anexos leves para inscrições em concursos públicos, ENEM, SISU, tribunais eletrônicos (PJe) e sistemas governamentais (Gov.br). O PdfPixels reúne ferramentas práticas para juntar documentos, reduzir o tamanho de arquivos e converter fotos direto no navegador sem taxas e sem cadastro.',
    commonTasks: [
      {
        title: 'Juntar documentos em um único PDF',
        detail: 'Combinar RG, comprovante de residência e certidões no arquivo final.',
        href: '/pt/tools/merge-pdf',
      },
      {
        title: 'Comprimir PDF para portais e processos',
        detail: 'Reduzir megabytes para atender limites do PJe, Gov.br e concursos.',
        href: '/pt/tools/compress-pdf',
      },
      {
        title: 'Converter fotos do celular (HEIC) para JPG',
        detail: 'Abrir e enviar fotos do iPhone em qualquer computador Windows com facilidade.',
        href: '/pt/tools/heic-to-jpg',
      },
    ],
    localNotes: [
      'Portais públicos e tribunais frequentemente bloqueiam anexos acima de 2MB ou 5MB.',
      'Proteção e privacidade: arquivos processados localmente ou excluídos em até 60 minutos dos servidores temporários.',
      'Fotografou documentos com o celular? Converta para PDF e junte em ordem antes de protocolar.',
    ],
    faqs: [
      {
        question: 'O PdfPixels é gratuito para usar no Brasil?',
        answer: 'Sim. Os recursos principais de PDF e imagem funcionam gratuitamente direto no navegador sem necessidade de criar conta.',
      },
      {
        question: 'Como juntar vários comprovantes em um só arquivo PDF?',
        answer: 'Acesse Juntar PDF, adicione as páginas desejadas, ordene conforme a exigência do edital e baixe o documento unificado.',
      },
    ],
  },
];

export function getRegionByCode(code: string): GeoRegion | undefined {
  return geoRegions.find((r) => r.code === code.toLowerCase());
}
