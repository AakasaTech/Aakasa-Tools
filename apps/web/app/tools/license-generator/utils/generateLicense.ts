import { LICENSES } from '../data/licenses';

export interface LicensePlaceholders {
  year?: string;
  fullName?: string;
}

/**
 * Token substitution only — no other transformation of the license text.
 * Licenses whose official text has no name/year substitution point (Apache,
 * GPL, MPL, Unlicense) simply have no `{{...}}` tokens to replace, so their
 * text passes through unchanged regardless of what's in `placeholders`.
 */
export function generateLicenseText(licenseId: string, placeholders: LicensePlaceholders): string {
  const license = LICENSES.find((candidate) => candidate.id === licenseId);
  if (!license) return '';

  return license.text
    .replaceAll('{{YEAR}}', placeholders.year ?? '')
    .replaceAll('{{FULLNAME}}', placeholders.fullName ?? '');
}
