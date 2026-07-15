import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/seo-config';

export default function robots(): MetadataRoute.Robots {
  const host = siteConfig.url.replace(/^https?:\/\//, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/llms.txt', '/llms-full.txt', '/openapi.yaml', '/feed'],
        disallow: ['/api/', '/_next/', '/_static/'],
      },
      // Explicitly welcome major AI / answer-engine crawlers (AEO / GEO)
      {
        userAgent: 'GPTBot',
        allow: ['/', '/llms.txt', '/llms-full.txt', '/blog/', '/tools/', '/use-cases/', '/compare/'],
        disallow: ['/api/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/api/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', '/llms.txt', '/llms-full.txt', '/blog/', '/tools/'],
        disallow: ['/api/'],
      },
      {
        userAgent: 'Anthropic-ai',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/api/'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/api/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/llms.txt', '/llms-full.txt', '/blog/', '/tools/'],
        disallow: ['/api/'],
      },
      {
        userAgent: 'Applebot-Extended',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/api/'],
      },
    ],
    sitemap: [`${siteConfig.url}/sitemap.xml`, `${siteConfig.url}/image-sitemap.xml`],
    host,
  };
}
