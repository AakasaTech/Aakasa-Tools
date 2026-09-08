'use client';

import { useEffect, useState } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import { ASCII_FONTS, generateAscii, type AsciiFont } from './utils/generateAsciiArt';

const DEFAULT_TEXT = 'Aakasa';
const LONG_INPUT_WARNING_THRESHOLD = 20;
const DEFAULT_WIDTH = 120;

function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function AsciiArtGenerator() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [font, setFont] = useState<AsciiFont>('Standard');
  const [width, setWidthValue] = useState('120');
  const [output, setOutput] = useState('');

  const widthNumber = Math.max(20, Math.floor(Number(width)) || DEFAULT_WIDTH);

  useEffect(() => {
    let cancelled = false;
    const source = text.trim() || DEFAULT_TEXT;
    void generateAscii(source, font, { width: widthNumber }).then((result) => {
      if (!cancelled) setOutput(result);
    });
    return () => {
      cancelled = true;
    };
  }, [text, font, widthNumber]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="col-span-2 flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          Text
          <input
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            spellCheck={false}
            placeholder="Type a word or short phrase…"
            className="rounded-md border border-ink/15 bg-paper px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/15 dark:bg-ink dark:text-paper"
          />
          {text.length > LONG_INPUT_WARNING_THRESHOLD && (
            <span className="text-xs text-danger">
              Longer text can render very wide in banner fonts — consider a shorter phrase for a more usable result.
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          Max width
          <input
            type="text"
            inputMode="numeric"
            value={width}
            onChange={(event) => setWidthValue(event.target.value)}
            className="rounded-md border border-ink/15 bg-paper px-3 py-2 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-ink/70 dark:text-paper/70">Font style</span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ASCII_FONTS.map((fontName) => (
            <FontPreviewOption
              key={fontName}
              fontName={fontName}
              sampleText={text.trim() || DEFAULT_TEXT}
              selected={font === fontName}
              onSelect={() => setFont(fontName)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink/50 dark:text-paper/50">Output ({font})</span>
          <div className="flex gap-2">
            <CopyButton value={output} size="sm" disabled={!output} />
            <Button variant="secondary" size="sm" onClick={() => downloadTextFile(output, 'ascii-art.txt')} disabled={!output}>
              Download .txt
            </Button>
          </div>
        </div>
        <pre className="overflow-x-auto rounded-md border border-ink/15 bg-paper p-4 font-mono text-xs leading-tight text-ink dark:border-paper/15 dark:bg-ink dark:text-paper">
          {output || 'Generating…'}
        </pre>
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">
        This tool runs entirely in your browser — nothing you enter is uploaded or stored. Paste the output somewhere that uses a monospace
        font, or the alignment will break.
      </span>
    </div>
  );
}

function FontPreviewOption({
  fontName,
  sampleText,
  selected,
  onSelect,
}: {
  fontName: AsciiFont;
  sampleText: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const [preview, setPreview] = useState('');

  useEffect(() => {
    let cancelled = false;
    void generateAscii(sampleText, fontName, { width: 200 }).then((result) => {
      if (!cancelled) setPreview(result);
    });
    return () => {
      cancelled = true;
    };
  }, [sampleText, fontName]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col gap-1 rounded-md border p-2 text-left transition-colors ${
        selected ? 'border-accent bg-accent/5' : 'border-ink/10 hover:border-ink/30 dark:border-paper/10 dark:hover:border-paper/30'
      }`}
    >
      <span className="text-xs font-medium text-ink/70 dark:text-paper/70">{fontName}</span>
      <pre className="overflow-hidden text-ellipsis whitespace-pre font-mono text-[9px] leading-tight text-ink dark:text-paper">
        {preview || '…'}
      </pre>
    </button>
  );
}
