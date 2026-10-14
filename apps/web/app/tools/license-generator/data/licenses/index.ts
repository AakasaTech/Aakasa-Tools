import { MIT_LICENSE } from './mit';
import { ISC_LICENSE } from './isc';
import { BSD_2_CLAUSE_LICENSE } from './bsd-2-clause';
import { BSD_3_CLAUSE_LICENSE } from './bsd-3-clause';
import { APACHE_2_0_LICENSE } from './apache-2.0';
import { GPL_3_0_LICENSE } from './gpl-3.0';
import { MPL_2_0_LICENSE } from './mpl-2.0';
import { UNLICENSE_LICENSE } from './unlicense';

export interface LicenseComparison {
  commercialUse: boolean;
  modification: boolean;
  distribution: boolean;
  patentGrant: boolean;
  /** "None" | "Weak" (file-level, e.g. MPL) | "Strong" (whole-program, e.g. GPL) */
  copyleft: 'None' | 'Weak' | 'Strong';
}

export interface LicenseDefinition {
  id: string;
  name: string;
  description: string;
  /** Raw text with {{YEAR}}/{{FULLNAME}} tokens where the license officially specifies them. */
  text: string;
  /** False for licenses whose operative text has no name/year substitution (Apache, GPL, MPL, Unlicense). */
  hasPlaceholders: boolean;
  comparison: LicenseComparison;
}

export const LICENSES: LicenseDefinition[] = [
  {
    id: 'mit',
    name: 'MIT License',
    description: 'Short, permissive — anyone can use, modify, and distribute, as long as the copyright notice is kept.',
    text: MIT_LICENSE,
    hasPlaceholders: true,
    comparison: { commercialUse: true, modification: true, distribution: true, patentGrant: false, copyleft: 'None' },
  },
  {
    id: 'apache-2.0',
    name: 'Apache License 2.0',
    description: 'Permissive like MIT, plus an explicit patent grant and a requirement to document changes.',
    text: APACHE_2_0_LICENSE,
    hasPlaceholders: false,
    comparison: { commercialUse: true, modification: true, distribution: true, patentGrant: true, copyleft: 'None' },
  },
  {
    id: 'gpl-3.0',
    name: 'GNU GPL v3.0',
    description: 'Strong copyleft — derivative works must also be distributed under the GPL, with source made available.',
    text: GPL_3_0_LICENSE,
    hasPlaceholders: false,
    comparison: { commercialUse: true, modification: true, distribution: true, patentGrant: true, copyleft: 'Strong' },
  },
  {
    id: 'bsd-2-clause',
    name: 'BSD 2-Clause License',
    description: 'Minimal permissive license, similar to MIT, without the "Simplified" naming restriction clause.',
    text: BSD_2_CLAUSE_LICENSE,
    hasPlaceholders: true,
    comparison: { commercialUse: true, modification: true, distribution: true, patentGrant: false, copyleft: 'None' },
  },
  {
    id: 'bsd-3-clause',
    name: 'BSD 3-Clause License',
    description: 'Like BSD 2-Clause, plus a clause preventing use of contributors\' names to endorse derived products.',
    text: BSD_3_CLAUSE_LICENSE,
    hasPlaceholders: true,
    comparison: { commercialUse: true, modification: true, distribution: true, patentGrant: false, copyleft: 'None' },
  },
  {
    id: 'isc',
    name: 'ISC License',
    description: 'Functionally equivalent to MIT, with simpler wording.',
    text: ISC_LICENSE,
    hasPlaceholders: true,
    comparison: { commercialUse: true, modification: true, distribution: true, patentGrant: false, copyleft: 'None' },
  },
  {
    id: 'mpl-2.0',
    name: 'Mozilla Public License 2.0',
    description: 'Weak (file-level) copyleft — modified MPL files must stay MPL-licensed, but they can be combined with proprietary code.',
    text: MPL_2_0_LICENSE,
    hasPlaceholders: false,
    comparison: { commercialUse: true, modification: true, distribution: true, patentGrant: true, copyleft: 'Weak' },
  },
  {
    id: 'unlicense',
    name: 'The Unlicense',
    description: 'A public-domain dedication — no copyright is asserted at all, so there\'s nothing to license.',
    text: UNLICENSE_LICENSE,
    hasPlaceholders: false,
    comparison: { commercialUse: true, modification: true, distribution: true, patentGrant: false, copyleft: 'None' },
  },
];
