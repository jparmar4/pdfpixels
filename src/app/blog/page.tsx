import { Metadata } from "next";
import Link from "next/link";
import NextImage from "next/image";
import Script from "next/script";
import { getBlogPostsForListing } from "@/config/blog";
import { siteConfig } from "@/lib/seo-config";
import { allTools } from "@/lib/tools-data";
import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Clock, User, ArrowRight, BookOpen, Sparkles, CalendarDays } from "lucide-react";
import { AnimatedMeshBg } from "@/components/ui/animated-mesh-bg";
import { SpotlightCard } from "@/components/ui/spotlight-card";

export const metadata: Metadata = {
    title: "Blog - Image & PDF Tips, Guides & Tutorials | PdfPixels",
    description:
        "Expert guides on image editing, PDF tools, AI photo enhancement, background removal, and more. Free tutorials to help you master image and document processing in 2026.",
    keywords: [
        "image editing tips",
        "pdf tools guide",
        "ai background removal tutorial",
        "image compression guide",
        "photo editing blog",
        "pdf merge split guide",
        "free image tools blog",
    ],
    alternates: {
        canonical: "/blog",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
        },
    },
    openGraph: {
        title: "PdfPixels Blog - Image & PDF Tips, Guides & Tutorials",
        description:
            "Expert guides on image editing, PDF tools, AI photo enhancement, and more. Free tutorials for 2026.",
        type: "website",
        url: `${siteConfig.url}/blog`,
        images: [
            {
                url: `${siteConfig.url}/opengraph-image`,
                width: 1200,
                height: 630,
                alt: "PdfPixels Blog - Image & PDF Tips and Guides",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "PdfPixels Blog - Image & PDF Tips & Tutorials",
        description:
            "Expert guides on image editing, PDF tools, AI photo enhancement, and more.",
        images: [`${siteConfig.url}/opengraph-image`],
    },
};

export default function BlogPage() {
    const blogPosts = getBlogPostsForListing();
    const featuredPost = blogPosts[0];
    const otherPosts = blogPosts.slice(1);

    // CollectionPage JSON-LD schema
    const collectionSchema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "PdfPixels Blog",
        description: "Expert guides on image editing, PDF tools, AI photo enhancement, and more.",
        url: `${siteConfig.url}/blog`,
        mainEntity: {
            "@type": "ItemList",
            itemListElement: blogPosts.map((post, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `${siteConfig.url}/blog/${post.slug}`,
                name: post.title,
            })),
        },
    };

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${siteConfig.url}/blog` },
        ],
    };

    return (
        <>
            <Script
                id="collection-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(collectionSchema),
                }}
            />
            <Script
                id="breadcrumb-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(breadcrumbSchema),
                }}
            />

            <Navigation />

            <div className="min-h-screen bg-background">
                {/* Hero Section */}
                <section className="relative overflow-hidden border-b border-border/40 min-h-[40vh] flex flex-col justify-center">
                    <AnimatedMeshBg />

                    <div className="relative z-10 container mx-auto px-4 lg:px-8 py-20 md:py-28 text-center">
                        <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-[0.2em] mb-8 shadow-sm backdrop-blur-md">
                            <BookOpen className="w-3.5 h-3.5" />
                            Knowledge Hub
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-foreground mb-6 tracking-tight drop-shadow-sm">
                            The <span className="gradient-text">PdfPixels</span> Blog
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
                            Practical guides, expert tips, and in-depth tutorials to help you get the most from your images and PDFs. No fluff - just actionable knowledge.
                        </p>
                    </div>
                </section>

                {/* Featured Post */}
                {featuredPost && (
                    <section className="py-20 relative">
                        {/* Decorative Background Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

                        <div className="container mx-auto px-4 lg:px-8 relative z-10 max-w-6xl">
                            <div className="mb-10 flex items-center justify-center gap-4">
                                <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/50" />
                                <h2 className="text-sm font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    Latest Article
                                </h2>
                                <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/50" />
                            </div>

                            <Link href={`/blog/${featuredPost.slug}`} className="block group">
                                <SpotlightCard spotlightColor="rgba(99, 102, 241, 0.15)" className="p-2 sm:p-2 border border-border/60 bg-card/60 backdrop-blur-xl hover:border-primary/30 transition-all duration-300">
                                    <div className="grid lg:grid-cols-2 gap-0 lg:gap-8 items-center rounded-3xl overflow-hidden">

                                        {/* Cover Image Wrapper */}
                                        <div className="relative aspect-[16/10] lg:aspect-square w-full h-full overflow-hidden rounded-2xl sm:rounded-[22px]">
                                            {featuredPost.coverImage && (
                                                <NextImage
                                                    src={featuredPost.coverImage}
                                                    alt={featuredPost.imageAlt || featuredPost.title}
                                                    fill
                                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                                                    priority
                                                />
                                            )}
                                            {/* Inset Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        </div>

                                        {/* Content Wrapper */}
                                        <div className="p-8 lg:p-12 xl:p-16 flex flex-col justify-center h-full">
                                            <div className="flex items-center gap-3 mb-6 flex-wrap">
                                                <span className="inline-block px-3 py-1 text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 rounded-full uppercase tracking-widest shadow-sm">
                                                    {featuredPost.category}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                                    <CalendarDays className="w-3.5 h-3.5" />
                                                    {featuredPost.date}
                                                </span>
                                            </div>

                                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-6 group-hover:text-primary transition-colors leading-[1.1] tracking-tight">
                                                {featuredPost.title}
                                            </h2>

                                            <p className="text-muted-foreground mb-8 text-lg leading-relaxed line-clamp-3 font-medium">
                                                {featuredPost.excerpt}
                                            </p>

                                            <div className="mt-auto pt-8 border-t border-border/50 flex flex-wrap items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center text-white font-bold shadow-md">
                                                        {featuredPost.author.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-foreground">{featuredPost.author}</p>
                                                        <p className="text-xs text-muted-foreground">{featuredPost.authorRole}</p>
                                                    </div>
                                                </div>
                                                <span className="flex items-center gap-2 text-sm font-semibold text-primary group-hover:translate-x-1 transition-transform">
                                                    Read Article <ArrowRight className="w-4 h-4" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </SpotlightCard>
                            </Link>
                        </div>
                    </section>
                )}

                {/* Divider Line */}
                {otherPosts.length > 0 && (
                    <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
                        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent w-full" />
                    </div>
                )}

                {/* Other Posts Grid */}
                {otherPosts.length > 0 && (
                    <section className="py-24 bg-muted/10">
                        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
                            <div className="text-center mb-16">
                                <span className="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-[0.2em] px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-4">
                                    More Articles
                                </span>
                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mt-3 mb-4 tracking-tight">
                                    Latest <span className="gradient-text">Guides</span>
                                </h2>
                                <p className="text-muted-foreground max-w-lg mx-auto font-medium">
                                    Deep dives into image optimization, PDF workflows, and AI-powered editing.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                                {otherPosts.map((post) => (
                                    <Link key={post.slug} href={`/blog/${post.slug}`} className="group h-full block">
                                        <SpotlightCard className="h-full flex flex-col overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300">
                                            {post.coverImage && (
                                                <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl border-b border-border/50">
                                                    <NextImage
                                                        src={post.coverImage}
                                                        alt={post.imageAlt || post.title}
                                                        fill
                                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                        loading="lazy"
                                                        className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                                    />
                                                    <div className="absolute top-4 left-4">
                                                        <span className="inline-block px-3 py-1 text-[10px] font-bold bg-background/90 backdrop-blur-md text-foreground border border-border/50 rounded-full uppercase tracking-wider shadow-sm">
                                                            {post.category}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="p-6 md:p-8 flex flex-col flex-grow">
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 font-medium">
                                                    <span className="flex items-center gap-1.5">
                                                        <CalendarDays className="w-3.5 h-3.5" />
                                                        {post.date}
                                                    </span>
                                                    <span>ï¿½</span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {post.readTime}
                                                    </span>
                                                </div>

                                                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors leading-snug tracking-tight">
                                                    {post.title}
                                                </h3>

                                                <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-6 flex-grow font-medium">
                                                    {post.excerpt}
                                                </p>

                                                <div className="flex items-center gap-3 pt-6 border-t border-border/50 mt-auto">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center text-primary text-xs font-bold ring-1 ring-primary/20">
                                                        {post.author.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                                        {post.author}
                                                    </span>
                                                </div>
                                            </div>
                                        </SpotlightCard>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* CTA Section */}
                <section className="py-32 border-t border-border/50 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-primary/5 -z-10" />
                    <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

                    <div className="container mx-auto px-4 lg:px-8 text-center max-w-3xl">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-6 tracking-tight">
                            Ready to <span className="gradient-text">Get Started</span>?
                        </h2>
                        <p className="text-lg md:text-xl text-muted-foreground font-medium mb-10 mx-auto leading-relaxed">
                            Put these tips into action with our free suite of {allTools.length}+ image and PDF tools. No sign-ups required.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/"
                                className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl btn-premium font-bold text-base shadow-xl shadow-primary/20 transition-all hover:-translate-y-1"
                            >
                                Explore All Tools
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </section>
            </div>

            <Footer />
        </>
    );
}




