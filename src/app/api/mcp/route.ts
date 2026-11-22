import { NextRequest, NextResponse } from 'next/server';
import { getToolBySlug, toolCategories } from '@/lib/tools-data';
import { toolContentMap } from '@/lib/tool-content-data';
import { absoluteUrl } from '@/lib/seo';
import { platformLimits } from '@/lib/limits';
import { buildOpenApiSpec } from '@/lib/openapi-spec';
import { buildLlmsTxt, buildLlmsFullTxt } from '@/lib/llms-content';
import {
  A2UI_A2A_EXTENSION_URI,
  A2UI_BASIC_CATALOG_ID,
  A2UI_MIME_TYPE,
  A2UI_PROTOCOL_VERSION,
  buildPlatformLimitsA2uiSurface,
  buildToolDetailsA2uiSurface,
  buildToolSearchA2uiSurface,
  buildWorkflowRecommendationA2uiSurface,
  findMatchingWorkflowRecipes,
  resolveA2uiRequest,
  searchPdfPixelsTools,
  supportsA2uiV10BasicCatalog,
} from '@/lib/a2ui-surfaces';

export const runtime = 'nodejs';

const SERVER_INFO = {
  name: 'pdfpixels-mcp-server',
  title: 'PdfPixels PDF & Image Tools MCP Server',
  version: '1.1.0',
  websiteUrl: 'https://www.pdfpixels.com',
};

