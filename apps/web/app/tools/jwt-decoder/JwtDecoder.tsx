'use client';

import { useMemo, useState } from 'react';
import { Button, CopyButton, JsonTreeView } from '@aakasa/ui';
import {
  decodeJwt,
  formatClaimTimestamp,
  getExpirationStatus,
  type ExpirationInfo,
} from './utils/decodeJwt';

const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const TIME_CLAIM_KEYS = ['exp', 'iat', 'nbf'] as const;
type TimeClaimKey = (typeof TIME_CLAIM_KEYS)[number];

function getStringClaim(value: unknown, key: string): string | undefined {
  if (value && typeof value === 'object' && key in (value as Record<string, unknown>)) {
    const claim = (value as Record<string, unknown>)[key];
    return typeof claim === 'string' ? claim : undefined;
  }
  return undefined;
}

function getNumericClaim(value: unknown, key: string): number | undefined {
  if (value && typeof value === 'object' && key in (value as Record<string, unknown>)) {
    const claim = (value as Record<string, unknown>)[key];
    return typeof claim === 'number' ? claim : undefined;
  }
  return undefined;
}

function stripBearerPrefix(text: string): string {
  return text.replace(/^\s*Bearer\s+/i, '');
}

export function JwtDecoder() {
  const [input, setInput] = useState('');

  const trimmed = input.trim();
  const decoded = useMemo(() => decodeJwt(trimmed), [trimmed]);
  const segments = trimmed.split('.');
  const showColorSegments = segments.length === 3 && trimmed.length > 0;

  function handleChange(text: string) {
    setInput(stripBearerPrefix(text));
  }

  function handleLoadSample() {
    setInput(SAMPLE_JWT);
  }

  function handleClear() {
    setInput('');
  }

  const alg = decoded.header ? getStringClaim(decoded.header, 'alg') : undefined;
  const exp = decoded.payload ? getNumericClaim(decoded.payload, 'exp') : undefined;
  const expirationInfo: ExpirationInfo | null = decoded.payload ? getExpirationStatus(exp) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="jwt-input" className="text-sm font-medium text-ink dark:text-paper">
            JWT
          </label>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleLoadSample}>
              Load sample JWT
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClear} disabled={!input}>
              Clear
            </Button>
          </div>
        </div>
        <textarea
          id="jwt-input"
          value={input}
          onChange={(event) => handleChange(event.target.value)}
          spellCheck={false}
          placeholder="Paste a JWT — a leading &quot;Bearer &quot; is stripped automatically…"
          aria-label="JWT input"
          className="h-28 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
        />
        <span className="text-xs text-ink/50 dark:text-paper/50">
          Nothing you paste here is stored or transmitted — decoding happens entirely in your browser.
        </span>

        {showColorSegments && (
          <div className="break-all rounded-md border border-ink/10 bg-paper p-3 font-mono text-xs dark:border-paper/10 dark:bg-ink">
            <span className="rounded-sm bg-accent/10 px-0.5 text-accent">{segments[0]}</span>
            <span className="text-ink/30 dark:text-paper/30">.</span>
            <span className="rounded-sm bg-success/10 px-0.5 text-success">{segments[1]}</span>
            <span className="text-ink/30 dark:text-paper/30">.</span>
            <span className="rounded-sm bg-ink/10 px-0.5 text-ink dark:bg-paper/10 dark:text-paper">{segments[2]}</span>
          </div>
        )}
      </div>

      {decoded.error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {decoded.error}
        </p>
      )}

      {!decoded.error && decoded.header !== null && decoded.payload !== null && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DecodedPanel title="Header" value={decoded.header} />
            <DecodedPanel title="Payload" value={decoded.payload} />
          </div>

          {expirationInfo && (
            <div className="flex flex-wrap items-center gap-2">
              <ExpirationBadge info={expirationInfo} />
              {TIME_CLAIM_KEYS.filter((key) => getNumericClaim(decoded.payload, key) !== undefined).map((key) => (
                <ClaimTimestampChip key={key} claimKey={key} value={getNumericClaim(decoded.payload, key)} />
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-lg border-l-4 border-danger bg-danger/5 p-4">
            <div className="flex items-start gap-2">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="mt-0.5 h-5 w-5 shrink-0 text-danger"
                aria-hidden
              >
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div className="flex flex-col gap-1">
                <span className="font-display text-base font-bold text-danger">Signature not verified</span>
                <p className="text-sm text-ink dark:text-paper">
                  This tool only decodes the header and payload — both are plain Base64URL-encoded JSON, not
                  encrypted, so anyone can read them without a key. It does not check whether the signature below is
                  authentic, because doing that correctly would require your signing secret or private key, and no
                  legitimate tool should ask you to paste that into a website. Never treat a decoded token as proof
                  of who issued it without verifying the signature server-side against the real signing key.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-ink/50 dark:text-paper/50">
                Claimed algorithm: <span className="font-mono">{alg ?? 'unknown'}</span>
              </span>
              <span className="text-xs text-ink/50 dark:text-paper/50">Signature (raw, opaque bytes — not decoded)</span>
              <div className="break-all rounded-md border border-ink/10 bg-paper p-3 font-mono text-xs text-ink dark:border-paper/10 dark:bg-ink dark:text-paper">
                {decoded.signature || <span className="text-ink/40 dark:text-paper/40">(empty)</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DecodedPanel({ title, value }: { title: string; value: unknown }) {
  const json = useMemo(() => JSON.stringify(value, null, 2), [value]);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-ink/50 dark:text-paper/50">{title}</span>
        <CopyButton value={json} />
      </div>
      <div className="max-h-72 overflow-auto rounded-md border border-ink/10 bg-paper p-3 dark:border-paper/10 dark:bg-ink">
        <JsonTreeView value={value} />
      </div>
    </div>
  );
}

function ExpirationBadge({ info }: { info: ExpirationInfo }) {
  const classes: Record<ExpirationInfo['status'], string> = {
    expired: 'bg-danger/10 text-danger',
    valid: 'bg-success/10 text-success',
    'no-expiry': 'bg-ink/5 text-ink/60 dark:bg-paper/10 dark:text-paper/60',
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${classes[info.status]}`}>{info.label}</span>
  );
}

function ClaimTimestampChip({ claimKey, value }: { claimKey: TimeClaimKey; value: number | undefined }) {
  const formatted = formatClaimTimestamp(value);
  if (value === undefined || !formatted) {
    return null;
  }
  return (
    <span className="rounded-full bg-ink/5 px-3 py-1 font-mono text-xs text-ink/70 dark:bg-paper/10 dark:text-paper/70">
      {claimKey}: {value} &rarr; {formatted}
    </span>
  );
}
