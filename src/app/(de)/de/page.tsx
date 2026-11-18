import type { Metadata } from 'next';
import { RegionPageView, regionMetadata } from '@/components/seo/region-page-view';

export const metadata: Metadata = regionMetadata('de');

export default function DeHubPage() {
  return <RegionPageView regionCode="de" />;
}
