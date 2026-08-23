'use client';

import { useMemo, useState } from 'react';
import { Button, BulkList, Checkbox, CopyButton } from '@aakasa/ui';
import { buildUtmUrl, type UtmParams } from './utils/buildUtmUrl';
import { normalizeUtmValue } from './utils/normalizeUtmValue';

interface FieldConfig {
  key: keyof UtmParams;
  label: string;
  placeholder: string;
  hint: string;
  required: boolean;
  suggestions?: string[];
}

const FIELDS: FieldConfig[] = [
  {
    key: 'utm_source',
    label: 'Campaign source',
    placeholder: 'e.g. newsletter, twitter, google',
    hint: 'Where the traffic is coming from — the site, app, or publication sending the click.',
    required: true,
    suggestions: ['google', 'facebook', 'twitter', 'linkedin', 'newsletter', 'instagram'],
  },
  {
    key: 'utm_medium',
    label: 'Campaign medium',
    placeholder: 'e.g. email, cpc, social',
    hint: 'The marketing channel — how the link was delivered, not where.',
    required: true,
    suggestions: ['cpc', 'social', 'email', 'referral', 'organic'],
  },
  {
    key: 'utm_campaign',
    label: 'Campaign name',
    placeholder: 'e.g. spring_launch',
    hint: 'The specific campaign, promotion, or initiative this link belongs to.',
    required: true,
  },
  {
    key: 'utm_term',
    label: 'Campaign term',
    placeholder: 'e.g. running_shoes',
    hint: 'Optional — used mainly for paid search to track the keyword that triggered the ad.',
    required: false,
  },
  {
    key: 'utm_content',
    label: 'Campaign content',
    placeholder: 'e.g. cta-button, sidebar-link',
    hint: 'Optional — differentiates similar links or content in the same campaign, e.g. two A/B-tested CTAs.',
    required: false,
  },
];

const EMPTY_PARAMS: UtmParams = {
  utm_source: '',
  utm_medium: '',
  utm_campaign: '',
  utm_term: '',
  utm_content: '',
};

interface GeneratedLink {
  url: string;
  campaign: string;
}

