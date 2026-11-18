import type { Metadata } from 'next';
import { RegionPageView, regionMetadata } from '@/components/seo/region-page-view';

export const metadata: Metadata = regionMetadata('es');

export default function EsHubPage() {
  return <RegionPageView regionCode="es" />;
}
