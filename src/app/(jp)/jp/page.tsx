import type { Metadata } from 'next';
import { RegionPageView, regionMetadata } from '@/components/seo/region-page-view';

export const metadata: Metadata = regionMetadata('jp');

export default function JpHubPage() {
  return <RegionPageView regionCode="jp" />;
}
