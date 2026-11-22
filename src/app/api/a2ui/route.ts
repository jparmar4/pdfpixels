import { NextRequest, NextResponse } from 'next/server';
import {
  A2UI_BASIC_CATALOG_ID,
  A2UI_MIME_TYPE,
  A2UI_PROTOCOL_VERSION,
  buildA2uiServiceDescriptor,
  resolveA2uiRequest,
  supportsA2uiV10BasicCatalog,
} from '@/lib/a2ui-surfaces';

export const runtime = 'nodejs';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, X-A2UI-Capabilities',
  'Content-Signal': 'search=yes, ai-input=yes, ai-train=no',
  'X-A2UI-Version': A2UI_PROTOCOL_VERSION,
  Vary: 'Accept',
};

function prefersRawA2uiEnvelope(acceptHeader: string | null): boolean {
  if (!acceptHeader) return false;
  return acceptHeader.toLowerCase().includes(A2UI_MIME_TYPE);
}

function parseCapabilitiesHeader(raw: string | null): unknown {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const surface = searchParams.get('surface');

  if (!surface) {
    return NextResponse.json(buildA2uiServiceDescriptor(), {
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
      },
    });
  }

  const intentMap: Record<string, string> = {
    search: 'search_tools',
    workflow: 'recommend_workflow',
    tool: 'get_tool_details',
    limits: 'get_platform_limits',
  };

  const bundle = resolveA2uiRequest({
    intent: intentMap[surface.toLowerCase()] || surface,
    query: searchParams.get('q') || searchParams.get('query') || '',
    task: searchParams.get('task') || searchParams.get('q') || '',
    slug: searchParams.get('slug') || 'compress-pdf',
    category: searchParams.get('category') || undefined,
    surfaceId: searchParams.get('surfaceId') || undefined,
  });

  if (prefersRawA2uiEnvelope(request.headers.get('accept'))) {
    return new NextResponse(JSON.stringify(bundle.messages), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': `${A2UI_MIME_TYPE}; charset=utf-8`,
        'X-A2UI-Surface-Id': bundle.surfaceId,
      },
    });
  }

  return NextResponse.json(bundle, {
    headers: {
      ...CORS_HEADERS,
      'X-A2UI-Surface-Id': bundle.surfaceId,
    },
  });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json(
        { error: 'Invalid A2UI request payload: expected a JSON object.' },
        { status: 400, headers: CORS_HEADERS },
      );
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: 'Parse error: Invalid JSON payload.' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const metadata =
    body.metadata && typeof body.metadata === 'object'
      ? (body.metadata as Record<string, unknown>)
      : undefined;

  const advertisedCapabilities =
    body.a2uiRendererCapabilities ??
    metadata?.a2uiRendererCapabilities ??
    parseCapabilitiesHeader(request.headers.get('x-a2ui-capabilities'));

  const negotiation = supportsA2uiV10BasicCatalog(advertisedCapabilities);
  if (!negotiation.supported) {
    return NextResponse.json(
      {
        error: negotiation.reason || 'Incompatible A2UI renderer capabilities.',
        supportedProtocolVersion: A2UI_PROTOCOL_VERSION,
        supportedCatalogIds: [A2UI_BASIC_CATALOG_ID],
      },
      { status: 406, headers: CORS_HEADERS },
    );
  }

  const bundle = resolveA2uiRequest(body);

  if (prefersRawA2uiEnvelope(request.headers.get('accept'))) {
    return new NextResponse(JSON.stringify(bundle.messages), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': `${A2UI_MIME_TYPE}; charset=utf-8`,
        'X-A2UI-Surface-Id': bundle.surfaceId,
      },
    });
  }

  return NextResponse.json(bundle, {
    headers: {
      ...CORS_HEADERS,
      'X-A2UI-Surface-Id': bundle.surfaceId,
    },
  });
}
