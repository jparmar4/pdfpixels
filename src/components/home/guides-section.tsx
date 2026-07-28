import Link from 'next/link';
import { ArrowRight, BookOpen, Clock } from 'lucide-react';
import { getAllBlogPosts } from '@/config/blog';

/**
 * Surfaces real long-form guides on the homepage so AdSense reviewers
 * see substantial original content beyond tool UI chrome.
 */
export function GuidesSection() {
  const posts = getAllBlogPosts().slice(0, 6);

  if (posts.length === 0) return null;

  return (
    <section
      className="border-t border-border/50 bg-background py-16 md:py-20"
      aria-labelledby="guides-heading"
    >
      <div className="container mx-auto max-w-6xl px-4 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Guides & learning
            </span>
            <h2
              id="guides-heading"
              className="mt-4 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl"
            >
              In-depth articles, not filler
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
              Step-by-step explainers for PDF size limits, HEIC conversion, email attachments, and
              free editing workflows — written for real tasks.
            </p>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-4"
          >
            Browse all guides
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="flex h-full flex-col rounded-2xl border border-border/60 bg-card/80 p-5 shadow-soft transition-all hover:border-primary/25 hover:shadow-premium"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                {post.category}
              </div>
              <h3 className="mt-3 text-base font-bold leading-6 text-foreground">
                <Link href={`/blog/${post.slug}`} className="hover:text-primary">
                  {post.title}
                </Link>
              </h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground line-clamp-3">
                {post.excerpt}
              </p>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {post.readTime}
                </span>
                <Link
                  href={`/blog/${post.slug}`}
                  className="font-semibold text-primary hover:underline underline-offset-4"
                >
                  Read guide
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
