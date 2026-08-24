import { parseCsvGrid, type ParseCsvGridResult } from '../utils/csvGridOperations';

export interface ParseCsvWorkerRequest {
  id: number;
  csvText: string;
}

export interface ParseCsvWorkerResponse {
  id: number;
  result: ParseCsvGridResult;
}

// See format.worker.ts in json-formatter for why this cast is needed instead
// of switching the tsconfig "lib" to "webworker".
const ctx = self as unknown as Worker;

// Thin message-passing shell around `parseCsvGrid` (itself a thin wrapper
// around CSV↔JSON Converter's `csvToJson`) — the actual parsing algorithm
// is reused, not reimplemented, matching every other worker in this repo.
ctx.onmessage = (event: MessageEvent<ParseCsvWorkerRequest>) => {
  const { id, csvText } = event.data;
  const result = parseCsvGrid(csvText);
  const response: ParseCsvWorkerResponse = { id, result };
  ctx.postMessage(response);
};
