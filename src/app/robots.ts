import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/seo-config';

export default function robots(): MetadataRoute.Robots {
  const host = siteConfig.url.replace(/^https?:\/\//, '');

  return {
    rules: [
      {
        userAgent: 'Mediapartners-Google',
        allow: '/',
      },
      {
        userAgent: '*',
        // /_next/static/ (JS/CSS bundles) and /_next/image/ (optimized images)
        // must stay fetchable — blocking them breaks Googlebot rendering, and
        // rendering failures surface as indexing problems in Search Console.
        allow: ['/', '/_next/static/', '/_next/image/'],
        disallow: ['/api/', '/_next/data/', '/_static/'],
      },
      // Answer-engine / training crawlers: all public pages, not only llms.txt
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Anthropic-ai',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Applebot-Extended',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Meta-ExternalAgent',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Bytespider',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'MistralAI-User',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'DuckAssistBot',
        allow: '/',
        disallow: ['/api/'],
      },
      // Live-fetch agents: fetch pages on behalf of a user query. Blocking
      // these loses citations even when the index crawler is allowed.
      {
        userAgent: 'Perplexity-User',
        allow: '/',
        disallow: ['/api/'],
      },
      // Additional index/training crawlers feeding AI answer engines.
      {
        userAgent: 'CCBot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'YouBot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Amazonbot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Google-CloudVertexBot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Meta-WebIndexer',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Diffbot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Cohere-ai',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'iaskspider',
        allow: '/',
        disallow: ['/api/'],
      },
      // 2026 additions: search-grounding crawlers (Copilot grounds on Bing's
      // index, Siri/Apple Intelligence on Applebot, Huawei Petal on PetalBot),
      // remaining live-fetch agents, and dataset crawlers used by model
      // providers. The `*` rule already admits these — explicit entries
      // document intent and survive future default changes.
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'YandexBot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Applebot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Claude-SearchBot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Claude-User',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'GoogleOther',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Meta-ExternalFetcher',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'MistralAI-Training',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'PanguBot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'PetalBot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Omgilibot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Omgili',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Imagesift',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Timpibot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'VelenPublicWebCrawler',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Cotoyogi',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'AI2Bot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'AI2Bot-Dolma',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: [`${siteConfig.url}/sitemap.xml`, `${siteConfig.url}/image-sitemap.xml`],
    host,
  };
}
