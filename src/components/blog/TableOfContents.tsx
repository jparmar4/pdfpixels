'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface TocItem {
    id: string;
    text: string;
}

interface TableOfContentsProps {
    content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
    const [activeId, setActiveId] = useState<string>('');

    const headings = useMemo<TocItem[]>(() => {
        const lines = content.split('\n');
        const items: TocItem[] = [];
        lines.forEach((line, index) => {
            if (line.startsWith('## ')) {
                const text = line.replace('## ', '').trim();
                const id = `section-${index}`;
                items.push({ id, text });
            }
        });
        return items;
    }, [content]);

    useEffect(() => {
        if (headings.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visibleEntries = entries.filter((e) => e.isIntersecting);
                if (visibleEntries.length > 0) {
                    const topEntry = visibleEntries.reduce((closest, entry) => {
                        return entry.boundingClientRect.top < closest.boundingClientRect.top
                            ? entry
                            : closest;
                    });
                    setActiveId(topEntry.target.id);
                }
            },
            {
                rootMargin: '-80px 0px -60% 0px',
                threshold: 0,
            }
        );

        headings.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [headings]);

    if (headings.length === 0) return null;

    return (
        <nav aria-label="Table of contents" className="space-y-1">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-4 px-3">
                On this page
            </h3>
            {headings.map(({ id, text }) => (
                <a
                    key={id}
                    href={`#${id}`}
                    onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById(id);
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }}
                    className={`group flex items-start gap-2.5 px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:bg-muted/60 ${
                        activeId === id
                            ? 'text-foreground font-semibold bg-primary/5 border-l-2 border-primary pl-[10px] -ml-px'
                            : 'text-muted-foreground font-medium pl-[12px] -ml-px border-l-2 border-transparent hover:border-border'
                    }`}
                >
                    <ChevronRight
                        className={`w-3.5 h-3.5 mt-0.5 shrink-0 transition-transform duration-200 ${
                            activeId === id ? 'text-primary' : 'text-muted-foreground/50 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0'
                        }`}
                    />
                    <span className="leading-snug line-clamp-2">{text}</span>
                </a>
            ))}
        </nav>
    );
}
