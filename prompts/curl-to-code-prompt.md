# Claude Code Prompt — Build Tool #27: cURL to Code Snippet Converter

Run after tool-shell and tools #1-26 exist. Genuinely useful, moderately
fiddly parsing task — curl command syntax has more edge cases than it first
appears.

---

```
Build the cURL to Code Converter for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/curl-to-code/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side. Parsing curl command syntax correctly (quoted
  arguments, escaped quotes, multi-line commands with trailing backslashes,
  various flag formats like -H vs --header) is genuinely fiddly — check
  if a well-maintained library exists for this specific curl-command-
  parsing task (search for something like `curl-parser` or similar on npm)
  before hand-rolling it; if nothing suitable and well-maintained exists,
  implement a focused parser covering the common flags listed in Step 3
  rather than attempting full POSIX shell-argument-parsing generality.
- Design tokens as established; input/output panes in font-mono.

STEP 1 — Register:
  { slug: 'curl-to-code', title: 'cURL to Code Converter',
    shortDescription: 'Convert cURL commands to JavaScript, Python, and more, instantly.',
    category: 'developer', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['json-formatter', 'regex-tester', 'base64-tool']. FAQ (3-4 Q&A): what this
tool converts (a curl command copied from browser devtools' "Copy as cURL"
feature, or written by hand, into equivalent code in another language/
library), which curl flags/features are supported (be honest and specific —
list exactly what's covered per Step 3, don't imply full curl compatibility
since curl has hundreds of flags this tool won't attempt to support), a
note that authentication headers/cookies copied via browser devtools often
contain live session tokens — remind users this tool processes everything
locally and nothing is sent anywhere, which matters more here than in most
tools since curl commands from devtools frequently contain real auth
tokens, and the privacy note generally.

STEP 3 — CurlToCode.tsx:
- Input: textarea for the curl command (font-mono), handles multi-line
  commands with trailing `\` line continuations (a very common real format
  when copying multi-header curl commands from documentation or devtools).
- Supported curl flags/features (parse and translate these specifically):
  - URL (the bare argument or after --url)
  - -X / --request (HTTP method, default GET if body/method not specified,
    default POST if -d/--data is present without explicit -X)
  - -H / --header (repeatable, each becomes a header entry)
  - -d / --data / --data-raw / --data-binary (request body — if it looks
    like JSON, format it nicely in the generated code rather than leaving
    it as an unparsed string)
  - -u / --user (basic auth — translate into the target language's
    appropriate basic-auth mechanism, e.g. an Authorization header or the
    library's native basic-auth option, whichever is more idiomatic per
    target language)
  - --compressed (can generally be a no-op/ignored in generated code, most
    HTTP clients handle compression automatically — don't over-represent
    this flag's importance in the output)
  - -b / --cookie (translate into a Cookie header)
  Explicitly state in the UI (small note, not just the FAQ) which flags are
  NOT supported if the parser encounters something it doesn't recognize —
  show a warning listing the specific unrecognized flag(s) rather than
  silently ignoring them or producing incomplete/wrong output without
  indication.
- Target language/library tabs, each generating idiomatic code for that
  target from the parsed curl command:
  - JavaScript (fetch)
  - Node.js (axios) 
  - Python (requests)
  - Python (httpx or urllib, pick one — requests is far more common,
    prioritize it, second option is a nice-to-have not a requirement)
  - PHP (cURL functions, since this is directly relevant given xBit is a
    PHP/CakePHP codebase — genuinely useful for your own workflow)
- Generated code output (font-mono, per active tab), reasonably idiomatic
  for each target (proper JSON.stringify/dict literal formatting for
  bodies, not just raw string concatenation).
- CopyButton per generated snippet.
- Sample curl command button (a realistic example with a header, JSON body,
  and POST method, since a bare GET request doesn't demonstrate the tool's
  value).

STEP 4 — Logic separation: apps/web/app/tools/curl-to-code/utils/:
- parseCurl.ts — parseCurlCommand(command: string): { parsed:
  ParsedCurlRequest; unsupportedFlags: string[] }, handling the flag set
  above, shell-style quote/escape handling (single quotes, double quotes,
  escaped characters within quotes), and line-continuation joining.
- generators/ — one file per target language (generateFetchJs.ts,
  generateAxios.ts, generatePythonRequests.ts, generatePhpCurl.ts), each a
  pure function taking ParsedCurlRequest and returning a code string.
  Keeping generators separate per language makes adding a new target
  later (e.g. Go, Ruby) straightforward without touching the parser.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm the parser correctly handles a multi-line curl command with
   trailing backslash line continuations AND multiple -H headers with
   embedded quotes (e.g. -H 'Content-Type: application/json') — test with
   a realistic multi-line example copied in the style browser devtools
   actually produces, not a hand-simplified single-line version.
2. Confirm the "unsupported flag" warning actually surfaces for a curl
   command containing at least one flag outside the supported set (e.g.
   --insecure or -L/--location) rather than silently dropping it.
3. Confirm the PHP cURL output is genuinely idiomatic (proper
   curl_setopt_array usage, not just string-concatenated shell-command-
   style PHP) since this is the one target language directly relevant to
   your own xBit codebase.
```

## Note
The parsing is the real risk here, not the code generation — curl commands
copied from browser devtools have a very specific, consistent multi-line
format with backslash continuations and heavily-quoted headers, and that's
the realistic input this tool needs to handle well, more so than
hand-typed simple examples. Worth testing against an actual "Copy as cURL"
output from a browser's Network tab rather than only synthetic test cases.
