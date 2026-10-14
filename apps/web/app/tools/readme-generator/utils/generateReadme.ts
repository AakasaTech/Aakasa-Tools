import { buildBadgeMarkdown, type BadgeConfig } from './badgeUrls';
import { generateTableOfContents } from './generateToc';

export interface EnvVarRow {
  name: string;
  description: string;
  defaultValue: string;
}

interface BaseSection {
  id: string;
  enabled: boolean;
}

export interface TitleSection extends BaseSection {
  type: 'title';
  title: string;
  tagline: string;
}

export interface BadgesSection extends BaseSection {
  type: 'badges';
  badges: BadgeConfig[];
}

export interface TocSection extends BaseSection {
  type: 'toc';
}

/** Section types that render as `## {heading}` followed by free-text content. */
export type TextSectionType = 'about' | 'installation' | 'usage' | 'api' | 'screenshots' | 'contributing' | 'contact';

export interface TextSection extends BaseSection {
  type: TextSectionType;
  heading: string;
  content: string;
}

export interface FeaturesSection extends BaseSection {
  type: 'features';
  heading: string;
  items: string[];
}

export interface ConfigurationSection extends BaseSection {
  type: 'configuration';
  heading: string;
  rows: EnvVarRow[];
}

export interface LicenseSection extends BaseSection {
  type: 'license';
  heading: string;
  licenseName: string;
  note: string;
}

export type ReadmeSectionData =
  | TitleSection
  | BadgesSection
  | TocSection
  | TextSection
  | FeaturesSection
  | ConfigurationSection
  | LicenseSection;

/** Sections that contribute a heading to the Table of Contents. */
function getHeading(section: ReadmeSectionData): string | null {
  if (section.type === 'title' || section.type === 'badges' || section.type === 'toc') return null;
  return section.heading;
}

function buildEnvTable(rows: EnvVarRow[]): string {
  const validRows = rows.filter((row) => row.name.trim());
  if (validRows.length === 0) return '';
  const header = '| Variable | Description | Default |\n| --- | --- | --- |';
  const body = validRows
    .map((row) => `| \`${row.name.trim()}\` | ${row.description.trim()} | ${row.defaultValue.trim() || '—'} |`)
    .join('\n');
  return `${header}\n${body}`;
}

function renderSection(section: ReadmeSectionData, headings: string[]): string {
  switch (section.type) {
    case 'title': {
      const lines = [`# ${section.title.trim()}`];
      if (section.tagline.trim()) lines.push(section.tagline.trim());
      return lines.join('\n\n');
    }
    case 'badges': {
      const badgeLine = section.badges
        .map((badge) => buildBadgeMarkdown(badge.type, badge.params))
        .filter(Boolean)
        .join(' ');
      return badgeLine;
    }
    case 'toc': {
      if (headings.length === 0) return '';
      return `## Table of Contents\n\n${generateTableOfContents(headings)}`;
    }
    case 'features': {
      const items = section.items.filter((item) => item.trim());
      if (items.length === 0) return '';
      return `## ${section.heading}\n\n${items.map((item) => `- ${item.trim()}`).join('\n')}`;
    }
    case 'configuration': {
      const table = buildEnvTable(section.rows);
      if (!table) return '';
      return `## ${section.heading}\n\n${table}`;
    }
    case 'license': {
      return `## ${section.heading}\n\n${section.note.trim()}`;
    }
    default: {
      // TextSection: about, installation, usage, api, screenshots, contributing, contact
      if (!section.content.trim()) return '';
      return `## ${section.heading}\n\n${section.content.trim()}`;
    }
  }
}

/**
 * Assembles enabled sections, in their configured order, into final
 * Markdown. The Table of Contents (if enabled) is generated from every
 * OTHER enabled section's heading, in that same order — so reordering
 * sections or toggling one off automatically keeps the TOC in sync,
 * rather than requiring it to be regenerated separately.
 */
export function buildReadmeMarkdown(sections: ReadmeSectionData[]): string {
  const enabled = sections.filter((section) => section.enabled);
  const headings = enabled
    .map((section) => getHeading(section))
    .filter((heading): heading is string => heading !== null);

  const rendered = enabled.map((section) => renderSection(section, headings)).filter((block) => block.trim() !== '');

  return rendered.join('\n\n') + (rendered.length > 0 ? '\n' : '');
}
