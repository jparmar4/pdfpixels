import { MetadataRoute } from 'next';
import { getAllBlogPosts } from '@/config/blog';
import { comparisonPages } from '@/lib/comparisons';
import { absoluteUrl } from '@/lib/seo';
import { allTools, toolCategories } from '@/lib/tools-data';
import { useCasePages } from '@/lib/use-cases';
import { geoRegions } from '@/lib/geo-data';

export default function sitemap(): MetadataRoute.Sitemap {
  const defaultLastModified = new Date('2024-05-20T00:00:00Z');
  const blogPosts = getAllBlogPosts();

  const corePages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/'),
      lastModified: defaultLastModified,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: absoluteUrl('/about'),
      lastModified: defaultLastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: absoluteUrl('/blog'),
      lastModified: blogPosts[0] ? new Date(blogPosts[0].date) : defaultLastModified,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: absoluteUrl('/use-cases'),
      lastModified: defaultLastModified,
      changeFrequency: 'weekly',
      priority: 0.78,
    },
    {
      url: absoluteUrl('/compare'),
      lastModified: defaultLastModified,
      changeFrequency: 'weekly',
      priority: 0.74,
    },
    {
      url: absoluteUrl('/api-docs'),
      lastModified: defaultLastModified,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: absoluteUrl('/contact'),
      lastModified: defaultLastModified,
      changeFrequency: 'monthly',
      priority: 0.55,
    },
  ];

  const legalPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/privacy'),
      lastModified: defaultLastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: absoluteUrl('/terms'),
      lastModified: defaultLastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: absoluteUrl('/disclaimer'),
      lastModified: defaultLastModified,
      changeFrequency: 'yearly',
      priority: 0.25,
    },
    {
      url: absoluteUrl('/dmca'),
      lastModified: defaultLastModified,
      changeFrequency: 'yearly',
      priority: 0.25,
    },
  ];

  const toolPages: MetadataRoute.Sitemap = allTools.map((tool) => ({
    url: absoluteUrl(`/tools/${tool.slug}`),
    lastModified: defaultLastModified,
    changeFrequency: 'weekly' as const,
    priority: tool.popular || tool.isAI ? 0.9 : 0.8,
  }));

  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: Number.isNaN(Date.parse(post.date)) ? defaultLastModified : new Date(post.date),
    changeFrequency: 'weekly' as const,
    priority: 0.78,
  }));

  const useCaseEntries: MetadataRoute.Sitemap = useCasePages.map((useCase) => ({
    url: absoluteUrl(`/use-cases/${useCase.slug}`),
    lastModified: defaultLastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.72,
  }));

  const comparisonEntries: MetadataRoute.Sitemap = comparisonPages.map((comparison) => ({
    url: absoluteUrl(`/compare/${comparison.slug}`),
    lastModified: defaultLastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const geoEntries: MetadataRoute.Sitemap = geoRegions.map((region) => ({
    url: absoluteUrl(`/${region.code}`),
    lastModified: defaultLastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  const categoryEntries: MetadataRoute.Sitemap = toolCategories.map((category) => ({
    url: absoluteUrl(`/tools/category/${category.id}`),
    lastModified: defaultLastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.82,
  }));

  return [...corePages, ...geoEntries, ...categoryEntries, ...toolPages, ...useCaseEntries, ...comparisonEntries, ...blogPages, ...legalPages];
}
