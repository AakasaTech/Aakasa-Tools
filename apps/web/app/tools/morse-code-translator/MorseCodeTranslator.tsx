'use client';

import { useMemo, useState } from 'react';
import { Button, CopyButton, Slider } from '@aakasa/ui';
import { REFERENCE_CHART } from './utils/morseMap';
import { textToMorse, morseToText } from './utils/morseTranslate';
import { playMorseAudio, getMorseLetterPositions, type MorseLetterPosition } from './utils/morseAudio';

type Direction = 'text-to-morse' | 'morse-to-text';

const SAMPLE_TEXT = 'SOS HELLO WORLD';

export function MorseCodeTranslator() {
  const [direction, setDirection] = useState<Direction>('text-to-morse');
  const [input, setInput] = useState(SAMPLE_TEXT);
  const [wpm, setWpm] = useState(20);
  const [frequency, setFrequency] = useState(700);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeRange, setActiveRange] = useState<MorseLetterPosition | null>(null);
  const [showChart, setShowChart] = useState(false);

  const encodedMorse = useMemo(() => (direction === 'text-to-morse' ? textToMorse(input) : null), [direction, input]);
  const decodeResult = useMemo(() => (direction === 'morse-to-text' ? morseToText(input) : null), [direction, input]);

  const morseText = direction === 'text-to-morse' ? (encodedMorse ?? '') : input;
  const outputText = direction === 'text-to-morse' ? (encodedMorse ?? '') : (decodeResult?.result ?? '');
  const unrecognized = decodeResult?.unrecognized ?? [];

  function handleSwapDirection() {
    setInput(outputText);
    setDirection((prev) => (prev === 'text-to-morse' ? 'morse-to-text' : 'text-to-morse'));
  }

  function handleLoadSample() {
    setDirection('text-to-morse');
    setInput(SAMPLE_TEXT);
  }

  async function handlePlay() {
    if (!morseText.trim() || isPlaying) return;
    setIsPlaying(true);
    try {
      await playMorseAudio(morseText, { wpm, frequency }, (index) => {
        const positions = getMorseLetterPositions(morseText);
        const range = positions.find((p) => p.start === index);
        setActiveRange(range ?? null);
      });
    } finally {
      setIsPlaying(false);
      setActiveRange(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-md bg-ink/5 p-1 dark:bg-paper/10">
          <DirectionButton active={direction === 'text-to-morse'} onClick={() => setDirection('text-to-morse')}>
            Text → Morse
          </DirectionButton>
          <DirectionButton active={direction === 'morse-to-text'} onClick={() => setDirection('morse-to-text')}>
            Morse → Text
          </DirectionButton>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSwapDirection} disabled={!outputText}>
          Swap ⇄
        </Button>
        <Button variant="ghost" size="sm" onClick={handleLoadSample}>
          Sample
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setInput('')} disabled={!input}>
          Clear
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink/50 dark:text-paper/50">{direction === 'text-to-morse' ? 'Text' : 'Morse code'}</span>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            spellCheck={false}
            placeholder={direction === 'text-to-morse' ? 'Type text here…' : 'Type dots and dashes here (e.g. ... --- ...)…'}
            aria-label={direction === 'text-to-morse' ? 'Text input' : 'Morse code input'}
            className={`h-64 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper ${
              direction === 'morse-to-text' ? 'font-mono' : ''
            }`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-ink/50 dark:text-paper/50">
            <span>{direction === 'text-to-morse' ? 'Morse code' : 'Text'}</span>
          </div>

          {direction === 'text-to-morse' && isPlaying ? (
            <div
              aria-label="Morse code output"
              className="h-64 w-full overflow-auto whitespace-pre-wrap break-words rounded-md border border-accent bg-paper p-3 font-mono text-sm text-ink dark:border-accent dark:bg-ink dark:text-paper"
            >
              <HighlightedText text={outputText} range={activeRange} />
            </div>
          ) : (
            <textarea
              value={outputText}
              readOnly
              spellCheck={false}
              aria-label={direction === 'text-to-morse' ? 'Morse code output' : 'Text output'}
              className={`h-64 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 text-sm text-ink outline-none dark:border-paper/10 dark:bg-ink dark:text-paper ${
                direction === 'text-to-morse' ? 'font-mono' : ''
              }`}
            />
          )}

          {unrecognized.length > 0 && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
              {unrecognized.length} sequence{unrecognized.length === 1 ? '' : 's'} couldn&apos;t be decoded (shown in{' '}
              <code className="font-mono">[brackets]</code> above): {unrecognized.join(', ')}
            </p>
          )}

          <div className="flex items-center gap-2">
            <CopyButton value={outputText} disabled={!outputText} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-md border border-ink/10 p-3 dark:border-paper/10">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void handlePlay()} disabled={!morseText.trim() || isPlaying} size="md">
            {isPlaying ? 'Playing…' : '▶ Play'}
          </Button>
          {isPlaying && (
            <span className="text-xs text-ink/50 dark:text-paper/50">
              Following along in Morse below highlights the letter currently sounding.
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Slider label="Speed (WPM)" min={5} max={40} value={wpm} onChange={setWpm} />
          <Slider label="Tone frequency (Hz)" min={300} max={1000} step={10} value={frequency} onChange={setFrequency} />
        </div>

        {direction === 'morse-to-text' && isPlaying && (
          <div className="rounded-md bg-ink/5 p-3 font-mono text-sm dark:bg-paper/10">
            <HighlightedText text={morseText} range={activeRange} />
          </div>
        )}
      </div>

      <div>
        <button type="button" onClick={() => setShowChart((value) => !value)} className="text-xs text-accent underline">
          {showChart ? 'Hide' : 'Show'} Morse code reference chart
        </button>
        {showChart && (
          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 rounded-md border border-ink/10 p-3 text-sm sm:grid-cols-4 dark:border-paper/10">
            {REFERENCE_CHART.map(({ char, morse }) => (
              <div key={char} className="flex items-center justify-between gap-2 text-ink/70 dark:text-paper/70">
                <span className="font-medium text-ink dark:text-paper">{char}</span>
                <span className="font-mono">{morse}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DirectionButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-paper text-ink shadow-sm dark:bg-ink dark:text-paper' : 'text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper'
      }`}
    >
      {children}
    </button>
  );
}

function HighlightedText({ text, range }: { text: string; range: MorseLetterPosition | null }) {
  if (!range) {
    return <span className="whitespace-pre-wrap break-words">{text}</span>;
  }
  const before = text.slice(0, range.start);
  const active = text.slice(range.start, range.end);
  const after = text.slice(range.end);
  return (
    <span className="whitespace-pre-wrap break-words">
      {before}
      <span className="rounded bg-accent px-0.5 text-white">{active}</span>
      {after}
    </span>
  );
}
