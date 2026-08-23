export interface RegexPreset {
  name: string;
  pattern: string;
  flags: string;
  description: string;
}

export const REGEX_PRESETS: RegexPreset[] = [
  {
    name: 'Email',
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    flags: 'g',
    description: 'A reasonably typical email address — not fully RFC 5322 compliant (nothing practical is).',
  },
  {
    name: 'URL',
    pattern: 'https?:\\/\\/[^\\s/$.?#].[^\\s]*',
    flags: 'g',
    description: 'An http:// or https:// URL.',
  },
  {
    name: 'IP address',
    pattern: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
    flags: 'g',
    description: 'An IPv4 address, validating each octet is 0-255.',
  },
  {
    name: 'Phone (US)',
    pattern: '\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}',
    flags: 'g',
    description: 'A US phone number in common formats: (555) 123-4567, 555-123-4567, 555.123.4567.',
  },
  {
    name: 'Hex color',
    pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b',
    flags: 'g',
    description: 'A 3- or 6-digit hex color code, e.g. #fff or #1a2b3c.',
  },
  {
    name: 'Date (ISO 8601)',
    pattern: '\\d{4}-\\d{2}-\\d{2}',
    flags: 'g',
    description: 'A YYYY-MM-DD date — matches the shape only, does not validate real calendar ranges.',
  },
];
