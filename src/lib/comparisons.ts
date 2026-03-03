export type ComparisonPage = {
  slug: string;
  title: string;
  description: string;
  primaryToolSlug: string;
  alternatives: string[];
  bestFor: string[];
};

export const comparisonPages: ComparisonPage[] = [
  {
    slug: 'pdfpixels-vs-ilovepdf-merge-pdf',
    title: 'PdfPixels vs iLovePDF for Merge PDF',
    description: 'Feature-by-feature comparison for merging PDF files, speed, privacy, and workflow simplicity.',
    primaryToolSlug: 'merge-pdf',
    alternatives: ['iLovePDF'],
    bestFor: ['No-signup workflows', 'Quick merge tasks', 'Simple drag-and-drop operations'],
  },
  {
    slug: 'pdfpixels-vs-smallpdf-compress-pdf',
    title: 'PdfPixels vs Smallpdf for Compress PDF',
    description: 'Compare PDF compression experience, output quality, and convenience for email-ready files.',
    primaryToolSlug: 'compress-pdf',
    alternatives: ['Smallpdf'],
    bestFor: ['Email attachment optimization', 'Fast online compression', 'Free usage'],
  },
  {
    slug: 'pdfpixels-vs-tinypng-compress-image',
    title: 'PdfPixels vs TinyPNG for Image Compression',
    description: 'Detailed comparison for JPG/PNG/WebP compression controls, targeting size, and output workflow.',
    primaryToolSlug: 'compress-image',
    alternatives: ['TinyPNG'],
    bestFor: ['Target-size compression', 'Mixed image formats', 'No-login quick tasks'],
  },
  {
    slug: 'pdfpixels-vs-removebg-background-removal',
    title: 'PdfPixels vs remove.bg for Background Removal',
    description: 'Compare AI background removal quality, convenience, and end-to-end editing flow.',
    primaryToolSlug: 'remove-image-background',
    alternatives: ['remove.bg'],
    bestFor: ['One-tool edit flow', 'Quick transparent PNG exports', 'Simple browser workflow'],
  },
  {
    slug: 'pdfpixels-vs-canva-resize-image',
    title: 'PdfPixels vs Canva for Image Resize Tasks',
    description: 'Compare pure utility image resizing vs design-suite workflow for pixel-accurate resizing jobs.',
    primaryToolSlug: 'resize-image',
    alternatives: ['Canva'],
    bestFor: ['Dimension-first jobs', 'Fast technical resizing', 'DPI-aware export flow'],
  },
  {
    slug: 'pdfpixels-vs-adobe-pdf-to-jpg',
    title: 'PdfPixels vs Adobe for PDF to JPG Conversion',
    description: 'Compare conversion speed, ease of use, and result handling for PDF-to-image tasks.',
    primaryToolSlug: 'pdf-to-jpg',
    alternatives: ['Adobe Acrobat Online'],
    bestFor: ['Quick conversion tasks', 'Simple download flow', 'No-account workflows'],
  },
];
