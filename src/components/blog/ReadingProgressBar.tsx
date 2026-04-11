'use client';

import { useEffect, useState } from 'react';

export function ReadingProgressBar() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const updateProgress = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (docHeight > 0) {
                setProgress(Math.min((scrollTop / docHeight) * 100, 100));
            }
        };

        window.addEventListener('scroll', updateProgress, { passive: true });
        return () => window.removeEventListener('scroll', updateProgress);
    }, []);

    return (
        <div
            className="fixed top-0 left-0 w-full h-[3px] z-[100]"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Reading progress"
        >
            <div
                className="h-full transition-all duration-150 ease-out"
                style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, var(--color-primary), #8b5cf6)',
                }}
            />
        </div>
    );
}
