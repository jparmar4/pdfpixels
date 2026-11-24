import { MetadataRoute } from 'next';
import { getAllBlogPosts, getAllBlogCategories, consolidatedBlogSlugs } from '@/config/blog';
import { templates } from '@/lib/templates';
import { glossaryTerms } from '@/lib/glossary';
import { comparisonPages } from '@/lib/comparisons';
import { ADSENSE_REVIEW_MODE, SITE_CONTENT_UPDATED, absoluteUrl, getGeoSitemapAlternates } from '@/lib/seo';
import { allTools, toolCategories } from '@/lib/tools-data';
import { useCasePages } from '@/lib/use-cases';
import { geoRegions } from '@/lib/geo-data';
import { localizedSitemapEntries, toolSitemapAlternates } from '@/lib/localized-tools';
import { INDIAN_EXAM_PRESETS } from '@/lib/indian-exams-data';
import { WORKFLOW_RECIPES } from '@/lib/workflow-recipes';

export default function sitemap(): MetadataRoute.Sitemap {
  const evergreen = SITE_CONTENT_UPDATED;
  const blogPosts = getAllBlogPosts();
  const latestBlogDate = blogPosts.reduce((latest, post) => {
    const raw = post.dateModified ?? post.date;
    const parsed = Date.parse(raw);
    if (Number.isNaN(parsed)) return latest;
    const d = new Date(parsed);
    return d > latest ? d : latest;
  }, evergreen);

  const geoAlternates = getGeoSitemapAlternates();

  const corePages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/'),
      lastModified: evergreen,
      changeFrequency: 'daily',
      priority: 1,
      alternates: geoAlternates,
    },
    {
      url: absoluteUrl('/tools'),
      lastModified: evergreen,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: absoluteUrl('/pdf-tools'),
      lastModified: evergreen,
      changeFrequency: 'daily',
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
      url: absoluteUrl('/mcp'),
      lastModified: evergreen,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: absoluteUrl('/brand'),
      lastModified: evergreen,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: absoluteUrl('/research/pdf-size-limits-2026'),
      lastModified: evergreen,
      changeFrequency: 'monthly',
      priority: 0.72,
    },
    {
      url: absoluteUrl('/research/compression-benchmark-2026'),
      lastModified: evergreen,
      changeFrequency: 'monthly',
      priority: 0.72,
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
    alternates: toolSitemapAlternates(tool.slug),
  }));

  const blogPages: MetadataRoute.Sitemap = blogPosts
    .filter((post) => !consolidatedBlogSlugs.has(post.slug))
    .map((post) => {
      const rawDate = post.dateModified ?? post.date;
      return {
        url: absoluteUrl(`/blog/${post.slug}`),
        lastModified: Number.isNaN(Date.parse(rawDate)) ? evergreen : new Date(rawDate),
        changeFrequency: 'weekly' as const,
        priority: 0.82,
      };
    });

  // Topic index pages — crawl depth for the blog's category architecture
  const blogCategoryEntries: MetadataRoute.Sitemap = getAllBlogCategories().map((cat) => ({
    url: absoluteUrl(`/blog/category/${cat.slug}`),
    lastModified: evergreen,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Downloadable template pages + glossary knowledge hub
  const templateEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/templates'), priority: 0.75 },
    ...templates.map((t) => ({ url: absoluteUrl(`/templates/${t.slug}`), priority: 0.65 })),
  ].map((e) => ({
    ...e,
    lastModified: evergreen,
    changeFrequency: 'monthly' as const,
  }));

  const glossaryEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/glossary'), priority: 0.7 },
    ...glossaryTerms.map((t) => ({ url: absoluteUrl(`/glossary/${t.slug}`), priority: 0.55 })),
  ].map((e) => ({
    ...e,
    lastModified: evergreen,
    changeFrequency: 'monthly' as const,
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

  const categoryEntries: MetadataRoute.Sitemap = toolCategories.map((category) => ({
    url: absoluteUrl(`/tools/category/${category.id}`),
    lastModified: evergreen,
    changeFrequency: 'weekly' as const,
    priority: 0.82,
  }));

  // Locale-targeted geo hubs. Each carries a unique regional hero, local
  // tips, and regional FAQ, and declares the full hreflang cluster.
  const geoEntries: MetadataRoute.Sitemap = geoRegions.map((region) => ({
    url: absoluteUrl(`/${region.code}`),
    lastModified: evergreen,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
    alternates: geoAlternates,
  }));

  const indianExamEntries: MetadataRoute.Sitemap = INDIAN_EXAM_PRESETS.map((exam) => ({
    url: absoluteUrl(`/in/${exam.slug}`),
    lastModified: evergreen,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  const workflowEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/workflows'),
      lastModified: evergreen,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    ...WORKFLOW_RECIPES.map((recipe) => ({
      url: absoluteUrl(`/workflows/${recipe.slug}`),
      lastModified: evergreen,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),
  ];

  // AdSense-review freeze: while ADSENSE_REVIEW_MODE is true, geo hubs,
  // comparison pages, and localized packs stay noindexed and out of the
  // sitemap so Google's review crawlers evaluate only primary, high-density
  // pages. Flipping the flag restores all three groups (with full hreflang
  // alternates on the localized entries) without further edits.
  return [
    ...corePages,
    ...workflowEntries,
    ...categoryEntries,
    ...toolPages,
    ...useCaseEntries,
    ...blogPages,
    ...blogCategoryEntries,
    ...templateEntries,
    ...glossaryEntries,
    ...legalPages,
    ...indianExamEntries,
    ...(ADSENSE_REVIEW_MODE
      ? []
      : [{ url: absoluteUrl('/compare'), lastModified: evergreen, changeFrequency: 'weekly' as const, priority: 0.74 }, ...comparisonEntries, ...geoEntries, ...localizedSitemapEntries()]),
  ];
}
