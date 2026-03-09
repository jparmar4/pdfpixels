import { allTools } from '@/lib/tools-data';
import { DEFAULT_OG_IMAGE_PATH, absoluteUrl } from '@/lib/seo';

const toolCountLabel = `${allTools.length}+`;

export const siteConfig = {
  name: 'PdfPixels',
  url: absoluteUrl('/'),
  ogImage: DEFAULT_OG_IMAGE_PATH,
  links: {
    contact: absoluteUrl('/contact'),
    blog: absoluteUrl('/blog'),
  },
  creator: 'PdfPixels Team',
  publisher: 'PdfPixels',
};

export const seoConfig = {
  siteName: 'PdfPixels',
  tagline: 'Free online PDF and image tools',
  description: 'Free online PDF and image tools for compression, conversion, editing, and AI-powered workflows. No signup required.',
  longDescription: `PdfPixels is a free online workspace for PDF and image tasks such as compression, conversion, resizing, background removal, and document cleanup. The platform is built around fast, privacy-aware workflows, practical tool pages, and clear guidance for users who need dependable results without signup friction.`,
  primaryKeywords: [
    'pdf tools',
    'image tools',
    'compress pdf',
    'merge pdf',
    'compress image',
    'resize image',
    'convert image online',
    'background remover',
  ],
  secondaryKeywords: [
    'free pdf tools',
    'free image tools',
    'pdf compressor online',
    'pdf merger online',
    'image compressor online',
    'resize image online',
    'convert png to jpg',
    'heic to jpg converter',
    'image to pdf',
    'pdf to jpg',
    'passport photo maker',
    'ai image enhancer',
  ],
  longTailKeywords: [
    'compress pdf online free without signup',
    'merge pdf files online free',
    'compress image to target size online',
    'resize image for passport photo online',
    'convert heic to jpg free online',
    'remove background from image online free',
    'convert image to pdf free online',
    'split pdf pages online free',
  ],
  targetLanguages: ['en'],
  targetCountries: ['US', 'GB', 'CA', 'AU', 'IN'],
  brandColor: '#4f46e5',
  credentials: {
    tools: toolCountLabel,
    access: 'No signup',
    workflow: 'Browser + server',
    coverage: 'PDF + image',
  },
  trustSignals: [
    'No signup required',
    'Core tools are free to use',
    'Privacy-aware processing',
    'Mobile-friendly workflows',
    'Tool-specific limits are shown clearly',
  ],
};

export const faqData = [
  {
    question: 'What is PdfPixels?',
    answer: `PdfPixels is a free online platform for PDF and image workflows such as compression, resizing, conversion, background removal, and document editing. It currently offers ${toolCountLabel} tools without requiring account creation for core tasks.`,
    keywords: ['pdfpixels', 'pdf tools platform', 'image tools platform', 'online file tools'],
  },
  {
    question: 'How do I compress an image online for free?',
    answer: 'Open the Compress Image tool on PdfPixels, upload a JPG, PNG, WebP, or related format, choose your quality or target-size settings, and download the optimized result.',
    keywords: ['compress image free', 'reduce image size online', 'image compression tool', 'shrink image file'],
  },
  {
    question: 'Is PdfPixels free?',
    answer: 'Yes. PdfPixels offers free access to its core PDF and image workflows, including compression, conversion, resizing, and several AI-assisted tools.',
    keywords: ['free image editor', 'free pdf tools', 'free online editor', 'no cost image tools'],
  },
  {
    question: 'How do I resize an image to pixels, cm, or inches?',
    answer: 'Use the Resize Image tool, upload your photo, enter your target dimensions in pixels, centimeters, or inches, and download the resized version.',
    keywords: ['resize image', 'change image dimensions', 'image resizer online', 'photo size changer'],
  },
  {
    question: 'What file formats does PdfPixels support?',
    answer: 'PdfPixels supports common image formats such as JPG, JPEG, PNG, WebP, HEIC, GIF, BMP, TIFF, and PDF workflows for merge, split, compression, conversion, and page editing.',
    keywords: ['supported formats', 'file types', 'image formats', 'pdf support'],
  },
  {
    question: 'How do I convert PNG to JPG?',
    answer: 'Upload your PNG image to the PNG to JPEG converter, let the conversion finish, and download the JPG output instantly.',
    keywords: ['png to jpg', 'convert png', 'image format conversion', 'png converter'],
  },
  {
    question: 'How do I merge PDF files?',
    answer: 'Open Merge PDF, upload the PDF files you want to combine, reorder them if needed, and download the merged document.',
    keywords: ['merge pdf', 'combine pdf files', 'join pdfs online', 'pdf merger free'],
  },
  {
    question: 'Is PdfPixels safe?',
    answer: 'PdfPixels uses privacy-aware processing and clear workflow messaging. Depending on the tool, processing can happen in the browser or on the server, and the platform explains those differences on each page.',
    keywords: ['data security', 'privacy', 'safe image editor', 'secure file processing'],
  },
  {
    question: 'How do I remove an image background?',
    answer: 'Upload your image to the Remove Background tool and let the AI isolate the subject. You can then download the result as a transparent PNG.',
    keywords: ['remove background', 'background eraser', 'transparent background', 'ai background removal'],
  },
  {
    question: 'Does PdfPixels work on mobile?',
    answer: 'Yes. PdfPixels is designed to work on desktop and mobile browsers, including iPhone, Android, and tablet devices.',
    keywords: ['mobile image editor', 'iphone photo editor', 'android image tools', 'responsive'],
  },
  {
    question: 'How do I make a passport photo online?',
    answer: 'Use Passport Photo Maker, upload your image, select the target document format or country preset, and export the resized result.',
    keywords: ['passport photo maker', 'visa photo online', 'id photo creator', 'passport size photo'],
  },
  {
    question: 'What are the upload limits?',
    answer: 'Upload limits vary by tool. PdfPixels shows the current file limits and accepted formats inside each workflow before processing starts.',
    keywords: ['file size limit', 'maximum upload', 'large image processing', 'file limits'],
  },
];

