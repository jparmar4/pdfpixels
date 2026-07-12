import { NextResponse } from 'next/server';
import { getAllBlogPosts } from '@/config/blog';
import { absoluteUrl } from '@/lib/seo';

export async function GET() {
  const blogPosts = getAllBlogPosts();

  const images = blogPosts.map((post) => ({
    pageUrl: absoluteUrl(`/blog/${post.slug}`),
    imageUrl: absoluteUrl(post.coverImage),
    caption: post.imageAlt || post.title,
    title: post.title,
  }));

  // Also include the main OG image on the homepage
  images.unshift({
    pageUrl: absoluteUrl('/'),
    imageUrl: absoluteUrl('/opengraph-image'),
    caption: 'PdfPixels - Free online PDF and image tools',
    title: 'PdfPixels Homepage',
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${images.map((img) => `  <url>
    <loc>${img.pageUrl}</loc>
    <image:image>
      <image:loc>${img.imageUrl}</image:loc>
      <image:caption>${escapeXml(img.caption)}</image:caption>
      <image:title>${escapeXml(img.title)}</image:title>
    </image:image>
  </url>`).join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
