function isUpperChar(ch: string): boolean {
  return ch !== ch.toLowerCase() && ch === ch.toUpperCase();
}

function isLowerChar(ch: string): boolean {
  return ch !== ch.toUpperCase() && ch === ch.toLowerCase();
}

/**
 * Splits `input` into words, detecting boundaries from spaces, hyphens,
 * underscores, and dots AND from camelCase/PascalCase transitions within
 * a single run of letters — so this works equally well on "my variable
 * name", "my-variable_name", and "myVariableName" as input. Every case
 * style this tool offers is just a different way of rejoining this same
 * word list, so getting this right is what makes every conversion (and
 * every conversion FROM one programmatic case TO another) work.
 *
 * Acronym handling: a run of uppercase letters immediately followed by a
 * lowercase letter treats the run's LAST uppercase letter as the start of
 * the next word, not the end of the acronym — e.g. "XMLHttpRequest"
 * tokenizes as ["XML", "Http", "Request"], not ["X","M","L","Http",...],
 * because "HttpRequest" needs "Http" to start with a capital H, and
 * "XML" would otherwise wrongly swallow that H too.
 */
export function tokenizeWords(input: string): string[] {
  const normalized = input.replace(/[\s_\-.]+/g, ' ');
  const chars = [...normalized];
  const words: string[] = [];
  let current = '';

  function pushCurrent() {
    if (current) words.push(current);
    current = '';
  }

  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i]!;

    if (ch === ' ') {
      pushCurrent();
      continue;
    }

    if (current.length === 0) {
      current += ch;
      continue;
    }

    const prevCh = current[current.length - 1]!;
    const prevIsUpper = isUpperChar(prevCh);
    const chIsUpper = isUpperChar(ch);

    if (isLowerChar(prevCh) && chIsUpper) {
      // lowercase -> uppercase: a new word starts here (e.g. "my|Variable")
      pushCurrent();
      current = ch;
    } else if (prevIsUpper && chIsUpper) {
      // Two uppercase letters in a row — only a word boundary if this one
      // is the start of a new capitalized word (i.e. followed by a
      // lowercase letter), not just another letter of an acronym.
      const nextCh = chars[i + 1];
      const nextIsLower = nextCh !== undefined && isLowerChar(nextCh);
      if (nextIsLower) {
        pushCurrent();
        current = ch;
      } else {
        current += ch;
      }
    } else {
      current += ch;
    }
  }
  pushCurrent();

  return words;
}

function capitalize(word: string): string {
  return word.length === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function toUpperCase(words: string[]): string {
  return words.join(' ').toUpperCase();
}

export function toLowerCase(words: string[]): string {
  return words.join(' ').toLowerCase();
}

export function toTitleCase(words: string[]): string {
  return words.map(capitalize).join(' ');
}

export function toSentenceCase(words: string[]): string {
  const joined = words.join(' ').toLowerCase();
  return joined.length === 0 ? joined : joined.charAt(0).toUpperCase() + joined.slice(1);
}

export function toCamelCase(words: string[]): string {
  return words.map((word, index) => (index === 0 ? word.toLowerCase() : capitalize(word))).join('');
}

export function toPascalCase(words: string[]): string {
  return words.map(capitalize).join('');
}

export function toSnakeCase(words: string[]): string {
  return words.map((word) => word.toLowerCase()).join('_');
}

export function toScreamingSnakeCase(words: string[]): string {
  return words.map((word) => word.toUpperCase()).join('_');
}

export function toKebabCase(words: string[]): string {
  return words.map((word) => word.toLowerCase()).join('-');
}

export function toTrainCase(words: string[]): string {
  return words.map(capitalize).join('-');
}

export function toDotCase(words: string[]): string {
  return words.map((word) => word.toLowerCase()).join('.');
}

export interface CaseStyleDefinition {
  id: string;
  label: string;
  convert: (words: string[]) => string;
}

export const CASE_STYLES: CaseStyleDefinition[] = [
  { id: 'upper', label: 'UPPERCASE', convert: toUpperCase },
  { id: 'lower', label: 'lowercase', convert: toLowerCase },
  { id: 'title', label: 'Title Case', convert: toTitleCase },
  { id: 'sentence', label: 'Sentence case', convert: toSentenceCase },
  { id: 'camel', label: 'camelCase', convert: toCamelCase },
  { id: 'pascal', label: 'PascalCase', convert: toPascalCase },
  { id: 'snake', label: 'snake_case', convert: toSnakeCase },
  { id: 'screamingSnake', label: 'SCREAMING_SNAKE_CASE', convert: toScreamingSnakeCase },
  { id: 'kebab', label: 'kebab-case', convert: toKebabCase },
  { id: 'train', label: 'Train-Case', convert: toTrainCase },
  { id: 'dot', label: 'dot.case', convert: toDotCase },
];
