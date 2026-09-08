# Claude Code Prompt — Build Tool #56: File Type Detector

Run after tool-shell and tools #1-55 exist. Genuinely useful, low-risk
build — reads file signatures ("magic bytes") rather than trusting
filenames/extensions, which is the whole point of the tool.

---

```
Build the File Type Detector for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/file-type-detector/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side. Use the `file-type` npm package (a well-maintained
  library that detects file types by reading binary file signatures/magic
  bytes, NOT by trusting the file extension — install with `npm install
  file-type`; note this package is ESM-only in recent versions, confirm it
  works correctly with this project's bundler setup, or use a compatible
  version/alternative if there's a build issue). Detecting by actual file
  content rather than extension is the entire point of this tool — a file
  named "photo.txt" that's actually a PNG should be correctly identified
  as a PNG, and the tool should make this distinction (claimed extension
  vs. detected actual type) visible and clear.
- Design tokens as established.

STEP 1 — Register:
  { slug: 'file-type-detector', title: 'File Type Detector',
    shortDescription: 'Detect a file\'s true type by its content, not just its extension.',
    category: 'data-files', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['file-hash-checker', 'base64-tool', 'format-converter']. FAQ (3-4 Q&A):
what a "magic byte"/file signature is and why detecting by content is more
reliable than trusting a file's extension (extensions can be wrong,
missing, or deliberately misleading — a file's actual binary header
reveals its true format regardless of what it's named), common use cases
(verifying a downloaded file is actually what it claims to be, identifying
an extensionless file, checking a file before uploading it somewhere with
format restrictions), an honest note on limitations (not every file format
has a detectable binary signature — plain text files, for instance, often
can't be distinguished from each other by content alone, e.g. a .csv and a
.txt file may be byte-for-byte ambiguous — state this rather than
implying universal detection), and the privacy note.

STEP 3 — FileTypeDetector.tsx:
- FileDropzone accepting any file (or multiple files for batch detection).
- Per-file result display:
  - Detected MIME type and file extension (from the file-type library's
    analysis of actual content)
  - Claimed extension (from the uploaded file's actual filename) — shown
    alongside the detected type for direct comparison.
  - Match/mismatch indicator: if the claimed extension and detected type
    agree, a neutral "confirmed" state; if they DISAGREE, a clearly
    flagged warning (e.g. "This file is named .txt but is actually a PNG
    image") — this mismatch-detection is the tool's actual differentiating
    value, make it prominent, not an afterthought.
  - File size.
  - If detection returns no result (common for plain text and some other
    formats with no distinct binary signature, per the FAQ limitation),
    show a clear "Could not determine file type by content — this is
    common for plain text and some other formats" message rather than a
    confusing blank/error state.
- Raw magic bytes display (collapsible, for technically curious users): show
  the first several bytes of the file in hex, since this is the actual
  evidence behind the detection and genuinely interesting/useful for anyone
  debugging a file format issue.
- Batch mode: process multiple files, show results in a list/table, with
  mismatches visually highlighted so they stand out at a glance across a
  larger batch.
- CopyButton on the detected type/MIME string.

STEP 4 — Logic separation: apps/web/app/tools/file-type-detector/utils/
detectFileType.ts — a thin typed wrapper: detectType(file: File): Promise<{
  detectedMime: string | null; detectedExtension: string | null;
  claimedExtension: string; matches: boolean | null; // null when detection
  returned no result, so match status is genuinely unknown, not false
  rawBytesHex: string; // first N bytes for the hex display
}>. Typed, no `any`.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm the mismatch-detection actually works correctly — test by
   renaming a real image file (e.g. a PNG) to have a .txt extension,
   uploading it, and confirming the tool correctly flags the mismatch
   (detected: PNG, claimed: .txt) rather than trusting the filename.
2. Confirm the "no result" case (e.g. uploading a plain .txt file with no
   detectable binary signature) shows the clear limitation message
   described in Step 3, rather than a broken/confusing empty state or a
   false-negative "mismatch" flag (since a null detection result is
   different from a genuine mismatch, and the UI needs to distinguish
   these two states clearly).
3. Confirm the file-type package's ESM-only nature (if applicable to the
   installed version) didn't cause any build/bundling issues — state
   whether this was encountered and how it was resolved if so.
```

## Note
**Distinguishing "no result" from "mismatch" is the one UX detail worth
getting right** — a plain text file that can't be identified by content
alone is a fundamentally different, expected outcome from a file whose
content actively contradicts its extension, and conflating these two into
a single generic "no match" state would undermine the tool's credibility
(a false mismatch flag on an ordinary .txt file would look like a bug, not
a feature).
