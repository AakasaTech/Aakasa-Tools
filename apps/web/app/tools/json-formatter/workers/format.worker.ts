import { parseJson, formatJson, minifyJson, type IndentOption } from '../utils/jsonFormat';

export interface FormatWorkerRequest {
  id: number;
  input: string;
  mode: 'format' | 'minify';
  indent: IndentOption;
}

export type FormatWorkerResponse =
  | { id: number; success: true; result: string; value: unknown }
  | { id: number; success: false; error: { message: string; line: number; column: number } };

// `self` in a worker is a DedicatedWorkerGlobalScope, but the app's tsconfig
// pulls in the "dom" lib (for the rest of the client app), which conflicts
// with "webworker" lib types if both are enabled at once — cast instead of
// swapping libs just for this one file.
const ctx = self as unknown as Worker;

ctx.onmessage = (event: MessageEvent<FormatWorkerRequest>) => {
  const { id, input, mode, indent } = event.data;
  const parsed = parseJson(input);

  if (!parsed.success) {
    const response: FormatWorkerResponse = {
      id,
      success: false,
      error: {
        message: parsed.error.message,
        line: parsed.error.line,
        column: parsed.error.column,
      },
    };
    ctx.postMessage(response);
    return;
  }

  const result = mode === 'minify' ? minifyJson(parsed.value) : formatJson(parsed.value, indent);
  const response: FormatWorkerResponse = { id, success: true, result, value: parsed.value };
  ctx.postMessage(response);
};
