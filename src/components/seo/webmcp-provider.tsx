const WEBMCP_INIT_SCRIPT = `(function(){
  function registerPdfPixelsWebMCP(){
    var mc = typeof navigator !== 'undefined' && navigator.modelContext;
    if (!mc || typeof mc.registerTool !== 'function' || window.__pdfpixelsWebMcpRegistered) return;
    window.__pdfpixelsWebMcpRegistered = true;
    var tools = [
      {
        name: 'search_pdfpixels_tools',
        description: 'Search PdfPixels free online PDF and image tools by keyword, file format, or workflow task.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query (e.g. compress pdf, merge pdf, ocr, heic to jpg, sign pdf)' }
          },
          required: ['query']
        },
        execute: async function(args) {
          var q = (args && args.query ? String(args.query) : '').trim();
          var res = await fetch('/api/mcp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'search_tools', arguments: { query: q } } })
          });
          var data = await res.json();
          return data && data.result ? data.result : { content: [{ type: 'text', text: 'Redirecting to /tools?q=' + encodeURIComponent(q) }] };
        }
      },
      {
        name: 'open_pdfpixels_tool',
        description: 'Navigate to a specific PdfPixels PDF or image tool workspace by its slug (e.g. compress-pdf, merge-pdf, pdf-to-word).',
        inputSchema: {
          type: 'object',
          properties: {
            slug: { type: 'string', description: 'Tool slug such as compress-pdf, merge-pdf, split-pdf, ocr-pdf, sign-pdf' }
          },
          required: ['slug']
        },
        execute: async function(args) {
          var slug = (args && args.slug ? String(args.slug) : 'compress-pdf').replace(/[^a-z0-9-]/gi, '').toLowerCase();
          var url = '/tools/' + slug;
          if (typeof window !== 'undefined') window.location.assign(url);
          return { content: [{ type: 'text', text: 'Opened tool at https://www.pdfpixels.com' + url }] };
        }
      },
      {
        name: 'get_pdfpixels_limits',
        description: 'Retrieve official PdfPixels file size limits, privacy retention policy, and processing capabilities.',
        inputSchema: {
          type: 'object',
          properties: {}
        },
        execute: async function() {
          var res = await fetch('/api/limits');
          var json = await res.json();
          return { content: [{ type: 'text', text: JSON.stringify(json) }] };
        }
      }
    ];
    for (var i = 0; i < tools.length; i++) {
      try { mc.registerTool(tools[i]); } catch (e) {}
    }
  }
  registerPdfPixelsWebMCP();
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', registerPdfPixelsWebMCP, { once: true });
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('load', registerPdfPixelsWebMCP, { once: true });
  }
})();`;

export function WebMCPRegistration() {
  return (
    <script
      id="pdfpixels-webmcp"
      dangerouslySetInnerHTML={{ __html: WEBMCP_INIT_SCRIPT }}
    />
  );
}
