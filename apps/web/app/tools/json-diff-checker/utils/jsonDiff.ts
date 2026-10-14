/**
 * Pure structural JSON diff — no DOM, no React.
 *
 * A quick check for a small, well-maintained JSON-diff-specific library
 * (per this tool's own build brief) turned up several candidates
 * (json-difference, json-diff-ts, jsondiffpatch, tiny-diff), but none
 * expose the exact shape this tool needs: a flat `{path, type,
 * oldValue?, newValue?}` list AND a togglable by-index/by-value array
 * mode, both driven by the SAME underlying comparison so the tree view
 * and the flat list can never disagree with each other. Adapting any of
 * them to that shape would mean re-processing their own delta format
 * into this one anyway — at that point a hand-rolled, directly-verified
 * recursion (the algorithm itself is small and bounded) is less risk
 * than wrapping a dependency that doesn't natively fit. This module is
 * that implementation, with everything (path-building, array matching,
 * type-mismatch handling) covered by the same recursive core rather than
 * duplicated between a "flat list" pass and a "tree" pass.
 */

export type DiffStatus = 'unchanged' | 'added' | 'removed' | 'changed';
export type ArrayMode = 'by-index' | 'by-value';

export interface DiffOptions {
  arrayMode: ArrayMode;
  /** Treat two strings as equal if they differ only in leading/trailing
   * whitespace (e.g. "Boston" vs "Boston  "). Default false. */
  ignoreWhitespace?: boolean;
}

export interface DiffEntry {
  path: string;
  type: 'added' | 'removed' | 'changed';
  oldValue?: unknown;
  newValue?: unknown;
}

export interface DiffTreeChild {
  key: string;
  node: DiffTreeNode;
}

export interface DiffTreeNode {
  status: DiffStatus;
  oldValue?: unknown;
  newValue?: unknown;
  /** Present when this node is an object/array with at least one
   * difference somewhere inside it — the per-key/per-index breakdown.
   * A fully `unchanged` subtree deliberately stops here without
   * children, rather than recursively expanding every equal leaf. */
  children?: DiffTreeChild[];
  containerKind?: 'object' | 'array';
}

interface ResolvedOptions {
  arrayMode: ArrayMode;
  ignoreWhitespace: boolean;
}

function resolveOptions(options: DiffOptions): ResolvedOptions {
  return { arrayMode: options.arrayMode, ignoreWhitespace: options.ignoreWhitespace ?? false };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function joinPath(parentPath: string, key: string | number): string {
  if (typeof key === 'number') return `${parentPath}[${key}]`;
  return parentPath === '' ? key : `${parentPath}.${key}`;
}

/**
 * Deep structural equality, JSON-value-aware. When `ignoreWhitespace` is
 * set, two strings equal after `.trim()` count as equal too — used
 * consistently both to short-circuit unchanged subtrees and to decide
 * which array items match in by-value mode, so the two options compose
 * correctly together rather than one silently ignoring the other.
 */
function valuesEqual(a: unknown, b: unknown, options: ResolvedOptions): boolean {
  if (a === b) return true;
  if (options.ignoreWhitespace && typeof a === 'string' && typeof b === 'string') {
    if (a.trim() === b.trim()) return true;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => valuesEqual(item, b[i], options));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => Object.prototype.hasOwnProperty.call(b, key) && valuesEqual(a[key], b[key], options));
  }
  return false;
}

function buildArrayNodeByIndex(original: unknown[], changed: unknown[], options: ResolvedOptions): DiffTreeNode {
  const maxLength = Math.max(original.length, changed.length);
  const children: DiffTreeChild[] = [];
  for (let i = 0; i < maxLength; i += 1) {
    let node: DiffTreeNode;
    if (i >= original.length) node = { status: 'added', newValue: changed[i] };
    else if (i >= changed.length) node = { status: 'removed', oldValue: original[i] };
    else node = buildNode(original[i], changed[i], options);
    children.push({ key: String(i), node });
  }
  return { status: 'changed', containerKind: 'array', children };
}

