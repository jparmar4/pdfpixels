'use client';

import { useState, useEffect } from 'react';

const words = [
  'Compress PDF',
  'Merge PDF',
  'Remove Background',
  'Resize Image',
  'Convert HEIC to JPG',
  'Split PDF',
  'Compress Image',
  'Image to PDF',
];

export function TypingText() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState(words[0]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[currentIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting && displayText === currentWord) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayText === '') {
      timeout = setTimeout(() => {
        setIsDeleting(false);
        setCurrentIndex((prev) => (prev + 1) % words.length);
      }, 300);
    } else {
      timeout = setTimeout(() => {
        setDisplayText(
          isDeleting
            ? currentWord.substring(0, displayText.length - 1)
            : currentWord.substring(0, displayText.length + 1)
        );
      }, isDeleting ? 40 : 80);
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentIndex]);

  return (
    <span className="gradient-text inline-block min-w-[200px] md:min-w-[320px] text-left">
      {displayText || '\u00A0'}
      <span className="inline-block w-[3px] h-[0.85em] bg-primary ml-0.5 align-middle animate-pulse" />
    </span>
  );
}
