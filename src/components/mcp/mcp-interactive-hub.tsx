'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import type { ActionMessage, AgentToRendererMessage } from '@a2ui/web_core/v1_0';
import { Check, Code2, Copy, Layers, Play, Sparkles, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { A2UI_BASIC_CATALOG_ID, A2UI_PROTOCOL_VERSION } from '@/lib/a2ui-surfaces';

const A2uiSurfaceRenderer = dynamic(
  () => import('./a2ui-surface-renderer').then((mod) => mod.A2uiSurfaceRenderer),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-border/50 bg-background/60 p-6 text-xs text-muted-foreground">
        Initializing Google A2UI v1.0 Basic Catalog renderer…
      </div>
    ),
  },
);

const CLAUDE_CONFIG = `{
  "mcpServers": {
    "pdfpixels": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://www.pdfpixels.com/api/mcp"]
    }
  }
}`;

const CURSOR_CONFIG = `{
  "mcpServers": {
    "pdfpixels": {
      "url": "https://www.pdfpixels.com/api/mcp"
    }
  }
}`;

const A2UI_CURL_SNIPPET = `curl -X POST https://www.pdfpixels.com/api/a2ui \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/a2ui+json" \\
  -d '{
    "intent": "recommend_workflow",
    "task": "compress pdf under 2mb for uscis",
    "a2uiRendererCapabilities": {
      "1.0": {
        "supportedCatalogIds": [
          "https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json"
        ]
      }
    }
  }'`;

const RENDERER_CAPABILITIES = {
  [A2UI_PROTOCOL_VERSION]: {
    supportedCatalogIds: [A2UI_BASIC_CATALOG_ID],
  },
};

type ViewTab = 'rendered' | 'a2ui-json' | 'raw-response';

