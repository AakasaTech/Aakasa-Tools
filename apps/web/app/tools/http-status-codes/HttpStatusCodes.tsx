'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import { STATUS_CODES, type StatusClass, type StatusCodeEntry } from './data/statusCodes';
import { filterStatusCodes, type ClassFilter } from './utils/filterCodes';

const CLASS_FILTERS: ClassFilter[] = ['all', '1xx', '2xx', '3xx', '4xx', '5xx'];

const CLASS_FILTER_LABELS: Record<ClassFilter, string> = {
  all: 'All',
  '1xx': '1xx',
  '2xx': '2xx',
  '3xx': '3xx',
  '4xx': '4xx',
  '5xx': '5xx',
};

const CLASS_SECTION_LABELS: Record<StatusClass, string> = {
  '1xx': '1xx — Informational',
  '2xx': '2xx — Success',
  '3xx': '3xx — Redirection',
  '4xx': '4xx — Client Error',
  '5xx': '5xx — Server Error',
};

// success-tinted for 2xx, danger-tinted for 4xx/5xx (the one place danger
// genuinely maps to "this is an error", not just decoration), and accent
// (the design system's only other saturated color) standing in as the
// neutral/informational tint for 1xx and 3xx.
const CLASS_DOT_CLASSES: Record<StatusClass, string> = {
  '1xx': 'bg-accent',
  '2xx': 'bg-success',
  '3xx': 'bg-accent',
  '4xx': 'bg-danger',
  '5xx': 'bg-danger',
};

function groupByClass(entries: StatusCodeEntry[]): { statusClass: StatusClass; entries: StatusCodeEntry[] }[] {
  const groups: { statusClass: StatusClass; entries: StatusCodeEntry[] }[] = [];
  for (const entry of entries) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.statusClass === entry.class) {
      lastGroup.entries.push(entry);
    } else {
      groups.push({ statusClass: entry.class, entries: [entry] });
    }
  }
  return groups;
}

export function HttpStatusCodes() {
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState<ClassFilter>('all');
  const [highlightedCode, setHighlightedCode] = useState<number | null>(null);

  // Deep-linking: read the URL fragment on mount (client-only — the hash
  // isn't available during SSR/SSG) and scroll to + highlight the matching
  // entry. Confirmed this needs to be explicit JS, not just an anchor id:
  // the entry list only exists once React mounts and renders it, so the
  // browser's own automatic "scroll to #fragment" behavior on initial page
  // load has nothing to scroll to yet at that point.
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    const code = Number(hash);
    if (!hash || Number.isNaN(code)) return;
    if (!STATUS_CODES.some((entry) => entry.code === code)) return;

    setHighlightedCode(code);
    const target = document.getElementById(String(code));
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const filtered = useMemo(() => filterStatusCodes(STATUS_CODES, query, classFilter), [query, classFilter]);
  const groups = useMemo(() => groupByClass(filtered), [filtered]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by code or keyword — e.g. 404, redirect, rate limit…"
          aria-label="Search status codes"
          className="w-full rounded-md border border-ink/10 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          {CLASS_FILTERS.map((filter) => (
            <Button key={filter} variant={classFilter === filter ? 'primary' : 'secondary'} size="sm" onClick={() => setClassFilter(filter)}>
              {CLASS_FILTER_LABELS[filter]}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-xs text-ink/50 dark:text-paper/50">
        {filtered.length} of {STATUS_CODES.length} codes
      </p>

      {groups.length === 0 && (
        <p className="rounded-lg border border-dashed border-ink/10 p-6 text-center text-sm text-ink/50 dark:border-paper/10 dark:text-paper/50">
          No status codes match &ldquo;{query}&rdquo;.
        </p>
      )}

      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <div key={group.statusClass} className="flex flex-col gap-2">
            <h2 className="font-display text-sm font-semibold text-ink dark:text-paper">{CLASS_SECTION_LABELS[group.statusClass]}</h2>
            <div className="flex flex-col divide-y divide-ink/5 rounded-lg border border-ink/10 dark:divide-paper/5 dark:border-paper/10">
              {group.entries.map((entry) => (
                <div
                  key={entry.code}
                  id={String(entry.code)}
                  className={`flex scroll-mt-20 flex-col gap-1.5 p-3 transition-colors sm:flex-row sm:items-start sm:gap-4 ${
                    highlightedCode === entry.code ? 'bg-accent/10' : ''
                  }`}
                >
                  <div className="flex shrink-0 items-center gap-2 sm:w-32">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${CLASS_DOT_CLASSES[entry.class]}`} aria-hidden="true" />
                    <span className="font-mono text-base font-semibold text-ink dark:text-paper">{entry.code}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink dark:text-paper">{entry.phrase}</p>
                    <p className="text-sm text-ink/70 dark:text-paper/70">{entry.description}</p>
                  </div>
                  <div className="shrink-0">
                    <CopyButton value={`${entry.code} ${entry.phrase}`} label="Copy" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">This reference runs entirely in your browser — nothing is uploaded or stored.</span>
    </div>
  );
}
