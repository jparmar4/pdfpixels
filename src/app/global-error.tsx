'use client';

import { Inter } from 'next/font/google';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import '@/app/globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`}>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <div className="text-3xl font-bold text-destructive">!</div>
          </div>
          <h1 className="mb-4 text-3xl font-extrabold tracking-tight md:text-4xl">
            Critical System Error
          </h1>
          <p className="mb-8 max-w-[500px] text-muted-foreground">
            A critical error occurred. Please try refreshing the page. If the problem persists, please contact support.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => reset()} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Try again
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Go Home
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-12 max-w-2xl text-left">
              <h2 className="mb-2 text-lg font-bold">Error Details (Development Only):</h2>
              <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
                {error.message}
                {'\n\n'}
                {error.stack}
              </pre>
            </div>
          )}
        </div>
      </body>
    </html>
  );
}
