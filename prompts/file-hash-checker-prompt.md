# Claude Code Prompt — Build Tool #55: File Hash Checker

Run after tool-shell and tools #1-54 exist. Distinct from UUID/Hash
Generator (#3) — this tool is specifically about VERIFYING a file against
an expected hash (integrity checking), not generating hashes in general.
Reuse that tool's hashing utilities directly.

---

```
Build the File Hash Checker for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/file-hash-checker/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- IMPORTANT: check apps/web/app/tools/uuid-hash-generator/utils/hash.ts
  first — reuse its computeHash function directly (including its MD5
  fallback and Web Worker offloading for large files) rather than
  reimplementing file hashing here. This tool is a different UI/use-case
  wrapper around the same underlying hashing capability, not a reason to
  duplicate it.
- 100% client-side.
- Design tokens as established.

STEP 1 — Register:
  { slug: 'file-hash-checker', title: 'File Hash Checker',
    shortDescription: 'Verify a file\'s integrity by checking its hash against an expected value.',
    category: 'data-files', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['uuid-hash-generator', 'base64-tool', 'csv-viewer']. FAQ (3-4 Q&A): what a
file hash checksum verifies (that a downloaded/received file is byte-for-
byte identical to the original — commonly used to confirm a large download
wasn't corrupted, or that a file hasn't been tampered with, since even a
single changed byte produces a completely different hash), which
algorithms are commonly published alongside downloads (SHA-256 is the most
common modern standard; MD5/SHA-1 are older and considered
cryptographically weak for security purposes but still commonly used for
basic integrity/corruption checking, not tamper-resistance against a
determined attacker — state this distinction honestly), how to actually
use this tool (compute the hash of your downloaded file, compare it
against the hash published by the file's source, e.g. on a software
project's release page), and the privacy note (genuinely meaningful here
since files being checked are processed entirely locally, which matters if
verifying something sensitive).

STEP 3 — FileHashChecker.tsx:
- FileDropzone accepting any file type (this tool is format-agnostic — it
  hashes raw bytes, doesn't care what kind of file it is).
- Algorithm selector: MD5, SHA-1, SHA-256, SHA-512 (matching
  uuid-hash-generator's supported set).
- Computed hash display (font-mono) once a file is dropped and hashed —
  show progress for large files (reuse the Web Worker threshold/behavior
  established in uuid-hash-generator).
- "Expected hash" input field: the user pastes the hash value they're
  checking against (e.g. copied from a download page).
- Live comparison: as soon as both the computed hash and expected-hash
  input are present, show a clear MATCH / NO MATCH result — visually
  prominent (success-tinted for match, danger-tinted for mismatch, this is
  a case where that color-coding is functionally meaningful, not just
  decorative). Comparison should be case-insensitive (hex hashes are
  commonly published in either case) and should trim whitespace from the
  pasted expected-hash input (a common paste artifact).
- If expected hash length doesn't match the selected algorithm's expected
  output length (e.g. pasting a 32-character MD5 hash while SHA-256 is
  selected), show a helpful hint suggesting the algorithm might be
  mismatched rather than just showing a generic "no match" — this is a
  common, easily-corrected user error worth specifically detecting and
  guiding on rather than leaving the user confused about why a hash
  "doesn't match" when the real issue is a wrong algorithm selection.
- Multi-file support: allow checking several files against several
  expected hashes in one session (a simple list, each row: file, computed
  hash, expected hash input, match status) — useful for verifying a batch
  of downloaded files at once.
- CopyButton on each computed hash.

STEP 4 — Logic separation: apps/web/app/tools/file-hash-checker/utils/
compareHash.ts — normalizeHashForComparison(hash: string): string (lowercase,
trim, strip any "0x" or similar prefix if present) and
detectLikelyAlgorithmMismatch(expectedHash: string, selectedAlgorithm:
string): string | null (returns a suggested algorithm name if the expected
hash's length matches a DIFFERENT algorithm's output length than the one
currently selected, null otherwise). Import computeHash from
uuid-hash-generator's existing utils rather than reimplementing it — this
is the central instruction for this build, don't skip it.

STEP 5 — Verify: registry entry resolves, and confirm this tool's hashing
logic is imported from uuid-hash-generator rather than duplicated.

After building, tell me:
1. Confirm explicitly that computeHash was imported from
   uuid-hash-generator's utils rather than reimplemented — state the exact
   import path used.
2. Confirm the algorithm-mismatch detection works — test by selecting
   SHA-256 but pasting a 32-character (MD5-length) expected hash, and
   confirm the tool suggests MD5 might be the correct algorithm rather than
   just showing an unhelpful "no match."
3. Confirm the match comparison is case-insensitive and whitespace-tolerant
   — test with an expected hash pasted in uppercase with leading/trailing
   spaces and confirm it still correctly matches an otherwise-identical
   computed hash.
```

## Note
**This tool should be almost entirely composition, not new hashing logic**
— it exists to close a UX gap (verification workflow) that UUID/Hash
Generator wasn't designed around, not because the underlying capability is
missing. If this build ends up reimplementing hash computation instead of
importing it, that's the same kind of missed-reuse signal flagged in
earlier tools (QR code duplication, color-utils extraction) and should be
caught before shipping.
