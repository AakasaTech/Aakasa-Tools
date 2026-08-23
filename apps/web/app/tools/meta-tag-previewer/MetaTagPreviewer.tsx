'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import {
  parseMetaTags,
  getEffectiveOgTags,
  getEffectiveTwitterTags,
  type MetaTagData,
} from './utils/parseMetaTags';
import {
  buildRecommendations,
  checkCanonical,
  checkDescription,
  checkOgImage,
  checkTitle,
  checkTwitterCard,
  type FieldCheck,
  type FieldStatus,
} from './utils/tagValidation';

type InputMode = 'paste' | 'url';

interface FetchErrorPayload {
  error?: string;
  code?: string;
}

function getDisplayHost(url: string | null): string {
  if (!url) return 'yourwebsite.com';
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function buildRawTagsMarkup(data: MetaTagData): string {
  const lines: string[] = [];
  if (data.title) lines.push(`<title>${data.title}</title>`);
  if (data.description) lines.push(`<meta name="description" content="${escapeAttr(data.description)}">`);
  if (data.canonicalUrl) lines.push(`<link rel="canonical" href="${escapeAttr(data.canonicalUrl)}">`);
  for (const [key, value] of Object.entries(data.ogTags)) {
    lines.push(`<meta property="${key}" content="${escapeAttr(value)}">`);
  }
  for (const [key, value] of Object.entries(data.twitterTags)) {
    lines.push(`<meta name="${key}" content="${escapeAttr(value)}">`);
  }
  return lines.join('\n');
}

export function MetaTagPreviewer() {
  const [mode, setMode] = useState<InputMode>('paste');
  const [pastedHtml, setPastedHtml] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [data, setData] = useState<MetaTagData | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showRawTags, setShowRawTags] = useState(false);

  useEffect(() => {
    if (mode !== 'paste') {
      return;
    }
    if (!pastedHtml.trim()) {
      setData(null);
      return;
    }
    const timer = setTimeout(() => {
      setData(parseMetaTags(pastedHtml));
      setSourceUrl(null);
    }, 300);
    return () => clearTimeout(timer);
  }, [pastedHtml, mode]);

  async function handleFetch() {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      return;
    }
    setFetchError(null);
    setIsFetching(true);
    try {
      const res = await fetch('/api/fetch-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      const json = (await res.json()) as { data?: MetaTagData; fetchedUrl?: string } & FetchErrorPayload;
      if (!res.ok || !json.data) {
        setFetchError(json.error ?? 'Something went wrong fetching that URL.');
        setData(null);
        return;
      }
      setData(json.data);
      setSourceUrl(json.fetchedUrl ?? trimmed);
    } catch {
      setFetchError('Could not reach the server. Check your connection and try again.');
      setData(null);
    } finally {
      setIsFetching(false);
    }
  }

  function handleModeChange(next: InputMode) {
    if (next === mode) return;
    setMode(next);
    setData(null);
    setFetchError(null);
  }

  const displayUrl = sourceUrl ?? data?.canonicalUrl ?? null;
  const ogEffective = data ? getEffectiveOgTags(data) : null;
  const twitterEffective = data ? getEffectiveTwitterTags(data) : null;
  const recommendations = data ? buildRecommendations(data) : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-1 rounded-md bg-ink/5 p-1 dark:bg-paper/10">
        <ModeButton active={mode === 'paste'} onClick={() => handleModeChange('paste')}>
          Paste HTML
        </ModeButton>
        <ModeButton active={mode === 'url'} onClick={() => handleModeChange('url')}>
          Enter URL
        </ModeButton>
      </div>

      {mode === 'paste' ? (
        <div className="flex flex-col gap-1.5">
          <textarea
            value={pastedHtml}
            onChange={(event) => setPastedHtml(event.target.value)}
            spellCheck={false}
            placeholder="Paste the full HTML source of a page here…"
            aria-label="HTML input"
            className="h-56 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
          />
          <p className="text-xs text-ink/40 dark:text-paper/40">Parsed entirely in your browser — nothing is sent anywhere.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <p className="rounded-md bg-accent/10 px-3 py-2 text-xs text-ink/70 dark:text-paper/70">
            Fetching by URL requires our server to load the page&apos;s HTML — this is the one place in the toolbox
            that isn&apos;t 100% local. Pasting HTML directly (the other tab) stays fully in your browser.
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && void handleFetch()}
              placeholder="https://example.com"
              aria-label="URL to fetch"
              className="h-9 flex-1 rounded-md border border-ink/10 bg-transparent px-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
            />
            <Button onClick={() => void handleFetch()} disabled={isFetching || !urlInput.trim()}>
              {isFetching ? 'Fetching…' : 'Fetch'}
            </Button>
          </div>
          {fetchError && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
              {fetchError}
            </p>
          )}
        </div>
      )}

      {data && ogEffective && twitterEffective && (
        <>
          <Section title="Extracted tags">
            <ExtractedTagsTable data={data} />
          </Section>

          {recommendations.length > 0 && (
            <Section title="Recommendations">
              <ul className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
                {recommendations.map((rec) => (
                  <li key={rec} className="flex gap-2">
                    <span className="text-danger">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Google search result">
            <GooglePreview title={data.title} description={data.description} url={displayUrl} />
          </Section>

          <Section title="Facebook & LinkedIn">
            <FacebookPreview
              title={ogEffective.title}
              description={ogEffective.description}
              image={ogEffective.image}
              siteName={ogEffective.siteName}
              url={displayUrl}
            />
          </Section>

          <Section title="Twitter / X">
            <TwitterPreview
              title={twitterEffective.title}
              description={twitterEffective.description}
              image={twitterEffective.image}
              cardType={twitterEffective.cardType}
              url={displayUrl}
            />
          </Section>

          <Section title="Raw tags">
            <Button variant="ghost" size="sm" onClick={() => setShowRawTags((v) => !v)} className="self-start">
              {showRawTags ? 'Hide raw tags' : 'Show raw tags'}
            </Button>
            {showRawTags && (
              <div className="flex flex-col gap-2">
                <pre className="overflow-auto rounded-md border border-ink/10 bg-paper p-3 font-mono text-xs text-ink dark:border-paper/10 dark:bg-ink dark:text-paper">
                  {buildRawTagsMarkup(data)}
                </pre>
                <CopyButton value={buildRawTagsMarkup(data)} label="Copy tags" size="sm" />
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-paper text-ink shadow-sm dark:bg-ink dark:text-paper'
          : 'text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper'
      }`}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-display text-sm font-semibold text-ink dark:text-paper">{title}</h3>
      {children}
    </div>
  );
}

function ExtractedTagsTable({ data }: { data: MetaTagData }) {
  const rows: { label: string; check: FieldCheck }[] = [
    { label: 'Title', check: checkTitle(data.title) },
    { label: 'Description', check: checkDescription(data.description) },
    { label: 'og:image', check: checkOgImage(data.ogTags['og:image'] ?? null) },
    { label: 'Canonical URL', check: checkCanonical(data.canonicalUrl) },
    { label: 'twitter:card', check: checkTwitterCard(data.twitterTags['twitter:card']) },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink/10 text-left text-xs uppercase text-ink/40 dark:border-paper/10 dark:text-paper/40">
            <th className="pb-2 pr-3 font-medium">Tag</th>
            <th className="pb-2 pr-3 font-medium">Value</th>
            <th className="pb-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-ink/5 dark:border-paper/5">
              <td className="py-2 pr-3 font-medium text-ink dark:text-paper">{row.label}</td>
              <td className="max-w-[280px] truncate py-2 pr-3 text-ink/70 dark:text-paper/70">{row.check.value ?? '—'}</td>
              <td className="py-2">
                <StatusBadge status={row.check.status} message={row.check.message} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const STATUS_STYLES: Record<FieldStatus, string> = {
  ok: 'bg-success/10 text-success',
  warning: 'bg-danger/10 text-danger',
  missing: 'bg-ink/10 text-ink/50 dark:bg-paper/10 dark:text-paper/50',
};

const STATUS_LABELS: Record<FieldStatus, string> = {
  ok: 'Present',
  warning: 'Too long',
  missing: 'Missing',
};

function StatusBadge({ status, message }: { status: FieldStatus; message: string }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`} title={message}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function PlaceholderImage({ reason = 'No image found' }: { reason?: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-neutral-100 text-neutral-400">
      <span className="text-2xl" aria-hidden>
        🖼️
      </span>
      <span className="text-xs">{reason}</span>
    </div>
  );
}

/**
 * An og:image/twitter:image value being present in the markup doesn't mean
 * it actually loads — pasted HTML has no base URL to resolve a relative
 * path against, and a live-fetched page's image can 404 or block hotlinking.
 * A plain <img> would show the browser's broken-image icon in that case;
 * this falls back to the same clean placeholder used for a missing tag,
 * with a message that distinguishes "no tag" from "tag present but the
 * image didn't load".
 */
function PreviewImage({ src, className }: { src: string | null; className: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <PlaceholderImage reason={src ? "Image didn't load" : 'No image found'} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={className} onError={() => setFailed(true)} />
  );
}

function GooglePreview({ title, description, url }: { title: string | null; description: string | null; url: string | null }) {
  return (
    <div className="max-w-xl rounded-lg border border-neutral-200 bg-white p-4 font-body">
      <div className="flex items-center gap-2 text-xs text-neutral-600">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-[10px]">🌐</span>
        <span>{getDisplayHost(url)}</span>
      </div>
      <p className="mt-1 truncate text-lg text-[#1a0dab]">{title || 'Untitled page'}</p>
      <p className="mt-1 line-clamp-2 text-sm text-neutral-700">{description || 'No description available.'}</p>
    </div>
  );
}

function FacebookPreview({
  title,
  description,
  image,
  siteName,
  url,
}: {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  url: string | null;
}) {
  return (
    <div className="max-w-md overflow-hidden rounded-lg border border-neutral-300 bg-white font-body">
      <div className="aspect-[1.91/1] w-full bg-neutral-100">
        <PreviewImage src={image} className="h-full w-full object-cover" />
      </div>
      <div className="border-t border-neutral-200 p-3">
        <p className="text-xs uppercase tracking-wide text-neutral-500">{siteName || getDisplayHost(url)}</p>
        <p className="mt-0.5 truncate font-semibold text-neutral-900">{title || 'Untitled page'}</p>
        <p className="mt-0.5 truncate text-sm text-neutral-500">{description || 'No description available.'}</p>
      </div>
    </div>
  );
}

function TwitterPreview({
  title,
  description,
  image,
  cardType,
  url,
}: {
  title: string | null;
  description: string | null;
  image: string | null;
  cardType: 'summary' | 'summary_large_image';
  url: string | null;
}) {
  const isLarge = cardType === 'summary_large_image';
  return (
    <div className="max-w-md overflow-hidden rounded-2xl border border-neutral-300 bg-white font-body">
      <div className={isLarge ? 'flex flex-col' : 'flex'}>
        <div className={isLarge ? 'aspect-[1.91/1] w-full bg-neutral-100' : 'h-28 w-28 shrink-0 bg-neutral-100'}>
          <PreviewImage src={image} className="h-full w-full object-cover" />
        </div>
        <div className="flex-1 p-3">
          <p className="truncate font-semibold text-neutral-900">{title || 'Untitled page'}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-neutral-500">{description || 'No description available.'}</p>
          <p className="mt-1 text-xs text-neutral-400">{getDisplayHost(url)}</p>
        </div>
      </div>
      <p className="border-t border-neutral-100 px-3 py-1.5 text-[10px] uppercase tracking-wide text-neutral-400">
        Card type: {cardType === 'summary_large_image' ? 'Summary with large image' : 'Summary'}
      </p>
    </div>
  );
}
