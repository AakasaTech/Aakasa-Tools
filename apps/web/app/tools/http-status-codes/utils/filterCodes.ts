import type { StatusClass, StatusCodeEntry } from '../data/statusCodes';

export type ClassFilter = 'all' | StatusClass;

/** Class names included in the search haystack (not just individual
 * descriptions) so a query like "redirect" reliably surfaces every 3xx
 * entry via its class name, rather than depending on that exact word
 * happening to appear in each one's own description. */
const CLASS_NAMES: Record<StatusClass, string> = {
  '1xx': 'informational',
  '2xx': 'success',
  '3xx': 'redirection redirect',
  '4xx': 'client error',
  '5xx': 'server error',
};

/** Filters by class, then by a free-text query matched against the code
 * number, reason phrase, description, and class name — so "redirect"
 * surfaces every 3xx entry, and "404" jumps straight to that one code. */
export function filterStatusCodes(codes: StatusCodeEntry[], query: string, classFilter: ClassFilter): StatusCodeEntry[] {
  const byClass = classFilter === 'all' ? codes : codes.filter((entry) => entry.class === classFilter);

  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) return byClass;

  return byClass.filter((entry) => {
    return (
      String(entry.code).includes(trimmedQuery) ||
      entry.phrase.toLowerCase().includes(trimmedQuery) ||
      entry.description.toLowerCase().includes(trimmedQuery) ||
      CLASS_NAMES[entry.class].includes(trimmedQuery)
    );
  });
}
