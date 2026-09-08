/**
 * Estimates the number of syllables in a single English word using the
 * standard vowel-group heuristic — there is no algorithmic approach that
 * gets every English word exactly right (English spelling doesn't map
 * cleanly to pronunciation), so every readability tool using syllable
 * counts is working from an approximation, this one included. The rules,
 * in order:
 *
 * 1. Strip anything that isn't a letter, lowercase the rest.
 * 2. Strip a trailing "es", "ed", or a silent "e" (only when preceded by
 *    a consonant other than l/y — so "able" keeps its final "e" sound-ish
 *    grouping via the "le" pattern, but "make" loses its silent e). This
 *    is a blunt rule: it can't distinguish a PRONOUNCED "-ed" (as in
 *    "created", 3 syllables) from a silent one (as in "walked", 1
 *    syllable) — both get the same treatment, which is a known source of
 *    undercounting for the pronounced case.
 * 3. Strip a leading "y" (a leading y acts as a consonant, not a vowel,
 *    per this heuristic).
 * 4. Count remaining runs of consecutive vowels (a, e, i, o, u, y) as ONE
 *    syllable each — this is the core simplifying assumption, and it's
 *    also where the heuristic most often undercounts: adjacent vowels
 *    that are actually pronounced as SEPARATE syllables (a "hiatus", as
 *    in "idea" or "poem") get counted as a single group here, same as a
 *    true diphthong like the "ea" in "bread" would be.
 * 5. A word with no vowel groups left (e.g. "the" after step 2 strips
 *    its "e") still counts as 1 syllable, never 0.
 *
 * Known weak spots, stated plainly rather than hidden: words with a
 * pronounced "-ed" ending ("created"), syllabic consonants with no
 * written vowel for their sound ("rhythm"), and vowel hiatus ("poem",
 * "idea") are all cases where this heuristic tends to undercount by one.
 * These are hard for ANY heuristic of this general shape, not specific
 * bugs to chase — a fully correct syllable counter would need a
 * pronunciation dictionary, which is out of scope here.
 */
export function countSyllablesInWord(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleaned.length === 0) return 0;

  let working = cleaned.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  working = working.replace(/^y/, '');

  const vowelGroups = working.match(/[aeiouy]+/g);
  return vowelGroups ? vowelGroups.length : 1;
}

/** Total syllables across all words in `text` (whitespace-delimited
 * tokens, punctuation stripped per word before counting). */
export function countSyllablesInText(text: string): number {
  const words = text.trim().match(/[a-zA-Z']+/g);
  if (!words) return 0;
  return words.reduce((total, word) => total + countSyllablesInWord(word), 0);
}
