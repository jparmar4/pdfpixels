import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact PdfPixels - Support, Feedback, and Partnerships',
  description:
    'Contact PdfPixels for product support, feature requests, or business questions. We typically reply within one business day.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact PdfPixels',
    description: 'Reach PdfPixels support for tool questions, feedback, and partnerships.',
    url: 'https://www.pdfpixels.com/contact',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
