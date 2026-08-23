'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Button, Checkbox } from '@aakasa/ui';
import {
  countCharacters,
  countParagraphs,
  countSentences,
  countWords,
  estimateReadingTime,
  estimateSpeakingTime,
  getKeywordDensity,
  type KeywordDensityEntry,
} from './utils/textStats';

interface LimitPreset {
  key: string;
  label: string;
  limit: number;
}

const LIMIT_PRESETS: LimitPreset[] = [
  { key: 'twitter', label: 'Twitter/X (280)', limit: 280 },
  { key: 'sms', label: 'SMS (160)', limit: 160 },
  { key: 'meta', label: 'Meta description (160)', limit: 160 },
  { key: 'instagram', label: 'Instagram caption (2200)', limit: 2200 },
];

function formatMinutes(minutes: number): string {
  if (minutes <= 0) {
    return '~0 min';
  }
  return `~${Math.max(1, Math.round(minutes))} min`;
}

export function WordCounter() {
  const [text, setText] = useState('');
  const [limitEnabled, setLimitEnabled] = useState(false);
  const [limitValue, setLimitValue] = useState(280);
  const [showKeywordDensity, setShowKeywordDensity] = useState(false);
  const [keywordDensity, setKeywordDensity] = useState<KeywordDensityEntry[]>([]);

  const wordCount = useMemo(() => countWords(text), [text]);
  const charCountWithSpaces = useMemo(() => countCharacters(text, true), [text]);
  const charCountNoSpaces = useMemo(() => countCharacters(text, false), [text]);
  const sentenceCount = useMemo(() => countSentences(text), [text]);
  const paragraphCount = useMemo(() => countParagraphs(text), [text]);
  const readingMinutes = useMemo(() => estimateReadingTime(wordCount), [wordCount]);
  const speakingMinutes = useMemo(() => estimateSpeakingTime(wordCount), [wordCount]);

  // Word/char/sentence/paragraph counts above are cheap and stay instant.
  // Keyword density does a regex tokenize + frequency sort, so it alone is
  // debounced.
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeywordDensity(getKeywordDensity(text, 10));
    }, 300);
    return () => clearTimeout(timer);
  }, [text]);

  const remaining = limitValue - charCountWithSpaces;
  const isOverLimit = limitEnabled && remaining < 0;

  function handlePresetChange(event: ChangeEvent<HTMLSelectElement>) {
    const preset = LIMIT_PRESETS.find((item) => item.key === event.target.value);
    if (preset) {
      setLimitValue(preset.limit);
      setLimitEnabled(true);
    }
    event.target.value = '';
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 rounded-lg border border-ink/10 p-4 sm:grid-cols-4 lg:grid-cols-7 dark:border-paper/10">
        <Stat label="Words" value={wordCount.toLocaleString()} />
        <Stat label="Characters" value={charCountWithSpaces.toLocaleString()} />
        <Stat label="Characters (no spaces)" value={charCountNoSpaces.toLocaleString()} />
        <Stat label="Sentences" value={sentenceCount.toLocaleString()} />
        <Stat label="Paragraphs" value={paragraphCount.toLocaleString()} />
        <Stat label="Reading time" value={`${formatMinutes(readingMinutes)} read`} />
        <Stat label="Speaking time" value={`${formatMinutes(speakingMinutes)} speech`} />
      </div>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        spellCheck={true}
        placeholder="Start typing or paste your text here…"
        aria-label="Text to analyze"
        className="min-h-[16rem] w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
      />

      <div>
        <Button variant="secondary" size="sm" onClick={() => setText('')} disabled={!text}>
          Clear
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
        <Checkbox
          label="Set a character limit"
          checked={limitEnabled}
          onChange={(event) => setLimitEnabled(event.target.checked)}
        />
        {limitEnabled && (
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="number"
              min={1}
              value={limitValue}
              onChange={(event) => setLimitValue(Math.max(1, Number(event.target.value) || 1))}
              aria-label="Character limit"
              className="w-24 rounded-md border border-ink/10 bg-paper px-2 py-1 text-sm text-ink dark:border-paper/10 dark:bg-ink dark:text-paper"
            />
            <select
              defaultValue=""
              onChange={handlePresetChange}
              aria-label="Character limit presets"
              className="rounded-md border border-ink/10 bg-paper px-2 py-1 text-sm text-ink dark:border-paper/10 dark:bg-ink dark:text-paper"
            >
              <option value="" disabled>
                Presets…
              </option>
              {LIMIT_PRESETS.map((preset) => (
                <option key={preset.key} value={preset.key}>
                  {preset.label}
                </option>
              ))}
            </select>
            <span className={`text-sm font-medium ${isOverLimit ? 'text-danger' : 'text-ink dark:text-paper'}`}>
              {remaining < 0 ? `${Math.abs(remaining)} over limit` : `${remaining} remaining`}
            </span>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-ink/10 dark:border-paper/10">
        <button
          type="button"
          onClick={() => setShowKeywordDensity((prev) => !prev)}
          aria-expanded={showKeywordDensity}
          className="flex w-full items-center justify-between p-4 text-left text-sm font-medium text-ink dark:text-paper"
        >
          Keyword density
          <span className="text-ink/40 dark:text-paper/40" aria-hidden>
            {showKeywordDensity ? '−' : '+'}
          </span>
        </button>
        {showKeywordDensity && (
          <div className="border-t border-ink/10 p-4 dark:border-paper/10">
            {keywordDensity.length === 0 ? (
              <p className="text-sm text-ink/50 dark:text-paper/50">Not enough text yet.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {keywordDensity.map((item) => (
                  <li key={item.word} className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-mono text-ink dark:text-paper">{item.word}</span>
                    <span className="text-ink/60 dark:text-paper/60">
                      {item.count} &middot; {item.percentage.toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-ink/50 dark:text-paper/50">{label}</span>
      <span className="font-mono text-base font-medium text-ink dark:text-paper">{value}</span>
    </div>
  );
}
