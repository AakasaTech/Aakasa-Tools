# Claude Code Prompt — Build Tool #21: JSON to TypeScript Interface Generator

Run after tool-shell and tools #1-20 exist. Reuses JSON Formatter's parsing
utilities directly — check there first.

---

```
Build the JSON to TypeScript Interface Generator for the Aakasa Toolbox
monorepo.

CONTEXT:
- Route: apps/web/app/tools/json-to-typescript/
- Uses <ToolShell> from packages/tool-shell and TOOL_REGISTRY as established.
- Check apps/web/app/tools/json-formatter/utils/jsonFormat.ts first — reuse
  its parsing/validation logic rather than re-implementing JSON.parse error
  handling from scratch.
- 100% client-side, pure TypeScript AST-free string generation — no
  compiler/parser library needed, this is a straightforward recursive
  object-shape-to-interface-string transform.
- Design tokens as established; input/output panes in font-mono.

STEP 1 — Register:
  { slug: 'json-to-typescript', title: 'JSON to TypeScript Generator',
    shortDescription: 'Generate TypeScript interfaces from JSON instantly.',
    category: 'developer', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell wrapper. relatedTools:
['json-formatter', 'csv-json-converter', 'regex-tester'] (drop unregistered
slugs). FAQ (3-4 Q&A, ~150-200 words): how nested objects become nested
interfaces, how arrays are typed (element type inferred from first item;
union type if array elements have mixed shapes — explain this clearly since
it's the trickiest inference case), how null/undefined values are handled
(optional `?` fields vs. explicit `| null`), and the privacy note.

STEP 3 — JsonToTypescript.tsx:
- Input: JSON textarea (font-mono), "Load sample" button.
- Options:
  - Root interface name (text input, default "RootObject")
  - Naming convention for nested interfaces (auto-derived from parent key,
    e.g. `address` key → `Address` interface — PascalCase the key)
  - Use `interface` vs `type` alias (toggle)
  - Optional fields: infer from actual null/undefined presence, or make all
    fields required, or make all fields optional (three-way toggle)
  - Semicolons vs no semicolons (style preference toggle, cosmetic only)
- Output: generated TypeScript, font-mono, syntax-highlighted if a
  lightweight highlighter is already in use elsewhere in the codebase
  (check first; don't add a new syntax-highlighting dependency just for
  this one tool if nothing comparable exists yet).
- Type inference rules, implement carefully:
  - string/number/boolean → direct primitive type
  - null → `null` type (or folded into `?` optional handling per the option
    above)
  - array of primitives → `T[]`
  - array of objects with CONSISTENT shape across all items → typed
    interface array
  - array of objects with INCONSISTENT shape → union type array, or fall
    back to a documented `Record<string, unknown>`-style generic shape with
    a code comment noting the inconsistency, rather than silently picking
    one item's shape and hiding the mismatch
  - empty array → `unknown[]` with a comment noting the type couldn't be
    inferred from empty data
  - nested object → separate named interface, hoisted above/after the
    interface that references it (not inlined), for readability
- CopyButton and "Download as .ts file" on output.
- Handle deeply nested/large JSON without excessive interface duplication —
  if the exact same object shape appears in multiple places, reuse one
  generated interface rather than generating a differently-named duplicate
  for each occurrence (a simple structural-equality check on the generated
  shape before creating a new interface name is sufficient, don't
  over-engineer this).

STEP 4 — Logic separation: apps/web/app/tools/json-to-typescript/utils/
generateTypes.ts — generateTypescript(json: unknown, options: TypeGenOptions):
string, pure and typed (no `any` — ironic to violate the no-`any` rule in
the tool that generates types). Cover the inference rules above as
individually testable helper functions.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm how mixed-shape object arrays are actually handled — show the
   output for a test array with 2-3 objects that share some fields but not
   all.
2. Confirm duplicate object shapes across different keys correctly reuse one
   generated interface rather than producing redundant near-identical ones.
```

## Note
The mixed-shape-array case is the one genuine design decision here — test it
explicitly rather than assuming the happy path (uniform arrays) is
representative of real-world API response JSON, which is often inconsistent.
