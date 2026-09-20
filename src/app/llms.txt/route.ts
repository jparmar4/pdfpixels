import { NextResponse } from 'next/server';
import { allTools, toolCategories } from '@/lib/tools-data';
import { comparisonPages } from '@/lib/comparisons';
import { useCasePages } from '@/lib/use-cases';
import { getAllBlogPosts } from '@/config/blog';
import { normalizeDisplayText } from '@/lib/display-text';
import { limitsSummaryLines, LIMITS_LAST_REVIEWED } from '@/lib/limits';
import { SITE_URL } from '@/lib/seo';

export const runtime = 'nodejs';

const clean = (value: unknown) => normalizeDisplayText(String(value ?? ''));

function processingLabel(tool: (typeof allTools)[number]): string {
  if (tool.processing === 'client') return 'browser';
  if (tool.processing === 'ai') return 'AI server';
  return 'server';
}

export async function GET() {
  const lines: string[] = [];
  lines.push('# PdfPixels');
  lines.push('');
  lines.push('> Free online PDF and image tools: compress, merge, split, convert, resize, edit, and AI-enhance. No signup required for core workflows.');
  lines.push('');
  lines.push('## About');
  lines.push('');
  lines.push(`PdfPixels (${SITE_URL}) runs ${allTools.length} free browser and server workflows for everyday PDF and image jobs: compress a PDF for email, merge or split documents, convert formats, resize photos, remove backgrounds, and more.`);
  lines.push('');
  lines.push('## Popular tools');
  lines.push('');
  for (const tool of allTools.filter((t) => t.popular).slice(0, 12)) {
    lines.push(`- ${clean(tool.name)}: ${SITE_URL}/tools/${tool.slug} — ${clean(tool.description)}`);
  }
  lines.push('');
  lines.push('## All tools by category');
  lines.push('');
  for (const category of toolCategories) {
    lines.push(`### ${clean(category.name)} — ${SITE_URL}/tools/category/${category.id}`);
    lines.push('');
    for (const tool of category.tools) {
      const flags = [
        tool.isAI ? 'AI' : null,
        tool.popular ? 'popular' : null,
        processingLabel(tool),
      ].filter(Boolean).join(', ');
      lines.push(`- ${clean(tool.name)} (${flags}): ${SITE_URL}/tools/${tool.slug} — ${clean(tool.description)}`);
    }
    lines.push('');
  }
  lines.push('## Comparisons');
  lines.push('');
  for (const page of comparisonPages) {
    lines.push(`- ${clean(page.title)}: ${SITE_URL}/compare/${page.slug} — ${clean(page.description)}`);
  }
  lines.push('');
  lines.push('## Use cases');
  lines.push('');
  for (const page of useCasePages.slice(0, 30)) {
    lines.push(`- ${clean(page.title)}: ${SITE_URL}/use-cases/${page.slug} — ${clean(page.description)}`);
  }
  lines.push('');
  lines.push('## Guides');
  lines.push('');
  for (const post of getAllBlogPosts().slice(0, 15)) {
    lines.push(`- ${clean(post.title)}: ${SITE_URL}/blog/${post.slug}`);
  }
  lines.push(`- All guides: ${SITE_URL}/blog`);
  lines.push('');
  lines.push('## Limits (fair use)');
  lines.push('');
  lines.push(`_Verified against production code on ${LIMITS_LAST_REVIEWED}._`);
  lines.push('');
  for (const line of limitsSummaryLines()) {
    lines.push(`- ${line}`);
  }
  lines.push('');
  lines.push('## Machine references');
  lines.push('');
  lines.push(`- Full reference: ${SITE_URL}/llms-full.txt`);
  lines.push(`- Sitemaps: ${SITE_URL}/sitemap.xml , ${SITE_URL}/image-sitemap.xml`);
  lines.push(`- RSS: ${SITE_URL}/feed`);
  lines.push(`- API docs: ${SITE_URL}/api-docs`);
  lines.push(`- Contact: ${SITE_URL}/contact — Privacy: ${SITE_URL}/privacy — Terms: ${SITE_URL}/terms`);
  lines.push('');

  return new NextResponse(lines.join('\n'), {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
