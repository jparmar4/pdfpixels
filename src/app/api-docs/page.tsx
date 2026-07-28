import { Metadata } from 'next';
import { ApiDocsPage } from './api-docs-page';

export const metadata: Metadata = {
  title: 'API Documentation - PdfPixels',
  description: 'Complete API documentation for PdfPixels image and PDF processing endpoints. Free to use, no authentication required.',
  alternates: {
    canonical: '/api-docs',
  },
  // Conservative for AdSense quality: keep out of main discovery until API is a polished product surface
  robots: {
    index: false,
    follow: true,
  },
};

export default function ApiDocs() {
  return <ApiDocsPage />;
}
