
import dynamic from 'next/dynamic';
import { HomePageSchemas } from '@/components/seo/json-ld';
import { ToolsSection } from '@/components/home/tools-section';
import { StatsBanner } from '@/components/home/stats-banner';
import { AnswerEngineSection } from '@/components/home/answer-engine-section';

// Below-fold sections load after first paint, mirroring src/app/[region]/page.tsx.
const HowItWorks = dynamic(() => import('@/components/home/how-it-works').then(m => m.HowItWorks), {
  loading: () => <div className="h-72 animate-pulse bg-muted/20 rounded-2xl mx-4" />,
});
const TestimonialsSection = dynamic(() => import('@/components/home/testimonials-section').then(m => m.TestimonialsSection), {
  loading: () => <div className="h-96 animate-pulse bg-muted/20 rounded-2xl mx-4" />,
});
const FeaturesSection = dynamic(() => import('@/components/home/features-section').then(m => m.FeaturesSection), {
  loading: () => <div className="h-80 animate-pulse bg-muted/20 rounded-2xl mx-4" />,
});
const GuidesSection = dynamic(() => import('@/components/home/guides-section').then(m => m.GuidesSection), {
  loading: () => <div className="h-80 animate-pulse bg-muted/20 rounded-2xl mx-4" />,
});
const FAQSection = dynamic(() => import('@/components/home/faq-section').then(m => m.FAQSection), {
  loading: () => <div className="h-64 animate-pulse bg-muted/20 rounded-2xl mx-4" />,
});
const CTASection = dynamic(() => import('@/components/home/cta-section').then(m => m.CTASection));

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
        <GuidesSection />
        <FAQSection />
        <CTASection />
      </main>
    </div>
  );
}
