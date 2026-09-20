import { NextResponse } from 'next/server';
import { getToolBySlug } from '@/lib/tools-data';
import { toolContentMap } from '@/lib/tool-content-data';
import { platformLimits } from '@/lib/limits';
import { absoluteUrl, SITE_URL } from '@/lib/seo';
import { normalizeDisplayText } from '@/lib/display-text';

export const runtime = 'nodejs';

/**
 * Machine-readable Markdown for a single tool page, e.g.
 * /tools/compress-pdf/markdown — for answer engines that prefer Markdown
 * over HTML scraping. Listed in /llms-full.txt.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) {
    return new NextResponse('Tool not found', { status: 404 });
  }

  const clean = (v: unknown) => normalizeDisplayText(String(v ?? ''));
  const url = absoluteUrl(`/tools/${tool.slug}`);
  const content = toolContentMap[tool.slug];
  const l = platformLimits;

  const lines: string[] = [];
  lines.push(`# ${clean(tool.name)} — Free Online (PdfPixels)`);
  lines.push('');
  lines.push(`> ${clean(tool.description)}`);
  lines.push('');
  lines.push(`Canonical URL: ${url}`);
  lines.push(`Processing: ${tool.processing === 'client' ? 'browser (client-side canvas)' : tool.processing === 'ai' ? 'AI server' : 'server'}${tool.isAI ? ' — AI-powered' : ''}`);
  lines.push(`Cost: free, no signup required for core use.`);
  lines.push('');
  if (content?.directAnswer) {
    lines.push(`## Short answer`);
    lines.push('');
    lines.push(clean(content.directAnswer));
    lines.push('');
  }
  lines.push(`## About`);
  lines.push('');
  lines.push(clean(content?.about ?? `${clean(tool.name)} is a free online tool by PdfPixels. No signup, no watermarks.`));
  lines.push('');
  if (content?.features?.length) {
    lines.push(`## Key features`);
    lines.push('');
    for (const f of content.features) lines.push(`- ${clean(f)}`);
    lines.push('');
  }
  if (content?.steps?.length) {
    lines.push(`## How to use`);
    lines.push('');
    content.steps.forEach((s, i) => lines.push(`${i + 1}. **${clean(s.title)}** — ${clean(s.description)}`));
    lines.push('');
  }
  if (content?.faqs?.length) {
    lines.push(`## FAQ`);
    lines.push('');
    for (const faq of content.faqs) {
      lines.push(`### ${clean(faq.question)}`);
      lines.push('');
      lines.push(clean(faq.answer));
      lines.push('');
    }
  }
  lines.push(`## Limits`);
  lines.push('');
  lines.push(`- PDF tools: ${l.pdf.maxFileMb} MB per file. Merge: ${l.pdf.merge.maxFiles} files / ${l.pdf.merge.maxTotalMb} MB total / ${l.pdf.merge.maxTotalPages} pages.`);
  lines.push(`- Image tools: ${l.image.maxFileMb} MB, ${l.image.maxMegapixels} MP max. AI tools: ${l.ai.maxFileMb} MB.`);
  lines.push(`- Rate limits: ${l.rateLimits.processingPerRoutePerMinute}/min per processing route per IP.`);
  lines.push(`- ${l.retention.serverTempFilesNote}`);
  lines.push('');
  lines.push(`More tools: ${SITE_URL}/tools — Full machine reference: ${SITE_URL}/llms-full.txt`);
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
