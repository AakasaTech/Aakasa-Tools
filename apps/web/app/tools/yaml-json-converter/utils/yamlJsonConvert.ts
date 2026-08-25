/**
 * Wraps js-yaml with this toolbox's error-handling conventions — no
 * hand-rolled YAML parsing (the spec is genuinely complex: multi-document
 * files, anchors/aliases, flow vs. block style, implicit scalar typing).
 */

import { dump, loadAll, YAMLException } from 'js-yaml';
import { parseJson } from '@/app/tools/json-formatter/utils/jsonFormat';

export interface YamlDumpOptions {
  indent: number;
  flowStyle: boolean;
}

export interface YamlToJsonResult {
  /** One entry per YAML document found — length 1 for an ordinary single-document file, more for a `---`-separated multi-document file. Never silently drops documents beyond the first. */
  data: unknown[];
  error?: string;
}

export interface JsonToYamlResult {
  data: string;
  error?: string;
}

function formatYamlError(err: unknown): string {
  if (err instanceof YAMLException) {
    const mark = err.mark;
    const reason = err.reason || err.message;
    // js-yaml's mark.line/column are 0-indexed; this tool reports them the
    // way an editor would (1-indexed), matching JSON Formatter's convention.
    return mark ? `Invalid YAML at line ${mark.line + 1}, column ${mark.column + 1}: ${reason}` : `Invalid YAML: ${reason}`;
  }
  return err instanceof Error ? `Invalid YAML: ${err.message}` : 'Invalid YAML.';
}

export function yamlToJson(yamlText: string): YamlToJsonResult {
  try {
    const documents = loadAll(yamlText);
    return { data: documents };
  } catch (err) {
    return { data: [], error: formatYamlError(err) };
  }
}

export function jsonToYaml(jsonText: string, options: YamlDumpOptions): JsonToYamlResult {
  const parsed = parseJson(jsonText);
  if (!parsed.success) {
    return {
      data: '',
      error: `Invalid JSON — line ${parsed.error.line}, column ${parsed.error.column}: ${parsed.error.message}`,
    };
  }

  try {
    const yamlText = dump(parsed.value, {
      indent: options.indent,
      // -1 = always block style (YAML's more common, more readable form);
      // 0 = flow style at every level, fully collapsed like JSON.
      flowLevel: options.flowStyle ? 0 : -1,
      // js-yaml folds long scalars onto multiple lines past 80 chars by
      // default (valid YAML, but it rewrites the string's on-page shape in
      // a way a user converting their own JSON wouldn't expect) — disabled
      // so output stays a predictable, literal transcription of the input.
      lineWidth: -1,
    });
    return { data: yamlText };
  } catch (err) {
    return { data: '', error: err instanceof Error ? `Could not convert to YAML: ${err.message}` : 'Could not convert to YAML.' };
  }
}

export function getByteSize(text: string): number {
  return new TextEncoder().encode(text).length;
}

export const SAMPLE_YAML = `version: "3.8"
services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    environment:
      - DEBUG=false
    depends_on:
      - api
  api:
    image: aakasa/api:latest
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
`;
