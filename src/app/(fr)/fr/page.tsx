import type { Metadata } from 'next';
import { RegionPageView, regionMetadata } from '@/components/seo/region-page-view';

export const metadata: Metadata = regionMetadata('fr');

export default function FrHubPage() {
  return <RegionPageView regionCode="fr" />;
}
