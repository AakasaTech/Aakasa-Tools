'use client';

import { useMemo, useState } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import { parseJson } from '../json-formatter/utils/jsonFormat';
import {
  buildDiffTree,
  diffJson,
  type ArrayMode,
  type DiffTreeChild,
  type DiffTreeNode,
} from './utils/jsonDiff';

type ViewMode = 'tree' | 'list';

interface DisplayError {
  message: string;
  line: number;
  column: number;
}

const SAMPLE_ORIGINAL = `{
  "name": "Ada Lovelace",
  "role": "Engineer",
  "address": {
    "city": "Boston",
    "zip": "02101"
  },
  "tags": ["math", "computing"]
}`;

const SAMPLE_CHANGED = `{
  "name": "Ada Lovelace",
  "role": "Senior Engineer",
  "address": {
    "city": "Chicago",
    "zip": "02101"
  },
  "tags": ["math", "computing", "logic"]
}`;

function parsePanel(text: string): { value: unknown; error: DisplayError | null } {
  if (!text.trim()) {
    return { value: undefined, error: null };
  }
  const result = parseJson(text);
  if (!result.success) {
    return { value: undefined, error: { message: result.error.message, line: result.error.line, column: result.error.column } };
  }
  return { value: result.value, error: null };
}

function formatValue(value: unknown): string {
  if (value === undefined) return 'undefined';
  return JSON.stringify(value);
}

function describeEntry(path: string, type: 'added' | 'removed' | 'changed', oldValue: unknown, newValue: unknown): string {
  const label = path || '(root)';
  if (type === 'added') return `${label}: added (${formatValue(newValue)})`;
  if (type === 'removed') return `${label}: removed (${formatValue(oldValue)})`;
  return `${label}: changed from ${formatValue(oldValue)} to ${formatValue(newValue)}`;
}

const STATUS_STYLES: Record<'added' | 'removed' | 'changed', string> = {
  added: 'text-success',
  removed: 'text-danger',
  changed: 'text-accent',
};

function DiffTreeNodeView({
  label,
  node,
  ignoreKeyOrder,
  depth,
}: {
  label: string;
  node: DiffTreeNode;
  ignoreKeyOrder: boolean;
  depth: number;
}) {
  const [collapsed, setCollapsed] = useState(false);

  if (node.status === 'unchanged') {
    return (
      <div className="flex gap-1 py-0.5 pl-4 text-ink/60 dark:text-paper/60">
        <span>{label}:</span>
        <span>{formatValue(node.oldValue)}</span>
      </div>
    );
  }

  if (!node.children) {
    if (node.status === 'changed') {
      return (
        <div className="flex flex-wrap gap-1 py-0.5 pl-4">
          <span className="text-ink dark:text-paper">{label}:</span>
          <span className={`${STATUS_STYLES.removed} line-through`}>{formatValue(node.oldValue)}</span>
          <span className={STATUS_STYLES.changed}>{formatValue(node.newValue)}</span>
        </div>
      );
    }
    const value = node.status === 'added' ? node.newValue : node.oldValue;
    return (
      <div className={`flex gap-1 py-0.5 pl-4 ${STATUS_STYLES[node.status]}`}>
        <span>{label}:</span>
        <span>{formatValue(value)}</span>
      </div>
    );
  }

  const children: DiffTreeChild[] = ignoreKeyOrder
    ? [...node.children].sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }))
    : node.children;

  return (
    <div className={depth > 0 ? 'pl-4' : ''}>
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className="flex items-center gap-1 py-0.5 text-left text-ink dark:text-paper"
      >
        <span className="text-ink/40 dark:text-paper/40">{collapsed ? '▶' : '▼'}</span>
        <span>
          {label}
          {node.containerKind === 'array' ? ' [' : ' {'}
        </span>
      </button>
      {!collapsed && (
        <div>
          {children.map(({ key, node: childNode }) => (
            <DiffTreeNodeView key={key} label={key} node={childNode} ignoreKeyOrder={ignoreKeyOrder} depth={depth + 1} />
          ))}
        </div>
      )}
      {!collapsed && <div className="pl-4 text-ink/40 dark:text-paper/40">{node.containerKind === 'array' ? ']' : '}'}</div>}
    </div>
  );
}

