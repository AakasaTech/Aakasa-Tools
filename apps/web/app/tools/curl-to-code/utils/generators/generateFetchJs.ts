import type { ParsedCurlRequest } from '../parseCurl';
import { tryParseJsonBody } from '../parseCurl';
import { indent } from '../literals';

function headersBlock(request: ParsedCurlRequest): string | null {
  const entries = request.headers.map((h) => `${JSON.stringify(h.name)}: ${JSON.stringify(h.value)}`);
  if (request.basicAuth) {
    // fetch has no native basic-auth option, unlike axios/requests/cURL —
    // the idiomatic browser-JS way is a base64-encoded Authorization header.
    entries.unshift(`Authorization: 'Basic ' + btoa(${JSON.stringify(`${request.basicAuth.username}:${request.basicAuth.password}`)})`);
  }
  if (entries.length === 0) return null;
  return `{\n${indent(entries.join(',\n'), 2)}\n}`;
}

function bodyExpression(request: ParsedCurlRequest): string | null {
  if (!request.body) return null;
  const json = tryParseJsonBody(request.body);
  if (json !== null) {
    return `JSON.stringify(${JSON.stringify(json, null, 2)})`;
  }
  return JSON.stringify(request.body);
}

export function generateFetchJs(request: ParsedCurlRequest): string {
  const optionLines = [`method: ${JSON.stringify(request.method)}`];

  const headers = headersBlock(request);
  if (headers) optionLines.push(`headers: ${headers}`);

  const body = bodyExpression(request);
  if (body) optionLines.push(`body: ${body}`);

  const optionsObject = `{\n${indent(optionLines.join(',\n'), 2)}\n}`;

  return `fetch(${JSON.stringify(request.url)}, ${optionsObject})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error(error));`;
}
