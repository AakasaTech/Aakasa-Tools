'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Combobox, CopyButton } from '@aakasa/ui';
import { convertCurrency, getExchangeRate } from './utils/currencyConvert';
import { CURRENCY_NAMES } from './utils/currencyNames';
import type { ExchangeRatesPayload } from '../../api/exchange-rates/route';

interface QuickPair {
  label: string;
  from: string;
  to: string;
}

const QUICK_PAIRS: QuickPair[] = [
  { label: 'USD → EUR', from: 'USD', to: 'EUR' },
  { label: 'USD → GBP', from: 'USD', to: 'GBP' },
  { label: 'USD → LKR', from: 'USD', to: 'LKR' },
  { label: 'USD → INR', from: 'USD', to: 'INR' },
  { label: 'EUR → USD', from: 'EUR', to: 'USD' },
  { label: 'GBP → USD', from: 'GBP', to: 'USD' },
];

type FetchState =
  | { status: 'loading' }
  | { status: 'ready'; data: ExchangeRatesPayload & { stale: boolean } }
  | { status: 'error'; message: string };

function formatAmount(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 4, minimumFractionDigits: 2 });
}

function formatRate(value: number): string {
  // Small rates (e.g. JPY-per-USD is large, but some pairs go the other
  // way) benefit from more precision than a plain 2-decimal amount would
  // give — enough digits to be meaningful without becoming unreadable.
  return value.toLocaleString('en-US', { maximumFractionDigits: 6, minimumFractionDigits: 2 });
}

function formatTimestamp(isoOrUtcString: string): string {
  const date = new Date(isoOrUtcString);
  if (Number.isNaN(date.getTime())) return isoOrUtcString;
  return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export function CurrencyConverter() {
  const [amountValue, setAmountValue] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [fetchState, setFetchState] = useState<FetchState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/exchange-rates')
      .then(async (response) => {
        const body = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setFetchState({ status: 'error', message: body.error ?? 'Could not load exchange rates.' });
          return;
        }
        setFetchState({ status: 'ready', data: body });
      })
      .catch(() => {
        if (!cancelled) {
          setFetchState({ status: 'error', message: 'Could not reach the exchange rate service. Check your connection and try again.' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const currencyOptions = useMemo(() => {
    if (fetchState.status !== 'ready') return [];
    return Object.keys(fetchState.data.rates)
      .sort()
      .map((code) => ({ value: code, label: CURRENCY_NAMES[code] ? `${code} — ${CURRENCY_NAMES[code]}` : code }));
  }, [fetchState]);

  const rate = fetchState.status === 'ready' ? getExchangeRate(fetchState.data.rates, fromCurrency, toCurrency) : null;
  const parsedAmount = Number(amountValue);
  const hasValidAmount = amountValue.trim() !== '' && Number.isFinite(parsedAmount);
  const convertedAmount = rate !== null && hasValidAmount ? convertCurrency(parsedAmount, rate) : null;

  function handleSwap() {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  }

  function handleQuickPair(pair: QuickPair) {
    setFromCurrency(pair.from);
    setToCurrency(pair.to);
  }

  return (
    <div className="flex flex-col gap-5">
      {fetchState.status === 'loading' && <p className="text-sm text-ink/50 dark:text-paper/50">Loading current exchange rates…</p>}

      {fetchState.status === 'error' && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {fetchState.message}
        </p>
      )}

      {fetchState.status === 'ready' && (
        <>
          <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_auto_1fr]">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-ink/70 dark:text-paper/70">Amount</span>
              <input
                type="text"
                inputMode="decimal"
                value={amountValue}
                onChange={(event) => setAmountValue(event.target.value)}
                spellCheck={false}
                aria-label="Amount"
                className="h-10 w-full rounded-md border border-ink/10 bg-paper px-3 font-mono text-lg text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
              />
              <Combobox options={currencyOptions} value={fromCurrency} onChange={setFromCurrency} ariaLabel="From currency" />
            </div>

            <Button type="button" variant="secondary" onClick={handleSwap} aria-label="Swap currencies" className="mb-1 justify-self-center text-lg">
              ⇅
            </Button>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-ink/70 dark:text-paper/70">Converted</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={convertedAmount !== null ? formatAmount(convertedAmount) : ''}
                  spellCheck={false}
                  aria-label="Converted amount"
                  placeholder="—"
                  className="h-10 w-full rounded-md border border-ink/10 bg-paper px-3 font-mono text-lg text-ink outline-none dark:border-paper/10 dark:bg-ink dark:text-paper"
                />
                <CopyButton value={convertedAmount !== null ? formatAmount(convertedAmount) : ''} disabled={convertedAmount === null} />
              </div>
              <Combobox options={currencyOptions} value={toCurrency} onChange={setToCurrency} ariaLabel="To currency" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-ink/50 dark:text-paper/50">Quick pick</span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PAIRS.map((pair) => (
                <button
                  key={pair.label}
                  type="button"
                  onClick={() => handleQuickPair(pair)}
                  className="rounded-full border border-ink/10 px-3 py-1 font-mono text-xs text-ink/70 transition-colors hover:border-accent hover:text-accent dark:border-paper/10 dark:text-paper/70"
                >
                  {pair.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border-y border-r border-l-2 border-l-accent border-ink/10 bg-accent/5 p-3 text-sm text-ink dark:border-paper/10 dark:text-paper">
            {rate !== null ? (
              <p>
                1 {fromCurrency} = {formatRate(rate)} {toCurrency}
              </p>
            ) : (
              <p className="text-ink/60 dark:text-paper/60">Choose two valid currencies to see the exchange rate.</p>
            )}
            <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">
              {fetchState.data.stale
                ? `⚠ Couldn't refresh rates right now — showing the last successfully fetched rates, from ${formatTimestamp(fetchState.data.upstreamUpdatedAt)}.`
                : `Rates updated ${formatTimestamp(fetchState.data.upstreamUpdatedAt)}.`}{' '}
              Exchange rates move constantly and can shift significantly within a single day — this is a snapshot from a single point in
              time, not a live trading feed.
            </p>
            <p className="mt-1 text-xs text-ink/40 dark:text-paper/40">
              <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">
                Rates By Exchange Rate API
              </a>
            </p>
          </div>
        </>
      )}

      <span className="text-xs text-ink/50 dark:text-paper/50">
        This tool is for quick estimates, budgeting, and travel planning — not for financial transactions requiring an exact current
        rate. Your amount and currency selections are never sent anywhere; only the shared rate table is fetched.
      </span>
    </div>
  );
}
