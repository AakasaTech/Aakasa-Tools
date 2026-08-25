'use client';

import { useMemo, useState } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import { parseCurlCommand } from './utils/parseCurl';
import { generateFetchJs } from './utils/generators/generateFetchJs';
import { generateAxios } from './utils/generators/generateAxios';
import { generatePythonRequests } from './utils/generators/generatePythonRequests';
import { generatePhpCurl } from './utils/generators/generatePhpCurl';

type Target = 'fetch' | 'axios' | 'python' | 'php';

const TARGET_LABELS: Record<Target, string> = {
  fetch: 'JavaScript (fetch)',
  axios: 'Node.js (axios)',
  python: 'Python (requests)',
  php: 'PHP (cURL)',
};

const SAMPLE_COMMAND = `curl -X POST 'https://api.example.com/v1/users' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \\
  -d '{"name": "Jane Doe", "email": "jane@example.com", "role": "admin"}'`;

const textareaClasses =
  'h-56 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper';

export function CurlToCode() {
  const [command, setCommand] = useState('');
  const [target, setTarget] = useState<Target>('fetch');

  const { parsed, unsupportedFlags } = useMemo(() => {
    if (!command.trim()) {
      return { parsed: null, unsupportedFlags: [] as string[] };
    }
    const result = parseCurlCommand(command);
    return { parsed: result.parsed, unsupportedFlags: result.unsupportedFlags };
  }, [command]);

  const generatedCode = useMemo(() => {
    if (!parsed || !parsed.url) return '';
    if (target === 'fetch') return generateFetchJs(parsed);
    if (target === 'axios') return generateAxios(parsed);
    if (target === 'python') return generatePythonRequests(parsed);
    return generatePhpCurl(parsed);
  }, [parsed, target]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-ink/50 dark:text-paper/50">
          <span>cURL command</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setCommand(SAMPLE_COMMAND)} className="text-accent hover:underline">
              Sample
            </button>
            <button type="button" onClick={() => setCommand('')} className="text-accent hover:underline" disabled={!command}>
              Clear
            </button>
          </div>
        </div>
        <textarea
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          spellCheck={false}
          placeholder="Paste a curl command — e.g. copied from DevTools' 'Copy as cURL'…"
          aria-label="cURL command"
          className={textareaClasses}
        />
      </div>

      {unsupportedFlags.length > 0 && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
          Not supported, and ignored: <span className="font-mono">{unsupportedFlags.join(', ')}</span>. The rest of the command was still
          parsed and converted below.
        </p>
      )}

      {command.trim() && !parsed?.url && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
          Couldn&apos;t find a URL in this command — check that it starts with <span className="font-mono">curl</span> followed by a URL.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {(Object.keys(TARGET_LABELS) as Target[]).map((key) => (
          <Button key={key} variant={target === key ? 'primary' : 'secondary'} size="sm" onClick={() => setTarget(key)}>
            {TARGET_LABELS[key]}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-ink/50 dark:text-paper/50">
          <span>{TARGET_LABELS[target]}</span>
          <CopyButton value={generatedCode} disabled={!generatedCode} />
        </div>
        <pre className="min-h-[14rem] overflow-x-auto rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink dark:border-paper/10 dark:bg-ink dark:text-paper">
          {generatedCode || 'Paste a curl command above to see generated code here.'}
        </pre>
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">
        Nothing you paste here is stored or transmitted — parsing and code generation happen entirely in your browser. Curl commands copied
        from DevTools often contain live auth tokens or session cookies, so this matters more here than in most tools.
      </span>
    </div>
  );
}
