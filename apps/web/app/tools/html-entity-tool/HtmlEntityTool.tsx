'use client';

import { useEffect, useState } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import { COMMON_ENTITIES, decodeEntities, encodeEntities, type EntityFormat } from './utils/htmlEntities';

type Direction = 'encode' | 'decode';

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);
  return debounced;
}

function SwapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

const textareaClasses =
  'h-56 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper';

export function HtmlEntityTool() {
  const [direction, setDirection] = useState<Direction>('encode');
  const [input, setInput] = useState('');
  const [fullNonAscii, setFullNonAscii] = useState(false);
  const [format, setFormat] = useState<EntityFormat>('named-or-numeric');
  const [showReference, setShowReference] = useState(false);

  const debouncedInput = useDebouncedValue(input, 150);

  // encodeEntities/decodeEntities call document.createElement, so they can
  // only run client-side — computing them directly in the render body would
  // crash during Next.js's server-side render of this page. Deferring to an
  // effect (which never runs on the server) avoids that; output is empty
  // until the first client-side pass, same as any other client-only value.
  const [output, setOutput] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const result =
      direction === 'encode' ? encodeEntities(debouncedInput, { fullNonAscii, format }) : decodeEntities(debouncedInput);
    setOutput(result);
    // The preview never touches raw user input, and never uses
    // dangerouslySetInnerHTML: it's `decodeEntities(result)` — decoding the
    // ENCODED result back — rendered as a plain React text child, which
    // React always escapes. Since `result` in encode mode can never contain
    // a live "<" or ">" (encodeEntities always escapes those first,
    // regardless of the format/fullNonAscii toggles), decoding it back and
    // showing it as plain text is visually identical to what a real HTML
    // parser would render, without ever parsing anything as markup.
    setPreview(direction === 'encode' && result ? decodeEntities(result) : null);
  }, [direction, debouncedInput, fullNonAscii, format]);

  function handleSwap() {
    setInput(output);
    setDirection((prev) => (prev === 'encode' ? 'decode' : 'encode'));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={direction === 'encode' ? 'primary' : 'secondary'} size="sm" onClick={() => setDirection('encode')}>
          Encode
        </Button>
        <Button variant={direction === 'decode' ? 'primary' : 'secondary'} size="sm" onClick={() => setDirection('decode')}>
          Decode
        </Button>
        <Button variant="ghost" size="sm" onClick={handleSwap} disabled={!output}>
          <SwapIcon />
          Swap
        </Button>
      </div>

      {direction === 'encode' && (
        <div className="flex flex-col gap-3 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-ink/50 dark:text-paper/50">Characters to encode</span>
            <div className="flex flex-wrap gap-2">
              <Button variant={!fullNonAscii ? 'primary' : 'secondary'} size="sm" onClick={() => setFullNonAscii(false)}>
                Special characters only
              </Button>
              <Button variant={fullNonAscii ? 'primary' : 'secondary'} size="sm" onClick={() => setFullNonAscii(true)}>
                All non-ASCII characters
              </Button>
            </div>
            <span className="text-xs text-ink/50 dark:text-paper/50">
              {fullNonAscii
                ? 'Also converts accented letters, symbols, and emoji to entities — useful for maximum compatibility in older or stricter contexts.'
                : 'Escapes only the characters that are structurally significant in HTML: < > & " \''}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-ink/50 dark:text-paper/50">Output format</span>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={format === 'named-or-numeric' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFormat('named-or-numeric')}
              >
                Named where available
              </Button>
              <Button
                variant={format === 'numeric-only' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFormat('numeric-only')}
              >
                Always numeric
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink/50 dark:text-paper/50">Input</span>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            spellCheck={false}
            placeholder={direction === 'encode' ? 'Type or paste text to encode…' : 'Paste text containing entities to decode…'}
            aria-label="Input"
            className={textareaClasses}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink/50 dark:text-paper/50">Output</span>
          <textarea
            value={output}
            readOnly
            spellCheck={false}
            placeholder="Result will appear here…"
            aria-label="Output"
            className={textareaClasses}
          />
          <CopyButton value={output} disabled={!output} />
        </div>
      </div>

      {direction === 'encode' && output && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink/50 dark:text-paper/50">
            Preview — how this text displays once parsed as HTML
          </span>
          <div className="min-h-[2.5rem] w-full rounded-md border border-ink/10 bg-paper p-3 text-sm text-ink dark:border-paper/10 dark:bg-ink dark:text-paper">
            {preview}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-lg border border-ink/10 dark:border-paper/10">
        <button
          type="button"
          onClick={() => setShowReference((prev) => !prev)}
          aria-expanded={showReference}
          className="flex items-center justify-between gap-2 p-3 text-left"
        >
          <span className="font-display text-sm font-semibold text-ink dark:text-paper">Common entity reference</span>
          <span className="text-ink/40 dark:text-paper/40">{showReference ? '−' : '+'}</span>
        </button>
        {showReference && (
          <div className="overflow-x-auto border-t border-ink/10 dark:border-paper/10">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-xs text-ink/50 dark:border-paper/10 dark:text-paper/50">
                  <th className="px-3 py-2 font-medium">Character</th>
                  <th className="px-3 py-2 font-medium">Meaning</th>
                  <th className="px-3 py-2 font-medium">Named</th>
                  <th className="px-3 py-2 font-medium">Numeric</th>
                  <th className="px-3 py-2 font-medium">&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {COMMON_ENTITIES.map((entity) => {
                  const named = `&${entity.name};`;
                  const numeric = `&#${entity.char.codePointAt(0)};`;
                  return (
                    <tr key={entity.name} className="border-b border-ink/5 last:border-0 dark:border-paper/5">
                      <td className="px-3 py-2 font-mono text-base text-ink dark:text-paper">{entity.char}</td>
                      <td className="px-3 py-2 text-ink/70 dark:text-paper/70">{entity.label}</td>
                      <td className="px-3 py-2 font-mono text-xs text-ink dark:text-paper">{named}</td>
                      <td className="px-3 py-2 font-mono text-xs text-ink/60 dark:text-paper/60">{numeric}</td>
                      <td className="px-3 py-2">
                        <CopyButton value={named} size="sm" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">
        Nothing you type here is stored or transmitted — encoding and decoding happen entirely in your browser.
      </span>
    </div>
  );
}
