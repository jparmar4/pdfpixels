import { NextResponse } from 'next/server';

const BASE_URL = 'https://www.pdfpixels.com';

const AI_AND_SEARCH_BOTS = [
  // Search Engine Crawlers
  'Googlebot',
  'Googlebot-Image',
  'Googlebot-Mobile',
  'Bingbot',
  'Slurp',
  'DuckDuckBot',
  'Baiduspider',
  'YandexBot',
  'Sogou',
  'Exabot',
  'facebot',
  'ia_archiver',
  // AI & Answer Engine Crawlers (AEO / GEO)
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'Google-Extended',
  'GoogleOther',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Applebot',
  'Applebot-Extended',
  'Amazonbot',
  'YouBot',
  'CCBot',
  'Meta-ExternalAgent',
  'Meta-ExternalFetcher',
  'FacebookBot',
  'cohere-ai',
  'MistralAI-User',
  'Bytespider',
  'Diffbot',
  'PhindBot',
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
    'Allow: /llms.txt',
    'Allow: /llms-full.txt',
    'Allow: /api/mcp',
    'Allow: /.well-known/mcp/server-card.json',
    'Allow: /.well-known/mcp.json',
    'Allow: /.well-known/api-catalog',
    'Allow: /.well-known/agent.json',
    'Allow: /.well-known/ai-plugin.json',
    'Allow: /openapi.json',
    'Disallow: /api/',
    'Disallow: /_next/',
    'Disallow: /private/',
    '',
  ];

  for (const bot of AI_AND_SEARCH_BOTS) {
    lines.push(
      `User-Agent: ${bot}`,
      'Content-Signal: search=yes, ai-input=yes, ai-train=no',
      'Allow: /',
      'Allow: /llms.txt',
      'Allow: /llms-full.txt',
      'Allow: /api/mcp',
      'Allow: /openapi.json',
      'Disallow: /api/',
      'Disallow: /private/',
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
