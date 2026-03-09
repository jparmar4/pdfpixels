import { allTools } from '@/lib/tools-data';

export const SITE_URL = 'https://www.pdfpixels.com';
export const DEFAULT_OG_IMAGE_PATH = '/opengraph-image';
export const DEFAULT_OG_IMAGE_URL = `${SITE_URL}${DEFAULT_OG_IMAGE_PATH}`;

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
  return `${SITE_URL}/?search={search_term_string}`;
}
