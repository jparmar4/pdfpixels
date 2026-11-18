import type { Metadata } from 'next';
import Link from 'next/link';
import { Bot, ChevronRight, Code2, Cpu, FileJson, ShieldCheck } from 'lucide-react';
import { FooterAd, HeaderAd, InContentAd, NativeAd } from '@/components/ads/ad-banner';
import { McpInteractiveHub } from '@/components/mcp/mcp-interactive-hub';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_OG_IMAGE_URL, SITE_CONTENT_UPDATED, absoluteUrl, getRobotsMetadata } from '@/lib/seo';
import { siteConfig } from '@/lib/seo-config';
import { allTools } from '@/lib/tools-data';

export const metadata: Metadata = {
  title: 'Model Context Protocol (MCP) Server & OpenAPI Hub for AI Agents',
  description:
    'Connect Claude Desktop, Cursor, Windsurf, and autonomous AI agents to PdfPixels via zero-auth Streamable HTTP MCP (/api/mcp) and OpenAPI 3.1 (/openapi.json).',
  alternates: {
    canonical: '/mcp',
  },
  openGraph: {
    title: 'PdfPixels MCP Server & OpenAPI 3.1 Agent Hub',
    description:
      'Copy Claude Desktop & Cursor MCP configs, inspect OpenAPI 3.1 schemas, and invoke JSON-RPC 2.0 tool discovery live.',
    url: absoluteUrl('/mcp'),
    type: 'website',
    siteName: siteConfig.name,
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: 'PdfPixels MCP Server & Agent Hub',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PdfPixels MCP Server & OpenAPI 3.1 Hub',
    description: 'Connect AI agents and editors to PdfPixels free PDF and image endpoints via Model Context Protocol.',
    images: [DEFAULT_OG_IMAGE_URL],
  },
  robots: getRobotsMetadata(true),
};

export default function McpHubPage() {
  const url = absoluteUrl('/mcp');
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'PdfPixels MCP Server',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      url,
      dateModified: SITE_CONTENT_UPDATED.toISOString(),
      description: metadata.description,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'MCP Server Hub', item: url },
      ],
    },
  ];

  return (
    <>
      {schemas.map((s, idx) => (
        <script key={idx} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
      <main id="main-content" className="min-h-screen bg-background text-foreground pb-16">
        <section className="relative overflow-hidden border-b border-border/40 py-14 md:py-18">
          <div className="hero-grid absolute inset-0 opacity-50" />
          <div className="container relative mx-auto px-4 lg:px-8 max-w-5xl space-y-4">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link href="/" className="hover:text-primary">Home</Link>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              <span className="font-medium text-foreground">MCP Hub</span>
            </nav>

            <Badge className="badge-gradient rounded-full px-4 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              <Bot className="w-3.5 h-3.5 mr-1.5" />
              Model Context Protocol · Streamable HTTP
            </Badge>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Connect Claude Desktop &amp; Cursor to PdfPixels via MCP
            </h1>

            <p className="text-base text-muted-foreground max-w-3xl leading-relaxed">
              Give AI coding assistants and agents native access to {allTools.length}+ PDF/image capabilities, portal limit calculators, workflow recommendations, and OpenAPI 3.1 endpoints over zero-auth Streamable HTTP (<code className="font-mono text-primary">/api/mcp</code>).
            </p>

            <div className="flex flex-wrap gap-3 pt-2 text-xs">
              <Link href="/openapi.json" className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-card px-3.5 py-2 font-semibold hover:border-primary/40">
                <FileJson className="w-4 h-4 text-primary" /> OpenAPI 3.1 Spec (/openapi.json)
              </Link>
              <Link href="/.well-known/mcp/server-card.json" className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-card px-3.5 py-2 font-semibold hover:border-primary/40">
                <Cpu className="w-4 h-4 text-primary" /> MCP Server Card
              </Link>
              <Link href="/api-docs" className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-card px-3.5 py-2 font-semibold hover:border-primary/40">
                <Code2 className="w-4 h-4 text-primary" /> REST API Reference
              </Link>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 font-semibold text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4" /> Zero Auth Required
              </span>
            </div>
          </div>
        </section>

        <HeaderAd className="my-6" />

        <section className="container mx-auto px-4 lg:px-8 py-4 max-w-5xl">
          <McpInteractiveHub />
        </section>

        <NativeAd className="my-8 max-w-5xl mx-auto px-4" />

        <section className="container mx-auto px-4 lg:px-8 max-w-5xl space-y-6">
          <div className="section-panel rounded-[2rem] border border-border/50 bg-card/80 p-6 md:p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">Discovery &amp; Machine-Readable Endpoints</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              {[
                { title: 'MCP Endpoint', path: '/api/mcp', desc: 'JSON-RPC 2.0 Streamable HTTP server' },
                { title: 'OpenAPI 3.1 JSON', path: '/openapi.json', desc: 'Machine-readable REST endpoints' },
                { title: 'Agent Index', path: '/llms.txt', desc: 'Concise site map for LLMs' },
                { title: 'Full LLM Reference', path: '/llms-full.txt', desc: 'Complete tool specs & FAQs' },
                { title: 'Workflow Recipes', path: '/workflows', desc: '8 chained B2B document pipelines' },
                { title: 'Server Card', path: '/.well-known/mcp/server-card.json', desc: 'SEP-1649 discovery card' },
              ].map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className="rounded-xl border border-border/50 bg-background/70 p-4 hover:border-primary/40 transition-colors"
                >
                  <p className="font-bold text-foreground">{item.title}</p>
                  <p className="font-mono text-primary mt-0.5">{item.path}</p>
                  <p className="text-muted-foreground mt-1">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          <InContentAd variant="dual-rectangle" instanceId="mcp-hub-mid" className="my-6" />
        </section>

        <FooterAd className="my-6" />
      </main>
    </>
  );
}
