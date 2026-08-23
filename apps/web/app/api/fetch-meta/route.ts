import { NextRequest, NextResponse } from 'next/server';
import { parseMetaTags } from '@/app/tools/meta-tag-previewer/utils/parseMetaTags';
import { validateFetchUrl } from './ssrfGuard';
import { checkRateLimit } from './rateLimit';

// Needs Node's `dns` module for the SSRF guard's resolution check, so this
// can't run on the Edge runtime.
export const runtime = 'nodejs';

const FETCH_TIMEOUT_MS = 8000;
/** Safety cap on how much of the response we'll buffer if a page never closes <head> (or has none) — this endpoint never downloads/returns a full page body. */
const MAX_HEAD_BYTES = 300_000;
const MAX_REDIRECTS = 5;
const USER_AGENT = 'AakasaToolboxMetaBot/1.0 (+https://aakasa.dev/tools/meta-tag-previewer)';

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]!.trim();
  }
  return request.ip ?? 'unknown';
}

function errorResponse(error: string, code: string, status: number) {
  return NextResponse.json({ error, code }, { status });
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment and try again.', code: 'rate_limited' },
      { status: 429, headers: rateLimit.retryAfterSeconds ? { 'Retry-After': String(rateLimit.retryAfterSeconds) } : undefined }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request body.', 'invalid_request', 400);
  }

  const rawUrl = typeof body === 'object' && body !== null && 'url' in body ? (body as { url: unknown }).url : undefined;
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return errorResponse('A URL is required.', 'invalid_request', 400);
  }

  const initialValidation = await validateFetchUrl(rawUrl.trim());
  if (!initialValidation.ok || !initialValidation.url) {
    return errorResponse(initialValidation.error ?? 'That URL is not allowed.', 'blocked', 400);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    let currentUrl = initialValidation.url;
    let response: Response | null = null;

    // `redirect: 'manual'` and re-validating every hop through the same
    // SSRF guard — validating only the ORIGINAL URL and then letting fetch
    // auto-follow redirects would let a malicious page pass the guard once
    // and then 302 to an internal address, bypassing it entirely.
    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
      const candidate = await fetch(currentUrl.href, {
        signal: controller.signal,
        redirect: 'manual',
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      });

      if (candidate.status >= 300 && candidate.status < 400) {
        const location = candidate.headers.get('location');
        if (!location) {
          return errorResponse('The page redirected without a destination.', 'fetch_failed', 502);
        }
        let nextUrl: URL;
        try {
          nextUrl = new URL(location, currentUrl);
        } catch {
          return errorResponse('The page redirected to an invalid URL.', 'fetch_failed', 502);
        }
        const redirectValidation = await validateFetchUrl(nextUrl.href);
        if (!redirectValidation.ok || !redirectValidation.url) {
          return errorResponse('The page redirected to a URL that is not allowed.', 'blocked', 400);
        }
        currentUrl = redirectValidation.url;
        continue;
      }

      response = candidate;
      break;
    }

    if (!response) {
      return errorResponse('Too many redirects.', 'fetch_failed', 502);
    }

    if (!response.ok) {
      return errorResponse(`The page responded with ${response.status}${response.statusText ? ` ${response.statusText}` : ''}.`, 'http_error', 502);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('html')) {
      return errorResponse('That URL did not return an HTML page.', 'not_html', 400);
    }

    if (!response.body) {
      return errorResponse('The page returned no content.', 'fetch_failed', 502);
    }

    // Read only until </head> shows up, or we hit the safety cap — then
    // cancel the underlying stream. Full page bodies are never buffered,
    // returned, or stored; only the extracted tag data below is.
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffered = '';
    let totalBytes = 0;

    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      totalBytes += value.byteLength;
      buffered += decoder.decode(value, { stream: true });
      if (/<\/head/i.test(buffered) || totalBytes >= MAX_HEAD_BYTES) {
        await reader.cancel().catch(() => undefined);
        break;
      }
    }

    const data = parseMetaTags(buffered, currentUrl.href);
    return NextResponse.json({ data, fetchedUrl: currentUrl.href });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return errorResponse('The request timed out.', 'timeout', 504);
    }
    return errorResponse('Could not reach that URL.', 'network_error', 502);
  } finally {
    clearTimeout(timeoutId);
  }
}
