import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/api/', '/_static/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Yandex',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Baiduspider',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/api/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/api/'],
      },
      {
        userAgent: 'OAI-SearchBot',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/api/'],
      },
      {
        userAgent: 'Google-Extended',
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
        userAgent: 'Applebot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Applebot-Extended',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'meta-externalagent',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'FacebookBot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Amazonbot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'YouBot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'PhindBot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'iaskspider',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'cohere-ai',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'CCBot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Bytespider',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: ['https://www.pdfpixels.com/sitemap.xml', 'https://www.pdfpixels.com/image-sitemap.xml'],
    host: 'www.pdfpixels.com',
  };
}
