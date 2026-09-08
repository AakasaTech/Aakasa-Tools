'use client';

import { useEffect, useState } from 'react';
import { Button, Checkbox, CopyButton } from '@aakasa/ui';
import { generateLoremText, type LoremUnit } from './utils/generateLorem';
import { VARIANT_LABELS, type LoremVariant } from './utils/loremCorpus';

const UNIT_OPTIONS: { value: LoremUnit; label: string }[] = [
  { value: 'paragraphs', label: 'Paragraphs' },
  { value: 'sentences', label: 'Sentences' },
  { value: 'words', label: 'Words' },
];

export function LoremIpsumGenerator() {
  const [unit, setUnit] = useState<LoremUnit>('paragraphs');
  const [countValue, setCountValue] = useState('5');
  const [startWithClassicOpening, setStartWithClassicOpening] = useState(true);
  const [wrapInHtml, setWrapInHtml] = useState(false);
  const [variant, setVariant] = useState<LoremVariant>('classic');
  const [regenerateKey, setRegenerateKey] = useState(0);

  const count = Math.max(1, Math.min(500, Math.floor(Number(countValue)) || 1));

  // Generated client-side only, in an effect rather than during render:
  // the output is random, so computing it directly in the render body
  // would run once during SSR and again on the client's first render,
  // producing two different results and a hydration mismatch — the same
  // failure mode (and the same fix) as Random Data Generator's live
  // preview elsewhere in this toolbox.
  const [output, setOutput] = useState('');
  useEffect(() => {
    setOutput(generateLoremText(unit, count, startWithClassicOpening, wrapInHtml, variant));
  }, [unit, count, startWithClassicOpening, wrapInHtml, variant, regenerateKey]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          Generate
          <select
            value={unit}
            onChange={(event) => setUnit(event.target.value as LoremUnit)}
            className="rounded-md border border-ink/15 bg-paper px-3 py-2 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          >
            {UNIT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-paper text-ink dark:bg-ink dark:text-paper">
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          Count
          <input
            type="text"
            inputMode="numeric"
            value={countValue}
            onChange={(event) => setCountValue(event.target.value)}
            className="rounded-md border border-ink/15 bg-paper px-3 py-2 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          Style
          <select
            value={variant}
            onChange={(event) => setVariant(event.target.value as LoremVariant)}
            className="rounded-md border border-ink/15 bg-paper px-3 py-2 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          >
            {(Object.keys(VARIANT_LABELS) as LoremVariant[]).map((value) => (
              <option key={value} value={value} className="bg-paper text-ink dark:bg-ink dark:text-paper">
                {VARIANT_LABELS[value]}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <Button variant="secondary" size="md" onClick={() => setRegenerateKey((k) => k + 1)} className="w-full">
            Regenerate
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Checkbox
          label={`Start with "${variant === 'classic' ? 'Lorem ipsum dolor sit amet…' : "Let's circle back…"}"`}
          checked={startWithClassicOpening}
          onChange={(event) => setStartWithClassicOpening(event.target.checked)}
        />
        <Checkbox label="Wrap paragraphs in <p> tags" checked={wrapInHtml} onChange={(event) => setWrapInHtml(event.target.checked)} />
      </div>

      {variant === 'corporate' && (
        <p className="text-xs text-ink/50 dark:text-paper/50">
          An original, made-for-this-tool word list and set of sentence templates — not copied from any existing themed placeholder-text
          generator.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink/50 dark:text-paper/50">Output</span>
          <CopyButton value={output} size="sm" />
        </div>
        <div className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md border border-ink/10 bg-paper p-4 font-body text-sm leading-relaxed text-ink dark:border-paper/15 dark:bg-ink dark:text-paper">
          {output}
        </div>
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing you enter is uploaded or stored.</span>
    </div>
  );
}
