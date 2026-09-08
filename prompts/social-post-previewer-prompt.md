# Claude Code Prompt — Build Tool #59: Social Media Post Previewer

Run after tool-shell and tools #1-58 exist. Similar spirit to Meta Tag
Previewer but for direct post text rather than link-share cards — pure
client-side, no server dependency this time.

---

```
Build the Social Media Post Previewer for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/social-post-previewer/
- Uses <ToolShell> and TOOL_REGISTRY as established.
- 100% client-side. Character counting per platform is pure string math,
  though be aware that some platforms (notably Twitter/X historically)
  have counted certain characters (e.g. URLs, CJK characters) differently
  from a simple .length count — implement each platform's actual counting
  rule as accurately as reasonably documented (see Step 3 for specifics),
  and clearly note in the UI when a rule is a simplification/approximation
  rather than pretending perfect precision for platforms with genuinely
  complex or officially-undocumented counting behavior.
- Design tokens as established. Preview cards should visually approximate
  each platform's actual post layout (similar spirit and the same
  copyright caution as Meta Tag Previewer's social preview cards —
  approximate proportions/layout, don't attempt pixel-perfect proprietary
  UI reproduction).

STEP 1 — Register:
  { slug: 'social-post-previewer', title: 'Social Media Post Previewer',
    shortDescription: 'Preview and check character limits for posts across social platforms.',
    category: 'seo-marketing', tier: 'free' }

STEP 2 — page.tsx: standard metadata + ToolShell. relatedTools:
['word-counter', 'meta-tag-previewer', 'utm-link-builder']. FAQ (3-4 Q&A):
which platforms and limits are covered (list them per Step 3), a note that
platform character-counting rules and limits can change over time and this
tool reflects rules current as of when it was built — recommend the user
verify against the platform's current official guidance for anything
business-critical (an honest, appropriate hedge given these are third-
party platform rules outside this toolbox's control), the specific note
about URL-shortening behavior on platforms that auto-shorten links within
a post (worth a clear explanation since it affects character counting in a
non-obvious way), and the privacy note.

STEP 3 — SocialPostPreviewer.tsx:
- Single text input (textarea) — the post content, shared across all
  platform previews so the user writes once and sees how it fares
  everywhere at once.
- Platform tabs/cards, each showing:
  - Twitter/X: 280 character limit (standard); note that URLs are counted
    as a fixed length (currently 23 characters) regardless of actual URL
    length, per Twitter/X's t.co link-wrapping behavior — implement this
    specific counting rule (detect URLs in the text via a simple regex and
    count each as the fixed length rather than their literal character
    count) since it's a genuinely common source of confusion ("why does my
    post say it's over the limit when I counted it myself").
  - LinkedIn: character limit for posts (verify current limit via
    documentation/known public figures at build time rather than assuming
    a possibly-outdated number — LinkedIn's limits have changed over time
    and vary by post type; state clearly if a specific used figure might be
    approximate).
  - Facebook: character limit for posts (similarly verify current figures).
  - Instagram: caption character limit (2,200 is the long-standing
    documented limit — verify current) plus a note on hashtag count limits
    (30 hashtags max, a separate and commonly-relevant constraint for this
    platform).
  - Threads: character limit (a newer platform, verify current documented
    limit).
  Each platform card shows: live character count, remaining characters
  (or over-limit amount, clearly flagged if exceeded), and a simple visual
  preview approximating how the post would look in that platform's feed
  (avatar placeholder, generic username placeholder, the actual post text,
  basic engagement icon placeholders — kept generic/schematic, not
  attempting exact proprietary UI replication).
- Overall summary: a quick at-a-glance view showing which platforms the
  current text fits within and which it exceeds, useful when writing one
  post intended for cross-posting to several platforms at once.
- Hashtag and mention counter (separate from the main character count) —
  useful supplementary info for platforms with specific hashtag
  conventions/limits.
- CopyButton on the post text (for copying into the actual platform once
  finalized).

STEP 4 — Logic separation: apps/web/app/tools/social-post-previewer/
utils/:
- platformLimits.ts — a typed registry of { platform: string; charLimit:
  number; urlCountingRule?: 'literal' | 'fixed-length'; fixedUrlLength?:
  number; hashtagLimit?: number } per platform, keeping the specific rules
  data-driven and easy to update if a platform changes its limits later.
- countCharacters.ts — countPlatformCharacters(text: string, platform:
  PlatformConfig): number, implementing the URL-detection-and-fixed-
  counting logic for platforms that need it (primarily Twitter/X),
  falling back to a straightforward length count for platforms without
  special rules. Pure, typed, no `any`.

STEP 5 — Verify: registry entry resolves.

After building, tell me:
1. Confirm the Twitter/X URL fixed-length counting rule works correctly —
   test with a post containing one very long URL (e.g. 80+ characters) and
   confirm the character count reflects the fixed t.co length (23) for
   that URL rather than its literal length.
2. State which character limits were used for each platform and note
   explicitly whether each was verified against current documentation
   at build time or is a best-known figure that may need periodic
   re-verification (platform limits do change — flag this as a
   maintenance consideration for the site owner, not something this build
   can guarantee stays accurate indefinitely).
```

## Note
**Twitter/X's URL-shortening character-counting rule is the one genuinely
non-obvious piece of logic here** — without it, this tool would give
Twitter/X users a wrong (usually falsely over-limit) character count for
any post containing a link, which directly undermines the tool's purpose.
Also worth flagging honestly: platform character limits are external,
third-party facts that can and do change — this tool's data-driven registry
approach (Step 4) is specifically designed to make future limit updates a
quick data edit rather than a code change, which is worth mentioning to
whoever maintains this tool going forward.
