import { NextResponse } from 'next/server';
import { getAllBlogPosts } from '@/config/blog';
import { allTools } from '@/lib/tools-data';
import { absoluteUrl } from '@/lib/seo';

export async function GET() {
  const blogPosts = getAllBlogPosts();

  // Cover image first, then every local in-article markdown image (e.g. the
  // vertical Pinterest pins) so Google Images can discover them too.
  const images = blogPosts.flatMap((post) => {
    const pageUrl = absoluteUrl(`/blog/${post.slug}`);
    const seen = new Set<string>([post.coverImage]);
    const entries = [{
      pageUrl,
      imageUrl: absoluteUrl(post.coverImage),
      caption: post.imageAlt || post.title,
      title: post.title,
    }];
    for (const match of post.content.matchAll(/!\[([^\]]*)\]\((\/images\/[^)\s]+)\)/g)) {
      const [, alt, src] = match;
      if (seen.has(src)) continue;
      seen.add(src);
      entries.push({
        pageUrl,
        imageUrl: absoluteUrl(src),
        caption: alt || post.title,
        title: alt || post.title,
      });
    }
    return entries;
  });

  // Tool pages carry a dynamically generated OG image at /tools/{slug}/opengraph-image
  const toolImages = allTools.map((tool) => ({
    pageUrl: absoluteUrl(`/tools/${tool.slug}`),
    imageUrl: absoluteUrl(`/tools/${tool.slug}/opengraph-image`),
    caption: `${tool.name} — free online tool`,
    title: tool.name,
  }));

  // Also include the main OG image on the homepage
  images.unshift({
    pageUrl: absoluteUrl('/'),
    imageUrl: absoluteUrl('/opengraph-image'),
    caption: 'PdfPixels - Free online PDF and image tools',
    title: 'PdfPixels Homepage',
  });

  const allImages = [...images, ...toolImages];

  // One <url> per page with all of its <image:image> children (sitemap spec
  // expects unique <loc> values).
  const byPage = new Map<string, typeof allImages>();
  for (const img of allImages) {
    const list = byPage.get(img.pageUrl);
    if (list) list.push(img);
    else byPage.set(img.pageUrl, [img]);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${[...byPage.entries()].map(([pageUrl, imgs]) => `  <url>
    <loc>${escapeXml(pageUrl)}</loc>
${imgs.map((img) => `    <image:image>
      <image:loc>${escapeXml(img.imageUrl)}</image:loc>
      <image:caption>${escapeXml(img.caption)}</image:caption>
      <image:title>${escapeXml(img.title)}</image:title>
    </image:image>`).join('\n')}
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
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
