import { HomePageSchemas } from '@/components/seo/json-ld';
import { ToolsSection } from '@/components/home/tools-section';
import { StatsBanner } from '@/components/home/stats-banner';
import { FAQSection } from '@/components/home/faq-section';
import { HowItWorks } from '@/components/home/how-it-works';
import { FeaturesSection } from '@/components/home/features-section';
import { GuidesSection } from '@/components/home/guides-section';
import { AnswerEngineSection } from '@/components/home/answer-engine-section';
import { AIContentSection } from '@/components/seo/ai-content';
import { InContentAd, FooterAd, NativeAd } from '@/components/ads/ad-banner';

import { Metadata } from 'next';
import { siteConfig, seoConfig } from '@/lib/seo-config';
import { getGeoLanguageAlternates, DEFAULT_OG_IMAGE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} - Free Online PDF & Image Tools` },
  description: seoConfig.description,
  alternates: {
    canonical: '/',
    languages: getGeoLanguageAlternates(),
  },
  openGraph: {
    title: `${siteConfig.name} - Free Online PDF & Image Tools`,
    description: seoConfig.description,
    url: siteConfig.url,
    type: 'website',
    siteName: siteConfig.name,
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: 'PdfPixels - Free online PDF and image tools',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} - Free Online PDF & Image Tools`,
    description: seoConfig.description,
    images: [DEFAULT_OG_IMAGE_URL],
  },
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main id="main-content" className="flex-1">
        <HomePageSchemas />
        <ToolsSection />
        <StatsBanner />
        <InContentAd variant="dual-rectangle" instanceId="home-mid" className="my-8" />
        <HowItWorks />
        <FeaturesSection />
        <GuidesSection />
        <NativeAd className="my-10 max-w-5xl mx-auto px-4" />
        <AnswerEngineSection />
        <InContentAd variant="rectangle" instanceId="home-pre-faq" className="my-8" />
        <FAQSection />
        <AIContentSection />
        <FooterAd className="my-8" />
      </main>
    </div>
  );
}
