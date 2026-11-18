import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE_URL, getRobotsMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Contact Us - Support, Feedback & Partnerships',
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
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: 'Contact PdfPixels',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact PdfPixels',
    description: 'Reach PdfPixels support for tool questions, feedback, and partnerships.',
    images: [DEFAULT_OG_IMAGE_URL],
  },
  robots: getRobotsMetadata(true),
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
