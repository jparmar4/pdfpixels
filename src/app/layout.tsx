import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { JsonLdSchemas } from "@/components/seo/json-ld";
import { seoConfig, siteConfig } from "@/lib/seo-config";
import { AdSenseScript } from "@/components/ads/adsense-script";
import { CookieConsentBanner } from "@/components/ads/cookie-consent";

// Comprehensive SEO Metadata
export const metadata: Metadata = {
  // Basic metadata
  title: {
    default: `${siteConfig.name} - Free Online Image & PDF Tools | Compress, Resize, Convert`,
    template: `%s | ${siteConfig.name}`,
  },
  description: seoConfig.longDescription,
  keywords: [
    ...seoConfig.primaryKeywords,
    ...seoConfig.secondaryKeywords,
    ...seoConfig.longTailKeywords,
  ],
  authors: [{ name: siteConfig.creator, url: siteConfig.url }],
  creator: siteConfig.creator,
  publisher: siteConfig.publisher,

  // URL and canonical
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/',
      'x-default': '/',
    },
    types: {
      'application/rss+xml': '/feed',
    },
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Icons
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/logo.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} - Free Online Image & PDF Tools`,
    description: seoConfig.longDescription,
    images: [
      {
        url: `${siteConfig.url}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'PdfPixels - Free Online Image and PDF Editing Tools',
        type: 'image/png',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    site: '@pdfpixels',
    creator: '@pdfpixels',
    title: `${siteConfig.name} - Free Online Image & PDF Tools`,
    description: seoConfig.longDescription,
    images: [`${siteConfig.url}/opengraph-image`],
  },

  // AI Bots & Crawlers - Allow AI companies for indexing (AEO/GEO Optimization)
  other: {
    // LLM.txt location for AI crawlers
    'llms-txt': 'https://www.pdfpixels.com/llms.txt',

    // Content quality signals
    'rating': 'general',
    'distribution': 'global',

    // GEO signals
    'geo.region': 'US',
    'geo.placename': 'Worldwide',
    'ICBM': '0, 0',
  },

  // Verification tags for all major search engines
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || 'google1b97f335783a2de5',
    other: {
      // Bing Webmaster verification
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || 'FB59613C2AC3152EE30F7AA64D5F67BA',
      // Yandex Webmaster verification
      'yandex-verification': process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || 'c91f89e27af42d74',
    },
  },

  // Additional meta tags for search engines
  category: 'Image Processing, PDF Tools, Online Utilities',
  classification: 'Web Application, Productivity Tool',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },

  // Apple web app capabilities
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PdfPixels',
  },

};

// Viewport configuration
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        {/* Preconnect to important origins */}
        {/* DNS Prefetch for external resources */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />

        {/* Preconnect for Google AdSense */}
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />
        <link rel="preconnect" href="https://adservice.google.com" />

        {/* Discovery */}
        <link rel="search" type="application/opensearchdescription+xml" title="PdfPixels" href="/opensearch.xml" />

        {/* Explicit Favicon Links - Critical for Google Search logo */}
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png" />
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

      </head>
      <body className="antialiased bg-background text-foreground">
        <JsonLdSchemas />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          forcedTheme="light"
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <AdSenseScript />
        </ThemeProvider>
      </body>
    </html>
  );
}
