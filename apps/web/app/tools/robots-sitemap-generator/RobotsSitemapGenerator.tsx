'use client';

import { useState } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import { buildRobotsTxt, COMMON_ADMIN_PATHS, type PathRule, type UserAgentRule } from './utils/buildRobotsTxt';
import { buildSitemapXml, CHANGE_FREQ_OPTIONS, parseUrlList, SITEMAP_URL_LIMIT, type ChangeFreq, type SitemapUrlEntry } from './utils/buildSitemapXml';

type Tab = 'robots' | 'sitemap';

const COMMON_USER_AGENTS = ['*', 'Googlebot', 'Bingbot'];

let nextId = 0;
const genId = (prefix: string) => `${prefix}-${(nextId += 1)}`;

function downloadTextFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function RobotsSitemapGenerator() {
  const [tab, setTab] = useState<Tab>('robots');

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1.5">
        <Button variant={tab === 'robots' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('robots')}>
          Robots.txt
        </Button>
        <Button variant={tab === 'sitemap' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('sitemap')}>
          Sitemap.xml
        </Button>
      </div>

      {tab === 'robots' ? <RobotsTab /> : <SitemapTab />}

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing you enter is uploaded or stored.</span>
    </div>
  );
}

function RobotsTab() {
  const [rules, setRules] = useState<UserAgentRule[]>([
    { id: genId('ua'), userAgent: '*', rules: [{ id: genId('rule'), type: 'disallow', path: '' }] },
  ]);
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [crawlDelayValue, setCrawlDelayValue] = useState('');

  const crawlDelay = crawlDelayValue.trim() === '' ? undefined : Number(crawlDelayValue);
  const output = buildRobotsTxt(rules, sitemapUrl, crawlDelay);

  function applyPreset(preset: 'disallowAll' | 'allowAll' | 'blockCommon') {
    if (preset === 'disallowAll') {
      setRules([{ id: genId('ua'), userAgent: '*', rules: [{ id: genId('rule'), type: 'disallow', path: '/' }] }]);
    } else if (preset === 'allowAll') {
      setRules([{ id: genId('ua'), userAgent: '*', rules: [{ id: genId('rule'), type: 'allow', path: '/' }] }]);
    } else {
      setRules([
        {
          id: genId('ua'),
          userAgent: '*',
          rules: COMMON_ADMIN_PATHS.map((path) => ({ id: genId('rule'), type: 'disallow', path })),
        },
      ]);
    }
  }

  function addUserAgentBlock() {
    setRules((prev) => [...prev, { id: genId('ua'), userAgent: '*', rules: [{ id: genId('rule'), type: 'disallow', path: '' }] }]);
  }

  function removeUserAgentBlock(id: string) {
    setRules((prev) => prev.filter((rule) => rule.id !== id));
  }

  function updateUserAgent(id: string, userAgent: string) {
    setRules((prev) => prev.map((rule) => (rule.id === id ? { ...rule, userAgent } : rule)));
  }

  function addPathRule(uaId: string) {
    setRules((prev) =>
      prev.map((rule) => (rule.id === uaId ? { ...rule, rules: [...rule.rules, { id: genId('rule'), type: 'disallow', path: '' }] } : rule)),
    );
  }

  function updatePathRule(uaId: string, ruleId: string, updates: Partial<PathRule>) {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === uaId ? { ...rule, rules: rule.rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)) } : rule,
      ),
    );
  }

  function removePathRule(uaId: string, ruleId: string) {
    setRules((prev) => prev.map((rule) => (rule.id === uaId ? { ...rule, rules: rule.rules.filter((r) => r.id !== ruleId) } : rule)));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        <Button variant="secondary" size="sm" onClick={() => applyPreset('disallowAll')}>
          Disallow all
        </Button>
        <Button variant="secondary" size="sm" onClick={() => applyPreset('allowAll')}>
          Allow all
        </Button>
        <Button variant="secondary" size="sm" onClick={() => applyPreset('blockCommon')}>
          Block common admin/system paths
        </Button>
      </div>
      <p className="text-xs text-ink/50 dark:text-paper/50">
        These are generic starting points, not a guaranteed-correct configuration for your site — review and adjust the paths for your own
        structure before publishing.
      </p>

      <div className="flex flex-col gap-3">
        {rules.map((rule) => (
          <div key={rule.id} className="flex flex-col gap-2 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink/60 dark:text-paper/60">User-agent</span>
              <input
                type="text"
                list="common-user-agents"
                value={rule.userAgent}
                onChange={(event) => updateUserAgent(rule.id, event.target.value)}
                className="w-40 rounded-md border border-ink/15 bg-paper px-2 py-1 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
              />
              <Button variant="ghost" size="sm" onClick={() => removeUserAgentBlock(rule.id)} className="ml-auto">
                Remove block
              </Button>
            </div>

            {rule.rules.map((pathRule) => (
              <div key={pathRule.id} className="flex items-center gap-2">
                <select
                  value={pathRule.type}
                  onChange={(event) => updatePathRule(rule.id, pathRule.id, { type: event.target.value as 'allow' | 'disallow' })}
                  className="rounded-md border border-ink/15 bg-paper px-2 py-1 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
                >
                  <option value="disallow" className="bg-paper text-ink dark:bg-ink dark:text-paper">
                    Disallow
                  </option>
                  <option value="allow" className="bg-paper text-ink dark:bg-ink dark:text-paper">
                    Allow
                  </option>
                </select>
                <input
                  type="text"
                  value={pathRule.path}
                  onChange={(event) => updatePathRule(rule.id, pathRule.id, { path: event.target.value })}
                  placeholder="/path/"
                  className="flex-1 rounded-md border border-ink/15 bg-paper px-2 py-1 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
                />
                <Button variant="ghost" size="sm" onClick={() => removePathRule(rule.id, pathRule.id)} aria-label="Remove rule">
                  ×
                </Button>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={() => addPathRule(rule.id)} className="self-start">
              + Add path rule
            </Button>
          </div>
        ))}
        <Button variant="secondary" size="sm" onClick={addUserAgentBlock} className="self-start">
          + Add user-agent block
        </Button>
      </div>

      <datalist id="common-user-agents">
        {COMMON_USER_AGENTS.map((ua) => (
          <option key={ua} value={ua} />
        ))}
      </datalist>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          Sitemap URL (optional)
          <input
            type="text"
            value={sitemapUrl}
            onChange={(event) => setSitemapUrl(event.target.value)}
            placeholder="https://example.com/sitemap.xml"
            className="rounded-md border border-ink/15 bg-paper px-3 py-2 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          Crawl-delay in seconds (optional)
          <input
            type="text"
            inputMode="numeric"
            value={crawlDelayValue}
            onChange={(event) => setCrawlDelayValue(event.target.value)}
            placeholder="e.g. 10"
            className="rounded-md border border-ink/15 bg-paper px-3 py-2 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          />
          <span className="text-xs font-normal text-ink/50 dark:text-paper/50">
            Not universally respected — Google, notably, ignores this directive entirely.
          </span>
        </label>
      </div>

      <OutputPane content={output} filename="robots.txt" mime="text/plain" />
    </div>
  );
}

function SitemapTab() {
  const [entries, setEntries] = useState<SitemapUrlEntry[]>([]);
  const [singleUrl, setSingleUrl] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [bulkChangefreq, setBulkChangefreq] = useState<ChangeFreq | ''>('');
  const [bulkPriority, setBulkPriority] = useState('');

  const output = buildSitemapXml(entries);
  const validEntryCount = entries.filter((e) => e.loc.trim() !== '').length;

  function addSingleUrl() {
    if (!singleUrl.trim()) return;
    setEntries((prev) => [...prev, { id: genId('url'), loc: singleUrl.trim() }]);
    setSingleUrl('');
  }

  function addBulkUrls() {
    const urls = parseUrlList(bulkText);
    if (urls.length === 0) return;
    setEntries((prev) => [...prev, ...urls.map((loc) => ({ id: genId('url'), loc }))]);
    setBulkText('');
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }

  function updateEntry(id: string, updates: Partial<SitemapUrlEntry>) {
    setEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry)));
  }

  function applyBulk() {
    setEntries((prev) =>
      prev.map((entry) => ({
        ...entry,
        changefreq: bulkChangefreq || entry.changefreq,
        priority: bulkPriority.trim() === '' ? entry.priority : Math.min(1, Math.max(0, Number(bulkPriority))),
      })),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
        <span className="text-sm font-medium text-ink dark:text-paper">Add URLs</span>
        <div className="flex gap-2">
          <input
            type="text"
            value={singleUrl}
            onChange={(event) => setSingleUrl(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && addSingleUrl()}
            placeholder="https://example.com/page"
            className="flex-1 rounded-md border border-ink/15 bg-paper px-3 py-2 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          />
          <Button variant="secondary" size="sm" onClick={addSingleUrl}>
            Add
          </Button>
        </div>

        <span className="mt-1 text-xs text-ink/50 dark:text-paper/50">Or paste a list, one URL per line:</span>
        <textarea
          value={bulkText}
          onChange={(event) => setBulkText(event.target.value)}
          placeholder={'https://example.com/\nhttps://example.com/about\nhttps://example.com/contact'}
          className="h-24 resize-y rounded-md border border-ink/15 bg-paper p-2 font-mono text-xs text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
        />
        <Button variant="secondary" size="sm" onClick={addBulkUrls} className="self-start">
          Add pasted URLs
        </Button>
      </div>

      {entries.length > 0 && (
        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
          <span className="text-sm font-medium text-ink dark:text-paper">Bulk-apply to all entries</span>
          <select
            value={bulkChangefreq}
            onChange={(event) => setBulkChangefreq(event.target.value as ChangeFreq | '')}
            className="rounded-md border border-ink/15 bg-paper px-2 py-1 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          >
            <option value="" className="bg-paper text-ink dark:bg-ink dark:text-paper">
              Change frequency…
            </option>
            {CHANGE_FREQ_OPTIONS.map((freq) => (
              <option key={freq} value={freq} className="bg-paper text-ink dark:bg-ink dark:text-paper">
                {freq}
              </option>
            ))}
          </select>
          <input
            type="text"
            inputMode="decimal"
            value={bulkPriority}
            onChange={(event) => setBulkPriority(event.target.value)}
            placeholder="Priority 0.0–1.0"
            className="w-32 rounded-md border border-ink/15 bg-paper px-2 py-1 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          />
          <Button variant="secondary" size="sm" onClick={applyBulk}>
            Apply to all
          </Button>
        </div>
      )}

      {entries.length > 0 && (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <div key={entry.id} className="flex flex-wrap items-center gap-2 rounded-md border border-ink/10 p-2 dark:border-paper/10">
              <input
                type="text"
                value={entry.loc}
                onChange={(event) => updateEntry(entry.id, { loc: event.target.value })}
                className="min-w-[200px] flex-1 rounded-md border border-ink/15 bg-paper px-2 py-1 font-mono text-xs text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
              />
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={entry.lastmod ?? ''}
                  onChange={(event) => updateEntry(entry.id, { lastmod: event.target.value })}
                  className="rounded-md border border-ink/15 bg-paper px-2 py-1 text-xs text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
                />
                <Button variant="ghost" size="sm" onClick={() => updateEntry(entry.id, { lastmod: todayIso() })}>
                  Today
                </Button>
              </div>
              <select
                value={entry.changefreq ?? ''}
                onChange={(event) => updateEntry(entry.id, { changefreq: (event.target.value || undefined) as ChangeFreq | undefined })}
                className="rounded-md border border-ink/15 bg-paper px-2 py-1 text-xs text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
              >
                <option value="" className="bg-paper text-ink dark:bg-ink dark:text-paper">
                  —
                </option>
                {CHANGE_FREQ_OPTIONS.map((freq) => (
                  <option key={freq} value={freq} className="bg-paper text-ink dark:bg-ink dark:text-paper">
                    {freq}
                  </option>
                ))}
              </select>
              <input
                type="text"
                inputMode="decimal"
                value={entry.priority ?? ''}
                onChange={(event) => {
                  const raw = event.target.value;
                  updateEntry(entry.id, { priority: raw.trim() === '' ? undefined : Math.min(1, Math.max(0, Number(raw))) });
                }}
                placeholder="0.5"
                className="w-16 rounded-md border border-ink/15 bg-paper px-2 py-1 font-mono text-xs text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
              />
              <Button variant="ghost" size="sm" onClick={() => removeEntry(entry.id)} aria-label="Remove URL">
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-ink/50 dark:text-paper/50">
        Priority is a relative hint to crawlers about a page&apos;s importance within your own site — it&apos;s not a ranking guarantee and
        doesn&apos;t affect how you rank against other sites.
      </p>

      <div className="flex items-center gap-2 text-xs text-ink/60 dark:text-paper/60">
        <span>
          {validEntryCount.toLocaleString()} URL{validEntryCount === 1 ? '' : 's'}
        </span>
        {validEntryCount > SITEMAP_URL_LIMIT * 0.9 && (
          <span role="alert" className="text-danger">
            {validEntryCount > SITEMAP_URL_LIMIT
              ? `Over the sitemaps.org protocol's ${SITEMAP_URL_LIMIT.toLocaleString()}-URL-per-file limit — this output is not a valid single sitemap. Split it across multiple sitemap files referenced by a sitemap index file (out of scope for this generator).`
              : `Approaching the sitemaps.org protocol's ${SITEMAP_URL_LIMIT.toLocaleString()}-URL-per-file limit.`}
          </span>
        )}
      </div>

      <OutputPane content={output} filename="sitemap.xml" mime="application/xml" />
    </div>
  );
}

function OutputPane({ content, filename, mime }: { content: string; filename: string; mime: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink/50 dark:text-paper/50">{filename}</span>
        <div className="flex gap-2">
          <CopyButton value={content} size="sm" disabled={!content} />
          <Button variant="secondary" size="sm" onClick={() => downloadTextFile(content, filename, mime)} disabled={!content}>
            Download {filename}
          </Button>
        </div>
      </div>
      <pre className="max-h-96 overflow-auto rounded-md border border-ink/10 bg-paper p-3 font-mono text-xs text-ink dark:border-paper/15 dark:bg-ink dark:text-paper">
        {content || `Nothing to show yet — add a rule or URL above.`}
      </pre>
    </div>
  );
}
