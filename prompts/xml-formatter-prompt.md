# Claude Code Prompt — Build Tool #22: XML Formatter & Validator

Run after tool-shell and tools #1-21 exist. Structurally similar to JSON
Formatter — reuse that tool's UI patterns (tree view, error display) where
sensible, adapted for XML.

---

```
Build the XML Formatter & Validator for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/xml-formatter/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side. Use the native DOMParser (parses XML natively in every
  browser, including well-formedness error reporting via parsererror
  elements) for validation, and a straightforward recursive
  serializer/indenter for pretty-printing — no XML library needed for this
  scope (don't reach for a heavier XML toolkit; DOMParser + XMLSerializer
  covers formatting, validation, and minification without dependencies).
- Design tokens as established; input/output panes in font-mono.

STEP 1 — Register:
  { slug: 'xml-formatter', title: 'XML Formatter & Validator',
    shortDescription: 'Format, validate, and minify XML instantly.',
    category: 'developer', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['json-formatter', 'html-entity-tool', 'regex-tester']. FAQ (3-4 Q&A):
what well-formed XML means (every tag closed/nested correctly — distinct
from "valid" against a schema, which this tool does NOT check, be explicit
that this is a well-formedness checker not a schema/DTD validator), common
XML syntax errors this catches (unclosed tags, mismatched tags, invalid
characters), how the formatter handles whitespace/indentation, and the
privacy note.

STEP 3 — XmlFormatter.tsx:
- Two-pane layout: raw input (textarea, font-mono) and formatted output.
- Real-time validation as the user types (debounced ~300ms) — parse via
  DOMParser, check for a parsererror node in the result (this is how
  DOMParser signals XML syntax errors — it does NOT throw a JS exception,
  it silently returns a document containing a parsererror element instead,
  which is a genuinely easy thing to miss if you assume try/catch alone
  will catch invalid XML). Extract and display the error message DOMParser
  embeds in that parsererror node, which usually includes line/column info.
- Format button (pretty-print with configurable indent: 2/4/tab spaces).
- Minify button (strip whitespace between tags).
- Tree view toggle: render the parsed XML as a collapsible element tree
  (tag name, attributes, text content), similar treatment to JSON
  Formatter's tree view if that component is reusable in adapted form —
  check apps/web/app/tools/json-formatter/ first, but note XML's structure
  (attributes, mixed content, namespaces) doesn't map 1:1 to JSON's tree
  shape, so this will likely need its own implementation even if the
  visual/interaction pattern is borrowed.
- CopyButton and Download (.xml) on output.
- Character/byte size counter for input and output.
- Sample XML button.
- XML declaration handling: preserve or normalize the `<?xml version="1.0"
  encoding="UTF-8"?>` declaration if present in the input, don't silently
  drop it during formatting.

STEP 4 — Logic separation: apps/web/app/tools/xml-formatter/utils/
xmlFormat.ts — parseXml(xml: string): { doc: Document | null; error?:
{ message: string; line?: number; column?: number } }, formatXml(xml:
string, indentSize: number): string, minifyXml(xml: string): string. Pure
where possible, typed, no `any`.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm error detection works correctly — specifically confirm the
   parsererror-node-checking approach was used (not a bare try/catch around
   DOMParser, which won't catch XML syntax errors since DOMParser doesn't
   throw for them) by testing with a deliberately malformed XML string
   (e.g. an unclosed tag) and confirming a clear error message appears.
2. Confirm the XML declaration is preserved through format/minify
   round-trips rather than being silently stripped.
```

## Note
The parsererror-node quirk is the one real trap: DOMParser famously does
NOT throw a JavaScript exception on malformed XML — it returns a valid
Document object that just happens to contain a `<parsererror>` element
instead of your actual content. A naive try/catch implementation will
silently pass through malformed XML as if it succeeded. This needs to be
explicitly checked for, not assumed to work like JSON.parse's exception-
based error model.