export const howToData = [
  {
    name: 'How to Compress an Image',
    description: 'Reduce image file size while keeping it clear enough for web, email, or form uploads.',
    estimatedTime: 'PT1M',
    steps: [
      { position: 1, name: 'Open the compressor', text: 'Go to the Compress Image tool on PdfPixels.' },
      { position: 2, name: 'Upload your image', text: 'Choose a JPG, PNG, WebP, or another supported image file.' },
      { position: 3, name: 'Adjust compression settings', text: 'Set a quality level or a target file size based on your use case.' },
      { position: 4, name: 'Process the image', text: 'Start compression and wait for the optimized output.' },
      { position: 5, name: 'Download the result', text: 'Save the compressed image once the preview and file size look right.' },
    ],
  },
  {
    name: 'How to Merge PDF Files',
    description: 'Combine multiple PDF files into one document in a few quick steps.',
    estimatedTime: 'PT1M',
    steps: [
      { position: 1, name: 'Open Merge PDF', text: 'Navigate to the Merge PDF tool on PdfPixels.' },
      { position: 2, name: 'Upload PDF files', text: 'Select the PDF files you want to combine.' },
      { position: 3, name: 'Reorder pages or files', text: 'Arrange the files in the order you want them to appear.' },
      { position: 4, name: 'Merge the documents', text: 'Start the merge process to create a single PDF file.' },
      { position: 5, name: 'Download the merged PDF', text: 'Save the finished document to your device.' },
    ],
  },
];

export const organizationData = {
  name: 'PdfPixels',
  alternateName: 'PDF Pixels',
  url: absoluteUrl('/'),
  logo: absoluteUrl('/icon-512.png'),
  description: 'Free online PDF and image processing platform with browser and server workflows.',
  foundingDate: '2024',
  sameAs: [
    'https://twitter.com/pdfpixels',
    'https://www.linkedin.com/company/pdfpixels',
    'https://www.youtube.com/@pdfpixels'
  ],
  contactPoint: {
    type: 'CustomerService',
    availableLanguage: ['English'],
    contactType: 'customer support',
    email: 'support@pdfpixels.com',
  },
};

export const webAppData = {
  name: 'PdfPixels',
  description: 'Free online PDF and image processing platform',
  url: absoluteUrl('/'),
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Any',
  browserRequirements: 'Requires a modern web browser with JavaScript enabled.',
  offers: {
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Compress PDF',
    'Merge PDF',
    'Split PDF',
    'Image compression',
    'Image resizing',
    'Format conversion',
    'Background removal',
    'Passport photo creation',
  ],
};
