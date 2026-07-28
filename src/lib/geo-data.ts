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
];

export function getRegionByCode(code: string): GeoRegion | undefined {
  return geoRegions.find((r) => r.code === code.toLowerCase());
}
