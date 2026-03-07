// Comprehensive SEO Configuration for PdfPixels
// Optimized for Search Engines (Google, Bing, Yandex) and AI Search (ChatGPT, Gemini, Perplexity, etc.)

export const siteConfig = {
  name: 'PdfPixels',
  url: 'https://www.pdfpixels.com',
  ogImage: '/og-image.png',
  links: {
    twitter: 'https://twitter.com/pdfpixels',
    github: 'https://github.com/pdfpixels',
  },
  creator: 'PdfPixels Team',
  publisher: 'PdfPixels Inc.',
};

export const seoConfig = {
  // Core Site Information
  siteName: 'PdfPixels - Free Online Image & PDF Tools',
  tagline: 'Professional Image Editing Made Simple',
  description: 'Free online image and PDF tools. Compress, resize, convert, and edit images with AI-powered features. No signup required, secure, and instant processing.',
  longDescription: `PdfPixels is a free online platform for image and PDF processing. Our suite of professional tools includes image compression, resizing, format conversion, background removal, AI enhancement, PDF merging, splitting, and more. We focus on providing fast, secure, and easy-to-use tools with no registration required, no watermarks, and complete privacy protection.`,

  // Keywords for SEO
  primaryKeywords: [
    'image compressor',
    'image resizer',
    'image converter',
    'online image editor',
    'free image tools',
    'PDF tools',
    'background remover',
    'image optimization',
  ],

  secondaryKeywords: [
    'compress image online',
    'resize image pixels',
    'convert png to jpg',
    'reduce image size',
    'crop image online',
    'rotate image',
    'add watermark',
    'merge pdf online',
    'split pdf',
    'passport photo maker',
    'ai image enhance',
    'image upscaler',
  ],

  longTailKeywords: [
    'compress image to 50kb online free',
    'resize image for passport photo',
    'convert heic to jpg free',
    'remove background from image ai',
    'merge multiple pdf into one',
    'compress pdf without losing quality',
    'resize image for instagram',
    'convert image to 300 dpi',
  ],

  // Location/Language targeting
  targetLanguages: ['en', 'es', 'fr', 'de', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'],
  targetCountries: ['US', 'GB', 'CA', 'AU', 'IN', 'DE', 'FR', 'BR', 'RU', 'JP'],

  // Brand colors for social previews
  brandColor: '#8B5CF6',

  // Platform information
  credentials: {
    tools: '55+',
    users: '2M+',
    imagesProcessed: '50M+',
    rating: '4.9/5',
    uptime: '99.9%',
  },

  // Trust signals
  trustSignals: [
    'GDPR Compliant',
    '256-bit SSL Encryption',
    'No Data Storage',
    'Instant Processing',
    '100% Free',
  ],
};

// FAQ Data for AEO (Answer Engine Optimization)
export const faqData = [
  {
    question: 'What is PdfPixels?',
    answer: 'PdfPixels is a free, secure online platform for editing images and PDFs. It offers 55+ tools for compression, resizing, conversion, and AI enhancements without requiring registration or software installation.',
    keywords: ['pdfpixels', 'image editing platform', 'online image tools', 'free image editor'],
  },
  {
    question: 'How do I compress an image online for free?',
    answer: 'To compress an image on PdfPixels: Upload your JPG, PNG, or WebP file to the "Compress Image" tool, select your desired compression level (Low, Medium, High), and download the optimized file instantly. No signup is required.',
    keywords: ['compress image free', 'reduce image size online', 'image compression tool', 'shrink image file'],
  },
  {
    question: 'Is PdfPixels free?',
    answer: 'Yes, PdfPixels tools are currently free to use with no signup required. Core image and PDF workflows are available without subscription.',
    keywords: ['free image editor', 'no cost image tools', 'free online editor', 'free pdf tools'],
  },
  {
    question: 'How do I resize an image to pixels, cm, or inches?',
    answer: 'Use the "Resize Image" tool on PdfPixels. Upload your photo, enter the exact width and height in your preferred unit (pixels, cm, or inches), and download the resized image. You can also lock the aspect ratio or set a specific DPI for printing.',
    keywords: ['resize image', 'change image dimensions', 'image resizer online', 'photo size changer'],
  },
  {
    question: 'What file formats does PdfPixels support?',
    answer: 'PdfPixels supports all major image formats including JPG, PNG, WebP, HEIC, GIF, BMP, TIFF, and AVIF. For documents, it supports PDF merging, splitting, and conversion.',
    keywords: ['supported formats', 'file types', 'image formats', 'pdf support'],
  },
  {
    question: 'How do I convert PNG to JPG?',
    answer: 'Upload your PNG file to the "PNG to JPG" converter on PdfPixels. The tool will automatically convert it to a high-quality JPG image that you can download immediately.',
    keywords: ['png to jpg', 'convert png', 'image format conversion', 'png converter'],
  },
  {
    question: 'How do I merge PDF files?',
    answer: 'Select the "Merge PDF" tool, upload multiple PDF documents, arrange them in your desired order, and click "Merge". You can then download the single combined PDF file.',
    keywords: ['merge pdf', 'combine pdf files', 'join pdfs online', 'pdf merger free'],
  },
  {
    question: 'Is PdfPixels safe?',
    answer: 'Yes. PdfPixels uses secure transport and privacy-focused processing. File handling and cleanup depend on the specific tool workflow (browser-side or server-side).',
    keywords: ['data security', 'privacy', 'safe image editor', 'secure file processing'],
  },
  {
    question: 'How to remove image background?',
    answer: 'Upload your image to the "Background Remover" tool. Our AI technology will automatically detect the subject and remove the background, giving you a transparent PNG in seconds.',
    keywords: ['remove background', 'background eraser', 'transparent background', 'ai background removal'],
  },
  {
    question: 'Does PdfPixels work on mobile?',
    answer: 'Yes, PdfPixels is fully responsive and runs in any web browser on iPhone, Android, and tablets. No app installation is needed.',
    keywords: ['mobile image editor', 'iphone photo editor', 'android image tools', 'responsive'],
  },
  {
    question: 'How to make a passport photo online?',
    answer: 'Use the "Passport Photo Maker" on PdfPixels. Upload your photo, select your country or document type, and the tool will automatically crop and resize it to the official requirements (e.g., 2x2 inches or 35x45mm).',
    keywords: ['passport photo maker', 'visa photo online', 'id photo creator', 'passport size photo'],
  },
  {
    question: 'What is the upload limit?',
    answer: 'Upload limits vary by tool. Most image workflows support up to 100MB, while PDF limits depend on the operation (for example, per-file and total limits on merge/compress). If a file exceeds limits, the tool will show the exact maximum.',
    keywords: ['file size limit', 'maximum upload', 'large image processing', 'file limits'],
  },
  {
    question: 'How to compress an image to 20KB?',
    answer: 'Open PdfPixels Compress Image tool, upload your photo, and select "20KB" as the target size. The tool automatically adjusts quality to hit exactly 20KB. Works with JPG, PNG, and WebP files. Download instantly — no signup needed.',
    keywords: ['compress image 20kb', 'reduce image to 20kb', 'image 20kb online', 'photo compress 20kb'],
  },
  {
    question: 'How to convert HEIC to JPG without software?',
    answer: 'Visit PdfPixels.com, choose the format converter, upload your iPhone HEIC photos, and download them as JPG files. Works directly in any browser on Windows, Mac, Android, or iOS — no app installation required.',
    keywords: ['heic to jpg', 'convert heic free', 'iphone photo converter', 'heic converter online'],
  },
  {
    question: 'What is the best free online PDF merger?',
    answer: 'PdfPixels offers a free PDF merger for combining multiple files in one flow. Upload, reorder pages, merge, and download directly in your browser.',
    keywords: ['free pdf merger', 'best pdf combiner', 'merge pdf free', 'online pdf merge tool'],
  },
  {
    question: 'How to resize an image for Instagram?',
    answer: 'Open the PdfPixels Resize Image tool and select the Instagram preset: 1080×1080px for feed posts, 1080×1920px for stories and reels. Upload your photo and download the perfectly sized image instantly.',
    keywords: ['resize for instagram', 'instagram image size', 'instagram post dimensions', 'instagram story size'],
  },
  {
    question: 'What is the best free background remover?',
    answer: 'PdfPixels Background Remover uses AI to remove backgrounds from photos in seconds. It handles complex edges like hair and fur, outputs transparent PNG files, and is completely free with no watermarks or registration.',
    keywords: ['free background remover', 'ai background removal', 'remove bg free', 'transparent background maker'],
  },
];

// HowTo structured data for key processes
export const howToData = [
  {
    name: 'How to Compress an Image',
    description: 'Learn how to reduce image file size while maintaining quality using PdfPixels',
    estimatedTime: 'PT1M',
    steps: [
      { position: 1, name: 'Select Tool', text: 'Click on "Compress Image" from the tools menu' },
      { position: 2, name: 'Upload Image', text: 'Drag and drop or click to upload your image file' },
      { position: 3, name: 'Choose Settings', text: 'Select compression level or target file size' },
      { position: 4, name: 'Process', text: 'Click the Compress button to start processing' },
      { position: 5, name: 'Download', text: 'Download your compressed image instantly' },
    ],
  },
  {
    name: 'How to Resize an Image',
    description: 'Change image dimensions to any size with PdfPixels',
    estimatedTime: 'PT1M',
    steps: [
      { position: 1, name: 'Open Resize Tool', text: 'Navigate to Resize Image tool' },
      { position: 2, name: 'Upload Photo', text: 'Select the image you want to resize' },
      { position: 3, name: 'Set Dimensions', text: 'Enter width and height in pixels, cm, or inches' },
      { position: 4, name: 'Choose Options', text: 'Select aspect ratio lock and DPI settings' },
      { position: 5, name: 'Download Result', text: 'Click Resize and download your new image' },
    ],
  },
];

// Organization schema data
export const organizationData = {
  name: 'PdfPixels',
  alternateName: 'PdfPixels',
  url: 'https://www.pdfpixels.com',
  logo: 'https://www.pdfpixels.com/logo.svg',
  description: 'Free online image and PDF processing platform with professional tools',
  foundingDate: '2024',
  founders: [
    { name: 'PdfPixels Team', type: 'Organization' },
  ],
  sameAs: [
    'https://twitter.com/pdfpixels',
    'https://github.com/pdfpixels',
  ],
  contactPoint: {
    type: 'CustomerService',
    availableLanguage: ['English'],
    contactType: 'customer service',
    email: 'support@pdfpixels.com',
  },
};

// WebApplication schema data
export const webAppData = {
  name: 'PdfPixels',
  description: 'Free online image and PDF processing platform',
  url: 'https://www.pdfpixels.com',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Any',
  browserRequirements: 'Requires JavaScript. Requires HTML5.',
  offers: {
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Image Compression',
    'Image Resizing',
    'Format Conversion',
    'Background Removal',
    'PDF Merge & Split',
    'AI Image Enhancement',
    'Passport Photo Maker',
    'Watermark Addition',
  ],
};

// Breadcrumb data
export const breadcrumbData = {
  items: [
    { name: 'Home', url: '/' },
    { name: 'Image Tools', url: '/#image-tools' },
    { name: 'PDF Tools', url: '/#pdf-tools' },
  ],
};
