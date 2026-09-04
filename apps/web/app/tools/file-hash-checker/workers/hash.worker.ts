// Thin worker wrapper only — the actual hashing logic (including the MD5
// fallback) is uuid-hash-generator's computeHash, reused here rather than
// reimplemented. Each tool keeps its own worker file for webpack's
// `new URL(...)` bundling, but the algorithm itself lives in one place.
import { computeHash, type HashAlgorithm } from '../../uuid-hash-generator/utils/hash';

export interface HashWorkerRequest {
  id: number;
  buffer: ArrayBuffer;
  algorithm: HashAlgorithm;
}

export interface HashWorkerResponse {
  id: number;
  hash: string;
}

const ctx = self as unknown as Worker;

ctx.onmessage = (event: MessageEvent<HashWorkerRequest>) => {
  const { id, buffer, algorithm } = event.data;
  void computeHash(buffer, algorithm).then((hash) => {
    const response: HashWorkerResponse = { id, hash };
    ctx.postMessage(response);
  });
};
