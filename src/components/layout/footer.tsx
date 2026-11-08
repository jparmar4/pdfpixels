import Link from 'next/link';
import { allTools, allPdfTools, toolCategories } from '@/lib/tools-data';
import { geoRegions } from '@/lib/geo-data';
import { ADSENSE_REVIEW_MODE } from '@/lib/seo';
import { FooterNewsletterForm } from './footer-client';

const toolLinkIds = ['compress', 'resize', 'remove-background', 'image-to-pdf', 'pdf-merge', 'pdf-split'];

export function Footer() {
  const currentYear = new Date().getFullYear();

  const toolLinks = [
    { name: `All PDF Tools (${allPdfTools.length})`, href: '/pdf-tools' },
    ...toolLinkIds
      .map((id) => allTools.find((tool) => tool.id === id))
      .filter((t): t is NonNullable<typeof t> => t != null)
      .map((tool) => ({
        name: tool.name,
        href: `/tools/${tool.slug}`,
      })),
  ];

  const categoryColumns = toolCategories
    .filter((cat) => cat.id !== 'most-used')
    .slice(0, 3)
    .map((cat) => ({
      title: cat.name,
      links: cat.tools.slice(0, 5).map((tool) => ({
        name: tool.name,
        href: `/tools/${tool.slug}`,
      })),
    }));

  const legalLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Brand & Press Kit', href: '/brand' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Guides & Blog', href: '/blog' },
    { name: 'Free Pricing', href: '/pricing' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Cookie Policy', href: '/privacy#cookies' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Disclaimer', href: '/disclaimer' },
    { name: 'DMCA Policy', href: '/dmca' },
    { name: 'API Docs', href: '/api-docs' },
  ];

  const categoryLinks = toolCategories.map((cat) => ({
    name: cat.name,
    href: `/tools/category/${cat.id}`,
  }));

  const regionLinks = ADSENSE_REVIEW_MODE
    ? []
    : geoRegions.map((region) => ({
        name: region.name,
        href: `/${region.code}`,
      }));

  const guideLinks = [
    ...(ADSENSE_REVIEW_MODE ? [] : [{ name: 'Compare tools', href: '/compare' }]),
    { name: 'Use-case guides', href: '/use-cases' },
    { name: 'PDF size limits research (2026)', href: '/research/pdf-size-limits-2026' },
    { name: 'Blog & tutorials', href: '/blog' },
  ];

  return (
    <footer className="relative mt-auto border-t border-border/40 bg-muted/15">
      {/* ── CTA Banner with Newsletter ── */}
      <div className="container mx-auto px-4 py-10 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card p-6 shadow-soft md:p-8">
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Premium web workflow
              </p>
              <p className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
                A faster front door for PDF and image workflows.
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                PdfPixels provides {allTools.length}+ tools designed for fast, privacy-friendly document and image processing directly in your browser without requiring an account.
              </p>
              <FooterNewsletterForm />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/pdf-tools" className="btn-premium inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold">
                Explore {allPdfTools.length} PDF Tools <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/tools"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border/60 bg-background/80 px-6 text-sm font-semibold text-foreground hover:border-primary/30 hover:text-primary"
              >
                All tools directory
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer Columns ── */}
      <div className="border-t border-border/30">
        <div className="container mx-auto px-4 py-12 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.3fr)_repeat(5,minmax(0,1fr))]">
            {/* Brand Column */}
            <div className="space-y-4 sm:col-span-2 lg:col-span-1">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 text-sm font-bold text-white shadow-sm">
                  PP
                </span>
                <div>
                  <p className="text-lg font-extrabold tracking-tight text-foreground">PdfPixels</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Professional suite</p>
                </div>
              </Link>

              <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                Modern PDF and image tooling for users who want dependable processing and a workflow that feels fast from upload to download.
              </p>

              <p className="text-xs text-muted-foreground">
                <a href="mailto:support@pdfpixels.com" className="hover:text-primary">support@pdfpixels.com</a>
                {' · '}
                <a href="tel:+917926580100" className="hover:text-primary">+91-79-2658-0100</a>
              </p>
            </div>

            <FooterColumn title="Popular tools" links={toolLinks} />

            {categoryColumns.map((col) => (
              <FooterColumn key={col.title} title={col.title} links={col.links} />
            ))}

            {!ADSENSE_REVIEW_MODE && regionLinks.length > 0 && (
              <FooterColumn title="Regions" links={regionLinks} />
            )}

            <FooterColumn title="Company & Legal" links={legalLinks} />
          </div>
        </div>

        {/* ── Category & Guide index ── */}
        <div className="border-t border-border/30">
          <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-3 text-xs text-muted-foreground lg:px-8">
            <span className="font-semibold uppercase tracking-wider">Categories:</span>
            {categoryLinks.map((link, i) => (
              <span key={link.href}>
                {i > 0 && <span aria-hidden="true" className="mr-2 text-border">·</span>}
                <Link href={link.href} className="hover:text-primary">
                  {link.name}
                </Link>
              </span>
            ))}
            <span aria-hidden="true" className="mx-1 text-border">|</span>
            {guideLinks.map((link, i) => (
              <span key={link.href}>
                {i > 0 && <span aria-hidden="true" className="mr-2 text-border">·</span>}
                <Link href={link.href} className="hover:text-primary">
                  {link.name}
                </Link>
              </span>
            ))}
          </div>
        </div>

        {/* ── Bottom Bar ── */}
        <div className="border-t border-border/30">
          <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row lg:px-8">
            <p>&copy; {currentYear} PdfPixels. All rights reserved.</p>
            <a href="#main-content" className="font-medium hover:text-primary">
              Back to top ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<{ name: string; href: string }> }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{title}</h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={`${title}-${link.href}`}>
            <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
