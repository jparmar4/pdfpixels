import { NextRequest, NextResponse } from 'next/server';
import { blogPosts, getBlogPostBySlug } from '@/config/blog';
import { faqData, organizationData } from '@/lib/seo-config';
import { allTools, getToolBySlug, toolCategories } from '@/lib/tools-data';
import { toolContentMap } from '@/lib/tool-content-data';
import { absoluteUrl, getHomepageFeaturedTools } from '@/lib/seo';
import { useCasePages } from '@/lib/use-cases';
import { comparisonPages } from '@/lib/comparisons';
import { geoRegions, getRegionByCode } from '@/lib/geo-data';

export const runtime = 'nodejs';

function buildHomepageMarkdown(): { markdown: string; canonical: string } {
  const indexableTools = allTools;
  const popularTools = getHomepageFeaturedTools();
  const canonical = absoluteUrl('/');

  const popularLines = popularTools
    .map(
      (t) =>
        `- [${t.name}](${absoluteUrl(`/tools/${t.slug}`)}): ${t.description} (${t.processing === 'client' ? 'In-browser WebAssembly' : 'Ephemeral cloud'})`
    )
    .join('\n');

  const categoryLines = toolCategories
    .map(
      (c) =>
        `- [${c.name}](${absoluteUrl(`/tools/category/${c.id}`)}): ${c.description} (${c.tools.length} tools)`
    )
    .join('\n');

  const regionLines = geoRegions
    .map((r) => `- [${r.name} (${r.locale})](${absoluteUrl(`/${r.code}`)}): ${r.headline}`)
    .join('\n');

  const comparisonLines = comparisonPages
    .slice(0, 12)
    .map((c) => `- [${c.title}](${absoluteUrl(`/compare/${c.slug}`)}): ${c.description}`)
    .join('\n');

  const faqLines = faqData
    .slice(0, 12)
    .map((f) => `### ${f.question}\n\n${f.answer}`)
    .join('\n\n');

  const markdown = `# PdfPixels — Free Online PDF & Image Tools

> PdfPixels is a free, zero-signup, watermark-free online PDF and image processing platform offering ${indexableTools.length}+ specialized tools across ${toolCategories.length} categories. Up to 80% of operations execute 100% locally in your browser via WebAssembly and HTML5 Canvas so confidential files never leave your device.

- **Canonical URL:** [${canonical}](${canonical})
- **Pricing:** Free ($0, no account required, no watermarks)
- **Organization:** ${organizationData.name} (${organizationData.email} | ${organizationData.telephone})
- **LLM Documentation:** [llms.txt](${absoluteUrl('/llms.txt')}) | [llms-full.txt](${absoluteUrl('/llms-full.txt')})
- **MCP Server Card:** [/.well-known/mcp/server-card.json](${absoluteUrl('/.well-known/mcp/server-card.json')})
- **MCP Endpoint:** [/api/mcp](${absoluteUrl('/api/mcp')})

## Popular PDF & Image Tools

${popularLines}

## Tool Categories

${categoryLines}

## High-Intent Software Comparisons

${comparisonLines}

## Tier 1 & Tier 2 Regional Hubs

${regionLines}

## Why PdfPixels?

1. **Client-Side Privacy First:** Browser-native WebAssembly engines (\`pdf-lib\`, \`pdfjs-dist\`, \`tesseract.js\`, HTML5 Canvas) process files locally on your device.
2. **Zero Watermarks & No Sign-Up:** Every PDF and image tool is completely free to use immediately without creating an account.
3. **Ephemeral Cloud Fallback:** Heavy office document conversions run in isolated memory over TLS 1.3 and are permanently purged immediately after processing.
4. **Agent & MCP Ready:** Built-in Model Context Protocol server (\`/api/mcp\`), WebMCP browser tools, and Markdown content negotiation (\`Accept: text/markdown\`).

## Frequently Asked Questions

${faqLines}

## Key Navigation Links

- [All Tools Directory](${absoluteUrl('/tools')})
- [PDF Tools Hub](${absoluteUrl('/pdf-tools')})
- [Industry Use Cases](${absoluteUrl('/use-cases')})
- [Tool Comparisons](${absoluteUrl('/compare')})
- [Workflow Guides & Blog](${absoluteUrl('/blog')})
- [2026 PDF Upload Size Limits Study](${absoluteUrl('/research/pdf-size-limits-2026')})
- [Security & Privacy Architecture](${absoluteUrl('/security')})
- [About PdfPixels](${absoluteUrl('/about')})
- [Contact Support](${absoluteUrl('/contact')})
`;

  return { markdown, canonical };
}

