'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Checkbox, CopyButton } from '@aakasa/ui';
import { convertMarkdownToHtml, type MarkdownConvertResult } from '../markdown-to-html/utils/markdownConvert';
import { CONTRIBUTING_PRESETS, createDefaultSections, INSTALL_SNIPPETS, README_TEMPLATES } from './presets';
import { buildReadmeMarkdown, type ReadmeSectionData, type BadgesSection, type ConfigurationSection } from './utils/generateReadme';
import { createHeadingSlugger } from './utils/generateToc';
import type { BadgeType } from './utils/badgeUrls';

type ViewMode = 'preview' | 'markdown';

const BADGE_TYPE_LABELS: Record<BadgeType, string> = {
  build: 'Build status',
  license: 'License',
  version: 'Version',
  npm: 'npm package',
  pypi: 'PyPI package',
};

const EMPTY_PREVIEW: MarkdownConvertResult = { rawHtml: '', sanitizedHtml: '' };

const PREVIEW_CLASSES = [
  '[&_h1]:mb-3 [&_h1]:mt-5 [&_h1]:text-2xl [&_h1]:font-bold [&_h1:first-child]:mt-0',
  '[&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold',
  '[&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-lg [&_h3]:font-semibold',
  '[&_p]:my-2 [&_p]:leading-relaxed',
  '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5',
  '[&_a]:text-accent [&_a]:underline',
  '[&_strong]:font-semibold [&_em]:italic',
  '[&_code]:rounded [&_code]:bg-ink/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] dark:[&_code]:bg-paper/10',
  '[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-ink/5 [&_pre]:p-3 dark:[&_pre]:bg-paper/5',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_img]:my-2 [&_img]:max-w-full [&_img]:rounded',
  '[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm',
  '[&_th]:border [&_th]:border-ink/15 [&_th]:bg-ink/5 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left dark:[&_th]:border-paper/15 dark:[&_th]:bg-paper/10',
  '[&_td]:border [&_td]:border-ink/15 [&_td]:px-2 [&_td]:py-1 dark:[&_td]:border-paper/15',
].join(' ');

function sectionLabel(section: ReadmeSectionData): string {
  switch (section.type) {
    case 'title':
      return 'Title & description';
    case 'badges':
      return 'Badges';
    case 'toc':
      return 'Table of Contents';
    default:
      return section.heading;
  }
}

