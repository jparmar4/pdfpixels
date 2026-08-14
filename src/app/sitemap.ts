import { MetadataRoute } from 'next';
import { getAllBlogPosts } from '@/config/blog';
import { comparisonPages } from '@/lib/comparisons';
import { SITE_CONTENT_UPDATED, absoluteUrl } from '@/lib/seo';
import { allTools, toolCategories } from '@/lib/tools-data';
import { useCasePages } from '@/lib/use-cases';
import { geoRegions } from '@/lib/geo-data';

export default function sitemap(): MetadataRoute.Sitemap {
  const evergreen = SITE_CONTENT_UPDATED;
  const blogPosts = getAllBlogPosts();
  const latestBlogDate = blogPosts[0] && !Number.isNaN(Date.parse(blogPosts[0].date))
    ? new Date(blogPosts[0].date)
    : evergreen;

  const corePages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/'),
      lastModified: evergreen,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: absoluteUrl('/tools'),
      lastModified: evergreen,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: absoluteUrl('/about'),
      lastModified: evergreen,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: absoluteUrl('/blog'),
      lastModified: latestBlogDate,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: absoluteUrl('/use-cases'),
      lastModified: evergreen,
      changeFrequency: 'weekly',
      priority: 0.78,
    },
    {
      url: absoluteUrl('/compare'),
      lastModified: evergreen,
      changeFrequency: 'weekly',
      priority: 0.74,
    },
    {
      url: absoluteUrl('/pricing'),
      lastModified: evergreen,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: absoluteUrl('/api-docs'),
      lastModified: evergreen,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: absoluteUrl('/contact'),
      lastModified: evergreen,
      changeFrequency: 'monthly',
      priority: 0.55,
    },
  ];

  const legalPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/privacy'),
      lastModified: evergreen,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: absoluteUrl('/terms'),
      lastModified: evergreen,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: absoluteUrl('/disclaimer'),
      lastModified: evergreen,
      changeFrequency: 'yearly',
      priority: 0.25,
    },
    {
      url: absoluteUrl('/dmca'),
      lastModified: evergreen,
      changeFrequency: 'yearly',
      priority: 0.25,
    },
  ];

  const toolPages: MetadataRoute.Sitemap = allTools.map((tool) => ({
    url: absoluteUrl(`/tools/${tool.slug}`),
    lastModified: evergreen,
    changeFrequency: 'weekly' as const,
    priority: tool.popular || tool.isAI ? 0.9 : 0.8,
  }));

  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: Number.isNaN(Date.parse(post.date)) ? evergreen : new Date(post.date),
    changeFrequency: 'weekly' as const,
    priority: 0.78,
  }));

  const useCaseEntries: MetadataRoute.Sitemap = useCasePages.map((useCase) => ({
    url: absoluteUrl(`/use-cases/${useCase.slug}`),
    lastModified: evergreen,
    changeFrequency: 'weekly' as const,
    priority: 0.72,
  }));

  const comparisonEntries: MetadataRoute.Sitemap = comparisonPages.map((comparison) => ({
    url: absoluteUrl(`/compare/${comparison.slug}`),
    lastModified: evergreen,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const geoEntries: MetadataRoute.Sitemap = geoRegions.map((region) => ({
    url: absoluteUrl(`/${region.code}`),
    lastModified: evergreen,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const categoryEntries: MetadataRoute.Sitemap = toolCategories.map((category) => ({
    url: absoluteUrl(`/tools/category/${category.id}`),
    lastModified: evergreen,
    changeFrequency: 'weekly' as const,
    priority: 0.82,
  }));

  return [
    ...corePages,
    ...geoEntries,
    ...categoryEntries,
    ...toolPages,
    ...useCaseEntries,
    ...comparisonEntries,
    ...blogPages,
    ...legalPages,
  ];
}
