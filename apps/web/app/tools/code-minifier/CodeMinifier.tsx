'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import {
  beautifyCss,
  beautifyHtml,
  beautifyJs,
  getByteSize,
  minifyCss,
  minifyHtml,
  minifyJs,
  SAMPLE_CODE,
  type BraceStyle,
  type TransformResult,
} from './utils/codeTransform';

type Language = 'javascript' | 'css' | 'html';
type Mode = 'minify' | 'beautify';

const LANGUAGE_LABELS: Record<Language, string> = {
  javascript: 'JavaScript',
  css: 'CSS',
  html: 'HTML',
};

const EXTENSIONS: Record<Language, string> = {
  javascript: 'js',
  css: 'css',
  html: 'html',
};

const MIME_TYPES: Record<Language, string> = {
  javascript: 'text/javascript',
  css: 'text/css',
  html: 'text/html',
};

const textareaClasses =
  'h-80 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper';

function formatBytes(bytes: number): string {
  return `${bytes.toLocaleString()} B`;
}

export function CodeMinifier() {
  const [language, setLanguage] = useState<Language>('javascript');
  const [mode, setMode] = useState<Mode>('minify');
  const [input, setInput] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');
  const [indentSize, setIndentSize] = useState(2);
  const [useTabs, setUseTabs] = useState(false);
  const [braceStyle, setBraceStyle] = useState<BraceStyle>('collapse');
  const [mangle, setMangle] = useState(true);

  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [isRunning, setIsRunning] = useState(false);
  const latestRequestRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedInput(input), 300);
    return () => clearTimeout(timer);
  }, [input]);

  useEffect(() => {
    if (!debouncedInput.trim()) {
      setOutput('');
      setError(undefined);
      setIsRunning(false);
      return;
    }

    const requestId = (latestRequestRef.current += 1);
    setIsRunning(true);

    const beautifyOptions = { indentSize, useTabs, braceStyle };

    const run: Promise<TransformResult> =
      language === 'javascript'
        ? mode === 'minify'
          ? minifyJs(debouncedInput, { mangle })
          : beautifyJs(debouncedInput, beautifyOptions)
        : language === 'css'
          ? mode === 'minify'
            ? minifyCss(debouncedInput)
            : beautifyCss(debouncedInput, beautifyOptions)
          : mode === 'minify'
            ? minifyHtml(debouncedInput)
            : beautifyHtml(debouncedInput, beautifyOptions);

    void run.then((res) => {
      // Ignore this result if a newer request has since been kicked off
      // (fast-typing + async transforms could otherwise let a slow, stale
      // response overwrite a fresher one that already resolved).
      if (latestRequestRef.current !== requestId) return;
      setOutput(res.result);
      setError(res.error);
      setIsRunning(false);
    });
  }, [debouncedInput, language, mode, indentSize, useTabs, braceStyle, mangle]);

  function handleLoadSample() {
    setInput(SAMPLE_CODE[language]);
  }

  function handleDownload() {
    if (!output) return;
    const blob = new Blob([output], { type: MIME_TYPES[language] });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `output.${EXTENSIONS[language]}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const originalBytes = useMemo(() => getByteSize(input), [input]);
  const outputBytes = useMemo(() => getByteSize(output), [output]);
  const percentChange = originalBytes > 0 && output ? ((outputBytes - originalBytes) / originalBytes) * 100 : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => (
          <Button
            key={lang}
            variant={language === lang ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setLanguage(lang)}
          >
            {LANGUAGE_LABELS[lang]}
          </Button>
        ))}
        <span className="mx-1 text-ink/20 dark:text-paper/20">|</span>
        <Button variant={mode === 'minify' ? 'primary' : 'secondary'} size="sm" onClick={() => setMode('minify')}>
          Minify
        </Button>
        <Button variant={mode === 'beautify' ? 'primary' : 'secondary'} size="sm" onClick={() => setMode('beautify')}>
          Beautify
        </Button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleLoadSample}>
            Sample
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setInput('')} disabled={!input}>
            Clear
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
        {mode === 'beautify' && (
          <>
            <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
              Indent size
              <select
                value={indentSize}
                onChange={(event) => setIndentSize(Number(event.target.value))}
                className="rounded-md border border-ink/10 bg-paper px-2 py-1 text-sm text-ink dark:border-paper/10 dark:bg-ink dark:text-paper"
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
              </select>
            </label>
            <div className="flex gap-2">
              <Button variant={!useTabs ? 'primary' : 'secondary'} size="sm" onClick={() => setUseTabs(false)}>
                Spaces
              </Button>
              <Button variant={useTabs ? 'primary' : 'secondary'} size="sm" onClick={() => setUseTabs(true)}>
                Tabs
              </Button>
            </div>
            {language === 'javascript' && (
              <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
                Brace style
                <select
                  value={braceStyle}
                  onChange={(event) => setBraceStyle(event.target.value as BraceStyle)}
                  className="rounded-md border border-ink/10 bg-paper px-2 py-1 text-sm text-ink dark:border-paper/10 dark:bg-ink dark:text-paper"
                >
                  <option value="collapse">Collapse (else on same line)</option>
                  <option value="expand">Expand (else on own line)</option>
                </select>
              </label>
            )}
          </>
        )}

        {mode === 'minify' && language === 'javascript' && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-ink/50 dark:text-paper/50">Variable mangling</span>
            <Button variant={mangle ? 'primary' : 'secondary'} size="sm" onClick={() => setMangle((prev) => !prev)}>
              {mangle ? 'Mangle: on' : 'Mangle: off'}
            </Button>
          </div>
        )}

        {mode === 'minify' && language !== 'javascript' && (
          <span className="text-xs text-ink/50 dark:text-paper/50">No additional options for {LANGUAGE_LABELS[language]} minification.</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-ink/50 dark:text-paper/50">
            <span>{LANGUAGE_LABELS[language]} input</span>
            <span>{formatBytes(originalBytes)}</span>
          </div>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            spellCheck={false}
            placeholder={`Paste ${LANGUAGE_LABELS[language]} here…`}
            aria-label={`${LANGUAGE_LABELS[language]} input`}
            aria-invalid={!!error}
            className={textareaClasses}
          />
          {error && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-ink/50 dark:text-paper/50">
            <span>Output {isRunning ? '(working…)' : ''}</span>
            <span>
              {formatBytes(outputBytes)}
              {percentChange !== null && (
                <span className={percentChange <= 0 ? 'text-success' : 'text-ink/50 dark:text-paper/50'}>
                  {' '}
                  ({percentChange > 0 ? '+' : ''}
                  {percentChange.toFixed(1)}%)
                </span>
              )}
            </span>
          </div>
          <textarea
            value={output}
            readOnly
            spellCheck={false}
            placeholder="Result will appear here…"
            aria-label={`${LANGUAGE_LABELS[language]} output`}
            className={textareaClasses}
          />
          <div className="flex items-center gap-2">
            <CopyButton value={output} disabled={!output} />
            <Button variant="secondary" size="sm" onClick={handleDownload} disabled={!output}>
              Download .{EXTENSIONS[language]}
            </Button>
          </div>
        </div>
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">
        Nothing you paste here is stored or transmitted — everything runs entirely in your browser.
      </span>
    </div>
  );
}
