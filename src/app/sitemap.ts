import { MetadataRoute } from 'next';
import { allTools } from '@/lib/tools-data';
import { getAllBlogPosts } from '@/config/blog';
import { useCasePages } from '@/lib/use-cases';
import { comparisonPages } from '@/lib/comparisons';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.pdfpixels.com';
  const now = new Date();

  // Core pages — highest priority
  const corePages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/api-docs`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Legal pages
  const legalPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/disclaimer`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/dmca`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Tool pages — dynamically generated from tools-data
  const toolPages: MetadataRoute.Sitemap = allTools.map((tool) => ({
    url: `${baseUrl}/tools/${tool.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: (tool.popular || tool.isAI) ? 0.9 : 0.8,
  }));

  // Blog pages
  const blogPosts = getAllBlogPosts();
  const blogPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];

  const useCaseEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/use-cases`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    ...useCasePages.map((u) => ({
      url: `${baseUrl}/use-cases/${u.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.72,
    })),
  ];

  const comparisonEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/compare`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...comparisonPages.map((c) => ({
      url: `${baseUrl}/compare/${c.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.68,
    })),
  ];

  return [...corePages, ...toolPages, ...useCaseEntries, ...comparisonEntries, ...blogPages, ...legalPages];
}
