'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
  type UIEvent,
} from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import { REGEX_PRESETS } from './utils/regexPresets';
import type { MatchGroup, MatchResult } from './utils/regexEngine';
import type { RegexWorkerRequest, RegexWorkerResponse } from './workers/regex.worker';

const DEBOUNCE_MS = 300;
const TIMEOUT_MS = 1000;

type FlagKey = 'g' | 'i' | 'm' | 's' | 'u';

const FLAG_INFO: Record<FlagKey, string> = {
  g: 'Global — find all matches, not just the first',
  i: 'Case insensitive — ignore letter case',
  m: 'Multiline — ^ and $ match the start/end of each line',
  s: 'Dot all — . also matches newline characters',
  u: 'Unicode — treat the pattern as Unicode code points, not UTF-16 units',
};

const FLAG_KEYS = Object.keys(FLAG_INFO) as FlagKey[];

const CHEAT_SHEET: { token: string; meaning: string }[] = [
  { token: '.', meaning: 'Any character except newline' },
  { token: '\\d  \\D', meaning: 'Digit / non-digit' },
  { token: '\\w  \\W', meaning: 'Word character / non-word character' },
  { token: '\\s  \\S', meaning: 'Whitespace / non-whitespace' },
  { token: '^  $', meaning: 'Start / end of string (or line, with m flag)' },
  { token: '*  +  ?', meaning: '0 or more / 1 or more / 0 or 1' },
  { token: '{n,m}', meaning: 'Between n and m times' },
  { token: '(...)', meaning: 'Capture group' },
  { token: '(?:...)', meaning: 'Non-capturing group' },
  { token: '(?<name>...)', meaning: 'Named capture group' },
  { token: '|', meaning: 'Alternation (or)' },
  { token: '[...]', meaning: 'Character class' },
  { token: '(?=...)  (?!...)', meaning: 'Positive / negative lookahead' },
];

/**
 * Runs a regex match/replace inside a Web Worker with a hard timeout.
 * Native JS RegExp has no built-in way to interrupt a synchronous call — a
 * catastrophically backtracking pattern (e.g. /(a+)+$/ against "aaaa...!")
 * can hang the thread it runs on forever. Running it in a worker means a
 * hang only freezes that worker, not the page; the timeout here is what
 * actually recovers from it, by terminating the stuck worker outright and
 * starting fresh next time. This is the one thing in this tool that must
 * not be skipped.
 */
function useRegexWorker() {
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const getWorker = useCallback((): Worker => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('./workers/regex.worker.ts', import.meta.url));
    }
    return workerRef.current;
  }, []);

  return useCallback(
    (request: Omit<RegexWorkerRequest, 'id'>): Promise<(RegexWorkerResponse | { id: number; status: 'timeout' })> => {
      const worker = getWorker();
      const id = (requestIdRef.current += 1);
      const fullRequest: RegexWorkerRequest = { ...request, id };

      return new Promise((resolve) => {
        let settled = false;

        function handleMessage(event: MessageEvent<RegexWorkerResponse>) {
          if (settled || event.data.id !== id) {
            return;
          }
          settled = true;
          clearTimeout(timeoutId);
          worker.removeEventListener('message', handleMessage);
          resolve(event.data);
        }

        const timeoutId = setTimeout(() => {
          if (settled) {
            return;
          }
          settled = true;
          worker.removeEventListener('message', handleMessage);
          // Terminate exactly the worker instance THIS request was sent to
          // (captured in the closure) — not whatever workerRef.current
          // happens to be by the time this fires, which could already be a
          // newer, healthy worker from a later request.
          worker.terminate();
          if (workerRef.current === worker) {
            workerRef.current = null;
          }
          resolve({ id, status: 'timeout' });
        }, TIMEOUT_MS);

        worker.addEventListener('message', handleMessage);
        worker.postMessage(fullRequest);
      });
    },
    [getWorker]
  );
}

function isValidRange(group: MatchGroup): group is MatchGroup & { start: number; end: number } {
  return group.start !== undefined && group.end !== undefined;
}

