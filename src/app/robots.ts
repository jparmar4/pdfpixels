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
        allow: '/',
        disallow: ['/api/', '/_next/', '/_static/'],
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
    ],
    sitemap: [`${siteConfig.url}/sitemap.xml`, `${siteConfig.url}/image-sitemap.xml`],
    host,
  };
}
