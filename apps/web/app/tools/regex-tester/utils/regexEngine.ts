/**
 * Pure regex logic — no DOM APIs, no React. Deliberately dependency-free so
 * it can run identically on the main thread or inside the Web Worker that
 * actually executes user-supplied patterns (see workers/regex.worker.ts).
 *
 * This file does NOT protect against catastrophic backtracking itself —
 * that can only happen synchronously inside a single RegExp call, and
 * nothing inside JS can interrupt a synchronous call from within. The
 * protection is the caller's job: run this inside a Worker with a
 * main-thread timeout that terminates the worker if it doesn't respond in
 * time. See RegexTester.tsx's useRegexWorker hook.
 */

export interface MatchGroup {
  value: string | undefined;
  /** Start/end offsets within the full test string — undefined if the group didn't participate, or indices aren't available. */
  start: number | undefined;
  end: number | undefined;
}

export interface MatchResult {
  match: string;
  index: number;
  groups: MatchGroup[];
  namedGroups: Record<string, MatchGroup>;
}

/**
 * Builds a RegExp from a pattern/flags pair, catching the SyntaxError
 * RegExp's constructor throws on invalid input. Always requests the `d`
 * (hasIndices) flag internally — regardless of what the caller passed — so
 * findMatches can report precise group boundaries for highlighting; `d`
 * only adds the `.indices` property to results, it never changes what
 * matches, so this is safe to add silently.
 */
export function buildRegex(pattern: string, flags: string): RegExp | { error: string } {
  // Validate against the caller's actual flags first, so an error message
  // reflects what the user selected rather than mentioning the internal
  // `d` flag added below (native SyntaxErrors embed the exact flags string
  // passed to the constructor).
  try {
    new RegExp(pattern, flags);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Invalid regular expression' };
  }

  const effectiveFlags = flags.includes('d') ? flags : `${flags}d`;
  try {
    return new RegExp(pattern, effectiveFlags);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Invalid regular expression' };
  }
}

function toMatchResult(match: RegExpExecArray): MatchResult {
  const indices = match.indices;

  const groups: MatchGroup[] = [];
  for (let i = 1; i < match.length; i += 1) {
    const range = indices?.[i];
    groups.push({ value: match[i], start: range?.[0], end: range?.[1] });
  }

  const namedGroups: Record<string, MatchGroup> = {};
  if (match.groups) {
    for (const name of Object.keys(match.groups)) {
      const range = indices?.groups?.[name];
      namedGroups[name] = { value: match.groups[name], start: range?.[0], end: range?.[1] };
    }
  }

  return { match: match[0], index: match.index, groups, namedGroups };
}

const MAX_MATCHES = 100_000; // guards against a runaway loop on a pattern that matches zero-width repeatedly

/** Finds all matches (or just the first, if the regex isn't global). */
export function findMatches(regex: RegExp, text: string): MatchResult[] {
  if (!regex.global) {
    const match = regex.exec(text);
    return match ? [toMatchResult(match)] : [];
  }

  // Stateful regex — reset defensively in case this instance was already
  // advanced by a previous call.
  regex.lastIndex = 0;

  const results: MatchResult[] = [];
  let match: RegExpExecArray | null;
  let iterations = 0;

  while ((match = regex.exec(text)) !== null && iterations < MAX_MATCHES) {
    results.push(toMatchResult(match));
    // A zero-length match doesn't advance lastIndex on its own — without
    // this, exec() would find the same empty match at the same spot forever.
    if (match[0].length === 0) {
      regex.lastIndex += 1;
    }
    iterations += 1;
  }

  return results;
}

/** `text.replace()` using a fresh pattern/flags pair — supports $1/$2/$<name> natively via String.replace. */
export function applyReplace(
  pattern: string,
  flags: string,
  text: string,
  replacement: string
): string | { error: string } {
  const regexOrError = buildRegex(pattern, flags);
  if ('error' in regexOrError) {
    return regexOrError;
  }
  try {
    return text.replace(regexOrError, replacement);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Replace failed' };
  }
}
