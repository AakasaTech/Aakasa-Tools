/**
 * Pure URL-construction logic for the UTM Link Builder tool. No React, no
 * DOM — safe to call from anywhere.
 */

export interface UtmParams {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term?: string;
  utm_content?: string;
}

export interface BuildUtmUrlResult {
  url: string;
  error?: string;
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

/**
 * Appends UTM parameters to `baseUrl`, using `URL`/`URLSearchParams` so any
 * query parameters already on the base URL (e.g. "?ref=abc") are preserved
 * rather than overwritten — only the five utm_* keys are added or replaced.
 * Params with an empty value are omitted (or removed, if present from a
 * previous call) so the output never contains e.g. "utm_term=".
 */
export function buildUtmUrl(baseUrl: string, params: UtmParams): BuildUtmUrlResult {
  const trimmedBaseUrl = baseUrl.trim();
  if (!trimmedBaseUrl) {
    return { url: '', error: 'Enter a base URL.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmedBaseUrl);
  } catch {
    return { url: '', error: 'Enter a full URL, including https:// (e.g. https://example.com/page).' };
  }

  for (const key of UTM_KEYS) {
    const value = params[key];
    if (value) {
      parsed.searchParams.set(key, value);
    } else {
      parsed.searchParams.delete(key);
    }
  }

  return { url: parsed.toString() };
}
