# Claude Code Prompt — Build Tool #66: Text Reverser & Palindrome Checker

Run after tool-shell and tools #1-65 exist. Trivial-looking tool with one
genuine correctness trap: naive string reversal breaks on emoji and other
multi-code-unit Unicode characters.

---

```
Build the Text Reverser & Palindrome Checker for the Aakasa Toolbox
monorepo.

CONTEXT:
- Route: apps/web/app/tools/text-reverser/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side, pure string processing. IMPORTANT: a naive string
  reversal via `str.split('').reverse().join('')` operates on UTF-16 CODE
  UNITS, not actual characters — this breaks visibly on emoji and other
  characters outside the Basic Multilingual Plane (which are represented
  as surrogate pairs — two code units for one visual character), producing
  garbled/broken output (mangled or replacement-character emoji) when
  reversed naively. Use `Array.from(str)` (which correctly iterates by
  Unicode code point, not UTF-16 code unit) or the spread operator
  `[...str]` before reversing, not `str.split('')`.
- Design tokens as established. Input/output in font-mono.

STEP 1 — Register:
  { slug: 'text-reverser', title: 'Text Reverser & Palindrome Checker',
    shortDescription: 'Reverse text and check if it\'s a palindrome, instantly.',
    category: 'text-writing', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['word-counter', 'case-converter', 'regex-tester']. FAQ (3-4 Q&A): what a
palindrome is (reads the same forwards and backwards), how the palindrome
check handles spaces/punctuation/case (explain the tool's approach —
typically palindrome-checking ignores spaces, punctuation, and case for a
meaningful check, e.g. "A man, a plan, a canal: Panama" is considered a
palindrome under those relaxed rules even though it's not identical
character-for-character including punctuation — state which approach this
tool takes), and the privacy note.

STEP 3 — TextReverser.tsx:
- Input textarea (font-mono).
- Reversal mode selector:
  - Reverse entire string (character by character, correctly handling
    Unicode per CONTEXT).
  - Reverse word order (keep each word intact, but reverse their sequence
    — e.g. "Hello World" → "World Hello," a genuinely different and
    useful operation from character reversal).
  - Reverse each word's letters individually while keeping word order (a
    third distinct, sometimes-wanted variant — e.g. "Hello World" →
    "olleH dlroW").
- Live-reversed output as the input changes.
- Palindrome check: a separate, clearly labeled section showing whether
  the CURRENT INPUT (not the reversed output) is a palindrome, with a
  toggle for "ignore spaces/punctuation/case" (default ON, per the FAQ's
  relaxed-rule explanation) vs. strict exact-character-match checking.
  Show a clear, prominent PALINDROME / NOT A PALINDROME result.
- CopyButton on the reversed output.

STEP 4 — Logic separation: apps/web/app/tools/text-reverser/utils/
textReverse.ts:
- reverseCharacters(text: string): string — using Array.from/spread per
  CONTEXT, not str.split('').
- reverseWordOrder(text: string): string
- reverseEachWord(text: string): string
- isPalindrome(text: string, strict: boolean): boolean — the relaxed mode
  strips non-alphanumeric characters and lowercases before comparing
  against its own reversal; strict mode compares the raw input directly
  against its Unicode-correct reversal.
All pure, typed, no `any`.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm character reversal correctly handles a string containing emoji
   — test with input like "Hello 👋 World 🌍" and confirm the emoji appear
   correctly (not as broken/replacement characters or split apart) in the
   reversed output, with the whole string's character order genuinely
   reversed.
2. Confirm the relaxed palindrome check correctly identifies a known
   punctuation/space-containing palindrome (e.g. "A man, a plan, a canal:
   Panama") as a palindrome, while strict mode correctly identifies the
   same input as NOT a palindrome (since the raw string with punctuation
   and mixed case isn't literally identical to its own reversal).
```

## Note
**Unicode-correct reversal is the one thing worth explicitly testing** in
this otherwise simple tool — `str.split('').reverse().join('')` is a very
common, very wrong pattern for reversing strings in JavaScript once emoji
or other surrogate-pair characters are involved, and it's easy for this
bug to slip through if testing only used plain ASCII text during
development. The emoji test case in the closing questions is the concrete
way to catch this before it ships.
