import { Metadata } from "next";
import { notFound } from "next/navigation";
import NextImage from "next/image";
import Link from "next/link";
import Script from "next/script";
import { getBlogPostBySlug, getRelatedPosts, getAllBlogPosts, getAdjacentPosts } from "@/config/blog";
import { siteConfig } from "@/lib/seo-config";
import { processContent } from "@/lib/content-processor";
import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { ReadingProgressBar } from "@/components/blog/ReadingProgressBar";
import { ProcessContentWithToc } from "@/components/blog/ProcessContentWithToc";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { ArticleNavigation } from "@/components/blog/ArticleNavigation";
import { ArrowLeft, Clock, Calendar, ArrowRight, User } from "lucide-react";

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
    const isoModifiedDate = post.dateModified
        ? (Number.isNaN(Date.parse(post.dateModified)) ? post.dateModified : new Date(post.dateModified).toISOString())
        : isoDate;

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
            modifiedTime: isoModifiedDate,
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
            'article:modified_time': isoModifiedDate,
            'article:section': post.category,
            'article:tag': post.keywords.slice(0, 6).join(','),
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

    const relatedPosts = getRelatedPosts(slug, 3);
    const { prev: prevPost, next: nextPost } = getAdjacentPosts(slug);

    const isoDate = Number.isNaN(Date.parse(post.date)) ? post.date : new Date(post.date).toISOString();
    const isoModifiedDate = post.dateModified
        ? (Number.isNaN(Date.parse(post.dateModified)) ? post.dateModified : new Date(post.dateModified).toISOString())
        : isoDate;
    const postUrl = `${siteConfig.url}/blog/${slug}`;

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
            url: `${siteConfig.url}/about`,
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
        dateModified: isoModifiedDate,
        url: `${siteConfig.url}/blog/${slug}`,
        mainEntityOfPage: `${siteConfig.url}/blog/${slug}`,
        image: post.coverImage ? `${siteConfig.url}${post.coverImage}` : undefined,
        keywords: post.keywords.join(", "),
        about: post.keywords.map(keyword => ({
            "@type": "Thing",
            name: keyword
        })),
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
            
            <ReadingProgressBar />

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

            <main id="main-content" className="min-h-screen bg-background">
                {/* Article Header */}
                <header className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
                    {/* Background decorations */}
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" />
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[100px] rounded-full -z-10" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-500/5 blur-[100px] rounded-full -z-10" />

                    <div className="container mx-auto px-4 lg:px-8 relative z-10">
                        {/* Back Link */}
                        <Link
                            href="/blog"
                            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 group transition-colors font-medium text-sm"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Blog
                        </Link>

                        <div className="max-w-4xl mx-auto">
                            {/* Category Badge with Gradient */}
                            <div className="mb-6 flex justify-center">
                                <span className="inline-block px-5 py-2 text-xs font-bold text-primary rounded-full tracking-widest uppercase border border-primary/20 shadow-sm"
                                    style={{ background: 'linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.08), rgba(139, 92, 246, 0.08))' }}
                                >
                                    {post.category}
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-6 leading-[1.1] tracking-tight text-center">
                                {post.title}
                            </h1>

                            <div className="summary text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8 text-center font-medium">
                                {post.metaDescription}
                            </div>

                            {/* Author, Meta, and Share Row */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-8 pt-8 border-t border-border">
                                {/* Author & Meta */}
                                <div className="flex flex-wrap items-center gap-5">
                                    {/* Author Avatar */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-primary-foreground font-bold text-base shadow-lg ring-2 ring-primary/20"
                                            style={{ background: 'linear-gradient(135deg, var(--color-primary), #8b5cf6)' }}
                                        >
                                            {post.author.charAt(0)}
                                        </div>
                                        <div className="text-left">
                                            <span className="block text-foreground font-bold text-sm">{post.author}</span>
                                            <span className="text-xs text-muted-foreground">{post.authorRole}</span>
                                        </div>
                                    </div>

                                    <div className="hidden sm:block h-8 w-px bg-border" />

                                    {/* Date & Reading Time */}
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4 text-primary" />
                                            <time dateTime={isoDate} className="font-medium">{post.date}</time>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4 text-primary" />
                                            <span className="font-medium">{post.readTime}</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Share Buttons */}
                                <ShareButtons url={postUrl} title={post.title} />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Cover Image */}
                {post.coverImage && (
                    <div className="container mx-auto px-4 lg:px-8">
                        <div className="max-w-5xl mx-auto">
                            <div className="relative w-full aspect-video rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5">
                                <NextImage
                                    src={post.coverImage}
                                    alt={post.imageAlt || post.title}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                                {/* Gradient overlay at bottom */}
                                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/20 to-transparent" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
                    <div className="max-w-5xl mx-auto">
                        <ProcessContentWithToc content={post.content}>
                            {/* Article Content */}
                            <div className="prose prose-lg prose-slate dark:prose-invert max-w-none
                                prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
                                prose-h2:text-2xl prose-h2:mt-14 prose-h2:mb-6 prose-h2:leading-tight
                                prose-h2:before:content-[''] prose-h2:before:block prose-h2:before:w-16 prose-h2:before:h-1 prose-h2:before:rounded-full prose-h2:before:mb-4
                                prose-h2:before:bg-gradient-to-r prose-h2:before:from-primary prose-h2:before:to-violet-500
                                prose-h3:text-xl prose-h3:mt-10 prose-h3:mb-4
                                prose-p:text-muted-foreground prose-p:leading-[1.85] prose-p:text-[1.08rem]
                                prose-a:text-primary prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
                                prose-strong:text-foreground prose-strong:font-bold
                                prose-ul:my-6 prose-ol:my-6
                                prose-li:text-muted-foreground prose-li:leading-relaxed
                                prose-li:before:bg-primary prose-li:before:text-primary
                                prose-blockquote:border-l-[3px] prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:not-italic
                                prose-blockquote:border-l-[4px]
                                prose-img:rounded-xl prose-img:shadow-lg
                                prose-pre:bg-slate-900 dark:prose-pre:bg-slate-950 prose-pre:rounded-xl prose-pre:shadow-lg
                                prose-code:text-primary-foreground prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:before:content-[''] prose-code:after:content-['']
                                prose-pre:prose-code:bg-transparent prose-pre:prose-code:px-0 prose-pre:prose-code:py-0">
                                {processContent(post.content)}
                            </div>

                            {/* Tags */}
                            {post.keywords && post.keywords.length > 0 && (
                                <div className="mt-16 pt-8 border-t border-border">
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
                        </ProcessContentWithToc>

                        {/* Article Navigation */}
                        <ArticleNavigation
                            prevPost={prevPost ? { slug: prevPost.slug, title: prevPost.title } : null}
                            nextPost={nextPost ? { slug: nextPost.slug, title: nextPost.title } : null}
                        />

                        {/* Related Articles */}
                        <div className="mt-20">
                            {relatedPosts.length > 0 && (
                                <>
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
                                        <h2 className="text-xl font-bold text-foreground whitespace-nowrap">Related Articles</h2>
                                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
                                    </div>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {relatedPosts.map((relatedPost) => (
                                            <Link key={relatedPost.slug} href={`/blog/${relatedPost.slug}`} className="group">
                                                <article className="h-full bg-card rounded-2xl overflow-hidden border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                                    {relatedPost.coverImage && (
                                                        <div className="relative aspect-[16/10] overflow-hidden">
                                                            <NextImage
                                                                src={relatedPost.coverImage}
                                                                alt={relatedPost.imageAlt || relatedPost.title}
                                                                fill
                                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                            />
                                                            <div className="absolute top-3 left-3">
                                                                <span className="inline-block px-3 py-1 text-[10px] font-bold bg-background/90 backdrop-blur-md text-foreground border border-border/50 rounded-full uppercase tracking-wider shadow-sm">
                                                                    {relatedPost.category}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="p-5">
                                                        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2 mb-2">
                                                            {relatedPost.title}
                                                        </h3>
                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <User className="w-3 h-3" />
                                                                {relatedPost.author}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {relatedPost.readTime}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </article>
                                            </Link>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <section className="py-20 bg-muted/30">
                    <div className="container mx-auto px-4 lg:px-8">
                        <div className="max-w-3xl mx-auto bg-card rounded-3xl p-8 md:p-12 text-center border border-border shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full -z-0 opacity-50" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/5 rounded-tr-full -z-0 opacity-50" />

                            <div className="relative z-10">
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-5">
                                    Try It Yourself — Free
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
            </main>

            
        </>
    );
}
