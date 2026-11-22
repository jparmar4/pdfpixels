import { SITE_CONTENT_UPDATED } from '@/lib/seo';
import { allTools as tools, toolCategories } from '@/lib/tools-data';
import { platformLimits } from '@/lib/limits';

export function buildOpenApiSpec() {
  const browserSessionSecurity = [{ browserSessionCookie: [] }];
  const sessionErrorResponses = {
    '403': {
      description:
        'Forbidden: heavy processing endpoints require a same-origin browser request (matching Origin/Referer) plus a signed pp_api_token session cookie issued by GET /api/session.',
    },
    '429': {
      description: 'Rate limit exceeded (20 requests/min per processing route per IP).',
    },
  };

  return {
    openapi: '3.1.0',
    info: {
      title: 'PdfPixels API & Model Context Protocol (MCP) Service',
      version: '1.1.0',
      summary:
        `Free online PDF & image processing platform with ${tools.length}+ tools, exact-KB compression, OCR, financial table extraction, and MCP agent discovery.`,
      description:
        'OpenAPI 3.1 specification for PdfPixels (https://www.pdfpixels.com). Public unauthenticated endpoints: GET/POST /api/mcp, GET/POST /api/a2ui (Google A2UI v1.0), GET /api/health, GET /api/limits. Heavy processing endpoints (/api/pdf/*, /api/image/*) are protected for same-origin web sessions via GET /api/session and the HttpOnly pp_api_token cookie.',
      contact: {
        name: 'PdfPixels Support',
        email: 'support@pdfpixels.com',
        url: 'https://www.pdfpixels.com/contact',
      },
      license: {
        name: 'Free Online Service Terms',
        url: 'https://www.pdfpixels.com/terms',
      },
    },
    externalDocs: {
      description: 'Interactive MCP Hub & Multi-Step Workflow Recipes',
      url: 'https://www.pdfpixels.com/mcp',
    },
    servers: [
      {
        url: 'https://www.pdfpixels.com',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        browserSessionCookie: {
          type: 'apiKey',
          in: 'cookie',
          name: 'pp_api_token',
          description:
            'Signed HttpOnly same-origin web session cookie issued by GET /api/session. Must be paired with matching same-origin Origin/Referer headers on POST /api/pdf/* and POST /api/image/* routes.',
        },
      },
    },
    tags: [
      { name: 'Agent & MCP Discovery', description: 'Public Model Context Protocol (MCP) JSON-RPC 2.0 & capability discovery (no auth required)' },
      { name: 'System & Limits', description: 'Public service health, verified processing limits, and same-origin session bootstrap' },
      { name: 'PDF Processing', description: 'Same-origin browser-session PDF compression, merge, split, OCR, and conversion (requires pp_api_token)' },
      { name: 'Image Processing', description: 'Same-origin browser-session image compression, exact-KB resizing, conversion, and AI background removal (requires pp_api_token)' },
    ],
    paths: {
      '/api/mcp': {
        get: {
          operationId: 'getMcpServiceInfo',
          summary: 'Get MCP server metadata and available tools',
          tags: ['Agent & MCP Discovery'],
          responses: {
            '200': {
              description: 'MCP server capabilities, tool list, and discovery links',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', example: 'pdfpixels-mcp' },
                      version: { type: 'string', example: '1.1.0' },
                      protocol: { type: 'string', example: 'mcp/2025-03-26' },
                      toolsCount: { type: 'integer', example: tools.length },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          operationId: 'invokeMcpJsonRpc',
          summary: 'Invoke Model Context Protocol (MCP) JSON-RPC 2.0 methods',
          description:
            'Supports initialize, tools/list, tools/call (search_tools, get_tool_details, get_platform_limits, recommend_workflow, render_a2ui_surface), resources/list, resources/read (including a2ui://pdfpixels/* surfaces), prompts/list, prompts/get, and ping.',
          tags: ['Agent & MCP Discovery'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['jsonrpc', 'method'],
                  properties: {
                    jsonrpc: { type: 'string', enum: ['2.0'] },
                    id: { oneOf: [{ type: 'string' }, { type: 'integer' }] },
                    method: {
                      type: 'string',
                      enum: [
                        'initialize',
                        'ping',
                        'tools/list',
                        'tools/call',
                        'resources/list',
                        'resources/read',
                        'prompts/list',
                        'prompts/get',
                      ],
                    },
                    params: { type: 'object' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'JSON-RPC 2.0 result envelope',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      jsonrpc: { type: 'string', example: '2.0' },
                      id: { oneOf: [{ type: 'string' }, { type: 'integer' }, { type: 'null' }] },
                      result: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/a2ui': {
        get: {
          operationId: 'getA2uiCapabilitiesOrSurface',
          summary: 'Get Google A2UI v1.0 capability descriptor or fetch a declarative A2UI v1.0 surface',
          tags: ['Agent & MCP Discovery'],
          parameters: [
            {
              name: 'surface',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['search', 'workflow', 'tool', 'limits'] },
              description: 'Optional surface preset to generate directly as A2UI v1.0 JSON.',
            },
            {
              name: 'q',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Optional search query or workflow task.',
            },
            {
              name: 'slug',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Tool slug when surface=tool.',
            },
          ],
          responses: {
            '200': {
              description: 'A2UI v1.0 capability metadata or declarative A2UI v1.0 message envelope',
              content: {
                'application/json': { schema: { type: 'object' } },
                'application/a2ui+json': { schema: { type: 'array', items: { type: 'object' } } },
              },
            },
          },
        },
        post: {
          operationId: 'invokeA2uiSurfaceOrAction',
          summary: 'Generate a Google A2UI v1.0 surface or handle a client ActionMessage round-trip',
          description:
            'Accepts either a standard A2UI v1.0 client ActionMessage envelope ({ version: "1.0", action: { name, surfaceId, sourceComponentId, timestamp, context } }) or a direct intent object ({ intent, query, task, slug }) with optional a2uiRendererCapabilities negotiation.',
          tags: ['Agent & MCP Discovery'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    version: { type: 'string', enum: ['1.0'] },
                    intent: {
                      type: 'string',
                      enum: ['search_tools', 'recommend_workflow', 'get_tool_details', 'get_platform_limits'],
                    },
                    query: { type: 'string' },
                    task: { type: 'string' },
                    slug: { type: 'string' },
                    action: { type: 'object' },
                    a2uiRendererCapabilities: { type: 'object' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Google A2UI v1.0 Basic Catalog surface envelope',
              content: {
                'application/json': { schema: { type: 'object' } },
                'application/a2ui+json': { schema: { type: 'array', items: { type: 'object' } } },
              },
            },
            '406': {
              description: 'Renderer capabilities do not support A2UI v1.0 Basic Catalog',
            },
          },
        },
      },
      '/api/health': {
        get: {
          operationId: 'getHealthStatus',
          summary: 'Check service health and tool inventory counts',
          tags: ['System & Limits'],
          responses: {
            '200': {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      service: { type: 'string', example: 'PdfPixels' },
                      toolsCount: { type: 'integer', example: tools.length },
                      categoriesCount: { type: 'integer', example: toolCategories.length },
                      updatedAt: { type: 'string', format: 'date-time', example: SITE_CONTENT_UPDATED.toISOString() },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/limits': {
        get: {
          operationId: 'getPlatformLimits',
          summary: 'Get verified file size, page count, rate limits, and privacy retention guarantees',
          tags: ['System & Limits'],
          responses: {
            '200': {
              description: 'Verified platform limits and privacy guarantees',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      service: { type: 'string', example: 'PdfPixels' },
                      limits: { type: 'object', example: platformLimits },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/session': {
        get: {
          operationId: 'bootstrapBrowserSession',
          summary: 'Issue signed same-origin pp_api_token session cookie for web UI requests',
          tags: ['System & Limits'],
          responses: {
            '200': {
              description: 'Session cookies attached (Cache-Control: no-store, private)',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { ok: { type: 'boolean', example: true } },
                  },
                },
              },
            },
            '403': {
              description: 'Origin mismatch (cross-origin or headerless request)',
            },
          },
        },
      },
      '/api/pdf/compress': {
        post: {
          operationId: 'compressPdf',
          summary: 'Compress PDF file size or target an exact KB ceiling',
          tags: ['PDF Processing'],
          security: browserSessionSecurity,
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file'],
                  properties: {
                    file: { type: 'string', format: 'binary', description: 'PDF file up to 50 MB' },
                    level: { type: 'string', enum: ['less', 'recommended', 'extreme'], default: 'recommended' },
                    targetKb: { type: 'integer', minimum: 50, maximum: 10240, example: 200 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Compressed PDF binary stream with X-Size-Before, X-Size-After, and X-Saved-Percent headers',
              content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
            },
            ...sessionErrorResponses,
          },
        },
      },
      '/api/pdf/merge': {
        post: {
          operationId: 'mergePdf',
          summary: 'Merge up to 20 PDF files (100 MB total, 1,000 pages max) into one PDF',
          tags: ['PDF Processing'],
          security: browserSessionSecurity,
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['files'],
                  properties: {
                    files: {
                      type: 'array',
                      items: { type: 'string', format: 'binary' },
                      maxItems: 20,
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Merged PDF document',
              content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
            },
            ...sessionErrorResponses,
          },
        },
      },
      '/api/pdf/split': {
        post: {
          operationId: 'splitPdf',
          summary: 'Split a PDF by page range, single page, all pages, or maximum file size in MB',
          tags: ['PDF Processing'],
          security: browserSessionSecurity,
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file'],
                  properties: {
                    file: { type: 'string', format: 'binary' },
                    mode: { type: 'string', enum: ['all', 'range', 'single', 'size'], default: 'all' },
                    pageRange: { type: 'string', example: '1-3,5' },
                    maxSizeMb: { type: 'number', example: 10 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Extracted PDF or ZIP archive of split PDFs',
              content: {
                'application/pdf': { schema: { type: 'string', format: 'binary' } },
                'application/zip': { schema: { type: 'string', format: 'binary' } },
              },
            },
            ...sessionErrorResponses,
          },
        },
      },
      '/api/pdf/to-word': {
        post: {
          operationId: 'pdfToWord',
          summary: 'Convert PDF to editable Microsoft Word (.docx)',
          tags: ['PDF Processing'],
          security: browserSessionSecurity,
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file'],
                  properties: { file: { type: 'string', format: 'binary' } },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Editable Word (.docx) document',
              content: {
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
                  schema: { type: 'string', format: 'binary' },
                },
              },
            },
            ...sessionErrorResponses,
          },
        },
      },
      '/api/pdf/to-excel': {
        post: {
          operationId: 'pdfToExcel',
          summary: 'Extract PDF financial tables and invoices to Excel (.xlsx) or CSV',
          tags: ['PDF Processing'],
          security: browserSessionSecurity,
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file'],
                  properties: {
                    file: { type: 'string', format: 'binary' },
                    format: { type: 'string', enum: ['xlsx', 'csv'], default: 'xlsx' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Extracted Excel workbook or CSV text',
              content: {
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                  schema: { type: 'string', format: 'binary' },
                },
                'text/csv': { schema: { type: 'string' } },
              },
            },
            ...sessionErrorResponses,
          },
        },
      },
      '/api/pdf/bank-statement-to-excel': {
        post: {
          operationId: 'bankStatementToExcel',
          summary: 'Parse bank and credit card statement PDFs into reconciled Excel (.xlsx) or QuickBooks/Xero CSV',
          tags: ['PDF Processing'],
          security: browserSessionSecurity,
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file'],
                  properties: {
                    file: { type: 'string', format: 'binary' },
                    format: { type: 'string', enum: ['xlsx', 'csv'], default: 'xlsx' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Reconciled bank statement spreadsheet (.xlsx or .csv)',
              content: {
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                  schema: { type: 'string', format: 'binary' },
                },
                'text/csv': { schema: { type: 'string' } },
              },
            },
            ...sessionErrorResponses,
          },
        },
      },
      '/api/pdf/ocr': {
        post: {
          operationId: 'ocrPdf',
          summary: 'Run Optical Character Recognition (OCR) on scanned PDFs',
          tags: ['PDF Processing'],
          security: browserSessionSecurity,
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file'],
                  properties: { file: { type: 'string', format: 'binary' } },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Extracted OCR text and page metadata',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
            ...sessionErrorResponses,
          },
        },
      },
      '/api/image/process': {
        post: {
          operationId: 'processImage',
          summary: 'Compress, resize (px/cm/mm/inch), convert format, or target exact KB size for images',
          tags: ['Image Processing'],
          security: browserSessionSecurity,
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['image'],
                  properties: {
                    image: { type: 'string', format: 'binary', description: 'Image up to 25 MB / 50 MP' },
                    operation: { type: 'string', enum: ['compress', 'resize', 'convert', 'filter', 'transform'] },
                    quality: { type: 'integer', minimum: 1, maximum: 100, default: 92 },
                    format: { type: 'string', enum: ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'tiff'] },
                    targetSize: { type: 'integer', description: 'Exact KB ceiling (e.g. 20, 50, 100, 200)' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Processed image result (base64 JSON metadata by default, or binary image bytes when responseType=binary)',
              content: {
                'application/json': { schema: { type: 'object' } },
                'application/octet-stream': { schema: { type: 'string', format: 'binary' } },
              },
            },
            ...sessionErrorResponses,
          },
        },
      },
      '/api/pdf/bates-numbering': {
        post: {
          operationId: 'applyBatesNumbering',
          summary: 'Stamp legal Bates numbering prefixes across PDF pages (e.g., PACER / discovery packets)',
          tags: ['PDF Processing'],
          security: browserSessionSecurity,
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file'],
                  properties: {
                    file: { type: 'string', format: 'binary' },
                    prefix: { type: 'string', default: 'DOC-' },
                    startNumber: { type: 'integer', default: 1 },
                    digits: { type: 'integer', default: 6 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Stamped PDF binary',
              content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
            },
            ...sessionErrorResponses,
          },
        },
      },
      '/api/pdf/crop-shipping-label': {
        post: {
          operationId: 'cropShippingLabel',
          summary: 'Crop marketplace A4/Letter shipping PDFs into 4x6 thermal printer labels (USPS, UPS, FedEx, Amazon FBA, eBay)',
          tags: ['PDF Processing'],
          security: browserSessionSecurity,
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file'],
                  properties: {
                    file: { type: 'string', format: 'binary' },
                    preset: { type: 'string', default: 'usps' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Cropped 4x6 thermal PDF',
              content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
            },
            ...sessionErrorResponses,
          },
        },
      },
      '/api/pdf/protect': {
        post: {
          operationId: 'protectPdf',
          summary: 'Encrypt a PDF with user/owner passwords and permission restrictions',
          tags: ['PDF Processing'],
          security: browserSessionSecurity,
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file', 'password'],
                  properties: {
                    file: { type: 'string', format: 'binary' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Password-protected PDF binary',
              content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
            },
            ...sessionErrorResponses,
          },
        },
      },
      '/api/pdf/sanitize': {
        post: {
          operationId: 'sanitizePdf',
          summary: 'Strip XMP metadata, embedded JavaScript, annotations, and hidden layers from PDFs',
          tags: ['PDF Processing'],
          security: browserSessionSecurity,
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file'],
                  properties: { file: { type: 'string', format: 'binary' } },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Sanitized PDF binary',
              content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
            },
            ...sessionErrorResponses,
          },
        },
      },
      '/api/pdf/compare': {
        post: {
          operationId: 'comparePdf',
          summary: 'Compare two PDF documents for text and structural differences',
          tags: ['PDF Processing'],
          security: browserSessionSecurity,
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['fileA', 'fileB'],
                  properties: {
                    fileA: { type: 'string', format: 'binary' },
                    fileB: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Comparison report JSON',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
            ...sessionErrorResponses,
          },
        },
      },
    },
  };
}
