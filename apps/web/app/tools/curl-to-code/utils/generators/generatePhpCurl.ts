import type { ParsedCurlRequest } from '../parseCurl';
import { tryParseJsonBody } from '../parseCurl';
import { phpRepr, phpString } from '../literals';

function postFieldsExpression(body: string): string {
  const json = tryParseJsonBody(body);
  if (json !== null) {
    return `json_encode(${phpRepr(json, 1)})`;
  }
  return phpString(body);
}

export function generatePhpCurl(request: ParsedCurlRequest): string {
  const options: string[] = [`CURLOPT_URL => ${phpString(request.url)}`, 'CURLOPT_RETURNTRANSFER => true'];

  // --compressed isn't a no-op for PHP's cURL extension the way it is for
  // fetch/axios/requests — those decompress automatically, but PHP's cURL
  // only does when CURLOPT_ENCODING is explicitly set. An empty string
  // tells it to accept and decode every encoding the server offers, which
  // is the idiomatic equivalent of curl's own --compressed.
  if (request.compressed) {
    options.push("CURLOPT_ENCODING => ''");
  }

  const method = request.method.toUpperCase();
  if (method === 'POST') {
    options.push('CURLOPT_POST => true');
  } else if (method !== 'GET') {
    options.push(`CURLOPT_CUSTOMREQUEST => ${phpString(method)}`);
  }

  if (request.body) {
    options.push(`CURLOPT_POSTFIELDS => ${postFieldsExpression(request.body)}`);
  }

  if (request.headers.length > 0) {
    // CURLOPT_HTTPHEADER takes a plain indexed array of "Name: value"
    // strings, not an associative array — a common mistake worth getting
    // right specifically since PHP cURL is the target most likely to be
    // pasted straight into real code here. Indented at the final depth it
    // will sit at (8sp items / 4sp closing bracket) directly, matching
    // phpRepr's own convention — see the note below on why.
    const headerLines = request.headers.map((h) => `        ${phpString(`${h.name}: ${h.value}`)},`);
    options.push(`CURLOPT_HTTPHEADER => [\n${headerLines.join('\n')}\n    ]`);
  }

  if (request.basicAuth) {
    options.push(`CURLOPT_USERPWD => ${phpString(`${request.basicAuth.username}:${request.basicAuth.password}`)}`);
  }

  // Each option string above is already written at its final absolute
  // indentation for every line after the first (phpRepr's depth parameter,
  // and the header block above, both account for sitting one level inside
  // curl_setopt_array's own array literal) — so only the first line of
  // each gets the base 4sp indent here. Blanket-indenting every line would
  // double up the indent on anything multi-line (confirmed by inspecting
  // the actual generated output before writing it this way: the nested
  // json_encode() array was landing at 12sp/8sp instead of 8sp/4sp).
  const optionsBlock = options
    .map((option) => {
      const [first, ...rest] = option.split('\n');
      return [`    ${first}`, ...rest].join('\n');
    })
    .map((option) => `${option},`)
    .join('\n');

  return `<?php

$curl = curl_init();

curl_setopt_array($curl, [
${optionsBlock}
]);

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
    echo 'cURL Error: ' . $err;
} else {
    echo $response;
}`;
}
