'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompareArrows, ArrowRight, Check } from 'lucide-react';
import { getToolBySlug } from '@/lib/tools-data';
import type { ComparisonPage } from '@/lib/comparisons';
import { CategoryFilter } from '@/components/compare/CategoryFilter';

interface CompareClientProps {
    comparisons: ComparisonPage[];
}

export function CompareClient({ comparisons }: CompareClientProps) {
    const categories = useMemo(() => {
        const cats = new Set<string>();
        comparisons.forEach((c) => {
            const tool = getToolBySlug(c.primaryToolSlug);
            if (tool) cats.add(tool.category);
        });
        return Array.from(cats);
    }, [comparisons]);

    const [activeCategory, setActiveCategory] = useState('all');

    const filtered = useMemo(() => {
        if (activeCategory === 'all') return comparisons;
        return comparisons.filter((c) => {
            const tool = getToolBySlug(c.primaryToolSlug);
            return tool?.category === activeCategory;
        });
    }, [comparisons, activeCategory]);

    return (
        <>
            {/* Category Filter */}
            <div className="mb-10 flex justify-center">
                <CategoryFilter
                    categories={categories}
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                />
            </div>

            {/* Grid */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeCategory}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
                >
                    {filtered.map((item) => {
                        const tool = getToolBySlug(item.primaryToolSlug);
                        const ToolIcon = tool?.icon;
                        const altName = item.alternatives[0] || 'Competitor';

                        return (
                            <motion.div
                                key={item.slug}
                                whileHover={{ y: -4 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Link href={`/compare/${item.slug}`} className="block group h-full">
                                    <div className="h-full bg-card rounded-[1.75rem] border border-border/60 hover:border-primary/30 p-6 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/5">
                                        {/* Tool logos and VS badge */}
                                        <div className="flex items-center justify-center gap-4 mb-6">
                                            {/* PdfPixels icon */}
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground shadow-lg ring-2 ring-primary/10">
                                                {ToolIcon ? <ToolIcon className="w-7 h-7" /> : <GitCompareArrows className="w-7 h-7" />}
                                            </div>

                                            {/* VS Badge */}
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">VS</span>
                                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                                    <span className="text-xs font-extrabold text-foreground">VS</span>
                                                </div>
                                            </div>

                                            {/* Competitor icon */}
                                            <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground shadow-sm">
                                                <span className="text-xs font-bold text-center leading-tight px-1">{altName.length > 8 ? altName.slice(0, 8) : altName}</span>
                                            </div>
                                        </div>

                                        {/* Title & description */}
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-3">Comparison Guide</p>
                                        <h2 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors leading-snug">
                                            {item.title}
                                        </h2>
                                        <p className="text-sm leading-7 text-muted-foreground mb-6 line-clamp-2">
                                            {item.description}
                                        </p>

                                        {/* Key comparison points */}
                                        <div className="space-y-2 mb-6">
                                            {item.bestFor.slice(0, 3).map((point) => (
                                                <div key={point} className="flex items-start gap-2">
                                                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                                    <span className="text-xs text-muted-foreground leading-relaxed">{point}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* CTA */}
                                        <div className="flex items-center gap-2 text-sm font-bold text-primary group-hover:translate-x-1 transition-transform duration-200 pt-4 border-t border-border/50">
                                            Read Comparison
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </AnimatePresence>

            {filtered.length === 0 && (
                <div className="text-center py-16">
                    <p className="text-muted-foreground">No comparisons found for this category.</p>
                </div>
            )}
        </>
    );
}
