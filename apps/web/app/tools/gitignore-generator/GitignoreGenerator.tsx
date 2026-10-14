'use client';

import { useMemo, useState } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import { GITIGNORE_TEMPLATES, TEMPLATE_CATEGORY_LABELS, type TemplateCategory } from './data/templates';
import { combineGitignoreTemplates } from './utils/combineTemplates';

const CATEGORY_ORDER: TemplateCategory[] = ['languages', 'editors', 'os', 'frameworks'];

const DEFAULT_SELECTION = ['Node', 'macOS', 'VisualStudioCode'];

function matchesQuery(label: string, query: string): boolean {
  return label.toLowerCase().includes(query.trim().toLowerCase());
}

export function GitignoreGenerator() {
  const [selected, setSelected] = useState<string[]>(DEFAULT_SELECTION);
  const [query, setQuery] = useState('');
  const [customPatterns, setCustomPatterns] = useState('');

  const groups = useMemo(() => {
    const trimmedQuery = query.trim();
    return CATEGORY_ORDER.map((category) => ({
      category,
      templates: GITIGNORE_TEMPLATES.filter(
        (template) => template.category === category && (!trimmedQuery || matchesQuery(template.label, trimmedQuery))
      ),
    })).filter((group) => group.templates.length > 0);
  }, [query]);

  const output = useMemo(() => combineGitignoreTemplates(selected, customPatterns), [selected, customPatterns]);

  function toggleTemplate(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function handleClearSelection() {
    setSelected([]);
  }

  function handleDownload() {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '.gitignore';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search templates…"
              aria-label="Search templates"
              className="w-full rounded-md border border-ink/10 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
            />
            <Button variant="ghost" size="sm" onClick={handleClearSelection} disabled={selected.length === 0}>
              Clear
            </Button>
          </div>

          <div className="flex max-h-96 flex-col gap-4 overflow-y-auto rounded-md border border-ink/10 p-3 dark:border-paper/10">
            {groups.length === 0 && <p className="text-sm text-ink/50 dark:text-paper/50">No templates match “{query}”.</p>}
            {groups.map(({ category, templates }) => (
              <div key={category} className="flex flex-col gap-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-ink/40 dark:text-paper/40">
                  {TEMPLATE_CATEGORY_LABELS[category]}
                </p>
                {templates.map((template) => (
                  <label
                    key={template.id}
                    className="flex items-center gap-2 rounded px-1.5 py-1 text-sm text-ink hover:bg-ink/5 dark:text-paper dark:hover:bg-paper/5"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(template.id)}
                      onChange={() => toggleTemplate(template.id)}
                      className="accent-accent"
                    />
                    {template.label}
                  </label>
                ))}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-ink/50 dark:text-paper/50">Custom additions (optional)</span>
            <textarea
              value={customPatterns}
              onChange={(event) => setCustomPatterns(event.target.value)}
              spellCheck={false}
              placeholder={'e.g.\n.env.local\n/uploads'}
              aria-label="Custom patterns"
              className="h-24 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-ink/50 dark:text-paper/50">
            <span>.gitignore</span>
            <span>{selected.length} template{selected.length === 1 ? '' : 's'} selected</span>
          </div>
          <textarea
            value={output}
            readOnly
            spellCheck={false}
            placeholder="Select at least one template to generate a .gitignore file…"
            aria-label="Generated .gitignore"
            className="h-[28rem] w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none dark:border-paper/10 dark:bg-ink dark:text-paper"
          />
          <div className="flex items-center gap-2">
            <CopyButton value={output} disabled={!output} />
            <Button variant="secondary" size="sm" onClick={handleDownload} disabled={!output}>
              Download .gitignore
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
