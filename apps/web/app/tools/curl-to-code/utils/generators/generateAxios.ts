import type { ParsedCurlRequest } from '../parseCurl';
import { tryParseJsonBody } from '../parseCurl';
import { indent } from '../literals';

function headersBlock(request: ParsedCurlRequest): string | null {
  if (request.headers.length === 0) return null;
  const entries = request.headers.map((h) => `${JSON.stringify(h.name)}: ${JSON.stringify(h.value)}`);
  return `{\n${indent(entries.join(',\n'), 2)}\n}`;
}

function authBlock(request: ParsedCurlRequest): string | null {
  if (!request.basicAuth) return null;
  return `{\n${indent(`username: ${JSON.stringify(request.basicAuth.username)},\npassword: ${JSON.stringify(request.basicAuth.password)}`, 2)}\n}`;
}

function dataExpression(request: ParsedCurlRequest): string | null {
  if (!request.body) return null;
  const json = tryParseJsonBody(request.body);
  // axios accepts a plain object for `data` and serializes + sets the
  // Content-Type header itself — the idiomatic way to send JSON, rather
  // than pre-stringifying it.
  if (json !== null) return JSON.stringify(json, null, 2);
  return JSON.stringify(request.body);
}

export function generateAxios(request: ParsedCurlRequest): string {
  const configLines = [`method: ${JSON.stringify(request.method.toLowerCase())}`, `url: ${JSON.stringify(request.url)}`];

  const headers = headersBlock(request);
  if (headers) configLines.push(`headers: ${headers}`);

  const auth = authBlock(request);
  if (auth) configLines.push(`auth: ${auth}`);

  const data = dataExpression(request);
  if (data) configLines.push(`data: ${data}`);

  const configObject = `{\n${indent(configLines.join(',\n'), 2)}\n}`;

  return `const axios = require('axios');

axios(${configObject})
  .then((response) => console.log(response.data))
  .catch((error) => console.error(error));`;
}
