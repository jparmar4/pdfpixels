'use client';

import { useState, useCallback } from 'react';
import { Twitter, Linkedin, Link2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareButtonsProps {
    url: string;
    title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
    const [copied, setCopied] = useState(false);

    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [url]);

    const shares = [
        {
            label: 'Twitter',
            icon: Twitter,
            href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
            color: 'hover:bg-sky-500/10 hover:text-sky-500 hover:border-sky-500/30',
        },
        {
            label: 'LinkedIn',
            icon: Linkedin,
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            color: 'hover:bg-blue-600/10 hover:text-blue-600 hover:border-blue-600/30',
        },
    ];

    return (
        <div className="flex items-center gap-2">
            {shares.map(({ label, icon: Icon, href, color }) => (
                <motion.a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border/60 bg-background/80 text-muted-foreground transition-all duration-200 ${color}`}
                    aria-label={`Share on ${label}`}
                >
                    <Icon className="w-4 h-4" />
                </motion.a>
            ))}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border transition-all duration-200 ${
                    copied
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                        : 'border-border/60 bg-background/80 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30'
                }`}
                aria-label="Copy link"
            >
                <AnimatePresence mode="wait">
                    {copied ? (
                        <motion.span
                            key="check"
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 90 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Check className="w-4 h-4" />
                        </motion.span>
                    ) : (
                        <motion.span
                            key="link"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Link2 className="w-4 h-4" />
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
}
