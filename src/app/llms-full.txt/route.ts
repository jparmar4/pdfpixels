import { NextResponse } from 'next/server';
import { blogPosts } from '@/config/blog';
import { allTools, toolCategories } from '@/lib/tools-data';
import { toolContentMap } from '@/lib/tool-content-data';
import { absoluteUrl } from '@/lib/seo';
import { useCasePages } from '@/lib/use-cases';
import { comparisonPages } from '@/lib/comparisons';
import { geoRegions } from '@/lib/geo-data';

export const dynamic = 'force-static';

export async function GET() {
  const indexableTools = allTools;

  const categoryDetailBlocks = toolCategories
    .map((category) => {
      const catTools = category.tools;
      if (catTools.length === 0) return '';

      const toolEntries = catTools
        .map((tool) => {
          const url = absoluteUrl(`/tools/${tool.slug}`);
          const mdUrl = absoluteUrl(`/tools/${tool.slug}/markdown`);
          const tc = toolContentMap[tool.slug];
          const mode =
            tool.processing === 'client'
              ? '100% Client-Side (in-browser WebAssembly / Canvas; files never leave device)'
              : 'Ephemeral Server-Side (processed in isolated memory; auto-deleted immediately after download)';
          const steps = tc?.steps?.length
            ? tc.steps.map((s, idx) => `  ${idx + 1}. **${s.title}**: ${s.description}`).join('\n')
            : '  1. Upload your file\n  2. Configure tool options\n  3. Process and download result';
          const faqs = tc?.faqs?.length
            ? tc.faqs
                .slice(0, 4)
                .map((f) => `  - **${f.question}** ${f.answer}`)
                .join('\n')
            : '';

          return [
            `### [${tool.name}](${url})`,
            `- **Tool URL:** [${url}](${url})`,
            `- **Markdown Spec:** [${mdUrl}](${mdUrl})`,
            `- **Category:** [${category.name}](${absoluteUrl(`/tools/category/${category.id}`)})`,
            `- **Summary:** ${tool.description}`,
            `- **Processing Mode:** ${mode}`,
            `- **How It Works:**\n${steps}`,
            faqs ? `- **FAQs:**\n${faqs}` : '',
          ]
            .filter(Boolean)
            .join('\n');
        })
        .join('\n\n');

      return `## Category: [${category.name}](${absoluteUrl(`/tools/category/${category.id}`)})\n\n${category.description}\n\n${toolEntries}`;
    })
    .filter(Boolean)
    .join('\n\n---\n\n');

  const useCaseBlocks = useCasePages.map((uc) => {
    const url = absoluteUrl(`/use-cases/${uc.slug}`);
    const faqs = uc.faqs
      .map((f) => `  - **${f.question}** ${f.answer}`)
      .join('\n');
    return [
      `### [${uc.title}](${url})`,
      `- **URL:** [${url}](${url})`,
      `- **Summary:** ${uc.description}`,
      `- **Recommended Tool:** [${uc.targetToolSlug}](${absoluteUrl(`/tools/${uc.targetToolSlug}`)})`,
      `- **FAQs:**\n${faqs}`,
    ].join('\n');
  }).join('\n\n');

  const comparisonBlocks = comparisonPages
    .map((cmp) => {
      const url = absoluteUrl(`/compare/${cmp.slug}`);
      return [
        `### [${cmp.title}](${url})`,
        `- **URL:** [${url}](${url})`,
        `- **Primary Tool:** [${cmp.primaryToolSlug}](${absoluteUrl(`/tools/${cmp.primaryToolSlug}`)})`,
        `- **Compared Against:** ${cmp.alternatives.join(', ')}`,
        `- **Summary:** ${cmp.description}`,
        `- **Verdict:** ${cmp.verdict}`,
      ].join('\n');
    })
    .join('\n\n');

  const regionBlocks = geoRegions
    .map((region) => {
      const url = absoluteUrl(`/${region.code}`);
      const tasks = region.commonTasks.map((t) => `  - **${t.title}**: ${t.detail}`).join('\n');
      return [
        `### [${region.name} (${region.locale})](${url})`,
        `- **URL:** [${url}](${url})`,
        `- **Headline:** ${region.headline}`,
        `- **Regional Focus:**\n${tasks}`,
      ].join('\n');
    })
    .join('\n\n');

  const blogBlocks = blogPosts
    .map((post) => {
      const url = absoluteUrl(`/blog/${post.slug}`);
      return [
        `### [${post.title}](${url})`,
        `- **URL:** [${url}](${url})`,
        `- **Published:** ${post.date}`,
        `- **Category:** ${post.category}`,
        `- **Summary:** ${post.metaDescription}`,
      ].join('\n');
    })
    .join('\n\n');

  const content = `# PdfPixels — Complete LLM & AI Agent Reference (llms-full.txt)

> Comprehensive machine-readable reference for PdfPixels (${absoluteUrl('/')}), a free, zero-signup, watermark-free online PDF and image processing platform offering ${indexableTools.length}+ specialized tools across ${toolCategories.length} categories.

## Key Platform Facts (Verifiable Citation Reference)

- **Canonical Website:** [PdfPixels](${absoluteUrl('/')})
- **Pricing:** [100% Free](${absoluteUrl('/pricing')}) — $0, no account or credit card required, no watermarks added to output files.
- **Privacy & Security Model:** [Zero-Retention Architecture](${absoluteUrl('/security')}) — ~80% of tools execute 100% locally inside the user's browser via WebAssembly (\`pdf-lib\`, \`pdfjs-dist\`, \`tesseract.js\`, HTML5 Canvas) where files never leave the device. Server-assisted conversions run in isolated ephemeral memory over TLS 1.3 and are purged immediately upon completion.
- **Supported Input Formats:** PDF, DOCX, XLSX, PPTX, HTML, TXT, Markdown, CSV, JSON, XML, EPUB, RTF, JPG/JPEG, PNG, WebP, AVIF, HEIC/HEIF, SVG, GIF, BMP, TIFF, ICO.
- **Supported Output Formats:** PDF, PDF/A, DOCX, XLSX, PPTX, TXT, CSV, JSON, HTML, Markdown, JPG, PNG, WebP, AVIF, SVG, GIF, TIFF, ICO, ZIP.
- **Summary Index:** [llms.txt](${absoluteUrl('/llms.txt')})
- **MCP Server Card:** [/.well-known/mcp/server-card.json](${absoluteUrl('/.well-known/mcp/server-card.json')})
- **MCP Endpoint:** [/api/mcp](${absoluteUrl('/api/mcp')})
- **OpenAPI Spec:** [/openapi.json](${absoluteUrl('/openapi.json')})

---

${categoryDetailBlocks}

---

## Industry & Role Use-Case Hubs

${useCaseBlocks}

---

## Software & Platform Comparisons

${comparisonBlocks}

---

## Tier 1 & Tier 2 Regional Hubs

${regionBlocks}

---

## Guides, Benchmarks & Technical Articles

${blogBlocks}
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Signal': 'search=yes, ai-input=yes, ai-train=no',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