function renderMatchSpan(m: MatchResult, key: number): ReactNode {
  const matchStart = m.index;
  const allGroups = [...m.groups, ...Object.values(m.namedGroups)]
    .filter(isValidRange)
    .sort((a, b) => a.start - b.start);

  const segments: { text: string; isGroup: boolean }[] = [];
  let cursor = matchStart;

  for (const group of allGroups) {
    if (group.start < cursor) {
      continue; // overlapping/nested group — skip for simplicity, outer boundary already shown
    }
    if (group.start > cursor) {
      segments.push({ text: m.match.slice(cursor - matchStart, group.start - matchStart), isGroup: false });
    }
    segments.push({ text: m.match.slice(group.start - matchStart, group.end - matchStart), isGroup: true });
    cursor = group.end;
  }
  if (cursor - matchStart < m.match.length) {
    segments.push({ text: m.match.slice(cursor - matchStart), isGroup: false });
  }

  return (
    <mark key={key} className="rounded bg-accent/30 text-ink dark:text-paper">
      {segments.map((seg, i) =>
        seg.isGroup ? (
          <span key={i} className="underline decoration-accent decoration-2 underline-offset-2">
            {seg.text}
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </mark>
  );
}

function renderHighlightedText(text: string, matches: MatchResult[]): ReactNode[] {
  if (matches.length === 0) {
    return [text];
  }
  const nodes: ReactNode[] = [];
  let cursor = 0;

  matches.forEach((m, i) => {
    if (m.index > cursor) {
      nodes.push(text.slice(cursor, m.index));
    }
    nodes.push(renderMatchSpan(m, i));
    cursor = m.index + m.match.length;
  });

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }
  return nodes;
}

type Mode = 'match' | 'replace';

export function RegexTester() {
  const [pattern, setPattern] = useState('');
  const [flagState, setFlagState] = useState<Record<FlagKey, boolean>>({
    g: true,
    i: false,
    m: false,
    s: false,
    u: false,
  });
  const [testString, setTestString] = useState('');
  const [mode, setMode] = useState<Mode>('match');
  const [replacement, setReplacement] = useState('');
  const [activePresetDescription, setActivePresetDescription] = useState<string | null>(null);
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [replaceResult, setReplaceResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const runRegex = useRegexWorker();
  const evalTokenRef = useRef(0);
  const highlightRef = useRef<HTMLDivElement>(null);

  const flags = FLAG_KEYS.filter((key) => flagState[key]).join('');

  useEffect(() => {
    setErrorMessage(null);
    setTimedOut(false);

    if (!pattern) {
      setMatches([]);
      setReplaceResult(null);
      setIsEvaluating(false);
      return;
    }

    setIsEvaluating(true);

    const timer = setTimeout(() => {
      const token = (evalTokenRef.current += 1);
      void runRegex({ mode, pattern, flags, testString, replacement }).then((result) => {
        if (evalTokenRef.current !== token) {
          return; // superseded by a newer evaluation — ignore this stale result
        }
        setIsEvaluating(false);

        if (result.status === 'timeout') {
          setTimedOut(true);
          setMatches([]);
          setReplaceResult(null);
          return;
        }
        if (result.status === 'error') {
          setErrorMessage(result.error);
          setMatches([]);
          setReplaceResult(null);
          return;
        }
        setMatches(result.matches);
        setReplaceResult(result.replaceResult);
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [pattern, flags, testString, mode, replacement, runRegex]);

  function handlePatternChange(event: ChangeEvent<HTMLInputElement>) {
    setPattern(event.target.value);
    setActivePresetDescription(null);
  }

  function handlePresetClick(preset: (typeof REGEX_PRESETS)[number]) {
    setPattern(preset.pattern);
    setActivePresetDescription(preset.description);
    setFlagState((prev) => {
      const next = { ...prev };
      for (const key of FLAG_KEYS) {
        next[key] = preset.flags.includes(key);
      }
      return next;
    });
  }

  function handleScroll(event: UIEvent<HTMLTextAreaElement>) {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = event.currentTarget.scrollTop;
      highlightRef.current.scrollLeft = event.currentTarget.scrollLeft;
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center rounded-md border border-ink/10 bg-paper px-3 font-mono text-sm text-ink focus-within:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper">
          <span className="text-ink/30 dark:text-paper/30">/</span>
          <input
            type="text"
            value={pattern}
            onChange={handlePatternChange}
            placeholder="pattern"
            aria-label="Regular expression pattern"
            spellCheck={false}
            className="flex-1 bg-transparent py-2 outline-none"
          />
          <span className="text-ink/30 dark:text-paper/30">/{flags}</span>
        </div>
        <CopyButton value={`/${pattern}/${flags}`} disabled={!pattern} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FLAG_KEYS.map((key) => (
          <label
            key={key}
            title={FLAG_INFO[key]}
            className={`flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-xs ${
              flagState[key]
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-ink/15 text-ink/50 dark:border-paper/15 dark:text-paper/50'
            }`}
          >
            <input
              type="checkbox"
              checked={flagState[key]}
              onChange={(event) => setFlagState((prev) => ({ ...prev, [key]: event.target.checked }))}
              className="sr-only"
            />
            {key}
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant={mode === 'match' ? 'primary' : 'secondary'} size="sm" onClick={() => setMode('match')}>
          Match
        </Button>
        <Button variant={mode === 'replace' ? 'primary' : 'secondary'} size="sm" onClick={() => setMode('replace')}>
          Replace
        </Button>
      </div>

      {mode === 'replace' && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink/50 dark:text-paper/50">
            Replacement — use $1, $2, $&lt;name&gt; for capture groups
          </span>
          <input
            type="text"
            value={replacement}
            onChange={(event) => setReplacement(event.target.value)}
            placeholder="Replacement text"
            aria-label="Replacement"
            spellCheck={false}
            className="w-full rounded-md border border-ink/10 bg-paper px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-ink/50 dark:text-paper/50">Common patterns</span>
        <div className="flex flex-wrap gap-2">
          {REGEX_PRESETS.map((preset) => (
            <Button
              key={preset.name}
              variant="secondary"
              size="sm"
              title={preset.description}
              onClick={() => handlePresetClick(preset)}
            >
              {preset.name}
            </Button>
          ))}
        </div>
        {activePresetDescription && (
          <p className="text-xs text-ink/50 dark:text-paper/50">{activePresetDescription}</p>
        )}
      </div>

      {errorMessage && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {errorMessage}
        </p>
      )}
      {timedOut && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          This pattern is taking too long to evaluate — it may be catastrophically backtracking. Try simplifying it.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-ink/50 dark:text-paper/50">Test string</span>
        {/* Dual-layer editor: the textarea handles real typing/selection/caret
            with its own text made invisible; a synced div behind it renders
            the same text with match highlighting showing through. Resize is
            disabled since a manual resize would desync the two layers. */}
        <div className="relative">
          <div
            ref={highlightRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words rounded-md border border-transparent p-3 font-mono text-sm text-ink dark:text-paper"
          >
            {renderHighlightedText(testString, matches)}
          </div>
          <textarea
            value={testString}
            onChange={(event) => setTestString(event.target.value)}
            onScroll={handleScroll}
            spellCheck={false}
            placeholder="Paste or type text to test against the pattern…"
            aria-label="Test string"
            className="relative h-64 w-full resize-none whitespace-pre-wrap break-words rounded-md border border-ink/10 bg-transparent p-3 font-mono text-sm text-transparent caret-ink outline-none focus:border-accent dark:border-paper/10 dark:caret-paper"
          />
        </div>
        <span className="text-xs text-ink/50 dark:text-paper/50">
          {isEvaluating ? 'Evaluating…' : `${matches.length} match${matches.length === 1 ? '' : 'es'} found`}
        </span>
      </div>

      {mode === 'replace' && replaceResult !== null && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink/50 dark:text-paper/50">Result</span>
          <textarea
            value={replaceResult}
            readOnly
            spellCheck={false}
            aria-label="Replace result"
            className="h-32 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none dark:border-paper/10 dark:bg-ink dark:text-paper"
          />
          <CopyButton value={replaceResult} disabled={!replaceResult} />
        </div>
      )}

      {matches.length > 0 && (
        <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-md border border-ink/10 p-2 font-mono text-xs dark:border-paper/10">
          {matches.map((m, i) => (
            <li key={i} className="rounded px-2 py-1.5 hover:bg-ink/5 dark:hover:bg-paper/5">
              <div>
                <span className="text-ink/40 dark:text-paper/40">[{i}]</span>{' '}
                <span className="text-accent">{JSON.stringify(m.match)}</span>{' '}
                <span className="text-ink/40 dark:text-paper/40">at {m.index}</span>
              </div>
              {m.groups.map((group, groupIndex) => (
                <div key={groupIndex} className="pl-4 text-ink/60 dark:text-paper/60">
                  group {groupIndex + 1}: {group.value !== undefined ? JSON.stringify(group.value) : '(no match)'}
                </div>
              ))}
              {Object.entries(m.namedGroups).map(([name, group]) => (
                <div key={name} className="pl-4 text-ink/60 dark:text-paper/60">
                  &lt;{name}&gt;: {group.value !== undefined ? JSON.stringify(group.value) : '(no match)'}
                </div>
              ))}
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-lg border border-ink/10 dark:border-paper/10">
        <button
          type="button"
          onClick={() => setShowCheatSheet((prev) => !prev)}
          aria-expanded={showCheatSheet}
          className="flex w-full items-center justify-between p-4 text-left text-sm font-medium text-ink dark:text-paper"
        >
          Cheat sheet
          <span className="text-ink/40 dark:text-paper/40" aria-hidden>
            {showCheatSheet ? '−' : '+'}
          </span>
        </button>
        {showCheatSheet && (
          <div className="border-t border-ink/10 p-4 dark:border-paper/10">
            <table className="w-full text-left text-sm">
              <tbody>
                {CHEAT_SHEET.map((row) => (
                  <tr key={row.token} className="border-b border-ink/5 last:border-0 dark:border-paper/5">
                    <td className="whitespace-nowrap py-1.5 pr-4 font-mono text-accent">{row.token}</td>
                    <td className="py-1.5 text-ink/70 dark:text-paper/70">{row.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
