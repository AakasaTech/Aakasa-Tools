'use client';

import { useMemo, useState } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import { parseJson } from '@/app/tools/json-formatter/utils/jsonFormat';
import {
  generateTypescript,
  type DeclarationKind,
  type OptionalFieldsMode,
} from './utils/generateTypes';

const SAMPLE_JSON = `{
  "id": 101,
  "name": "Aakasa Toolbox",
  "isActive": true,
  "releaseDate": null,
  "tags": ["json", "typescript", "developer-tools"],
  "author": {
    "name": "Aakasa",
    "url": "https://aakasa.dev"
  },
  "contributors": [
    { "name": "Alex", "role": "engineer" },
    { "name": "Sam", "role": "designer" }
  ]
}`;

const DECLARATION_LABELS: Record<DeclarationKind, string> = {
  interface: 'interface',
  type: 'type',
};

const OPTIONAL_MODE_LABELS: Record<OptionalFieldsMode, string> = {
  infer: 'Infer from data',
  'all-optional': 'All optional',
  'all-required': 'All required',
};

const textareaClasses =
  'h-64 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper';

export function JsonToTypescript() {
  const [input, setInput] = useState('');
  const [rootName, setRootName] = useState('RootObject');
  const [declarationKind, setDeclarationKind] = useState<DeclarationKind>('interface');
  const [optionalFieldsMode, setOptionalFieldsMode] = useState<OptionalFieldsMode>('infer');
  const [semicolons, setSemicolons] = useState(true);

  const parseResult = useMemo(() => (input.trim() ? parseJson(input) : null), [input]);

  const output = useMemo(() => {
    if (!parseResult || !parseResult.success) {
      return '';
    }
    return generateTypescript(parseResult.value, {
      rootName,
      declarationKind,
      optionalFieldsMode,
      semicolons,
    });
  }, [parseResult, rootName, declarationKind, optionalFieldsMode, semicolons]);

  function handleDownload() {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${rootName.trim() || 'types'}.ts`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="root-name" className="text-sm font-medium text-ink dark:text-paper">
            Root interface name
          </label>
          <input
            id="root-name"
            type="text"
            value={rootName}
            onChange={(event) => setRootName(event.target.value)}
            placeholder="RootObject"
            spellCheck={false}
            className="w-full max-w-xs rounded-md border border-ink/10 bg-paper px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
          />
          <span className="text-xs text-ink/50 dark:text-paper/50">
            Nested interfaces are auto-named from their parent key, PascalCased (e.g. an <code>address</code> key
            becomes <code>Address</code>).
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-ink/50 dark:text-paper/50">Declaration style</span>
            <div className="flex gap-2">
              {(Object.keys(DECLARATION_LABELS) as DeclarationKind[]).map((kind) => (
                <Button
                  key={kind}
                  variant={declarationKind === kind ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setDeclarationKind(kind)}
                >
                  {DECLARATION_LABELS[kind]}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-ink/50 dark:text-paper/50">Optional fields</span>
            <div className="flex gap-2">
              {(Object.keys(OPTIONAL_MODE_LABELS) as OptionalFieldsMode[]).map((mode) => (
                <Button
                  key={mode}
                  variant={optionalFieldsMode === mode ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setOptionalFieldsMode(mode)}
                >
                  {OPTIONAL_MODE_LABELS[mode]}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-ink/50 dark:text-paper/50">Semicolons</span>
            <div className="flex gap-2">
              <Button variant={semicolons ? 'primary' : 'secondary'} size="sm" onClick={() => setSemicolons(true)}>
                Yes
              </Button>
              <Button variant={!semicolons ? 'primary' : 'secondary'} size="sm" onClick={() => setSemicolons(false)}>
                No
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-ink/50 dark:text-paper/50">JSON input</span>
            <Button variant="secondary" size="sm" onClick={() => setInput(SAMPLE_JSON)}>
              Load sample
            </Button>
          </div>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            spellCheck={false}
            placeholder="Paste JSON here…"
            aria-label="JSON input"
            className={textareaClasses}
          />
          {parseResult && !parseResult.success && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
              Line {parseResult.error.line}, column {parseResult.error.column}: {parseResult.error.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink/50 dark:text-paper/50">Generated TypeScript</span>
          <pre className={`${textareaClasses} overflow-auto whitespace-pre`}>
            <code>{output || (parseResult?.success ? '' : 'Result will appear here…')}</code>
          </pre>
          <div className="flex items-center gap-2">
            <CopyButton value={output} disabled={!output} />
            <Button variant="secondary" size="sm" onClick={handleDownload} disabled={!output}>
              Download as .ts
            </Button>
          </div>
        </div>
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">
        Nothing you paste here is stored or transmitted — generation happens entirely in your browser.
      </span>
    </div>
  );
}
