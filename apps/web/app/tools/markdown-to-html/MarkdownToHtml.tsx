'use client';

import { useEffect, useState } from 'react';
import { Button, Checkbox, CopyButton } from '@aakasa/ui';
import { convertMarkdownToHtml, type MarkdownConvertResult } from './utils/markdownConvert';

type ViewMode = 'preview' | 'html';

const SAMPLE_MARKDOWN = `# Sample document

A quick tour of what this converter handles, courtesy of **GitHub Flavored Markdown**.

## Text formatting

*Italic*, **bold**, \`inline code\`, and ~~strikethrough~~ all work, along with [a link](https://example.com).

## Task list

- [x] Write the sample document
- [ ] Ship the tool
- [ ] Celebrate

## Code block

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Table

| Feature       | Supported |
| ------------- | --------- |
| Tables        | Yes       |
| Task lists    | Yes       |
| Strikethrough | Yes       |
`;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);
  return debounced;
}

const EMPTY_RESULT: MarkdownConvertResult = { rawHtml: '', sanitizedHtml: '' };

// Tailwind's preflight strips default styling from headings/lists/etc, and
// content inserted via dangerouslySetInnerHTML can't be targeted with
// component-scoped classNames — so the preview's typography is applied here
// as descendant-selector utilities on the wrapping container.
const PREVIEW_CLASSES = [
  '[&_h1]:mb-3 [&_h1]:mt-5 [&_h1]:text-2xl [&_h1]:font-bold [&_h1:first-child]:mt-0',
  '[&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold',
  '[&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-lg [&_h3]:font-semibold',
  '[&_p]:my-2 [&_p]:leading-relaxed',
  '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5',
  '[&_a]:text-accent [&_a]:underline',
  '[&_strong]:font-semibold [&_em]:italic [&_del]:opacity-60',
  '[&_code]:rounded [&_code]:bg-ink/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] dark:[&_code]:bg-paper/10',
  '[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-ink/5 [&_pre]:p-3 dark:[&_pre]:bg-paper/5',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-ink/20 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-ink/70 dark:[&_blockquote]:border-paper/20 dark:[&_blockquote]:text-paper/70',
  '[&_hr]:my-4 [&_hr]:border-ink/10 dark:[&_hr]:border-paper/10',
  '[&_img]:max-w-full [&_img]:rounded',
  '[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm',
  '[&_th]:border [&_th]:border-ink/15 [&_th]:bg-ink/5 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left dark:[&_th]:border-paper/15 dark:[&_th]:bg-paper/10',
  '[&_td]:border [&_td]:border-ink/15 [&_td]:px-2 [&_td]:py-1 dark:[&_td]:border-paper/15',
  '[&_input]:mr-1.5 [&_input]:align-middle',
].join(' ');

export function MarkdownToHtml() {
  const [markdown, setMarkdown] = useState('');
  const [gfm, setGfm] = useState(true);
  const [breaks, setBreaks] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [result, setResult] = useState<MarkdownConvertResult>(EMPTY_RESULT);

  const debouncedMarkdown = useDebouncedValue(markdown, 200);

  // convertMarkdownToHtml calls DOMPurify.sanitize, which silently no-ops
  // (returns its input completely unsanitized) when there's no window —
  // i.e. during Next.js's server-side render of this client component. This
  // effect never runs during SSR, so `result` stays empty until the first
  // client-side pass, guaranteeing sanitization always actually happens
  // before anything reaches the preview's dangerouslySetInnerHTML below.
  useEffect(() => {
    setResult(debouncedMarkdown.trim() ? convertMarkdownToHtml(debouncedMarkdown, { gfm, breaks }) : EMPTY_RESULT);
  }, [debouncedMarkdown, gfm, breaks]);

  function handleLoadSample() {
    setMarkdown(SAMPLE_MARKDOWN);
  }

  function handleClear() {
    setMarkdown('');
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
        <Checkbox label="GFM extensions (tables, task lists, strikethrough)" checked={gfm} onChange={(event) => setGfm(event.target.checked)} />
        <div className="flex flex-col gap-0.5">
          <Checkbox label="Single newline starts a new line (breaks)" checked={breaks} onChange={(event) => setBreaks(event.target.checked)} />
          <span className="text-xs text-ink/40 dark:text-paper/40">
            Off (standard Markdown): a blank line is needed between paragraphs — a single line break is ignored. On: every
            line break becomes a visible <code className="font-mono">&lt;br&gt;</code>, closer to plain-text formatting.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-ink/50 dark:text-paper/50">
            <span>Markdown input</span>
            <span>{markdown.length.toLocaleString()} chars</span>
          </div>
          <textarea
            value={markdown}
            onChange={(event) => setMarkdown(event.target.value)}
            spellCheck={false}
            placeholder="Type or paste Markdown here…"
            aria-label="Markdown input"
            className="h-96 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
          />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleLoadSample}>
              Load sample Markdown
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClear} disabled={!markdown}>
              Clear
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex gap-1 rounded-md bg-ink/5 p-1 dark:bg-paper/10">
              <ViewModeButton active={viewMode === 'preview'} onClick={() => setViewMode('preview')}>
                Preview
              </ViewModeButton>
              <ViewModeButton active={viewMode === 'html'} onClick={() => setViewMode('html')}>
                HTML source
              </ViewModeButton>
            </div>
            {viewMode === 'html' && <CopyButton value={result.rawHtml} disabled={!result.rawHtml} />}
          </div>

          {viewMode === 'preview' ? (
            <div
              className={`h-96 w-full overflow-auto rounded-md border border-ink/10 bg-paper p-3 text-sm text-ink dark:border-paper/10 dark:bg-ink dark:text-paper ${PREVIEW_CLASSES}`}
              // Sanitized by DOMPurify inside convertMarkdownToHtml — never
              // render `result.rawHtml` here, only `result.sanitizedHtml`.
              dangerouslySetInnerHTML={{ __html: result.sanitizedHtml || '<p style="opacity:.4">Preview will appear here…</p>' }}
            />
          ) : (
            <textarea
              value={result.rawHtml}
              readOnly
              spellCheck={false}
              placeholder="Generated HTML will appear here…"
              aria-label="HTML output"
              className="h-96 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none dark:border-paper/10 dark:bg-ink dark:text-paper"
            />
          )}
        </div>
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">
        This tool runs entirely in your browser — nothing you enter is uploaded or stored. Raw HTML in your Markdown is
        sanitized before it&apos;s rendered in the Preview pane (the HTML-source view shows the unsanitized markup as
        plain text, which is safe since it&apos;s never executed there).
      </span>
    </div>
  );
}

function ViewModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
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
