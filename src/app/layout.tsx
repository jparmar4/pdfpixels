import type { Metadata, Viewport } from 'next';
import { Inter, DM_Sans, Outfit } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from 'next-themes';
import { JsonLdSchemas } from '@/components/seo/json-ld';
import { seoConfig, siteConfig } from '@/lib/seo-config';
import { AdSenseScript } from '@/components/ads/adsense-script';
import { DEFAULT_OG_IMAGE_URL } from '@/lib/seo';
import { CookieConsentBanner } from '@/components/ads/cookie-consent';
import { Analytics } from '@/components/ads/analytics';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';

const fontInter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const fontDmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const fontOutfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  title: {
    default: `${siteConfig.name} - Free Online PDF & Image Tools`,
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
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} - Free Online PDF & Image Tools`,
    description: seoConfig.longDescription,
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: 'PdfPixels - Free online PDF and image tools',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} - Free Online PDF & Image Tools`,
    description: seoConfig.longDescription,
    images: [DEFAULT_OG_IMAGE_URL],
  },
  other: {
    'llms-txt': `${siteConfig.url}/llms.txt`,
    rating: 'general',
    distribution: 'global',
    'geo.region': 'US',
    'geo.placename': 'Worldwide',
    ICBM: '0, 0',
    'content-language': 'en-US',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-title': siteConfig.name,
    'msapplication-TileColor': seoConfig.brandColor,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: {
      ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } : {}),
      ...(process.env.NEXT_PUBLIC_YANDEX_VERIFICATION ? { 'yandex-verification': process.env.NEXT_PUBLIC_YANDEX_VERIFICATION } : {}),
    },
  },
  category: 'Productivity',
  classification: 'Web Application',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: siteConfig.name,
  },
};

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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`scroll-smooth ${fontInter.variable} ${fontDmSans.variable} ${fontOutfit.variable}`}>
      <head>
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />
        <link rel="preconnect" href="https://adservice.google.com" />
        <link rel="search" type="application/opensearchdescription+xml" title="PdfPixels" href="/opensearch.xml" />
        <link rel="alternate" type="application/rss+xml" title="PdfPixels RSS Feed" href="/feed" />
      </head>
      <body className="bg-background text-foreground antialiased min-h-screen flex flex-col">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:text-sm focus:font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50">
          Skip to main content
        </a>
        <JsonLdSchemas />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <Navigation />
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <Footer />
          <Toaster />
          <AdSenseScript />
          <Analytics />
          <CookieConsentBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
