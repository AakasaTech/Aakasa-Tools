import { encodeFile } from '../utils/base64';

export interface EncodeWorkerRequest {
  id: number;
  file: File;
}

export type EncodeWorkerResponse =
  | { id: number; success: true; result: string }
  | { id: number; success: false; error: string };

// See format.worker.ts in json-formatter for why this cast is needed instead
// of switching the tsconfig "lib" to "webworker".
const ctx = self as unknown as Worker;

ctx.onmessage = (event: MessageEvent<EncodeWorkerRequest>) => {
  const { id, file } = event.data;

  encodeFile(file)
    .then((result) => {
      const response: EncodeWorkerResponse = { id, success: true, result };
      ctx.postMessage(response);
    })
    .catch((err: unknown) => {
      const response: EncodeWorkerResponse = {
        id,
        success: false,
        error: err instanceof Error ? err.message : 'Encoding failed',
      };
      ctx.postMessage(response);
    });
};
