import { HomePageSchemas } from '@/components/seo/json-ld';
import { ToolsSection } from '@/components/home/tools-section';
import { StatsBanner } from '@/components/home/stats-banner';
import { AnswerEngineSection } from '@/components/home/answer-engine-section';
import { AIContentSection } from '@/components/seo/ai-content';
// Static import: the FAQ is a server component using native <details>, so its
// Q&A text lands in the served HTML for answer engines (AEO). Keeping it
// dynamic would defer it past first paint and omit the text from the document.
import { FAQSection } from '@/components/home/faq-section';

import { HowItWorks } from '@/components/home/how-it-works';
import { TestimonialsSection } from '@/components/home/testimonials-section';
import { FeaturesSection } from '@/components/home/features-section';
import { GuidesSection } from '@/components/home/guides-section';
import { CTASection } from '@/components/home/cta-section';

import { Metadata } from 'next';
import { siteConfig, seoConfig } from '@/lib/seo-config';
import { getGeoLanguageAlternates } from '@/lib/seo';

export const metadata: Metadata = {
  title: `${siteConfig.name} - Free Online PDF & Image Tools`,
  description: seoConfig.description,
  alternates: {
    canonical: '/',
    // Locale cluster: x-default is the global homepage, geo hubs are the
    // locale-targeted equivalents. Required for regional ranking signals.
    languages: getGeoLanguageAlternates(),
  },
  openGraph: {
    title: `${siteConfig.name} - Free Online PDF & Image Tools`,
    description: seoConfig.description,
    url: siteConfig.url,
    type: 'website',
    siteName: siteConfig.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} - Free Online PDF & Image Tools`,
    description: seoConfig.description,
  },
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      
      <main id="main-content" className="flex-1">
        <HomePageSchemas />
        <ToolsSection />
        <StatsBanner />
        <HowItWorks />
        <AnswerEngineSection />
        <AIContentSection />
        <TestimonialsSection />
        <FeaturesSection />
        <GuidesSection />
        <FAQSection />
        <CTASection />
      </main>
    </div>
  );
}
