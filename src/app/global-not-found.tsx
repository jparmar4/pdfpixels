import Link from 'next/link';
import type { Metadata } from 'next';
import { siteConfig } from '@/lib/seo-config';
import '@/app/globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: '404 - Page Not Found | PdfPixels',
  description: 'The page you are looking for does not exist. Browse free PDF and image tools on PdfPixels.',
  robots: { index: false, follow: true },
};

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased min-h-screen flex items-center justify-center px-4">
        <div className="max-w-lg text-center space-y-6">
          <p className="text-6xl font-extrabold text-primary">404</p>
          <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
          <p className="text-sm text-muted-foreground">
            The page you requested does not exist or has been moved. Explore our free PDF and image tools below.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
            >
              Go home
            </Link>
            <Link
              href="/tools"
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:border-primary/40"
            >
              Browse tools
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
