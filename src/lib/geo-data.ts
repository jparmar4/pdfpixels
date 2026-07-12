export interface GeoRegion {
  code: string;
  name: string;
  adjective: string;
  locale: string;
  localCopy: string;
}

export const geoRegions: GeoRegion[] = [
  { code: 'us', name: 'United States', adjective: 'US', locale: 'en-US', localCopy: 'trusted across the USA' },
  { code: 'uk', name: 'United Kingdom', adjective: 'UK', locale: 'en-GB', localCopy: 'trusted across the UK' },
  { code: 'ca', name: 'Canada', adjective: 'Canadian', locale: 'en-CA', localCopy: 'trusted across Canada' },
  { code: 'au', name: 'Australia', adjective: 'Australian', locale: 'en-AU', localCopy: 'trusted across Australia' },
  { code: 'in', name: 'India', adjective: 'Indian', locale: 'en-IN', localCopy: 'trusted across India' },
];

export function getRegionByCode(code: string): GeoRegion | undefined {
  return geoRegions.find((r) => r.code === code.toLowerCase());
}
