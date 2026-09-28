'use client';

import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function CTASection() {
  return (
    <section className="py-16 md:py-20 border-t border-border/60 relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-950 px-6 py-12 text-center shadow-premium md:px-12 md:py-16">
            {/* Subtle decorative wash */}
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <div className="absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-indigo-500/25 blur-3xl" />
              <div className="absolute -bottom-32 right-0 h-56 w-72 rounded-full bg-violet-500/20 blur-3xl" />
            </div>

            <div className="relative z-10">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold text-indigo-100">
                Free · no signup · works in your browser
              </p>

              <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Ready to fix your file?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-base leading-7 text-indigo-200">
                Upload a file and get a clean result in seconds — no installation, no watermarks.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/tools/compress-pdf"
                  className="group inline-flex items-center gap-2.5 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-indigo-950 shadow-lg transition-transform hover:-translate-y-0.5"
                >
                  Compress a PDF
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                >
                  Browse all tools
                </Link>
                <Link
                  href="/tools/remove-image-background"
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-indigo-200 transition-colors hover:text-white"
                >
                  <Sparkles className="h-4 w-4" />
                  Try AI tools
                </Link>
              </div>

              <Link
                href="/blog"
                className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-indigo-300 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Guides &amp; tutorials on the blog
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