export function ReadmeGenerator() {
  const [sections, setSections] = useState<ReadmeSectionData[]>(createDefaultSections);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [preview, setPreview] = useState<MarkdownConvertResult>(EMPTY_PREVIEW);
  const previewRef = useRef<HTMLDivElement>(null);

  const markdown = useMemo(() => buildReadmeMarkdown(sections), [sections]);

  // See markdown-to-html's MarkdownToHtml.tsx for why this must run in an
  // effect rather than the render body: DOMPurify.sanitize silently no-ops
  // (returns input completely unsanitized) with no `window`, i.e. during
  // Next.js's SSR pass of this client component.
  useEffect(() => {
    setPreview(markdown.trim() ? convertMarkdownToHtml(markdown, { gfm: true, breaks: false }) : EMPTY_PREVIEW);
  }, [markdown]);

  // `marked` (reused as-is from Markdown to HTML Converter) doesn't assign
  // heading ids, so the TOC's `#anchor` links would be correct for GitHub
  // but dead in this tool's own preview. Assigning ids here, using the same
  // slug algorithm and left-to-right document order as the TOC generator,
  // makes the two consistent without touching the shared conversion util.
  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;
    const slugger = createHeadingSlugger();
    for (const heading of container.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
      heading.id = slugger(heading.textContent ?? '');
    }
  }, [preview]);

  function updateSection(id: string, patch: Partial<ReadmeSectionData>) {
    setSections((current) =>
      current.map((section) => (section.id === id ? ({ ...section, ...patch } as ReadmeSectionData) : section))
    );
  }

  function moveSection(id: string, direction: -1 | 1) {
    setSections((current) => {
      const index = current.findIndex((section) => section.id === id);
      const targetIndex = index + direction;
      if (index === -1 || targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex]!, next[index]!];
      return next;
    });
  }

  function applyTemplate(templateId: string) {
    const template = README_TEMPLATES.find((candidate) => candidate.id === templateId);
    if (template) setSections(template.sections.map((section) => ({ ...section })));
  }

  function handleReset() {
    setSections(createDefaultSections());
  }

  function handleDownload() {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'README.md';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
        <span className="text-xs text-ink/50 dark:text-paper/50">Start from a template:</span>
        {README_TEMPLATES.map((template) => (
          <Button key={template.id} variant="secondary" size="sm" onClick={() => applyTemplate(template.id)} title={template.description}>
            {template.label}
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Reset to blank
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          {sections.map((section, index) => (
            <SectionCard
              key={section.id}
              section={section}
              isFirst={index === 0}
              isLast={index === sections.length - 1}
              onToggle={(enabled) => updateSection(section.id, { enabled })}
              onMove={(direction) => moveSection(section.id, direction)}
              onChange={(patch) => updateSection(section.id, patch)}
            />
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex gap-1 rounded-md bg-ink/5 p-1 dark:bg-paper/10">
              <ViewModeButton active={viewMode === 'preview'} onClick={() => setViewMode('preview')}>
                Preview
              </ViewModeButton>
              <ViewModeButton active={viewMode === 'markdown'} onClick={() => setViewMode('markdown')}>
                Markdown source
              </ViewModeButton>
            </div>
          </div>

          {viewMode === 'preview' ? (
            <div
              ref={previewRef}
              className={`h-[40rem] w-full overflow-auto rounded-md border border-ink/10 bg-paper p-4 text-sm text-ink dark:border-paper/10 dark:bg-ink dark:text-paper ${PREVIEW_CLASSES}`}
              dangerouslySetInnerHTML={{ __html: preview.sanitizedHtml || '<p style="opacity:.4">Enable a section to see the preview…</p>' }}
            />
          ) : (
            <textarea
              value={markdown}
              readOnly
              spellCheck={false}
              aria-label="Generated README markdown"
              className="h-[40rem] w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none dark:border-paper/10 dark:bg-ink dark:text-paper"
            />
          )}

          <div className="flex items-center gap-2">
            <CopyButton value={markdown} disabled={!markdown} />
            <Button variant="secondary" size="sm" onClick={handleDownload} disabled={!markdown}>
              Download README.md
            </Button>
          </div>
        </div>
      </div>
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

function SectionCard({
  section,
  isFirst,
  isLast,
  onToggle,
  onMove,
  onChange,
}: {
  section: ReadmeSectionData;
  isFirst: boolean;
  isLast: boolean;
  onToggle: (enabled: boolean) => void;
  onMove: (direction: -1 | 1) => void;
  onChange: (patch: Partial<ReadmeSectionData>) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="rounded-md border border-ink/10 dark:border-paper/10">
      <div className="flex items-center gap-2 p-2">
        <Checkbox label="" checked={section.enabled} onChange={(event) => onToggle(event.target.checked)} />
        <button type="button" onClick={() => setCollapsed((value) => !value)} className="flex-1 text-left text-sm font-medium text-ink dark:text-paper">
          {sectionLabel(section)}
        </button>
        <button type="button" onClick={() => onMove(-1)} disabled={isFirst} className="text-ink/40 disabled:opacity-30 dark:text-paper/40" aria-label="Move up">
          ↑
        </button>
        <button type="button" onClick={() => onMove(1)} disabled={isLast} className="text-ink/40 disabled:opacity-30 dark:text-paper/40" aria-label="Move down">
          ↓
        </button>
      </div>

      {!collapsed && (
        <div className="border-t border-ink/10 p-3 dark:border-paper/10">
          <SectionEditor section={section} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

const TEXT_INPUT_CLASSES =
  'w-full rounded-md border border-ink/10 bg-paper px-2 py-1.5 text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper';
const TEXTAREA_CLASSES =
  'h-28 w-full resize-y rounded-md border border-ink/10 bg-paper p-2 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper';

function SectionEditor({ section, onChange }: { section: ReadmeSectionData; onChange: (patch: Partial<ReadmeSectionData>) => void }) {
  switch (section.type) {
    case 'title':
      return (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={section.title}
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder="Project Name"
            className={TEXT_INPUT_CLASSES}
          />
          <input
            type="text"
            value={section.tagline}
            onChange={(event) => onChange({ tagline: event.target.value })}
            placeholder="One-line description"
            className={TEXT_INPUT_CLASSES}
          />
        </div>
      );

    case 'badges':
      return <BadgesEditor section={section} onChange={onChange} />;

    case 'toc':
      return <p className="text-xs text-ink/50 dark:text-paper/50">Auto-generated from every other enabled section&apos;s heading, in order.</p>;

    case 'features':
      return (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={section.heading}
            onChange={(event) => onChange({ heading: event.target.value })}
            className={TEXT_INPUT_CLASSES}
          />
          {section.items.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={item}
                onChange={(event) => {
                  const items = [...section.items];
                  items[index] = event.target.value;
                  onChange({ items });
                }}
                placeholder="Feature description"
                className={TEXT_INPUT_CLASSES}
              />
              <button
                type="button"
                onClick={() => onChange({ items: section.items.filter((_, i) => i !== index) })}
                className="text-ink/40 dark:text-paper/40"
                aria-label="Remove feature"
              >
                ✕
              </button>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => onChange({ items: [...section.items, ''] })}>
            Add feature
          </Button>
        </div>
      );

    case 'configuration':
      return <ConfigurationEditor section={section} onChange={onChange} />;

    case 'license':
      return (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={section.heading}
            onChange={(event) => onChange({ heading: event.target.value })}
            className={TEXT_INPUT_CLASSES}
          />
          <input
            type="text"
            value={section.licenseName}
            onChange={(event) => onChange({ licenseName: event.target.value })}
            placeholder="License name (e.g. MIT)"
            className={TEXT_INPUT_CLASSES}
          />
          <textarea
            value={section.note}
            onChange={(event) => onChange({ note: event.target.value })}
            className={TEXTAREA_CLASSES}
          />
        </div>
      );

    default: {
      // TextSection: about, installation, usage, api, screenshots, contributing, contact
      const presetSnippets =
        section.type === 'installation' ? INSTALL_SNIPPETS : section.type === 'contributing' ? CONTRIBUTING_PRESETS : null;

      return (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={section.heading}
            onChange={(event) => onChange({ heading: event.target.value })}
            className={TEXT_INPUT_CLASSES}
          />
          {presetSnippets && (
            <div className="flex flex-wrap gap-1.5">
              {presetSnippets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onChange({ content: 'snippet' in preset ? preset.snippet : preset.text })}
                  className="rounded bg-ink/5 px-2 py-1 text-xs text-ink/70 hover:bg-ink/10 dark:bg-paper/10 dark:text-paper/70 dark:hover:bg-paper/20"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
          <textarea
            value={section.content}
            onChange={(event) => onChange({ content: event.target.value })}
            placeholder={section.type === 'screenshots' ? '![Screenshot description](./screenshot.png)' : undefined}
            className={TEXTAREA_CLASSES}
          />
        </div>
      );
    }
  }
}

const BADGE_TYPES: BadgeType[] = ['build', 'license', 'version', 'npm', 'pypi'];

function BadgesEditor({ section, onChange }: { section: BadgesSection; onChange: (patch: Partial<ReadmeSectionData>) => void }) {
  function updateBadge(index: number, patch: Partial<BadgesSection['badges'][number]>) {
    const badges = section.badges.map((badge, i) => (i === index ? { ...badge, ...patch } : badge));
    onChange({ badges });
  }

  function paramField(index: number, key: string, placeholder: string) {
    const badge = section.badges[index]!;
    return (
      <input
        type="text"
        value={badge.params[key] ?? ''}
        onChange={(event) => updateBadge(index, { params: { ...badge.params, [key]: event.target.value } })}
        placeholder={placeholder}
        className={TEXT_INPUT_CLASSES}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {section.badges.map((badge, index) => (
        <div key={index} className="flex flex-col gap-1.5 rounded-md bg-ink/5 p-2 dark:bg-paper/10">
          <div className="flex items-center gap-2">
            <select
              value={badge.type}
              onChange={(event) => updateBadge(index, { type: event.target.value as BadgeType, params: {} })}
              className="rounded-md border border-ink/10 bg-paper px-2 py-1 text-sm text-ink dark:border-paper/10 dark:bg-ink dark:text-paper"
            >
              {BADGE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {BADGE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onChange({ badges: section.badges.filter((_, i) => i !== index) })}
              className="text-ink/40 dark:text-paper/40"
              aria-label="Remove badge"
            >
              ✕
            </button>
          </div>
          {badge.type === 'build' && (
            <div className="grid grid-cols-3 gap-1.5">
              {paramField(index, 'owner', 'owner')}
              {paramField(index, 'repo', 'repo')}
              {paramField(index, 'workflow', 'ci.yml')}
            </div>
          )}
          {badge.type === 'license' && (
            <div className="grid grid-cols-3 gap-1.5">
              {paramField(index, 'owner', 'owner (optional)')}
              {paramField(index, 'repo', 'repo (optional)')}
              {paramField(index, 'license', 'MIT')}
            </div>
          )}
          {badge.type === 'version' && paramField(index, 'version', '1.0.0')}
          {(badge.type === 'npm' || badge.type === 'pypi') && paramField(index, 'packageName', 'package-name')}
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={() => onChange({ badges: [...section.badges, { type: 'npm', params: {} }] })}>
        Add badge
      </Button>
    </div>
  );
}

// Only used to satisfy the ConfigurationSection editor's own local type needs.
function ConfigurationEditor({ section, onChange }: { section: ConfigurationSection; onChange: (patch: Partial<ReadmeSectionData>) => void }) {
  function updateRow(index: number, patch: Partial<ConfigurationSection['rows'][number]>) {
    const rows = section.rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange({ rows });
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={section.heading}
        onChange={(event) => onChange({ heading: event.target.value })}
        className={TEXT_INPUT_CLASSES}
      />
      {section.rows.map((row, index) => (
        <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1.5">
          <input
            type="text"
            value={row.name}
            onChange={(event) => updateRow(index, { name: event.target.value })}
            placeholder="VAR_NAME"
            className={`${TEXT_INPUT_CLASSES} font-mono`}
          />
          <input
            type="text"
            value={row.description}
            onChange={(event) => updateRow(index, { description: event.target.value })}
            placeholder="Description"
            className={TEXT_INPUT_CLASSES}
          />
          <input
            type="text"
            value={row.defaultValue}
            onChange={(event) => updateRow(index, { defaultValue: event.target.value })}
            placeholder="Default"
            className={TEXT_INPUT_CLASSES}
          />
          <button
            type="button"
            onClick={() => onChange({ rows: section.rows.filter((_, i) => i !== index) })}
            className="text-ink/40 dark:text-paper/40"
            aria-label="Remove variable"
          >
            ✕
          </button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange({ rows: [...section.rows, { name: '', description: '', defaultValue: '' }] })}
      >
        Add variable
      </Button>
    </div>
  );
}
