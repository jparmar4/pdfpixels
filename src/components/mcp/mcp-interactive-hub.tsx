'use client';

import { useState } from 'react';
import { Check, Copy, Play, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

export function McpInteractiveHub() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [query, setQuery] = useState('compress pdf under 24mb uscis');
  const [rpcOutput, setRpcOutput] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(id);
      toast.success('MCP config copied to clipboard');
      window.setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error('Clipboard permission denied');
    }
  };

  const runRpcTest = async (method: string, params: Record<string, unknown>) => {
    setIsTesting(true);
    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
      });
      const json = await res.json();
      setRpcOutput(JSON.stringify(json, null, 2));
    } catch (err) {
      setRpcOutput(JSON.stringify({ error: err instanceof Error ? err.message : 'Request failed' }, null, 2));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="section-panel rounded-[1.75rem] border border-border/50 bg-card/85 p-6 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-foreground">Claude Desktop (`claude_desktop_config.json`)</span>
            <Button size="sm" variant="outline" onClick={() => void handleCopy(CLAUDE_CONFIG, 'claude')} className="h-8 gap-1.5 text-xs">
              {copiedKey === 'claude' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              Copy
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100 font-mono">{CLAUDE_CONFIG}</pre>
        </div>

        <div className="section-panel rounded-[1.75rem] border border-border/50 bg-card/85 p-6 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-foreground">Cursor / Windsurf (`.cursor/mcp.json`)</span>
            <Button size="sm" variant="outline" onClick={() => void handleCopy(CURSOR_CONFIG, 'cursor')} className="h-8 gap-1.5 text-xs">
              {copiedKey === 'cursor' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              Copy
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100 font-mono">{CURSOR_CONFIG}</pre>
        </div>
      </div>

      {/* Interactive Live JSON-RPC 2.0 Tester */}
      <div className="section-panel rounded-[1.75rem] border border-border/50 bg-card/85 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">Live MCP JSON-RPC 2.0 Inspector</h2>
          </div>
          <Badge variant="outline" className="font-mono text-[11px]">POST /api/mcp</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Query e.g. shrink pdf for court pacer"
            className="flex-1 min-w-[240px] h-9 text-xs"
          />
          <Button
            size="sm"
            disabled={isTesting}
            onClick={() => void runRpcTest('tools/call', { name: 'search_tools', arguments: { query } })}
            className="gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            search_tools
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isTesting}
            onClick={() => void runRpcTest('tools/call', { name: 'recommend_workflow', arguments: { task: query } })}
          >
            recommend_workflow
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isTesting}
            onClick={() => void runRpcTest('tools/list', {})}
          >
            tools/list
          </Button>
        </div>

        {rpcOutput && (
          <pre className="max-h-72 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-emerald-300 font-mono">
            {rpcOutput}
          </pre>
        )}
      </div>
    </div>
  );
}