const A2UI_META = {
  protocolVersion: A2UI_PROTOCOL_VERSION,
  extensionUri: A2UI_A2A_EXTENSION_URI,
  mimeType: A2UI_MIME_TYPE,
  endpoint: 'https://www.pdfpixels.com/api/a2ui',
  supportedCatalogIds: [A2UI_BASIC_CATALOG_ID],
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
      'Search PdfPixels free online PDF and image tools by keyword, file format, or category. Pass includeA2ui: true to also receive an interactive Google A2UI v1.0 surface.',
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
        includeA2ui: {
          type: 'boolean',
          description: 'When true, appends an embedded application/a2ui+json v1.0 UI surface.',
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
        includeA2ui: {
          type: 'boolean',
          description: 'When true, appends an embedded application/a2ui+json v1.0 detail card.',
        },
      },
      required: ['slug'],
    },
  },
  {
    name: 'recommend_workflow',
    description:
      'Recommend the best PdfPixels tool or multi-step workflow recipe for a user document/image task.',
    inputSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'User task description (e.g. shrink PDF under 2MB for USCIS)',
        },
        includeA2ui: {
          type: 'boolean',
          description: 'When true, appends an embedded application/a2ui+json v1.0 workflow surface.',
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
      properties: {
        includeA2ui: {
          type: 'boolean',
          description: 'When true, appends an embedded application/a2ui+json v1.0 tabbed limits surface.',
        },
      },
    },
  },
  {
    name: 'render_a2ui_surface',
    description:
      'Generate a spec-compliant Google A2UI v1.0 interactive surface (Basic Catalog) for PdfPixels tool discovery, workflow recommendations, tool details, or platform limits.',
    inputSchema: {
      type: 'object',
      properties: {
        intent: {
          type: 'string',
          enum: ['search_tools', 'recommend_workflow', 'get_tool_details', 'get_platform_limits'],
          description: 'Which interactive A2UI v1.0 surface to build.',
        },
        query: {
          type: 'string',
          description: 'Tool search query (for search_tools).',
        },
        task: {
          type: 'string',
          description: 'Workflow goal description (for recommend_workflow).',
        },
        slug: {
          type: 'string',
          description: 'Tool slug (for get_tool_details).',
        },
        surfaceId: {
          type: 'string',
          description: 'Optional caller-chosen unique A2UI surfaceId.',
        },
      },
      required: ['intent'],
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
  {
    uri: 'a2ui://pdfpixels/tool-directory',
    name: 'PdfPixels Interactive Tool Directory (A2UI v1.0)',
    description:
      'Declarative Google A2UI v1.0 Basic Catalog surface featuring top PdfPixels PDF & image tools with launch and detail actions.',
    mimeType: A2UI_MIME_TYPE,
  },
  {
    uri: 'a2ui://pdfpixels/platform-limits',
    name: 'PdfPixels Limits & Privacy Architecture (A2UI v1.0)',
    description:
      'Declarative Google A2UI v1.0 tabbed surface presenting verified PDF, image, AI, and zero-retention privacy guarantees.',
    mimeType: A2UI_MIME_TYPE,
  },
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id',
  'Content-Signal': 'search=yes, ai-input=yes, ai-train=no',
};

function wantsA2uiContent(
  args: Record<string, unknown>,
  params: Record<string, unknown>,
): boolean {
  if (args.includeA2ui === true || args.format === 'a2ui') {
    return true;
  }
  const meta =
    params._meta && typeof params._meta === 'object'
      ? (params._meta as Record<string, unknown>)
      : undefined;
  const caps = meta?.a2uiRendererCapabilities;
  if (caps) {
    return supportsA2uiV10BasicCatalog(caps).supported;
  }
  return false;
}

function buildEmbeddedA2uiResource(surfaceId: string, messages: unknown) {
  return {
    type: 'resource' as const,
    resource: {
      uri: `a2ui://pdfpixels/surface/${surfaceId}`,
      mimeType: A2UI_MIME_TYPE,
      text: JSON.stringify(messages, null, 2),
    },
  };
}

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
      a2ui: A2UI_META,
      tools: MCP_TOOLS,
      resources: MCP_RESOURCES,
    },
    { headers: CORS_HEADERS },
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
      { status: 400, headers: CORS_HEADERS },
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
          _meta: { a2ui: A2UI_META },
          instructions:
            'Use search_tools or recommend_workflow to find the appropriate PdfPixels tool URL, get_tool_details for format specs, or render_a2ui_surface (or includeA2ui: true) to emit interactive Google A2UI v1.0 UI surfaces.',
        },
      },
      { headers: CORS_HEADERS },
    );
  }

  if (method === 'notifications/initialized') {
    return new NextResponse(null, { status: 202, headers: CORS_HEADERS });
  }

  if (method === 'ping') {
    return NextResponse.json(
      { jsonrpc: '2.0', id, result: {} },
      { headers: CORS_HEADERS },
    );
  }

  if (method === 'tools/list') {
    return NextResponse.json(
      { jsonrpc: '2.0', id, result: { tools: MCP_TOOLS } },
      { headers: CORS_HEADERS },
    );
  }

  if (method === 'resources/list') {
    return NextResponse.json(
      { jsonrpc: '2.0', id, result: { resources: MCP_RESOURCES } },
      { headers: CORS_HEADERS },
    );
  }

  if (method === 'resources/read') {
    const uri = String(params.uri || '');
    if (uri === 'a2ui://pdfpixels/tool-directory') {
      const bundle = buildToolSearchA2uiSurface({
        query: '',
        limit: 6,
        surfaceId: 'pdfpixels-tool-directory',
      });
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: A2UI_MIME_TYPE,
                text: JSON.stringify(bundle.messages, null, 2),
              },
            ],
          },
        },
        { headers: CORS_HEADERS },
      );
    }
    if (uri === 'a2ui://pdfpixels/platform-limits') {
      const bundle = buildPlatformLimitsA2uiSurface({
        surfaceId: 'pdfpixels-platform-limits',
      });
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: A2UI_MIME_TYPE,
                text: JSON.stringify(bundle.messages, null, 2),
              },
            ],
          },
        },
        { headers: CORS_HEADERS },
      );
    }
    if (uri === 'https://www.pdfpixels.com/openapi.json') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(buildOpenApiSpec(), null, 2),
              },
            ],
          },
        },
        { headers: CORS_HEADERS },
      );
    }
    if (
      uri === 'https://www.pdfpixels.com/llms.txt' ||
      uri === 'https://www.pdfpixels.com/llms-full.txt'
    ) {
      const text =
        uri === 'https://www.pdfpixels.com/llms-full.txt'
          ? buildLlmsFullTxt()
          : buildLlmsTxt();
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: 'text/plain',
                text,
              },
            ],
          },
        },
        { headers: CORS_HEADERS },
      );
    }
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id,
        error: { code: -32602, message: `Resource not found: ${uri}` },
      },
      { status: 404, headers: CORS_HEADERS },
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
      { headers: CORS_HEADERS },
    );
  }

  if (method === 'prompts/get') {
    const promptName = String(params.name || '');
    const promptArgs = (params.arguments || {}) as Record<string, unknown>;
    if (promptName === 'choose_pdf_tool') {
      const goal = String(promptArgs.goal || 'compress a PDF file');
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: {
            description: 'Recommend the best PdfPixels tool and workflow for the user goal.',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Find the best free online tool on https://www.pdfpixels.com for this task: "${goal}". Use the search_tools, recommend_workflow, or render_a2ui_surface MCP tool and provide the direct tool URL and step-by-step instructions.`,
                },
              },
            ],
          },
        },
        { headers: CORS_HEADERS },
      );
    }
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id,
        error: { code: -32602, message: `Unknown prompt: ${promptName}` },
      },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  if (method === 'tools/call') {
    const toolName = String(params.name || '');
    const args = (params.arguments || {}) as Record<string, unknown>;
    const includeA2ui = wantsA2uiContent(args, params);

    if (toolName === 'render_a2ui_surface') {
      const bundle = resolveA2uiRequest(args);
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: bundle.summary,
              },
              buildEmbeddedA2uiResource(bundle.surfaceId, bundle.messages),
            ],
            _meta: {
              a2ui: {
                protocolVersion: bundle.protocolVersion,
                catalogId: bundle.catalogId,
                surfaceId: bundle.surfaceId,
              },
            },
          },
        },
        { headers: CORS_HEADERS },
      );
    }

    if (
      toolName === 'search_tools' ||
      toolName === 'search_pdfpixels_tools' ||
      toolName === 'recommend_workflow' ||
      toolName === 'recommend_pdfpixels_workflow'
    ) {
      const q = String(args.query || args.task || '').trim();
      const categoryFilter = String(args.category || '').trim();
      const isWorkflow =
        toolName === 'recommend_workflow' || toolName === 'recommend_pdfpixels_workflow';
      const matches = searchPdfPixelsTools(q, categoryFilter, 8);
      const recipes = isWorkflow ? findMatchingWorkflowRecipes(q, 2) : [];

      const textPayload = isWorkflow
        ? {
            task: q.toLowerCase(),
            count: matches.length,
            workflows: recipes.map((r) => ({
              slug: r.slug,
              title: r.title,
              url: absoluteUrl(`/workflows/${r.slug}`),
              steps: r.steps.map((s) => s.title),
            })),
            tools: matches.map((m) => ({
              name: m.name,
              slug: m.slug,
              url: m.url,
              markdownUrl: m.markdownUrl,
              description: m.description,
              processing: m.processing,
            })),
          }
        : {
            query: q.toLowerCase(),
            count: matches.length,
            tools: matches.map((m) => ({
              name: m.name,
              slug: m.slug,
              url: m.url,
              markdownUrl: m.markdownUrl,
              description: m.description,
              processing: m.processing,
            })),
          };

      const content: Array<Record<string, unknown>> = [
        {
          type: 'text',
          text: JSON.stringify(textPayload, null, 2),
        },
      ];

      if (includeA2ui) {
        const bundle = isWorkflow
          ? buildWorkflowRecommendationA2uiSurface({ task: q })
          : buildToolSearchA2uiSurface({ query: q, category: categoryFilter });
        content.push(buildEmbeddedA2uiResource(bundle.surfaceId, bundle.messages));
      }

      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: { content },
        },
        { headers: CORS_HEADERS },
      );
    }

    if (toolName === 'get_tool_details' || toolName === 'get_pdfpixels_tool_details') {
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
          { headers: CORS_HEADERS },
        );
      }

      const category = toolCategories.find((c) => c.id === tool.category);
      const tc = toolContentMap[tool.slug];
      const content: Array<Record<string, unknown>> = [
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
            2,
          ),
        },
      ];

      if (includeA2ui) {
        const bundle = buildToolDetailsA2uiSurface({ slug: tool.slug });
        content.push(buildEmbeddedA2uiResource(bundle.surfaceId, bundle.messages));
      }

      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: { content },
        },
        { headers: CORS_HEADERS },
      );
    }

    if (toolName === 'get_platform_limits' || toolName === 'get_pdfpixels_limits') {
      const content: Array<Record<string, unknown>> = [
        {
          type: 'text',
          text: JSON.stringify(platformLimits, null, 2),
        },
      ];

      if (includeA2ui) {
        const bundle = buildPlatformLimitsA2uiSurface();
        content.push(buildEmbeddedA2uiResource(bundle.surfaceId, bundle.messages));
      }

      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: { content },
        },
        { headers: CORS_HEADERS },
      );
    }

    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Unknown tool: ${toolName}` },
      },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  return NextResponse.json(
    {
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    },
    { status: 404, headers: CORS_HEADERS },
  );
}
