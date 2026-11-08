import { NextRequest, NextResponse } from 'next/server';
import { allTools, getToolBySlug, toolCategories } from '@/lib/tools-data';
import { toolContentMap } from '@/lib/tool-content-data';
import { absoluteUrl } from '@/lib/seo';
import { platformLimits } from '@/lib/limits';

export const runtime = 'nodejs';

const SERVER_INFO = {
  name: 'pdfpixels-mcp-server',
  title: 'PdfPixels PDF & Image Tools MCP Server',
  version: '1.0.0',
  websiteUrl: 'https://www.pdfpixels.com',
};

const CAPABILITIES = {
  tools: { listChanged: false },
  resources: { subscribe: false, listChanged: false },
  prompts: { listChanged: false },
};

const MCP_TOOLS = [
  {
    name: 'search_tools',
    description:
      'Search PdfPixels free online PDF and image tools by keyword, file format, or category.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Search query (e.g. compress pdf, merge pdf, ocr, heic to jpg, sign pdf)',
        },
        category: {
          type: 'string',
          description: 'Optional category ID filter',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_tool_details',
    description:
      'Retrieve complete metadata, accepted input/output formats, processing mode, max file size, and direct URL for a PdfPixels tool by slug.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'Tool slug (e.g. compress-pdf, merge-pdf, pdf-to-word, ocr-pdf)',
        },
      },
      required: ['slug'],
    },
  },
  {
    name: 'recommend_workflow',
    description:
      'Recommend the best PdfPixels tool or step-by-step workflow for a user document/image task.',
    inputSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'User task description (e.g. shrink PDF under 2MB for USCIS)',
        },
      },
      required: ['task'],
    },
  },
  {
    name: 'get_platform_limits',
    description:
      'Return official PdfPixels file size limits, rate limits, and zero-retention privacy architecture.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

const MCP_RESOURCES = [
  {
    uri: 'https://www.pdfpixels.com/llms.txt',
    name: 'PdfPixels LLM Overview (llms.txt)',
    description: 'Markdown index of PdfPixels key pages, categories, and popular tools.',
    mimeType: 'text/plain',
  },
  {
    uri: 'https://www.pdfpixels.com/llms-full.txt',
    name: 'PdfPixels Full Technical Reference (llms-full.txt)',
    description: 'Complete Markdown specification of every PdfPixels tool and workflow.',
    mimeType: 'text/plain',
  },
  {
    uri: 'https://www.pdfpixels.com/openapi.json',
    name: 'PdfPixels OpenAPI 3.1 Specification',
    description: 'OpenAPI schema for PdfPixels API endpoints.',
    mimeType: 'application/json',
  },
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id',
  'Content-Signal': 'search=yes, ai-input=yes, ai-train=no',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  return NextResponse.json(
    {
      protocolVersion: '2025-06-18',
      name: SERVER_INFO.name,
      version: SERVER_INFO.version,
      endpoint: 'https://www.pdfpixels.com/api/mcp',
      serverInfo: SERVER_INFO,
      capabilities: CAPABILITIES,
      tools: MCP_TOOLS,
      resources: MCP_RESOURCES,
    },
    { headers: CORS_HEADERS }
  );
}

export async function POST(request: NextRequest) {
  let body: {
    jsonrpc?: string;
    id?: string | number | null;
    method?: string;
    params?: Record<string, unknown>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error: Invalid JSON payload' },
      },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const id = body.id ?? null;
  const method = body.method || '';
  const params = body.params || {};

  if (method === 'initialize') {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2025-06-18',
          serverInfo: SERVER_INFO,
          capabilities: CAPABILITIES,
          instructions:
            'Use search_tools or recommend_workflow to find the appropriate PdfPixels tool URL, or get_tool_details for input/output format specifications.',
        },
      },
      { headers: CORS_HEADERS }
    );
  }

  if (method === 'notifications/initialized') {
    return new NextResponse(null, { status: 202, headers: CORS_HEADERS });
  }

  if (method === 'ping') {
    return NextResponse.json(
      { jsonrpc: '2.0', id, result: {} },
      { headers: CORS_HEADERS }
    );
  }

  if (method === 'tools/list') {
    return NextResponse.json(
      { jsonrpc: '2.0', id, result: { tools: MCP_TOOLS } },
      { headers: CORS_HEADERS }
    );
  }

  if (method === 'resources/list') {
    return NextResponse.json(
      { jsonrpc: '2.0', id, result: { resources: MCP_RESOURCES } },
      { headers: CORS_HEADERS }
    );
  }

  if (method === 'prompts/list') {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id,
        result: {
          prompts: [
            {
              name: 'choose_pdf_tool',
              description: 'Select the optimal PdfPixels tool for a document or image task.',
              arguments: [
                {
                  name: 'goal',
                  description: 'Document or image goal to solve',
                  required: true,
                },
              ],
            },
          ],
        },
      },
      { headers: CORS_HEADERS }
    );
  }

  if (method === 'tools/call') {
    const toolName = String(params.name || '');
    const args = (params.arguments || {}) as Record<string, unknown>;

    if (toolName === 'search_tools' || toolName === 'recommend_workflow') {
      const q = String(args.query || args.task || '')
        .toLowerCase()
        .trim();
      const categoryFilter = String(args.category || '')
        .toLowerCase()
        .trim();
      const tools = allTools;
      const tokens = q.split(/\s+/).filter(Boolean);

      const matches = tools
        .filter((t) => !categoryFilter || t.category.toLowerCase().includes(categoryFilter))
        .map((t) => {
          const hay = `${t.name} ${t.slug} ${t.description} ${(t.keywords || []).join(' ')}`.toLowerCase();
          let score = 0;
          if (hay.includes(q)) score += 10;
          for (const tok of tokens) {
            if (t.name.toLowerCase().includes(tok)) score += 5;
            else if (hay.includes(tok)) score += 2;
          }
          if (t.popular) score += 1;
          return { tool: t, score };
        })
        .filter((m) => m.score > 0 || tokens.length === 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map(({ tool }) => ({
          name: tool.name,
          slug: tool.slug,
          url: absoluteUrl(`/tools/${tool.slug}`),
          markdownUrl: absoluteUrl(`/tools/${tool.slug}/markdown`),
          description: tool.description,
          processing: tool.processing,
        }));

      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ query: q, count: matches.length, tools: matches }, null, 2),
              },
            ],
          },
        },
        { headers: CORS_HEADERS }
      );
    }

    if (toolName === 'get_tool_details') {
      const slug = String(args.slug || '').trim().toLowerCase();
      const tool = getToolBySlug(slug);
      if (!tool) {
        return NextResponse.json(
          {
            jsonrpc: '2.0',
            id,
            result: {
              isError: true,
              content: [{ type: 'text', text: `Tool not found for slug: ${slug}` }],
            },
          },
          { headers: CORS_HEADERS }
        );
      }

      const category = toolCategories.find((c) => c.id === tool.category);
      const tc = toolContentMap[tool.slug];
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    name: tool.name,
                    slug: tool.slug,
                    url: absoluteUrl(`/tools/${tool.slug}`),
                    markdownUrl: absoluteUrl(`/tools/${tool.slug}/markdown`),
                    category: category?.name || tool.category,
                    description: tool.description,
                    processing: tool.processing,
                    steps: tc?.steps || [],
                    faqs: tc?.faqs || [],
                  },
                  null,
                  2
                ),
              },
            ],
          },
        },
        { headers: CORS_HEADERS }
      );
    }

    if (toolName === 'get_platform_limits') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(platformLimits, null, 2),
              },
            ],
          },
        },
        { headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Unknown tool: ${toolName}` },
      },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(
    {
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    },
    { status: 404, headers: CORS_HEADERS }
  );
}
