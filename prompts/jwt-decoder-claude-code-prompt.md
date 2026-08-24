# Claude Code Prompt — Build Tool #17: JWT Decoder

Run this after tool-shell and tools #1-16 all exist and work. This tool
requires a real security-framing decision up front: it must never be
mistaken for a JWT *validator*, and the copy needs to actively prevent a
dangerous misconception.

---

```
Build the JWT Decoder tool for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/jwt-decoder/
- Framework: Next.js 14 App Router, TypeScript, Tailwind CSS
- packages/tool-shell has <ToolShell> (props: title, description, category,
  tier, relatedTools, faq, children) and TOOL_REGISTRY in
  packages/tool-shell/registry.ts — use it, don't rebuild page chrome.
- packages/ui has Button, CopyButton, and other primitives from tools #1-16
  — check what exists before writing anything new.
- 100% client-side. Decoding a JWT's header/payload requires only Base64URL
  decoding (native atob with URL-safe character substitution, or
  TextDecoder for UTF-8 correctness — reuse the UTF-8-safe base64 decode
  logic from Base64 Encoder/Decoder's utils if it's factored generically
  enough; check apps/web/app/tools/base64-tool/utils/base64.ts first).
  Signature VERIFICATION (HMAC/RSA/etc.) is explicitly OUT OF SCOPE for this
  build — see the critical framing note below.
- Design tokens already configured: colors ink/paper/accent/success/danger,
  fonts font-display/font-body/font-mono. Decoded JSON output uses
  font-mono, ideally reusing JSON Formatter's existing tree/output display
  component if it was factored generically (check
  apps/web/app/tools/json-formatter/ first per the reuse pattern established
  in earlier tools).

CRITICAL FRAMING — READ BEFORE BUILDING:
A JWT has three parts: header, payload, and signature. This tool decodes and
displays the header and payload (both are just Base64URL-encoded JSON, NOT
encrypted — this is a common and important misconception to correct: anyone
can decode a JWT's contents without any secret key, which is exactly why
JWTs should never contain sensitive data in the payload). This tool does
NOT and must not claim to verify the signature, because doing so correctly
would require the user to paste in their signing secret or private key —
and this tool must never ask a user to paste a secret/private key into a
web page, even a client-side one, since encouraging that habit is a real
security anti-pattern regardless of where the key is processed. Signature
presence should be shown (yes/no, and which algorithm the header claims to
use, e.g. "alg: HS256"), but explicitly labeled as UNVERIFIED, with a short,
clear note explaining why this tool doesn't verify signatures and that a
decoded-but-unverified JWT should never be trusted as authentic without
server-side verification against the actual signing key. This framing needs
to be genuinely prominent in the UI (not just the FAQ) — a visible, always-
present label near the signature section, not a dismissible tooltip.

STEP 1 — Register the tool:
Add to packages/tool-shell/registry.ts:
  { slug: 'jwt-decoder', title: 'JWT Decoder',
    shortDescription: 'Decode and inspect JWT tokens — header and payload, instantly.',
    category: 'developer', tier: 'free' }

STEP 2 — page.tsx (server component):
- Metadata: title "JWT Decoder - Free Online Token Inspector | Aakasa
  Toolbox", description under 160 chars, canonical URL, OG tags.
- Renders:
  <ToolShell
    title="JWT Decoder"
    description="Decode and inspect JWT tokens — header and payload, entirely in your browser."
    category="developer"
    tier="free"
    relatedTools={['base64-tool', 'json-formatter', 'timestamp-converter']}
    faq={[...]}
  >
    <JwtDecoder />
  </ToolShell>
  Note: check TOOL_REGISTRY first — 'timestamp-converter' likely doesn't
  exist yet; drop it if not registered.
- Write the faq array: 3-4 Q&A pairs, ~150-200 words, plain factual tone.
  Cover: what a JWT actually is (three Base64URL-encoded parts, NOT
  encrypted — explicitly correct the "JWTs are encrypted/secure to read"
  misconception), why this tool can't and won't verify signatures (explain
  plainly: verification requires the signing secret, and no legitimate tool
  should ask you to paste that into a website), what the common claims in a
  JWT payload mean (exp = expiration timestamp, iat = issued-at, sub =
  subject/user identifier — a brief glossary of the most common registered
  claims), and confirmation nothing pasted here is stored or transmitted
  (this matters more than usual here — JWTs are often live session tokens,
  worth stating explicitly and prominently, not just as one FAQ line among
  several).

STEP 3 — JwtDecoder.tsx (client component, "use client"):
Renders inside ToolShell's card — build only the functional UI:
- Single input field for the JWT string (can be a textarea since JWTs can
  be long, font-mono), with a small note it's fine to paste the whole
  "Bearer xxx" string — auto-strip a leading "Bearer " prefix if present
  rather than making the user clean the input first.
- Three-part visual breakdown as the token is typed/pasted, ideally with
  each of the three dot-separated segments visually color-coded in the raw
  token display (a common, genuinely helpful pattern in JWT tools — e.g.
  header segment underlined/tinted one color, payload another, signature a
  third) so users can see which part of the raw token corresponds to which
  decoded section below.
- Decoded Header panel: pretty-printed JSON (reuse JSON output/tree
  component if available), typically showing alg and typ.
- Decoded Payload panel: pretty-printed JSON, same display treatment. For
  any standard timestamp claims found (exp, iat, nbf), show BOTH the raw
  Unix timestamp number AND a human-readable converted date/time next to it
  (e.g. "exp: 1735689600 → Jan 1, 2025, 12:00:00 AM UTC") — this is a
  genuinely high-value detail since manually converting exp timestamps is a
  common annoyance this tool can solve inline rather than requiring a
  separate timestamp-conversion step.
- Signature section: show the raw signature segment (as opaque Base64URL
  text, not decoded — it's not JSON, it's cryptographic bytes and decoding
  it as text would just show garbage), the claimed algorithm from the
  header, and the prominent "Signature not verified" notice described in
  the CRITICAL FRAMING section above.
- Expiration status badge (if an `exp` claim is present): a clear visual
  indicator — "Expired X ago" or "Valid until X" / "Expires in X" — computed
  by comparing the exp claim against the current time. This is a nice,
  genuinely useful bit of interpretation on top of raw decoding, and doesn't
  cross into signature-verification territory since it's just reading a
  plaintext claim and doing date math, not asserting the token is
  authentic.
- CopyButton on both the decoded header and payload JSON (separately).
- Clear error handling for malformed input: not enough dot-separated
  segments, invalid Base64URL in any segment, or a segment that doesn't
  decode to valid JSON — specific messages per failure type (e.g. "This
  doesn't look like a JWT — expected 3 parts separated by dots, found 1" vs.
  "Header segment isn't valid Base64" vs. "Payload didn't decode to valid
  JSON") rather than one generic "invalid token" message.
- Sample JWT button — loads a well-known, clearly-fake example token (e.g.
  a widely-used jwt.io-style demo token with an obviously placeholder
  subject/name) so first-time users see the tool working immediately without
  needing to paste in a real token from their own application.

STEP 4 — Logic separation:
Extract into apps/web/app/tools/jwt-decoder/utils/decodeJwt.ts as pure,
typed functions (no `any`):
  - decodeJwt(token: string): { header: unknown; payload: unknown;
    signature: string; error?: string } — splits on dots, Base64URL-decodes
    header/payload (UTF-8 safe), parses each as JSON, returns structured
    result or a specific error.
  - formatClaimTimestamp(value: unknown): string | null — converts a Unix
    timestamp claim value to a human-readable string, returns null if the
    value isn't a plausible timestamp number.
  - getExpirationStatus(exp: number | undefined): { status: 'expired' |
    'valid' | 'no-expiry'; label: string } for the expiration badge.

STEP 5 — Verify:
Confirm the tool appears on the toolbox index/listing page automatically via
the registry entry.

After building, tell me:
1. Confirm the "signature not verified" notice is visually prominent in the
   actual rendered UI (describe where it appears and how it's styled) —
   this is a security-communication requirement, not a cosmetic detail, and
   needs to be genuinely hard to miss, not a small gray caption easily
   skipped over.
2. Confirm decodeJwt.ts correctly handles Base64URL's character differences
   from standard Base64 (- and _ instead of + and /, and no padding) rather
   than naively calling atob() directly on a raw JWT segment, which will
   fail or silently corrupt on tokens using the URL-safe characters.
3. Confirm the tool does NOT include any input field, button, or UI element
   suggesting signature verification, secret/key entry, or "is this token
   valid" beyond the plaintext expiration-time check — this is a hard
   boundary for this build, not a soft preference, and worth an explicit
   confirmation it wasn't crossed.
```

---

## Notes

- **This is the first tool where the copy/framing is as important as the
  code** — a JWT decoder that doesn't clearly distinguish "I decoded the
  claims" from "I verified this token is authentic" can genuinely mislead a
  developer into trusting an unverified token, which has real security
  consequences in their own application. This isn't a hypothetical concern;
  it's the single most common misuse of JWT debugging tools.
- **Base64URL vs. standard Base64 is the concrete technical trap** — JWTs
  use the URL-safe variant (`-`/`_` instead of `+`/`/`, no `=` padding), so
  a naive `atob()` call on a raw segment will throw or produce garbage on
  tokens using those substituted characters. This needs explicit handling,
  not an assumption that "it's just Base64, the existing Base64 tool logic
  will just work" — the character substitution step specifically needs to
  be there.
- **The exp-to-human-date conversion is the tool's actual value-add** beyond
  what jwt.io itself already does well — inline expiration status is a
  small, genuinely useful bit of interpretation that doesn't cross into
  verification territory, worth keeping as a real feature rather than
  cutting it for scope.
