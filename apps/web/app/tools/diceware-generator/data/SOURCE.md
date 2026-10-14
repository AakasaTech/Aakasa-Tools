# Wordlist provenance

This tool bundles the **EFF long wordlist** — the current best-practice diceware wordlist,
published by the Electronic Frontier Foundation specifically for generating secure, memorable
passphrases. It's the successor to the original 1995 Arnold Reinhold "Diceware" list, redesigned
by EFF (with cryptographer Joseph Bonneau) to fix several of the original list's known
weaknesses — no accidental profanity or offensive terms, no words that are hard to spell or
easily confused, and a wider variety of longer, more distinctive words rather than many short,
similar ones.

- **Source**: https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt (via
  https://www.eff.org/dice)
- **Size**: exactly **7,776 words** (6⁵ — the list is meant to be indexed by five sequential
  rolls of a six-sided die, giving each word a unique 5-digit dice-roll number; that number
  prefix is stripped in the bundled data since this tool selects words by unbiased
  `crypto.getRandomValues`-based index, not physical dice, but the word set and order are
  otherwise unchanged from the source file).
- **License**: EFF's site-wide default policy (https://www.eff.org/copyright) states: "Any and
  all original material on the EFF website may be freely distributed at will under the Creative
  Commons Attribution 4.0 International License (CC-BY), unless otherwise noted." The wordlist's
  own page (eff.org/dice) notes no more specific or different license, so it falls under this
  default — **CC BY 4.0 International**, which permits free reuse and redistribution with
  attribution. This tool credits EFF in its FAQ accordingly.

## Entropy

Each word drawn independently and uniformly from a 7,776-word list contributes
`log2(7776) ≈ 12.925` bits of entropy. A passphrase of *n* words therefore has
`n × 12.925` bits of entropy before any optional number/symbol addition.
