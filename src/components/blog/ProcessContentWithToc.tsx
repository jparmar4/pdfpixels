'use client';

import { useEffect, useRef } from 'react';
import { TableOfContents } from './TableOfContents';

/**
 * ProcessContentWithToc wraps the server-rendered article content and
 * injects IDs into h2 headings so the TableOfContents can link to them.
 */
interface ProcessContentWithTocProps {
    content: string;
    children: React.ReactNode;
}

export function ProcessContentWithToc({ content, children }: ProcessContentWithTocProps) {
    const articleRef = useRef<HTMLElement>(null);

    // Inject IDs into h2 headings
    useEffect(() => {
        if (!articleRef.current) return;
        const lines = content.split('\n');
        const headingTexts: string[] = [];
        lines.forEach((line) => {
            if (line.startsWith('## ')) {
                headingTexts.push(line.replace('## ', '').trim());
            }
        });

        const h2Elements = articleRef.current.querySelectorAll('h2');
        headingTexts.forEach((text, index) => {
            if (h2Elements[index]) {
                h2Elements[index].id = `section-${lines.findIndex((l) => l === `## ${text}`)}`;
            }
        });
    }, [content]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-12">
            <article ref={articleRef} itemScope itemType="https://schema.org/Article">
                {children}
            </article>
            <aside className="hidden lg:block">
                <div className="sticky top-24 bg-card/80 backdrop-blur-xl border border-border/60 rounded-2xl p-5 shadow-sm">
                    <TableOfContents content={content} />
                </div>
            </aside>
        </div>
    );
}