export function UtmLinkBuilder() {
  const [baseUrl, setBaseUrl] = useState('');
  const [params, setParams] = useState<UtmParams>(EMPTY_PARAMS);
  const [normalize, setNormalize] = useState(true);
  const [presetSourceMedium, setPresetSourceMedium] = useState<{ baseUrl: string; utm_source: string; utm_medium: string } | null>(
    null,
  );
  const [generatedLinks, setGeneratedLinks] = useState<GeneratedLink[]>([]);

  const baseUrlTrimmed = baseUrl.trim();
  const isBaseUrlValid = useMemo(() => {
    if (!baseUrlTrimmed) {
      return false;
    }
    try {
      new URL(baseUrlTrimmed);
      return true;
    } catch {
      return false;
    }
  }, [baseUrlTrimmed]);

  const result = useMemo(() => buildUtmUrl(baseUrl, params), [baseUrl, params]);

  const missingRequired = FIELDS.filter((field) => field.required && !params[field.key]);
  const canCopy = isBaseUrlValid && missingRequired.length === 0;

  function updateParam(key: keyof UtmParams, rawValue: string) {
    setParams((prev) => ({
      ...prev,
      [key]: normalize ? normalizeUtmValue(rawValue) : rawValue,
    }));
  }

  function applySuggestion(key: keyof UtmParams, value: string) {
    updateParam(key, value);
  }

  function handleSaveAsPreset() {
    setPresetSourceMedium({
      baseUrl: baseUrlTrimmed,
      utm_source: params.utm_source,
      utm_medium: params.utm_medium,
    });
  }

  function handleUsePreset() {
    if (!presetSourceMedium) {
      return;
    }
    setBaseUrl(presetSourceMedium.baseUrl);
    setParams((prev) => ({
      ...prev,
      utm_source: presetSourceMedium.utm_source,
      utm_medium: presetSourceMedium.utm_medium,
    }));
  }

  function handleAddToList() {
    if (!canCopy || !result.url) {
      return;
    }
    setGeneratedLinks((prev) => [{ url: result.url, campaign: params.utm_campaign }, ...prev]);
  }

  function handleClear() {
    setBaseUrl('');
    setParams(EMPTY_PARAMS);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="base-url" className="text-sm font-medium text-ink dark:text-paper">
          Destination URL
        </label>
        <input
          id="base-url"
          type="text"
          value={baseUrl}
          onChange={(event) => setBaseUrl(event.target.value)}
          placeholder="https://example.com/landing-page"
          aria-invalid={baseUrlTrimmed.length > 0 && !isBaseUrlValid}
          className="w-full rounded-md border border-ink/10 bg-paper px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
        />
        {baseUrlTrimmed.length > 0 && !isBaseUrlValid ? (
          <span className="text-sm text-danger">Enter a full URL, including https:// (e.g. https://example.com/page).</span>
        ) : (
          <span className="text-sm text-ink/60 dark:text-paper/60">
            The page you want people to land on — include https:// and any path.
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-sm font-semibold text-ink dark:text-paper">UTM parameters</h3>
          <Checkbox
            label="Normalize values (lowercase, trim)"
            checked={normalize}
            onChange={(event) => setNormalize(event.target.checked)}
          />
        </div>
        <p className="-mt-2 text-xs text-ink/50 dark:text-paper/50">
          On by default to prevent the most common analytics mistake — &ldquo;Facebook&rdquo; and &ldquo;facebook&rdquo;
          reporting as two different sources. Turn it off if you deliberately need mixed case.
        </p>

        {FIELDS.map((field) => (
          <div key={field.key} className="flex flex-col gap-1.5">
            <label htmlFor={field.key} className="flex items-center gap-1.5 text-sm font-medium text-ink dark:text-paper">
              {field.label}
              {field.required ? (
                <span aria-hidden className="text-danger">
                  *
                </span>
              ) : (
                <span className="text-xs font-normal text-ink/50 dark:text-paper/50">(optional)</span>
              )}
              {field.required && !params[field.key] && (
                <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-normal text-danger">
                  needed for attribution
                </span>
              )}
            </label>
            <input
              id={field.key}
              type="text"
              value={params[field.key] ?? ''}
              onChange={(event) => updateParam(field.key, event.target.value)}
              placeholder={field.placeholder}
              className="w-full rounded-md border border-ink/10 bg-paper px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
            />
            <span className="text-xs text-ink/60 dark:text-paper/60">{field.hint}</span>
            {field.suggestions && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {field.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => applySuggestion(field.key, suggestion)}
                    className="rounded-full border border-ink/10 px-2.5 py-1 text-xs text-ink/70 hover:border-accent hover:text-accent dark:border-paper/10 dark:text-paper/70"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-sm font-semibold text-ink dark:text-paper">Generated URL</h3>
          <Button variant="ghost" size="sm" onClick={handleClear} disabled={!baseUrl && !params.utm_source && !params.utm_medium && !params.utm_campaign}>
            Clear all
          </Button>
        </div>
        <div className="min-h-[2.5rem] w-full break-all rounded-md border border-ink/10 bg-paper px-3 py-2 font-mono text-sm text-ink dark:border-paper/10 dark:bg-ink dark:text-paper">
          {result.url ? result.url : <span className="text-ink/40 dark:text-paper/40">Enter a destination URL to get started…</span>}
        </div>
        {missingRequired.length > 0 && result.url && (
          <span className="text-xs text-ink/50 dark:text-paper/50">
            Still missing: {missingRequired.map((field) => field.label).join(', ')} — you can copy this as-is if
            that&apos;s intentional.
          </span>
        )}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <CopyButton value={result.url} disabled={!result.url} label="Copy URL" />
          <Button variant="secondary" size="sm" onClick={handleAddToList} disabled={!result.url}>
            Add to session list
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
        <h3 className="font-display text-sm font-semibold text-ink dark:text-paper">Preset (this session only)</h3>
        <p className="text-xs text-ink/60 dark:text-paper/60">
          Save your destination URL, source, and medium once, then quickly reuse them while you vary the campaign name
          for a batch of links. This resets when you reload the page — it isn&apos;t saved anywhere.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleSaveAsPreset} disabled={!baseUrlTrimmed || !params.utm_source || !params.utm_medium}>
            Save current URL, source & medium
          </Button>
          <Button variant="secondary" size="sm" onClick={handleUsePreset} disabled={!presetSourceMedium}>
            Apply saved preset
          </Button>
        </div>
        {presetSourceMedium && (
          <span className="font-mono text-xs text-ink/60 dark:text-paper/60">
            Saved: {presetSourceMedium.baseUrl} · {presetSourceMedium.utm_source} / {presetSourceMedium.utm_medium}
          </span>
        )}
      </div>

      {generatedLinks.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
          <h3 className="font-display text-sm font-semibold text-ink dark:text-paper">Links from this session</h3>
          <p className="text-xs text-ink/60 dark:text-paper/60">
            Not saved — this list clears when you reload or close the tab.
          </p>
          <BulkList items={generatedLinks.map((link) => link.url)} />
        </div>
      )}
    </div>
  );
}