/**
 * Matches array items by value rather than position: every original item
 * is paired with the first not-yet-used changed item it's deeply equal
 * to (order-independent), so identical items that simply moved report no
 * difference at all. Items with no exact match are reported as plain
 * removed/added — this intentionally doesn't try to pair up "similar but
 * not identical" items (e.g. matching by some assumed id field), since
 * that would mean guessing at the data's semantics rather than reading
 * them from it.
 */
function buildArrayNodeByValue(original: unknown[], changed: unknown[], options: ResolvedOptions): DiffTreeNode {
  const changedUsed: boolean[] = new Array(changed.length).fill(false);
  const children: DiffTreeChild[] = [];

  original.forEach((item, i) => {
    const matchIndex = changed.findIndex((candidate, j) => !changedUsed[j] && valuesEqual(item, candidate, options));
    if (matchIndex >= 0) {
      changedUsed[matchIndex] = true;
      children.push({ key: String(i), node: { status: 'unchanged', oldValue: item, newValue: changed[matchIndex] } });
    } else {
      children.push({ key: String(i), node: { status: 'removed', oldValue: item } });
    }
  });

  changed.forEach((item, j) => {
    if (!changedUsed[j]) {
      children.push({ key: String(j), node: { status: 'added', newValue: item } });
    }
  });

  return { status: 'changed', containerKind: 'array', children };
}

function buildNode(original: unknown, changed: unknown, options: ResolvedOptions): DiffTreeNode {
  if (valuesEqual(original, changed, options)) {
    return { status: 'unchanged', oldValue: original, newValue: changed };
  }

  const originalIsObject = isPlainObject(original);
  const changedIsObject = isPlainObject(changed);
  const originalIsArray = Array.isArray(original);
  const changedIsArray = Array.isArray(changed);
  const sameContainerType = (originalIsObject && changedIsObject) || (originalIsArray && changedIsArray);

  // Different JSON "shape" at this path (e.g. a string in one document,
  // a number in the other; or an object vs an array) — always a leaf
  // "changed" entry, never a crash and never silently skipped.
  if (!sameContainerType) {
    return { status: 'changed', oldValue: original, newValue: changed };
  }

  if (originalIsObject && changedIsObject) {
    const allKeys = Array.from(new Set([...Object.keys(original), ...Object.keys(changed)]));
    const children: DiffTreeChild[] = allKeys.map((key) => {
      const hasOld = Object.prototype.hasOwnProperty.call(original, key);
      const hasNew = Object.prototype.hasOwnProperty.call(changed, key);
      let node: DiffTreeNode;
      if (!hasOld) node = { status: 'added', newValue: changed[key] };
      else if (!hasNew) node = { status: 'removed', oldValue: original[key] };
      else node = buildNode(original[key], changed[key], options);
      return { key, node };
    });
    return { status: 'changed', containerKind: 'object', children };
  }

  const originalArray = original as unknown[];
  const changedArray = changed as unknown[];
  return options.arrayMode === 'by-index'
    ? buildArrayNodeByIndex(originalArray, changedArray, options)
    : buildArrayNodeByValue(originalArray, changedArray, options);
}

export function buildDiffTree(original: unknown, changed: unknown, options: DiffOptions): DiffTreeNode {
  return buildNode(original, changed, resolveOptions(options));
}

function flattenTree(node: DiffTreeNode, path: string, entries: DiffEntry[]): void {
  if (node.status === 'unchanged') return;

  if (node.children) {
    for (const { key, node: childNode } of node.children) {
      const childPath = joinPath(path, node.containerKind === 'array' ? Number(key) : key);
      flattenTree(childNode, childPath, entries);
    }
    return;
  }

  entries.push({ path, type: node.status as 'added' | 'removed' | 'changed', oldValue: node.oldValue, newValue: node.newValue });
}

export function diffJson(original: unknown, changed: unknown, options: DiffOptions): DiffEntry[] {
  const tree = buildNode(original, changed, resolveOptions(options));
  const entries: DiffEntry[] = [];
  flattenTree(tree, '', entries);
  return entries;
}
