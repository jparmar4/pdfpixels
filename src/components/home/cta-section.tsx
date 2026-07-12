'use client';

import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { AnimatedCounter } from './animated-counter';

export function CTASection() {
  return (
    <section className="py-16 md:py-20 border-t border-border/50 relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="relative p-8 md:p-12 rounded-3xl overflow-hidden aurora-bg">
            <div className="noise-overlay absolute inset-0 pointer-events-none" />

            <div className="absolute inset-0 rounded-3xl p-[2px] overflow-hidden">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/30 via-fuchsia-500/20 to-cyan-500/30 animate-gradient-shift" style={{ backgroundSize: '300% 300%' }} />
            </div>

            <div className="absolute inset-[2px] rounded-3xl border border-primary/15" />

            <div className="absolute top-6 left-8 w-2 h-2 rounded-full bg-primary/30 animate-sparkle" />
            <div className="absolute bottom-8 right-12 w-1.5 h-1.5 rounded-full bg-fuchsia-400/30 animate-sparkle" style={{ animationDelay: '1s' }} />
            <div className="absolute top-12 right-8 w-1 h-1 rounded-full bg-cyan-400/30 animate-sparkle" style={{ animationDelay: '2s' }} />
            <div className="absolute bottom-12 left-10 w-1.5 h-1.5 rounded-full bg-emerald-400/25 animate-sparkle" style={{ animationDelay: '0.5s' }} />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
                <div className="flex -space-x-2">
                  <div className="avatar-ring bg-gradient-to-br from-violet-500 to-purple-600">S</div>
                  <div className="avatar-ring bg-gradient-to-br from-cyan-500 to-blue-600">J</div>
                  <div className="avatar-ring bg-gradient-to-br from-emerald-500 to-teal-600">E</div>
                  <div className="avatar-ring bg-gradient-to-br from-amber-500 to-orange-600">M</div>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  Join <span className="text-foreground"><AnimatedCounter end={1250} suffix="+" duration={2500} /></span> happy users
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-5">
                Ready to <span className="gradient-text">Get Started</span>?
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-10 text-lg">
                No signup. No installation. Just upload your file and go.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/tools/compress-image"
                  className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl btn-premium font-semibold text-sm relative z-10"
                >
                  <span className="relative z-10">Try Compress Image</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
                </Link>
                <Link
                  href="/tools/resize-image"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl glass-card font-semibold text-sm hover:border-primary/40 transition-all hover:shadow-premium"
                >
                  Resize Image
                </Link>
                <Link
                  href="/tools/remove-image-background"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/5 text-sm font-semibold text-fuchsia-600 dark:text-fuchsia-400 hover:bg-fuchsia-500/10 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Try AI Tools
                </Link>
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border/70 bg-background/50 text-sm font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
                >
                  <BookOpen className="w-4 h-4" />
                  Explore Blog
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
