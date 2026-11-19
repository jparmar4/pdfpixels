import { NextRequest, NextResponse } from 'next/server';
import { getAllBlogPosts, getBlogPostBySlug } from '@/config/blog';
import { faqData, organizationData } from '@/lib/seo-config';
import { allTools, getToolBySlug, toolCategories } from '@/lib/tools-data';
import { toolContentMap } from '@/lib/tool-content-data';
import { absoluteUrl, getHomepageFeaturedTools } from '@/lib/seo';
import { useCasePages } from '@/lib/use-cases';
import { comparisonPages } from '@/lib/comparisons';
import { geoRegions, getRegionByCode } from '@/lib/geo-data';
import { WORKFLOW_RECIPES } from '@/lib/workflow-recipes';
import { INDIAN_EXAM_PRESETS } from '@/lib/indian-exams-data';
import { getAllBlogCategories, getBlogPostsByCategory } from '@/config/blog';
import { templates, getTemplateBySlug } from '@/lib/templates';
import { glossaryTerms, getGlossaryTerm } from '@/lib/glossary';

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
- **Organization:** ${organizationData.name} (${organizationData.email})
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
- [Security & Privacy Architecture](${absoluteUrl('/privacy')})
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

  // Free templates (/templates and /templates/[slug])
  if (path === '/templates') {
    const canonical = absoluteUrl('/templates');
    const list = templates
      .map((t) => `- [${t.name}](${absoluteUrl(`/templates/${t.slug}`)}): ${t.description} — PDF: ${absoluteUrl(t.pdfPath)}`)
      .join('\n');
    return {
      canonical,
      markdown: `# Free PDF Templates\n\n> Downloadable invoice and resume templates — free, no signup, no watermark.\n\nCanonical URL: ${canonical}\n\n## Templates\n\n${list}\n`,
    };
  }

  if (path.startsWith('/templates/')) {
    const slug = path.replace('/templates/', '');
    const t = getTemplateBySlug(slug);
    if (!t) return null;
    const canonical = absoluteUrl(`/templates/${t.slug}`);
    const faqs = t.faqs.map((f) => `### ${f.question}\n\n${f.answer}`).join('\n\n');
    const steps = t.howToUse.map((s, i) => `${i + 1}. ${s}`).join('\n');
    return {
      canonical,
      markdown: `# ${t.name} — Free PDF Download\n\n> ${t.description}\n\n- **Canonical URL:** [${canonical}](${canonical})\n- **Download:** [${t.pdfPath}](${absoluteUrl(t.pdfPath)})\n\n## What's Inside\n\n${t.whatInside.map((w) => `- ${w}`).join('\n')}\n\n## How to Use\n\n${steps}\n\n## Frequently Asked Questions\n\n${faqs}\n`,
    };
  }

  // Glossary (/glossary and /glossary/[slug])
  if (path === '/glossary') {
    const canonical = absoluteUrl('/glossary');
    const list = glossaryTerms
      .map((t) => `- [${t.term}](${absoluteUrl(`/glossary/${t.slug}`)}): ${t.shortDef}`)
      .join('\n');
    return {
      canonical,
      markdown: `# PDF & Image Glossary\n\n> Plain-English definitions for PDF and image-processing terminology.\n\nCanonical URL: ${canonical}\n\n## Terms\n\n${list}\n`,
    };
  }

  if (path.startsWith('/glossary/')) {
    const slug = path.replace('/glossary/', '');
    const t = getGlossaryTerm(slug);
    if (!t) return null;
    const canonical = absoluteUrl(`/glossary/${t.slug}`);
    return {
      canonical,
      markdown: `# What Is ${t.term}?\n\n> ${t.shortDef}\n\nCanonical URL: ${canonical}\n\n${t.body.map((p) => `${p}\n`).join('\n')}\n- **Related tools:** ${t.relatedTools.join(', ')}\n- **Related terms:** ${t.relatedTerms.join(', ')}\n`,
    };
  }

  // Blog topic indexes (/blog/category/[slug]) — must be matched before the
  // generic /blog/ branch, which would otherwise treat 'category/x' as a slug.
  if (path.startsWith('/blog/category/')) {
    const catSlug = path.replace('/blog/category/', '');
    const cat = getAllBlogCategories().find((c) => c.slug === catSlug);
    if (!cat) return null;
    const canonical = absoluteUrl(`/blog/category/${cat.slug}`);
    const list = getBlogPostsByCategory(cat.slug)
      .map((p) => `- [${p.title}](${absoluteUrl(`/blog/${p.slug}`)}): ${p.metaDescription}`)
      .join('\n');
    return {
      canonical,
      markdown: `# ${cat.name} Guides & Tutorials — PdfPixels Blog\n\n> Every ${cat.name.toLowerCase()} guide published on PdfPixels, with tested workflows and free tools.\n\nCanonical URL: ${canonical}\n\n## Guides\n\n${list}\n`,
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
    const list = getAllBlogPosts()
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

  // Workflow pipelines (multi-tool chains run from a single upload)
  if (path === '/workflows') {
    const canonical = absoluteUrl('/workflows');
    const list = WORKFLOW_RECIPES
      .map((w) => `- [${w.title}](${absoluteUrl(`/workflows/${w.slug}`)}): ${w.description}`)
      .join('\n');
    return {
      canonical,
      markdown: `# PdfPixels Workflow Pipelines\n\n> One upload, chained tools: automated document pipelines that run multiple PdfPixels tools in sequence.\n\nCanonical URL: ${canonical}\n\n## Available Pipelines\n\n${list}\n`,
    };
  }

  if (path.startsWith('/workflows/')) {
    const slug = path.replace('/workflows/', '');
    const wf = WORKFLOW_RECIPES.find((w) => w.slug === slug);
    if (!wf) return null;
    const canonical = absoluteUrl(`/workflows/${wf.slug}`);
    const steps = wf.steps
      .map((s, i) => `${i + 1}. **${s.toolSlug}**: ${s.title}`)
      .join('\n');
    const highlights = wf.highlights.map((h) => `- ${h}`).join('\n');
    const faqs = wf.faqs.map((f) => `### ${f.question}\n\n${f.answer}`).join('\n\n');
    return {
      canonical,
      markdown: `# ${wf.title} — PdfPixels Workflow\n\n> ${wf.heroSummary}\n\n- **Canonical URL:** [${canonical}](${canonical})\n- **Accepts:** ${wf.accept}${wf.multiple ? ` (up to ${wf.maxFiles} files)` : ''}\n- **Output:** ${wf.outputLabel}\n\n## Pipeline Steps\n\n${steps}\n\n## Highlights\n\n${highlights}\n\n## Frequently Asked Questions\n\n${faqs}\n`,
    };
  }

  // Indian exam upload-spec pages (/in/[slug])
  if (path === '/in') {
    const canonical = absoluteUrl('/in');
    const list = INDIAN_EXAM_PRESETS
      .slice(0, 20)
      .map((e) => `- [${e.name} photo & signature size rules](${absoluteUrl(`/in/${e.slug}`)}): ${e.photoSpec.widthMm}×${e.photoSpec.heightMm} mm, ${e.photoSpec.minKb}–${e.photoSpec.maxKb} KB`)
      .join('\n');
    return {
      canonical,
      markdown: `# Indian Exam Photo & Signature Size Presets — PdfPixels\n\n> Exact photo and signature upload specifications for Indian government and competitive exams, with ready-to-use resize presets.\n\nCanonical URL: ${canonical}\n\n## Exams\n\n${list}\n`,
    };
  }

  if (path.startsWith('/in/')) {
    const slug = path.replace('/in/', '');
    const exam = INDIAN_EXAM_PRESETS.find((e) => e.slug === slug);
    if (!exam) return null;
    const canonical = absoluteUrl(`/in/${exam.slug}`);
    const p = exam.photoSpec;
    const photoSpec = `- **Photo size:** ${p.widthMm}×${p.heightMm} mm${p.widthPx && p.heightPx ? ` (${p.widthPx}×${p.heightPx} px)` : ''}\n- **File size:** ${p.minKb}–${p.maxKb} KB (recommended ${p.recommendedKb} KB)\n- **Resolution:** ${p.dpi} DPI\n- **Background:** ${p.background}${p.requiresNameAndDate ? '\n- **Name & date required:** yes' : ''}`;
    const rules = exam.rulesSummary.map((r) => `- ${r}`).join('\n');
    const faqs = exam.faqs.map((f) => `### ${f.question}\n\n${f.answer}`).join('\n\n');
    return {
      canonical,
      markdown: `# ${exam.name} — Photo & Signature Size Rules (${new Date().getFullYear()})\n\n> Exact photo and signature upload specifications for the ${exam.name}, conducted by ${exam.authority}.\n\n- **Canonical URL:** [${canonical}](${canonical})\n\n## Photo Specifications\n\n${photoSpec}\n\n## Key Rules\n\n${rules}\n\n## Frequently Asked Questions\n\n${faqs}\n`,
    };
  }

  // Research studies
  if (path === '/research/compression-benchmark-2026') {
    const canonical = absoluteUrl('/research/compression-benchmark-2026');
    return {
      canonical,
      markdown: `# JPEG Quality Benchmark 2026\n\n> 40 real web images re-compressed at JPEG qualities 95–50 and WebP 65–85 with the mozjpeg engine — exact byte counts and visual deltas.\n\nCanonical URL: ${canonical}\n\n## Key Data (average bytes per image)\n\n- JPEG 95: 170,654 bytes (master)\n- JPEG 90: 125,298 bytes (26.6% smaller)\n- JPEG 85: 99,830 bytes (41.5% smaller)\n- JPEG 80: 85,128 bytes (50.1% smaller)\n- JPEG 70: 64,413 bytes (62.2% smaller)\n- JPEG 60: 54,050 bytes (68.3% smaller)\n- JPEG 50: 46,906 bytes (72.5% smaller)\n- WebP 85: 71,283 bytes | WebP 75: 47,421 bytes | WebP 65: 42,266 bytes\n\n## Findings\n\n1. Quality 85 is the best single trade: 41.5% smaller with invisible pixel delta (<2/255).\n2. Quality 95→90 costs 26.6% of size for a 0.4 delta — pure waste.\n3. WebP 85 beats JPEG 80 by 16%; WebP 75 undercuts JPEG 70 by 26%.\n4. Below quality 70, degradation accelerates faster than savings.\n5. Target-size compression (iterate per image) beats guessing a fixed quality.\n\nMethodology: sharp 0.35 with mozjpeg over 40 real 1280px images; reproducible script in the repository.\n`,
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
