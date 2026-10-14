# License text provenance

The license text bundled in this directory is the **verbatim official text** of each
license, sourced primarily from
[github/choosealicense.com](https://github.com/github/choosealicense.com) — GitHub's own
open-source project (MIT licensed) that maintains a canonical, plaintext copy of each
license specifically for this kind of reuse, including the officially-specified
placeholder tokens (`[year]`, `[fullname]`, etc.) for the licenses that use them.

- **Source repository**: https://github.com/github/choosealicense.com (`_licenses/*.txt`)
- **Snapshot date**: 2026-09-09
- **Cross-verification**: MIT and Apache-2.0 were independently diffed (whitespace-normalized)
  against the [SPDX license list data](https://github.com/spdx/license-list-data)
  (`text/MIT.txt`, `text/Apache-2.0.txt`) — the Linux Foundation-maintained canonical plaintext
  reference used across the industry for license identification — and matched **exactly**,
  aside from placeholder-token spelling (`[year]` vs `<year>`) and incidental line-wrap width.

## Placeholder handling

Only the officially-specified substitution points are ever replaced, standardized to
`{{YEAR}}` / `{{FULLNAME}}` in the bundled source:

| License      | Placeholders in the LICENSE file text? | Token(s) used            |
| ------------ | --------------------------------------- | ------------------------- |
| MIT          | Yes                                     | `{{YEAR}}`, `{{FULLNAME}}` |
| ISC          | Yes                                     | `{{YEAR}}`, `{{FULLNAME}}` |
| BSD 2-Clause | Yes                                     | `{{YEAR}}`, `{{FULLNAME}}` |
| BSD 3-Clause | Yes                                     | `{{YEAR}}`, `{{FULLNAME}}` |
| Apache 2.0   | **No**                                  | none                       |
| GPL v3       | **No**                                  | none                       |
| MPL 2.0      | **No**                                  | none                       |
| Unlicense    | **No** (public domain dedication)       | none                       |

Apache 2.0 and GPL v3's operative legal text (everything through "END OF TERMS AND
CONDITIONS") has no name/year substitution at all. Both licenses' *official* distributed
text also includes a trailing boilerplate section — Apache's "APPENDIX: How to apply the
Apache License to your work" and GPL's "How to Apply These Terms to Your New Programs" —
that does contain example placeholder tokens (`[yyyy] [name of copyright owner]` and
`<year> <name of author>` respectively). Those sections are **intentionally excluded**
from the bundled text: they're boilerplate meant to be copied into individual *source
file headers*, not into the LICENSE file itself, and leaving an unfilled bracket token in
the generated LICENSE output would look like a bug rather than the separate convention it
actually is. This tool's UI states this explicitly rather than pretending it doesn't apply.

MPL 2.0's trailing "Exhibit A" / "Exhibit B" notices contain no placeholder tokens, so
they're kept as part of the bundled text (as mozilla.org itself distributes them).

To refresh this snapshot later, re-fetch `_licenses/<slug>.txt` from the same repository
and re-run the same trim/placeholder-standardization steps.
