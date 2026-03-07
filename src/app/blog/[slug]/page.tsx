import { Metadata } from "next";
import { notFound } from "next/navigation";
import NextImage from "next/image";
import Link from "next/link";
import Script from "next/script";
import { getBlogPostBySlug, getRelatedPosts, getAllBlogPosts } from "@/config/blog";
import { siteConfig } from "@/lib/seo-config";
import { processContent } from "@/lib/content-processor";
import BlogSidebar from "@/components/blog/BlogSidebar";
import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { ArrowLeft, Clock, Calendar, ArrowRight } from "lucide-react";

// Generate static params
export function generateStaticParams() {
    const posts = getAllBlogPosts();
    return posts.map((post) => ({ slug: post.slug }));
}

// Generate metadata
export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const post = getBlogPostBySlug(slug);

    if (!post) {
        return { title: "Post Not Found" };
    }

    const isoDate = Number.isNaN(Date.parse(post.date)) ? post.date : new Date(post.date).toISOString();

    return {
        title: post.title,
        description: post.metaDescription,
        keywords: post.keywords,
        authors: [{ name: post.author }],
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
            title: post.title,
            description: post.metaDescription,
            type: "article",
            publishedTime: isoDate,
            modifiedTime: isoDate,
            authors: [post.author],
            section: post.category,
            tags: post.keywords,
            images: [
                {
                    url: `${siteConfig.url}${post.coverImage}`,
                    width: 1200,
                    height: 630,
                    alt: post.imageAlt || post.title,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: post.title,
            description: post.metaDescription,
            images: [`${siteConfig.url}${post.coverImage}`],
        },
        alternates: {
            canonical: `/blog/${slug}`,
        },
        other: {
            'article:author': post.author,
            'article:published_time': isoDate,
            'article:modified_time': isoDate,
            'article:section': post.category,
        },
    };
}

