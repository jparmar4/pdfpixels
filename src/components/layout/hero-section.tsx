'use client';

import { motion } from 'framer-motion';
import { Sparkles, Zap, Shield, Image as ImageIcon } from 'lucide-react';

const features = [
    { icon: Zap, text: 'Lightning Fast' },
    { icon: Shield, text: '100% Private' },
    { icon: ImageIcon, text: 'High Quality Output' },
];

export function HeroSection({
    search,
    setSearch
}: {
    search: string;
    setSearch: (s: string) => void;
}) {
    return (
        <section className="relative overflow-hidden pt-24 pb-16 lg:pt-32 lg:pb-24 mesh-gradient">
            {/* Background Orbs */}
            <div
                className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none"
                style={{ animation: 'orbFloat1 20s ease-in-out infinite' }}
            />
            <div
                className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none"
                style={{ animation: 'orbFloat2 25s ease-in-out infinite reverse' }}
            />

            <div className="container relative mx-auto px-4 text-center z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 animate-border-glow hover:bg-primary/15 transition-colors cursor-default"
                >
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>Premium Open-Source PDF & Image Tools</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto drop-shadow-sm"
                >
                    Your All-In-One Toolkit for <br className="hidden md:block" />
                    <span className="text-shimmer">Pixels & PDFs</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
                >
                    Compress, convert, edit, and optimize your files instantly right from your browser. No sign-up. No limits. Super fast.
                </motion.p>

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="relative max-w-2xl mx-auto mb-12"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-violet-500/30 blur-xl opacity-40 rounded-2xl" />
                    <div className="relative flex items-center bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl p-2 shadow-premium hover:shadow-primary transition-all duration-500 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary/50">
                        <svg className="w-6 h-6 text-muted-foreground ml-3 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search 55+ tools — compress, resize, merge PDF, blur..."
                            aria-label="Search tools"
                            className="w-full bg-transparent border-none text-base font-medium placeholder:text-muted-foreground/60 focus:outline-none py-3 h-12"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} aria-label="Clear search" className="mr-3 text-muted-foreground hover:text-foreground transition-colors p-1 bg-muted rounded-full">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                        <button type="button" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 h-12 rounded-xl font-medium transition-colors hidden sm:flex items-center cursor-pointer shadow-sm">
                            Search
                        </button>
                    </div>
                </motion.div>

                {/* Feature Badges */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="flex flex-wrap justify-center gap-4 text-sm font-medium text-muted-foreground"
                >
                    {features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 bg-muted/40 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50 shadow-sm transition-all hover:bg-muted/80 hover:text-foreground">
                            <feature.icon className="w-4 h-4 text-primary" />
                            {feature.text}
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
