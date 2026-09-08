export type SortMode = 'alphabetical' | 'natural' | 'length' | 'random';

export interface SortOptions {
  caseSensitive: boolean;
  reverse: boolean;
}

type Segment = string | number;

/** Splits text into alternating non-digit/digit runs, converting each
 * digit run to an actual number — "item10" becomes ["item", 10]. This is
 * what makes natural sort work: comparing the number 10 to the number 2
 * numerically, rather than comparing the strings "10" and "2"
 * character-by-character (which puts "10" before "2"). */
function splitIntoSegments(text: string): Segment[] {
  const parts = text.match(/\d+|\D+/g) ?? [];
  return parts.map((part) => (/^\d+$/.test(part) ? Number(part) : part));
}

function naturalCompare(a: string, b: string, caseSensitive: boolean): number {
  const aSegments = splitIntoSegments(caseSensitive ? a : a.toLowerCase());
  const bSegments = splitIntoSegments(caseSensitive ? b : b.toLowerCase());
  const length = Math.max(aSegments.length, bSegments.length);

  for (let i = 0; i < length; i += 1) {
    const aSeg = aSegments[i];
    const bSeg = bSegments[i];
    if (aSeg === undefined) return -1;
    if (bSeg === undefined) return 1;

    if (typeof aSeg === 'number' && typeof bSeg === 'number') {
      if (aSeg !== bSeg) return aSeg - bSeg;
    } else {
      const aStr = String(aSeg);
      const bStr = String(bSeg);
      if (aStr !== bStr) return aStr < bStr ? -1 : 1;
    }
  }
  return 0;
}

function shuffle(items: string[]): string[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/**
 * Sorts `lines` per `mode`. Alphabetical mode uses `Intl.Collator` rather
 * than a bare `.sort()` — plain lexicographic comparison orders by raw
 * character code, which puts every uppercase letter before every
 * lowercase one (ASCII 'A'-'Z' are all below 'a'-'z'), producing results
 * like ["Banana", "apple"] where "apple" reads as coming "after" Banana
 * despite starting with an earlier letter. Intl.Collator compares by base
 * letter first, matching how a person actually alphabetizes.
 */
export function sortLines(lines: string[], mode: SortMode, options: SortOptions): string[] {
  const { caseSensitive, reverse } = options;
  let sorted: string[];

  switch (mode) {
    case 'alphabetical': {
      const collator = new Intl.Collator(undefined, { sensitivity: caseSensitive ? 'variant' : 'base', numeric: false });
      sorted = [...lines].sort(collator.compare);
      break;
    }
    case 'natural': {
      sorted = [...lines].sort((a, b) => naturalCompare(a, b, caseSensitive));
      break;
    }
    case 'length': {
      sorted = [...lines].sort((a, b) => a.length - b.length);
      break;
    }
    case 'random': {
      sorted = shuffle(lines);
      break;
    }
    default: {
      sorted = [...lines];
    }
  }

  return reverse ? sorted.reverse() : sorted;
}
