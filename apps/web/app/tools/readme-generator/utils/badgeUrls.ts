export type BadgeType = 'build' | 'license' | 'version' | 'npm' | 'pypi';

export interface BadgeConfig {
  type: BadgeType;
  params: Record<string, string>;
}

function trim(value: string | undefined): string {
  return value?.trim() ?? '';
}

/**
 * Builds a shields.io badge as Markdown image syntax, linked where a
 * sensible destination exists (GitHub Actions runs, the npm/PyPI package
 * page). Returns an empty string when required params are missing, so
 * callers can filter out badges that aren't ready to render yet rather
 * than emitting a broken image.
 */
export function buildBadgeMarkdown(badgeType: BadgeType, params: Record<string, string>): string {
  switch (badgeType) {
    case 'build': {
      const owner = trim(params.owner);
      const repo = trim(params.repo);
      const workflow = trim(params.workflow) || 'ci.yml';
      if (!owner || !repo) return '';
      const img = `https://img.shields.io/github/actions/workflow/status/${owner}/${repo}/${workflow}`;
      const link = `https://github.com/${owner}/${repo}/actions`;
      return `[![Build Status](${img})](${link})`;
    }
    case 'license': {
      const owner = trim(params.owner);
      const repo = trim(params.repo);
      const license = trim(params.license);
      if (owner && repo) {
        const img = `https://img.shields.io/github/license/${owner}/${repo}`;
        const link = `https://github.com/${owner}/${repo}/blob/main/LICENSE`;
        return `[![License](${img})](${link})`;
      }
      if (!license) return '';
      const img = `https://img.shields.io/badge/license-${encodeURIComponent(license)}-blue`;
      return `![License](${img})`;
    }
    case 'version': {
      const version = trim(params.version);
      if (!version) return '';
      const img = `https://img.shields.io/badge/version-${encodeURIComponent(version)}-blue`;
      return `![Version](${img})`;
    }
    case 'npm': {
      const packageName = trim(params.packageName);
      if (!packageName) return '';
      const img = `https://img.shields.io/npm/v/${encodeURIComponent(packageName)}`;
      const link = `https://www.npmjs.com/package/${packageName}`;
      return `[![npm version](${img})](${link})`;
    }
    case 'pypi': {
      const packageName = trim(params.packageName);
      if (!packageName) return '';
      const img = `https://img.shields.io/pypi/v/${encodeURIComponent(packageName)}`;
      const link = `https://pypi.org/project/${packageName}/`;
      return `[![PyPI version](${img})](${link})`;
    }
    default:
      return '';
  }
}
