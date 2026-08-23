import { applyReplace, buildRegex, findMatches, type MatchResult } from '../utils/regexEngine';

export interface RegexWorkerRequest {
  id: number;
  pattern: string;
  flags: string;
  testString: string;
  mode: 'match' | 'replace';
  replacement?: string;
}

export type RegexWorkerResponse =
  | { id: number; status: 'ok'; matches: MatchResult[]; replaceResult: string | null }
  | { id: number; status: 'error'; error: string };

// See format.worker.ts in json-formatter for why this cast is needed instead
// of switching the tsconfig "lib" to "webworker".
const ctx = self as unknown as Worker;

ctx.onmessage = (event: MessageEvent<RegexWorkerRequest>) => {
  const { id, pattern, flags, testString, mode, replacement } = event.data;

  const regexOrError = buildRegex(pattern, flags);
  if ('error' in regexOrError) {
    const response: RegexWorkerResponse = { id, status: 'error', error: regexOrError.error };
    ctx.postMessage(response);
    return;
  }

  // This is the line that can hang forever on a catastrophically
  // backtracking pattern — there is no way to interrupt it from inside.
  // The main thread's timeout+terminate() is the only real defense.
  const matches = findMatches(regexOrError, testString);

  let replaceResult: string | null = null;
  if (mode === 'replace') {
    const result = applyReplace(pattern, flags, testString, replacement ?? '');
    if (typeof result !== 'string') {
      const response: RegexWorkerResponse = { id, status: 'error', error: result.error };
      ctx.postMessage(response);
      return;
    }
    replaceResult = result;
  }

  const response: RegexWorkerResponse = { id, status: 'ok', matches, replaceResult };
  ctx.postMessage(response);
};
