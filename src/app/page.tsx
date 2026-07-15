
import { HomePageSchemas } from '@/components/seo/json-ld';
import { ToolsSection } from '@/components/home/tools-section';
import { StatsBanner } from '@/components/home/stats-banner';
import { AnswerEngineSection } from '@/components/home/answer-engine-section';

import { HowItWorks } from '@/components/home/how-it-works';
import { TestimonialsSection } from '@/components/home/testimonials-section';
import { FeaturesSection } from '@/components/home/features-section';
import { FAQSection } from '@/components/home/faq-section';
import { CTASection } from '@/components/home/cta-section';
import { ScrollToTop } from '@/components/home/scroll-to-top';

import { Metadata } from 'next';
import { siteConfig, seoConfig } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: `${siteConfig.name} - Free Online PDF & Image Tools`,
  description: seoConfig.description,
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/us',
      'en-GB': '/uk',
      'en-CA': '/ca',
      'en-AU': '/au',
      'en-IN': '/in',
      'x-default': '/',
    },
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
        <TestimonialsSection />
        <FeaturesSection />
        <FAQSection />
        <CTASection />
      </main>

            <ScrollToTop />
    </div>
  );
}
