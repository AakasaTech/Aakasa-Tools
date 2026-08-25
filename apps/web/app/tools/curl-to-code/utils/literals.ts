/**
 * Language-specific literal formatting shared by the generators. Pulled out
 * here rather than duplicated per-file since three of the four targets
 * (Python, PHP, and — for JSON bodies — JS itself) each need their own
 * pretty-printer for turning a parsed JSON value into that language's
 * native object/dict/array literal syntax, and PHP additionally needs
 * single-quoted string escaping everywhere (not just for JSON bodies) since
 * PHP double-quoted strings interpolate a literal `$name` in a header value
 * or body as a variable reference — the same class of bug `parseCurl.ts`
 * had to work around in the input, this time on the output side.
 */

function indent(text: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => pad + line)
    .join('\n');
}

/** Escapes a string as a PHP single-quoted literal — only `\` and `'` need
 * escaping, and single-quoted PHP strings never interpolate `$variables`. */
export function phpString(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** Renders a parsed JSON value as a PHP array literal (`=>` syntax), for
 * embedding a JSON request body as native PHP data rather than a raw
 * string that gets json_encode()'d at the last moment. */
export function phpRepr(value: unknown, depth = 0): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return phpString(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map((item) => `${' '.repeat((depth + 1) * 4)}${phpRepr(item, depth + 1)}`);
    return `[\n${items.join(',\n')},\n${' '.repeat(depth * 4)}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return '[]';
  const items = entries.map(([key, val]) => `${' '.repeat((depth + 1) * 4)}${phpString(key)} => ${phpRepr(val, depth + 1)}`);
  return `[\n${items.join(',\n')},\n${' '.repeat(depth * 4)}]`;
}

/** Renders a parsed JSON value as a Python literal (dict/list/True/False/
 * None), for the same reason as phpRepr. */
export function pythonRepr(value: unknown, depth = 0): string {
  if (value === null) return 'None';
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return pythonString(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map((item) => `${' '.repeat((depth + 1) * 4)}${pythonRepr(item, depth + 1)}`);
    return `[\n${items.join(',\n')},\n${' '.repeat(depth * 4)}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return '{}';
  const items = entries.map(([key, val]) => `${' '.repeat((depth + 1) * 4)}${pythonString(key)}: ${pythonRepr(val, depth + 1)}`);
  return `{\n${items.join(',\n')},\n${' '.repeat(depth * 4)}}`;
}

/** Python single-quoted string literal. Python's escaping rules for `\`,
 * `'`, `\n`, `\t` etc. match JSON's closely enough that reusing
 * JSON.stringify would mostly work, but it always produces double quotes
 * and doesn't give control over quote style — simpler and safer to escape
 * directly for the single-quoted form Python style guides prefer. */
export function pythonString(value: string): string {
  const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
  return `'${escaped}'`;
}

export { indent };
