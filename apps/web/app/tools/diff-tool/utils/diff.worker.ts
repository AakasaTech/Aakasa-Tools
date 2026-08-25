/// <reference lib="webworker" />

/**
 * Runs computeDiff off the main thread. Measured with a Node timing script
 * before writing this file: a "realistic" 5,000-line diff (~10% of lines
 * changed) computes in ~100ms, which wouldn't need a worker on its own —
 * but a worst-case 5,000-line diff where nothing lines up (two largely
 * unrelated files, or the same file with every line touched) took
 * 5-6.6 seconds across all three granularities, which would freeze the tab
 * for that entire span if run on the main thread. That's what justifies the
 * worker: not the common case, but a plausible one (pasting two files that
 * turn out to share little) that's genuinely bad on the main thread.
 */

import { computeDiff, type DiffOptions } from './computeDiff';

export interface DiffWorkerRequest {
  requestId: number;
  original: string;
  changed: string;
  options: DiffOptions;
}

export interface DiffWorkerResponse {
  requestId: number;
  result: ReturnType<typeof computeDiff>;
}

self.onmessage = (event: MessageEvent<DiffWorkerRequest>) => {
  const { requestId, original, changed, options } = event.data;
  const result = computeDiff(original, changed, options);
  const response: DiffWorkerResponse = { requestId, result };
  self.postMessage(response);
};
