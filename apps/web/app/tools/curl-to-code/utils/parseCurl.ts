/**
 * Parses a curl command into a structured request, using `shell-quote` for
 * the fiddly part (POSIX-style quote/escape tokenizing — single quotes,
 * double quotes, the `'"'"'` embedded-quote idiom bash's own `Copy as cURL`
 * output uses) rather than hand-rolling a tokenizer. `shell-quote` is tiny
 * (zero deps, ~40KB unpacked) and its tokenizing is exactly what a real
 * shell would produce — but it also does two things a *real* shell does
 * that we deliberately do NOT want here, confirmed empirically before
 * writing this file:
 *
 *  - It treats `\` followed by a newline as an embedded literal escape
 *    rather than a line-continuation, producing stray empty-string tokens.
 *    Line continuations are joined into one line by this file BEFORE
 *    tokenizing, which sidesteps the problem entirely.
 *  - It substitutes `$VAR`-shaped text with an environment lookup (empty
 *    string when the lookup returns nothing) — which would silently
 *    corrupt a header value or JSON body that happens to contain a literal
 *    `$` followed by what looks like an identifier (e.g. a token, a query
 *    string, a bcrypt-style hash). A custom env lookup that echoes `$NAME`
 *    back unchanged neutralizes this, since we're parsing text, not
 *    executing a shell.
 *
 * This only covers the curl flags listed in the FAQ/UI — curl has several
 * hundred flags, and anything outside that set is reported back as an
 * "unsupported flag" rather than silently dropped or misparsed.
 */

import { parse as parseShellTokens } from 'shell-quote';

export interface CurlHeader {
  name: string;
  value: string;
}

export interface ParsedCurlRequest {
  url: string;
  method: string;
  headers: CurlHeader[];
  body: string | null;
  basicAuth: { username: string; password: string } | null;
  compressed: boolean;
}

export interface ParseCurlResult {
  parsed: ParsedCurlRequest;
  unsupportedFlags: string[];
}

/** Curl flags outside our supported set that are known to take a value —
 * needed so we skip that value instead of misreading it as the URL or
 * another flag. Anything not in this list is assumed to be a boolean flag
 * (true for the vast majority of commonly-seen extras like --insecure,
 * -L/--location, -s/--silent, -v/--verbose). This is a deliberate,
 * documented simplification, not an attempt at full curl flag coverage. */
const KNOWN_UNSUPPORTED_VALUE_FLAGS = new Set([
  '-A',
  '--user-agent',
  '-e',
  '--referer',
  '-o',
  '--output',
  '-x',
  '--proxy',
  '--max-time',
  '--connect-timeout',
  '--retry',
  '--cacert',
  '--cert',
  '--key',
  '-r',
  '--range',
  '-w',
  '--write-out',
]);

/** Joins `\` + newline line continuations into a single line. Only applied
 * outside of quotes would require a full parse to determine — in practice
 * every real curl example (devtools "Copy as cURL", API docs) places
 * continuations between arguments, never mid-string, so a global
 * replacement is a safe, pragmatic simplification here. */
function joinLineContinuations(command: string): string {
  return command.replace(/\\\r?\n[ \t]*/g, ' ');
}

/** Tokenizes with a custom env lookup that echoes `$NAME` back literally
 * instead of substituting it (see file header). Non-string tokens (glob or
 * shell-operator objects shell-quote produces for unquoted `*`, `&&`, `;`,
 * etc.) are dropped — a curl command shouldn't contain shell operators, and
 * if one does, this parser only cares about the curl invocation itself. */
function tokenize(command: string): string[] {
  const echoEnv = new Proxy(
    {},
    {
      get: (_target, prop: string) => `$${prop}`,
    },
  );
  const tokens = parseShellTokens(joinLineContinuations(command), echoEnv as Record<string, string>);
  return tokens.filter((token): token is string => typeof token === 'string');
}

function splitOnFirst(value: string, separator: string): [string, string] {
  const index = value.indexOf(separator);
  if (index === -1) return [value, ''];
  return [value.slice(0, index), value.slice(index + separator.length)];
}

export function parseCurlCommand(command: string): ParseCurlResult {
  let tokens = tokenize(command.trim());

  // Drop a leading "curl" (or "curl.exe") invocation token, if present.
  if (tokens.length > 0 && /^curl(\.exe)?$/i.test(tokens[0] ?? '')) {
    tokens = tokens.slice(1);
  }

  const headers: CurlHeader[] = [];
  const bodyParts: string[] = [];
  const unsupportedFlags: string[] = [];
  let url = '';
  let explicitMethod: string | null = null;
  let basicAuth: { username: string; password: string } | null = null;
  let compressed = false;
  let cookie: string | null = null;

  let i = 0;
  while (i < tokens.length) {
    const rawToken = tokens[i] ?? '';

    // Support `--long-flag=value` equals-syntax in addition to the more
    // common `--long-flag value` space-separated form.
    let flag = rawToken;
    let inlineValue: string | null = null;
    if (flag.startsWith('--') && flag.includes('=')) {
      const [f, v] = splitOnFirst(flag, '=');
      flag = f;
      inlineValue = v;
    }

    const takesValueNext = () => {
      if (inlineValue !== null) return inlineValue;
      i += 1;
      return tokens[i] ?? '';
    };

    switch (flag) {
      case '--url':
        url = takesValueNext();
        break;
      case '-X':
      case '--request':
        explicitMethod = takesValueNext();
        break;
      case '-H':
      case '--header':
        headers.push(parseHeaderValue(takesValueNext()));
        break;
      case '-d':
      case '--data':
      case '--data-raw':
      case '--data-binary':
      case '--data-ascii':
        bodyParts.push(takesValueNext());
        break;
      case '-u':
      case '--user': {
        const [username, password] = splitOnFirst(takesValueNext(), ':');
        basicAuth = { username, password };
        break;
      }
      case '-b':
      case '--cookie':
        cookie = takesValueNext();
        break;
      case '--compressed':
        compressed = true;
        break;
      default:
        if (flag.startsWith('-')) {
          unsupportedFlags.push(flag);
          if (KNOWN_UNSUPPORTED_VALUE_FLAGS.has(flag)) {
            takesValueNext();
          }
        } else if (!url) {
          // The bare positional argument — the URL. shell-quote already
          // strips the surrounding quotes during tokenizing.
          url = rawToken;
        }
        break;
    }

    i += 1;
  }

  if (cookie) {
    const existingCookieHeader = headers.find((h) => h.name.toLowerCase() === 'cookie');
    if (existingCookieHeader) {
      existingCookieHeader.value = `${existingCookieHeader.value}; ${cookie}`;
    } else {
      headers.push({ name: 'Cookie', value: cookie });
    }
  }

  const body = bodyParts.length > 0 ? bodyParts.join('&') : null;
  const method = explicitMethod ? explicitMethod.toUpperCase() : body ? 'POST' : 'GET';

  return {
    parsed: { url, method, headers, body, basicAuth, compressed },
    unsupportedFlags: [...new Set(unsupportedFlags)],
  };
}

function parseHeaderValue(raw: string): CurlHeader {
  const [name, value] = splitOnFirst(raw, ':');
  return { name: name.trim(), value: value.trim() };
}

/** Returns the parsed value if `body` is valid JSON, otherwise null — used
 * by generators to decide between a language-native object/dict literal
 * and a raw string. */
export function tryParseJsonBody(body: string | null): unknown | null {
  if (!body) return null;
  const trimmed = body.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}
