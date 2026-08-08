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
