/**
 * Normalizes a UTM parameter value to prevent the most common analytics
 * fragmentation mistake: the same source/medium/campaign reported under
 * different casings or with stray whitespace (e.g. "Facebook" vs
 * "facebook"), which splits one channel into multiple rows in reports.
 */
export function normalizeUtmValue(value: string): string {
  return value.trim().toLowerCase();
}
