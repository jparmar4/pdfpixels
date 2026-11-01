'use client';

import { useEffect, useRef } from 'react';

/**
 * Wraps server-rendered article content and injects IDs into h2 headings
 * for deep links / accessibility. Full-width layout (no sidebar) so readers
 * get more space for the article body.
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
            const trimmed = line.trim();
            if (trimmed.startsWith('## ')) {
                headingTexts.push(trimmed.replace('## ', '').trim());
            } else {
                const htmlMatch = trimmed.match(/^<h2[^>]*>(.*?)<\/h2>$/i);
                if (htmlMatch) {
                    headingTexts.push(htmlMatch[1].replace(/<[^>]+>/g, '').trim());
                }
            }
        });

        const h2Elements = articleRef.current.querySelectorAll('h2');
        headingTexts.forEach((text, index) => {
            if (h2Elements[index]) {
                const idx = lines.findIndex((l) => {
                    const tr = l.trim();
                    return tr === `## ${text}` || tr.includes(text);
                });
                h2Elements[index].id = `section-${idx !== -1 ? idx : index}`;
            }
        });
    }, [content]);

    return (
        <article
            ref={articleRef}
            itemScope
            itemType="https://schema.org/Article"
            className="w-full max-w-none"
        >
            {children}
        </article>
    );
}
