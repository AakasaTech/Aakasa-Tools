import { computeHash, type HashAlgorithm } from '../utils/hash';

export interface HashWorkerRequest {
  id: number;
  buffer: ArrayBuffer;
  algorithm: HashAlgorithm;
}

export interface HashWorkerResponse {
  id: number;
  hash: string;
}

// See format.worker.ts in json-formatter for why this cast is needed instead
// of switching the tsconfig "lib" to "webworker".
const ctx = self as unknown as Worker;

ctx.onmessage = (event: MessageEvent<HashWorkerRequest>) => {
  const { id, buffer, algorithm } = event.data;
  void computeHash(buffer, algorithm).then((hash) => {
    const response: HashWorkerResponse = { id, hash };
    ctx.postMessage(response);
  });
};
