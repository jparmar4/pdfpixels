import { NextResponse } from 'next/server';

const BASE_URL = 'https://www.pdfpixels.com';

const SEARCH_AND_AI_RETRIEVAL_BOTS = [
  // Search Engine & Google Discover Crawlers
  'Googlebot',
  'Googlebot-Image',
  'Googlebot-Mobile',
  'Googlebot-News',
  'Googlebot-Video',
  'Google-InspectionTool',
  'FeedFetcher-Google',
  'GoogleProducer',
  'Google-Read-Aloud',
  'Google-Safety',
  'Storebot-Google',
  'AdsBot-Google',
  'AdsBot-Google-Mobile',
  'GoogleOther',
  'Google-Extended',
  'Google-CloudVertexBot',
  'Bingbot',
  'BingPreview',
  'Slurp',
  'DuckDuckBot',
  'DuckAssistBot',
  'Bravebot',
  'Baiduspider',
  'YandexBot',
  'Sogou',
  'Exabot',
  'PetalBot',
  'Yeti',
  'SeznamBot',
  'facebot',
  'ia_archiver',
  'Applebot',
  'Applebot-Extended',
  'Amazonbot',
  // AI Search & Live User-Fetch Crawlers (AEO / GEO retrieval — allowed)
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'Claude-Web',
  'PerplexityBot',
  'Perplexity-User',
  'meta-webindexer',
  'Meta-ExternalFetcher',
  'FacebookBot',
  'YouBot',
  'MistralAI-User',
  'GrokBot',
  'xAI-Bot',
  'DeepSeekBot',
  'PhindBot',
];

// Dedicated model-training crawlers — disallowed to align with Content-Signal: ai-train=no
// (Google-Extended and Applebot-Extended are allowed above so Gemini & Apple Intelligence can ground & cite PdfPixels)
const AI_TRAINING_BOTS = [
  'GPTBot',
  'ClaudeBot',
  'anthropic-ai',
  'Meta-ExternalAgent',
  'CCBot',
  'Bytespider',
  'cohere-ai',
  'Diffbot',
];

export const dynamic = 'force-static';

export async function GET() {
  const lines: string[] = [
    '# PdfPixels robots.txt — Search, Answer Engine (AEO), Generative Engine (GEO) & Agent Discovery',
    '# As a condition of accessing this website, you agree to abide by the following',
    '# content signals (https://contentsignals.org/):',
    '# (a) If a Content-Signal = yes, you may collect content for the corresponding use.',
    '# (b) If a Content-Signal = no, you may not collect content for the corresponding use.',
    '# (c) If a Content-Signal is not specified for a given use, no permission is granted.',
    '',
    'User-Agent: Mediapartners-Google',
    'Allow: /',
    '',
    'User-Agent: Google-AdSense-AutoAds',
    'Allow: /',
    '',
    'User-Agent: *',
    'Content-Signal: search=yes, ai-input=yes, ai-train=no',
    'Allow: /',
    'Allow: /_next/static/',
    'Allow: /_next/image',
    'Allow: /llms.txt',
    'Allow: /llms-full.txt',
    'Allow: /pricing.md',
    'Allow: /feed',
    'Allow: /api/mcp',
    'Allow: /api/a2ui',
    'Allow: /api/health',
    'Allow: /api/limits',
    'Allow: /.well-known/mcp/server-card.json',
    'Allow: /.well-known/mcp.json',
    'Allow: /.well-known/api-catalog',
    'Allow: /.well-known/agent.json',
    'Allow: /.well-known/ai-plugin.json',
    'Allow: /openapi.json',
    'Disallow: /api/',
    'Disallow: /private/',
    '',
  ];

  for (const bot of SEARCH_AND_AI_RETRIEVAL_BOTS) {
    lines.push(
      `User-Agent: ${bot}`,
      'Content-Signal: search=yes, ai-input=yes, ai-train=no',
      'Allow: /',
      'Allow: /_next/static/',
      'Allow: /_next/image',
      'Allow: /llms.txt',
      'Allow: /llms-full.txt',
      'Allow: /pricing.md',
      'Allow: /feed',
      'Allow: /api/mcp',
      'Allow: /api/a2ui',
      'Allow: /api/health',
      'Allow: /api/limits',
      'Allow: /openapi.json',
      'Disallow: /api/',
      'Disallow: /private/',
      ''
    );
  }

  for (const bot of AI_TRAINING_BOTS) {
    lines.push(
      `User-Agent: ${bot}`,
      'Content-Signal: search=no, ai-input=no, ai-train=no',
      'Disallow: /',
      ''
    );
  }

  lines.push(
    `Sitemap: ${BASE_URL}/sitemap.xml`,
    `Sitemap: ${BASE_URL}/image-sitemap.xml`,
    `Host: www.pdfpixels.com`,
    ''
  );

  return new NextResponse(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Signal': 'search=yes, ai-input=yes, ai-train=no',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
