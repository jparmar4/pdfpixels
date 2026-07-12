import Link from 'next/link';
import { FileQuestion, Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found - PdfPixels',
  description: 'The page you are looking for does not exist.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-8">
        <FileQuestion className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-6xl font-extrabold text-foreground mb-3">404</h1>
      <h2 className="text-2xl font-bold text-foreground mb-2">Page not found</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        The page you are looking for does not exist or has been moved.
        Try searching for the tool you need or head back to the homepage.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild className="gap-2">
          <Link href="/">
            <Home className="w-4 h-4" />
            Go home
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/tools">
            <Search className="w-4 h-4" />
            Browse tools
          </Link>
        </Button>
      </div>
    </div>
  );
}
