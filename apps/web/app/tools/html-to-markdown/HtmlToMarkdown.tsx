'use client';

import { useEffect, useState } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import {
  convertHtmlToMarkdown,
  type BulletListMarker,
  type CodeBlockStyle,
  type HeadingStyle,
  type LinkStyle,
} from './utils/htmlToMarkdown';

const SAMPLE_HTML = `<h1>Sample Document</h1>
<p>This paragraph has <strong>bold text</strong>, <em>italic text</em>, and a <a href="https://example.com">link</a>.</p>
<h2>A list</h2>
<ul>
  <li>First item with a <a href="https://example.com">link</a> and <strong>bold</strong></li>
  <li>Second item</li>
  <li>Third item</li>
</ul>
<h2>Code</h2>
<pre><code>function hello() {
  console.log("Hello, world!");
}</code></pre>
`;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);
  return debounced;
}

function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const textareaClasses =
  'h-96 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper';

function ToggleGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-ink/70 dark:text-paper/70">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <Button
            key={option.value}
            variant={value === option.value ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function HtmlToMarkdown() {
  const [html, setHtml] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [clipboardMessage, setClipboardMessage] = useState<string | null>(null);

  const [headingStyle, setHeadingStyle] = useState<HeadingStyle>('atx');
  const [bulletListMarker, setBulletListMarker] = useState<BulletListMarker>('-');
  const [codeBlockStyle, setCodeBlockStyle] = useState<CodeBlockStyle>('fenced');
  const [linkStyle, setLinkStyle] = useState<LinkStyle>('inlined');

  const debouncedHtml = useDebouncedValue(html, 200);

  useEffect(() => {
    setMarkdown(convertHtmlToMarkdown(debouncedHtml, { headingStyle, bulletListMarker, codeBlockStyle, linkStyle }));
  }, [debouncedHtml, headingStyle, bulletListMarker, codeBlockStyle, linkStyle]);

  function handleLoadSample() {
    setHtml(SAMPLE_HTML);
    setClipboardMessage(null);
  }

  function handleClear() {
    setHtml('');
    setClipboardMessage(null);
  }

  function handleDownload() {
    if (!markdown) return;
    downloadTextFile(markdown, 'converted.md');
  }

  async function handlePasteFromClipboard() {
    setClipboardMessage(null);

    if (!navigator.clipboard || !navigator.clipboard.read) {
      setClipboardMessage("This browser doesn't support reading rich clipboard content — paste manually instead (Ctrl+V / Cmd+V).");
      return;
    }

    try {
      const items = await navigator.clipboard.read();

      for (const item of items) {
        if (item.types.includes('text/html')) {
          const blob = await item.getType('text/html');
          setHtml(await blob.text());
          return;
        }
      }

      for (const item of items) {
        if (item.types.includes('text/plain')) {
          const blob = await item.getType('text/plain');
          setHtml(await blob.text());
          setClipboardMessage('Clipboard had no rich HTML — pasted plain text instead.');
          return;
        }
      }

      setClipboardMessage('Clipboard has no HTML or text content to paste.');
    } catch {
      setClipboardMessage('Clipboard permission was denied — paste manually instead (Ctrl+V / Cmd+V).');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
        <ToggleGroup
          label="Heading style"
          value={headingStyle}
          onChange={setHeadingStyle}
          options={[
            { value: 'atx', label: 'ATX (# Heading)' },
            { value: 'setext', label: 'Setext (Heading\\n===)' },
          ]}
        />
        <ToggleGroup
          label="Bullet marker"
          value={bulletListMarker}
          onChange={setBulletListMarker}
          options={[
            { value: '-', label: '-' },
            { value: '*', label: '*' },
            { value: '+', label: '+' },
          ]}
        />
        <ToggleGroup
          label="Code block style"
          value={codeBlockStyle}
          onChange={setCodeBlockStyle}
          options={[
            { value: 'fenced', label: 'Fenced (```)' },
            { value: 'indented', label: 'Indented' },
          ]}
        />
        <ToggleGroup
          label="Link style"
          value={linkStyle}
          onChange={setLinkStyle}
          options={[
            { value: 'inlined', label: 'Inline' },
            { value: 'referenced', label: 'Reference-style' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-ink/50 dark:text-paper/50">
            <span>HTML input</span>
            <span>{html.length.toLocaleString()} chars</span>
          </div>
          <textarea
            value={html}
            onChange={(event) => {
              setHtml(event.target.value);
              setClipboardMessage(null);
            }}
            spellCheck={false}
            placeholder="Paste raw HTML here…"
            aria-label="HTML input"
            className={textareaClasses}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => void handlePasteFromClipboard()}>
              Paste from clipboard
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLoadSample}>
              Load sample HTML
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClear} disabled={!html}>
              Clear
            </Button>
          </div>
          {clipboardMessage && <p className="text-xs text-ink/50 dark:text-paper/50">{clipboardMessage}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-ink/50 dark:text-paper/50">
            <span>Markdown output</span>
            <span>{markdown.length.toLocaleString()} chars</span>
          </div>
          <textarea
            value={markdown}
            readOnly
            spellCheck={false}
            placeholder="Converted Markdown will appear here…"
            aria-label="Markdown output"
            className={textareaClasses}
          />
          <div className="flex items-center gap-2">
            <CopyButton value={markdown} disabled={!markdown} />
            <Button variant="secondary" size="sm" onClick={handleDownload} disabled={!markdown}>
              Download .md
            </Button>
          </div>
        </div>
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing you enter is uploaded or stored.</span>
    </div>
  );
}
