import Link from "next/link";
import NextImage from "next/image";
import { allTools } from "@/lib/tools-data";

// Map of keywords to tool URLs for auto-linking
const keywordMap: Record<string, string> = {};

// Populate from tools
allTools.forEach((tool) => {
    keywordMap[tool.name.toLowerCase()] = `/tools/${tool.slug}`;
});

// Manual keyword additions for common phrases
const manualKeywords: Record<string, string> = {
    "remove background": "/tools/remove-image-background",
    "background remover": "/tools/remove-image-background",
    "compress image": "/tools/compress-image",
    "image compressor": "/tools/compress-image",
    "resize image": "/tools/resize-image",
    "image resizer": "/tools/resize-image",
    "blur background": "/tools/blur-background",
    "passport photo": "/tools/passport-size-photo",
    "merge pdf": "/tools/merge-pdf",
    "split pdf": "/tools/split-pdf",
    "compress pdf": "/tools/compress-pdf",
    "heic to jpg": "/tools/heic-to-jpg",
    "png to jpeg": "/tools/png-to-jpeg",
    "jpeg to png": "/tools/jpeg-to-png",
    "webp to jpg": "/tools/webp-to-jpg",
    "image to pdf": "/tools/image-to-pdf",
    "pdf to jpg": "/tools/pdf-to-jpg",
    "dpi converter": "/tools/convert-dpi",
    "ocr": "/tools/image-to-text",
    "watermark": "/tools/watermark-image",
    "signature maker": "/tools/generate-signature",
    "upscale image": "/tools/upscale-image",
    "crop image": "/tools/crop-image",
};

Object.assign(keywordMap, manualKeywords);

type AlertType = 'NOTE' | 'TIP' | 'IMPORTANT' | 'WARNING' | 'CAUTION' | 'QUOTE';