function buildPathMarkdown(rawPath: string): { markdown: string; canonical: string } | null {
  const path = rawPath.replace(/\/+$/, '') || '/';
  if (path === '/' || path === '/markdown') {
    return buildHomepageMarkdown();
  }

  if (path === '/tools' || path === '/pdf-tools') {
    const canonical = absoluteUrl(path);
    const sections = toolCategories
      .map((cat) => {
        const items = cat.tools
          .map((t) => `- [${t.name}](${absoluteUrl(`/tools/${t.slug}`)}): ${t.description}`)
          .join('\n');
        return `## ${cat.name}\n\n${cat.description}\n\n${items}`;
      })
      .join('\n\n');

    return {
      canonical,
      markdown: `# PdfPixels Tools Directory\n\n> Complete directory of free online PDF and image tools on PdfPixels.\n\nCanonical URL: ${canonical}\n\n${sections}\n`,
    };
  }

  if (path.startsWith('/tools/category/')) {
    const catId = path.replace('/tools/category/', '');
    const cat = toolCategories.find((c) => c.id === catId);
    if (!cat) return null;
    const canonical = absoluteUrl(path);
    const items = cat.tools
      .map((t) => `- [${t.name}](${absoluteUrl(`/tools/${t.slug}`)}): ${t.description}`)
      .join('\n');
    return {
      canonical,
      markdown: `# ${cat.name} — PdfPixels\n\n> ${cat.description}\n\nCanonical URL: ${canonical}\n\n## Tools in ${cat.name}\n\n${items}\n`,
    };
  }

  if (path.startsWith('/tools/')) {
    const slug = path.replace('/tools/', '').replace(/\/markdown$/, '');
    const tool = getToolBySlug(slug);
    if (!tool) return null;
    const canonical = absoluteUrl(`/tools/${tool.slug}`);
    const tc = toolContentMap[tool.slug];
    const steps = (tc?.steps || [])
      .map((s, i) => `${i + 1}. **${s.title}**: ${s.description}`)
      .join('\n');
    const faqs = (tc?.faqs || [])
      .map((f) => `### ${f.question}\n\n${f.answer}`)
      .join('\n\n');
    return {
      canonical,
      markdown: `# ${tool.name} — Free Online Tool | PdfPixels\n\n> ${tool.description}\n\n- **Canonical URL:** [${canonical}](${canonical})\n- **Processing Mode:** ${tool.processing === 'client' ? '100% Client-Side (in-browser)' : 'Ephemeral Server-Side'}\n\n## How to Use ${tool.name}\n\n${steps}\n\n${faqs ? `## Frequently Asked Questions\n\n${faqs}\n` : ''}`,
    };
  }

  if (path.startsWith('/blog/')) {
    const slug = path.replace('/blog/', '').replace(/\/markdown$/, '');
    const post = getBlogPostBySlug(slug);
    if (!post) return null;
    const canonical = absoluteUrl(`/blog/${post.slug}`);
    return {
      canonical,
      markdown: `# ${post.title}\n\n> ${post.metaDescription}\n\nCanonical URL: ${canonical}\n\n${post.content.trim()}\n`,
    };
  }

  if (path === '/blog') {
    const canonical = absoluteUrl('/blog');
    const list = blogPosts
      .map((p) => `- [${p.title}](${absoluteUrl(`/blog/${p.slug}`)}): ${p.metaDescription}`)
      .join('\n');
    return {
      canonical,
      markdown: `# PdfPixels Blog & Workflow Guides\n\n> Practical guides, portal size-limit references, and document tutorials.\n\nCanonical URL: ${canonical}\n\n## Articles\n\n${list}\n`,
    };
  }

  if (path.startsWith('/use-cases/')) {
    const slug = path.replace('/use-cases/', '');
    const uc = useCasePages.find((u) => u.slug === slug);
    if (!uc) return null;
    const canonical = absoluteUrl(`/use-cases/${uc.slug}`);
    return {
      canonical,
      markdown: `# ${uc.title}\n\n> ${uc.description}\n\nCanonical URL: ${canonical}\n\n${uc.overview}\n\n## Recommended Tool\n\n- [${uc.targetToolSlug}](${absoluteUrl(`/tools/${uc.targetToolSlug}`)})\n`,
    };
  }

  if (path === '/use-cases') {
    const canonical = absoluteUrl('/use-cases');
    const list = useCasePages
      .map((u) => `- [${u.title}](${absoluteUrl(`/use-cases/${u.slug}`)}): ${u.description}`)
      .join('\n');
    return {
      canonical,
      markdown: `# PdfPixels Industry & Role Use Cases\n\nCanonical URL: ${canonical}\n\n${list}\n`,
    };
  }

  if (path.startsWith('/compare/')) {
    const slug = path.replace('/compare/', '');
    const cmp = comparisonPages.find((c) => c.slug === slug);
    if (!cmp) return null;
    const canonical = absoluteUrl(`/compare/${cmp.slug}`);
    return {
      canonical,
      markdown: `# ${cmp.title}\n\n> ${cmp.description}\n\nCanonical URL: ${canonical}\n\n## Verdict\n\n${cmp.verdict}\n`,
    };
  }

  if (path === '/compare') {
    const canonical = absoluteUrl('/compare');
    const list = comparisonPages
      .map((c) => `- [${c.title}](${absoluteUrl(`/compare/${c.slug}`)}): ${c.description}`)
      .join('\n');
    return {
      canonical,
      markdown: `# PdfPixels Tool Comparisons\n\nCanonical URL: ${canonical}\n\n${list}\n`,
    };
  }

  // Regional hub pages (/[region])
  const regionCode = path.replace(/^\//, '').split('/')[0];
  const matchedRegion = path.split('/').filter(Boolean).length === 1 ? getRegionByCode(regionCode) : undefined;
  if (matchedRegion) {
    const canonical = absoluteUrl(`/${matchedRegion.code}`);
    const tasks = matchedRegion.commonTasks
      .map((t) => `- [${t.title}](${absoluteUrl(t.href)}): ${t.detail}`)
      .join('\n');
    const notes = matchedRegion.localNotes.map((n) => `- ${n}`).join('\n');
    const faqs = matchedRegion.faqs
      .map((f) => `### ${f.question}\n\n${f.answer}`)
      .join('\n\n');
    return {
      canonical,
      markdown: `# ${matchedRegion.headline}\n\n> ${matchedRegion.intro}\n\n- **Region:** ${matchedRegion.name} (\`${matchedRegion.locale}\`)\n- **Canonical URL:** [${canonical}](${canonical})\n\n## Popular Workflows in ${matchedRegion.name}\n\n${tasks}\n\n## Local Guidelines & Privacy\n\n${notes}\n\n## Frequently Asked Questions (${matchedRegion.name})\n\n${faqs}\n`,
    };
  }

  // Fallback to homepage overview with canonical reference
  const home = buildHomepageMarkdown();
  return {
    canonical: absoluteUrl(path),
    markdown: home.markdown,
  };
}

export async function GET(request: NextRequest) {
  const requestedPath = request.nextUrl.searchParams.get('path') || '/';
  const result = buildPathMarkdown(requestedPath);

  if (!result) {
    return new NextResponse('# 404 Not Found\n\nThe requested Markdown document could not be found.\n', {
      status: 404,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        Vary: 'Accept',
        'Content-Signal': 'search=yes, ai-input=yes, ai-train=no',
      },
    });
  }

  const estimatedTokens = Math.ceil(result.markdown.length / 4);

  return new NextResponse(result.markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      Vary: 'Accept',
      'Content-Signal': 'search=yes, ai-input=yes, ai-train=no',
      'X-Markdown-Tokens': String(estimatedTokens),
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      Link: `<${result.canonical}>; rel="canonical", <${absoluteUrl('/llms.txt')}>; rel="describedby"; type="text/plain"`,
    },
  });
}
