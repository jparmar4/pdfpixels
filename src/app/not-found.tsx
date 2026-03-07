import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import { SitePageShell } from '@/components/layout/site-page-shell';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const popularTools = [
    { name: 'Compress Image', href: '/tools/compress-image' },
    { name: 'Resize Image', href: '/tools/resize-image' },
    { name: 'PNG to JPG', href: '/tools/png-to-jpeg' },
    { name: 'JPG to PNG', href: '/tools/jpeg-to-png' },
    { name: 'Merge PDF', href: '/tools/merge-pdf' },
    { name: 'Split PDF', href: '/tools/split-pdf' },
  ];

  return (
    <SitePageShell
      eyebrow="404"
      title="The page you requested is not available."
      description="The route may have moved, been removed, or never existed. Use one of the main entry points below to get back into the product quickly."
      iconName="sparkles"
      align="center"
      actions={[
        { label: 'Go to homepage', href: '/' },
        { label: 'Browse tools', href: '/', variant: 'outline' },
      ]}
      contentClassName="max-w-5xl"
    >
      <section className="section-panel rounded-[2rem] p-8 text-center md:p-10">
        <div className="gradient-text text-7xl font-extrabold tracking-tight md:text-8xl">404</div>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
          Popular tool links are listed below so users can recover from a dead end without restarting their whole session.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {popularTools.map((tool) => (
            <Link key={tool.name} href={tool.href} className="rounded-[1.35rem] border border-border/60 bg-background/75 px-4 py-4 text-sm font-semibold text-foreground transition-colors hover:border-primary/25 hover:text-primary">
              {tool.name}
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild className="btn-premium rounded-2xl px-6">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Homepage
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-2xl px-6">
            <Link href="/">
              <Search className="mr-2 h-4 w-4" />
              Search tools
            </Link>
          </Button>
        </div>
      </section>
    </SitePageShell>
  );
}
