import type { Metadata } from 'next';
import { AboutPageContent } from './about-content';
import { absoluteUrl, DEFAULT_OG_IMAGE_URL, getRobotsMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'About Us | Free Online Image & PDF Tools',
  description: 'Learn about PdfPixels and the product principles behind our premium image and PDF tooling platform.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About PdfPixels | Free Online Image & PDF Tools',
    description: 'Learn about PdfPixels and the product principles behind our premium image and PDF tooling platform.',
    url: absoluteUrl('/about'),
    type: 'website',
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: 'About PdfPixels',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About PdfPixels | Free Online Image & PDF Tools',
    description: 'Learn about PdfPixels and the product principles behind our premium image and PDF tooling platform.',
    images: [DEFAULT_OG_IMAGE_URL],
  },
  robots: getRobotsMetadata(true),
};

export default function AboutPage() {
  return <AboutPageContent />;
}
