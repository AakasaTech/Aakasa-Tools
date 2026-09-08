'use client';

import { useEffect, useMemo, useState } from 'react';
import { CopyButton } from '@aakasa/ui';
import { countSentences, countWords } from '../word-counter/utils/textStats';
import { countSyllablesInText } from './utils/countSyllables';
import { calculateFleschKincaidGrade, calculateFleschReadingEase, getReadingEaseBand, READING_EASE_BANDS } from './utils/readabilityFormulas';
import { analyzeSentences } from './utils/splitSentences';

const SAMPLE_TEXT =
  'The quick brown fox jumps over the lazy dog. This sentence is short and easy to read. However, when a sentence becomes excessively long, incorporating multiple subordinate clauses, technical vocabulary, and an abundance of polysyllabic words, its overall comprehensibility for the average reader tends to diminish considerably.';

const DEBOUNCE_MS = 300;
const LONG_SENTENCE_MULTIPLIER = 1.5;
const COMPLEX_SYLLABLES_PER_WORD_THRESHOLD = 1.8;

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function ReadabilityAnalyzer() {
  const [input, setInput] = useState(SAMPLE_TEXT);
  const [debouncedInput, setDebouncedInput] = useState(SAMPLE_TEXT);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedInput(input), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input]);

  const stats = useMemo(() => {
    const wordCount = countWords(debouncedInput);
    const sentenceCount = countSentences(debouncedInput);
    const syllableCount = countSyllablesInText(debouncedInput);

    if (wordCount === 0 || sentenceCount === 0) return null;

    const avgSentenceLength = wordCount / sentenceCount;
    const avgSyllablesPerWord = syllableCount / wordCount;
    const fleschReadingEase = calculateFleschReadingEase(avgSentenceLength, avgSyllablesPerWord);
    const fleschKincaidGrade = calculateFleschKincaidGrade(avgSentenceLength, avgSyllablesPerWord);

    return { wordCount, sentenceCount, syllableCount, avgSentenceLength, avgSyllablesPerWord, fleschReadingEase, fleschKincaidGrade };
  }, [debouncedInput]);

  const sentences = useMemo(() => analyzeSentences(debouncedInput), [debouncedInput]);

  const summaryText = stats
    ? [
        `Readability summary:`,
        `Flesch Reading Ease: ${round(stats.fleschReadingEase, 1)} (${getReadingEaseBand(stats.fleschReadingEase).label})`,
        `Flesch-Kincaid Grade Level: ${round(stats.fleschKincaidGrade, 1)}`,
        `Avg sentence length: ${round(stats.avgSentenceLength, 1)} words`,
        `Avg syllables per word: ${round(stats.avgSyllablesPerWord, 2)}`,
        `Total syllables: ${stats.syllableCount}`,
      ].join('\n')
    : '';

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
        Text to analyze
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          spellCheck={false}
          placeholder="Paste a paragraph or article to analyze its readability…"
          className="h-56 w-full resize-y rounded-md border border-ink/15 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/15 dark:bg-ink dark:text-paper"
        />
      </label>

      {!stats ? (
        <p className="text-sm text-ink/40 dark:text-paper/40">Enter at least one full sentence to see readability scores.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
              <span className="text-xs text-ink/60 dark:text-paper/60">Flesch Reading Ease</span>
              <span className="font-mono text-2xl font-semibold text-ink dark:text-paper">{round(stats.fleschReadingEase, 1)}</span>
              <span className="text-xs text-ink/50 dark:text-paper/50">
                {getReadingEaseBand(stats.fleschReadingEase).label} — {getReadingEaseBand(stats.fleschReadingEase).gradeDescription} level
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
              <span className="text-xs text-ink/60 dark:text-paper/60">Flesch-Kincaid Grade Level</span>
              <span className="font-mono text-2xl font-semibold text-ink dark:text-paper">{round(stats.fleschKincaidGrade, 1)}</span>
              <span className="text-xs text-ink/50 dark:text-paper/50">Approximate US school grade level</span>
            </div>
          </div>

          <ReadingEaseGauge score={stats.fleschReadingEase} />

          <div className="grid grid-cols-3 gap-3 text-sm">
            <StatBox label="Avg sentence length" value={`${round(stats.avgSentenceLength, 1)} words`} />
            <StatBox label="Avg syllables/word" value={round(stats.avgSyllablesPerWord, 2).toString()} />
            <StatBox label="Total syllables" value={stats.syllableCount.toLocaleString()} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink dark:text-paper">Sentence complexity</span>
              <CopyButton value={summaryText} label="Copy summary" size="sm" />
            </div>
            <p className="text-xs text-ink/50 dark:text-paper/50">
              Sentences noticeably longer than average, or dense with multi-syllable words, are highlighted below — a practical starting point
              for finding where to simplify.
            </p>
            <div className="rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm leading-relaxed text-ink dark:border-paper/15 dark:bg-ink dark:text-paper">
              {sentences.map((sentence, index) => {
                const isLong = sentence.wordCount > stats.avgSentenceLength * LONG_SENTENCE_MULTIPLIER;
                const isComplex = sentence.avgSyllablesPerWord > COMPLEX_SYLLABLES_PER_WORD_THRESHOLD;
                const flagged = isLong || isComplex;
                return (
                  <span
                    key={index}
                    className={flagged ? 'rounded bg-danger/15 px-0.5 text-danger' : undefined}
                    title={flagged ? (isLong ? 'Longer than average' : 'Many multi-syllable words') : undefined}
                  >
                    {sentence.text}{' '}
                  </span>
                );
              })}
            </div>
          </div>
        </>
      )}

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing you enter is uploaded or stored.</span>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
      <span className="text-xs text-ink/50 dark:text-paper/50">{label}</span>
      <span className="font-mono font-medium text-ink dark:text-paper">{value}</span>
    </div>
  );
}

function ReadingEaseGauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const activeBand = getReadingEaseBand(score);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative flex h-3 w-full overflow-hidden rounded-full">
        {[...READING_EASE_BANDS].reverse().map((band) => (
          <div
            key={band.label}
            style={{ width: `${band.max - band.min}%` }}
            className={band.label === activeBand.label ? 'bg-accent' : 'bg-ink/10 dark:bg-paper/15'}
          />
        ))}
        <div
          className="absolute top-0 h-full w-0.5 bg-ink dark:bg-paper"
          style={{ left: `${clamped}%` }}
          aria-hidden
        />
      </div>
      <div className="flex justify-between text-[10px] text-ink/40 dark:text-paper/40">
        <span>0 (Very Difficult)</span>
        <span>100 (Very Easy)</span>
      </div>
    </div>
  );
}
