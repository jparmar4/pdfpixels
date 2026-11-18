import type { Metadata } from 'next';
import { geoRegions } from '@/lib/geo-data';
import { RegionPageView, regionMetadata } from '@/components/seo/region-page-view';

const DEDICATED_LOCALE_CODES = new Set(['es', 'fr', 'de', 'pt', 'jp']);

export const dynamicParams = false;

export function generateStaticParams() {
  return geoRegions
    .filter((region) => !DEDICATED_LOCALE_CODES.has(region.code))
    .map((region) => ({
      region: region.code,
    }));
}

interface GeoPageProps {
  params: Promise<{ region: string }>;
}

export async function generateMetadata({ params }: GeoPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  return regionMetadata(resolvedParams.region);
}

export default async function GeoHubPage({ params }: GeoPageProps) {
  const resolvedParams = await params;
  return <RegionPageView regionCode={resolvedParams.region} />;
}
