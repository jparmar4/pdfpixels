import { Metadata } from "next";
import Link from "next/link";
import NextImage from "next/image";
import { notFound } from "next/navigation";
import { getAllBlogCategories, getBlogPostsByCategory } from "@/config/blog";
import { siteConfig } from "@/lib/seo-config";
import { allTools } from "@/lib/tools-data";
import { Clock, ArrowRight, BookOpen, CalendarDays, FolderOpen } from "lucide-react";
import { AnimatedMeshBg } from "@/components/ui/animated-mesh-bg";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { HeaderAd, InContentAd, FooterAd, NativeAd } from "@/components/ads/ad-banner";

interface CategoryPageProps {
    params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
    return getAllBlogCategories().map((cat) => ({ slug: cat.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
    const { slug } = await params;
    const categories = getAllBlogCategories();
    const category = categories.find((cat) => cat.slug === slug);
    if (!category) return {};

    const title = `${category.name} Guides & Tutorials`;
    const description = `Expert ${category.name.toLowerCase()} guides from the PdfPixels team — ${category.postCount} in-depth ${category.postCount === 1 ? "tutorial" : "tutorials"} with tested workflows, step-by-step instructions, and free tools to get the job done.`;

    return {
        title,
        description,
        keywords: [`${category.name.toLowerCase()} guides`, `${category.name.toLowerCase()} tutorials`, "pdf tools blog", "free online tools"],
        alternates: {
            canonical: `/blog/category/${category.slug}`,
        },
        robots: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
            googleBot: {
                index: true,
                follow: true,
                "max-image-preview": "large",
                "max-snippet": -1,
                "max-video-preview": -1,
            },
        },
        openGraph: {
            title: `${title} | PdfPixels Blog`,
            description,
            type: "website",
            url: `${siteConfig.url}/blog/category/${category.slug}`,
            images: [
                {
                    url: `${siteConfig.url}/opengraph-image`,
                    width: 1200,
                    height: 630,
                    alt: `PdfPixels ${category.name} guides`,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: `${title} | PdfPixels`,
            description,
            images: [`${siteConfig.url}/opengraph-image`],
        },
    };
}

export default async function BlogCategoryPage({ params }: CategoryPageProps) {
    const { slug } = await params;
    const category = getAllBlogCategories().find((cat) => cat.slug === slug);
    if (!category) notFound();

    const posts = getBlogPostsByCategory(slug);
    const otherCategories = getAllBlogCategories().filter((cat) => cat.slug !== slug);

    const categoryUrl = `${siteConfig.url}/blog/category/${category.slug}`;

    const collectionSchema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${category.name} Guides & Tutorials`,
        description: `In-depth ${category.name.toLowerCase()} guides and tutorials from PdfPixels.`,
        url: categoryUrl,
        isPartOf: { "@type": "CollectionPage", name: "PdfPixels Blog", url: `${siteConfig.url}/blog` },
        mainEntity: {
            "@type": "ItemList",
            itemListElement: posts.map((post, i) => ({
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
            { "@type": "ListItem", position: 3, name: category.name, item: categoryUrl },
        ],
    };

    return (
        <>
            <script
                id="category-collection-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema).replace(/</g, '\\u003c') }}
            />
            <script
                id="category-breadcrumb-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema).replace(/</g, '\\u003c') }}
            />

            <main id="main-content" className="min-h-screen bg-background">
                {/* Hero Section */}
                <section className="relative overflow-hidden border-b border-border/40 min-h-[32vh] flex flex-col justify-center">
                    <AnimatedMeshBg />
                    <div className="relative z-10 container mx-auto px-4 lg:px-8 py-16 md:py-24 text-center">
                        <nav aria-label="Breadcrumb" className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium mb-6">
                            <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
                            <span aria-hidden="true">/</span>
                            <span className="text-foreground">{category.name}</span>
                        </nav>
                        <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-[0.2em] mb-8 shadow-sm backdrop-blur-md">
                            <FolderOpen className="w-3.5 h-3.5" />
                            {category.postCount} {category.postCount === 1 ? "Guide" : "Guides"}
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 tracking-tight drop-shadow-sm">
                            {category.name} <span className="gradient-text">Guides</span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
                            Every {category.name.toLowerCase()} guide we&apos;ve published — tested workflows, real numbers, and the free tools to do it yourself.
                        </p>
                    </div>
                </section>

                {/* Category navigation chips */}
                {otherCategories.length > 0 && (
                    <div className="container mx-auto px-4 lg:px-8 pt-8">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            {otherCategories.map((cat) => (
                                <Link
                                    key={cat.slug}
                                    href={`/blog/category/${cat.slug}`}
                                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-muted/60 text-muted-foreground border border-border/60 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-colors"
                                >
                                    {cat.name} ({cat.postCount})
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <HeaderAd className="my-8" />

                {/* Posts Grid */}
                <section className="py-12">
                    <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                            {posts.map((post) => (
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
                                                <span className="text-muted-foreground/40">•</span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {post.readTime}
                                                </span>
                                            </div>

                                            <h2 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors leading-snug tracking-tight">
                                                {post.title}
                                            </h2>

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

                        {/* All-posts escape hatch */}
                        <div className="text-center mt-16">
                            <Link
                                href="/blog"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                            >
                                <BookOpen className="w-4 h-4" />
                                Browse all blog guides
                            </Link>
                        </div>
                    </div>
                </section>

                <InContentAd variant="dual-rectangle" instanceId="blog-category-mid" className="my-8" />

                {/* Native Recommendation Ad */}
                <NativeAd className="my-12 max-w-5xl mx-auto px-4" />

                {/* CTA Section */}
                <section className="py-24 border-t border-border/50 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-primary/5 -z-10" />
                    <div className="container mx-auto px-4 lg:px-8 text-center max-w-3xl">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-6 tracking-tight">
                            Put these guides to <span className="gradient-text">work</span>
                        </h2>
                        <p className="text-lg text-muted-foreground font-medium mb-10 mx-auto leading-relaxed">
                            Try the free {allTools.length}+ browser-based PDF and image tools — no sign-up, no watermarks.
                        </p>
                        <Link
                            href="/"
                            className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl btn-premium font-bold text-base shadow-xl shadow-primary/20 transition-all hover:-translate-y-1"
                        >
                            Explore All Tools
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </section>

                <FooterAd />
            </main>
        </>
    );
}