export function JsonDiffChecker() {
  const [originalText, setOriginalText] = useState(SAMPLE_ORIGINAL);
  const [changedText, setChangedText] = useState(SAMPLE_CHANGED);
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [arrayMode, setArrayMode] = useState<ArrayMode>('by-index');
  const [ignoreKeyOrder, setIgnoreKeyOrder] = useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);

  const original = useMemo(() => parsePanel(originalText), [originalText]);
  const changed = useMemo(() => parsePanel(changedText), [changedText]);

  const bothValid = original.value !== undefined && changed.value !== undefined && !original.error && !changed.error;

  const entries = useMemo(() => {
    if (!bothValid) return [];
    return diffJson(original.value, changed.value, { arrayMode, ignoreWhitespace });
  }, [bothValid, original.value, changed.value, arrayMode, ignoreWhitespace]);

  const tree = useMemo(() => {
    if (!bothValid) return null;
    return buildDiffTree(original.value, changed.value, { arrayMode, ignoreWhitespace });
  }, [bothValid, original.value, changed.value, arrayMode, ignoreWhitespace]);

  const stats = useMemo(() => {
    const counts = { added: 0, removed: 0, changed: 0 };
    for (const entry of entries) counts[entry.type] += 1;
    return counts;
  }, [entries]);

  const flatSummary = useMemo(
    () => entries.map((entry) => describeEntry(entry.path, entry.type, entry.oldValue, entry.newValue)).join('\n'),
    [entries]
  );

  function handleLoadSample() {
    setOriginalText(SAMPLE_ORIGINAL);
    setChangedText(SAMPLE_CHANGED);
  }

  function handleClear() {
    setOriginalText('');
    setChangedText('');
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          Array comparison
          <select
            value={arrayMode}
            onChange={(event) => setArrayMode(event.target.value as ArrayMode)}
            className="rounded-md border border-ink/10 bg-paper px-2 py-1 text-sm text-ink dark:border-paper/10 dark:bg-ink dark:text-paper"
          >
            <option value="by-index">By index</option>
            <option value="by-value">By value</option>
          </select>
        </label>

        <label
          className="flex items-center gap-1.5 text-sm text-ink/70 dark:text-paper/70"
          title="Only changes how the tree view orders keys for display — a structural diff already treats key order as insignificant, so this does not change which differences are detected."
        >
          <input
            type="checkbox"
            checked={ignoreKeyOrder}
            onChange={(event) => setIgnoreKeyOrder(event.target.checked)}
            className="accent-accent"
          />
          Ignore key order
        </label>

        <label className="flex items-center gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          <input
            type="checkbox"
            checked={ignoreWhitespace}
            onChange={(event) => setIgnoreWhitespace(event.target.checked)}
            className="accent-accent"
          />
          Ignore whitespace-only string differences
        </label>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setViewMode((mode) => (mode === 'tree' ? 'list' : 'tree'))}>
            {viewMode === 'tree' ? 'List view' : 'Tree view'}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLoadSample}>
            Sample
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClear} disabled={!originalText && !changedText}>
            Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink/50 dark:text-paper/50">Original</span>
          <textarea
            value={originalText}
            onChange={(event) => setOriginalText(event.target.value)}
            spellCheck={false}
            placeholder="Paste original JSON here…"
            aria-label="Original JSON"
            aria-invalid={original.error !== null}
            className="h-64 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
          />
          {original.error && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
              Line {original.error.line}, column {original.error.column}: {original.error.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink/50 dark:text-paper/50">Changed</span>
          <textarea
            value={changedText}
            onChange={(event) => setChangedText(event.target.value)}
            spellCheck={false}
            placeholder="Paste changed JSON here…"
            aria-label="Changed JSON"
            aria-invalid={changed.error !== null}
            className="h-64 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
          />
          {changed.error && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
              Line {changed.error.line}, column {changed.error.column}: {changed.error.message}
            </p>
          )}
        </div>
      </div>

      {bothValid && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className={STATUS_STYLES.added}>{stats.added} added</span>
            <span className={STATUS_STYLES.removed}>{stats.removed} removed</span>
            <span className={STATUS_STYLES.changed}>{stats.changed} changed</span>
            {entries.length === 0 && <span className="text-ink/50 dark:text-paper/50">No differences found.</span>}
          </div>

          {viewMode === 'tree' && tree ? (
            <div className="w-full overflow-auto rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm dark:border-paper/10 dark:bg-ink">
              <DiffTreeNodeView label="root" node={tree} ignoreKeyOrder={ignoreKeyOrder} depth={0} />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="w-full overflow-auto rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink dark:border-paper/10 dark:bg-ink dark:text-paper">
                {entries.length === 0 ? (
                  <p className="text-ink/40 dark:text-paper/40">No differences found.</p>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {entries.map((entry, index) => (
                      <li key={`${entry.path}-${index}`} className={STATUS_STYLES[entry.type]}>
                        {describeEntry(entry.path, entry.type, entry.oldValue, entry.newValue)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <CopyButton value={flatSummary} disabled={!flatSummary} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
