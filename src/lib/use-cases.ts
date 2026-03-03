export type UseCasePage = {
  slug: string;
  title: string;
  description: string;
  targetToolSlug: string;
  intent: string;
};

export const useCasePages: UseCasePage[] = [
  {
    slug: 'compress-image-to-20kb',
    title: 'Compress Image to 20KB Online Free',
    description: 'Reduce JPG, PNG, or WebP images to around 20KB for forms and uploads without major quality loss.',
    targetToolSlug: 'compress-image',
    intent: 'compress image to 20kb',
  },
  {
    slug: 'compress-image-to-50kb',
    title: 'Compress Image to 50KB Online',
    description: 'Quickly optimize image file size to 50KB for portals, job forms, and exam applications.',
    targetToolSlug: 'compress-image',
    intent: 'compress image to 50kb',
  },
  {
    slug: 'compress-image-to-100kb',
    title: 'Compress Image to 100KB Without Losing Quality',
    description: 'Resize and optimize images to 100KB for online uploads while preserving readability and clarity.',
    targetToolSlug: 'compress-image',
    intent: 'compress image to 100kb',
  },
  {
    slug: 'resize-image-for-passport',
    title: 'Resize Image for Passport Photo',
    description: 'Create passport-size photos in the correct dimensions (2x2 inch, 35x45 mm, and more).',
    targetToolSlug: 'passport-size-photo',
    intent: 'resize image for passport photo',
  },
  {
    slug: 'resize-image-for-instagram',
    title: 'Resize Image for Instagram Post and Story',
    description: 'Set exact Instagram dimensions for feed, story, and reel covers in one click.',
    targetToolSlug: 'resize-image',
    intent: 'resize image for instagram',
  },
  {
    slug: 'convert-heic-to-jpg-online',
    title: 'Convert HEIC to JPG Online',
    description: 'Turn iPhone HEIC photos into JPG for universal compatibility on all devices.',
    targetToolSlug: 'heic-to-jpg',
    intent: 'convert heic to jpg online',
  },
  {
    slug: 'png-to-jpg-converter',
    title: 'PNG to JPG Converter Online',
    description: 'Convert PNG files to JPG quickly with adjustable quality for web and email.',
    targetToolSlug: 'png-to-jpeg',
    intent: 'png to jpg converter',
  },
  {
    slug: 'merge-pdf-files-online-free',
    title: 'Merge PDF Files Online Free',
    description: 'Combine multiple PDF files into one document without sign-up or watermark.',
    targetToolSlug: 'merge-pdf',
    intent: 'merge pdf files online free',
  },
  {
    slug: 'split-pdf-pages-online',
    title: 'Split PDF Pages Online',
    description: 'Extract specific pages or split full PDF files into smaller documents instantly.',
    targetToolSlug: 'split-pdf',
    intent: 'split pdf pages online',
  },
  {
    slug: 'compress-pdf-for-email',
    title: 'Compress PDF for Email Attachment',
    description: 'Reduce PDF size for Gmail, Outlook, and portal upload limits without losing readability.',
    targetToolSlug: 'compress-pdf',
    intent: 'compress pdf for email',
  },
  {
    slug: 'remove-background-from-image',
    title: 'Remove Background from Image Online',
    description: 'Use AI to remove photo backgrounds and export transparent PNG in seconds.',
    targetToolSlug: 'remove-image-background',
    intent: 'remove background from image',
  },
  {
    slug: 'convert-pdf-to-jpg',
    title: 'Convert PDF to JPG Online',
    description: 'Convert PDF pages into high-quality JPG images for sharing and editing.',
    targetToolSlug: 'pdf-to-jpg',
    intent: 'convert pdf to jpg',
  },
];
