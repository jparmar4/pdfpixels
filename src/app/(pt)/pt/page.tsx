import type { Metadata } from 'next';
import { RegionPageView, regionMetadata } from '@/components/seo/region-page-view';

export const metadata: Metadata = regionMetadata('pt');

export default function PtHubPage() {
  return <RegionPageView regionCode="pt" />;
}
