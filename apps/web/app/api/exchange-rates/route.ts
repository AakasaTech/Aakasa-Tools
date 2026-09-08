import { NextResponse } from 'next/server';

/**
 * Free, no-API-key-required exchange rate endpoint (provided by
 * exchangerate-api.com's open access tier). Upstream data itself only
 * refreshes once every 24 hours, and their own guidance is to not poll it
 * more than hourly — this route's `next.revalidate` below caches successful
 * responses for well under that, comfortably respecting their limits while
 * keeping quotes fresh enough for a currency-estimate tool.
 *
 * Per their terms, using this data requires attribution — the tool UI
 * (CurrencyConverter.tsx) links back to https://www.exchangerate-api.com.
 */
const UPSTREAM_URL = 'https://open.er-api.com/v6/latest/USD';
const REVALIDATE_SECONDS = 6 * 60 * 60; // 6 hours
const FETCH_TIMEOUT_MS = 8000;

interface UpstreamResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
  time_last_update_utc: string;
}

export interface ExchangeRatesPayload {
  base: string;
  rates: Record<string, number>;
  upstreamUpdatedAt: string;
  fetchedAt: number;
}

// In-memory last-known-good fallback for when the upstream is unreachable.
// This is separate from (and a safety net beyond) the `next.revalidate`
// cache below, which only governs freshness for SUCCESSFUL responses and
// does nothing to help when the upstream is currently down — without this,
// an upstream outage would break the tool entirely instead of degrading to
// "serve the last rates we had, clearly marked stale."
let lastKnownGood: ExchangeRatesPayload | null = null;

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function GET() {
  try {
    const response = await fetch(UPSTREAM_URL, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Upstream responded with ${response.status}`);
    }

    const data = (await response.json()) as UpstreamResponse;
    if (data.result !== 'success' || !data.rates || typeof data.rates !== 'object') {
      throw new Error('Unexpected upstream response shape.');
    }

    const payload: ExchangeRatesPayload = {
      base: data.base_code,
      rates: data.rates,
      upstreamUpdatedAt: data.time_last_update_utc,
      fetchedAt: Date.now(),
    };
    lastKnownGood = payload;

    return NextResponse.json({ ...payload, stale: false });
  } catch {
    if (lastKnownGood) {
      return NextResponse.json({ ...lastKnownGood, stale: true });
    }
    return errorResponse('Exchange rates are temporarily unavailable, and no cached rates exist yet. Please try again shortly.', 502);
  }
}
