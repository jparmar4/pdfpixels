import { Metadata } from 'next';
import { GitCompareArrows, Zap, Shield, Clock } from 'lucide-react';
import { AnimatedMeshBg } from '@/components/ui/animated-mesh-bg';
import { comparisonPages } from '@/lib/comparisons';
import { CompareClient } from './CompareClient';
import Script from 'next/script';
import { collectionItemListJsonLd } from '@/app/jsonld-helpers';
import { SITE_URL, absoluteUrl, DEFAULT_OG_IMAGE_URL } from '@/lib/seo';
import { siteConfig } from '@/lib/seo-config';

export const metadata: Metadata = {
    title: 'Tool Comparisons & Guides | PdfPixels',
    description: 'Objective comparisons of PdfPixels with popular online tools for image and PDF workflows.',
    alternates: { canonical: '/compare' },
    openGraph: {
        title: 'Tool Comparisons & Guides | PdfPixels',
        description: 'Objective comparisons of PdfPixels with popular online tools for image and PDF workflows.',
        url: absoluteUrl('/compare'),
        siteName: siteConfig.name,
        type: 'website',
        locale: 'en_US',
        images: [
            {
                url: DEFAULT_OG_IMAGE_URL,
                width: 1200,
                height: 630,
                alt: 'PdfPixels Comparisons',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Tool Comparisons & Guides | PdfPixels',
        description: 'Objective comparisons of PdfPixels with popular online tools for image and PDF workflows.',
        images: [DEFAULT_OG_IMAGE_URL],
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function CompareIndexPage() {
    const items = comparisonPages.map((cmp) => ({
        url: `${SITE_URL}/compare/${cmp.slug}`,
        name: cmp.title,
    }));

    const jsonLd = collectionItemListJsonLd({
        baseUrl: `${SITE_URL}/compare`,
        title: `PdfPixels Comparisons`,
        description: `Objective comparisons of PdfPixels tools with popular alternatives for PDF and image workflows.`,
        items,
    });

    return (
        <>
            <Script
                id="compare-collection-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <main id="main-content" className="min-h-screen bg-background">
                {/* Hero Section */}
                <section className="relative overflow-hidden border-b border-border/40 min-h-[35vh] flex flex-col justify-center">
                    <AnimatedMeshBg />
                    <div className="relative z-10 container mx-auto px-4 lg:px-8 py-20 md:py-28 text-center">
                        <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-[0.2em] mb-8 shadow-sm backdrop-blur-md">
                            <GitCompareArrows className="w-3.5 h-3.5" />
                            Comparisons
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 tracking-tight drop-shadow-sm">
                            Compare <span className="gradient-text">Tools</span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
                            Use-case focused comparisons for practical tool decisions. These pages help you decide when PdfPixels is the better fit.
                        </p>

                        {/* Trust badges */}
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                            {[
                                { icon: Zap, label: 'Unbiased' },
                                { icon: Shield, label: 'Practical' },
                                { icon: Clock, label: 'Up to date' },
                            ].map(({ icon: Icon, label }) => (
                                <div key={label} className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground shadow-soft backdrop-blur-xl">
                                    <Icon className="w-3.5 h-3.5 text-primary" />
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Content */}
                <section className="py-12 lg:py-16">
                    <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
                        <CompareClient comparisons={comparisonPages} />
                    </div>
                </section>
            </main>
        </>
    );
}
