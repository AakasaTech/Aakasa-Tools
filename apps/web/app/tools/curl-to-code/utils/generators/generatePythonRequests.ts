import type { ParsedCurlRequest } from '../parseCurl';
import { tryParseJsonBody } from '../parseCurl';
import { pythonRepr, pythonString } from '../literals';

const REQUESTS_CONVENIENCE_METHODS = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']);

export function generatePythonRequests(request: ParsedCurlRequest): string {
  const lines: string[] = ['import requests', '', `url = ${pythonString(request.url)}`, ''];

  const callArgs = ['url'];

  if (request.headers.length > 0) {
    lines.push(`headers = ${pythonRepr(Object.fromEntries(request.headers.map((h) => [h.name, h.value])))}`, '');
    callArgs.push('headers=headers');
  }

  if (request.basicAuth) {
    callArgs.push(`auth=(${pythonString(request.basicAuth.username)}, ${pythonString(request.basicAuth.password)})`);
  }

  if (request.body) {
    const json = tryParseJsonBody(request.body);
    if (json !== null) {
      // requests' `json=` param serializes the payload itself and sets
      // Content-Type: application/json — the idiomatic way to send JSON,
      // rather than pre-serializing to a string with `data=`.
      lines.push(`payload = ${pythonRepr(json)}`, '');
      callArgs.push('json=payload');
    } else {
      lines.push(`payload = ${pythonString(request.body)}`, '');
      callArgs.push('data=payload');
    }
  }

  const method = request.method.toUpperCase();
  const callTarget = REQUESTS_CONVENIENCE_METHODS.has(method) ? `requests.${method.toLowerCase()}` : null;

  if (callTarget) {
    lines.push(`response = ${callTarget}(${callArgs.join(', ')})`);
  } else {
    lines.push(`response = requests.request(${[pythonString(method), ...callArgs].join(', ')})`);
  }

  lines.push('', 'print(response.status_code)', 'print(response.json())');

  return lines.join('\n');
}
