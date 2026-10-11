import { allTools, allPdfTools, toolCategories } from '@/lib/tools-data';
import { geoRegions } from '@/lib/geo-data';
import { ADSENSE_REVIEW_MODE } from '@/lib/seo';
import { FooterClient } from './footer-client';

const toolLinkIds = ['compress', 'resize', 'remove-background', 'image-to-pdf', 'pdf-merge', 'pdf-split'];

/**
 * Server Component wrapper that pre-computes link data from the full
 * tools-data and geo-data modules, then passes only the minimal
 * {name, href}[] arrays to the client. This prevents ~106 KB of static
 * tool/geo JSON from being bundled into client JS on every page.
 */
export function Footer() {
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
      links: cat.tools.slice(0, 6).map((tool) => ({
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

  const totalToolCount = allTools.length;
  const pdfToolCount = allPdfTools.length;

  return (
    <FooterClient
      toolLinks={toolLinks}
      categoryColumns={categoryColumns}
      legalLinks={legalLinks}
      categoryLinks={categoryLinks}
      regionLinks={regionLinks}
      guideLinks={guideLinks}
      totalToolCount={totalToolCount}
      pdfToolCount={pdfToolCount}
      adsenseReviewMode={ADSENSE_REVIEW_MODE}
    />
  );
}
