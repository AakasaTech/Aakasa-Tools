import { GITIGNORE_TEMPLATES } from '../data/templates';

function sectionHeader(label: string): string {
  return `### ${label} ###`;
}

/**
 * Filters a template's lines against the running set of already-emitted
 * pattern lines, so a line repeated across templates (e.g. `.DS_Store`
 * appearing in both a language template and the macOS template) is only
 * ever written once, under whichever section contributed it first. Blank
 * lines are never deduplicated — they're just spacing within a section,
 * not meaningful entries — only non-blank lines are tracked and skipped.
 */
function filterAgainstSeen(lines: string[], seen: Set<string>): string[] {
  const kept: string[] = [];
  for (const line of lines) {
    if (line.trim() === '') {
      kept.push(line);
      continue;
    }
    if (seen.has(line)) {
      continue;
    }
    seen.add(line);
    kept.push(line);
  }
  return kept;
}

/** True if a filtered section has at least one real (non-blank) line left. */
function hasContent(lines: string[]): boolean {
  return lines.some((line) => line.trim() !== '');
}

export function combineGitignoreTemplates(selectedTemplateNames: string[], customPatterns: string): string {
  const seen = new Set<string>();
  const sections: string[] = [];

  for (const name of selectedTemplateNames) {
    const template = GITIGNORE_TEMPLATES.find((candidate) => candidate.id === name);
    if (!template) continue;

    const rawLines = template.content.split('\n');
    const filtered = filterAgainstSeen(rawLines, seen);
    if (!hasContent(filtered)) continue;

    sections.push(`${sectionHeader(template.label)}\n${filtered.join('\n').trim()}`);
  }

  const customLines = filterAgainstSeen(customPatterns.split('\n'), seen);
  if (hasContent(customLines)) {
    sections.push(`${sectionHeader('Custom')}\n${customLines.join('\n').trim()}`);
  }

  return sections.join('\n\n') + (sections.length > 0 ? '\n' : '');
}
