import { Inter, Sora, JetBrains_Mono } from 'next/font/google';
import '@/app/globals.css';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { JsonLdSchemas } from '@/components/seo/json-ld';
import { WebMCPRegistration } from '@/components/seo/webmcp-provider';
import { CookieConsentBanner } from '@/components/ads/cookie-consent';
import { Analytics } from '@/components/ads/analytics';
import { AdSenseScript } from '@/components/ads/adsense-script';
import { DeferredSocialBar } from '@/components/ads/deferred-social-bar';
import { DeferredPopunder } from '@/components/ads/deferred-popunder';
import { adsenseConfig } from '@/lib/ads-config';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { ScrollToTop } from '@/components/home/scroll-to-top';
import { ClickRipple } from '@/components/ui/click-ripple';
import { ChunkReloadHandler } from '@/components/layout/chunk-reload-handler';

const fontInter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const fontSora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

const SKIP_LABELS: Record<string, string> = {
  es: 'Saltar al contenido principal',
  fr: 'Aller au contenu principal',
  de: 'Zum Hauptinhalt springen',
  pt: 'Ir para o conteúdo principal',
  ja: 'メインコンテンツへ移動',
};

export function RootDocumentShell({
  children,
  lang = 'en',
}: Readonly<{ children: React.ReactNode; lang?: string }>) {
  const skipLabel = SKIP_LABELS[lang] ?? 'Skip to main content';

  return (
    <html
      lang={lang}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`scroll-smooth ${fontInter.variable} ${fontSora.variable} ${fontMono.variable}`}
    >
      {/* eslint-disable-next-line @next/next/no-head-element -- RootDocumentShell is imported directly by each locale RootLayout */}
      <head>
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="preconnect" href="https://bauval.org" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://abscloud.org" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.highperformanceformat.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://araplhn.org" />
        <link rel="dns-prefetch" href="https://abscloud.org" />
        {adsenseConfig.clientId && (
          <meta name="google-adsense-account" content={adsenseConfig.clientId} />
        )}
        <link rel="search" type="application/opensearchdescription+xml" title="PdfPixels" href="/opensearch.xml" />
        <link rel="alternate" type="application/rss+xml" title="PdfPixels RSS Feed" href="https://www.pdfpixels.com/feed" />
        <link rel="alternate" type="text/plain" title="PdfPixels for LLMs" href="/llms.txt" />
        <link rel="alternate" type="text/plain" title="PdfPixels full reference for LLMs" href="/llms-full.txt" />
        <link rel="alternate" type="text/markdown" title="PdfPixels Markdown for Agents" href="/markdown" />
        <link rel="mcp-server" type="application/json" href="/.well-known/mcp/server-card.json" />
        <link rel="api-catalog" type="application/linkset+json" href="/.well-known/api-catalog" />
      </head>
      <body className="bg-background text-foreground antialiased min-h-screen flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:text-sm focus:font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {skipLabel}
        </a>
        <JsonLdSchemas lang={lang} />
        <WebMCPRegistration />
        <ChunkReloadHandler />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <Navigation />
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <Footer />
          <ScrollToTop />
          <ClickRipple />
          <SonnerToaster richColors closeButton position="top-center" offset={{ top: 84, bottom: 24 }} />
          <Analytics />
          <AdSenseScript />
          <DeferredSocialBar />
          <DeferredPopunder />
          <CookieConsentBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
