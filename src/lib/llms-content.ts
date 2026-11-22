import { getAllBlogPosts } from '@/config/blog';
import { allTools, toolCategories } from '@/lib/tools-data';
import { toolContentMap } from '@/lib/tool-content-data';
import { absoluteUrl, getHomepageFeaturedTools } from '@/lib/seo';
import { useCasePages } from '@/lib/use-cases';
import { comparisonPages } from '@/lib/comparisons';
import { geoRegions } from '@/lib/geo-data';
import { WORKFLOW_RECIPES } from '@/lib/workflow-recipes';
import { templates } from '@/lib/templates';
import { glossaryTerms } from '@/lib/glossary';
import { INDIAN_EXAM_PRESETS } from '@/lib/indian-exams-data';

export function buildLlmsTxt(): string {
  const indexableTools = allTools;
  const popularTools = getHomepageFeaturedTools();

  const popularSection = popularTools
    .map(
      (tool) =>
        `- [${tool.name}](${absoluteUrl(`/tools/${tool.slug}`)}): ${tool.description} (${tool.processing === 'client' ? '100% in-browser WebAssembly' : 'Ephemeral cloud processing'})`
    )
    .join('\n');

  const categorySection = toolCategories
    .map((category) => {
      const count = category.tools.length;
      return `- [${category.name}](${absoluteUrl(`/tools/category/${category.id}`)}): ${category.description} (${count} tools)`;
    })
    .join('\n');

  const allToolsByCategory = toolCategories
    .map((category) => {
      const catTools = category.tools;
      if (catTools.length === 0) return '';
      const lines = catTools
        .map((t) => `- [${t.name}](${absoluteUrl(`/tools/${t.slug}`)}): ${t.description}`)
        .join('\n');
      return `### ${category.name}\n\n${lines}`;
    })
    .filter(Boolean)
    .join('\n\n');

  const useCaseSection = useCasePages
    .slice(0, 20)
    .map((uc) => `- [${uc.title}](${absoluteUrl(`/use-cases/${uc.slug}`)}): ${uc.description}`)
    .join('\n');

  const comparisonSection = comparisonPages
    .map((cmp) => `- [${cmp.title}](${absoluteUrl(`/compare/${cmp.slug}`)}): ${cmp.description}`)
    .join('\n');

  const regionSection = geoRegions
    .map((region) => `- [${region.name} (${region.locale})](${absoluteUrl(`/${region.code}`)}): ${region.headline}`)
    .join('\n');

  const blogSection = getAllBlogPosts()
    .slice(0, 20)
    .map((post) => `- [${post.title}](${absoluteUrl(`/blog/${post.slug}`)}): ${post.metaDescription}`)
    .join('\n');

  const workflowSection = WORKFLOW_RECIPES.map(
    (recipe) =>
      `- [${recipe.title}](${absoluteUrl(`/workflows/${recipe.slug}`)}): ${recipe.steps.map((s) => s.title).join(' -> ')} — ${recipe.description}`,
  ).join('\n');

  return `# PdfPixels

> PdfPixels is a free, privacy-first online PDF and image processing platform offering ${indexableTools.length}+ specialized utilities including PDF compression, merging, splitting, OCR, digital signing, format conversion, and image optimization without watermarks, signups, or permanent file storage.

PdfPixels processes up to 80% of document and image operations locally inside the user's browser via WebAssembly and HTML5 Canvas so confidential files never leave the device. Tools requiring heavy rendering or conversion engines run in isolated ephemeral memory and are purged immediately after download.

## Key Pages

- [PdfPixels Home](${absoluteUrl('/')}): Main workspace with instant access to all free online PDF and image tools.
- [PDF Tools Hub](${absoluteUrl('/pdf-tools')}): Complete directory of PDF compression, merge, split, conversion, OCR, and security tools.
- [All Tools Directory](${absoluteUrl('/tools')}): Searchable catalog of all ${indexableTools.length}+ PDF and image utilities.
- [Multi-Step Workflow Recipes](${absoluteUrl('/workflows')}): Client-first 3-step and 4-step automated PDF and photo pipelines from a single upload.
- [Free PDF Templates](${absoluteUrl('/templates')}): Ready-to-download invoice and resume PDF templates with zero signup or watermarks.
- [PDF & Image Glossary](${absoluteUrl('/glossary')}): Plain-English reference covering 25 document and image engineering terms (PDF/A, OCR, Bates numbering, DPI, CMYK, EXIF).
- [Workflow Guides & Blog](${absoluteUrl('/blog')}): Step-by-step tutorials, portal file-size limit tables, and PDF technical guides.
- [Industry & Role Use Cases](${absoluteUrl('/use-cases')}): Curated PDF and image toolkits for legal, real estate, students, finance, and healthcare.
- [Tool Comparisons](${absoluteUrl('/compare')}): Side-by-side benchmarks comparing PdfPixels with Adobe Acrobat, Smallpdf, iLovePDF, and DocuSign.
- [2026 PDF Upload Size Limits Study](${absoluteUrl('/research/pdf-size-limits-2026')}): Empirical reference of file upload limits across 50+ government, court, and email portals.
- [JPEG Quality Benchmark 2026](${absoluteUrl('/research/compression-benchmark-2026')}): Empirical byte-size and pixel-delta benchmark across 40 real images (JPEG 95–50 and WebP 85–65).
- [API Documentation](${absoluteUrl('/api-docs')}): Developer documentation, OpenAPI specification, and MCP server integration guide.
- [MCP Integration Hub](${absoluteUrl('/mcp')}): Interactive MCP setup for Claude Desktop, Cursor, and Windsurf plus live JSON-RPC endpoint tester.
- [About PdfPixels](${absoluteUrl('/about')}): Architecture, privacy model, and company background.
- [Pricing](${absoluteUrl('/pricing')}) ([Markdown](${absoluteUrl('/pricing.md')})): Free forever model ($0) and feature overview.
- [Security & Privacy Architecture](${absoluteUrl('/privacy')}): Zero-retention policy, client-side WebAssembly execution, and encryption details.
- [Contact Support](${absoluteUrl('/contact')}): Customer support, bug reports, and business inquiries.

## Popular PDF & Image Tools

${popularSection}

## Tool Categories

${categorySection}

## All Tools by Category

${allToolsByCategory}

## Use Cases

${useCaseSection}

## Multi-Step Workflow Recipes

${workflowSection}

## High-Intent Software Comparisons

${comparisonSection}

## Regional & Country Hubs (Tier 1 & Tier 2)

${regionSection}

## Featured Guides & Research

${blogSection}

## Agent & Machine-Readable Endpoints

- [Full LLM Documentation (llms-full.txt)](${absoluteUrl('/llms-full.txt')}): Exhaustive Markdown reference covering every tool's input/output formats, processing mode, steps, and FAQs.
- [Pricing Markdown (pricing.md)](${absoluteUrl('/pricing.md')}): Concise agent-ready pricing and processing limits sheet.
- [Homepage Markdown Representation](${absoluteUrl('/markdown')}): Token-efficient Markdown version of the homepage (also served via \`Accept: text/markdown\`).
- [Interactive MCP & A2UI Hub](${absoluteUrl('/mcp')}): Copy-ready IDE configs, live Google A2UI v1.0 interactive surface renderer, and JSON-RPC tester for AI agent integration.
- [Google A2UI v1.0 Endpoint](${absoluteUrl('/api/a2ui')}): Declarative A2UI v1.0 Basic Catalog UI surface generator & client ActionMessage round-trip endpoint (\`application/a2ui+json\`).
- [A2A Agent Card](${absoluteUrl('/.well-known/agent.json')}): Agent-to-Agent discovery card advertising the \`https://a2ui.org/a2a-extension/a2ui/v1.0\` extension.
- [MCP Server Card](${absoluteUrl('/.well-known/mcp/server-card.json')}): Model Context Protocol (SEP-1649) server discovery metadata.
- [MCP Streamable-HTTP Endpoint](${absoluteUrl('/api/mcp')}): JSON-RPC 2.0 MCP endpoint exposing tool discovery, recommendations, A2UI v1.0 surfaces, and platform limits.
- [OpenAPI 3.1 Specification](${absoluteUrl('/openapi.json')}): Machine-readable REST API specification for PdfPixels endpoints.
- [API Catalog](${absoluteUrl('/.well-known/api-catalog')}): RFC 9727 Linkset API catalog for automated agent discovery.
- [XML Sitemap](${absoluteUrl('/sitemap.xml')}): Canonical URL inventory for search and answer engine crawlers.
`;
}

