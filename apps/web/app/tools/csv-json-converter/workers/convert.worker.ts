import { csvToJson, type CsvParseOptions, type CsvToJsonResult } from '@aakasa/csv-utils';
import { jsonToCsv, type JsonToCsvOptions, type JsonToCsvResult } from '../utils/jsonToCsv';

export type ConvertWorkerRequest =
  | { id: number; direction: 'csv-to-json'; input: string; options: CsvParseOptions }
  | { id: number; direction: 'json-to-csv'; input: string; options: JsonToCsvOptions };

export type ConvertWorkerResponse =
  | { id: number; direction: 'csv-to-json'; result: CsvToJsonResult }
  | { id: number; direction: 'json-to-csv'; result: JsonToCsvResult };

// See format.worker.ts in json-formatter for why this cast is needed instead
// of switching the tsconfig "lib" to "webworker".
const ctx = self as unknown as Worker;

// A custom worker rather than PapaParse's own `worker: true` option — that
// option spawns Papa's own internal worker by resolving its own script URL
// at runtime, which doesn't reliably survive being bundled by webpack (the
// mechanism assumes an unbundled <script> tag it can point back to). This
// file instead runs inside a Next.js/webpack-native worker (the same
// `new Worker(new URL(...))` pattern already used by every other tool's
// worker in this repo) and just calls Papa.parse/unparse synchronously
// inside it — which also means one worker mechanism covers both directions
// instead of needing a second custom worker just for JSON→CSV.
ctx.onmessage = (event: MessageEvent<ConvertWorkerRequest>) => {
  const request = event.data;

  if (request.direction === 'csv-to-json') {
    const result = csvToJson(request.input, request.options);
    const response: ConvertWorkerResponse = { id: request.id, direction: 'csv-to-json', result };
    ctx.postMessage(response);
    return;
  }

  const result = jsonToCsv(request.input, request.options);
  const response: ConvertWorkerResponse = { id: request.id, direction: 'json-to-csv', result };
  ctx.postMessage(response);
};