export function processContent(content: string): React.ReactNode[] {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];

    let listItems: string[] = [];
    let listType: 'ul' | 'ol' | null = null;
    let blockquoteItems: string[] = [];
    let blockquoteType: AlertType | null = null;

    const linkedKeywords = new Set<string>();

    const flushList = (key: string) => {
        if (listItems.length > 0) {
            const ListTag = listType === 'ol' ? 'ol' : 'ul';
            elements.push(
                <ListTag key={key} className={`space-y-2 my-6 ${listType === 'ol' ? 'list-decimal' : 'list-disc'} pl-6 text-slate-700 dark:text-slate-300`}>
                    {listItems.map((item, i) => (
                        <li key={i} className="leading-relaxed pl-2">{parseInlineMarkdown(item, `li-${key}-${i}`, true)}</li>
                    ))}
                </ListTag>
            );
            listItems = [];
            listType = null;
        }
    };

    const flushBlockquote = (key: string) => {
        if (blockquoteItems.length > 0 && blockquoteType) {
            const blockContent = blockquoteItems.map((item, i) => (
                <p key={i} className={`leading-relaxed ${i > 0 ? 'mt-3' : ''}`}>
                    {parseInlineMarkdown(item, `bq-${key}-${i}`, true)}
                </p>
            ));

            if (blockquoteType === 'QUOTE') {
                elements.push(
                    <blockquote key={key} className="border-l-4 border-primary bg-primary/5 p-6 my-8 rounded-r-xl text-slate-700 dark:text-slate-300 italic shadow-sm">
                        {blockContent}
                    </blockquote>
                );
            } else {
                let styles = "";
                let title = "";

                switch (blockquoteType) {
                    case 'NOTE':
                        styles = "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-slate-700 dark:text-slate-300";
                        title = "📝 Note";
                        break;
                    case 'TIP':
                        styles = "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-slate-700 dark:text-slate-300";
                        title = "💡 Pro Tip";
                        break;
                    case 'IMPORTANT':
                        styles = "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-slate-700 dark:text-slate-300";
                        title = "⚡ Important";
                        break;
                    case 'WARNING':
                        styles = "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-slate-800 dark:text-slate-200";
                        title = "⚠️ Warning";
                        break;
                    case 'CAUTION':
                        styles = "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-slate-800 dark:text-slate-200";
                        title = "🚨 Caution";
                        break;
                }

                elements.push(
                    <div key={key} className={`p-6 my-8 rounded-xl border ${styles} shadow-sm`}>
                        <h4 className="font-bold text-sm uppercase tracking-wider opacity-90 mb-3 select-none">
                            {title}
                        </h4>
                        <div className="text-base">
                            {blockContent}
                        </div>
                    </div>
                );
            }

            blockquoteItems = [];
            blockquoteType = null;
        }
    };

    const parseInlineMarkdown = (text: string, keyPrefix: string, autoLink: boolean = false): React.ReactNode[] => {
        const pattern = /(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))|(!\[[^\]]*\]\([^)]+\))/g;
        const parts = text.split(pattern).filter((p) => p !== undefined && p !== '');
        const nodes: React.ReactNode[] = [];

        parts.forEach((part, i) => {
            const key = `${keyPrefix}-${i}`;

            // Image: ![alt](url)
            if (part.startsWith('![') && part.includes('](') && part.endsWith(')')) {
                const match = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
                if (match) {
                    const alt = match[1];
                    const src = match[2];
                    nodes.push(
                        <div key={key} className="my-10 relative rounded-2xl overflow-hidden shadow-xl">
                            <NextImage
                                src={src}
                                alt={alt}
                                width={800}
                                height={450}
                                className="w-full h-auto object-cover"
                            />
                            {alt && <p className="text-center text-sm text-muted-foreground mt-3 italic">{alt}</p>}
                        </div>
                    );
                    return;
                }
            }

            // Bold: **text**
            if (part.startsWith('**') && part.endsWith('**')) {
                const innerText = part.slice(2, -2);
                nodes.push(
                    <strong key={key} className="font-bold text-foreground">
                        {parseInlineMarkdown(innerText, `${key}-bold`, false)}
                    </strong>
                );
                return;
            }

            // Link: [label](url)
            if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
                const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
                if (match) {
                    const label = match[1];
                    const url = match[2];
                    const isInternal = url.startsWith('/');

                    if (isInternal) {
                        nodes.push(
                            <Link
                                key={key}
                                href={url}
                                className="text-primary hover:text-primary/80 font-medium underline underline-offset-2 transition-colors"
                            >
                                {label}
                            </Link>
                        );
                        return;
                    }

                    nodes.push(
                        <a
                            key={key}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 font-medium underline underline-offset-2 transition-colors"
                        >
                            {label}
                        </a>
                    );
                    return;
                }
            }

            // Plain text with auto-linking
            if (autoLink) {
                let textSegments: (string | React.ReactNode)[] = [part];

                for (const [keyword, url] of Object.entries(keywordMap)) {
                    if (linkedKeywords.has(keyword)) continue;

                    const newSegments: (string | React.ReactNode)[] = [];
                    let foundInThisBlock = false;

                    for (const segment of textSegments) {
                        if (typeof segment !== 'string') {
                            newSegments.push(segment);
                            continue;
                        }

                        const lowerSegment = segment.toLowerCase();
                        const idx = lowerSegment.indexOf(keyword.toLowerCase());

                        if (idx !== -1 && !foundInThisBlock) {
                            const before = segment.slice(0, idx);
                            const matched = segment.slice(idx, idx + keyword.length);
                            const after = segment.slice(idx + keyword.length);

                            if (before) newSegments.push(before);
                            newSegments.push(
                                <Link
                                    key={`${key}-${keyword}`}
                                    href={url}
                                    className="text-primary hover:text-primary/80 font-medium border-b border-dotted border-primary/40 hover:border-solid transition-all"
                                    title={`Try our ${keyword} tool`}
                                >
                                    {matched}
                                </Link>
                            );
                            if (after) newSegments.push(after);

                            linkedKeywords.add(keyword);
                            foundInThisBlock = true;
                        } else {
                            newSegments.push(segment);
                        }
                    }
                    textSegments = newSegments;
                }
                nodes.push(...textSegments);
            } else {
                nodes.push(part);
            }
        });

        return nodes;
    };

    // State for tables
    let tableLines: string[] = [];

    const flushTable = (key: string) => {
        if (tableLines.length > 0) {
            const tLines = tableLines.filter(l => l.trim().startsWith('|'));
            if (tLines.length < 2) {
                tableLines.forEach((line, i) => {
                    elements.push(
                        <p key={`${key}-fallback-${i}`} className="text-muted-foreground my-5 leading-8 text-[1.1rem]">
                            {parseInlineMarkdown(line, `${key}-p-${i}`, true)}
                        </p>
                    );
                });
            } else {
                const headerLine = tLines[0];
                const rowLines = tLines.slice(2);

                const headers = headerLine.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(h => h.trim());

                elements.push(
                    <div key={key} className="my-10 overflow-x-auto rounded-xl border border-border shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/50 border-b border-border">
                                    {headers.map((header, i) => (
                                        <th key={i} className="px-6 py-4 text-sm font-bold text-foreground uppercase tracking-wider">
                                            {parseInlineMarkdown(header, `th-${key}-${i}`, false)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {rowLines.map((row, i) => {
                                    const cells = row.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim());
                                    return (
                                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                                            {cells.map((cell, j) => (
                                                <td key={j} className="px-6 py-4 text-muted-foreground text-sm leading-relaxed">
                                                    {parseInlineMarkdown(cell, `td-${key}-${i}-${j}`, true)}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                );
            }
            tableLines = [];
        }
    };

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();

        // Empty line
        if (trimmedLine === '') {
            flushList(`list-${index}`);
            flushBlockquote(`quote-${index}`);
            flushTable(`table-${index}`);
            return;
        }

        // Table Detection
        if (trimmedLine.startsWith('|')) {
            flushList(`list-${index}`);
            flushBlockquote(`quote-${index}`);
            tableLines.push(trimmedLine);
            return;
        }

        if (!trimmedLine.startsWith('|')) {
            flushTable(`table-${index}`);
        }

        // Blockquotes/Alerts
        if (line.trim().startsWith('>')) {
            flushList(`list-${index}`);

            const alertMatch = trimmedLine.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);

            if (alertMatch) {
                flushBlockquote(`quote-prev-${index}`);
                blockquoteType = alertMatch[1].toUpperCase() as AlertType;
                return;
            }

            if (!blockquoteType) {
                blockquoteType = 'QUOTE';
            }

            const blockContent = trimmedLine.replace(/^>\s?/, '');
            if (blockContent) {
                blockquoteItems.push(blockContent);
            }
            return;
        }

        flushBlockquote(`quote-${index}`);

        // H2 heading
        if (trimmedLine.startsWith('## ')) {
            flushList(`list-${index}`);
            elements.push(
                <h2 key={index} className="text-2xl md:text-3xl font-bold text-foreground mt-14 mb-6 tracking-tight leading-tight">
                    {trimmedLine.replace('## ', '')}
                </h2>
            );
            return;
        }

        // H3 heading
        if (trimmedLine.startsWith('### ')) {
            flushList(`list-${index}`);
            elements.push(
                <h3 key={index} className="text-xl md:text-2xl font-bold text-foreground mt-10 mb-4 tracking-tight">
                    {trimmedLine.replace('### ', '')}
                </h3>
            );
            return;
        }

        // Unordered list item
        if (trimmedLine.startsWith('- ')) {
            listType = 'ul';
            listItems.push(trimmedLine.replace('- ', ''));
            return;
        }

        // Ordered list item
        if (/^\d+\.\s/.test(trimmedLine)) {
            listType = 'ol';
            listItems.push(trimmedLine.replace(/^\d+\.\s/, ''));
            return;
        }

        // Bold paragraph
        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
            flushList(`list-${index}`);
            elements.push(
                <p key={index} className="font-bold text-foreground text-lg my-6">
                    {parseInlineMarkdown(trimmedLine.replace(/\*\*/g, ''), `p-${index}`, false)}
                </p>
            );
            return;
        }

        // Regular paragraph
        flushList(`list-${index}`);

        // If line is exclusively an image, don't wrap in <p> to avoid hydration mismatch (<div> inside <p>)
        if (trimmedLine.startsWith('![') && trimmedLine.endsWith(')')) {
            elements.push(
                <div key={index}>
                    {parseInlineMarkdown(trimmedLine, `img-${index}`, false)}
                </div>
            );
        } else {
            elements.push(
                <p key={index} className="text-muted-foreground my-5 leading-8 text-[1.05rem]">
                    {parseInlineMarkdown(trimmedLine, `p-${index}`, true)}
                </p>
            );
        }
    });

    // Flush remaining items
    flushList('list-final');
    flushBlockquote('quote-final');
    flushTable('table-final');

    return elements;
}