export function McpInteractiveHub() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [query, setQuery] = useState('compress pdf under 2mb uscis');
  const [a2uiMessages, setA2uiMessages] = useState<AgentToRendererMessage[]>([]);
  const [rpcOutput, setRpcOutput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ViewTab>('rendered');
  const [activeEndpointLabel, setActiveEndpointLabel] = useState<string>('POST /api/a2ui');
  const [lastActionEnvelope, setLastActionEnvelope] = useState<ActionMessage | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleCopy = async (text: string, id: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(id);
      toast.success(`${label} copied to clipboard`);
      window.setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error('Clipboard permission denied');
    }
  };

  const runA2uiRequest = useCallback(async (payload: Record<string, unknown>) => {
    setIsTesting(true);
    setActiveEndpointLabel('POST /api/a2ui');
    try {
      const res = await fetch('/api/a2ui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          a2uiRendererCapabilities: RENDERER_CAPABILITIES,
        }),
      });
      const json = (await res.json()) as {
        messages?: AgentToRendererMessage[];
        error?: string;
      };
      setRpcOutput(JSON.stringify(json, null, 2));
      if (Array.isArray(json.messages)) {
        setA2uiMessages(json.messages);
        setActiveTab('rendered');
      } else {
        setActiveTab('raw-response');
      }
    } catch (err) {
      setRpcOutput(
        JSON.stringify(
          { error: err instanceof Error ? err.message : 'Request failed' },
          null,
          2,
        ),
      );
      setActiveTab('raw-response');
    } finally {
      setIsTesting(false);
    }
  }, []);

  const runRpcTest = async (method: string, params: Record<string, unknown>) => {
    setIsTesting(true);
    setActiveEndpointLabel('POST /api/mcp');
    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
      });
      const json = (await res.json()) as {
        result?: {
          content?: Array<{
            type?: string;
            resource?: { mimeType?: string; text?: string };
          }>;
        };
      };
      setRpcOutput(JSON.stringify(json, null, 2));

      const embeddedA2ui = json.result?.content?.find(
        (item) =>
          item.type === 'resource' &&
          item.resource?.mimeType === 'application/a2ui+json' &&
          typeof item.resource.text === 'string',
      );
      if (embeddedA2ui?.resource?.text) {
        const parsed = JSON.parse(embeddedA2ui.resource.text) as AgentToRendererMessage[];
        if (Array.isArray(parsed)) {
          setA2uiMessages(parsed);
          setActiveTab('rendered');
          return;
        }
      }
      setActiveTab('raw-response');
    } catch (err) {
      setRpcOutput(
        JSON.stringify(
          { error: err instanceof Error ? err.message : 'Request failed' },
          null,
          2,
        ),
      );
      setActiveTab('raw-response');
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    void runA2uiRequest({ intent: 'search_tools', query: 'compress pdf under 2mb uscis' });
  }, [runA2uiRequest]);

  const handleSurfaceAction = useCallback(
    async (envelope: ActionMessage) => {
      setLastActionEnvelope(envelope);
      await runA2uiRequest(envelope as unknown as Record<string, unknown>);
    },
    [runA2uiRequest],
  );

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="section-panel rounded-[1.75rem] border border-border/50 bg-card/85 p-6 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-foreground">
              Claude Desktop (<code>claude_desktop_config.json</code>)
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void handleCopy(CLAUDE_CONFIG, 'claude', 'Claude Desktop MCP config')}
              className="h-8 gap-1.5 text-xs"
            >
              {copiedKey === 'claude' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              Copy
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100 font-mono">
            {CLAUDE_CONFIG}
          </pre>
        </div>

        <div className="section-panel rounded-[1.75rem] border border-border/50 bg-card/85 p-6 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-foreground">
              Cursor / Windsurf (<code>.cursor/mcp.json</code>)
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void handleCopy(CURSOR_CONFIG, 'cursor', 'Cursor MCP config')}
              className="h-8 gap-1.5 text-xs"
            >
              {copiedKey === 'cursor' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              Copy
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100 font-mono">
            {CURSOR_CONFIG}
          </pre>
        </div>
      </div>

      {/* Interactive Live Google A2UI v1.0 & MCP JSON-RPC 2.0 Studio */}
      <div className="section-panel rounded-[1.75rem] border border-border/50 bg-card/85 p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Live Google A2UI v1.0 &amp; MCP Inspector
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono text-[11px]">
              {activeEndpointLabel}
            </Badge>
            <Badge
              variant="outline"
              className="font-mono text-[11px] border-primary/30 text-primary"
            >
              A2UI v{A2UI_PROTOCOL_VERSION}
            </Badge>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Query PdfPixels over <code className="font-mono text-foreground">/api/a2ui</code> or{' '}
          <code className="font-mono text-foreground">/api/mcp</code> to stream declarative{' '}
          <strong>Google A2UI v1.0</strong> surfaces rendered live with{' '}
          <code className="font-mono text-foreground">@a2ui/react</code> and{' '}
          <code className="font-mono text-foreground">@a2ui/web_core</code>. Click{' '}
          <em>Inspect Details</em> or <em>View Limits &amp; Privacy</em> inside any rendered card to
          trigger a live client-to-agent A2UI v1.0 <code className="font-mono">ActionMessage</code>{' '}
          round-trip.
        </p>

        <div className="flex flex-wrap gap-2 items-center">
          <label htmlFor="mcp-a2ui-query" className="sr-only">
            Document or image workflow query
          </label>
          <Input
            id="mcp-a2ui-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Query e.g. shrink pdf for court pacer"
            className="flex-1 min-w-[240px] h-9 text-xs"
          />
          <Button
            size="sm"
            disabled={isTesting}
            onClick={() => void runA2uiRequest({ intent: 'search_tools', query })}
            className="gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            A2UI Search
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isTesting}
            onClick={() => void runA2uiRequest({ intent: 'recommend_workflow', task: query })}
          >
            A2UI Workflow
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isTesting}
            onClick={() => void runA2uiRequest({ intent: 'get_platform_limits' })}
          >
            Limits (Tabs)
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isTesting}
            onClick={() =>
              void runRpcTest('tools/call', {
                name: 'render_a2ui_surface',
                arguments: { intent: 'search_tools', query },
              })
            }
          >
            MCP + A2UI
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isTesting}
            onClick={() => void runRpcTest('tools/list', {})}
          >
            MCP tools/list
          </Button>
        </div>

        {/* View switcher */}
        <div
          role="tablist"
          aria-label="A2UI and MCP response views"
          className="flex flex-wrap items-center gap-2 border-b border-border/50 pb-3"
        >
          <Button
            type="button"
            role="tab"
            aria-selected={activeTab === 'rendered'}
            size="sm"
            variant={activeTab === 'rendered' ? 'default' : 'ghost'}
            className="h-8 gap-1.5 text-xs"
            onClick={() => setActiveTab('rendered')}
          >
            <Layers className="w-3.5 h-3.5" />
            Rendered A2UI v1.0 Surface
          </Button>
          <Button
            type="button"
            role="tab"
            aria-selected={activeTab === 'a2ui-json'}
            size="sm"
            variant={activeTab === 'a2ui-json' ? 'default' : 'ghost'}
            className="h-8 gap-1.5 text-xs"
            onClick={() => setActiveTab('a2ui-json')}
          >
            <Code2 className="w-3.5 h-3.5" />
            A2UI v1.0 Wire JSON ({a2uiMessages.length})
          </Button>
          <Button
            type="button"
            role="tab"
            aria-selected={activeTab === 'raw-response'}
            size="sm"
            variant={activeTab === 'raw-response' ? 'default' : 'ghost'}
            className="h-8 gap-1.5 text-xs"
            onClick={() => setActiveTab('raw-response')}
          >
            <Terminal className="w-3.5 h-3.5" />
            Raw HTTP / JSON-RPC
          </Button>
        </div>

        {activeTab === 'rendered' && (
          <div className="space-y-4">
            <A2uiSurfaceRenderer
              messages={a2uiMessages}
              onActionEnvelope={handleSurfaceAction}
            />
            {lastActionEnvelope && (
              <div className="rounded-xl border border-border/50 bg-muted/40 p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-foreground">
                  <span>Last Outbound A2UI v1.0 Client ActionMessage</span>
                  <span className="font-mono text-primary">{lastActionEnvelope.action.name}</span>
                </div>
                <pre className="max-h-40 overflow-auto rounded-lg bg-slate-950 p-3 text-[11px] text-sky-300 font-mono">
                  {JSON.stringify(lastActionEnvelope, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {activeTab === 'a2ui-json' && (
          <pre className="max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-sky-300 font-mono">
            {a2uiMessages.length > 0
              ? JSON.stringify(a2uiMessages, null, 2)
              : '// Trigger an A2UI surface action above to inspect the v1.0 wire envelope.'}
          </pre>
        )}

        {activeTab === 'raw-response' && (
          <pre className="max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-emerald-300 font-mono">
            {rpcOutput || '// Trigger an MCP or A2UI request above to inspect the raw response.'}
          </pre>
        )}
      </div>

      {/* Direct A2UI v1.0 cURL / A2A Snippet */}
      <div className="section-panel rounded-[1.75rem] border border-border/50 bg-card/85 p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-foreground">
              Direct Google A2UI v1.0 Surface Request (<code>application/a2ui+json</code>)
            </h2>
            <p className="text-xs text-muted-foreground">
              Capability-negotiated endpoint advertised via{' '}
              <code className="font-mono">/.well-known/agent.json</code> extension{' '}
              <code className="font-mono">https://a2ui.org/a2a-extension/a2ui/v1.0</code>.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void handleCopy(A2UI_CURL_SNIPPET, 'a2ui-curl', 'A2UI v1.0 cURL snippet')}
            className="h-8 gap-1.5 text-xs"
          >
            {copiedKey === 'a2ui-curl' ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            Copy cURL
          </Button>
        </div>
        <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100 font-mono">
          {A2UI_CURL_SNIPPET}
        </pre>
      </div>
    </div>
  );
}
