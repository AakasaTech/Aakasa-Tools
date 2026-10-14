/**
 * GitHub's actual heading→anchor slug algorithm (as implemented by the
 * widely-used `github-slugger` reference and GitHub's own renderer):
 * lowercase, strip anything that isn't a word character, hyphen, or space,
 * then replace each individual space with a hyphen — WITHOUT collapsing
 * runs of spaces first, so two consecutive spaces become two consecutive
 * hyphens, not one. Getting this subtle detail wrong is exactly the kind
 * of thing that silently produces a broken anchor link.
 */
function slugifyHeading(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^\w\- ]/g, '')
    .replace(/ /g, '-');
}

/**
 * Returns a stateful slug function: each call slugifies one heading and
 * disambiguates it against every heading already passed to THIS instance,
 * appending GitHub's own `-1`, `-2`, ... suffix on repeats — matching how
 * GitHub resolves duplicate headings within one document. Exported
 * separately from `generateTableOfContents` so a live preview can assign
 * the exact same ids to its rendered headings (in document order) that the
 * generated TOC links point to, keeping the two guaranteed consistent.
 */
export function createHeadingSlugger(): (heading: string) => string {
  const seen = new Map<string, number>();
  return (heading: string) => {
    const base = slugifyHeading(heading);
    const occurrence = seen.get(base) ?? 0;
    seen.set(base, occurrence + 1);
    return occurrence === 0 ? base : `${base}-${occurrence}`;
  };
}

/**
 * Builds a Markdown bullet list of links to each heading's GitHub-style
 * anchor, in the given order. Headings repeated more than once (unusual,
 * but valid Markdown) get GitHub's own disambiguation suffix (`-1`, `-2`,
 * ...) on the second and later occurrences, matching how GitHub itself
 * resolves the collision — so a TOC generated from a document with a
 * duplicate heading still links correctly instead of every entry pointing
 * at the first occurrence.
 */
export function generateTableOfContents(headings: string[]): string {
  const slugger = createHeadingSlugger();
  return headings.map((heading) => `- [${heading}](#${slugger(heading)})`).join('\n');
}
