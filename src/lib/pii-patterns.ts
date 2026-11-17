export type PiiCategory =
  | 'ssn'
  | 'ein'
  | 'card'
  | 'phone'
  | 'email'
  | 'iban'
  | 'aadhaar'
  | 'pan';

export interface PiiPatternSpec {
  type: PiiCategory;
  label: string;
  regex: RegExp;
}

/**
 * Shared Tier-1 & international regex rules used by both client-side and server-side
 * PDF redaction scanners. Note: avoid matching SSN inside EIN (XX-XXXXXXX vs XXX-XX-XXXX)
 * and restrict Card numbers to 13-19 digits with optional groups.
 */
export const PII_PATTERN_SPECS: PiiPatternSpec[] = [
  {
    type: 'ssn',
    label: 'US SSN',
    regex: /\b(?!000|666|9\d{2})\d{3}[-\s](?!00)\d{2}[-\s](?!0000)\d{4}\b/g,
  },
  {
    type: 'ein',
    label: 'US EIN / Tax ID',
    regex: /\b\d{2}-\d{7}\b/g,
  },
  {
    type: 'card',
    label: 'Credit / Debit Card',
    regex: /\b(?:\d[ -]?){13,18}\d\b/g,
  },
  {
    type: 'email',
    label: 'Email Address',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  },
  {
    type: 'phone',
    label: 'Phone Number',
    regex: /(?:\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
  },
  {
    type: 'iban',
    label: 'IBAN',
    regex: /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){2,7}(?:\s?[A-Z0-9]{1,3})?\b/g,
  },
  {
    type: 'aadhaar',
    label: 'Aadhaar',
    regex: /\b\d{4}\s\d{4}\s\d{4}\b/g,
  },
  {
    type: 'pan',
    label: 'PAN',
    regex: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g,
  },
];

export type PiiSummary = Record<PiiCategory, number> & { total: number };

export function createEmptyPiiSummary(): PiiSummary {
  return {
    ssn: 0,
    ein: 0,
    card: 0,
    phone: 0,
    email: 0,
    iban: 0,
    aadhaar: 0,
    pan: 0,
    total: 0,
  };
}