export function buildLlmsFullTxt(): string {
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

  const blogBlocks = getAllBlogPosts()
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

  const workflowBlocks = WORKFLOW_RECIPES.map((recipe) => {
    const url = absoluteUrl(`/workflows/${recipe.slug}`);
    const stepList = recipe.steps.map((s, idx) => `  ${idx + 1}. **${s.title}** (${s.execution}): ${s.subtitle}`).join('\n');
    return [
      `### [${recipe.title}](${url})`,
      `- **URL:** [${url}](${url})`,
      `- **Category:** ${recipe.category}`,
      `- **Summary:** ${recipe.description}`,
      `- **Pipeline Steps:**\n${stepList}`,
    ].join('\n');
  }).join('\n\n');

  const templateBlocks = templates
    .map((t) => `- [${t.name}](${absoluteUrl(`/templates/${t.slug}`)}): ${t.description}`)
    .join('\n');

  const glossaryBlocks = glossaryTerms
    .map((g) => `- [${g.term}](${absoluteUrl(`/glossary/${g.slug}`)}): ${g.shortDef}`)
    .join('\n');

  const examBlocks = INDIAN_EXAM_PRESETS.map(
    (e) =>
      `- [${e.name}](${absoluteUrl(`/in/${e.slug}`)}): ${e.photoSpec.widthMm}x${e.photoSpec.heightMm} mm, ${e.photoSpec.minKb}-${e.photoSpec.maxKb} KB (${e.authority})`,
  ).join('\n');

  return `# PdfPixels — Complete LLM & AI Agent Reference (llms-full.txt)

> Comprehensive machine-readable reference for PdfPixels (${absoluteUrl('/')}), a free, zero-signup, watermark-free online PDF and image processing platform offering ${indexableTools.length}+ specialized tools across ${toolCategories.length} categories.

## Key Platform Facts (Verifiable Citation Reference)

- **Canonical Website:** [PdfPixels](${absoluteUrl('/')})
- **Pricing:** [100% Free](${absoluteUrl('/pricing')}) ([pricing.md](${absoluteUrl('/pricing.md')})) — $0, no account or credit card required, no watermarks added to output files.
- **Privacy & Security Model:** [Zero-Retention Architecture](${absoluteUrl('/privacy')}) — ~80% of tools execute 100% locally inside the user's browser via WebAssembly (\`pdf-lib\`, \`pdfjs-dist\`, \`tesseract.js\`, HTML5 Canvas) where files never leave the device. Server-assisted conversions run in isolated ephemeral memory over TLS 1.3 and are purged immediately upon completion.
- **Supported Input Formats:** PDF, DOCX, XLSX, PPTX, HTML, TXT, Markdown, CSV, JSON, XML, EPUB, RTF, JPG/JPEG, PNG, WebP, AVIF, HEIC/HEIF, SVG, GIF, BMP, TIFF, ICO.
- **Supported Output Formats:** PDF, PDF/A, DOCX, XLSX, PPTX, TXT, CSV, JSON, HTML, Markdown, JPG, PNG, WebP, AVIF, SVG, GIF, TIFF, ICO, ZIP.
- **Summary Index:** [llms.txt](${absoluteUrl('/llms.txt')})
- **Interactive MCP & A2UI Hub:** [MCP & A2UI Hub](${absoluteUrl('/mcp')})
- **Google A2UI v1.0 Endpoint:** [/api/a2ui](${absoluteUrl('/api/a2ui')}) (\`application/a2ui+json\`)
- **A2A Agent Card:** [/.well-known/agent.json](${absoluteUrl('/.well-known/agent.json')})
- **MCP Server Card:** [/.well-known/mcp/server-card.json](${absoluteUrl('/.well-known/mcp/server-card.json')})
- **MCP Endpoint:** [/api/mcp](${absoluteUrl('/api/mcp')})
- **OpenAPI Spec:** [/openapi.json](${absoluteUrl('/openapi.json')})

## Original Research & Benchmarks

- [2026 PDF Upload Size Limits Study](${absoluteUrl('/research/pdf-size-limits-2026')}): Empirical catalog of upload limits across 50+ government, court, immigration, university, and email portals.
- [JPEG Quality Benchmark 2026](${absoluteUrl('/research/compression-benchmark-2026')}): Empirical file size and pixel-delta measurements across 40 real images (JPEG 95-50 and WebP 85-65).

---

${categoryDetailBlocks}

---

## Multi-Step Workflow Recipes (${absoluteUrl('/workflows')})

${workflowBlocks}

---

## Free Downloadable PDF Templates (${absoluteUrl('/templates')})

${templateBlocks}

---

## PDF & Image Glossary (${absoluteUrl('/glossary')})

${glossaryBlocks}

---

## Indian Exam Photo & Signature Presets (${absoluteUrl('/in')})

${examBlocks}

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
}
