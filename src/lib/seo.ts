import { geoRegions } from '@/lib/geo-data';
import { allTools } from '@/lib/tools-data';

export const SITE_URL = 'https://www.pdfpixels.com';
export const DEFAULT_OG_IMAGE_PATH = '/opengraph-image';
export const DEFAULT_OG_IMAGE_URL = `${SITE_URL}${DEFAULT_OG_IMAGE_PATH}`;
/** Stable sitemap lastmod for evergreen pages — do not use `new Date()` per request.
 *  Bump this only when evergreen pages (home/tools/use-cases) actually change,
 *  so lastmod stays truthful for crawlers. */
export const SITE_CONTENT_UPDATED = new Date('2026-08-16T00:00:00.000Z');

export function organizationId() {
  return `${SITE_URL}/#organization`;
}

export function websiteId() {
  return `${SITE_URL}/#website`;
}

/** Shared hreflang cluster: homepage is x-default, geo hubs are locale targets. */
export function getGeoLanguageAlternates(): Record<string, string> {
  const languages: Record<string, string> = {
    'x-default': '/',
  };
  for (const region of geoRegions) {
    languages[region.locale] = `/${region.code}`;
  }
  return languages;
}

const homepageFeaturedToolIds = [
  'compress',
  'resize',
  'remove-background',
  'passport-photo',
  'image-to-pdf',
  'pdf-merge',
  'pdf-split',
] as const;

export function absoluteUrl(path = '/') {
  if (!path || path === '/') {
    return SITE_URL;
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function dedupeKeywords(keywords: string[]) {
  return Array.from(
    new Set(
      keywords
        .map((keyword) => keyword.trim())
        .filter(Boolean)
        .map((keyword) => keyword.toLowerCase())
    )
  );
}

export function getHomepageFeaturedTools() {
  return homepageFeaturedToolIds
    .map((id) => allTools.find((tool) => tool.id === id))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));
}

export function getSiteSearchUrlTemplate() {
  return `${SITE_URL}/tools?q={search_term_string}`;
}
