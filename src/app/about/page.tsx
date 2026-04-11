import type { Metadata } from 'next';
import { AboutPageContent } from './about-content';

export const metadata: Metadata = {
  title: 'About Us - PdfPixels | Free Online Image & PDF Tools',
  description: 'Learn about PdfPixels and the product principles behind our premium image and PDF tooling platform.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  return <AboutPageContent />;
}
