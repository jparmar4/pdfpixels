'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface ArticleNavigationProps {
    prevPost: { slug: string; title: string } | null;
    nextPost: { slug: string; title: string } | null;
}

export function ArticleNavigation({ prevPost, nextPost }: ArticleNavigationProps) {
    if (!prevPost && !nextPost) return null;

    return (
        <nav aria-label="Article navigation" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-16 pt-8 border-t border-border">
            {prevPost ? (
                <motion.div whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                    <Link
                        href={`/blog/${prevPost.slug}`}
                        className="group flex flex-col gap-2 p-5 rounded-2xl border border-border/60 bg-card/50 hover:bg-card hover:border-primary/20 transition-all duration-300"
                    >
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Previous Article
                        </span>
                        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                            {prevPost.title}
                        </span>
                    </Link>
                </motion.div>
            ) : (
                <div />
            )}
            {nextPost ? (
                <motion.div whileHover={{ x: -4 }} transition={{ duration: 0.2 }}>
                    <Link
                        href={`/blog/${nextPost.slug}`}
                        className="group flex flex-col gap-2 p-5 rounded-2xl border border-border/60 bg-card/50 hover:bg-card hover:border-primary/20 transition-all duration-300 sm:text-right"
                    >
                        <span className="flex items-center justify-end gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Next Article
                            <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                            {nextPost.title}
                        </span>
                    </Link>
                </motion.div>
            ) : (
                <div />
            )}
        </nav>
    );
}
