/**
 * Pure text-analysis logic for the Word & Character Counter tool. No React,
 * no DOM — safe to call from anywhere, and reusable by a future SEO content
 * analyzer tool without modification.
 */

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }
  // Whitespace-delimited tokens, not a linguistic analysis — see the FAQ's
  // note on CJK text, where this method undercounts.
  return trimmed.split(/\s+/).length;
}

export function countCharacters(text: string, includeSpaces: boolean): number {
  if (includeSpaces) {
    return text.length;
  }
  return text.replace(/\s/g, '').length;
}

const SENTENCE_ABBREVIATIONS = new Set([
  'mr',
  'mrs',
  'ms',
  'dr',
  'prof',
  'sr',
  'jr',
  'st',
  'vs',
  'etc',
  'inc',
  'ltd',
  'co',
  'jan',
  'feb',
  'mar',
  'apr',
  'jun',
  'jul',
  'aug',
  'sep',
  'sept',
  'oct',
  'nov',
  'dec',
]);

/**
 * Counts sentences by splitting on runs of ./!/? — but skips a split right
 * after a common abbreviation (["Mr.", "Dr.", "U.S.", etc.) doesn't end a
 * sentence. This is a heuristic, not a full parser: it handles the common
 * cases the FAQ promises (abbreviations) without trying to be a complete
 * sentence boundary detector.
 */
export function countSentences(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }

  const terminatorPattern = /[.!?]+/g;
  let count = 0;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = terminatorPattern.exec(trimmed)) !== null) {
    const precedingText = trimmed.slice(lastIndex, match.index);
    const lastWordMatch = /(\S+)\s*$/.exec(precedingText);
    const lastWord = lastWordMatch ? lastWordMatch[1]!.replace(/[.!?]+$/, '').toLowerCase() : '';

    if (!SENTENCE_ABBREVIATIONS.has(lastWord)) {
      count += 1;
      lastIndex = match.index + match[0].length;
    }
    // Otherwise: this terminator followed an abbreviation, so don't count it
    // or advance lastIndex — the next real terminator absorbs this text into
    // one sentence.
  }

  // Trailing text with no terminal punctuation is still one more sentence.
  if (trimmed.slice(lastIndex).trim().length > 0) {
    count += 1;
  }

  return count;
}

export function countParagraphs(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }
  return trimmed.split(/\n\s*\n+/).filter((paragraph) => paragraph.trim().length > 0).length;
}

/** Estimated reading time in minutes, assuming `wpm` words per minute (default: 200, a common silent-reading baseline). */
export function estimateReadingTime(wordCount: number, wpm = 200): number {
  if (wpm <= 0) {
    return 0;
  }
  return wordCount / wpm;
}

/** Estimated speaking time in minutes, assuming `wpm` words per minute (default: 130, a comfortable spoken pace). */
export function estimateSpeakingTime(wordCount: number, wpm = 130): number {
  if (wpm <= 0) {
    return 0;
  }
  return wordCount / wpm;
}

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'been',
  'being',
  'but',
  'by',
  'can',
  'could',
  'did',
  'do',
  'does',
  'doing',
  'down',
  'for',
  'from',
  'had',
  'has',
  'have',
  'having',
  'he',
  'her',
  'here',
  'hers',
  'herself',
  'him',
  'himself',
  'his',
  'how',
  'i',
  'if',
  'in',
  'into',
  'is',
  'it',
  'its',
  'itself',
  'just',
  'me',
  'more',
  'most',
  'my',
  'myself',
  'no',
  'nor',
  'not',
  'now',
  'of',
  'off',
  'on',
  'once',
  'only',
  'or',
  'other',
  'our',
  'ours',
  'ourselves',
  'out',
  'over',
  'own',
  'same',
  'she',
  'should',
  'so',
  'some',
  'such',
  'than',
  'that',
  'the',
  'their',
  'theirs',
  'them',
  'themselves',
  'then',
  'there',
  'these',
  'they',
  'this',
  'those',
  'through',
  'to',
  'too',
  'under',
  'until',
  'up',
  'very',
  'was',
  'we',
  'were',
  'what',
  'when',
  'where',
  'which',
  'while',
  'who',
  'whom',
  'why',
  'will',
  'with',
  'would',
  'you',
  'your',
  'yours',
  'yourself',
  'yourselves',
]);

export interface KeywordDensityEntry {
  word: string;
  count: number;
  percentage: number;
}

/**
 * Top `topN` most frequent content words (stop words excluded), each with
 * its raw count and percentage share of all counted (non-stop-word) tokens
 * — not a percentage of the full word count, which would make every result
 * look artificially small.
 */
export function getKeywordDensity(text: string, topN = 10): KeywordDensityEntry[] {
  const tokens = text.toLowerCase().match(/[a-z0-9']+/g);
  if (!tokens) {
    return [];
  }

  const filtered = tokens.filter((token) => token.length > 1 && !STOP_WORDS.has(token));
  const totalCount = filtered.length;
  if (totalCount === 0) {
    return [];
  }

  const counts = new Map<string, number>();
  for (const word of filtered) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({
      word,
      count,
      percentage: (count / totalCount) * 100,
    }));
}
