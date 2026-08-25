'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import { getByteSize, jsonToYaml, yamlToJson, SAMPLE_YAML, type YamlDumpOptions } from './utils/yamlJsonConvert';

type Direction = 'yaml-to-json' | 'json-to-yaml';

const textareaClasses =
  'h-80 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper';

export function YamlJsonConverter() {
  const [direction, setDirection] = useState<Direction>('yaml-to-json');
  const [input, setInput] = useState('');
  const [indentSize, setIndentSize] = useState(2);
  const [flowStyle, setFlowStyle] = useState(false);
  const [docSelection, setDocSelection] = useState<'all' | number>('all');

  const [debouncedInput, setDebouncedInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedInput(input), 300);
    return () => clearTimeout(timer);
  }, [input]);

  const yamlResult = useMemo(
    () => (direction === 'yaml-to-json' && debouncedInput.trim() ? yamlToJson(debouncedInput) : null),
    [direction, debouncedInput]
  );

  // The document selector resets to "all" whenever the set of documents
  // changes shape, so a stale numeric index from a previous 3-document
  // input can't silently point at a document that no longer exists.
  useEffect(() => {
    setDocSelection('all');
  }, [yamlResult?.data.length]);

  const jsonResult = useMemo(() => {
    if (direction !== 'json-to-yaml' || !debouncedInput.trim()) {
      return null;
    }
    const dumpOptions: YamlDumpOptions = { indent: indentSize, flowStyle };
    return jsonToYaml(debouncedInput, dumpOptions);
  }, [direction, debouncedInput, indentSize, flowStyle]);

  const error = direction === 'yaml-to-json' ? yamlResult?.error : jsonResult?.error;

  const output = useMemo(() => {
    if (direction === 'json-to-yaml') {
      return jsonResult && !jsonResult.error ? jsonResult.data : '';
    }
    if (!yamlResult || yamlResult.error) return '';
    // The ordinary case — one YAML document — converts straight to its own
    // JSON value, not a one-element array; the array-of-documents shape
    // only applies once there's genuinely more than one document to show.
    if (yamlResult.data.length === 0) return '';
    if (yamlResult.data.length === 1) return JSON.stringify(yamlResult.data[0], null, 2);
    if (docSelection === 'all') return JSON.stringify(yamlResult.data, null, 2);
    return JSON.stringify(yamlResult.data[docSelection], null, 2);
  }, [direction, jsonResult, yamlResult, docSelection]);

  function handleSwapDirection() {
    setDirection((prev) => (prev === 'yaml-to-json' ? 'json-to-yaml' : 'yaml-to-json'));
    setInput(output);
  }

  function handleLoadSample() {
    if (direction === 'yaml-to-json') {
      setInput(SAMPLE_YAML);
    } else {
      const sampleDoc = yamlToJson(SAMPLE_YAML).data[0];
      setInput(JSON.stringify(sampleDoc, null, 2));
    }
  }

  function handleDownload() {
    if (!output) return;
    const extension = direction === 'json-to-yaml' ? 'yaml' : 'json';
    const mimeType = direction === 'json-to-yaml' ? 'application/yaml' : 'application/json';
    const blob = new Blob([output], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `converted.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const documentCount = yamlResult?.data.length ?? 0;
  const inputStats = useMemo(() => ({ chars: input.length, bytes: getByteSize(input) }), [input]);
  const outputStats = useMemo(() => ({ chars: output.length, bytes: getByteSize(output) }), [output]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={direction === 'yaml-to-json' ? 'primary' : 'secondary'} size="sm" onClick={() => setDirection('yaml-to-json')}>
          YAML &rarr; JSON
        </Button>
        <Button variant={direction === 'json-to-yaml' ? 'primary' : 'secondary'} size="sm" onClick={() => setDirection('json-to-yaml')}>
          JSON &rarr; YAML
        </Button>
        <Button variant="ghost" size="sm" onClick={handleSwapDirection} disabled={!output}>
          Swap
        </Button>

        {direction === 'json-to-yaml' && (
          <>
            <label className="flex items-center gap-1.5 text-sm text-ink/70 dark:text-paper/70">
              Indent
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
              <Button variant={!flowStyle ? 'primary' : 'secondary'} size="sm" onClick={() => setFlowStyle(false)}>
                Block style
              </Button>
              <Button variant={flowStyle ? 'primary' : 'secondary'} size="sm" onClick={() => setFlowStyle(true)}>
                Flow style
              </Button>
            </div>
          </>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleLoadSample}>
            Sample
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setInput('')} disabled={!input}>
            Clear
          </Button>
        </div>
      </div>

      {direction === 'yaml-to-json' && documentCount > 1 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md bg-accent/10 px-3 py-2 text-sm text-ink dark:text-paper">
          <span>
            This YAML contains <strong>{documentCount} documents</strong> (separated by ---).
          </span>
          <select
            value={docSelection}
            onChange={(event) => setDocSelection(event.target.value === 'all' ? 'all' : Number(event.target.value))}
            className="rounded-md border border-ink/10 bg-paper px-2 py-1 text-sm text-ink dark:border-paper/10 dark:bg-ink dark:text-paper"
          >
            <option value="all">All documents (as array)</option>
            {Array.from({ length: documentCount }, (_, i) => (
              <option key={i} value={i}>
                Document {i + 1} of {documentCount}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-ink/50 dark:text-paper/50">
            <span>{direction === 'yaml-to-json' ? 'YAML input' : 'JSON input'}</span>
            <span>
              {inputStats.chars.toLocaleString()} chars &middot; {inputStats.bytes.toLocaleString()} bytes
            </span>
          </div>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            spellCheck={false}
            placeholder={direction === 'yaml-to-json' ? 'Paste YAML here…' : 'Paste JSON here…'}
            aria-label={direction === 'yaml-to-json' ? 'YAML input' : 'JSON input'}
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
            <span>{direction === 'yaml-to-json' ? 'JSON output' : 'YAML output'}</span>
            <span>
              {outputStats.chars.toLocaleString()} chars &middot; {outputStats.bytes.toLocaleString()} bytes
            </span>
          </div>
          <textarea
            value={output}
            readOnly
            spellCheck={false}
            placeholder="Result will appear here…"
            aria-label={direction === 'yaml-to-json' ? 'JSON output' : 'YAML output'}
            className={textareaClasses}
          />
          <div className="flex items-center gap-2">
            <CopyButton value={output} disabled={!output} />
            <Button variant="secondary" size="sm" onClick={handleDownload} disabled={!output}>
              Download {direction === 'json-to-yaml' ? '.yaml' : '.json'}
            </Button>
          </div>
        </div>
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">
        Nothing you paste here is stored or transmitted — conversion happens entirely in your browser.
      </span>
    </div>
  );
}
