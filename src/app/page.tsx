
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
  },
  openGraph: {
    title: `${siteConfig.name} - Free Online PDF & Image Tools`,
    description: seoConfig.description,
    url: '/',
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
