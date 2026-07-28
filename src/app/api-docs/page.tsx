import { Metadata } from 'next';
import { ApiDocsPage } from './api-docs-page';

export const metadata: Metadata = {
  title: 'API Documentation - PdfPixels',
  description: 'Complete API documentation for PdfPixels image and PDF processing endpoints. Free to use, no authentication required.',
  alternates: {
    canonical: '/api-docs',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function ApiDocs() {
  return <ApiDocsPage />;
}
