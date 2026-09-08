# Claude Code Prompt — Build Tool #23: YAML ↔ JSON Converter

Run after tool-shell and tools #1-22 exist. Directly relevant to your own
EKS/Kubernetes work — YAML manifests are exactly the kind of content this
tool's audience will paste in.

---

```
Build the YAML ↔ JSON Converter for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/yaml-json-converter/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side. Use the `js-yaml` npm package (the standard, well-tested
  YAML parser/serializer for JS — install with `npm install js-yaml
  @types/js-yaml`). Do not hand-roll YAML parsing — YAML's spec is
  genuinely complex (multi-document files, anchors/aliases, flow vs. block
  style, implicit typing of scalars) and js-yaml handles it correctly.
- Design tokens as established; input/output panes in font-mono.

STEP 1 — Register:
  { slug: 'yaml-json-converter', title: 'YAML to JSON Converter',
    shortDescription: 'Convert between YAML and JSON formats instantly, both directions.',
    category: 'developer', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['json-formatter', 'csv-json-converter', 'xml-formatter']. FAQ (3-4 Q&A):
what YAML is commonly used for (config files, Docker Compose, Kubernetes
manifests, CI pipelines — genuinely relevant to your own audience), a note
on YAML's stricter whitespace/indentation sensitivity compared to JSON and
that this is the most common source of "invalid YAML" errors, what happens
with YAML-specific features that have no JSON equivalent (anchors/aliases
get resolved/expanded into their final values when converting to JSON,
since JSON has no equivalent concept — state this explicitly, it's a
one-way transformation for that specific feature), and the privacy note.

STEP 3 — YamlJsonConverter.tsx:
- Direction toggle: YAML → JSON / JSON → YAML.
- Two-pane layout, font-mono both, live conversion (debounced ~300ms).
- YAML → JSON: parse via js-yaml's load function. Handle multi-document
  YAML (separated by `---`) — if multiple documents are detected, either
  output a JSON array of documents or let the user pick which document
  index to convert (a document selector dropdown is fine); don't silently
  only convert the first document without indicating there were more.
- JSON → YAML: serialize via js-yaml's dump function. Indent size option
  (2 default, matching common convention). Flow style vs. block style
  toggle for arrays/objects (block is YAML's more common, more readable
  style and should be the default; flow style — the `[a, b, c]` /
  `{a: 1, b: 2}` inline JSON-like syntax — as an option for compactness).
- Clear error handling: js-yaml throws a YAMLException with a message and
  often a mark (line/column) on invalid YAML — surface that specifically
  ("Invalid YAML at line X, column Y: [message]") rather than a generic
  failure. For JSON→YAML, standard JSON.parse error handling as established
  in JSON Formatter's utils.
- CopyButton and Download (.yaml/.yml or .json matching output) on output.
- Sample data button (a realistic small config-file-style sample — e.g. a
  simple Docker Compose-like snippet — resonates better with this tool's
  likely audience than an abstract generic example).

STEP 4 — Logic separation: apps/web/app/tools/yaml-json-converter/utils/
yamlJsonConvert.ts — yamlToJson(yaml: string): { data: unknown; error?:
string }, jsonToYaml(json: string, options: YamlDumpOptions): { data:
string; error?: string }, wrapping js-yaml with this tool's error-handling
conventions. Typed, no `any` beyond what js-yaml's own loosely-typed API
requires at the boundary (narrow immediately after the library call).

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm multi-document YAML (a string containing two `---`-separated
   documents) is handled explicitly — either both are surfaced in the
   output or the user is clearly shown there's more than one document
   available, rather than one being silently dropped.
2. Confirm a YAML anchor/alias example (e.g. `base: &defaults {a: 1}` used
   elsewhere via `<<: *defaults`) converts to JSON with the alias correctly
   expanded/resolved to its actual value, not left as a broken reference.
```

## Note
Multi-document YAML and anchor/alias resolution are the two YAML-specific
features with no direct JSON equivalent — both are worth testing explicitly
since js-yaml handles them correctly by default, but a naive implementation
that only reads the first parsed result (ignoring `loadAll` for multi-doc
support) would silently produce wrong or incomplete output on real-world
Kubernetes/CI YAML files, which very commonly use both features.
