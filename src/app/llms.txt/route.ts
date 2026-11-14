import { NextResponse } from 'next/server';
import { blogPosts } from '@/config/blog';
import { allTools, toolCategories } from '@/lib/tools-data';
import { absoluteUrl, getHomepageFeaturedTools } from '@/lib/seo';
import { useCasePages } from '@/lib/use-cases';
import { comparisonPages } from '@/lib/comparisons';
import { geoRegions } from '@/lib/geo-data';

export const dynamic = 'force-static';

export async function GET() {
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

  const blogSection = blogPosts
    .slice(0, 20)
    .map((post) => `- [${post.title}](${absoluteUrl(`/blog/${post.slug}`)}): ${post.metaDescription}`)
    .join('\n');

  const content = `# PdfPixels

> PdfPixels is a free, privacy-first online PDF and image processing platform offering ${indexableTools.length}+ specialized utilities including PDF compression, merging, splitting, OCR, digital signing, format conversion, and image optimization without watermarks, signups, or permanent file storage.

PdfPixels processes up to 80% of document and image operations locally inside the user's browser via WebAssembly and HTML5 Canvas so confidential files never leave the device. Tools requiring heavy rendering or conversion engines run in isolated ephemeral memory and are purged immediately after download.

## Key Pages

- [PdfPixels Home](${absoluteUrl('/')}): Main workspace with instant access to all free online PDF and image tools.
- [PDF Tools Hub](${absoluteUrl('/pdf-tools')}): Complete directory of PDF compression, merge, split, conversion, OCR, and security tools.
- [All Tools Directory](${absoluteUrl('/tools')}): Searchable catalog of all ${indexableTools.length}+ PDF and image utilities.
- [Workflow Guides & Blog](${absoluteUrl('/blog')}): Step-by-step tutorials, portal file-size limit tables, and PDF technical guides.
- [Industry & Role Use Cases](${absoluteUrl('/use-cases')}): Curated PDF and image toolkits for legal, real estate, students, finance, and healthcare.
- [Tool Comparisons](${absoluteUrl('/compare')}): Side-by-side benchmarks comparing PdfPixels with Adobe Acrobat, Smallpdf, iLovePDF, and DocuSign.
- [2026 PDF Upload Size Limits Study](${absoluteUrl('/research/pdf-size-limits-2026')}): Empirical reference of file upload limits across 50+ government, court, and email portals.
- [API Documentation](${absoluteUrl('/api-docs')}): Developer documentation, OpenAPI specification, and MCP server integration guide.
- [About PdfPixels](${absoluteUrl('/about')}): Architecture, privacy model, and company background.
- [Pricing](${absoluteUrl('/pricing')}): Free forever model and feature overview.
- [Security & Privacy Architecture](${absoluteUrl('/security')}): Zero-retention policy, client-side WebAssembly execution, and encryption details.
- [Contact Support](${absoluteUrl('/contact')}): Customer support, bug reports, and business inquiries.

## Popular PDF & Image Tools

${popularSection}

## Tool Categories

${categorySection}

## All Tools by Category

${allToolsByCategory}

## Use Cases

${useCaseSection}

## High-Intent Software Comparisons

${comparisonSection}

## Regional & Country Hubs (Tier 1 & Tier 2)

${regionSection}

## Featured Guides & Research

${blogSection}

## Agent & Machine-Readable Endpoints

- [Full LLM Documentation (llms-full.txt)](${absoluteUrl('/llms-full.txt')}): Exhaustive Markdown reference covering every tool's input/output formats, processing mode, steps, and FAQs.
- [Homepage Markdown Representation](${absoluteUrl('/markdown')}): Token-efficient Markdown version of the homepage (also served via \`Accept: text/markdown\`).
- [MCP Server Card](${absoluteUrl('/.well-known/mcp/server-card.json')}): Model Context Protocol (SEP-1649) server discovery metadata.
- [MCP Streamable-HTTP Endpoint](${absoluteUrl('/api/mcp')}): JSON-RPC 2.0 MCP endpoint exposing tool discovery, recommendations, and platform limits.
- [OpenAPI 3.1 Specification](${absoluteUrl('/openapi.json')}): Machine-readable REST API specification for PdfPixels endpoints.
- [API Catalog](${absoluteUrl('/.well-known/api-catalog')}): RFC 9727 Linkset API catalog for automated agent discovery.
- [XML Sitemap](${absoluteUrl('/sitemap.xml')}): Canonical URL inventory for search and answer engine crawlers.
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Signal': 'search=yes, ai-input=yes, ai-train=no',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
