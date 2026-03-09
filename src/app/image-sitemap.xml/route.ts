import { NextResponse } from 'next/server';
import { getAllBlogPosts } from '@/config/blog';
import { absoluteUrl } from '@/lib/seo';

export function GET() {
  const blogPosts = getAllBlogPosts().filter((post) => Boolean(post.coverImage));

  const urls = [
    {
      loc: absoluteUrl('/'),
      imageLoc: absoluteUrl('/opengraph-image'),
      title: 'PdfPixels',
      caption: 'Free online PDF and image tools',
    },
    ...blogPosts.map((post) => ({
      loc: absoluteUrl(`/blog/${post.slug}`),
      imageLoc: absoluteUrl(post.coverImage),
      title: post.title,
      caption: post.metaDescription,
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls
  .map(
    (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <image:image>
      <image:loc>${escapeXml(entry.imageLoc)}</image:loc>
      <image:title>${escapeXml(entry.title)}</image:title>
      <image:caption>${escapeXml(entry.caption)}</image:caption>
    </image:image>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
