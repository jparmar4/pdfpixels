import { NextResponse } from 'next/server';
import { getBlogPostBySlug } from '@/config/blog';
import { SITE_URL } from '@/lib/seo';

export const runtime = 'nodejs';

/**
 * Machine-readable Markdown for a single blog guide, e.g.
 * /blog/merge-pdf-online-free/markdown — for answer engines that prefer
 * Markdown over HTML scraping. Listed in /llms-full.txt.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) {
    return new NextResponse('Guide not found', { status: 404 });
  }

  const url = `${SITE_URL}/blog/${post.slug}`;
  const lines: string[] = [];
  lines.push(`# ${post.title}`);
  lines.push('');
  lines.push(`> ${post.metaDescription}`);
  lines.push('');
  lines.push(`Canonical URL: ${url}`);
  lines.push(`Author: ${post.author} (${post.authorRole}) | Published: ${post.date}${post.dateModified ? ` | Updated: ${post.dateModified}` : ''} | Reading time: ${post.readTime}`);
  lines.push('');
  lines.push(post.content.trim());
  lines.push('');
  if (post.faq?.length) {
    lines.push(`## FAQ`);
    lines.push('');
    for (const faq of post.faq) {
      lines.push(`### ${faq.question}`);
      lines.push('');
      lines.push(faq.answer);
      lines.push('');
    }
  }
  lines.push(`All guides: ${SITE_URL}/blog — Full machine reference: ${SITE_URL}/llms-full.txt`);
  lines.push('');

  return new NextResponse(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=604800',
      Link: `<${url}>; rel="canonical"`,
    },
  });
}