export default async function BlogPostPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const post = getBlogPostBySlug(slug);

    if (!post) {
        notFound();
    }

    const relatedPosts = getRelatedPosts(slug, 2);

    const isoDate = Number.isNaN(Date.parse(post.date)) ? post.date : new Date(post.date).toISOString();

    // Article Schema
    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.metaDescription,
        author: {
            "@type": "Person",
            name: post.author,
            jobTitle: post.authorRole,
        },
        publisher: {
            "@type": "Organization",
            name: "PdfPixels",
            url: siteConfig.url,
            logo: {
                "@type": "ImageObject",
                url: `${siteConfig.url}/logo.svg`,
            },
        },
        datePublished: isoDate,
        dateModified: isoDate,
        url: `${siteConfig.url}/blog/${slug}`,
        mainEntityOfPage: `${siteConfig.url}/blog/${slug}`,
        image: post.coverImage ? `${siteConfig.url}${post.coverImage}` : undefined,
        keywords: post.keywords.join(", "),
        articleSection: post.category,
        inLanguage: "en",
        wordCount: post.content.split(/\s+/).length,
    };

    // Breadcrumb Schema
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${siteConfig.url}/blog` },
            { "@type": "ListItem", position: 3, name: post.title, item: `${siteConfig.url}/blog/${slug}` },
        ],
    };

    // FAQ Schema
    const faqSchema = post.faq && post.faq.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: post.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
            },
        })),
    } : null;

    // Speakable Schema for voice search
    const speakableSchema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        speakable: {
            "@type": "SpeakableSpecification",
            cssSelector: ["h1", ".summary"],
        },
        url: `${siteConfig.url}/blog/${slug}`,
    };

    return (
        <>
            <Navigation />

            {/* JSON-LD Schemas */}
            <Script
                id="article-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
            />
            <Script
                id="breadcrumb-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <Script
                id="speakable-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(speakableSchema) }}
            />
            {faqSchema && (
                <Script
                    id="faq-schema"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
                />
            )}

            <div className="min-h-screen bg-background">
                {/* Header */}
                <header className="py-12 lg:py-20 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-card/50 backdrop-blur-3xl -z-10" />
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[100px] rounded-full -z-10" />

                    <div className="container mx-auto px-4 lg:px-8 relative z-10">
                        {/* Back Link */}
                        <Link
                            href="/blog"
                            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 group transition-colors font-medium text-sm"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Blog
                        </Link>

                        <div className="max-w-4xl mx-auto text-center">
                            {/* Category */}
                            <div className="mb-6 flex justify-center">
                                <span className="inline-block px-4 py-1.5 text-xs font-bold bg-primary/10 text-primary rounded-full tracking-wide uppercase">
                                    {post.category}
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight tracking-tight">
                                {post.title}
                            </h1>

                            <div className="summary text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
                                {post.metaDescription}
                            </div>

                            {/* Meta */}
                            <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground border-t border-border pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md">
                                        {post.author.charAt(0)}
                                    </div>
                                    <div className="text-left">
                                        <span className="block text-foreground font-bold text-sm">{post.author}</span>
                                        <span className="text-xs text-muted-foreground">{post.authorRole}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5 text-sm">
                                    <span className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-primary" />
                                        <time dateTime={isoDate}>{post.date}</time>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-primary" />
                                        {post.readTime}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="container mx-auto px-4 lg:px-8 py-12">
                    {/* 2-Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                        {/* Main Content Column */}
                        <div className="lg:col-span-2">
                            {/* Cover Image */}
                            {post.coverImage && (
                                <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-xl mb-10">
                                    <NextImage
                                        src={post.coverImage}
                                        alt={post.imageAlt || post.title}
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                </div>
                            )}

                            <article itemScope itemType="https://schema.org/Article">
                                {/* Article Content */}
                                <div className="prose prose-lg prose-slate dark:prose-invert max-w-none
                                    prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
                                    prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-3 prose-h2:border-b prose-h2:border-border
                                    prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                                    prose-p:text-muted-foreground prose-p:leading-relaxed
                                    prose-a:text-primary prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
                                    prose-strong:text-foreground prose-strong:font-bold
                                    prose-ul:my-6 prose-li:text-muted-foreground
                                    prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-1 prose-blockquote:rounded-r-lg
                                    prose-img:rounded-xl prose-img:shadow-md">
                                    {processContent(post.content)}
                                </div>

                                {/* Tags */}
                                {post.keywords && post.keywords.length > 0 && (
                                    <div className="mt-12 pt-8 border-t border-border">
                                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Topics</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {post.keywords.slice(0, 8).map((keyword, index) => (
                                                <span
                                                    key={index}
                                                    className="px-3 py-1.5 bg-muted text-muted-foreground rounded-full text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors cursor-default"
                                                >
                                                    {keyword}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* FAQ Section */}
                                {post.faq && post.faq.length > 0 && (
                                    <div className="mt-16 p-6 md:p-8 bg-muted/50 rounded-2xl border border-border">
                                        <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3">
                                            <span className="text-2xl">FAQ</span>
                                            Frequently Asked Questions
                                        </h2>
                                        <div className="space-y-5">
                                            {post.faq.map((item, index) => (
                                                <div key={index} className="bg-card rounded-xl p-5 shadow-sm border border-border">
                                                    <h3 className="font-bold text-base text-foreground mb-2">{item.question}</h3>
                                                    <p className="text-muted-foreground text-sm leading-relaxed">{item.answer}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </article>

                            {/* Related Posts */}
                            <div className="mt-16">
                                {relatedPosts.length > 0 && (
                                    <>
                                        <h2 className="text-2xl font-bold text-foreground mb-8">
                                            Keep Reading
                                        </h2>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            {relatedPosts.map((relatedPost) => (
                                                <Link key={relatedPost.slug} href={`/blog/${relatedPost.slug}`} className="group">
                                                    <article className="h-full bg-card rounded-2xl p-5 border border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md uppercase tracking-wide">
                                                            {relatedPost.category}
                                                        </span>
                                                        <h3 className="text-lg font-bold text-foreground mt-3 mb-2 group-hover:text-primary transition-colors leading-tight">
                                                            {relatedPost.title}
                                                        </h3>
                                                    </article>
                                                </Link>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Sidebar Column (Desktop) */}
                        <div className="hidden lg:block lg:col-span-1">
                            <BlogSidebar />
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <section className="py-20 bg-muted/30">
                    <div className="container mx-auto px-4 lg:px-8">
                        <div className="max-w-3xl mx-auto bg-card rounded-3xl p-8 md:p-12 text-center border border-border shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full -z-0 opacity-50" />

                            <div className="relative z-10">
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-5">
                                    Try It Yourself - Free
                                </h2>
                                <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                                    Put these tips into action with our free image and PDF tools. No sign-up needed, no watermarks.
                                </p>
                                <Link
                                    href="/"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 group"
                                >
                                    Explore Tools
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <Footer />
        </>
    );
}

